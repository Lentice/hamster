// 我的家：多樓層、自由擺放家具。鼠鼠可以自由活動，也可以切換成自己操控。
// 房間座標系 1500x1000，家具以底部中心 (x, y) 定位。

(() => {
  const RW = 1500, RH = 1000;
  const FLOOR = { x0: 110, x1: 1390, y0: 560, y1: 970 };
  const PET_W = 230, AI_SPEED = 170, CTRL_SPEED = 300;
  const house = save.house;
  const room = $('#room');
  const inventory = $('#inventory');
  let editing = false;
  let control = false;
  let selected = null;
  let panel = 'furniture';
  let raf = 0, lastT = 0;
  let near = null;
  const keys = {};

  const pet = { x: 700, y: 820, tx: 700, ty: 820, state: 'idle', until: 0, use: null, el: null, expr: null, useEnds: false };

  const pct = (v, total) => `${(v / total) * 100}%`;
  const floor = () => house.floors[house.petFloor];
  const furnitureOf = (it) => byId(FURNITURE, it.id);
  const sizeOf = (it) => {
    const f = furnitureOf(it);
    const { w, h } = assetSize(f.img);
    const W = f.w * (it.size || 1);
    return { w: W, h: (W * h) / w };
  };
  const nextUid = () => Math.max(0, ...house.floors.flatMap((f) => f.items.map((i) => i.uid))) + 1;
  const floorName = (i) => `${i + 1}F`;

  // ───────────── 畫面 ─────────────

  function drawAll() {
    drawFloors();
    drawRoom();
    drawInventory();
    drawSelBar();
  }

  function drawFloors() {
    const n = house.floors.length;
    const price = FLOOR_PRICES[n];
    $('#floors').innerHTML = (price ? `<button class="floor-btn add" data-act="build">＋ 加蓋<br><small>${HAMSTER_COIN_ICON}${price}</small></button>` : '') +
      house.floors.map((f, i) => i).reverse().map((i) => `
        <button class="floor-btn ${i === house.petFloor ? 'active' : ''}" data-floor="${i}">${floorName(i)}${i === house.petFloor ? '<span>🐹</span>' : ''}</button>`).join('');
  }

  function drawRoom() {
    const bg = byId(ROOMS, floor().bg);
    room.style.backgroundImage = `url(${assetUrl(bg.img)})`;
    room.classList.toggle('editing', editing);
    room.innerHTML = `<div class="floor-tag">${floorName(house.petFloor)}</div>`;
    for (const it of floor().items) room.appendChild(furnitureEl(it));
    pet.el = html(`<div class="room-pet"></div>`);
    room.appendChild(pet.el);
    renderPetLook();
    refreshSlot();
    placePet();
  }

  function furnitureEl(it) {
    const f = furnitureOf(it);
    const el = html(`<img class="furniture ${it === selected ? 'selected' : ''}" src="${assetUrl(f.img)}" alt="${f.name}" draggable="false">`);
    el.dataset.uid = it.uid;
    placeFurniture(el, it);
    return el;
  }

  function placeFurniture(el, it) {
    const { w, h } = sizeOf(it);
    el.style.left = pct(it.x - w / 2, RW);
    el.style.top = pct(it.y - h, RH);
    el.style.width = pct(w, RW);
    el.style.zIndex = furnitureOf(it).flat ? 1 : Math.round(it.y);
    el.style.transform = it.flip ? 'scaleX(-1)' : '';
  }

  function renderPetLook() {
    const look = { ...save.look, expression: pet.expr || save.look.expression };
    const cls = pet.state === 'walk' ? 'walking' : pet.state === 'run' ? 'running' : '';
    pet.el.innerHTML = petSvg(look, cls) + `<div class="bubble tappable ${near && control ? 'show' : ''}">${bubbleText()}</div>`;
  }

  function bubbleText() {
    if (!near) return '';
    const f = furnitureOf(near);
    return `<span class="kb-only">按 <kbd>空白鍵</kbd> 或點一下：</span><span class="touch-only">👆 點這裡：</span>${USE[f.use].verb}${f.name}`;
  }

  function placePet() {
    const sp = byId(SPECIES, save.look.species);
    const w = PET_W * sp.scale;
    const h = (w * 340) / 400;
    pet.el.style.left = pct(pet.x - w / 2, RW);
    pet.el.style.top = pct(pet.y - h * 0.97, RH);
    pet.el.style.width = pct(w, RW);
    pet.el.style.zIndex = Math.round(pet.y + 2);
    pet.el.classList.toggle('hidden', pet.state === 'hide' || !!$('.slot-layer', room));
  }

  // 使用有 slot 的家具時，鼠鼠畫進家具的圖層：跑在滾輪圓筒裡、縮進門洞、窩進床裡
  function refreshSlot() {
    $('.slot-layer', room)?.remove();
    const it = pet.use;
    const f = it && furnitureOf(it);
    if (!f?.slot || !['run', 'busy'].includes(pet.state) || !floor().items.includes(it)) return;
    const s = f.slot;
    const { w, h } = sizeOf(it);
    const sp = byId(SPECIES, save.look.species);
    const pw = s.pw * (0.8 + 0.2 * sp.scale);
    const ph = (pw * w * 0.85) / h;
    const P = (v) => `${(v * 100).toFixed(2)}%`;
    const look = { ...save.look, expression: pet.expr || save.look.expression };
    const layer = html('<div class="slot-layer"></div>');
    Object.assign(layer.style, {
      left: pct(it.x - w / 2, RW), top: pct(it.y - h, RH), width: pct(w, RW), height: pct(h, RH),
      zIndex: Math.round(it.y) + 1, transform: it.flip ? 'scaleX(-1)' : '',
    });
    let inner = '';
    if (s.stripes) {
      const c = s.stripes;
      const bars = Array.from({ length: 12 }, (_, i) => `<rect x="${i * 12 - 12}" y="0" width="5" height="100" fill="#fff" opacity=".45"/>`).join('');
      inner += `<svg class="slot-stripes" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><clipPath id="drum-clip"><ellipse cx="${c.cx * 100}" cy="${c.cy * 100}" rx="${c.rx * 100}" ry="${c.ry * 100}"/></clipPath></defs>
        <g clip-path="url(#drum-clip)"><g class="stripe-move">${bars}</g></g></svg>`;
    }
    const petHtml = `<div class="slot-pet" style="left:${P(s.px - pw / 2)};top:${P(s.py - ph * 0.97)};width:${P(pw)}">${petSvg(look, pet.state === 'run' ? 'running' : '')}</div>`;
    inner += s.clip
      ? `<div class="slot-clip" style="clip-path:ellipse(${P(s.clip.rx)} ${P(s.clip.ry)} at ${P(s.clip.cx)} ${P(s.clip.cy)});-webkit-clip-path:ellipse(${P(s.clip.rx)} ${P(s.clip.ry)} at ${P(s.clip.cx)} ${P(s.clip.cy)})">${petHtml}</div>`
      : petHtml;
    // 前景：輪框或床緣蓋在鼠鼠前面
    const mask = s.ring
      ? `radial-gradient(ellipse ${P(s.ring.rx)} ${P(s.ring.ry)} at ${P(s.ring.cx)} ${P(s.ring.cy)}, transparent ${s.ring.inner * 100}%, #000 ${s.ring.inner * 100 + 3}%, #000 97%, transparent 100%)`
      : s.front ? `linear-gradient(to bottom, transparent ${s.front * 100}%, #000 ${s.front * 100 + 4}%)` : null;
    if (mask) inner += `<img class="slot-front" src="${assetUrl(f.img)}" alt="" draggable="false" style="mask-image:${mask};-webkit-mask-image:${mask}">`;
    if (s.zzz && pet.expr === 'sleepy') inner += `<div class="slot-zzz" style="left:${P(s.zzz[0])};top:${P(s.zzz[1])}">💤</div>`;
    layer.innerHTML = inner;
    room.appendChild(layer);
  }

  function drawInventory() {
    $$('.panel-tab').forEach((b) => b.classList.toggle('active', b.dataset.panel === panel));
    if (panel === 'furniture') {
      inventory.innerHTML = FURNITURE.map((f) => {
        const owned = isOwned('furniture', f);
        return `<button class="inv-item ${owned ? '' : 'locked'}" data-id="${f.id}">
          <img src="${assetUrl(f.img)}" alt="" loading="lazy"><span>${f.name}</span>${owned ? '' : `<em class="price-tag">${HAMSTER_COIN_ICON}${f.price}</em>`}</button>`;
      }).join('');
    } else {
      inventory.innerHTML = ROOMS.map((r) => {
        const owned = isOwned('rooms', r);
        return `<button class="inv-item wide ${floor().bg === r.id ? 'selected' : ''} ${owned ? '' : 'locked'}" data-id="${r.id}">
          <img src="${assetUrl(r.img)}" alt="" loading="lazy"><span>${r.name}</span>${owned ? '' : `<em class="price-tag">${HAMSTER_COIN_ICON}${r.price}</em>`}</button>`;
      }).join('');
    }
  }

  function drawSelBar() {
    $('#sel-bar').classList.toggle('has-sel', !!selected);
  }

  // ───────────── 樓層 ─────────────

  function goFloor(i, viaLadder = null) {
    if (i < 0 || i >= house.floors.length || i === house.petFloor) return;
    house.petFloor = i;
    selected = null;
    // 到了新樓層，從那層的梯子旁邊出現
    const ladder = floor().items.find((it) => furnitureOf(it).use === 'climb');
    const at = ladder || viaLadder;
    pet.x = at ? Math.min(FLOOR.x1, at.x + 90) : 750;
    pet.y = at ? Math.min(FLOOR.y1, Math.max(FLOOR.y0, at.y + 20)) : 820;
    pet.state = 'idle';
    pet.use = null;
    pet.expr = null;
    pet.useEnds = false;
    pet.until = performance.now() + 1200;
    persist();
    room.classList.remove('floor-change');
    void room.offsetWidth;
    room.classList.add('floor-change');
    drawAll();
    petAct($('.pet-svg', pet.el), 'hop', 500);
    sfx.squeak();
  }

  $('#floors').addEventListener('click', (e) => {
    const b = e.target.closest('.floor-btn');
    if (!b) return;
    if (b.dataset.act === 'build') {
      const n = house.floors.length;
      const fake = { id: `floor${n}`, name: `加蓋 ${floorName(n)}`, price: FLOOR_PRICES[n] };
      askBuy('floors', fake, '<div class="none-mark">🏗️</div>', () => {
        // 新樓層自帶梯子，下面那層沒有梯子就補一個
        const below = house.floors[n - 1];
        if (!below.items.some((it) => it.id === 'ladder')) below.items.push({ uid: nextUid(), id: 'ladder', x: 160, y: 700, flip: false, size: 1 });
        house.floors.push({ bg: 'wood', items: [{ uid: nextUid(), id: 'ladder', x: 160, y: 700, flip: false, size: 1 }] });
        persist();
        goFloor(n);
        toast(`${floorName(n)} 蓋好了！用梯子可以上下樓喔`);
      });
      return;
    }
    goFloor(Number(b.dataset.floor));
  });

  // 使用梯子：自己控制時問要上還是下，自由活動時隨機
  function climb(ladder) {
    const up = house.petFloor + 1 < house.floors.length, down = house.petFloor > 0;
    if (!up && !down) {
      toast('還沒有其他樓層～點左邊的「＋ 加蓋」蓋新的一層吧！');
      return;
    }
    // 彈窗開著時收不到放開按鍵，先放開，關掉彈窗後鼠鼠才不會自己一直走
    Object.keys(keys).forEach((k) => { keys[k] = false; });
    if (!control || !(up && down)) return goFloor(house.petFloor + (up && (!down || Math.random() < 0.5) ? 1 : -1), ladder);
    const m = modal(`<div class="game-intro"><div class="game-icon">🪜</div><h2>要去哪一層？</h2>
      <div class="modal-actions"><button class="btn btn-pink" data-d="1">⬆ 上樓 ${floorName(house.petFloor + 1)}</button>
      <button class="btn btn-blue" data-d="-1">⬇ 下樓 ${floorName(house.petFloor - 1)}</button></div></div>`, { cls: 'small' });
    m.box.addEventListener('click', (e) => {
      const d = e.target.closest('[data-d]')?.dataset.d;
      if (!d) return;
      m.close();
      goFloor(house.petFloor + Number(d), ladder);
    });
  }

  // ───────────── 佈置 ─────────────

  $('#edit-toggle').addEventListener('click', () => {
    editing = !editing;
    selected = null;
    $('#edit-toggle').textContent = editing ? '✅ 佈置完成' : '🔨 佈置房間';
    $('#edit-panel').classList.toggle('open', editing);
    drawAll();
    sfx.tab();
  });

  $('#control-toggle').addEventListener('click', () => {
    control = !control;
    $('#control-toggle').textContent = control ? '🐹 讓牠自由活動' : '🎮 我來控制';
    $('#control-hint').classList.toggle('show', control);
    stopUsing();
    room.focus();
    sfx.tab();
  });

  $$('.panel-tab').forEach((b) => b.addEventListener('click', () => {
    panel = b.dataset.panel;
    drawInventory();
    sfx.tab();
  }));

  inventory.addEventListener('click', (e) => {
    const b = e.target.closest('.inv-item');
    if (!b) return;
    if (panel === 'furniture') {
      const f = byId(FURNITURE, b.dataset.id);
      const add = () => {
        const it = { uid: nextUid(), id: f.id, x: 600 + Math.random() * 300, y: 760 + Math.random() * 120, flip: false, size: 1 };
        floor().items.push(it);
        selected = it;
        persist();
        drawAll();
        sfx.pop();
      };
      if (isOwned('furniture', f)) add();
      else askBuy('furniture', f, `<img src="${assetUrl(f.img)}" alt="">`, add);
    } else {
      const r = byId(ROOMS, b.dataset.id);
      const apply = () => {
        floor().bg = r.id;
        persist();
        drawRoom();
        drawInventory();
        sfx.pop();
      };
      if (isOwned('rooms', r)) apply();
      else askBuy('rooms', r, `<img src="${assetUrl(r.img)}" alt="">`, apply);
    }
  });

  $('#sel-bar').addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act || !selected) return;
    if (act === 'flip') selected.flip = !selected.flip;
    if (act === 'bigger') selected.size = Math.min(1.6, (selected.size || 1) + 0.15);
    if (act === 'smaller') selected.size = Math.max(0.55, (selected.size || 1) - 0.15);
    if (act === 'remove') {
      floor().items = floor().items.filter((i) => i !== selected);
      if (pet.use === selected) stopUsing();
      selected = null;
    }
    persist();
    drawRoom();
    drawSelBar();
    sfx.tab();
  });

  // 拖曳家具
  let drag = null;
  const toRoom = (e) => {
    const r = room.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * RW, y: ((e.clientY - r.top) / r.height) * RH };
  };

  room.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.furniture');
    if (editing && el) {
      const it = floor().items.find((i) => String(i.uid) === el.dataset.uid);
      selected = it;
      $$('.furniture', room).forEach((f) => f.classList.toggle('selected', f === el));
      drawSelBar();
      const p = toRoom(e);
      drag = { it, el, dx: it.x - p.x, dy: it.y - p.y };
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    // 手機沒有空白鍵：點提示泡泡就使用家具
    if (e.target.closest('.room-pet .bubble.show') && near) {
      startUse(near, performance.now());
      return;
    }
    if (e.target.closest('.room-pet')) {
      petAct($('.pet-svg', pet.el), 'hop', 500);
      sfx.squeak();
      const r = room.getBoundingClientRect();
      floatText(room, e.clientX - r.left, e.clientY - r.top, '💗', 'emoji');
      return;
    }
    if (editing) {
      selected = null;
      $$('.furniture', room).forEach((f) => f.classList.remove('selected'));
      drawSelBar();
      return;
    }
    // 點地板：走過去；點到可用的家具：走過去並使用；按住拖曳：一直跟著手指走
    const p = toRoom(e);
    const target = usableAt(p);
    stopUsing();
    if (target) walkTo(target.x + useSide(target), target.y + 30, target);
    else {
      walkTo(p.x, p.y);
      holding = true;
    }
  });
  let holding = false;

  // 點擊位置下有沒有可使用的家具（用家具的外框判斷）
  function usableAt(p) {
    return floor().items.filter((it) => furnitureOf(it).use).reverse().find((it) => {
      const { w, h } = sizeOf(it);
      return Math.abs(p.x - it.x) < w / 2 && p.y < it.y && p.y > it.y - h;
    });
  }

  room.addEventListener('pointermove', (e) => {
    if (holding && !drag && !editing) {
      const p = toRoom(e);
      [pet.tx, pet.ty] = clampFloor(p.x, p.y);
      if (pet.state !== 'walk') { pet.use = null; setState('walk'); }
      return;
    }
    if (!drag) return;
    const p = toRoom(e);
    drag.it.x = Math.max(40, Math.min(RW - 40, p.x + drag.dx));
    drag.it.y = Math.max(420, Math.min(RH, p.y + drag.dy));
    placeFurniture(drag.el, drag.it);
  });

  const endDrag = () => {
    holding = false;
    if (!drag) return;
    drag = null;
    persist();
  };
  room.addEventListener('pointerup', endDrag);
  room.addEventListener('pointercancel', endDrag);
  room.addEventListener('pointerleave', () => { holding = false; });

  // 鍵盤操控
  const onKey = (e) => {
    if (currentScreen !== 'home' || uiBlocked() || editing || !control) return;
    if (e.target.matches('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      keys[k] = e.type === 'keydown';
      if (e.type === 'keydown' && pet.state !== 'walk') stopUsing();
      e.preventDefault();
    }
    if (e.type === 'keydown' && (k === ' ' || k === 'enter')) {
      e.preventDefault();
      if (near) startUse(near, performance.now());
    }
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('blur', () => Object.keys(keys).forEach((k) => { keys[k] = false; }));

  // ───────────── 鼠鼠 AI ─────────────

  const clampFloor = (x, y) => [Math.max(FLOOR.x0, Math.min(FLOOR.x1, x)), Math.max(FLOOR.y0, Math.min(FLOOR.y1, y))];

  function setState(state, expr = null) {
    const changed = pet.state !== state || pet.expr !== expr;
    pet.state = state;
    pet.expr = expr;
    if (changed && pet.el) {
      renderPetLook();
      refreshSlot();
      placePet();
    }
  }

  function walkTo(x, y, use = null) {
    [pet.tx, pet.ty] = clampFloor(x, y);
    pet.use = use;
    setState('walk');
  }

  function stopUsing() {
    pet.use = null;
    pet.useEnds = false;
    if (pet.state !== 'idle') setState('idle');
    pet.until = performance.now() + 1200;
    if (pet.el) placePet();
  }

  const USE = {
    run: { ms: 6000, expr: 'smile', state: 'run', verb: '跑' },
    eat: { ms: 4000, expr: 'stuffed', state: 'busy', verb: '吃' },
    drink: { ms: 3000, expr: 'happy', state: 'busy', verb: '喝' },
    sleep: { ms: 7000, expr: 'sleepy', state: 'busy', verb: '睡' },
    hide: { ms: 3000, expr: null, state: 'hide', verb: '鑽' },
    roll: { ms: 2600, expr: 'smile', state: 'busy', act: 'spin', verb: '玩' },
    climb: { verb: '爬' },
  };
  const useSide = (it) => (['run', 'climb'].includes(furnitureOf(it).use) ? 0 : (Math.random() < 0.5 ? -1 : 1) * sizeOf(it).w * 0.15);

  function think(now) {
    if (now < pet.until) return;
    const usable = floor().items.filter((i) => furnitureOf(i).use);
    if (usable.length && Math.random() < 0.6) {
      const it = usable[Math.floor(Math.random() * usable.length)];
      // 自由活動時偶爾才爬樓梯
      if (furnitureOf(it).use === 'climb' && Math.random() < 0.6) { pet.until = now + 500; return; }
      walkTo(it.x + useSide(it), it.y + 30, it);
    } else {
      walkTo(FLOOR.x0 + Math.random() * (FLOOR.x1 - FLOOR.x0), FLOOR.y0 + Math.random() * (FLOOR.y1 - FLOOR.y0));
    }
  }

  function startUse(it, now) {
    const u = USE[furnitureOf(it).use];
    if (furnitureOf(it).use === 'climb') {
      setState('idle');
      climb(it);
      return;
    }
    pet.use = it;
    pet.x = it.x + (furnitureOf(it).use === 'run' ? 0 : pet.x - it.x > 0 ? 40 : -40);
    pet.state = null;
    setState(u.state, u.expr);
    if (u.act) petAct($('.pet-svg', pet.el), u.act, 900);
    pet.until = now + u.ms;
    pet.useEnds = true;
    placePet();
  }

  function arrive(now) {
    const it = pet.use;
    if (!it || !floor().items.includes(it)) {
      setState('idle');
      pet.until = now + 1500 + Math.random() * 2500;
      if (!control && Math.random() < 0.4) petAct($('.pet-svg', pet.el), ['wiggle', 'tilt', 'wave'][Math.floor(Math.random() * 3)], 800);
      return;
    }
    startUse(it, now);
  }

  function nearestUsable() {
    let best = null, bd = 1e9;
    for (const it of floor().items) {
      if (!furnitureOf(it).use) continue;
      const d = Math.hypot(pet.x - it.x, (pet.y - it.y) * 1.6);
      if (d < sizeOf(it).w * 0.5 + 70 && d < bd) { best = it; bd = d; }
    }
    return best;
  }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    if (uiBlocked()) return;

    // 自己操控
    let vx = 0, vy = 0;
    if (control && !editing) {
      vx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      vy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
    }
    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      [pet.x, pet.y] = clampFloor(pet.x + (vx / len) * CTRL_SPEED * dt, pet.y + (vy / len) * CTRL_SPEED * dt);
      if (pet.state !== 'walk') { pet.use = null; pet.useEnds = false; setState('walk'); }
      pet.tx = pet.x; pet.ty = pet.y;
      placePet();
    } else if (pet.state === 'walk') {
      const dx = pet.tx - pet.x, dy = pet.ty - pet.y;
      const d = Math.hypot(dx, dy);
      const step = (control ? CTRL_SPEED : AI_SPEED) * dt;
      if (d <= step) {
        pet.x = pet.tx;
        pet.y = pet.ty;
        arrive(t);
      } else {
        pet.x += (dx / d) * step;
        pet.y += (dy / d) * step;
      }
      placePet();
    } else if (pet.useEnds && t >= pet.until) {
      // 用完家具：從隧道另一頭出來
      if (pet.state === 'hide' && pet.use) pet.x = Math.min(FLOOR.x1, pet.use.x + sizeOf(pet.use).w * 0.45);
      pet.useEnds = false;
      pet.use = null;
      setState('idle');
      pet.until = t + 1500 + Math.random() * 2000;
      placePet();
    } else if (pet.state === 'idle' && !control) {
      think(t);
    }

    // 自己操控時，靠近家具顯示提示
    const n = control && pet.state !== 'busy' && pet.state !== 'run' && pet.state !== 'hide' ? nearestUsable() : null;
    if (n !== near) {
      near = n;
      const b = $('.bubble', pet.el);
      b.innerHTML = bubbleText();
      b.classList.toggle('show', !!near);
    }
  }

  SCREENS.home = {
    enter() {
      const name = save.look.name.trim();
      $('#home-title').textContent = name ? `${name}的家` : '鼠鼠的家';
      if (house.petFloor >= house.floors.length) house.petFloor = 0;
      pet.state = 'idle';
      pet.until = performance.now() + 800;
      drawAll();
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    },
    leave() {
      cancelAnimationFrame(raf);
      Object.keys(keys).forEach((k) => { keys[k] = false; });
    },
  };
})();
