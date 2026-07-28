/* ==========================================================================
   ExpenseTracker Pro — app.js
   Small global bootstrap: footer year.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.js-year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});


// Intercept clicks on links without .html for Capacitor / Local File protocol
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href && !href.startsWith('http') && !href.startsWith('#') && !href.endsWith('/') && !href.endsWith('.html')) {
    const isCapacitorOrLocal = location.protocol === 'file:' || (window.Capacitor && window.Capacitor.isNative);
    if (isCapacitorOrLocal) {
      e.preventDefault();
      window.location.href = href + '.html';
    }
  }
});

