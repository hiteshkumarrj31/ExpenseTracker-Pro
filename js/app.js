/* ==========================================================================
   ExpenseTracker Pro — app.js
   Small global bootstrap: footer year.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.js-year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});
