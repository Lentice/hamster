// 公園新攤位小遊戲：疊疊蛋糕、鼠鼠音樂會、池塘釣魚、戳泡泡

Object.assign(GAMES, {
  stack: { name: '疊疊蛋糕', icon: '🎂', desc: '蛋糕會左右滑動，按空白鍵或點畫面放下去！<br>對得越準疊越高，完全對齊有額外加分！', start: startStack },
  music: { name: '鼠鼠音樂會', icon: '🎵', desc: '仔細聽鼠鼠彈的旋律，照順序按出一樣的音！<br>每過一關旋律就多一個音。', start: startMusic },
  fish: { name: '池塘釣魚', icon: '🎣', desc: '左右移動鼠鼠，按空白鍵或點畫面放下魚鉤！<br>金魚最值錢，小心別釣到舊靴子。', start: startFish },
  bubble: { name: '戳泡泡', icon: '🫧', desc: '只戳和題目一樣顏色的泡泡！彩虹泡泡永遠加分，<br>戳錯顏色會扣分喔。', start: startBubble },
});

// 把指標位置換成畫布座標
function canvasPoint(cv, e) {
  const r = cv.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * cv.width) / r.width, y: ((e.clientY - r.top) * cv.height) / r.height };
}

function roundRect(cx, x, y, w, h, r) {
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y, x + w, y + h, r);
  cx.arcTo(x + w, y + h, x, y + h, r);
  cx.arcTo(x, y + h, x, y, r);
  cx.arcTo(x, y, x + w, y, r);
  cx.closePath();
}

// ───────────────────────── 疊疊蛋糕 ─────────────────────────

