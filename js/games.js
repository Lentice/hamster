// 小遊戲：接瓜子、滾輪衝刺、翻牌配對。玩完依分數獲得鼠鼠幣。

const GAMES = {
  catch: { name: '接瓜子', icon: '🌻', desc: '左右移動接住掉下來的瓜子！金色瓜子 +5，小心辣椒！', start: startCatch },
  wheel: { name: '滾輪衝刺', icon: '🎡', desc: '交替按 ← → （或點左右按鈕）讓滾輪越轉越快，10 秒內跑最遠！', start: startWheel },
  memory: { name: '翻牌配對', icon: '🃏', desc: '翻開兩張一樣的牌就配對成功，步數越少獎勵越多！', start: startMemory },
};

function loadImg(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

// 開場說明 → 遊戲 → 結算
function openGame(id, onDone) {
  const g = GAMES[id];
  const m = modal(`<div class="game-intro">
      <div class="game-icon">${g.icon}</div><h2>${g.name}</h2><p>${g.desc}</p>
      <p class="best">最佳紀錄：${save.best[id] || 0}</p>
      <div class="modal-actions"><button class="btn btn-pink" data-act="start">開始！</button></div>
    </div>`, { cls: 'game-modal' });
  m.root.addEventListener('closed', () => onDone?.());
  $('[data-act=start]', m.box).onclick = () => runGame(id, m);
}

function runGame(id, m) {
  const g = GAMES[id];
  m.box.classList.add('playing');
  m.box.querySelectorAll(':scope > :not(.modal-x)').forEach((el) => el.remove());
  const area = html('<div class="game-area"></div>');
  m.box.appendChild(area);
  let stopped = false;
  const stopFns = [];
  m.root.addEventListener('closed', () => { stopped = true; stopFns.forEach((f) => f()); });
  g.start(area, {
    isStopped: () => stopped,
    onStop: (f) => stopFns.push(f),
    finish: (score, coins) => {
      if (stopped) return;
      // 結算後也算停止，跑酷、迷宮的動畫迴圈才會結束
      stopped = true;
      stopFns.forEach((f) => f());
      stopFns.length = 0;
      const record = recordBest(id, score);
      addCoins(coins);
      sfx.win();
      area.innerHTML = `<div class="game-result">
        <div class="game-icon">${record ? '🏆' : '🎉'}</div>
        <h2>${record ? '新紀錄！' : '完成！'}</h2>
        <p class="score">分數 <b>${score}</b></p>
        <p class="reward">獲得 <b>🪙 ${coins}</b> 鼠鼠幣</p>
        <div class="modal-actions">
          <button class="btn btn-pink" data-act="again">再玩一次</button>
          <button class="btn btn-gray" data-act="back">回公園</button>
        </div></div>`;
      $('[data-act=again]', area).onclick = () => { area.remove(); runGame(id, m); };
      $('[data-act=back]', area).onclick = () => m.close();
    },
  });
}

function hudHtml(extra = '') {
  return `<div class="game-hud"><span>⏱ <b class="h-time">0</b></span><span>⭐ <b class="h-score">0</b></span>${extra}</div>`;
}

// ───────────────────────── 接瓜子 ─────────────────────────

async function startCatch(area, ctl) {
  const W = 800, H = 500, DURATION = 30;
  area.innerHTML = `${hudHtml()}<canvas class="game-canvas" width="${W}" height="${H}"></canvas>
    <p class="game-tip">⌨️ ← → / A D　🖱️ 移動滑鼠或手指</p>`;
  const cv = $('canvas', area);
  const cx = cv.getContext('2d');
  const [petImg, dizzyImg, seed, gold, pepper] = await Promise.all([
    svgToImage(petSvg(save.look)), svgToImage(petSvg({ ...save.look, expression: 'dizzy' })),
    loadImg(assetUrl('g_seed')), loadImg(assetUrl('g_seed_gold')), loadImg(assetUrl('g_pepper')),
  ]);
  if (ctl.isStopped()) return;

  const player = { x: W / 2, w: 130, stun: 0 };
  const items = [];
  const keys = {};
  let score = 0, time = DURATION, spawn = 0, last = performance.now(), shake = 0;
  const pops = [];

  const onKey = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) { keys[e.key.toLowerCase()] = e.type === 'keydown'; e.preventDefault(); }
  };
  const onMove = (e) => {
    const r = cv.getBoundingClientRect();
    player.x = ((e.clientX - r.left) / r.width) * W;
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerdown', onMove);
  ctl.onStop(() => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
  });

  function spawnItem(k) {
    const r = Math.random();
    const type = r < 0.08 ? 'gold' : r < 0.3 ? 'pepper' : 'seed';
    items.push({ type, x: 40 + Math.random() * (W - 80), y: -30, v: 170 + k * 220 + Math.random() * 60, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 4 });
  }

  function drawItem(it) {
    const img = it.type === 'gold' ? gold : it.type === 'pepper' ? pepper : seed;
    const s = it.type === 'pepper' ? 56 : 46;
    cx.save();
    cx.translate(it.x, it.y);
    cx.rotate(it.rot);
    if (img) cx.drawImage(img, -s / 2, -s / 2, s, (s * img.height) / img.width);
    else {
      cx.fillStyle = it.type === 'gold' ? '#FFD54F' : it.type === 'pepper' ? '#F0506A' : '#4A4040';
      cx.beginPath(); cx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2); cx.fill();
    }
    cx.restore();
  }

  function frame(t) {
    if (ctl.isStopped()) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    time -= dt;
    const k = 1 - time / DURATION;
    if (player.stun > 0) player.stun -= dt;
    else {
      if (keys.arrowleft || keys.a) player.x -= 520 * dt;
      if (keys.arrowright || keys.d) player.x += 520 * dt;
    }
    player.x = Math.max(60, Math.min(W - 60, player.x));
    spawn -= dt;
    if (spawn <= 0) { spawnItem(k); spawn = 0.55 - k * 0.3; }

    const catchY = H - 120;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.v * dt;
      it.rot += it.vr * dt;
      if (it.y > catchY && it.y < catchY + 50 && Math.abs(it.x - player.x) < player.w / 2 && player.stun <= 0) {
        items.splice(i, 1);
        if (it.type === 'pepper') {
          score = Math.max(0, score - 3); player.stun = 0.9; shake = 0.3; sfx.bad();
          pops.push({ x: it.x, y: catchY, t: 0.8, txt: '-3', c: '#F0506A' });
        } else {
          const add = it.type === 'gold' ? 5 : 1;
          score += add; sfx.coin();
          pops.push({ x: it.x, y: catchY, t: 0.8, txt: `+${add}`, c: it.type === 'gold' ? '#F7B932' : '#5A3E36' });
        }
      } else if (it.y > H + 40) items.splice(i, 1);
    }

    // 畫面
    cx.save();
    if (shake > 0) { shake -= dt; cx.translate((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12); }
    const sky = cx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#BFE6FF'); sky.addColorStop(1, '#FFF3E0');
    cx.fillStyle = sky; cx.fillRect(-10, -10, W + 20, H + 20);
    cx.fillStyle = '#A8DE8C'; cx.fillRect(-10, H - 50, W + 20, 60);
    cx.fillStyle = '#fff';
    [[120, 70], [520, 50], [700, 110]].forEach(([x, y]) => { cx.beginPath(); cx.ellipse(x, y, 50, 18, 0, 0, Math.PI * 2); cx.fill(); });
    items.forEach(drawItem);
    const img = player.stun > 0 ? dizzyImg : petImg;
    const pw = 150, ph = (pw * 340) / 400;
    const bob = Math.abs(Math.sin(t / 120)) * (keys.arrowleft || keys.arrowright || keys.a || keys.d ? 6 : 2);
    cx.drawImage(img, player.x - pw / 2, H - 40 - ph - bob, pw, ph);
    pops.forEach((p) => { p.t -= dt; p.y -= 60 * dt; cx.globalAlpha = Math.max(0, p.t / 0.8); cx.fillStyle = p.c; cx.font = 'bold 30px Huninn, sans-serif'; cx.textAlign = 'center'; cx.fillText(p.txt, p.x, p.y); cx.globalAlpha = 1; });
    for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t <= 0) pops.splice(i, 1);
    cx.restore();

    $('.h-time', area).textContent = Math.max(0, Math.ceil(time));
    $('.h-score', area).textContent = score;
    if (time <= 0) ctl.finish(score, score);
    else requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ───────────────────────── 滾輪衝刺 ─────────────────────────

