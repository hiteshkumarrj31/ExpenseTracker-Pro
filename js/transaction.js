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
      currentReceipt = txn.receipt || null;
      if (currentReceipt) {
        document.getElementById('receiptPreview').src = currentReceipt;
        document.getElementById('receiptPreviewContainer')?.classList.remove('d-none');
      } else {
        document.getElementById('receiptPreviewContainer')?.classList.add('d-none');
        if (form.elements['receipt']) form.elements['receipt'].value = '';
      }
    } else {
      editingId = null;
      modalTitle.textContent = 'Add Transaction';
      form.elements['date'].value = Helper.todayISO();
      form.elements['time'].value = Helper.nowTime();
      form.elements['type'].value = 'expense';
      populateCategoryOptions();
      currentReceipt = null;
      document.getElementById('receiptPreviewContainer')?.classList.add('d-none');
      if (form.elements['receipt']) form.elements['receipt'].value = '';
    }
    modal?.show();
  }

  let currentReceipt = null;
  const receiptInput = form?.elements['receipt'];
  const receiptPreviewContainer = document.getElementById('receiptPreviewContainer');
  const receiptPreview = document.getElementById('receiptPreview');
  const removeReceiptBtn = document.getElementById('removeReceiptBtn');

  receiptInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        currentReceipt = canvas.toDataURL('image/jpeg', 0.5);
        receiptPreview.src = currentReceipt;
        receiptPreviewContainer.classList.remove('d-none');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  removeReceiptBtn?.addEventListener('click', () => {
    currentReceipt = null;
    if (receiptInput) receiptInput.value = '';
    receiptPreviewContainer.classList.add('d-none');
  });

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
      receipt: currentReceipt,
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
    if (!tbody) return;
    
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
      const receiptBtn = t.receipt ? `<button class="icon-btn btn-receipt" data-receipt="${t.receipt}" title="View Receipt" style="color:var(--color-primary)"><i class="bi bi-image"></i></button>` : '';
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
            <div class="row-actions d-inline-flex gap-1 align-items-center">
              <button class="icon-btn btn-share" data-id="${t.id}" title="Share"><i class="bi bi-share"></i></button>
              ${receiptBtn}
              <button class="edit-btn" data-id="${t.id}" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="del-btn" data-id="${t.id}" title="Delete"><i class="bi bi-trash3"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.btn-share').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const txn = DB.getTransactions().find((t) => t.id === btn.dataset.id);
        if (!txn) return;
        if (navigator.share) {
          const cat = DB.findCategory(txn.type, txn.category);
          const typeStr = txn.type === 'income' ? 'Received' : 'Paid';
          const text = `${typeStr} ${Helper.formatAmount(txn.amount)} for ${cat.name} on ${Helper.formatDateShort(txn.date)}.\n${txn.note ? 'Note: ' + txn.note : ''}\n- via ExpenseTracker Pro`;
          try {
            await navigator.share({ title: 'Transaction Details', text: text });
          } catch (err) {
            console.error(err);
          }
        } else {
          Helper.toast('Sharing not supported on this browser', 'danger');
        }
      });
    });

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
    tbody.querySelectorAll('.btn-receipt').forEach((btn) => {
      btn.addEventListener('click', () => {
        showReceiptPreview(btn.dataset.receipt);
      });
    });
  }

  function showReceiptPreview(dataUrl) {
    let previewModal = document.getElementById('receiptFullScreenModal');
    if (!previewModal) {
      previewModal = document.createElement('div');
      previewModal.id = 'receiptFullScreenModal';
      previewModal.innerHTML = `
        <div class="modal fade" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content" style="background: transparent; border: none;">
              <div class="modal-header border-0 justify-content-end p-0 pb-2">
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" style="background-color: rgba(0,0,0,0.5); border-radius: 50%; padding: 0.8rem;"></button>
              </div>
              <div class="modal-body text-center p-0">
                <img id="receiptFullScreenImg" src="" style="max-width: 100%; max-height: 85vh; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(previewModal);
    }
    document.getElementById('receiptFullScreenImg').src = dataUrl;
    const modalInstance = new bootstrap.Modal(previewModal.querySelector('.modal'));
    modalInstance.show();
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
