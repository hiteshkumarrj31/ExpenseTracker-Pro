/* ==========================================================================
   ExpenseTracker Pro — subscriptions.js  (drives pages/subscriptions.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('txnTableBody');
  if (!tbody) return;

  const form = document.getElementById('txnForm');
  const typeSelect = form.querySelector('[name="type"]');
  const catSelect = form.querySelector('[name="category"]');
  const modalEl = document.getElementById('txnModal');
  const modalTitle = document.getElementById('txnModalTitle');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  let editId = null;

  function populateCategories(type) {
    const cats = DB.getCategories()[type] || [];
    catSelect.innerHTML = cats.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  typeSelect.addEventListener('change', (e) => populateCategories(e.target.value));

  document.getElementById('addTxnBtn')?.addEventListener('click', () => {
    editId = null;
    modalTitle.textContent = 'Add Subscription';
    form.reset();
    form.querySelector('[name="nextDate"]').value = Helper.todayISO();
    populateCategories('expense');
    modal.show();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      nextDate: data.get('nextDate'),
      frequency: data.get('frequency'),
      type: data.get('type'),
      category: data.get('category'),
      amount: Number(data.get('amount')),
      paymentMethod: data.get('paymentMethod'),
      note: data.get('note'),
    };
    if (editId) {
      DB.updateRecurring(editId, payload);
      Helper.toast('Subscription updated successfully', 'success');
    } else {
      DB.addRecurring(payload);
      Helper.toast('Subscription added successfully', 'success');
    }
    modal.hide();
  });

  function renderTable() {
    const rules = DB.getRecurring();

    if (rules.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-calendar-repeat"></i><h3>No subscriptions yet</h3><p>Automate your recurring expenses and incomes here.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = rules.map((r) => {
      const cat = DB.findCategory(r.type, r.category);
      const sign = r.type === 'income' ? '+' : '−';
      const cls = r.type === 'income' ? 'amount-in' : 'amount-out';
      
      const freqLabel = r.frequency.charAt(0).toUpperCase() + r.frequency.slice(1);
      
      return `
        <tr>
          <td>
            <div style="font-weight:500; white-space:nowrap">${Helper.formatDateShort(r.nextDate)}</div>
          </td>
          <td>
            <div class="category-badge" style="color:${cat.color};background:${cat.color}15">
              <i class="bi ${cat.icon}"></i> ${Helper.escapeHTML(cat.name)}
            </div>
            ${r.note ? `<div class="text-muted mt-1" style="font-size:0.8rem;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Helper.escapeHTML(r.note)}</div>` : ''}
          </td>
          <td>${Helper.escapeHTML(r.paymentMethod || '—')}</td>
          <td><span class="badge bg-secondary">${freqLabel}</span></td>
          <td class="text-end ${cls} mono">${sign} ${Helper.formatAmount(r.amount)}</td>
          <td class="text-end">
            <button class="icon-btn btn-edit" data-id="${r.id}" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="icon-btn btn-delete text-danger" data-id="${r.id}" title="Delete"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`;
    }).join('');
  }

  tbody.addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('.btn-edit');
    const btnDel = e.target.closest('.btn-delete');
    
    if (btnEdit) {
      const r = DB.getRecurring().find((x) => x.id === btnEdit.dataset.id);
      if (r) {
        editId = r.id;
        modalTitle.textContent = 'Edit Subscription';
        form.querySelector('[name="nextDate"]').value = r.nextDate;
        form.querySelector('[name="frequency"]').value = r.frequency || 'monthly';
        typeSelect.value = r.type;
        populateCategories(r.type);
        catSelect.value = r.category;
        form.querySelector('[name="amount"]').value = r.amount;
        form.querySelector('[name="paymentMethod"]').value = r.paymentMethod;
        form.querySelector('[name="note"]').value = r.note || '';
        modal.show();
      }
    } else if (btnDel) {
      const ok = await Helper.confirmDialog({
        title: 'Delete Subscription?',
        message: 'This will stop future auto-generation. Existing transactions will remain.',
      });
      if (ok) {
        DB.deleteRecurring(btnDel.dataset.id);
        Helper.toast('Subscription deleted', 'success');
      }
    }
  });

  renderTable();
  window.addEventListener('etp:data-changed', renderTable);
  window.addEventListener('etp:theme-changed', renderTable);
});
