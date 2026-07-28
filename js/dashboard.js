/* ==========================================================================
   ExpenseTracker Pro — dashboard.js  (drives pages/dashboard.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let trendChart, pieChart;

  function computeTotals(transactions) {
    let income = 0, expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += Number(t.amount);
      else expense += Number(t.amount);
    });
    return { income, expense, balance: income - expense, savings: Math.max(income - expense, 0) };
  }

  function renderBudget(monthTotals) {
    const budgetContainer = document.getElementById('budgetCardContainer');
    if (!budgetContainer) return;
    
    const budget = DB.getSettings().monthlyBudget || 0;
    if (budget <= 0) {
      budgetContainer.classList.add('d-none');
      return;
    }
    
    budgetContainer.classList.remove('d-none');
    
    const spent = monthTotals.expense;
    const percent = Math.min(Math.round((spent / budget) * 100), 100);
    const remaining = budget - spent;
    
    document.getElementById('budgetSpent').textContent = Helper.formatAmount(spent);
    document.getElementById('budgetTotal').textContent = Helper.formatAmount(budget);
    document.getElementById('budgetPercentage').textContent = percent + '%';
    
    const remainingText = remaining >= 0 ? `${Helper.formatAmount(remaining)} remaining` : `${Helper.formatAmount(Math.abs(remaining))} over budget`;
    document.getElementById('budgetRemainingText').textContent = remainingText;
    
    const progressBar = document.getElementById('budgetProgressBar');
    progressBar.style.width = percent + '%';
    
    if (percent >= 90) {
      progressBar.style.backgroundColor = 'var(--color-danger)';
      document.getElementById('budgetPercentage').style.color = 'var(--color-danger)';
    } else if (percent >= 75) {
      progressBar.style.backgroundColor = 'var(--color-warning)';
      document.getElementById('budgetPercentage').style.color = 'var(--color-warning)';
    } else {
      progressBar.style.backgroundColor = 'var(--color-primary)';
      document.getElementById('budgetPercentage').style.color = 'var(--color-primary)';
    }
  }

  function renderStats() {
    const all = DB.getTransactions();
    const monthly = Helper.filterByPeriod(all, 'month');
    const totals = computeTotals(all);
    const monthTotals = computeTotals(monthly);

    document.getElementById('statBalance').textContent = Helper.formatAmount(totals.balance);
    document.getElementById('statIncome').textContent = Helper.formatAmount(monthTotals.income);
    document.getElementById('statExpense').textContent = Helper.formatAmount(monthTotals.expense);
    document.getElementById('statSavings').textContent = Helper.formatAmount(totals.savings);

    const rate = monthTotals.income > 0 ? Math.round((monthTotals.income - monthTotals.expense) / monthTotals.income * 100) : 0;
    const savingsDelta = document.getElementById('savingsDelta');
    if (savingsDelta) {
      savingsDelta.textContent = monthTotals.income > 0 ? `${rate}% of this month's income saved` : 'Add income to see savings rate';
    }
    
    renderBudget(monthTotals);
  }

  function last6MonthsLabels() {
    const labels = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-IN', { month: 'short' }) });
    }
    return labels;
  }

  function renderTrendChart() {
    const all = DB.getTransactions();
    const months = last6MonthsLabels();
    const incomeData = [], expenseData = [];

    months.forEach(({ key }) => {
      const [y, m] = key.split('-').map(Number);
      let inc = 0, exp = 0;
      all.forEach((t) => {
        const d = new Date(t.date + 'T00:00:00');
        if (d.getFullYear() === y && d.getMonth() === m) {
          if (t.type === 'income') inc += Number(t.amount); else exp += Number(t.amount);
        }
      });
      incomeData.push(inc);
      expenseData.push(exp);
    });

    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months.map((m) => m.label),
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#22C55E',
            backgroundColor: 'rgba(34,197,94,0.1)',
            tension: 0.35,
            fill: true,
            pointRadius: 3,
          },
          {
            label: 'Expense',
            data: expenseData,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            tension: 0.35,
            fill: true,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.15)' } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  function renderPieChart() {
    const monthly = Helper.filterByPeriod(DB.getTransactions(), 'month').filter((t) => t.type === 'expense');
    const byCategory = {};
    monthly.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
    });
    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;
    if (pieChart) pieChart.destroy();

    const emptyMsg = document.getElementById('pieEmptyState');
    if (entries.length === 0) {
      ctx.style.display = 'none';
      if (emptyMsg) emptyMsg.style.display = 'block';
      return;
    }
    ctx.style.display = 'block';
    if (emptyMsg) emptyMsg.style.display = 'none';

    const labels = entries.map(([id]) => DB.findCategory('expense', id).name);
    const colors = entries.map(([id]) => DB.findCategory('expense', id).color);
    const data = entries.map(([, v]) => v);

    pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } } },
      },
    });
  }

  function renderRecent() {
    const list = document.getElementById('recentList');
    if (!list) return;
    const recent = [...DB.getTransactions()].sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))).slice(0, 10);

    if (recent.length === 0) {
      list.innerHTML = `<div class="empty-state"><i class="bi bi-receipt-cutoff"></i><h3>No transactions yet</h3><p>Add your first income or expense to see it here.</p></div>`;
      return;
    }

    list.innerHTML = recent.map((t) => {
      const cat = DB.findCategory(t.type === 'income' ? 'income' : 'expense', t.category);
      const sign = t.type === 'income' ? '+' : '−';
      const cls = t.type === 'income' ? 'amount-in' : 'amount-out';
      return `
        <div class="d-flex align-items-center justify-content-between py-2" style="border-bottom:1px solid var(--color-border)">
          <div class="d-flex align-items-center gap-3">
            <div class="category-swatch" style="background:${cat.color};width:36px;height:36px;font-size:.9rem">
              <i class="bi ${cat.icon}"></i>
            </div>
            <div>
              <div style="font-weight:500">${Helper.escapeHTML(cat.name)}</div>
              <div class="text-muted" style="font-size:.78rem">${Helper.formatDateShort(t.date)}${t.note ? ' • ' + Helper.escapeHTML(t.note) : ''}</div>
            </div>
          </div>
          <div class="${cls} mono">${sign} ${Helper.formatAmount(t.amount)}</div>
        </div>`;
    }).join('');
  }

  function renderAll() {
    renderStats();
    renderTrendChart();
    renderPieChart();
    renderRecent();
  }

  renderAll();
  window.addEventListener('etp:data-changed', renderAll);
  window.addEventListener('etp:theme-changed', renderAll);
});
