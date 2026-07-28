/* ==========================================================================
   ExpenseTracker Pro — recurring.js
   Checks for due recurring transactions and generates them.
   ========================================================================== */

(function () {
  const rules = DB.getRecurring();
  if (!rules || rules.length === 0) return;

  const today = Helper.todayISO();
  let changed = false;

  rules.forEach(rule => {
    let ruleChanged = false;
    
    // Process while the nextDate is today or in the past
    while (rule.nextDate && rule.nextDate <= today) {
      // 1. Generate the transaction
      DB.addTransaction({
        date: rule.nextDate,
        time: '08:00', // Auto-generated at 8 AM
        type: rule.type,
        category: rule.category,
        amount: rule.amount,
        paymentMethod: rule.paymentMethod,
        note: (rule.note ? rule.note + ' ' : '') + '(Auto-generated)'
      });
      
      // 2. Advance the nextDate based on frequency
      const d = new Date(rule.nextDate + 'T00:00:00');
      if (rule.frequency === 'daily') {
        d.setDate(d.getDate() + 1);
      } else if (rule.frequency === 'weekly') {
        d.setDate(d.getDate() + 7);
      } else if (rule.frequency === 'monthly') {
        d.setMonth(d.getMonth() + 1);
      } else if (rule.frequency === 'yearly') {
        d.setFullYear(d.getFullYear() + 1);
      } else {
        // Fallback to prevent infinite loop if frequency is missing or invalid
        d.setMonth(d.getMonth() + 1); 
      }
      
      rule.nextDate = d.toISOString().slice(0, 10);
      ruleChanged = true;
      changed = true;
    }
    
    if (ruleChanged) {
      DB.updateRecurring(rule.id, { nextDate: rule.nextDate });
    }
  });

  if (changed) {
    // We generated some transactions, so we alert the UI to re-render
    window.dispatchEvent(new Event('etp:data-changed'));
    // Show a subtle toast if we are on a page where UI is loaded
    if (typeof Helper.toast === 'function') {
      setTimeout(() => Helper.toast('Recurring transactions were auto-generated.', 'primary'), 1000);
    }
  }
})();
