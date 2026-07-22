/* ==========================================================================
   ExpenseTracker Pro — category.js  (drives pages/categories.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const incomeGrid = document.getElementById('incomeGrid');
  const expenseGrid = document.getElementById('expenseGrid');
  const addForm = document.getElementById('addCategoryForm');
  const addModalEl = document.getElementById('addCategoryModal');
  const addModal = addModalEl ? new bootstrap.Modal(addModalEl) : null;

  const ICON_CHOICES = ['bi-tag', 'bi-cart', 'bi-cup-hot', 'bi-airplane', 'bi-bag', 'bi-house-door',
    'bi-receipt', 'bi-book', 'bi-heart-pulse', 'bi-film', 'bi-cash-stack', 'bi-briefcase',
    'bi-laptop', 'bi-graph-up-arrow', 'bi-gift', 'bi-controller', 'bi-fuel-pump', 'bi-phone'];

  function usageCount(catId) {
    return DB.getTransactions().filter((t) => t.category === catId).length;
  }

  function renderGrid(container, type) {
    const cats = DB.getCategories()[type] || [];
    container.innerHTML = '';
    if (cats.length === 0) {
      container.innerHTML = `<div class="empty-state col-12"><i class="bi bi-tags"></i><h3>No categories yet</h3><p>Add your first ${type} category.</p></div>`;
      return;
    }
    cats.forEach((cat) => {
      const count = usageCount(cat.id);
      const col = document.createElement('div');
      col.className = 'col-sm-6 col-lg-4';
      col.innerHTML = `
        <div class="card h-100">
          <div class="card-body d-flex align-items-start gap-3">
            <div class="category-swatch" style="background:${cat.color}">
              <i class="bi ${cat.icon}"></i>
            </div>
            <div class="flex-grow-1">
              <h3 class="mb-1">${Helper.escapeHTML(cat.name)}</h3>
              <div class="text-muted" style="font-size:.8rem">${count} transaction${count === 1 ? '' : 's'}</div>
            </div>
            ${cat.custom !== false && cat.id.includes('-') ? `<button class="row-actions del-btn" data-id="${cat.id}" data-type="${type}" title="Delete category"><i class="bi bi-trash3"></i></button>` : ''}
          </div>
        </div>`;
      container.appendChild(col);
    });

    container.querySelectorAll('.del-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const t = btn.dataset.type;
        const count = usageCount(id);
        const msg = count > 0
          ? `This category is used by ${count} transaction(s). They will keep the category name as a label, but it will no longer appear in dropdowns.`
          : 'This category will be removed permanently.';
        const ok = await Helper.confirmDialog({ title: 'Delete category?', message: msg, confirmText: 'Delete' });
        if (!ok) return;
        DB.deleteCategory(t, id);
        Helper.toast('Category deleted', 'success');
        renderAll();
      });
    });
  }

  function renderAll() {
    renderGrid(incomeGrid, 'income');
    renderGrid(expenseGrid, 'expense');
  }

  // Icon picker
  function buildIconPicker() {
    const wrap = document.getElementById('iconPicker');
    if (!wrap) return;
    wrap.innerHTML = '';
    ICON_CHOICES.forEach((icon, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-light-soft' + (i === 0 ? ' active' : '');
      btn.dataset.icon = icon;
      btn.innerHTML = `<i class="bi ${icon}"></i>`;
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        addForm.dataset.icon = icon;
      });
      wrap.appendChild(btn);
    });
    addForm.dataset.icon = ICON_CHOICES[0];
  }
  buildIconPicker();

  addForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = addForm.name.value.trim();
    const type = addForm.type.value;
    const color = addForm.color.value;
    if (!name) {
      addForm.name.classList.add('is-invalid');
      return;
    }
    addForm.name.classList.remove('is-invalid');
    DB.addCategory(type, { name, color, icon: addForm.dataset.icon });
    Helper.toast('Category added', 'success');
    addForm.reset();
    addModal?.hide();
    renderAll();
  });

  renderAll();
});
