/* ==========================================================================
   ExpenseTracker Pro — settings.js  (drives pages/settings.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const settings = DB.getSettings();

  // ---------------- Theme ----------------
  function syncThemeOptions() {
    const current = DB.getSettings().theme || 'light';
    document.querySelectorAll('.theme-option').forEach((el) => {
      el.classList.toggle('active', el.dataset.theme === current);
    });
  }

  syncThemeOptions();
  window.addEventListener('etp:theme-changed', syncThemeOptions);

  document.querySelectorAll('.theme-option').forEach((el) => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.theme-option').forEach((o) => o.classList.remove('active'));
      el.classList.add('active');
      Theme.set(el.dataset.theme);
      Helper.toast(`Theme set to ${el.dataset.theme}`, 'success');
    });
  });

  // ---------------- Currency ----------------
  document.querySelectorAll('.currency-option').forEach((el) => {
    if (el.dataset.currency === settings.currency) el.classList.add('active');
    el.addEventListener('click', () => {
      document.querySelectorAll('.currency-option').forEach((o) => o.classList.remove('active'));
      el.classList.add('active');
      DB.updateSetting('currency', el.dataset.currency);
      Helper.toast(`Currency set to ${el.dataset.currency}`, 'success');
    });
  });

  // ---------------- Security (PIN) ----------------
  const setPinBtn = document.getElementById('setPinBtn');
  const removePinBtn = document.getElementById('removePinBtn');
  const setPinText = document.getElementById('setPinText');

  function updatePinUI() {
    const hasPin = !!DB.getSettings().pinCode;
    if (hasPin) {
      setPinText.textContent = 'Change PIN';
      removePinBtn.classList.remove('d-none');
    } else {
      setPinText.textContent = 'Set PIN Lock';
      removePinBtn.classList.add('d-none');
    }
  }

  setPinBtn?.addEventListener('click', async () => {
    const pin = prompt('Enter a 4-digit PIN (e.g. 1234):');
    if (pin === null) return;
    if (!/^\d{4}$/.test(pin)) {
      Helper.toast('PIN must be exactly 4 digits.', 'danger');
      return;
    }
    DB.updateSetting('pinCode', pin);
    updatePinUI();
    Helper.toast('PIN has been set successfully.', 'success');
  });

  removePinBtn?.addEventListener('click', async () => {
    const ok = await Helper.confirmDialog({
      title: 'Remove PIN?',
      message: 'Anyone with access to this device will be able to view your financial data.',
      confirmText: 'Remove PIN'
    });
    if (!ok) return;
    DB.updateSetting('pinCode', '');
    updatePinUI();
    Helper.toast('PIN has been removed.', 'success');
  });

  updatePinUI();

  // ---------------- Backup ----------------
  document.getElementById('backupBtn')?.addEventListener('click', () => {
    const data = DB.exportAllData();
    Exporter.downloadJSON(data, `expense-tracker-backup-${Helper.todayISO()}.json`);
    Helper.toast('Backup downloaded', 'success');
  });

  // ---------------- Restore ----------------
  const restoreInput = document.getElementById('restoreInput');
  document.getElementById('restoreBtn')?.addEventListener('click', () => restoreInput?.click());
  restoreInput?.addEventListener('change', async () => {
    const file = restoreInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const ok = await Helper.confirmDialog({
        title: 'Restore backup?',
        message: 'This will replace your current transactions, categories, and settings with the backup file.',
        confirmText: 'Restore',
      });
      if (!ok) return;
      DB.importAllData(data);
      Helper.toast('Data restored successfully', 'success');
      setTimeout(() => location.reload(), 900);
    } catch (err) {
      Helper.toast('Invalid backup file', 'danger');
      console.error(err);
    } finally {
      restoreInput.value = '';
    }
  });

  // ---------------- Reset ----------------
  document.getElementById('resetBtn')?.addEventListener('click', async () => {
    const ok = await Helper.confirmDialog({
      title: 'Reset all data?',
      message: 'This permanently deletes all transactions, custom categories, and settings. This cannot be undone.',
      confirmText: 'Reset everything',
    });
    if (!ok) return;
    DB.resetAllData();
    Helper.toast('All data has been reset', 'success');
    setTimeout(() => location.reload(), 900);
  });

  // ---------------- Storage usage indicator ----------------
  const usageEl = document.getElementById('storageUsage');
  if (usageEl) {
    const bytes = new Blob([
      localStorage.getItem(DB.KEYS.TRANSACTIONS) || '',
      localStorage.getItem(DB.KEYS.CATEGORIES) || '',
      localStorage.getItem(DB.KEYS.SETTINGS) || '',
    ]).size;
    usageEl.textContent = `${(bytes / 1024).toFixed(1)} KB used locally in this browser`;
  }
});
