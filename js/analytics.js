/* ==========================================================================
   ExpenseTracker Pro — analytics.js  (drives pages/analytics.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let barChart, lineChart, doughnutChart;
  const periodSelect = document.getElementById('analyticsPeriod');

  function getData() {
    const period = periodSelect?.value || 'month';
    return Helper.filterByPeriod(DB.getTransactions(), period === 'all' ? 'all' : period);
  }

  function renderStats(list) {
    const expenses = list.filter((t) => t.type === 'expense');
    const incomes = list.filter((t) => t.type === 'income');

    const highest = expenses.reduce((max, t) => (t.amount > (max?.amount || 0) ? t : max), null);
    const lowest = expenses.reduce((min, t) => (min === null || t.amount < min.amount ? t : min), null);
    const avg = expenses.length ? expenses.reduce((s, t) => s + Number(t.amount), 0) / expenses.length : 0;
    const totalIncome = incomes.reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);

    const byCat = {};
    expenses.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount); });
    const topCatEntry = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const topCat = topCatEntry ? DB.findCategory('expense', topCatEntry[0]) : null;

    const days = new Set(expenses.map((t) => t.date)).size || 1;
    const dailyAvg = totalExpense / days;

    setText('statHighest', highest ? Helper.formatAmount(highest.amount) : '—');
    setText('statLowest', lowest ? Helper.formatAmount(lowest.amount) : '—');
    setText('statAvg', Helper.formatAmount(avg));
    setText('statSaving', Helper.formatAmount(totalIncome - totalExpense));
    setText('statTopCategory', topCat ? topCat.name : '—');
    setText('statDaily', Helper.formatAmount(dailyAvg));
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function renderBarChart(list) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    const byCat = {};
    list.filter((t) => t.type === 'expense').forEach((t) => {
      byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
    });
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(([id]) => DB.findCategory('expense', id).name),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([id]) => DB.findCategory('expense', id).color),
          borderRadius: 6,
          maxBarThickness: 38,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.15)' } }, x: { grid: { display: false } } },
      },
    });
  }

  function renderLineChart(list) {
    const ctx = document.getElementById('lineChart');
    if (!ctx) return;
    const byDate = {};
    list.forEach((t) => {
      byDate[t.date] = byDate[t.date] || { income: 0, expense: 0 };
      byDate[t.date][t.type] += Number(t.amount);
    });
    const dates = Object.keys(byDate).sort();
    if (lineChart) lineChart.destroy();
    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map((d) => Helper.formatDateShort(d)),
        datasets: [
          { label: 'Income', data: dates.map((d) => byDate[d].income), borderColor: '#22C55E', tension: 0.3, pointRadius: 2 },
          { label: 'Expense', data: dates.map((d) => byDate[d].expense), borderColor: '#EF4444', tension: 0.3, pointRadius: 2 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.15)' } }, x: { grid: { display: false } } },
      },
    });
  }

  function renderDoughnutChart(list) {
    const ctx = document.getElementById('doughnutChart');
    if (!ctx) return;
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    if (doughnutChart) doughnutChart.destroy();
    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [{ data: [income, expense], backgroundColor: ['#22C55E', '#EF4444'], borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } },
      },
    });
  }

  function renderAll() {
    const list = getData();
    renderStats(list);
    renderBarChart(list);
    renderLineChart(list);
    renderDoughnutChart(list);
  }

  periodSelect?.addEventListener('change', renderAll);
  window.addEventListener('etp:theme-changed', renderAll);
  renderAll();
});
