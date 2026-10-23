// 更多小遊戲：打地鼠、跳跳跑酷、迷宮找瓜子

Object.assign(GAMES, {
  whack: { name: '打地鼠', icon: '🔨', desc: '地鼠探頭就快點牠！金色地鼠 +3，<br>不要打到探出頭來的鼠鼠朋友喔！', start: startWhack },
  runner: { name: '跳跳跑酷', icon: '🏃', desc: '按空白鍵 / ↑ / 點畫面跳躍（可以二段跳），<br>躲開石頭和蘑菇、吃瓜子，跑越遠越好！', start: startRunner },
  maze: { name: '迷宮找瓜子', icon: '🧭', desc: '用方向鍵 / WASD 或點畫面走迷宮，<br>沿路收集瓜子，60 秒內回到小屋！', start: startMaze },
});

// ───────────────────────── 打地鼠 ─────────────────────────

function moleSvg(kind = 'mole', hit = false) {
  const fur = kind === 'gold' ? '#FFD54F' : '#A47452';
  const belly = kind === 'gold' ? '#FFF3B0' : '#E8C9A8';
  const eyes = hit
    ? `<path d="M72 88 l14 14 M86 88 l-14 14 M114 88 l14 14 M128 88 l-14 14" ${SW}/>`
    : `<ellipse cx="80" cy="94" rx="7" ry="9" fill="#2E211D"/><ellipse cx="120" cy="94" rx="7" ry="9" fill="#2E211D"/>
       <circle cx="82" cy="90" r="2.5" fill="#fff"/><circle cx="122" cy="90" r="2.5" fill="#fff"/>`;
  return `<svg viewBox="0 0 200 200" class="mole-svg">
    <path d="M34 210 L34 112 Q34 34 100 34 Q166 34 166 112 L166 210 Z" fill="${fur}" ${SW}/>
    <ellipse cx="100" cy="160" rx="46" ry="50" fill="${belly}"/>
    ${eyes}
    <ellipse cx="100" cy="114" rx="18" ry="13" fill="#FF8FA3" ${SW3}/><ellipse cx="95" cy="110" rx="5" ry="3" fill="#fff" opacity=".7"/>
    <path d="M70 116 L44 110 M70 124 L44 128 M130 116 L156 110 M130 124 L156 128" stroke="#5A3E36" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="66" cy="126" rx="10" ry="6" fill="#FF8FA3" opacity=".5"/><ellipse cx="134" cy="126" rx="10" ry="6" fill="#FF8FA3" opacity=".5"/>
    ${kind === 'gold' ? `<path d="M76 46 L72 20 L88 34 L100 14 L112 34 L128 20 L124 46 Z" fill="#FFB300" ${SW3}/>` : ''}
    ${hit ? star(150, 50, 14, '#FFD54F', SW3) + star(52, 56, 10, '#FFD54F', SW3) : ''}
  </svg>`;
}