async function startStack(area, ctl) {
  const W = 600, H = 720, LH = 44;
  const CAKES = [['#FFD1DC', '#FF8FA3'], ['#FFF1B8', '#F2C94C'], ['#CDEFD9', '#7CC8A0'], ['#D9E4FF', '#8FA8E8'], ['#F3D9FF', '#C08FE0'], ['#FFE0C7', '#F0A070']];
  area.innerHTML = `<div class="game-hud"><span>🎂 <b class="h-score">0</b> 層</span><span>✨ 完美 <b class="h-perfect">0</b></span></div>
    <canvas class="game-canvas stack-canvas" width="${W}" height="${H}"></canvas>
    <p class="game-tip">⌨️ 空白鍵 / Enter　👆 點畫面放下蛋糕</p>`;
  const cv = $('canvas', area), cx = cv.getContext('2d');
  const petImg = await svgToImage(petSvg({ ...save.look, background: 'none', effect: 'none' }));
  if (ctl.isStopped()) return;
  const layers = [{ x: W / 2 - 150, w: 300 }];
  let cur = null, perfect = 0, cam = 0, over = false, last = performance.now();
  const crumbs = [];

  function next() {
    const top = layers[layers.length - 1];
    const speed = Math.min(520, 200 + layers.length * 14);
    cur = { x: Math.random() < 0.5 ? -top.w : W, w: top.w, dir: 1, speed };
    if (cur.x > 0) cur.dir = -1;
  }
  function drop() {
    if (over || !cur) return;
    const top = layers[layers.length - 1];
    let x = cur.x, w = cur.w;
    const left = Math.max(x, top.x), right = Math.min(x + w, top.x + top.w);
    if (right - left <= 4) {
      over = true;
      sfx.bad();
      crumbs.push({ x: cur.x, w: cur.w, y: layers.length, vy: 0, c: layers.length });
      cur = null;
      setTimeout(() => ctl.finish(score(), Math.min(90, score() * 2)), 1000);
      return;
    }
    if (Math.abs(x - top.x) <= 10) {
      x = top.x; w = top.w; perfect++;
      sfx.coin();
      floatAt('完美！', 'coin-pop');
    } else {
      // 切掉的部分掉下去
      const cutX = x < top.x ? x : right, cutW = w - (right - left);
      crumbs.push({ x: cutX, w: cutW, y: layers.length, vy: 0, c: layers.length });
      x = left; w = right - left;
      sfx.pop();
    }
    layers.push({ x, w });
    $('.h-score', area).textContent = layers.length - 1;
    $('.h-perfect', area).textContent = perfect;
    next();
  }
  const score = () => layers.length - 1 + perfect;
  function floatAt(text, cls) {
    const r = cv.getBoundingClientRect(), ar = area.getBoundingClientRect();
    floatText(area, r.left - ar.left + r.width / 2, r.top - ar.top + r.height * 0.3, text, cls);
  }

  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); drop(); });
  const onKey = (e) => {
    if (gamePaused() && e.type === 'keydown') return; // 「確定離開？」開著時暫停
    if ([' ', 'Enter', 'ArrowDown'].includes(e.key)) { e.preventDefault(); if (!e.repeat) drop(); }
  };
  window.addEventListener('keydown', onKey);
  ctl.onStop(() => window.removeEventListener('keydown', onKey));

  const layerY = (i) => H - 60 - (i + 1) * LH + cam;
  function drawLayer(x, y, w, i) {
    const [base, top] = CAKES[i % CAKES.length];
    cx.fillStyle = base;
    cx.strokeStyle = '#5A3E36';
    cx.lineWidth = 4;
    roundRect(cx, x, y, w, LH, 10);
    cx.fill(); cx.stroke();
    // 奶油滴
    cx.fillStyle = top;
    cx.beginPath();
    cx.moveTo(x + 4, y + 4);
    for (let px = x + 4; px < x + w - 4; px += 22) {
      cx.quadraticCurveTo(px + 5, y + 20, px + 11, y + 12);
      cx.quadraticCurveTo(px + 16, y + 6, Math.min(px + 22, x + w - 4), y + 4);
    }
    cx.lineTo(x + w - 4, y + 4);
    cx.closePath();
    cx.fill();
    if (w > 40) { cx.fillStyle = '#fff'; cx.globalAlpha = 0.6; cx.fillRect(x + 12, y + 28, Math.min(30, w / 4), 5); cx.globalAlpha = 1; }
  }

  next();
  function frame(t) {
    if (ctl.isStopped()) return;
    const dt = gamePaused() ? 0 : Math.min(0.05, (t - last) / 1000);
    last = t;
    if (cur) {
      cur.x += cur.dir * cur.speed * dt;
      if (cur.x > W - cur.w * 0.25) cur.dir = -1;
      if (cur.x < -cur.w * 0.75) cur.dir = 1;
    }
    const want = Math.max(0, (layers.length - 8) * LH);
    cam += (want - cam) * Math.min(1, dt * 5);

    const g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFE9F1'); g.addColorStop(1, '#E6F4FF');
    cx.fillStyle = g;
    cx.fillRect(0, 0, W, H);
    // 盤子
    cx.fillStyle = '#fff'; cx.strokeStyle = '#5A3E36'; cx.lineWidth = 4;
    cx.beginPath(); cx.ellipse(W / 2, H - 50 + cam, 210, 22, 0, 0, Math.PI * 2); cx.fill(); cx.stroke();
    layers.forEach((l, i) => drawLayer(l.x, layerY(i), l.w, i));
    for (const c of crumbs) {
      c.vy += 1400 * dt;
      c.fall = (c.fall || 0) + c.vy * dt;
      drawLayer(c.x, layerY(c.y) + c.fall, c.w, c.c);
    }
    if (cur) drawLayer(cur.x, layerY(layers.length), cur.w, layers.length);
    // 鼠鼠站在最上層
    const topL = layers[layers.length - 1];
    const pw = 110, ph = pw * (petImg.height / petImg.width);
    const py = cur ? layerY(layers.length) - ph + 4 : layerY(layers.length - 1) - ph + 8;
    cx.drawImage(petImg, Math.max(0, Math.min(W - pw, topL.x + topL.w / 2 - pw / 2)), Math.min(py, layerY(layers.length - 1) - ph + 8), pw, ph);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ───────────────────────── 鼠鼠音樂會 ─────────────────────────

function startMusic(area, ctl) {
  const PADS = [
    { icon: '🌸', color: '#FF9DB5', freq: 523 },
    { icon: '🍀', color: '#8FD6A8', freq: 659 },
    { icon: '⭐', color: '#FFD45C', freq: 784 },
    { icon: '💧', color: '#8FC4F5', freq: 1047 },
  ];
  const KEYS = [['1', 'ArrowLeft', 'a'], ['2', 'ArrowUp', 'w'], ['3', 'ArrowDown', 's'], ['4', 'ArrowRight', 'd']];
  area.innerHTML = `<div class="game-hud"><span>🎵 第 <b class="h-score">1</b> 關</span></div>
    <div class="music-stage"><div class="music-pet">${petSvg({ ...save.look, background: 'none' })}</div><p class="music-say">仔細聽喔～</p></div>
    <div class="music-pads">${PADS.map((p, i) => `<button class="music-pad" data-i="${i}" style="--c:${p.color}" disabled><span>${p.icon}</span><kbd>${i + 1}</kbd></button>`).join('')}</div>
    <p class="game-tip">🖱️ 點按鈕　⌨️ 1 2 3 4 或 ← ↑ ↓ →</p>`;
  const pads = $$('.music-pad', area), say = $('.music-say', area), pet = $('.music-pet', area);
  const seq = [];
  let pos = 0, listening = false, round = 0;
  const timers = [];
  const later = (f, ms) => timers.push(setTimeout(() => { if (!ctl.isStopped()) f(); }, ms));
  ctl.onStop(() => timers.forEach(clearTimeout));

  function light(i, ms = 320) {
    const p = pads[i];
    p.classList.add('lit');
    pet.classList.remove('bop'); void pet.offsetWidth; pet.classList.add('bop');
    tone(PADS[i].freq, ms / 1000, 'triangle', 0.14, 1);
    setTimeout(() => p.classList.remove('lit'), ms);
  }
  function play() {
    listening = false;
    pads.forEach((p) => { p.disabled = true; });
    seq.push(Math.floor(Math.random() * 4));
    round = seq.length;
    $('.h-score', area).textContent = round;
    say.textContent = '仔細聽喔～';
    const gap = Math.max(330, 620 - round * 22);
    seq.forEach((n, k) => later(() => light(n, gap * 0.7), 700 + k * gap));
    later(() => {
      listening = true; pos = 0;
      pads.forEach((p) => { p.disabled = false; });
      say.textContent = '換你彈囉！';
    }, 700 + seq.length * gap);
  }
  function press(i) {
    if (!listening) return;
    if (i !== seq[pos]) {
      listening = false;
      sfx.bad();
      pads[i].classList.add('wrong');
      say.textContent = '啊，彈錯了～';
      pads.forEach((p) => { p.disabled = true; });
      const score = round - 1;
      later(() => ctl.finish(score, Math.min(90, score * 5)), 1100);
      return;
    }
    light(i, 220);
    pos++;
    if (pos === seq.length) {
      listening = false;
      say.textContent = ['好棒！', '太厲害了！', '完美！', '再來！'][Math.floor(Math.random() * 4)];
      later(play, 900);
    }
  }
  area.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.music-pad');
    if (b && !b.disabled) { e.preventDefault(); press(Number(b.dataset.i)); }
  });
  const onKey = (e) => {
    if (gamePaused() && e.type === 'keydown') return; // 「確定離開？」開著時暫停
    const i = KEYS.findIndex((ks) => ks.includes(e.key) || ks.includes(e.key.toLowerCase()));
    if (i >= 0) { e.preventDefault(); if (!e.repeat) press(i); }
  };
  window.addEventListener('keydown', onKey);
  ctl.onStop(() => window.removeEventListener('keydown', onKey));
  later(play, 400);
}

