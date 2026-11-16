document.addEventListener('DOMContentLoaded', () => {
  const V = window.Venari;
  if (!V) return;
  const grid = document.querySelector('#shop-grid');
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#empty-state');
  let category = new URLSearchParams(location.search).get('category') || 'All';
  let query = new URLSearchParams(location.search).get('q') || '';
  let sort = 'featured';

  const matches = (p, selected) => selected === 'All' ||
    (selected === 'Apparel' && ['Hoodies', 'Sweaters', 'T-shirts', 'Jackets', 'Jerseys', 'Pants'].includes(p.category)) ||
    p.category === selected;

  function render() {
    let list = V.products.filter(p => matches(p, category) && `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    grid.innerHTML = list.map(V.card).join('');
    count.textContent = `${list.length} PRODUCTS`;
    empty.hidden = list.length > 0;
    document.querySelectorAll('.filter-chip').forEach(button => button.classList.toggle('active', button.dataset.category === category));
  }
  document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; render(); }));
  document.querySelector('#sort-select')?.addEventListener('change', event => { sort = event.target.value; render(); });
  document.addEventListener('venari-search', event => { query = event.detail; render(); });
  render();
});