function startWhack(area, ctl) {
  const DURATION = 30;
  const KEYS = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];
  area.innerHTML = `${hudHtml()}<div class="whack-grid">${KEYS.map((k, i) => `
    <button class="hole" data-i="${i}"><span class="mole-slot"><span class="mole"></span></span><span class="hole-key">${k.toUpperCase()}</span></button>`).join('')}</div>
    <p class="game-tip">🖱️ 點地鼠　⌨️ Q W E / A S D / Z X C 對應九個洞</p>`;
  const holes = $$('.hole', area).map((el) => ({ el, mole: $('.mole', el), up: false, kind: null, until: 0, hit: false }));
  let score = 0, time = DURATION, spawn = 0.6, last = performance.now();

  function pop(h, kind) {
    h.kind = kind;
    h.up = true;
    h.hit = false;
    h.mole.innerHTML = kind === 'friend' ? petSvg(randomLook()) : moleSvg(kind);
    h.el.classList.add('up');
    h.el.classList.toggle('friend', kind === 'friend');
  }
  function bonk(i) {
    const h = holes[i];
    if (!h.up || h.hit) return;
    h.hit = true;
    h.el.classList.add('bonk');
    setTimeout(() => h.el.classList.remove('bonk'), 200);
    const r = h.el.getBoundingClientRect(), ar = area.getBoundingClientRect();
    const fx = r.left - ar.left + r.width / 2, fy = r.top - ar.top + r.height * 0.3;
    if (h.kind === 'friend') {
      score = Math.max(0, score - 2);
      sfx.bad();
      h.mole.innerHTML = petSvg({ ...randomLook(), expression: 'cry' });
      floatText(area, fx, fy, '-2 痛痛！', 'bad-pop');
    } else {
      const add = h.kind === 'gold' ? 3 : 1;
      score += add;
      sfx.coin();
      h.mole.innerHTML = moleSvg(h.kind, true);
      floatText(area, fx, fy, `+${add}`, 'coin-pop');
    }
    h.until = performance.now() + 280;
  }

  area.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.hole');
    if (b) { e.preventDefault(); bonk(Number(b.dataset.i)); }
  });
  const onKey = (e) => {
    const i = KEYS.indexOf(e.key.toLowerCase());
    if (i >= 0) { e.preventDefault(); bonk(i); }
  };
  window.addEventListener('keydown', onKey);
  ctl.onStop(() => window.removeEventListener('keydown', onKey));

  function frame(t) {
    if (ctl.isStopped()) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    time -= dt;
    const k = 1 - time / DURATION;
    for (const h of holes) {
      if (h.up && t > h.until) { h.up = false; h.el.classList.remove('up'); }
    }
    spawn -= dt;
    if (spawn <= 0) {
      spawn = 0.85 - k * 0.45;
      const free = holes.filter((h) => !h.up);
      if (free.length && holes.filter((h) => h.up).length < 3) {
        const h = free[Math.floor(Math.random() * free.length)];
        const r = Math.random();
        pop(h, r < 0.1 ? 'gold' : r < 0.3 ? 'friend' : 'mole');
        h.until = t + (1150 - k * 500) * (h.kind === 'gold' ? 0.75 : 1);
      }
    }
    $('.h-time', area).textContent = Math.max(0, Math.ceil(time));
    $('.h-score', area).textContent = score;
    if (time <= 0) ctl.finish(score, score);
    else requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ───────────────────────── 跳跳跑酷 ─────────────────────────

async function startRunner(area, ctl) {
  const W = 800, H = 400, GROUND = 340, MAX_TIME = 60;
  area.innerHTML = `${hudHtml('<span>🌻 <b class="h-seeds">0</b></span>')}<canvas class="game-canvas runner" width="${W}" height="${H}"></canvas>
    <p class="game-tip">空白鍵 / ↑ / W / 點畫面 跳躍，在空中可以再跳一次</p>`;
  const cv = $('canvas', area);
  const cx = cv.getContext('2d');
  const [petImg, hurtImg, rock, mush, bush, seed] = await Promise.all([
    svgToImage(petSvg({ ...save.look, held: 'none' })), svgToImage(petSvg({ ...save.look, held: 'none', expression: 'dizzy' })),
    loadImg(assetUrl('o_rock')), loadImg(assetUrl('o_mushroom')), loadImg(assetUrl('o_bush')), loadImg(assetUrl('g_seed')),
  ]);
  if (ctl.isStopped()) return;
  const OBST = [{ img: rock, w: 74 }, { img: mush, w: 70 }, { img: bush, w: 96 }];

  const P = { x: 120, y: GROUND, vy: 0, jumps: 0, w: 110 };
  const obstacles = [], seeds = [];
  let speed = 380, dist = 0, nSeeds = 0, time = 0, nextObs = 1.2, nextSeed = 0.8, last = performance.now(), dead = false, scroll = 0;

  function jump() {
    if (dead || P.jumps >= 2) return;
    P.vy = P.jumps === 0 ? -900 : -760;
    P.jumps++;
    sfx.step();
  }
  const onKey = (e) => {
    if ([' ', 'arrowup', 'w'].includes(e.key.toLowerCase())) { e.preventDefault(); if (!e.repeat) jump(); }
  };
  window.addEventListener('keydown', onKey);
  ctl.onStop(() => window.removeEventListener('keydown', onKey));
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });

  const imgH = (img, w) => (img ? (w * img.height) / img.width : w * 0.7);
  const drawImg = (img, x, bottom, w, fallback) => {
    const h = imgH(img, w);
    if (img) cx.drawImage(img, x, bottom - h, w, h);
    else { cx.fillStyle = fallback; cx.beginPath(); cx.ellipse(x + w / 2, bottom - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); cx.fill(); }
  };

  function frame(t) {
    if (ctl.isStopped()) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (!dead) {
      time += dt;
      speed = 380 + time * 9;
      dist += (speed * dt) / 40;
      scroll += speed * dt;
      P.vy += 2600 * dt;
      P.y += P.vy * dt;
      if (P.y >= GROUND) { P.y = GROUND; P.vy = 0; P.jumps = 0; }
      nextObs -= dt;
      if (nextObs <= 0) {
        obstacles.push({ ...OBST[Math.floor(Math.random() * OBST.length)], x: W + 20 });
        nextObs = 0.9 + Math.random() * 1.1 - Math.min(0.4, time * 0.008);
      }
      nextSeed -= dt;
      if (nextSeed <= 0) {
        const y = GROUND - 60 - Math.random() * 170;
        for (let i = 0; i < 3; i++) seeds.push({ x: W + 20 + i * 44, y });
        nextSeed = 1.4 + Math.random() * 1.2;
      }
      obstacles.forEach((o) => { o.x -= speed * dt; });
      seeds.forEach((s) => { s.x -= speed * dt; });
      // 碰撞判定範圍縮小一點，比較寬容
      const pl = P.x - P.w * 0.3, pr = P.x + P.w * 0.3, pt = P.y - P.w * 0.6;
      for (const o of obstacles) {
        if (o.x + o.w * 0.2 < pr && o.x + o.w * 0.8 > pl && P.y > GROUND - imgH(o.img, o.w) * 0.75) { dead = true; sfx.bad(); }
      }
      for (let i = seeds.length - 1; i >= 0; i--) {
        const s = seeds[i];
        if (s.x > pl - 10 && s.x < pr + 10 && s.y > pt - 10 && s.y < P.y + 10) { seeds.splice(i, 1); nSeeds++; sfx.coin(); }
        else if (s.x < -40) seeds.splice(i, 1);
      }
      for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].x < -120) obstacles.splice(i, 1);
      if (time >= MAX_TIME) dead = true;
      if (dead) {
        const score = Math.floor(dist) + nSeeds * 10;
        setTimeout(() => ctl.finish(score, Math.floor(score / 5)), 900);
      }
    }

    // 天空、遠山與雲（視差）、地面
    const sky = cx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#BFE6FF'); sky.addColorStop(1, '#FFF3E0');
    cx.fillStyle = sky; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#CDEBC0';
    for (let i = -1; i < 6; i++) { const x = i * 220 - ((scroll * 0.2) % 220); cx.beginPath(); cx.ellipse(x + 110, GROUND, 150, 90, 0, Math.PI, 0); cx.fill(); }
    cx.fillStyle = '#fff';
    for (let i = -1; i < 5; i++) { const x = i * 260 - ((scroll * 0.08) % 260); cx.beginPath(); cx.ellipse(x + 80, 70 + (i % 2) * 30, 46, 16, 0, 0, Math.PI * 2); cx.fill(); }
    cx.fillStyle = '#A8DE8C'; cx.fillRect(0, GROUND - 4, W, H - GROUND + 4);
    cx.fillStyle = '#8BD47A';
    for (let i = -1; i < 18; i++) cx.fillRect(i * 50 - (scroll % 50), GROUND + 18, 24, 6);
    seeds.forEach((s) => drawImg(seed, s.x - 16, s.y + 16, 32, '#4A4040'));
    obstacles.forEach((o) => drawImg(o.img, o.x, GROUND + 6, o.w, '#9A8A86'));
    const ph = (P.w * 340) / 400;
    const bob = P.y >= GROUND && !dead ? Math.abs(Math.sin(t / 70)) * 6 : 0;
    cx.save();
    cx.translate(P.x, P.y - bob);
    if (P.y < GROUND) cx.rotate(Math.max(-0.3, Math.min(0.3, P.vy / 3000)));
    cx.drawImage(dead ? hurtImg : petImg, -P.w / 2, -ph, P.w, ph);
    cx.restore();

    $('.h-time', area).textContent = Math.floor(time);
    $('.h-score', area).textContent = Math.floor(dist);
    $('.h-seeds', area).textContent = nSeeds;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ───────────────────────── 迷宮找瓜子 ─────────────────────────

