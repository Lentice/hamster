// 出門玩：可以走動的公園地圖。方向鍵 / WASD 或點地面移動，靠近攤位按空白鍵互動。
// 世界座標 2400x1600，物件以底部中心 (x, y) 定位，依 y 排前後。

(() => {
  const WW = 2800, WH = 1900;
  const PET_W = 150, SPEED = 320;
  const viewport = $('#viewport');
  // 一次看到的世界寬度：手機畫面窄，就拉近一點
  const viewW = () => (viewport.clientWidth < 700 ? 620 : 1100);
  const world = $('#world');

  // r：碰撞半徑（0 = 可穿過）；act：互動
  const PROPS = [
    { img: 'o_home', x: 330, y: 400, w: 320, r: 95, act: 'home', label: '回家' },
    { img: 'o_shop', x: 820, y: 360, w: 320, r: 100, act: 'shop', label: '商店' },
    { img: 'o_booth_catch', x: 1420, y: 440, w: 330, r: 105, act: 'catch', label: '接瓜子' },
    { img: 'o_booth_runner', x: 2050, y: 380, w: 340, r: 110, act: 'runner', label: '跳跳跑酷' },
    { img: 'o_booth_wheel', x: 2450, y: 860, w: 380, r: 125, act: 'wheel', label: '滾輪衝刺' },
    { img: 'o_booth_whack', x: 2300, y: 1500, w: 340, r: 110, act: 'whack', label: '打地鼠' },
    { img: 'o_booth_memory', x: 1600, y: 1420, w: 380, r: 125, act: 'memory', label: '翻牌配對' },
    { img: 'o_booth_maze', x: 520, y: 1600, w: 360, r: 115, act: 'maze', label: '迷宮找瓜子' },
    { img: 'o_pond', x: 950, y: 1150, w: 460, r: 0, flat: true, block: { rx: 200, ry: 90, dy: -110 } },
    { img: 'o_bench', x: 1350, y: 900, w: 200, r: 55 },
    { img: 'o_tree', x: 110, y: 230, w: 280, r: 50 }, { img: 'o_tree', x: 580, y: 160, w: 260, r: 50 },
    { img: 'o_sakura', x: 1150, y: 200, w: 300, r: 50 }, { img: 'o_tree', x: 1720, y: 200, w: 280, r: 50 },
    { img: 'o_sakura', x: 2450, y: 260, w: 300, r: 50 }, { img: 'o_tree', x: 2700, y: 600, w: 260, r: 45 },
    { img: 'o_tree', x: 2650, y: 1250, w: 280, r: 50 }, { img: 'o_sakura', x: 2700, y: 1800, w: 300, r: 50 },
    { img: 'o_tree', x: 1950, y: 1820, w: 300, r: 50 }, { img: 'o_sakura', x: 1150, y: 1830, w: 300, r: 50 },
    { img: 'o_tree', x: 120, y: 1800, w: 290, r: 50 }, { img: 'o_tree', x: 90, y: 1000, w: 270, r: 50 },
    { img: 'o_sakura', x: 560, y: 820, w: 260, r: 50 }, { img: 'o_tree', x: 2000, y: 1100, w: 240, r: 45 },
    { img: 'o_tree', x: 1000, y: 700, w: 230, r: 45 },
    { img: 'o_bush', x: 700, y: 560, w: 150, r: 40 }, { img: 'o_bush', x: 1750, y: 640, w: 150, r: 40 },
    { img: 'o_bush', x: 1300, y: 1550, w: 150, r: 40 }, { img: 'o_bush', x: 260, y: 1250, w: 150, r: 40 },
    { img: 'o_bush', x: 2550, y: 1150, w: 150, r: 40 },
    { img: 'o_rock', x: 1650, y: 980, w: 120, r: 35 }, { img: 'o_rock', x: 2150, y: 1300, w: 120, r: 35 },
    { img: 'o_rock', x: 850, y: 1500, w: 110, r: 32 },
    { img: 'o_mushroom', x: 420, y: 1050, w: 110, r: 0 }, { img: 'o_mushroom', x: 2250, y: 620, w: 100, r: 0 },
    { img: 'o_mushroom', x: 1850, y: 1650, w: 100, r: 0 },
    { img: 'o_flowers', x: 1150, y: 620, w: 120, r: 0 }, { img: 'o_flowers', x: 1450, y: 1150, w: 120, r: 0 },
    { img: 'o_flowers', x: 700, y: 1400, w: 120, r: 0 }, { img: 'o_flowers', x: 2400, y: 1100, w: 120, r: 0 },
    { img: 'o_flowers', x: 2000, y: 1600, w: 120, r: 0 }, { img: 'o_flowers', x: 200, y: 640, w: 120, r: 0 },
    { img: 'o_flowers', x: 1850, y: 450, w: 120, r: 0 },
  ];
  const PATHS = [
    'M330 460 Q580 470 820 430 T1420 500 T2050 450',
    'M2050 450 Q2300 600 2450 920',
    'M1420 500 Q1550 950 1600 1480',
    'M2450 920 Q2400 1250 2300 1560 Q1950 1560 1600 1480',
    'M330 460 Q380 850 650 950 T1300 980 T1600 1480',
    'M650 950 Q480 1250 520 1660',
  ];
  const NPC_LINES = ['今天天氣真好～', '接瓜子攤位超好玩的！', '打地鼠的時候不要打到我喔！', '跑酷可以二段跳耶！', '迷宮裡有好多瓜子～', '我最喜歡葵花子了！', '你的打扮好可愛喔！', '翻牌我都記不住…', '滾輪要左右交替才會快喔！', '池塘裡好像有青蛙呱呱叫', '要不要一起玩？'];

  const player = { x: 420, y: 560, tx: null, ty: null, pendingAct: null, el: null, moving: false };
  const keys = {};
  let npcs = [];
  let seeds = [];
  let raf = 0, last = 0, cam = { x: 0, y: 0 }, built = false, near = null, stepT = 0;

  const solids = () => PROPS.filter((p) => p.r || p.block);
  const sizeOf = (p) => {
    const { w, h } = assetSize(p.img);
    return { w: p.w, h: (p.w * h) / w };
  };

  // ───────────── 建立地圖 ─────────────

  function build() {
    world.style.width = `${WW}px`;
    world.style.height = `${WH}px`;
    world.style.backgroundImage = `url(${assetUrl('ground_grass')})`;
    world.innerHTML = `<svg class="paths" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">
      <defs><pattern id="pathTex" width="420" height="420" patternUnits="userSpaceOnUse"><image href="${assetUrl('ground_path')}" width="420" height="420"/></pattern></defs>
      ${PATHS.map((d) => `<path d="${d}" fill="none" stroke="#E9D3A8" stroke-width="118" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#pathTex)" stroke-width="104" stroke-linecap="round"/>`).join('')}
    </svg>`;
    const tex = new Image();
    tex.onerror = () => $('#pathTex image', world)?.remove();
    tex.src = assetUrl('ground_path');
    for (const p of PROPS) {
      const { w, h } = sizeOf(p);
      const el = html(`<img class="prop ${p.act ? 'interactive' : ''}" src="${assetUrl(p.img)}" alt="" draggable="false">`);
      Object.assign(el.style, { left: `${p.x - w / 2}px`, top: `${p.y - h}px`, width: `${w}px`, zIndex: p.flat ? 1 : Math.round(p.y) });
      if (p.act) {
        el.dataset.act = p.act;
        const tag = html(`<div class="prop-label" data-act="${p.act}" style="left:${p.x}px;top:${p.y - h - 10}px">${p.label}</div>`);
        world.appendChild(tag);
      }
      p.el = el;
      world.appendChild(el);
    }
    player.el = html('<div class="walker player"></div>');
    world.appendChild(player.el);
    npcs = [[700, 700], [1250, 780], [1900, 900], [1150, 1420], [2150, 1150]].map(([x, y]) => {
      const n = { look: randomLook(), x, y, tx: null, ty: null, wait: Math.random() * 3, el: html('<div class="walker npc"></div>'), bubble: 0 };
      n.home = { x: n.x, y: n.y };
      n.el.innerHTML = petSvg(n.look) + '<div class="bubble"></div>';
      world.appendChild(n.el);
      return n;
    });
    seeds = [];
    for (let i = 0; i < 14; i++) spawnSeed();
    built = true;
  }

  function freeSpot() {
    for (let k = 0; k < 40; k++) {
      const x = 120 + Math.random() * (WW - 240), y = 200 + Math.random() * (WH - 300);
      if (!blocked(x, y, 60)) return { x, y };
    }
    return { x: 1200, y: 800 };
  }

  function spawnSeed() {
    const { x, y } = freeSpot();
    const gold = Math.random() < 0.12;
    const el = html(`<img class="seed ${gold ? 'gold' : ''}" src="${assetUrl(gold ? 'g_seed_gold' : 'g_seed')}" alt="" draggable="false">`);
    Object.assign(el.style, { left: `${x - 18}px`, top: `${y - 40}px`, zIndex: Math.round(y) });
    world.appendChild(el);
    seeds.push({ x, y, gold, el });
  }

  // 碰撞：圓形或橢圓形的阻擋區
  function blocked(x, y, pad = 26) {
    if (x < 40 || x > WW - 40 || y < 120 || y > WH - 20) return true;
    for (const p of solids()) {
      if (p.block) {
        const dx = (x - p.x) / (p.block.rx + pad), dy = (y - (p.y + p.block.dy)) / (p.block.ry + pad);
        if (dx * dx + dy * dy < 1) return true;
      } else if (Math.hypot(x - p.x, (y - (p.y - 20)) * 1.4) < p.r + pad) return true;
    }
    return false;
  }

  function placeWalker(el, x, y, scale) {
    const w = PET_W * scale, h = (w * 340) / 400;
    Object.assign(el.style, { left: `${x - w / 2}px`, top: `${y - h * 0.97}px`, width: `${w}px`, zIndex: Math.round(y) + 1 });
  }

  const promptText = (p) => (p ? `<span class="kb-only">按 <kbd>空白鍵</kbd> 或點一下：</span><span class="touch-only">👆 點這裡：</span>${p.label}` : '');

  function renderPlayer() {
    player.el.innerHTML = petSvg(save.look, player.moving ? 'walking' : '') +
      `<div class="bubble tappable ${near ? 'show' : ''}">${promptText(near)}</div>`;
  }

  // ───────────── 互動 ─────────────

  function interact(act) {
    keysUp();
    if (act === 'home') return showScreen('home');
    if (act === 'shop') return showScreen('shop');
    if (GAMES[act]) openGame(act, () => viewport.focus());
  }

  function keysUp() { Object.keys(keys).forEach((k) => { keys[k] = false; }); }

  function nearestProp() {
    let best = null, bd = 1e9;
    for (const p of PROPS) {
      if (!p.act) continue;
      const d = Math.hypot(player.x - p.x, player.y - (p.y + 30));
      if (d < 170 && d < bd) { best = p; bd = d; }
    }
    return best;
  }

  const onKey = (e) => {
    if (currentScreen !== 'outdoor' || uiBlocked()) return;
    if (e.target.matches('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      keys[k] = e.type === 'keydown';
      player.tx = null;
      e.preventDefault();
    }
    if (e.type === 'keydown' && (k === ' ' || k === 'enter') && near) {
      e.preventDefault();
      interact(near.act);
    }
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('blur', keysUp);

  // 手指或滑鼠按住拖曳：目標跟著移動，鼠鼠一直走
  let holding = false;
  const toWorld = (e) => {
    const r = viewport.getBoundingClientRect();
    const s = r.width / viewW();
    return { x: cam.x + (e.clientX - r.left) / s, y: cam.y + (e.clientY - r.top) / s };
  };
  viewport.addEventListener('pointermove', (e) => {
    if (!holding || uiBlocked() || player.pendingAct) return;
    const p = toWorld(e);
    player.tx = p.x; player.ty = p.y;
  });
  const release = () => { holding = false; };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('pointerleave', release);

  viewport.addEventListener('pointerdown', (e) => {
    if (uiBlocked()) return;
    holding = true;
    viewport.focus();
    const r = viewport.getBoundingClientRect();
    const s = r.width / viewW();
    const x = cam.x + (e.clientX - r.left) / s, y = cam.y + (e.clientY - r.top) / s;
    if (e.target.closest('.walker.player .bubble.show') && near) {
      interact(near.act);
      return;
    }
    const actEl = e.target.closest('[data-act]');
    if (actEl) {
      const p = PROPS.find((q) => q.act === actEl.dataset.act);
      if (nearestProp() === p) {
        interact(p.act);
        return;
      }
      player.tx = p.x; player.ty = p.y + 60; player.pendingAct = p.act;
    } else if (e.target.closest('.walker.npc')) {
      const n = npcs.find((q) => q.el === e.target.closest('.walker.npc'));
      say(n);
    } else {
      player.tx = x; player.ty = y; player.pendingAct = null;
    }
  });

  function say(n) {
    const b = $('.bubble', n.el);
    b.textContent = NPC_LINES[Math.floor(Math.random() * NPC_LINES.length)];
    b.classList.add('show');
    n.bubble = 3;
    petAct($('.pet-svg', n.el), 'hop', 500);
    sfx.squeak();
  }

  // ───────────── 主迴圈 ─────────────

  function tryMove(o, dx, dy) {
    if (!blocked(o.x + dx, o.y + dy)) { o.x += dx; o.y += dy; return true; }
    if (!blocked(o.x + dx, o.y)) { o.x += dx; return true; }
    if (!blocked(o.x, o.y + dy)) { o.y += dy; return true; }
    return false;
  }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (uiBlocked()) return;

    // 玩家
    let vx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
    let vy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
    if (!vx && !vy && player.tx !== null) {
      const dx = player.tx - player.x, dy = player.ty - player.y, d = Math.hypot(dx, dy);
      if (d < 12) {
        player.tx = null;
        if (player.pendingAct) { const a = player.pendingAct; player.pendingAct = null; interact(a); }
      } else { vx = dx / d; vy = dy / d; }
    }
    const moving = !!(vx || vy);
    if (moving) {
      const len = Math.hypot(vx, vy);
      const ok = tryMove(player, (vx / len) * SPEED * dt, (vy / len) * SPEED * dt);
      if (!ok && player.tx !== null && !player.pendingAct) player.tx = null;
      stepT -= dt;
      if (stepT <= 0) { sfx.step(); stepT = 0.28; }
      player.el.style.setProperty('--lean', `${vx > 0 ? 5 : vx < 0 ? -5 : 0}deg`);
    }
    if (moving !== player.moving) { player.moving = moving; renderPlayer(); }
    placeWalker(player.el, player.x, player.y, byId(SPECIES, save.look.species).scale);

    // 撿瓜子
    for (let i = seeds.length - 1; i >= 0; i--) {
      const s = seeds[i];
      if (Math.hypot(s.x - player.x, s.y - player.y) < 50) {
        const n = s.gold ? 5 : 1;
        addCoins(n);
        sfx.coin();
        floatText(world, s.x, s.y - 60, `+${n} 🪙`, 'coin-pop');
        s.el.remove();
        seeds.splice(i, 1);
        setTimeout(() => { if (built) spawnSeed(); }, 6000 + Math.random() * 6000);
      }
    }

    // 其他鼠鼠閒晃
    for (const n of npcs) {
      if (n.tx === null) {
        n.wait -= dt;
        if (n.wait <= 0) {
          const a = Math.random() * Math.PI * 2, r = 80 + Math.random() * 200;
          n.tx = n.home.x + Math.cos(a) * r; n.ty = n.home.y + Math.sin(a) * r;
          $('.pet-svg', n.el).classList.add('walking');
        }
      } else {
        const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
        if (d < 8 || !tryMove(n, (dx / d) * 110 * dt, (dy / d) * 110 * dt)) {
          n.tx = null; n.wait = 2 + Math.random() * 4;
          $('.pet-svg', n.el).classList.remove('walking');
        }
      }
      placeWalker(n.el, n.x, n.y, byId(SPECIES, n.look.species).scale);
      const close = Math.hypot(n.x - player.x, n.y - player.y) < 140;
      if (close && n.bubble <= 0 && !n.greeted) { say(n); n.greeted = true; }
      if (!close) n.greeted = false;
      if (n.bubble > 0) { n.bubble -= dt; if (n.bubble <= 0) $('.bubble', n.el).classList.remove('show'); }
    }

    // 附近的攤位
    const np = nearestProp();
    if (player.pendingAct && np?.act === player.pendingAct) {
      const a = player.pendingAct;
      player.pendingAct = null;
      player.tx = null;
      interact(a);
      return;
    }
    if (np !== near) {
      near = np;
      const b = $('.bubble', player.el);
      if (b) {
        b.innerHTML = promptText(near);
        b.classList.toggle('show', !!near);
      }
      PROPS.forEach((p) => p.el?.classList.toggle('glow', p === near));
    }

    // 鏡頭
    const r = viewport.getBoundingClientRect();
    const s = r.width / viewW();
    const vw = viewW(), vh = r.height / s;
    const tx = Math.max(0, Math.min(WW - vw, player.x - vw / 2));
    const ty = Math.max(0, Math.min(WH - vh, player.y - vh / 2 - 40));
    cam.x += (tx - cam.x) * Math.min(1, dt * 6);
    cam.y += (ty - cam.y) * Math.min(1, dt * 6);
    world.style.transform = `scale(${s}) translate(${-cam.x}px, ${-cam.y}px)`;
  }

  SCREENS.outdoor = {
    enter() {
      if (!built) build();
      player.moving = false;
      near = null;
      renderPlayer();
      // 從家或商店出來時站在門口
      const r = viewport.getBoundingClientRect();
      const s = r.width / viewW();
      cam.x = Math.max(0, Math.min(WW - viewW(), player.x - viewW() / 2));
      cam.y = Math.max(0, Math.min(WH - r.height / s, player.y - r.height / s / 2));
      last = performance.now();
      raf = requestAnimationFrame(tick);
      viewport.focus();
    },
    leave() {
      cancelAnimationFrame(raf);
      keysUp();
      player.tx = null;
      player.pendingAct = null;
      if (near?.act === 'home' || near?.act === 'shop') { player.y = near.y + 90; }
    },
  };
})();
