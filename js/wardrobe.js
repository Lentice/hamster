// 換裝畫面

(() => {
  const look = save.look;
  let currentCat = 'species';
  let idleTimer = null;
  let dozing = false;
  let lastActive = performance.now();

  const stage = $('#stage');
  const tabs = $('#tabs');
  const grid = $('#grid');
  const nameInput = $('#name');

  const stagePet = () => $('.pet-svg', stage);

  // 「全部 / 已擁有」篩選：東西多了以後比較好找自己的
  let ownOnly = false;
  try { ownOnly = localStorage.getItem('hamster-own-only') === '1'; } catch { /* 忽略 */ }
  const filter = html('<div class="own-filter" role="group" aria-label="篩選"></div>');
  grid.before(filter);
  filter.addEventListener('click', (e) => {
    const b = e.target.closest('[data-own]');
    if (!b) return;
    ownOnly = b.dataset.own === 'mine';
    try { localStorage.setItem('hamster-own-only', ownOnly ? '1' : '0'); } catch { /* 忽略 */ }
    drawGrid();
    sfx.tab();
  });

  function drawStage() {
    const shown = dozing ? { ...look, expression: 'sleepy' } : look;
    stage.innerHTML = svgWrap(renderScene(shown, 'main'), '0 0 400 400', `scene pet-svg ${dozing ? 'dozing' : ''}`);
  }

  // 一次飄出好幾顆愛心
  function burst(n = 6) {
    const r = stage.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      setTimeout(() => floatText(stage, r.width * (0.25 + Math.random() * 0.5), r.height * (0.3 + Math.random() * 0.4),
        ['💗', '💕', '✨', '💖', '⭐'][Math.floor(Math.random() * 5)], 'emoji'), i * 70);
    }
  }

  function thumbFor(cat, item, i) {
    const p = `t-${cat.id}-${i}`;
    if (item.id === 'none') return `<div class="none-mark">✕</div>`;
    if (cat.id === 'background') return svgWrap(item.render(p), cat.view);
    if (cat.id === 'effect') return svgWrap(`<rect width="400" height="400" fill="#FFF6FA"/>${renderItem(item, p)}`, cat.view);
    const preview = { ...DEFAULT_LOOK, species: look.species, expression: look.expression, [cat.id]: item.id };
    // 臉部配件依物種平移，縮圖視窗也跟著移
    let view = cat.view;
    if (cat.face) {
      const [x, y, w, h] = view.split(' ').map(Number);
      const sp = byId(SPECIES, look.species);
      view = `${x} ${y + sp.dy} ${w} ${h}`;
    }
    return svgWrap(renderPet(preview, p), view);
  }

  function drawTabs() {
    tabs.innerHTML = CATEGORIES.map((c) => `
      <button class="tab ${c.id === currentCat ? 'active' : ''}" data-cat="${c.id}" role="tab" aria-selected="${c.id === currentCat}">
        <span class="tab-icon">${c.icon}</span><span class="tab-name">${c.name}</span>
      </button>`).join('') + `
      <button class="tab ${currentCat === 'outfits' ? 'active' : ''}" data-cat="outfits" role="tab" aria-selected="${currentCat === 'outfits'}">
        <span class="tab-icon">💾</span><span class="tab-name">我的搭配</span>
      </button>`;
  }

  // 我的搭配：最多存 3 套，點一下整套換上（沒擁有的部件會略過）
  const OUTFIT_SLOTS = 3;
  const outfits = () => (save.outfits ||= []);
  function drawOutfits() {
    filter.hidden = true;
    grid.innerHTML = Array.from({ length: OUTFIT_SLOTS }, (_, i) => {
      const o = outfits()[i];
      if (!o) return `<button class="item outfit-empty" data-outfit-save="${i}"><div class="thumb"><span class="diy-new-icon">＋</span></div><span class="item-name">存下現在的搭配</span></button>`;
      return `<button class="item outfit" data-outfit-wear="${i}"><div class="thumb">${petSvg({ ...o, background: 'none' })}</div><span class="item-name">搭配 ${i + 1}</span>
        <span class="diy-edit outfit-del" data-outfit-del="${i}" role="button" aria-label="刪除搭配">✕</span></button>`;
    }).join('') + '<p class="outfit-tip">點空格子存下現在的打扮，之後點一下就能整套換上！</p>';
  }

  function drawGrid() {
    if (currentCat === 'outfits') { drawOutfits(); return; }
    const cat = CATEGORIES.find((c) => c.id === currentCat);
    const diy = DIY_TEMPLATES[cat.id];
    const mine = cat.items.filter((item) => isOwned(cat.id, item));
    const hasLocked = mine.length < cat.items.length;
    filter.hidden = !hasLocked;
    filter.innerHTML = `<button class="${ownOnly ? '' : 'on'}" data-own="all">全部 ${cat.items.length}</button><button class="${ownOnly ? 'on' : ''}" data-own="mine">✔ 已擁有 ${mine.length}</button>`;
    const shown = ownOnly && hasLocked ? mine : cat.items;
    // 正在穿的就不算新的了（商店買完會直接穿上）
    const wornKey = itemKey(cat.id, look[cat.id]);
    if (save.fresh?.[wornKey]) { delete save.fresh[wornKey]; persist(); }
    grid.innerHTML = (diy ? `<button class="item diy-new" data-diy-new="${cat.id}" title="自己畫">
        <div class="thumb"><span class="diy-new-icon">🎨</span></div><span class="item-name">自己畫${diy.name}</span></button>` : '') + shown.map((item, i) => {
      const owned = isOwned(cat.id, item);
      return `<button class="item ${look[cat.id] === item.id ? 'selected' : ''} ${owned ? '' : 'locked'}" data-id="${item.id}" title="${escapeXml(item.name)}">
        <div class="thumb">${thumbFor(cat, item, i)}</div>
        <span class="item-name">${escapeXml(item.name)}</span>${save.fresh?.[itemKey(cat.id, item.id)] ? '<span class="fresh-tag">NEW</span>' : ''}${item.diy ? `<span class="diy-edit" data-diy-edit="${item.id}" role="button" aria-label="修改作品">✏️</span>` : ''}
        ${owned ? '' : `<span class="price-tag">${item.boxOnly ? (item.currency === 'moon' ? '☾ 月亮盲盒' : '🎁 普通盲盒') : `${itemCurrencyIcon(item)} ${item.price}`}</span>`}
      </button>`;
    }).join('');
  }

  function redraw() {
    drawStage();
    drawGrid();
    persist();
  }

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    currentCat = btn.dataset.cat;
    drawTabs();
    drawGrid();
    sfx.tab();
  });

  grid.addEventListener('click', (e) => {
    const del = e.target.closest('[data-outfit-del]');
    if (del) { outfits()[del.dataset.outfitDel] = null; persist(); drawGrid(); sfx.tab(); return; }
    const sv = e.target.closest('[data-outfit-save]');
    if (sv) {
      const { name, ...rest } = look;
      outfits()[sv.dataset.outfitSave] = rest;
      persist(); drawGrid(); sfx.coin(); toast('存好了！之後點一下就能換上這套');
      return;
    }
    const wr = e.target.closest('[data-outfit-wear]');
    if (wr) {
      const o = outfits()[wr.dataset.outfitWear];
      let skipped = 0;
      for (const c of CATEGORIES) {
        if (!(c.id in o)) continue;
        const item = c.items.find((x) => x.id === o[c.id]);
        if (item && isOwned(c.id, item)) look[c.id] = item.id; else skipped++;
      }
      wake(); redraw();
      petAct(stagePet(), 'dance', 900); burst(10); sfx.pop();
      if (skipped) toast(`有 ${skipped} 件已經不見了，先略過`);
      return;
    }
    if (currentCat === 'outfits') return;
    const done = () => { drawStage(); drawGrid(); petAct(stagePet(), 'dance', 900); burst(10); };
    const edit = e.target.closest('[data-diy-edit]');
    if (edit) { openDiyEditor(currentCat, edit.dataset.diyEdit, done); return; }
    const neu = e.target.closest('[data-diy-new]');
    if (neu) { openDiyEditor(neu.dataset.diyNew, null, done); return; }
    const btn = e.target.closest('.item');
    if (!btn) return;
    const cat = CATEGORIES.find((c) => c.id === currentCat);
    const item = cat.items.find((x) => x.id === btn.dataset.id);
    // full：剛買的要整個格子重畫（拿掉價格、更新篩選數字）；換穿已有的只要換選取框，手機上比較順
    const wear = (full) => {
      wake();
      look[cat.id] = item.id;
      drawStage();
      if (full) drawGrid();
      else {
        $$('.item.selected', grid).forEach((el) => el.classList.remove('selected'));
        btn.classList.add('selected');
        const key = itemKey(cat.id, item.id);
        if (save.fresh?.[key]) { delete save.fresh[key]; $('.fresh-tag', btn)?.remove(); }
      }
      persist();
      petAct(stagePet(), ['spin', 'dance', 'hop'][Math.floor(Math.random() * 3)], 900);
      burst(item.price ? 10 : 5);
      sfx.pop();
    };
    if (isOwned(cat.id, item)) wear(false);
    else askBuy(cat.id, item, $('.thumb', btn).innerHTML, () => wear(true));
  });

  stage.addEventListener('click', (e) => {
    if (wake()) return;
    petAct(stagePet(), ['hop', 'wiggle', 'dance', 'stretch'][Math.floor(Math.random() * 4)], 900);
    sfx.squeak();
    const rect = stage.getBoundingClientRect();
    floatText(stage, e.clientX - rect.left, e.clientY - rect.top, ['💗', '💕', '✨', '🌻', '💖'][Math.floor(Math.random() * 5)], 'emoji');
  });

  $('#random').addEventListener('click', () => {
    for (const c of CATEGORIES) {
      const owned = c.items.filter((it) => isOwned(c.id, it));
      look[c.id] = owned[Math.floor(Math.random() * owned.length)].id;
    }
    redraw();
    petAct(stagePet(), 'spin', 600);
    sfx.pop();
  });

  $('#reset').addEventListener('click', () => {
    Object.assign(look, { ...DEFAULT_LOOK, species: look.species, name: look.name, background: look.background });
    redraw();
    sfx.tab();
  });

  nameInput.addEventListener('input', () => {
    look.name = nameInput.value;
    drawStage();
    persist();
  });

  $('#save-img').addEventListener('click', async () => {
    try {
      const img = await svgToImage(svgWrap(renderScene(look, 'export'), '0 0 400 400'));
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1000;
      canvas.getContext('2d').drawImage(img, 0, 0, 1000, 1000);
      const a = document.createElement('a');
      a.download = `${look.name.trim() || byId(SPECIES, look.species).name}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      stage.appendChild(html('<div class="flash"></div>'));
      setTimeout(() => $('.flash', stage)?.remove(), 500);
      sfx.coin();
    } catch {
      toast('存圖失敗了，請用網址開啟遊戲（GitHub Pages 或本機伺服器）再試一次');
    }
  });

  // 待機時常常做小動作；拿著東西會啃一啃；太久沒理牠會打瞌睡
  function idle() {
    idleTimer = setTimeout(idle, 2200 + Math.random() * 2600);
    if (dozing) return;
    if (performance.now() - lastActive > 40000) {
      dozing = true;
      drawStage();
      return;
    }
    const acts = ['hop', 'wiggle', 'tilt', 'wave', 'look', 'dance', 'stretch'];
    if (look.held !== 'none') acts.push('nibble', 'nibble');
    const act = acts[Math.floor(Math.random() * acts.length)];
    petAct(stagePet(), act, act === 'look' ? 1600 : 1200);
  }

  function wake() {
    lastActive = performance.now();
    if (!dozing) return false;
    dozing = false;
    drawStage();
    petAct(stagePet(), 'hop', 600);
    sfx.squeak();
    return true;
  }

  // 臉跟著游標轉
  window.addEventListener('pointermove', (e) => {
    if (currentScreen !== 'wardrobe') return;
    if (performance.now() - lastActive > 1000 && dozing) wake();
    lastActive = performance.now();
    const svg = stagePet();
    if (!svg) return;
    const r = stage.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height * 0.55)) / (r.height / 2);
    const k = (v, m) => Math.max(-m, Math.min(m, v * m));
    svg.style.setProperty('--fx', `${k(dx, 9)}px`);
    svg.style.setProperty('--fy', `${k(dy, 6)}px`);
    svg.style.setProperty('--hx', `${k(dx, 4)}px`);
    svg.style.setProperty('--hy', `${k(dy, 2)}px`);
  });

  SCREENS.wardrobe = {
    enter() {
      nameInput.value = look.name;
      drawTabs();
      redraw();
      lastActive = performance.now();
      dozing = false;
      idleTimer = setTimeout(idle, 1500);
    },
    leave() {
      clearTimeout(idleTimer);
    },
  };
})();
