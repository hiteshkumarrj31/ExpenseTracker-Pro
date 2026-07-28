/* ==========================================================================
   ExpenseTracker Pro — auth.js
   Handles PIN lock screen overlay if a PIN is set.
   ========================================================================== */

(function () {
  // If we are on a page that isn't the landing page, and a PIN is set
  const settings = DB.getSettings();
  if (!settings.pinCode) return; // No PIN set

  // If already unlocked in this session
  if (sessionStorage.getItem('etp_unlocked') === '1') return;

  // Create a full-screen lock overlay
  const overlay = document.createElement('div');
  overlay.id = 'pinLockOverlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: var(--color-bg, #f4f6f8); z-index: 99999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  `;
  
  overlay.innerHTML = `
    <div style="background: var(--color-surface, #fff); padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 320px; width: 90%;">
      <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(37, 99, 235, 0.1); color: #2563EB; font-size: 1.8rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
        <i class="bi bi-lock-fill"></i>
      </div>
      <h2 style="margin-bottom: 8px; font-weight: 600;">App Locked</h2>
      <p style="color: var(--color-text-muted, #64748b); font-size: 0.9rem; margin-bottom: 24px;">Enter your 4-digit PIN to access your data.</p>
      
      <input type="password" id="pinLockInput" maxlength="4" pattern="\\d*" placeholder="••••" style="width: 100%; text-align: center; font-size: 1.5rem; letter-spacing: 0.5em; padding: 12px; border: 2px solid var(--color-border, #e2e8f0); border-radius: 8px; margin-bottom: 16px; font-family: monospace;">
      
      <button id="pinLockBtn" style="width: 100%; padding: 12px; background: #2563EB; color: #fff; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">Unlock</button>
      <div id="pinLockError" style="color: #ef4444; font-size: 0.85rem; margin-top: 12px; display: none;">Incorrect PIN. Try again.</div>
    </div>
  `;
  
  // Inject into DOM immediately (since script is at end of body)
  document.body.appendChild(overlay);

  const input = document.getElementById('pinLockInput');
  const btn = document.getElementById('pinLockBtn');
  const errorMsg = document.getElementById('pinLockError');

  function attemptUnlock() {
    if (input.value === settings.pinCode) {
      sessionStorage.setItem('etp_unlocked', '1');
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 300ms ease';
      setTimeout(() => overlay.remove(), 300);
    } else {
      errorMsg.style.display = 'block';
      input.value = '';
      input.focus();
      
      // Shake effect
      const box = overlay.firstElementChild;
      box.style.transform = 'translateX(-10px)';
      setTimeout(() => box.style.transform = 'translateX(10px)', 100);
      setTimeout(() => box.style.transform = 'translateX(-10px)', 200);
      setTimeout(() => box.style.transform = 'translateX(10px)', 300);
      setTimeout(() => box.style.transform = 'translateX(0)', 400);
    }
  }

  btn.addEventListener('click', attemptUnlock);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptUnlock();
  });
  
  // Auto-focus on mount
  setTimeout(() => input.focus(), 100);
})();
