(() => {
  const search = document.getElementById('equipment-search');
  const category = document.getElementById('category-filter');
  const list = document.getElementById('equipment-list');
  const count = document.getElementById('selected-count');
  const selectedItems = document.getElementById('selected-items');
  const selectedSummaryCount = document.getElementById('selected-summary-count');
  function filterItems() {
    if (!list) return;
    const q = (search?.value || '').trim().toLowerCase();
    const cat = category?.value || '';
    list.querySelectorAll('.equipment-row').forEach(row => {
      row.hidden = !(row.dataset.name.includes(q) || row.dataset.id.includes(q)) || (cat && row.dataset.category !== cat);
    });
  }
  function updateCount() {
    if (!list) return;
    const checked = [...list.querySelectorAll('input[type=checkbox]:checked')];
    if (count) count.textContent = checked.length;
    if (selectedSummaryCount) selectedSummaryCount.textContent = `${checked.length} ${checked.length === 1 ? 'item' : 'items'}`;
    if (selectedItems) {
      selectedItems.replaceChildren();
      if (!checked.length) {
        const empty = document.createElement('p');
        empty.className = 'muted small';
        empty.textContent = 'No equipment selected yet.';
        selectedItems.appendChild(empty);
      } else {
        checked.forEach(input => {
          const row = input.closest('.equipment-row');
          const chip = document.createElement('div');
          chip.className = 'selected-item';
          const text = document.createElement('span');
          const name = document.createElement('b');
          name.textContent = row.querySelector('.equipment-info b')?.textContent || input.value;
          const meta = document.createElement('small');
          meta.textContent = `${input.value} · ${row.dataset.category || ''}`;
          text.append(name, meta);
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'selected-remove';
          remove.textContent = 'Remove';
          remove.setAttribute('aria-label', `Remove ${input.value}`);
          remove.addEventListener('click', () => { input.checked = false; updateCount(); });
          chip.append(text, remove);
          selectedItems.appendChild(chip);
        });
      }
    }
  }
  search?.addEventListener('input', filterItems); category?.addEventListener('change', filterItems);
  list?.addEventListener('change', e => { if (e.target.matches('input[type=checkbox]')) updateCount(); });
  document.querySelectorAll('[data-clear-form]').forEach(button => button.addEventListener('click', () => {
    const form = button.closest('form'); if (!form) return;
    form.querySelectorAll('input:not([type=hidden]), textarea').forEach(el => { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
    form.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
    if (search) search.value = ''; if (category) category.selectedIndex = 0;
    filterItems(); updateCount();
  }));
  const historySearch = document.getElementById('history-search');
  historySearch?.addEventListener('input', () => {
    const q = historySearch.value.toLowerCase();
    document.querySelectorAll('#history-table tbody tr').forEach(row => row.hidden = !row.innerText.toLowerCase().includes(q));
  });
  updateCount();
})();


const inventorySearch = document.getElementById('inventory-search');
const inventoryCategory = document.getElementById('inventory-category-filter');
function filterInventory() {
  const query = (inventorySearch?.value || '').trim().toLowerCase();
  const category = inventoryCategory?.value || '';
  document.querySelectorAll('#inventory-table tbody tr').forEach(row => {
    const matchesText = (row.dataset.name || '').includes(query) || (row.dataset.id || '').includes(query);
    const matchesCategory = !category || row.dataset.category === category;
    row.hidden = !(matchesText && matchesCategory);
  });
}
inventorySearch?.addEventListener('input', filterInventory);
inventoryCategory?.addEventListener('change', filterInventory);
