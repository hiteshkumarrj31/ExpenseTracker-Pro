/* ==========================================================================
   ExpenseTracker Pro — export.js
   CSV export (native, no dependency) + trigger for browser print (PDF).
   ========================================================================== */

const Exporter = (function () {
  function toCSV(transactions) {
    const header = ['Date', 'Time', 'Type', 'Category', 'Amount', 'Payment Method', 'Note'];
    const rows = transactions.map((t) => {
      const cat = DB.findCategory(t.type, t.category);
      return [
        t.date,
        t.time || '',
        t.type,
        cat.name,
        t.amount,
        t.paymentMethod || '',
        (t.note || '').replace(/"/g, '""'),
      ];
    });
    const csvLines = [header, ...rows].map((row) =>
      row.map((cell) => `"${String(cell)}"`).join(',')
    );
    return csvLines.join('\r\n');
  }

  function downloadCSV(transactions, filename = 'expense-tracker-export.csv') {
    const csv = toCSV(transactions);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadJSON(data, filename = 'expense-tracker-backup.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    window.print();
  }

  return { toCSV, downloadCSV, downloadJSON, printReport };
})();