// ───────────────────────── 池塘釣魚 ─────────────────────────

async function startFish(area, ctl) {
  const tall = innerHeight > innerWidth; // 直式手機用直的畫布，魚才不會太小
  const W = tall ? 520 : 800, H = tall ? 700 : 520, DURATION = 45, WATER = 150;
  const KINDS = [
    { e: '🐟', pts: 1, w: 5, speed: 90, size: 40 },
    { e: '🐠', pts: 2, w: 3, speed: 130, size: 42 },
    { e: '🐡', pts: 3, w: 2, speed: 70, size: 46 },
    { e: '🦐', pts: 2, w: 2, speed: 110, size: 34 },
    { e: '👑', pts: 5, w: 1, speed: 170, size: 40, gold: true },
    { e: '🥾', pts: -2, w: 2, speed: 50, size: 40 },
  ];
  area.innerHTML = `${hudHtml()}<canvas class="game-canvas" width="${W}" height="${H}"></canvas>
    <p class="game-tip">⌨️ ← → 移動、空白鍵放魚鉤　👆 點水面就在那裡釣</p>`;
  const cv = $('canvas', area), cx = cv.getContext('2d');
  const petImg = await svgToImage(petSvg({ ...save.look, background: 'none', effect: 'none' }));
  if (ctl.isStopped()) return;
  const keys = {};
  const me = { x: W / 2, tx: null };
  const hook = { state: 'idle', y: 0, fish: null };
  let fishes = [], score = 0, time = DURATION, last = performance.now(), spawn = 0;
  const pick = () => {
    let r = Math.random() * KINDS.reduce((s, k) => s + k.w, 0);
    return KINDS.find((k) => (r -= k.w) < 0) || KINDS[0];
  };
  function addFish() {
    const k = pick(), dir = Math.random() < 0.5 ? 1 : -1;
    fishes.push({ k, dir, x: dir > 0 ? -40 : W + 40, y: WATER + 60 + Math.random() * (H - WATER - 100), wob: Math.random() * 6 });
  }
  for (let i = 0; i < 6; i++) { addFish(); fishes[i].x = 60 + Math.random() * (W - 120); }
  function cast() { if (hook.state === 'idle') { hook.state = 'down'; hook.y = WATER - 30; sfx.pop(); } }

  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const p = canvasPoint(cv, e);
    if (hook.state !== 'idle') return;
    me.tx = p.x;
    hook.autoCast = true;
  });
  const onKey = (e) => {
    if (gamePaused() && e.type === 'keydown') return; // 「確定離開？」開著時暫停
    if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) { keys[e.key.toLowerCase().replace('arrow', '')] = e.type === 'keydown'; e.preventDefault(); me.tx = null; }
    if (e.type === 'keydown' && [' ', 'ArrowDown', 'Enter'].includes(e.key)) { e.preventDefault(); if (!e.repeat) cast(); }
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  ctl.onStop(() => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); });

  function frame(t) {
    if (ctl.isStopped()) return;
    const dt = gamePaused() ? 0 : Math.min(0.05, (t - last) / 1000);
    last = t;
    time -= dt;
    $('.h-time', area).textContent = Math.max(0, Math.ceil(time));
    if (hook.state === 'idle') {
      const dir = (keys.right || keys.d ? 1 : 0) - (keys.left || keys.a ? 1 : 0);
      if (dir) me.x += dir * 320 * dt;
      if (me.tx != null) {
        const d = me.tx - me.x;
        me.x += Math.sign(d) * Math.min(Math.abs(d), 420 * dt);
        if (Math.abs(d) < 3) { me.tx = null; if (hook.autoCast) { hook.autoCast = false; cast(); } }
      }
      me.x = Math.max(60, Math.min(W - 60, me.x));
    }
    if (hook.state === 'down') {
      hook.y += (tall ? 420 : 330) * dt; // 直式池塘比較深，魚鉤快一點
      const hit = fishes.find((f) => Math.abs(f.x - me.x) < f.k.size * 0.7 && Math.abs(f.y - hook.y) < f.k.size * 0.5);
      if (hit) { hook.fish = hit; fishes = fishes.filter((f) => f !== hit); hook.state = 'up'; }
      else if (hook.y > H - 20) hook.state = 'up';
    } else if (hook.state === 'up') {
      hook.y -= (hook.fish ? 300 : 420) * dt;
      if (hook.y <= WATER - 30) {
        if (hook.fish) {
          const p = hook.fish.k.pts;
          score = Math.max(0, score + p);
          $('.h-score', area).textContent = score;
          const r = cv.getBoundingClientRect(), ar = area.getBoundingClientRect();
          floatText(area, r.left - ar.left + (me.x / W) * r.width, r.top - ar.top + (WATER / H) * r.height * 0.6, p > 0 ? `+${p}` : `${p} 靴子…`, p > 0 ? 'coin-pop' : 'bad-pop');
          p > 0 ? sfx.coin() : sfx.bad();
        }
        hook.fish = null; hook.state = 'idle';
      }
    }
    spawn -= dt;
    if (spawn <= 0 && fishes.length < (tall ? 11 : 9)) { addFish(); spawn = 0.8 + Math.random(); }
    for (const f of fishes) { f.x += f.dir * f.k.speed * dt; f.wob += dt * 4; }
    fishes = fishes.filter((f) => f.x > -60 && f.x < W + 60);

    // 畫面
    cx.fillStyle = '#CDEBFF'; cx.fillRect(0, 0, W, WATER);
    cx.fillStyle = '#A8DE8C'; cx.fillRect(0, WATER - 40, W, 40);
    const g = cx.createLinearGradient(0, WATER, 0, H);
    g.addColorStop(0, '#7FC8EE'); g.addColorStop(1, '#4F93C8');
    cx.fillStyle = g; cx.fillRect(0, WATER, W, H - WATER);
    cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.lineWidth = 3;
    for (let i = 0; WATER + 30 + i * 46 < H; i++) {
      const y = WATER + 30 + i * 46, o = (t / 30 + i * 50) % 80;
      cx.beginPath();
      for (let x = -80 + o; x < W; x += 80) { cx.moveTo(x, y); cx.quadraticCurveTo(x + 20, y - 6, x + 40, y); }
      cx.stroke();
    }
    // 碼頭
    cx.fillStyle = '#C99566'; cx.strokeStyle = '#5A3E36'; cx.lineWidth = 4;
    roundRect(cx, 20, WATER - 34, W - 40, 22, 8); cx.fill(); cx.stroke();
    cx.font = '40px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (const f of fishes) {
      cx.save();
      cx.translate(f.x, f.y + Math.sin(f.wob) * 4);
      if (f.dir > 0) cx.scale(-1, 1);
      cx.font = `${f.k.size}px serif`;
      if (f.k.gold) { cx.shadowColor = '#FFD54F'; cx.shadowBlur = 18; }
      cx.fillText(f.k.gold ? '🐟' : f.k.e, 0, 0);
      if (f.k.gold) { cx.font = '18px serif'; cx.fillText('✨', 0, -24); }
      cx.restore();
    }
    // 釣線與魚鉤
    const rodX = me.x + 46, rodY = WATER - 120;
    if (hook.state !== 'idle') {
      cx.strokeStyle = '#5A3E36'; cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(rodX, rodY); cx.lineTo(me.x, hook.y); cx.stroke();
      cx.font = '26px serif'; cx.fillText('🪝', me.x, hook.y + 6);
      if (hook.fish) { cx.font = `${hook.fish.k.size}px serif`; cx.fillText(hook.fish.k.gold ? '🐟' : hook.fish.k.e, me.x, hook.y + 30); }
    }
    const pw = 120, ph = pw * (petImg.height / petImg.width);
    cx.drawImage(petImg, me.x - pw / 2, WATER - 30 - ph, pw, ph);
    cx.strokeStyle = '#8A5A3C'; cx.lineWidth = 5;
    cx.beginPath(); cx.moveTo(me.x + 20, WATER - 60); cx.lineTo(rodX, rodY); cx.stroke();
    if (hook.state === 'idle') { cx.font = '22px serif'; cx.fillText('🪝', rodX, rodY + 18); }

    if (time <= 0) { ctl.finish(score, Math.min(90, score * 2)); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ───────────────────────── 戳泡泡 ─────────────────────────

function startBubble(area, ctl) {
  const tall = innerHeight > innerWidth; // 直式手機用直的畫布，泡泡才夠大好戳
  const W = tall ? 520 : 800, H = tall ? 760 : 520, DURATION = 40;
  const COLORS = [
    { id: 'pink', name: '粉紅', c: '#FF9DB5' }, { id: 'blue', name: '天藍', c: '#86C5F2' },
    { id: 'mint', name: '薄荷', c: '#86D9B0' }, { id: 'yellow', name: '奶油黃', c: '#FFD45C' },
    { id: 'purple', name: '薰衣草', c: '#C3A3F0' },
  ];
  area.innerHTML = `${hudHtml('<span class="bubble-target">戳 <i></i> <b class="h-target"></b></span>')}<canvas class="game-canvas bubble-canvas" width="${W}" height="${H}"></canvas>
    <p class="game-tip">🖱️ 👆 點泡泡　🌈 彩虹泡泡 +3</p>`;
  const cv = $('canvas', area), cx = cv.getContext('2d');
  let bubbles = [], pops = [], score = 0, time = DURATION, last = performance.now(), spawn = 0, target = null, switchAt = 0;
  function newTarget() {
    const options = COLORS.filter((c) => c !== target);
    target = options[Math.floor(Math.random() * options.length)];
    $('.h-target', area).textContent = `${target.name}泡泡`;
    $('.bubble-target i', area).style.background = target.c;
    $('.bubble-target', area).classList.remove('bump'); void area.offsetWidth; $('.bubble-target', area).classList.add('bump');
  }
  newTarget();
  switchAt = DURATION - 9;
  function addBubble() {
    const r = 26 + Math.random() * 24;
    const rainbow = Math.random() < 0.06;
    // 目標色出現機率高一點
    const col = rainbow ? null : Math.random() < 0.35 ? target : COLORS[Math.floor(Math.random() * COLORS.length)];
    bubbles.push({ x: r + Math.random() * (W - 2 * r), y: H + r, r, col, rainbow, vy: 60 + Math.random() * 60 + (DURATION - time) * 2, ph: Math.random() * 6 });
  }
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const p = canvasPoint(cv, e);
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if (Math.hypot(b.x - p.x, b.y - p.y) > b.r + 14) continue;
      bubbles.splice(i, 1);
      const add = b.rainbow ? 3 : b.col === target ? 1 : -1;
      score = Math.max(0, score + add);
      $('.h-score', area).textContent = score;
      pops.push({ x: b.x, y: b.y, r: b.r, t: 0, c: b.rainbow ? '#fff' : b.col.c });
      const r = cv.getBoundingClientRect(), ar = area.getBoundingClientRect();
      floatText(area, r.left - ar.left + (b.x / W) * r.width, r.top - ar.top + (b.y / H) * r.height, add > 0 ? `+${add}` : `${add}`, add > 0 ? 'coin-pop' : 'bad-pop');
      add > 0 ? sfx.pop() : sfx.bad();
      return;
    }
  });
  function drawBubble(b, t) {
    const x = b.x + Math.sin(t / 500 + b.ph) * 8;
    let fill;
    if (b.rainbow) {
      fill = cx.createLinearGradient(x - b.r, b.y - b.r, x + b.r, b.y + b.r);
      ['#FF9DB5', '#FFD45C', '#86D9B0', '#86C5F2', '#C3A3F0'].forEach((c, i) => fill.addColorStop(i / 4, c));
    } else fill = b.col.c;
    cx.globalAlpha = 0.85;
    cx.fillStyle = fill;
    cx.beginPath(); cx.arc(x, b.y, b.r, 0, Math.PI * 2); cx.fill();
    cx.globalAlpha = 1;
    cx.strokeStyle = '#fff'; cx.lineWidth = 3; cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,.8)';
    cx.beginPath(); cx.ellipse(x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.22, b.r * 0.13, -0.6, 0, Math.PI * 2); cx.fill();
  }
  function frame(t) {
    if (ctl.isStopped()) return;
    const dt = gamePaused() ? 0 : Math.min(0.05, (t - last) / 1000);
    last = t;
    time -= dt;
    $('.h-time', area).textContent = Math.max(0, Math.ceil(time));
    if (time < switchAt) { newTarget(); switchAt -= 9; sfx.squeak(); }
    spawn -= dt;
    if (spawn <= 0) { addBubble(); spawn = Math.max(0.22, 0.6 - (DURATION - time) * 0.008); }
    for (const b of bubbles) b.y -= b.vy * dt;
    bubbles = bubbles.filter((b) => b.y > -b.r - 10);
    const g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#EAF6FF'); g.addColorStop(1, '#FFF0F6');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    for (const b of bubbles) drawBubble(b, t);
    for (const p of pops) {
      p.t += dt;
      cx.strokeStyle = p.c; cx.lineWidth = 4; cx.globalAlpha = Math.max(0, 1 - p.t * 3);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, d = p.r + p.t * 140;
        cx.beginPath(); cx.moveTo(p.x + Math.cos(a) * p.r * 0.8, p.y + Math.sin(a) * p.r * 0.8); cx.lineTo(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); cx.stroke();
      }
      cx.globalAlpha = 1;
    }
    pops = pops.filter((p) => p.t < 0.35);
    if (time <= 0) { ctl.finish(score, Math.min(90, score)); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
