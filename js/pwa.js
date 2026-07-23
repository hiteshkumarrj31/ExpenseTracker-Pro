/* ==========================================================================
   ExpenseTracker Pro — pwa.js
   Registers the service worker with the correct scope regardless of
   whether the current page is at the site root or inside /pages/, and
   wires an "Install App" button when the browser offers one.
   ========================================================================== */

(function () {
  if (!('serviceWorker' in navigator)) return;

  // Figure out how deep we are (root vs /pages/*) so sw.js and its scope
  // resolve correctly no matter which page registers it.
  const inPagesDir = location.pathname.includes('/pages/');
  const swUrl = inPagesDir ? '../sw.js' : './sw.js';
  const scope = inPagesDir ? '../' : './';

  window.addEventListener('load', () => {
    // Service workers require http(s) — silently skip on file:// so local
    // testing without a server doesn't throw console errors.
    if (location.protocol === 'file:') return;
    navigator.serviceWorker.register(swUrl, { scope }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });

  // ---------------- Install prompt ----------------
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
  });

  function showInstallButton() {
    if (document.getElementById('installAppBtn')) return;
    const actions = document.querySelector('.topbar-actions');
    if (!actions) return;
    const btn = document.createElement('button');
    btn.id = 'installAppBtn';
    btn.className = 'btn btn-light-soft d-flex align-items-center gap-1';
    btn.innerHTML = '<i class="bi bi-download"></i> <span class="d-none d-sm-inline">Install App</span>';
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      hideInstallButton();
    });
    actions.prepend(btn);
  }

  function hideInstallButton() {
    document.getElementById('installAppBtn')?.remove();
  }
})();
