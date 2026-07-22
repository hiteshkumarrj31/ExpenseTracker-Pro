/* ==========================================================================
   ExpenseTracker Pro — transaction.js  (drives pages/transactions.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('txnTableBody');
  const emptyState = document.getElementById('txnEmptyState');
  const form = document.getElementById('txnForm');
  const modalEl = document.getElementById('txnModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const modalTitle = document.getElementById('txnModalTitle');
  const typeSelect = form?.elements['type'];
  const categorySelect = form?.elements['category'];

  const searchInput = document.getElementById('txnSearch');
  const filterType = document.getElementById('filterType');
  const filterPeriod = document.getElementById('filterPeriod');
  const sortBy = document.getElementById('sortBy');
  const resultCount = document.getElementById('resultCount');

  let editingId = null;

  // ---------------- Category dropdown population ----------------
  function populateCategoryOptions() {
    const type = typeSelect.value === 'income' ? 'income' : 'expense';
    const cats = DB.getCategories()[type] || [];
    categorySelect.innerHTML = cats.map((c) => `<option value="${c.id}">${Helper.escapeHTML(c.name)}</option>`).join('');
  }
  typeSelect?.addEventListener('change', populateCategoryOptions);

  // ---------------- Filter dropdown (category filter, built from both types) ----------------
  function populateFilterCategory() {
    const filterCat = document.getElementById('filterCategory');
    if (!filterCat) return;
    const cats = DB.getCategories();
    const all = [...cats.income, ...cats.expense];
    filterCat.innerHTML = '<option value="">All categories</option>' + all.map((c) => `<option value="${c.id}">${Helper.escapeHTML(c.name)}</option>`).join('');
  }

  // ---------------- Open modal for add/edit ----------------
  function openModal(txn = null) {
    form.reset();
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    if (txn) {
      editingId = txn.id;
      modalTitle.textContent = 'Edit Transaction';
      form.elements['date'].value = txn.date;
      form.elements['time'].value = txn.time || Helper.nowTime();
      form.elements['type'].value = txn.type;
      populateCategoryOptions();
      form.elements['category'].value = txn.category;
      form.elements['amount'].value = txn.amount;
      form.elements['note'].value = txn.note || '';
      form.elements['paymentMethod'].value = txn.paymentMethod || 'Cash';
    } else {
      editingId = null;
      modalTitle.textContent = 'Add Transaction';
      form.elements['date'].value = Helper.todayISO();
      form.elements['time'].value = Helper.nowTime();
      form.elements['type'].value = 'expense';
      populateCategoryOptions();
    }
    modal?.show();
  }

  document.getElementById('addTxnBtn')?.addEventListener('click', () => openModal());
  document.getElementById('addIncomeQuick')?.addEventListener('click', () => { openModal(); form.elements['type'].value = 'income'; populateCategoryOptions(); });
  document.getElementById('addExpenseQuick')?.addEventListener('click', () => { openModal(); form.elements['type'].value = 'expense'; populateCategoryOptions(); });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      date: form.elements['date'].value,
      time: form.elements['time'].value,
      type: form.elements['type'].value,
      category: form.elements['category'].value,
      amount: form.elements['amount'].value,
      note: form.elements['note'].value.trim(),
      paymentMethod: form.elements['paymentMethod'].value,
    };
    const { valid, errors } = Validate.transaction(data);
    if (!valid) {
      Validate.applyErrors(form, errors);
      return;
    }
    if (editingId) {
      DB.updateTransaction(editingId, data);
      Helper.toast('Transaction updated', 'success');
    } else {
      DB.addTransaction(data);
      Helper.toast('Transaction added', 'success');
    }
    modal?.hide();
    renderTable();
    window.dispatchEvent(new Event('etp:data-changed'));
  });

  // ---------------- Render table ----------------
  function getFiltered() {
    let list = DB.getTransactions();

    const q = (searchInput?.value || '').trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const cat = DB.findCategory(t.type, t.category);
        return (
          t.note?.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q) ||
          String(t.amount).includes(q) ||
          t.date.includes(q) ||
          t.type.includes(q)
        );
      });
    }

    const type = filterType?.value;
    if (type) list = list.filter((t) => t.type === type);

    const catFilter = document.getElementById('filterCategory')?.value;
    if (catFilter) list = list.filter((t) => t.category === catFilter);

    const period = filterPeriod?.value;
    if (period && period !== 'all') list = Helper.filterByPeriod(list, period);

    const sort = sortBy?.value || 'latest';
    list = [...list].sort((a, b) => {
      if (sort === 'latest') return new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'));
      if (sort === 'oldest') return new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00'));
      if (sort === 'highest') return b.amount - a.amount;
      if (sort === 'lowest') return a.amount - b.amount;
      if (sort === 'az') return DB.findCategory(a.type, a.category).name.localeCompare(DB.findCategory(b.type, b.category).name);
      return 0;
    });

    return list;
  }

  function renderTable() {
    const list = getFiltered();
    if (resultCount) resultCount.textContent = `${list.length} transaction${list.length === 1 ? '' : 's'}`;

    if (list.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = list.map((t) => {
      const cat = DB.findCategory(t.type, t.category);
      const sign = t.type === 'income' ? '+' : '−';
      const cls = t.type === 'income' ? 'amount-in' : 'amount-out';
      return `
        <tr>
          <td data-label="Date">${Helper.formatDate(t.date)}<div class="text-faint" style="font-size:.72rem">${t.time || ''}</div></td>
          <td data-label="Category">
            <span class="badge-cat" style="background:${cat.color}22;color:${cat.color}">
              <i class="bi ${cat.icon}"></i> ${Helper.escapeHTML(cat.name)}
            </span>
          </td>
          <td data-label="Note">${Helper.escapeHTML(t.note) || '<span class="text-faint">—</span>'}</td>
          <td data-label="Method">${Helper.escapeHTML(t.paymentMethod)}</td>
          <td data-label="Amount" class="${cls} mono">${sign} ${Helper.formatAmount(t.amount)}</td>
          <td data-label="Actions" class="text-end">
            <div class="row-actions d-inline-flex gap-1">
              <button class="edit-btn" data-id="${t.id}" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="del-btn" data-id="${t.id}" title="Delete"><i class="bi bi-trash3"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const txn = DB.getTransactions().find((t) => t.id === btn.dataset.id);
        if (txn) openModal(txn);
      });
    });
    tbody.querySelectorAll('.del-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await Helper.confirmDialog({ title: 'Delete transaction?', message: 'This action cannot be undone.', confirmText: 'Delete' });
        if (!ok) return;
        DB.deleteTransaction(btn.dataset.id);
        Helper.toast('Transaction deleted', 'success');
        renderTable();
        window.dispatchEvent(new Event('etp:data-changed'));
      });
    });
  }

  const debouncedRender = Helper.debounce(renderTable, 200);
  searchInput?.addEventListener('input', debouncedRender);
  filterType?.addEventListener('change', renderTable);
  document.getElementById('filterCategory')?.addEventListener('change', renderTable);
  filterPeriod?.addEventListener('change', renderTable);
  sortBy?.addEventListener('change', renderTable);

  populateFilterCategory();
  populateCategoryOptions();
  renderTable();
});
