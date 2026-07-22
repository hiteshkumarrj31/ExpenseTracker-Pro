/* ==========================================================================
   ExpenseTracker Pro — report.js  (drives pages/reports.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const periodButtons = document.querySelectorAll('[data-period]');
  const fromInput = document.getElementById('reportFrom');
  const toInput = document.getElementById('reportTo');
  const tbody = document.getElementById('reportTableBody');
  const emptyState = document.getElementById('reportEmptyState');
  let currentList = [];

  function setActivePeriod(period) {
    periodButtons.forEach((b) => b.classList.toggle('active', b.dataset.period === period));
  }

  function computeRange(period) {
    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    if (period === 'today') return { from: iso(today), to: iso(today) };
    if (period === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(today.setDate(diff));
      return { from: iso(start), to: iso(new Date()) };
    }
    if (period === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: iso(start), to: iso(new Date()) };
    }
    if (period === 'year') {
      const start = new Date(today.getFullYear(), 0, 1);
      return { from: iso(start), to: iso(new Date()) };
    }
    return { from: '', to: '' };
  }

  function generate(period) {
    let from = fromInput.value, to = toInput.value;
    if (period && period !== 'custom') {
      const range = computeRange(period);
      from = range.from; to = range.to;
      fromInput.value = from;
      toInput.value = to;
    }
    const all = DB.getTransactions();
    currentList = all.filter((t) => Helper.inRange(t.date, from, to))
      .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
    render();
  }

  function render() {
    const income = currentList.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = currentList.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    document.getElementById('reportIncome').textContent = Helper.formatAmount(income);
    document.getElementById('reportExpense').textContent = Helper.formatAmount(expense);
    document.getElementById('reportNet').textContent = Helper.formatAmount(income - expense);
    document.getElementById('reportCount').textContent = currentList.length;

    const rangeLabel = document.getElementById('reportRangeLabel');
    if (rangeLabel) {
      rangeLabel.textContent = fromInput.value && toInput.value
        ? `${Helper.formatDate(fromInput.value)} — ${Helper.formatDate(toInput.value)}`
        : 'All time';
    }

    if (currentList.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = currentList.map((t) => {
      const cat = DB.findCategory(t.type, t.category);
      const sign = t.type === 'income' ? '+' : '−';
      const cls = t.type === 'income' ? 'amount-in' : 'amount-out';
      return `
        <tr>
          <td data-label="Date">${Helper.formatDate(t.date)}</td>
          <td data-label="Type" class="text-capitalize">${t.type}</td>
          <td data-label="Category">${Helper.escapeHTML(cat.name)}</td>
          <td data-label="Note">${Helper.escapeHTML(t.note) || '—'}</td>
          <td data-label="Amount" class="${cls} mono">${sign} ${Helper.formatAmount(t.amount)}</td>
        </tr>`;
    }).join('');
  }

  periodButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActivePeriod(btn.dataset.period);
      generate(btn.dataset.period);
    });
  });

  [fromInput, toInput].forEach((input) => {
    input?.addEventListener('change', () => { setActivePeriod('custom'); generate('custom'); });
  });

  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    if (currentList.length === 0) { Helper.toast('No transactions to export', 'danger'); return; }
    Exporter.downloadCSV(currentList, `report-${fromInput.value || 'all'}-to-${toInput.value || 'now'}.csv`);
    Helper.toast('CSV downloaded', 'success');
  });

  document.getElementById('printBtn')?.addEventListener('click', () => Exporter.printReport());

  // Default: this month
  setActivePeriod('month');
  generate('month');
});
