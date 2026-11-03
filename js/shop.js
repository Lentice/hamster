// 商店：列出所有要花鼠鼠幣的東西

(() => {
  const SHOP_TABS = [
    { id: 'blindbox', name: '普通盲盒', icon: '🎁', kind: 'box', boxType: 'normal' },
    { id: 'rare', name: '月亮盲盒', icon: '☾', kind: 'box', boxType: 'moon' },
    ...CATEGORIES.filter((c) => c.items.some((it) => it.price && !it.boxOnly && it.currency !== 'moon'))
      .map((c) => ({ ...c, items: c.items.filter((it) => !it.boxOnly && it.currency !== 'moon'), kind: 'look' })),
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
      <button class="tab ${t.id === current ? 'active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === current}" tabindex="${t.id === current ? 0 : -1}" aria-controls="shop-grid"><span class="tab-icon">${t.icon}</span><span class="tab-name">${t.name}</span></button>`).join('');
    const tab = SHOP_TABS.find((t) => t.id === current);
    $('#shop-tools').hidden = tab.kind === 'box';
    if (tab.kind === 'box') {
      const box = BLIND_BOXES[tab.boxType];
      const pool = boxPool(tab.boxType);
      const all = boxItems(tab.boxType);
      const icon = itemCurrencyIcon(box);
      $('#shop-grid').innerHTML = `<div class="blindbox-intro">
        <div class="blindbox-icon">${tab.icon}</div><h3>${box.title}・${box.name}</h3>
        <p>每盒 ${icon} ${box.price} ${box.currencyName}，隨機獲得一件未擁有的${box.rarity}配飾。</p>
        <p>🍀 另外有 50% 機會附贈一袋鼠鼠幣！<br>${HAMSTER_COIN_ICON} ${box.bonusCoins[0]} 枚（30%）・${box.bonusCoins[1]} 枚（15%）・${box.bonusCoins[2]} 枚（5%）<br>配飾一定有，金幣是額外的小驚喜。</p>
        <p>不會重複！剩下 ${pool.length} / ${all.length} 件待收集。${pool.length ? `每件未擁有配飾的機率相同（1/${pool.length}）。` : '這一套已經全部收集完成囉！'}</p>
        <button class="btn btn-pink" id="open-blind-box" ${!pool.length || save[box.wallet] < box.price ? 'disabled' : ''}>${!pool.length ? '✔ 已集齊' : `${icon} ${box.price} 開${box.name}`}</button>
        ${pool.length && save[box.wallet] < box.price ? `<p class="warn">${box.currencyName}還差 ${box.price - save[box.wallet]} 枚，${tab.boxType === 'moon' ? '每天登入可領 12 枚月亮金幣喔！' : '去出門玩賺一些吧！'}</p>${tab.boxType === 'normal' ? '<button class="btn btn-blue" id="earn-coins">出門賺鼠鼠幣</button>' : ''}` : ''}
        <h3>盲盒裡有什麼？</h3></div>` + all.map(({ cat, item }, i) => `<div class="shop-item ${isOwned(cat.id, item) ? 'owned' : ''}">
          <div class="shop-thumb">${thumb(cat, item, i)}</div><div class="shop-name">${item.name}</div><div class="owned-tag">${isOwned(cat.id, item) ? '✔ 已擁有' : `${box.name}限定`}</div></div>`).join('');
      return;
    }
    const entries = byPrice(tab.items.filter((it) => it.price)).map((item) => ({ cat: tab, item }));
    // 收集進度（只算商店賣的東西）
    const got = entries.filter(({ cat, item }) => isOwned(cat.id, item)).length;
    const buyable = shopItemsOf(tab.id).length;
    const reward = save.collected?.[tab.id] ? '🏅 已集滿' : buyable ? `集滿送 ${COLLECT_REWARD}` : '';
    const progress = `<div class="collect-bar"><span>已收集 <b>${got}</b> / ${entries.length}</span><i style="--p:${entries.length ? (got / entries.length) * 100 : 0}%"></i><small>${reward}</small></div>`;
    const query = $('#shop-search').value.trim().toLowerCase(), filter = $('#shop-filter').value;
    const visible = entries.filter(({ cat, item }) => item.name.toLowerCase().includes(query)
      && (filter === 'all' || (!isOwned(cat.id, item) && (filter !== 'affordable' || item.price <= save[item.currency === 'moon' ? 'moonCoins' : 'coins']))));
    $('#shop-results').textContent = `找到 ${visible.length} / ${entries.length} 件商品`;
    $('#shop-grid').innerHTML = progress + visible.map(({ cat, item }, i) => {
      const owned = isOwned(cat.id, item);
      return `<div class="shop-item ${owned ? 'owned' : ''}" data-id="${item.id}" data-cat="${cat.id}">
        <div class="shop-thumb">${thumb(cat, item, i)}</div>
        <div class="shop-name">${item.name}</div>
        ${owned ? '<div class="owned-tag">✔ 已擁有</div>' : buyButton(item)}
      </div>`;
    }).join('') + (!visible.length ? '<div class="empty-state">這個條件還沒有商品。<br><button class="btn btn-gray" data-reset-shop>清除篩選</button><p>也可以到遊戲室賺些鼠鼠幣再回來！</p></div>' : '');
  }

  // 錢不夠時按鈕變灰，下面寫還差多少
  function buyButton(item) {
    const have = item.currency === 'moon' ? save.moonCoins : save.coins;
    const short = item.price - have;
    return `<button class="btn btn-pink btn-small buy-btn ${short > 0 ? 'short' : ''}">${itemCurrencyIcon(item)} ${item.price}</button>${short > 0 ? `<div class="short-tag">還差 ${short}</div>` : ''}`;
  }

  keyboardTabs($('#shop-tabs'), '[role=tab]');
  $('#shop-search').addEventListener('input', draw);
  $('#shop-filter').addEventListener('change', draw);
  $('#shop-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    current = b.dataset.tab;
    draw();
    sfx.tab();
  });

  $('#shop-grid').addEventListener('click', (e) => {
    if (e.target.closest('[data-reset-shop]')) { $('#shop-search').value = ''; $('#shop-filter').value = 'all'; draw(); $('#shop-search').focus(); return; }
    if (e.target.closest('#earn-coins')) { showScreen('outdoor'); return; }
    if (e.target.closest('#open-blind-box')) {
      const tab = SHOP_TABS.find((t) => t.id === current);
      const type = tab.boxType;
      const box = BLIND_BOXES[type];
      const pool = boxPool(type);
      if (!pool.length || save[box.wallet] < box.price) return;
      const m = modal(`<div class="buy-box"><div class="blindbox-icon">${tab.icon}</div><h3>打開${box.name}</h3><p>花 ${itemCurrencyIcon(box)} ${box.price} ${box.currencyName}，獲得一件隨機${box.rarity}配飾。</p><p>不會重複，每件未擁有配飾的機率都是 1/${pool.length}。</p><div class="modal-actions"><button class="btn btn-pink" id="confirm-box">打開看看！</button><button class="btn btn-gray" id="cancel-box">先不要</button></div></div>`, { cls: 'small' });
      $('#cancel-box', m.box).onclick = m.close;
      $('#confirm-box', m.box).onclick = () => {
        const button = $('#confirm-box', m.box);
        if (button.disabled) return;
        button.disabled = true;
        const prize = openBlindBox(type);
        m.close();
        draw();
        if (!prize) { toast(`目前無法開盒，請確認${box.currencyName}與收藏狀態。`); return; }
        setTimeout(() => sfx.win(), 900);
        const bonus = prize.bonusCoins ? `<div class="bonus-prize"><div class="reward-coins">${HAMSTER_COIN_ICON.repeat(3)}</div><h3>🍀 還有金幣小驚喜！</h3><p>額外獲得 <b>${HAMSTER_COIN_ICON} ${prize.bonusCoins} 枚鼠鼠幣</b><br>已經放進你的錢包囉！</p></div>` : '';
        // 先蓋一層搖晃的禮物盒動畫，約 1 秒後打開露出獎品
        const reveal = modal(`<div class="buy-box box-reveal"><div class="box-open-anim" aria-hidden="true"><span>${tab.icon}</span></div><h3>✨ 開出了「${prize.item.name}」！</h3><div class="buy-thumb">${thumb(prize.cat, prize.item, 0)}</div><p>已經放進你的衣櫃囉！</p>${bonus}<div class="modal-actions"><button class="btn btn-pink" id="wear-prize">馬上戴上</button><button class="btn btn-gray" id="keep-shopping">繼續逛商店</button></div></div>`, { cls: 'small' });
        $('#keep-shopping', reveal.box).onclick = reveal.close;
        $('#wear-prize', reveal.box).onclick = () => {
          save.look[prize.cat.id] = prize.item.id;
          persist();
          reveal.close();
          showScreen('wardrobe');
        };
      };
      return;
    }
    const card = e.target.closest('.shop-item');
    if (!card?.dataset.id || card.classList.contains('owned')) return;
    const tab = CATEGORIES.find((t) => t.id === card.dataset.cat) || SHOP_TABS.find((t) => t.id === current);
    const item = tab.items.find((x) => x.id === card.dataset.id);
    // 服裝配件：購買視窗裡試穿（配上現在的打扮）；家具、房間照舊用縮圖
    const isLook = CATEGORIES.some((c) => c.id === tab.id);
    const preview = isLook
      ? `<div class="try-on">${svgWrap(renderScene({ ...save.look, [tab.id]: item.id }, 'tryon'), '0 0 400 400', 'scene pet-svg')}<span>👀 試穿看看</span></div>`
      : $('.shop-thumb', card).innerHTML;
    askBuy(tab.id, item, preview, () => {
      draw();
      if (CATEGORIES.some((cat) => cat.id === tab.id)) {
        save.look[tab.id] = item.id;
        persist();
        toast('已經幫鼠鼠換上囉！');
      } else if (tab.id === 'furniture' || tab.id === 'rooms') {
        // 家具、房間買完問要不要馬上擺進家裡
        const m = modal(`<div class="buy-box"><h3>🎉 買到「${item.name}」了！</h3><div class="buy-thumb"><img src="${assetUrl(item.img)}" alt=""></div>
          <p>${tab.id === 'rooms' ? '要馬上把房間換成這個樣子嗎？' : '要馬上擺進房間嗎？'}</p>
          <div class="modal-actions"><button class="btn btn-pink" data-act="place">${tab.id === 'rooms' ? '🏠 馬上換上' : '🏠 擺進房間'}</button><button class="btn btn-gray" data-act="stay">繼續逛商店</button></div></div>`, { cls: 'small' });
        $('[data-act=stay]', m.box).onclick = m.close;
        $('[data-act=place]', m.box).onclick = () => { m.close(); placeFromShop(tab.id, item.id); };
      }
    });
  });

  SCREENS.shop = {
    enter: draw,
    openBox(type) {
      current = type === 'moon' ? 'rare' : 'blindbox';
      showScreen('shop');
      draw();
    },
  };
  saveListeners.push(() => {
    if (currentScreen === 'shop') draw();
  });
})();
