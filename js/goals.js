/* ==========================================================================
   ExpenseTracker Pro — goals.js  (drives pages/goals.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('goalsGrid');
  if (!grid) return;

  const form = document.getElementById('goalForm');
  const modalEl = document.getElementById('goalModal');
  const modalTitle = document.getElementById('goalModalTitle');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  let editId = null;

  // Icons array to choose from
  const icons = [
    'bi-star', 'bi-award', 'bi-airplane', 'bi-house', 'bi-car-front',
    'bi-laptop', 'bi-controller', 'bi-bicycle', 'bi-gem', 'bi-gift',
    'bi-heart', 'bi-mortarboard', 'bi-piggy-bank', 'bi-wallet2', 'bi-coin'
  ];

  function renderIcons() {
    const container = document.getElementById('iconSelector');
    if (!container) return;
    container.innerHTML = icons.map((i) => `<div class="icon-option" data-icon="${i}"><i class="bi ${i}"></i></div>`).join('');
    
    container.querySelectorAll('.icon-option').forEach(opt => {
      opt.addEventListener('click', () => {
        container.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        document.getElementById('selectedIcon').value = opt.dataset.icon;
      });
    });
  }

  function setIcon(iconName) {
    const container = document.getElementById('iconSelector');
    if (!container) return;
    container.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
    const opt = container.querySelector(`.icon-option[data-icon="${iconName}"]`);
    if (opt) {
      opt.classList.add('selected');
      document.getElementById('selectedIcon').value = iconName;
    } else if (container.firstChild) {
      container.firstChild.classList.add('selected');
      document.getElementById('selectedIcon').value = icons[0];
    }
  }

  document.getElementById('addGoalBtn')?.addEventListener('click', () => {
    editId = null;
    modalTitle.textContent = 'Add Goal';
    form.reset();
    setIcon('bi-star');
    form.elements['color'].value = '#10B981';
    modal.show();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: data.get('name').trim(),
      targetAmount: Number(data.get('targetAmount')),
      deadline: data.get('deadline'),
      icon: data.get('icon'),
      color: data.get('color'),
    };
    
    if (editId) {
      DB.updateGoal(editId, payload);
      Helper.toast('Goal updated successfully', 'success');
    } else {
      DB.addGoal(payload);
      Helper.toast('Goal added successfully', 'success');
    }
    modal.hide();
    renderGoals();
    window.dispatchEvent(new Event('etp:data-changed'));
  });

  function renderGoals() {
    const goals = DB.getGoals();
    
    if (goals.length === 0) {
      grid.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-star"></i><h3>No goals yet</h3><p>Set a savings goal for a new phone, trip, or emergency fund.</p></div></div>`;
      return;
    }

    grid.innerHTML = goals.map(g => {
      const current = g.currentAmount || 0;
      const target = g.targetAmount;
      const percent = Math.min(100, Math.round((current / target) * 100));
      const remaining = Math.max(0, target - current);
      
      let deadlineText = '';
      if (g.deadline) {
        const d = new Date(g.deadline);
        const today = new Date();
        const diffTime = d - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) deadlineText = `<span class="text-danger"><i class="bi bi-clock"></i> Overdue</span>`;
        else if (diffDays === 0) deadlineText = `<span class="text-warning"><i class="bi bi-clock"></i> Due today</span>`;
        else deadlineText = `<span class="text-muted"><i class="bi bi-clock"></i> ${diffDays} days left</span>`;
      }

      return `
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 p-3" style="border: 1px solid var(--color-border); border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="d-flex align-items-center gap-2">
                <div style="width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:${g.color}22; color:${g.color}; font-size:1.2rem;">
                  <i class="bi ${g.icon}"></i>
                </div>
                <div>
                  <h6 class="m-0 fw-semibold">${Helper.escapeHTML(g.name)}</h6>
                  <div style="font-size:0.75rem">${deadlineText}</div>
                </div>
              </div>
              <div class="dropdown">
                <button class="btn btn-link text-muted p-0" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                  <li><a class="dropdown-item btn-add-funds" href="#" data-id="${g.id}"><i class="bi bi-plus-circle me-2"></i> Add Funds</a></li>
                  <li><a class="dropdown-item btn-edit" href="#" data-id="${g.id}"><i class="bi bi-pencil me-2"></i> Edit Goal</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger btn-delete" href="#" data-id="${g.id}"><i class="bi bi-trash3 me-2"></i> Delete</a></li>
                </ul>
              </div>
            </div>
            
            <div class="d-flex justify-content-between align-items-end mb-1">
              <div class="fw-bold fs-5">${Helper.formatAmount(current)}</div>
              <div class="text-muted" style="font-size:0.8rem">of ${Helper.formatAmount(target)}</div>
            </div>
            
            <div class="progress" style="height: 6px; border-radius: 3px; background: var(--color-border);">
              <div class="progress-bar" style="width: ${percent}%; background: ${g.color}; border-radius: 3px;"></div>
            </div>
            
            <div class="d-flex justify-content-between mt-2" style="font-size: 0.75rem;">
              <span class="text-muted">${percent}% achieved</span>
              <span class="text-muted">${Helper.formatAmount(remaining)} left</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    grid.querySelectorAll('.btn-add-funds').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        const g = DB.getGoals().find(x => x.id === id);
        if(!g) return;
        
        const amountStr = prompt(`Add funds to '${g.name}'\nCurrent amount: ${Helper.formatAmount(g.currentAmount || 0)}\nEnter amount to add:`);
        if(amountStr === null) return;
        
        const amount = Number(amountStr);
        if(isNaN(amount) || amount <= 0) {
          Helper.toast('Invalid amount', 'danger');
          return;
        }
        
        DB.updateGoal(id, { currentAmount: (g.currentAmount || 0) + amount });
        Helper.toast(`Added ${Helper.formatAmount(amount)} to ${g.name}`, 'success');
        
        // Add a confetti animation if goal is reached
        const updatedGoal = DB.getGoals().find(x => x.id === id);
        if (updatedGoal.currentAmount >= updatedGoal.targetAmount && g.currentAmount < g.targetAmount) {
          triggerConfetti();
        }
        
        renderGoals();
        window.dispatchEvent(new Event('etp:data-changed'));
      });
    });

    grid.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        const g = DB.getGoals().find(x => x.id === id);
        if (g) {
          editId = g.id;
          modalTitle.textContent = 'Edit Goal';
          form.elements['name'].value = g.name;
          form.elements['targetAmount'].value = g.targetAmount;
          form.elements['deadline'].value = g.deadline || '';
          form.elements['color'].value = g.color;
          setIcon(g.icon);
          modal.show();
        }
      });
    });

    grid.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const ok = await Helper.confirmDialog({ title: 'Delete Goal?', message: 'Are you sure you want to delete this goal?' });
        if (ok) {
          DB.deleteGoal(btn.dataset.id);
          Helper.toast('Goal deleted', 'success');
          renderGoals();
          window.dispatchEvent(new Event('etp:data-changed'));
        }
      });
    });
  }

  function triggerConfetti() {
    // Simple CSS-based confetti effect using emoji particles if we don't have a library
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
    for(let i = 0; i < 50; i++) {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = '-10px';
      el.style.zIndex = '9999';
      el.style.width = '10px';
      el.style.height = '10px';
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      el.style.pointerEvents = 'none';
      document.body.appendChild(el);
      
      const duration = Math.random() * 2 + 1;
      el.animate([
        { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${Math.random()*100 - 50}px, 100vh) rotate(${Math.random()*720}deg)`, opacity: 0 }
      ], {
        duration: duration * 1000,
        easing: 'cubic-bezier(.37,0,.63,1)',
      }).onfinish = () => el.remove();
    }
  }

  renderIcons();
  renderGoals();
  window.addEventListener('etp:data-changed', renderGoals);
  window.addEventListener('etp:theme-changed', renderGoals);
});
