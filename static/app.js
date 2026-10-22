(() => {
  const search = document.getElementById('equipment-search');
  const category = document.getElementById('category-filter');
  const list = document.getElementById('equipment-list');
  const count = document.getElementById('selected-count');
  const selectedItems = document.getElementById('selected-items');
  const selectedSummaryCount = document.getElementById('selected-summary-count');
  function filterItems() {
    if (!list) return;
    const q = String(search?.value || '').trim().toLocaleLowerCase();
    const cat = String(category?.value || '').trim().toLocaleLowerCase();
    list.querySelectorAll('.equipment-row').forEach(row => {
      const name = String(row.dataset.name || row.querySelector('.equipment-info b')?.textContent || '').toLocaleLowerCase();
      const id = String(row.dataset.id || '').toLocaleLowerCase();
      const rowCategory = String(row.dataset.category || '').toLocaleLowerCase();
      const matchesText = !q || name.includes(q) || id.includes(q);
      const matchesCategory = !cat || rowCategory === cat;
      row.hidden = !(matchesText && matchesCategory);
    });
    const visibleRows = [...list.querySelectorAll('.equipment-row')].filter(row => !row.hidden);
    let empty = list.querySelector('[data-filter-empty]');
    if (!visibleRows.length && list.querySelector('.equipment-row')) {
      if (!empty) { empty = document.createElement('div'); empty.className = 'empty-state'; empty.dataset.filterEmpty = 'true'; empty.textContent = 'No equipment matches your search or category.'; list.appendChild(empty); }
    } else if (empty) empty.remove();
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
  search?.addEventListener('input', filterItems);
  search?.addEventListener('search', filterItems);
  category?.addEventListener('change', filterItems);
  filterItems();
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
    const name = String(row.dataset.name || row.cells?.[1]?.innerText || '').toLowerCase();
    const id = String(row.dataset.id || row.cells?.[0]?.innerText || '').toLowerCase();
    const matchesText = name.includes(query) || id.includes(query);
    const matchesCategory = !category || row.dataset.category === category;
    row.hidden = !(matchesText && matchesCategory);
  });
}
inventorySearch?.addEventListener('input', filterInventory);
inventoryCategory?.addEventListener('change', filterInventory);
filterInventory();


// Append the current page filters to export links so exports match visible rows.
function updateFilteredExportLinks() {
  document.querySelectorAll('a[href*="/export/inventory/"]').forEach(link => {
    const url = new URL(link.href, window.location.href);
    url.searchParams.set('q', document.getElementById('inventory-search')?.value || '');
    url.searchParams.set('category', document.getElementById('inventory-category-filter')?.value || '');
    link.href = url.pathname + url.search;
  });
  document.querySelectorAll('a[href*="/export/transactions/"]').forEach(link => {
    const url = new URL(link.href, window.location.href);
    url.searchParams.set('q', document.getElementById('history-search')?.value || '');
    link.href = url.pathname + url.search;
  });
}
document.getElementById('inventory-search')?.addEventListener('input', updateFilteredExportLinks);
document.getElementById('inventory-category-filter')?.addEventListener('change', updateFilteredExportLinks);
document.getElementById('history-search')?.addEventListener('input', updateFilteredExportLinks);
updateFilteredExportLinks();


// QR scanning is implemented on the movement page; this bundle handles selection counts and filters.
