/* ==========================================================================
   ExpenseTracker Pro — storage.js
   Safe LocalStorage data layer. All read/write for the app goes through here.
   ========================================================================== */

const DB = (function () {
  const KEYS = {
    TRANSACTIONS: 'etp_transactions',
    CATEGORIES: 'etp_categories',
    SETTINGS: 'etp_settings',
    RECURRING: 'etp_recurring',
  };

  const DEFAULT_CATEGORIES = {
    income: [
      { id: 'salary', name: 'Salary', icon: 'bi-cash-stack', color: '#22C55E' },
      { id: 'business', name: 'Business', icon: 'bi-briefcase', color: '#2563EB' },
      { id: 'freelance', name: 'Freelance', icon: 'bi-laptop', color: '#8B5CF6' },
      { id: 'investment', name: 'Investment', icon: 'bi-graph-up-arrow', color: '#0EA5E9' },
      { id: 'gift', name: 'Gift', icon: 'bi-gift', color: '#EC4899' },
      { id: 'other-income', name: 'Other', icon: 'bi-three-dots', color: '#64748B' },
    ],
    expense: [
      { id: 'food', name: 'Food', icon: 'bi-cup-hot', color: '#F59E0B' },
      { id: 'travel', name: 'Travel', icon: 'bi-airplane', color: '#0EA5E9' },
      { id: 'shopping', name: 'Shopping', icon: 'bi-bag', color: '#EC4899' },
      { id: 'rent', name: 'Rent', icon: 'bi-house-door', color: '#8B5CF6' },
      { id: 'bills', name: 'Bills', icon: 'bi-receipt', color: '#EF4444' },
      { id: 'education', name: 'Education', icon: 'bi-book', color: '#2563EB' },
      { id: 'health', name: 'Health', icon: 'bi-heart-pulse', color: '#22C55E' },
      { id: 'entertainment', name: 'Entertainment', icon: 'bi-film', color: '#F97316' },
      { id: 'other-expense', name: 'Other', icon: 'bi-three-dots', color: '#64748B' },
    ],
  };

  const DEFAULT_SETTINGS = {
    theme: 'light',
    currency: 'INR',
    pinCode: '',
    monthlyBudget: 0,
  };

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (err) {
      console.error('DB read error for', key, err);
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('DB write error for', key, err);
      return false;
    }
  }

  function init() {
    if (localStorage.getItem(KEYS.CATEGORIES) === null) {
      safeSet(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
    if (localStorage.getItem(KEYS.SETTINGS) === null) {
      safeSet(KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (localStorage.getItem(KEYS.TRANSACTIONS) === null) {
      safeSet(KEYS.TRANSACTIONS, []);
    }
  }

  function uid() {
    return 'txn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // ---------------- Transactions ----------------
  function getTransactions() {
    return safeGet(KEYS.TRANSACTIONS, []);
  }

  function saveTransactions(list) {
    return safeSet(KEYS.TRANSACTIONS, list);
  }

  function addTransaction(txn) {
    const list = getTransactions();
    const record = {
      id: uid(),
      date: txn.date,
      time: txn.time || '',
      type: txn.type,
      category: txn.category,
      amount: Math.abs(Number(txn.amount)) || 0,
      note: txn.note || '',
      paymentMethod: txn.paymentMethod || 'Cash',
      createdAt: new Date().toISOString(),
    };
    list.push(record);
    saveTransactions(list);
    return record;
  }

  function updateTransaction(id, updates) {
    const list = getTransactions();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, amount: Math.abs(Number(updates.amount ?? list[idx].amount)) || 0 };
    saveTransactions(list);
    return list[idx];
  }

  function deleteTransaction(id) {
    const list = getTransactions().filter((t) => t.id !== id);
    saveTransactions(list);
  }

  function clearAllTransactions() {
    saveTransactions([]);
  }

  // ---------------- Categories ----------------
  function getCategories() {
    return safeGet(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  function saveCategories(cats) {
    return safeSet(KEYS.CATEGORIES, cats);
  }

  function addCategory(type, category) {
    const cats = getCategories();
    const id = category.name.toLowerCase().trim().replace(/\s+/g, '-') + '-' + Date.now().toString(36).slice(-4);
    const record = {
      id,
      name: category.name,
      icon: category.icon || 'bi-tag',
      color: category.color || '#64748B',
      custom: true,
    };
    cats[type].push(record);
    saveCategories(cats);
    return record;
  }

  function deleteCategory(type, id) {
    const cats = getCategories();
    cats[type] = cats[type].filter((c) => c.id !== id);
    saveCategories(cats);
  }

  function findCategory(type, id) {
    const cats = getCategories();
    return (cats[type] || []).find((c) => c.id === id) || { id, name: id, icon: 'bi-tag', color: '#64748B' };
  }

  // ---------------- Recurring ----------------
  function getRecurring() {
    return safeGet(KEYS.RECURRING, []);
  }

  function addRecurring(rule) {
    const rules = getRecurring();
    const newRule = { ...rule, id: 'rec_' + Date.now().toString(36) };
    rules.push(newRule);
    safeSet(KEYS.RECURRING, rules);
    return newRule;
  }

  function deleteRecurring(id) {
    const rules = getRecurring().filter((r) => r.id !== id);
    safeSet(KEYS.RECURRING, rules);
  }

  function updateRecurring(id, data) {
    const rules = getRecurring().map((r) => (r.id === id ? { ...r, ...data } : r));
    safeSet(KEYS.RECURRING, rules);
  }

  // ---------------- Settings ----------------
  function getSettings() {
    return safeGet(KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  function saveSettings(settings) {
    return safeSet(KEYS.SETTINGS, settings);
  }

  function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    saveSettings(settings);
    return settings;
  }

  // ---------------- Backup / Restore ----------------
  function exportAllData() {
    return {
      transactions: getTransactions(),
      categories: getCategories(),
      settings: getSettings(),
      recurring: getRecurring(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  function importAllData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
    if (Array.isArray(data.transactions)) saveTransactions(data.transactions);
    if (data.categories) saveCategories(data.categories);
    if (data.recurring) safeSet(KEYS.RECURRING, data.recurring);
    if (data.settings) saveSettings(data.settings);
    return true;
  }

  function resetAllData() {
    localStorage.removeItem(KEYS.TRANSACTIONS);
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.RECURRING);
    init();
  }

  init();

  return {
    KEYS,
    getTransactions,
    saveTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    getCategories,
    saveCategories,
    addCategory,
    deleteCategory,
    findCategory,
    getRecurring,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    getSettings,
    saveSettings,
    updateSetting,
    exportAllData,
    importAllData,
    resetAllData,
  };
})();
