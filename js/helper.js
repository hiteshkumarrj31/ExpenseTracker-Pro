/* ==========================================================================
   ExpenseTracker Pro — helper.js
   Formatting utilities, toasts, small shared UI helpers.
   ========================================================================== */

const Helper = (function () {
  const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€' };

  function currencySymbol() {
    const settings = DB.getSettings();
    return CURRENCY_SYMBOLS[settings.currency] || '₹';
  }

  function formatAmount(value) {
    const num = Number(value) || 0;
    const symbol = currencySymbol();
    return symbol + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function nowTime() {
    const d = new Date();
    return d.toTimeString().slice(0, 5);
  }

  // Escapes text before inserting into innerHTML contexts (defence in depth;
  // prefer textContent wherever possible per security guidelines)
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function startOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  function inRange(dateStr, from, to) {
    if (!from && !to) return true;
    const d = new Date(dateStr + 'T00:00:00');
    if (from && d < new Date(from + 'T00:00:00')) return false;
    if (to && d > new Date(to + 'T00:00:00')) return false;
    return true;
  }

  function filterByPeriod(transactions, period) {
    const now = new Date();
    const todayStr = todayISO();
    if (period === 'today') {
      return transactions.filter((t) => t.date === todayStr);
    }
    if (period === 'week') {
      const start = startOfWeek(now);
      start.setHours(0, 0, 0, 0);
      return transactions.filter((t) => new Date(t.date + 'T00:00:00') >= start);
    }
    if (period === 'month') {
      return transactions.filter((t) => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    if (period === 'year') {
      return transactions.filter((t) => new Date(t.date + 'T00:00:00').getFullYear() === now.getFullYear());
    }
    return transactions;
  }

  // ---------------- Toasts ----------------
  function ensureToastStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, type = 'primary') {
    const stack = ensureToastStack();
    const icon = { success: 'bi-check-circle-fill', danger: 'bi-exclamation-circle-fill', primary: 'bi-info-circle-fill' }[type] || 'bi-info-circle-fill';
    const el = document.createElement('div');
    el.className = `toast-item ${type}`;
    const iconSpan = document.createElement('i');
    iconSpan.className = `bi ${icon}`;
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    el.appendChild(iconSpan);
    el.appendChild(textSpan);
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'all 200ms ease';
      setTimeout(() => el.remove(), 220);
    }, 2800);
  }

  // ---------------- Confirm dialog (Bootstrap modal based) ----------------
  function confirmDialog({ title = 'Are you sure?', message = '', confirmText = 'Delete', danger = true }) {
    return new Promise((resolve) => {
      let modalEl = document.getElementById('globalConfirmModal');
      if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'globalConfirmModal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title" id="confirmModalTitle"></h3>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body"><p id="confirmModalMsg" class="text-muted mb-0"></p></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn" id="confirmModalOkBtn"></button>
              </div>
            </div>
          </div>`;
        document.body.appendChild(modalEl);
      }
      modalEl.querySelector('#confirmModalTitle').textContent = title;
      modalEl.querySelector('#confirmModalMsg').textContent = message;
      const okBtn = modalEl.querySelector('#confirmModalOkBtn');
      okBtn.textContent = confirmText;
      okBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');

      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      const cleanup = (result) => {
        okBtn.removeEventListener('click', onOk);
        modalEl.removeEventListener('hidden.bs.modal', onHide);
        resolve(result);
      };
      const onOk = () => { modal.hide(); cleanup(true); };
      const onHide = () => cleanup(false);
      okBtn.addEventListener('click', onOk);
      modalEl.addEventListener('hidden.bs.modal', onHide, { once: true });
      modal.show();
    });
  }

  return {
    currencySymbol,
    formatAmount,
    formatDate,
    formatDateShort,
    todayISO,
    nowTime,
    escapeHTML,
    debounce,
    inRange,
    filterByPeriod,
    toast,
    confirmDialog,
  };
})();
