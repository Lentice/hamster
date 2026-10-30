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
      </button>`).join('');
  }

  function drawGrid() {
    const cat = CATEGORIES.find((c) => c.id === currentCat);
    grid.innerHTML = cat.items.map((item, i) => {
      const owned = isOwned(cat.id, item);
      return `<button class="item ${look[cat.id] === item.id ? 'selected' : ''} ${owned ? '' : 'locked'}" data-id="${item.id}" title="${item.name}">
        <div class="thumb">${thumbFor(cat, item, i)}</div>
        <span class="item-name">${item.name}</span>
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
    const btn = e.target.closest('.item');
    if (!btn) return;
    const cat = CATEGORIES.find((c) => c.id === currentCat);
    const item = cat.items.find((x) => x.id === btn.dataset.id);
    const wear = () => {
      wake();
      look[cat.id] = item.id;
      redraw();
      petAct(stagePet(), ['spin', 'dance', 'hop'][Math.floor(Math.random() * 3)], 900);
      burst(item.price ? 10 : 5);
      sfx.pop();
    };
    if (isOwned(cat.id, item)) wear();
    else askBuy(cat.id, item, $('.thumb', btn).innerHTML, wear);
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
