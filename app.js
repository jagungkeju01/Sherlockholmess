(() => {
  'use strict';
  const products = (window.VENARI_PRODUCTS || []).map((p, i) => ({
    ...p,
    id: String(p.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${i}`
  }));

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const money = value => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(value || 0);
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };
  const toast = message => {
    const el = document.querySelector('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.__venariToast);
    window.__venariToast = setTimeout(() => el.classList.remove('show'), 2200);
  };

  function card(p) {
    const image = p.images?.[0] || '';
    return `<article class="product-card">
      <button class="product-image" type="button" data-product="${esc(p.id)}" aria-label="Lihat ${esc(p.name)}">
        <img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy">
        <span class="view-product">VIEW PRODUCT ↗</span>
      </button>
      <div class="product-info">
        <div class="product-category">${esc(p.category)}</div>
        <button class="product-name product-name-button" type="button" data-product="${esc(p.id)}">${esc(p.name)}</button>
        <div class="product-price">${money(p.price)}</div>
      </div>
    </article>`;
  }

  function ensureModal() {
    if (document.querySelector('#product-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="product-modal" id="product-modal" aria-hidden="true">
      <div class="product-modal-panel" role="dialog" aria-modal="true" aria-label="Detail produk">
        <button class="modal-close" type="button" data-modal-close aria-label="Tutup">×</button>
        <div class="modal-gallery"><div class="modal-main-image"><button class="gallery-arrow gallery-prev" type="button" aria-label="Foto sebelumnya">‹</button><img id="modal-main-image" src="" alt=""><button class="gallery-arrow gallery-next" type="button" aria-label="Foto berikutnya">›</button></div><div class="modal-thumbnails" id="modal-thumbnails"></div></div>
        <div class="modal-info"><p class="eyebrow" id="modal-category"></p><h2 id="modal-name"></h2><p class="modal-price" id="modal-price"></p><p class="modal-description" id="modal-description"></p><p class="modal-photo-count" id="modal-photo-count"></p><div class="modal-options"><label for="modal-size">SELECT SIZE</label><select id="modal-size"></select><label for="modal-qty">QUANTITY</label><div class="modal-quantity"><button type="button" id="qty-minus">−</button><input id="modal-qty" type="number" min="1" max="20" value="1"><button type="button" id="qty-plus">+</button></div></div><div class="modal-purchase-actions"><button class="button button-outline modal-add" id="modal-add" type="button">ADD TO WISH LIST</button><button class="button button-light" id="modal-buy" type="button">BUY NOW</button></div></div>
      </div>
    </div>`);
  }

  let activeProduct = null;
  let activeImage = 0;
  function showImage() {
    if (!activeProduct) return;
    const images = activeProduct.images || [];
    const main = document.querySelector('#modal-main-image');
    main.src = images[activeImage];
    main.alt = activeProduct.name;
    document.querySelector('#modal-photo-count').textContent = `${activeImage + 1} / ${images.length} PHOTOS`;
    document.querySelectorAll('.modal-thumb').forEach((button, index) => button.classList.toggle('active', index === activeImage));
  }
  function openProduct(id) {
    activeProduct = products.find(p => p.id === id);
    if (!activeProduct) return;
    activeImage = 0;
    ensureModal();
    document.querySelector('#modal-category').textContent = activeProduct.category.toUpperCase();
    document.querySelector('#modal-name').textContent = activeProduct.name;
    document.querySelector('#modal-price').textContent = money(activeProduct.price);
    document.querySelector('#modal-description').textContent = activeProduct.description || 'Selected piece from K VÉNARI Streetwear.';
    const sizeSelect = document.querySelector('#modal-size');
    const isShoe = /sneaker|shoe|footwear/i.test(activeProduct.category);
    const isPants = /pants/i.test(activeProduct.category);
    const isOneSize = /watches|accessories/i.test(activeProduct.category);
    const sizes = activeProduct.sizes?.length ? activeProduct.sizes : (isShoe ? ['38','39','40','41','42','43','44'] : isPants ? ['28','30','32','34','36'] : isOneSize ? ['One Size'] : ['XS','S','M','L','XL','XXL']);
    sizeSelect.innerHTML = '<option value="">Pilih ukuran</option>' + sizes.map(size => `<option value="${esc(size)}">${esc(size)}</option>`).join('');
    document.querySelector('#modal-qty').value = 1;
    document.querySelector('#modal-thumbnails').innerHTML = activeProduct.images.map((src, i) =>
      `<button class="modal-thumb ${i === 0 ? 'active' : ''}" type="button" data-image-index="${i}"><img src="${esc(src)}" alt="${esc(activeProduct.name)} ${i + 1}"></button>`
    ).join('');
    document.querySelector('#product-modal').classList.add('open');
    document.querySelector('#product-modal').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    showImage();
  }
  function closeProduct() {
    const modal = document.querySelector('#product-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureModal();
    document.querySelector('#year')?.replaceChildren(document.createTextNode(new Date().getFullYear()));
    const root = document.documentElement;
    root.dataset.theme = read('kvenari-theme', 'dark');
    document.querySelector('#theme-toggle')?.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      write('kvenari-theme', next);
    });

    const menu = document.querySelector('#menu-overlay');
    const openMenu = () => { menu?.classList.add('open'); menu?.setAttribute('aria-hidden', 'false'); };
    const closeMenu = () => { menu?.classList.remove('open'); menu?.setAttribute('aria-hidden', 'true'); };
    document.querySelector('#menu-open')?.addEventListener('click', openMenu);
    document.querySelector('#menu-close')?.addEventListener('click', closeMenu);
    menu?.addEventListener('click', e => { if (e.target === menu) closeMenu(); });

    const panel = document.querySelector('#search-panel');
    const input = document.querySelector('#search-input');
    document.querySelector('#search-toggle')?.addEventListener('click', () => {
      if (!panel) return;
      panel.hidden = !panel.hidden;
      if (!panel.hidden) input?.focus();
    });
    document.querySelector('#search-close')?.addEventListener('click', () => {
      if (panel) panel.hidden = true;
      if (input) input.value = '';
      if (location.pathname.endsWith('shop.html')) {
        const url = new URL(location.href); url.searchParams.delete('q'); history.replaceState({}, '', url);
        document.dispatchEvent(new CustomEvent('venari-search', { detail: '' }));
      }
    });
    input?.addEventListener('input', () => {
      if (location.pathname.endsWith('shop.html')) document.dispatchEvent(new CustomEvent('venari-search', { detail: input.value.trim() }));
      else if (input.value.trim()) location.href = 'shop.html?q=' + encodeURIComponent(input.value.trim());
    });

    document.addEventListener('click', e => {
      const product = e.target.closest('[data-product]');
      const add = e.target.closest('[data-add]');
      const buy = e.target.closest('[data-buy]');
      if (product) openProduct(product.dataset.product);
      if (add) window.VenariCart?.add(add.dataset.add);
      if (e.target.closest('[data-modal-close]')) closeProduct();
      const thumb = e.target.closest('[data-image-index]');
      if (thumb) { activeImage = Number(thumb.dataset.imageIndex); showImage(); }
    });
    document.querySelector('#modal-thumbnails')?.addEventListener('click', () => {});
    document.addEventListener('click', e => {
      if (e.target.closest('.gallery-prev') && activeProduct) {
        activeImage = (activeImage - 1 + activeProduct.images.length) % activeProduct.images.length; showImage();
      }
      if (e.target.closest('.gallery-next') && activeProduct) {
        activeImage = (activeImage + 1) % activeProduct.images.length; showImage();
      }
      if (e.target.id === 'product-modal') closeProduct();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProduct(); closeMenu(); } });
    const selectedPurchase = () => { if (!activeProduct) return null; const size=document.querySelector('#modal-size').value; const qty=Math.max(1,Math.min(20,Number(document.querySelector('#modal-qty').value)||1)); if(!size){toast('Pilih ukuran terlebih dahulu');return null;} return {id:activeProduct.id,size,qty}; };
    document.querySelector('#modal-add')?.addEventListener('click', () => { const item=selectedPurchase(); if(!item)return; window.VenariCart?.add(item.id,item.size,item.qty); closeProduct(); });
    document.querySelector('#modal-buy')?.addEventListener('click',()=>{const item=selectedPurchase();if(!item)return;write('kvenari-cart',[item]);location.href='checkout.html';});
    document.querySelector('#qty-minus')?.addEventListener('click', () => { const el=document.querySelector('#modal-qty'); el.value=Math.max(1,(Number(el.value)||1)-1); });
    document.querySelector('#qty-plus')?.addEventListener('click', () => { const el=document.querySelector('#modal-qty'); el.value=Math.min(20,(Number(el.value)||1)+1); });
  });

  window.Venari = { products, card, esc, money, read, write, toast };
})();