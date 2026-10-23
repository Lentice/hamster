// 商店：列出所有要花鼠鼠幣的東西

(() => {
  const SHOP_TABS = [
    ...CATEGORIES.filter((c) => c.items.some((it) => it.price)).map((c) => ({ ...c, kind: 'look' })),
    { id: 'furniture', name: '家具', icon: '🪑', items: FURNITURE, kind: 'furniture' },
    { id: 'rooms', name: '房間', icon: '🖼️', items: ROOMS, kind: 'room' },
  ];
  let current = SHOP_TABS[0].id;

  function thumb(tab, item, i) {
    if (tab.kind === 'furniture' || tab.kind === 'room') return `<img src="${assetUrl(item.img)}" alt="" loading="lazy">`;
    const p = `s-${tab.id}-${i}`;
    if (tab.id === 'background') return svgWrap(item.render(p), '0 0 400 400');
    if (tab.id === 'effect') return svgWrap(`<rect width="400" height="400" fill="#FFF6FA"/>${renderItem(item, p)}`);
    const sp = byId(SPECIES, save.look.species);
    let view = tab.view;
    if (tab.face) {
      const [x, y, w, h] = view.split(' ').map(Number);
      view = `${x} ${y + sp.dy} ${w} ${h}`;
    }
    return svgWrap(renderPet({ ...DEFAULT_LOOK, species: sp.id, [tab.id]: item.id }, p), view);
  }

  function draw() {
    $('#shop-tabs').innerHTML = SHOP_TABS.map((t) => `
      <button class="tab ${t.id === current ? 'active' : ''}" data-tab="${t.id}"><span class="tab-icon">${t.icon}</span><span class="tab-name">${t.name}</span></button>`).join('');
    const tab = SHOP_TABS.find((t) => t.id === current);
    $('#shop-grid').innerHTML = tab.items.filter((it) => it.price).map((item, i) => {
      const owned = isOwned(tab.id, item);
      return `<div class="shop-item ${owned ? 'owned' : ''}" data-id="${item.id}">
        <div class="shop-thumb">${thumb(tab, item, i)}</div>
        <div class="shop-name">${item.name}</div>
        ${owned ? '<div class="owned-tag">✔ 已擁有</div>' : `<button class="btn btn-pink btn-small buy-btn">🪙 ${item.price}</button>`}
      </div>`;
    }).join('');
  }

  $('#shop-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    current = b.dataset.tab;
    draw();
    sfx.tab();
  });

  $('#shop-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.shop-item');
    if (!card || card.classList.contains('owned')) return;
    const tab = SHOP_TABS.find((t) => t.id === current);
    const item = tab.items.find((x) => x.id === card.dataset.id);
    askBuy(tab.id, item, $('.shop-thumb', card).innerHTML, () => {
      draw();
      if (tab.kind === 'look') {
        save.look[tab.id] = item.id;
        persist();
        toast('已經幫鼠鼠換上囉！');
      }
    });
  });

  SCREENS.shop = { enter: draw };
})();
