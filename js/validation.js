/* ==========================================================================
   ExpenseTracker Pro — validation.js
   Lightweight validation rules used by the transaction form.
   ========================================================================== */

const Validate = (function () {
  function transaction({ date, type, category, amount }) {
    const errors = {};
    if (!date) errors.date = 'Date is required';
    if (!type) errors.type = 'Type is required';
    if (!category) errors.category = 'Category is required';
    const num = Number(amount);
    if (amount === '' || amount === null || amount === undefined || isNaN(num)) {
      errors.amount = 'Amount is required';
    } else if (num <= 0) {
      errors.amount = 'Amount must be positive';
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function applyErrors(form, errors) {
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    Object.keys(errors).forEach((field) => {
      const el = form.querySelector(`[name="${field}"]`);
      if (el) {
        el.classList.add('is-invalid');
        const feedback = el.parentElement.querySelector('.invalid-feedback');
        if (feedback) feedback.textContent = errors[field];
      }
    });
  }

  return { transaction, applyErrors };
})();