function startWheel(area, ctl) {
  const DURATION = 10;
  area.innerHTML = `${hudHtml('<span>💨 <b class="h-speed">0</b></span>')}
    <div class="wheel-stage">
      <svg class="wheel-img" viewBox="0 0 400 400">
        <path d="M200 200 L110 380 M200 200 L290 380" stroke="#FFC0D0" stroke-width="22" stroke-linecap="round"/>
        <path d="M200 200 L110 380 M200 200 L290 380" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round" opacity=".5"/>
        <rect x="80" y="372" width="240" height="18" rx="9" fill="#FFE07A" ${SW3}/>
        <g class="wheel-rot">
          <circle cx="200" cy="200" r="168" fill="#FFF1F5" fill-opacity=".85" stroke="#FF8FA3" stroke-width="18"/>
          <circle cx="200" cy="200" r="168" fill="none" ${SW}/><circle cx="200" cy="200" r="150" fill="none" stroke="#FFC0D0" stroke-width="3"/>
          ${Array.from({ length: 12 }, (_, i) => `<path d="M200 200 L${200 + 160 * Math.cos(i * Math.PI / 6)} ${200 + 160 * Math.sin(i * Math.PI / 6)}" stroke="#FFC0D0" stroke-width="5"/>`).join('')}
          <circle cx="200" cy="200" r="24" fill="#FF8FA3" ${SW3}/>${heart(200, 202, 10, '#fff')}
        </g>
      </svg>
      <div class="wheel-pet">${petSvg(save.look, 'running')}</div>
      <div class="speed-bar"><i></i></div>
    </div>
    <div class="wheel-btns"><button class="btn btn-blue big-btn" data-side="l">⬅ 左腳</button><button class="btn btn-pink big-btn" data-side="r">右腳 ➡</button></div>
    <p class="game-tip">交替按 ← → 鍵或兩個按鈕！同一邊連按沒有用喔</p>`;
  let speed = 0, dist = 0, time = DURATION, lastSide = null, angle = 0, last = performance.now(), started = false;
  const wheelImg = $('.wheel-rot', area);
  const petEl = $('.wheel-pet .pet-svg', area);

  function press(side) {
    started = true;
    if (side !== lastSide) {
      speed = Math.min(30, speed + 2.4);
      lastSide = side;
      sfx.step();
    } else {
      speed = Math.max(0, speed - 1);
    }
  }
  const onKey = (e) => {
    if (e.repeat) return;
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) { press('l'); e.preventDefault(); }
    if (['ArrowRight', 'd', 'D'].includes(e.key)) { press('r'); e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);
  ctl.onStop(() => window.removeEventListener('keydown', onKey));
  $$('[data-side]', area).forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(b.dataset.side); }));

  function frame(t) {
    if (ctl.isStopped()) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (started) time -= dt;
    speed = Math.max(0, speed - 7 * dt);
    dist += speed * dt;
    angle += speed * dt * 40;
    wheelImg.style.transform = `rotate(${angle}deg)`;
    petEl.style.animationDuration = `${Math.max(0.12, 0.6 - speed / 60)}s`;
    $('.speed-bar i', area).style.width = `${(speed / 30) * 100}%`;
    $('.h-time', area).textContent = Math.max(0, Math.ceil(time));
    $('.h-score', area).textContent = Math.floor(dist);
    $('.h-speed', area).textContent = Math.round(speed);
    if (time <= 0) {
      const score = Math.floor(dist);
      ctl.finish(score, Math.floor(score / 3));
    } else requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ───────────────────────── 翻牌配對 ─────────────────────────

function startMemory(area, ctl) {
  const faces = ['g_seed', 'g_seed_gold', 'g_coin', 'held_icecream', 'held_teddy', 'held_lollipop', 'held_sunflower', 'hat_cupcake'];
  const deck = [...faces, ...faces].map((f, i) => ({ f, i })).sort(() => Math.random() - 0.5);
  area.innerHTML = `${hudHtml('<span>👣 <b class="h-moves">0</b></span>')}
    <div class="memory-grid">${deck.map((c, k) => `<button class="mcard" data-k="${k}">
      <span class="mback"><img src="${assetUrl('g_card_back')}" alt=""></span>
      <span class="mface"><img src="${assetUrl(c.f)}" alt=""></span></button>`).join('')}</div>`;
  let open = [], moves = 0, matched = 0, lock = false;
  const start = performance.now();
  const timer = setInterval(() => { $('.h-time', area).textContent = Math.floor((performance.now() - start) / 1000); }, 250);
  ctl.onStop(() => clearInterval(timer));

  $('.memory-grid', area).addEventListener('click', (e) => {
    const b = e.target.closest('.mcard');
    if (!b || lock || b.classList.contains('flip')) return;
    b.classList.add('flip');
    sfx.tab();
    open.push(b);
    if (open.length < 2) return;
    moves++;
    $('.h-moves', area).textContent = moves;
    const [a, c] = open;
    if (deck[a.dataset.k].f === deck[c.dataset.k].f) {
      a.classList.add('done'); c.classList.add('done');
      open = [];
      matched++;
      sfx.coin();
      $('.h-score', area).textContent = matched;
      if (matched === faces.length) {
        const score = Math.max(10, 100 - (moves - 8) * 5);
        setTimeout(() => ctl.finish(score, Math.round(score / 2.5)), 600);
      }
    } else {
      lock = true;
      setTimeout(() => { a.classList.remove('flip'); c.classList.remove('flip'); open = []; lock = false; }, 750);
    }
  });
}