async function startMaze(area, ctl) {
  const COLS = 13, ROWS = 9, C = 56, W = COLS * C, H = ROWS * C, LIMIT = 60;
  area.innerHTML = `${hudHtml()}<canvas class="game-canvas maze" width="${W}" height="${H}"></canvas>
    <p class="game-tip">⌨️ 方向鍵 / WASD　🖱️ 點鼠鼠旁邊的方向走一格</p>`;
  const cv = $('canvas', area);
  const cx = cv.getContext('2d');
  const [petImg, seedImg, homeImg] = await Promise.all([
    svgToImage(petSvg({ ...save.look, held: 'none' })), loadImg(assetUrl('g_seed')), loadImg(assetUrl('f_house')),
  ]);
  if (ctl.isStopped()) return;

  // 深度優先產生迷宮：walls[y][x] = { n, e, s, w }
  const walls = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ n: true, e: true, s: true, w: true })));
  const seen = walls.map((r) => r.map(() => false));
  const DIRS = { n: [0, -1, 's'], s: [0, 1, 'n'], w: [-1, 0, 'e'], e: [1, 0, 'w'] };
  const stack = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const opts = Object.entries(DIRS).filter(([, [dx, dy]]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !seen[ny][nx];
    });
    if (!opts.length) { stack.pop(); continue; }
    const [d, [dx, dy, back]] = opts[Math.floor(Math.random() * opts.length)];
    walls[y][x][d] = false;
    walls[y + dy][x + dx][back] = false;
    seen[y + dy][x + dx] = true;
    stack.push([x + dx, y + dy]);
  }
  // 再多打通幾面牆，讓路線不只一條
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(Math.random() * (COLS - 1)), y = Math.floor(Math.random() * ROWS);
    walls[y][x].e = false;
    walls[y][x + 1].w = false;
  }
  const seeds = new Set();
  while (seeds.size < 10) {
    const x = Math.floor(Math.random() * COLS), y = Math.floor(Math.random() * ROWS);
    if (x + y > 2 && !(x === COLS - 1 && y === ROWS - 1)) seeds.add(`${x},${y}`);
  }
  const P = { x: 0, y: 0, dx: 0, dy: 0 };
  let got = 0, time = LIMIT, last = performance.now(), done = false;

  function end(reached) {
    if (done) return;
    done = true;
    const score = got * 10 + (reached ? 20 + Math.ceil(time) * 2 : 0);
    if (reached) sfx.win();
    setTimeout(() => ctl.finish(score, Math.floor(score / 3)), reached ? 500 : 900);
  }
  function move(d) {
    if (done || walls[P.y][P.x][d]) return;
    const [dx, dy] = DIRS[d];
    P.x += dx; P.y += dy;
    P.dx = -dx; P.dy = -dy;
    sfx.step();
    const key = `${P.x},${P.y}`;
    if (seeds.has(key)) { seeds.delete(key); got++; sfx.coin(); }
    if (P.x === COLS - 1 && P.y === ROWS - 1) end(true);
  }
  const KEYMAP = { arrowup: 'n', w: 'n', arrowdown: 's', s: 's', arrowleft: 'w', a: 'w', arrowright: 'e', d: 'e' };
  const onKey = (e) => {
    const d = KEYMAP[e.key.toLowerCase()];
    if (d) { e.preventDefault(); move(d); }
  };
  window.addEventListener('keydown', onKey);
  ctl.onStop(() => window.removeEventListener('keydown', onKey));
  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W - (P.x + 0.5) * C;
    const my = ((e.clientY - r.top) / r.height) * H - (P.y + 0.5) * C;
    move(Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'e' : 'w') : (my > 0 ? 's' : 'n'));
  });

  function frame(t) {
    if (ctl.isStopped()) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (!done) { time -= dt; if (time <= 0) { time = 0; end(false); } }
    // 走一格的滑動動畫
    P.dx *= Math.pow(0.0001, dt);
    P.dy *= Math.pow(0.0001, dt);

    cx.fillStyle = '#E9F7DF'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#F6EAD0';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2) cx.fillRect(x * C, y * C, C, C);
    if (homeImg) cx.drawImage(homeImg, (COLS - 1) * C + 4, (ROWS - 1) * C + 6, C - 8, ((C - 8) * homeImg.height) / homeImg.width);
    seeds.forEach((k) => {
      const [x, y] = k.split(',').map(Number);
      const bob = Math.sin(t / 300 + x + y) * 3;
      if (seedImg) cx.drawImage(seedImg, x * C + C * 0.3, y * C + C * 0.22 + bob, C * 0.4, (C * 0.4 * seedImg.height) / seedImg.width);
      else { cx.fillStyle = '#4A4040'; cx.beginPath(); cx.arc(x * C + C / 2, y * C + C / 2, 8, 0, Math.PI * 2); cx.fill(); }
    });
    cx.lineCap = 'round';
    for (const [color, width] of [['#5A3E36', 12], ['#7CC47A', 7]]) {
      cx.strokeStyle = color;
      cx.lineWidth = width;
      cx.beginPath();
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const w = walls[y][x], X = x * C, Y = y * C;
        if (w.n) { cx.moveTo(X, Y); cx.lineTo(X + C, Y); }
        if (w.w) { cx.moveTo(X, Y); cx.lineTo(X, Y + C); }
        if (x === COLS - 1 && w.e) { cx.moveTo(X + C, Y); cx.lineTo(X + C, Y + C); }
        if (y === ROWS - 1 && w.s) { cx.moveTo(X, Y + C); cx.lineTo(X + C, Y + C); }
      }
      cx.stroke();
    }
    const pw = C * 0.95, ph = (pw * 340) / 400;
    cx.drawImage(petImg, (P.x + P.dx + 0.5) * C - pw / 2, (P.y + P.dy + 0.5) * C - ph / 2 - 2, pw, ph);

    $('.h-time', area).textContent = Math.ceil(time);
    $('.h-score', area).textContent = got;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
