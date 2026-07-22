/* ==========================================================================
   ExpenseTracker Pro — theme.js
   Applies theme (light/dark/auto) and wires shared shell interactions
   (sidebar toggle, active nav highlight, page title).
   ========================================================================== */

const Theme = (function () {
  function resolveTheme(pref) {
    if (pref === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return pref;
  }

  function applyChartDefaults() {
    if (!window.Chart) return;
    const styles = getComputedStyle(document.documentElement);
    const text = styles.getPropertyValue('--color-text').trim();
    const muted = styles.getPropertyValue('--color-text-muted').trim();
    const surface = styles.getPropertyValue('--color-surface').trim();
    const border = styles.getPropertyValue('--color-border').trim();

    Chart.defaults.color = muted;
    Chart.defaults.borderColor = border;
    Chart.defaults.plugins.legend.labels.color = muted;
    Chart.defaults.plugins.tooltip.backgroundColor = surface;
    Chart.defaults.plugins.tooltip.titleColor = text;
    Chart.defaults.plugins.tooltip.bodyColor = text;
    Chart.defaults.plugins.tooltip.borderColor = border;
    Chart.defaults.plugins.tooltip.borderWidth = 1;
  }

  function apply() {
    const settings = DB.getSettings();
    const resolved = resolveTheme(settings.theme || 'light');
    document.documentElement.setAttribute('data-theme', resolved);
    applyChartDefaults();
    window.dispatchEvent(new CustomEvent('etp:theme-changed', { detail: { theme: resolved, preference: settings.theme || 'light' } }));
  }

  function set(pref) {
    DB.updateSetting('theme', pref);
    apply();
  }

  function toggleQuick() {
    const settings = DB.getSettings();
    const current = resolveTheme(settings.theme || 'light');
    set(current === 'dark' ? 'light' : 'dark');
  }

  // Watch system theme changes when in auto mode
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const settings = DB.getSettings();
      if (settings.theme === 'auto') apply();
    });
  }

  apply();

  return { apply, set, toggleQuick, resolveTheme };
})();

/* ---------------------------- Shell wiring ---------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const menuToggle = document.querySelector('.menu-toggle');

  function openSidebar() {
    sidebar?.classList.add('open');
    backdrop?.classList.add('open');
  }
  function closeSidebar() {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('open');
  }
  menuToggle?.addEventListener('click', () => {
    sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  backdrop?.addEventListener('click', closeSidebar);

  // Highlight active nav link based on current page filename
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.endsWith(current)) link.classList.add('active');
  });

  // Quick dark-mode toggle button (topbar)
  document.getElementById('quickThemeToggle')?.addEventListener('click', Theme.toggleQuick);
});
