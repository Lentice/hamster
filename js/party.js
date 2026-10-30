// Room party games. No elected host: all phases follow the server clock.
const Party = (() => {
  const LOBBY = 10000, PLAY = 25000, SETTLE = 2000, EXPIRE = 45000;
  const GAMES = {
    seeds: { icon: '🌻', name: '搶瓜子大賽', tip: '點地面或拖曳前進，也能用方向鍵 / WASD。靠近瓜子就能搶到！' },
    race: { icon: '🏁', name: '鼠鼠賽跑', tip: '交替點左腳、右腳，或交替按 ← → / A D。跑到 100 分就是終點！' },
    statue: { icon: '🚦', name: '一二三木頭人', tip: '綠燈時點「前進」或按空白鍵；紅燈動了會退後 15 步。黃燈先準備停！' },
  };
  const text = (v, max = 12) => {
    let out = '';
    for (const ch of String(v || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/https?:\S+|www\.\S+|\d[\d -]{5,}\d/gi, '＊')) {
      if (out.length + ch.length > max) break;
      out += ch;
    }
    return out || '鼠鼠';
  };
  const lookKeys = ['species', 'expression', 'hat', 'clothes', 'glasses', 'neck', 'held'];
  const safeLook = (v) => Object.fromEntries(lookKeys.map(k => [k, typeof v?.[k] === 'string' ? v[k].slice(0, 24) : DEFAULT_LOOK[k]]));
  let conn = null, unsub = null, data = null, dialog = null, local = null, joined = false;
  let timer = null, frame = null, lastFrame = 0, lastSend = 0, sending = false, dirty = false;
  let keys = new Set(), target = null, roster = new Map(), pending = new Set(), dismissed = '', rewarded = '';
  const chip = html('<div class="park-ui party-ui"><button class="online-chip" type="button">🎉 派對遊戲</button><div class="party-invite" hidden><p></p><button class="btn btn-pink btn-small">一起玩</button></div></div>');
  PARK.viewport.append(chip);
  const invite = $('.party-invite', chip);
  const ref = (path = '') => conn.fb.ref(conn.fb.db, `rooms/${conn.room}/party/current${path ? '/' + path : ''}`);
  const now = () => conn?.now() || Date.now();
  const elapsed = () => now() - (data?.meta.t || now()) - LOBBY;
  const roundKey = () => `${conn.room}:${data.meta.id}`;
  const fail = () => toast('連線暫時不順，請稍後再試～');
  function light(ms) {
    const cycle = 4200 + (data.meta.seed % 3) * 200;
    const phase = Math.max(0, ms) % cycle;
    return phase < cycle - 1800 ? 'green' : phase < cycle - 1200 ? 'yellow' : 'red';
  }
  function seedPoint(i) {
    let n = (data.meta.seed + (i + 1) * 2654435761) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 2246822507) >>> 0;
    return { x: 90 + n % 820, y: 100 + (n >>> 12) % 800 };
  }
  const score = (uid, p) => data.meta.kind === 'seeds'
    ? Object.values(data.claims || {}).filter(v => v === uid).length : p.score;
  function close() {
    if (dialog) dialog.close();
  }
  function leaveGame(mark = true) {
    keys.clear(); target = null;
    if (joined && conn && data) {
      const c = conn, r = ref(`players/${c.fb.uid}/active`);
      if (mark) c.fb.set(r, false).catch(() => {});
      c.fb.onDisconnect(r).cancel().catch(() => {});
    }
    joined = false; local = null; dirty = false;
  }
  function disconnect() {
    close(); leaveGame(); unsub?.(); unsub = null; conn = null; data = null;
    invite.hidden = true; chip.hidden = true;
    clearInterval(timer); timer = null; cancelAnimationFrame(frame); frame = null;
  }
  function connect() {
    disconnect();
    conn = Net.partyConnection();
    if (!conn) return;
    chip.hidden = false;
    unsub = conn.fb.onValue(ref(), snap => {
      const next = snap.val();
      if (data?.meta.id !== next?.meta?.id) {
        leaveGame(false); close(); roster.clear(); pending.clear();
      }
      data = next;
      if (data && !GAMES[data.meta?.kind]) data = null;
      update();
    }, () => { close(); leaveGame(); invite.hidden = true; fail(); });
    timer = setInterval(update, 100);
    lastFrame = performance.now(); frame = requestAnimationFrame(tick);
  }
  async function create(kind) {
    if (!conn) return;
    const c = conn;
    const id = crypto.randomUUID();
    try {
      const result = await c.fb.runTransaction(ref(), old => {
        if (old && c.now() - old.meta.t < EXPIRE) return;
        return { meta: { id, host: c.fb.uid, name: text(c.info.name), kind, seed: Math.floor(Math.random() * 1000000000), t: c.fb.serverTimestamp() } };
      }, { applyLocally: false });
      if (conn !== c) return;
      if (result.committed) data = result.snapshot.val();
      if (data && elapsed() < 0) await join();
      else toast('這一局還在進行，稍後再開一局吧！');
    } catch { fail(); }
  }
  async function join() {
    if (!data || joined || elapsed() >= 0) return;
    const c = conn, key = roundKey();
    const p = { name: text(c.info.name), look: safeLook(c.info.look), x: 500, y: 500, score: 0, done: 0, active: true };
    const r = ref(`players/${c.fb.uid}`), active = ref(`players/${c.fb.uid}/active`);
    try {
      await c.fb.set(r, p);
      await c.fb.onDisconnect(active).set(false);
      if (conn !== c || !data || roundKey() !== key) { c.fb.set(active, false).catch(() => {}); return; }
      local = { ...p }; joined = true; lastSend = 0; foot = ''; lastAction = 0; openRound();
    } catch { c.fb.onDisconnect(active).cancel().catch(() => {}); fail(); }
  }
  function menu() {
    if (!conn) { toast('先在「一起玩」加入公園或朋友房間，再來開派對吧！'); return; }
    if (joined) return openRound();
    if (data && elapsed() < 0) return join();
    const m = modal('<div class="party-menu"><div class="game-icon">🎉</div><h2>一起開派對</h2><p>邀請同房間的鼠鼠，10 秒後一起開玩！<br>自己一隻也可以練習喔。</p><div class="party-options"></div><p class="party-wait"></p></div>', { cls: 'party-modal' });
    const menuRoom = conn.room;
    for (const [kind, game] of Object.entries(GAMES)) {
      const b = document.createElement('button'); b.className = 'btn btn-pink'; b.textContent = `${game.icon} ${game.name}`;
      b.disabled = !!data && now() - data.meta.t < EXPIRE;
      b.onclick = () => { m.close(); create(kind); };
      $('.party-options', m.box).append(b);
    }
    const refresh = () => {
      if (conn?.room !== menuRoom) { m.close(); return; }
      const wait = data ? Math.max(0, Math.ceil((EXPIRE - now() + data.meta.t) / 1000)) : 0;
      for (const b of $$('.party-options button', m.box)) b.disabled = wait > 0;
      $('.party-wait', m.box).textContent = wait ? `這一局還在進行，約 ${wait} 秒後可開新局。` : '';
    };
    const clock = setInterval(refresh, 250);
    m.root.addEventListener('closed', () => clearInterval(clock));
    refresh();
  }
  function openRound() {
    if (dialog || !joined || !data) return;
    roster.clear();
    const g = GAMES[data.meta.kind];
    dialog = modal(`<div class="party-game"><h2>${g.icon} ${g.name}</h2><p class="party-status" role="status"></p><p class="party-tip"></p><div class="party-board"></div><div class="party-controls"></div><div class="party-results" hidden></div><p class="party-note">關閉即可離開，朋友們仍可繼續玩。</p></div>`, { cls: 'party-modal' });
    $('.party-tip', dialog.box).textContent = g.tip;
    const board = $('.party-board', dialog.box), controls = $('.party-controls', dialog.box);
    board.classList.toggle('seed-arena', data.meta.kind === 'seeds');
    if (data.meta.kind === 'seeds') {
      board.tabIndex = 0; board.setAttribute('aria-label', '瓜子草地，方向鍵移動');
      for (let i = 0; i < 24; i++) {
        const s = document.createElement('span'), pt = seedPoint(i);
        s.className = 'party-seed'; s.textContent = '🌻'; s.dataset.seed = i;
        s.style.left = `${pt.x / 10}%`; s.style.top = `${pt.y / 10}%`; s.hidden = true; board.append(s);
      }
      const point = e => {
        const r = board.getBoundingClientRect();
        target = { x: Math.max(40, Math.min(960, (e.clientX - r.left) / r.width * 1000)), y: Math.max(60, Math.min(940, (e.clientY - r.top) / r.height * 1000)) };
      };
      board.onpointerdown = e => { point(e); board.setPointerCapture(e.pointerId); board.focus(); };
      board.onpointermove = e => { if (e.buttons) point(e); };
    } else {
      const buttons = data.meta.kind === 'race' ? [['left', '👈 左腳'], ['right', '右腳 👉']] : [['go', '🐾 前進']];
      for (const [action, label] of buttons) {
        const b = document.createElement('button'); b.className = 'btn btn-pink'; b.dataset.partyAction = action; b.textContent = label;
        b.onclick = () => act(action); controls.append(b);
      }
    }
    const m = dialog;
    m.root.addEventListener('closed', () => {
      if (dialog === m) { dismissed = data ? roundKey() : ''; leaveGame(); dialog = null; roster.clear(); }
      PARK.viewport.focus();
    });
    update();
  }
  let lastAction = 0, foot = '';
  function act(action) {
    if (!joined || !local || elapsed() < 0 || elapsed() >= PLAY || performance.now() - lastAction < 65) return;
    if (local.score >= 100) return;
    if (data.meta.kind === 'race') {
      if (foot === action) return;
      foot = action; local.score = Math.min(100, local.score + 2);
    } else if (data.meta.kind === 'statue') {
      local.score = Math.max(0, Math.min(100, local.score + (light(elapsed()) === 'red' ? -15 : 2)));
    } else return;
    if (local.score === 100) local.done = Math.max(1, Math.round(elapsed()));
    lastAction = performance.now(); dirty = true;
  }
  function onKey(e) {
    if (!dialog || !joined || e.target.matches('input,textarea') || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s',' ','Spacebar'].includes(e.key)) return;
    e.preventDefault();
    if (e.type === 'keyup') { keys.delete(e.key); return; }
    keys.add(e.key); target = null;
    if (e.repeat) return;
    if (data.meta.kind === 'race') {
      if (['ArrowLeft','a'].includes(e.key)) act('left');
      if (['ArrowRight','d'].includes(e.key)) act('right');
    } else if (data.meta.kind === 'statue' && [' ','Spacebar','ArrowUp','w'].includes(e.key)) act('go');
  }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('blur', () => { keys.clear(); target = null; });
  function tick(t) {
    frame = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - lastFrame) / 1000); lastFrame = t;
    if (!joined || !local || !data || elapsed() < 0 || elapsed() >= PLAY) return;
    if (data.meta.kind === 'seeds') {
      let dx = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'));
      let dy = Number(keys.has('ArrowDown') || keys.has('s')) - Number(keys.has('ArrowUp') || keys.has('w'));
      if (target) { dx = target.x - local.x; dy = target.y - local.y; }
      const distance = Math.hypot(dx, dy);
      if (distance > 1) {
        const step = Math.min(target ? distance : Infinity, 470 * dt);
        local.x = Math.max(40, Math.min(960, local.x + dx / distance * step));
        local.y = Math.max(60, Math.min(940, local.y + dy / distance * step)); dirty = true;
      }
      for (let i = 0; i < 24; i++) {
        if (elapsed() < i * 700 || data.claims?.[i] || pending.has(i)) continue;
        const pt = seedPoint(i);
        if (Math.hypot(local.x - pt.x, local.y - pt.y) < 80) {
          pending.add(i);
          const c = conn;
          c.fb.runTransaction(ref(`claims/${i}`), old => old === null ? c.fb.uid : undefined, { applyLocally: false })
            .then(r => { if (r.committed) sfx.coin(); }).catch(() => {}).finally(() => pending.delete(i));
        }
      }
      placeMine();
    }
    if (dirty && !sending && t - lastSend >= 150) send();
  }
  async function send() {
    if (!joined || !local || !conn) return;
    const c = conn;
    sending = true; dirty = false; lastSend = performance.now();
    try { await c.fb.update(ref(`players/${c.fb.uid}`), { x: Math.round(local.x), y: Math.round(local.y), score: local.score, done: local.done }); }
    catch { if (conn === c && elapsed() < PLAY) dirty = true; }
    finally { sending = false; }
  }
  function placeMine() {
    const row = roster.get(conn?.fb.uid);
    if (row && local && data.meta.kind === 'seeds') { row.style.left = `${local.x / 10}%`; row.style.top = `${local.y / 10}%`; }
  }
  function update() {
    if (!conn || !data) { invite.hidden = true; return; }
    const ms = elapsed(), g = GAMES[data.meta.kind];
    invite.hidden = joined || ms >= 0 || dismissed === roundKey();
    if (!invite.hidden) $('p', invite).textContent = `${text(data.meta.name)} 開了「${g.name}」！要一起玩嗎？還有 ${Math.ceil(-ms / 1000)} 秒`;
    if (!dialog || !joined) return;
    const status = $('.party-status', dialog.box), board = $('.party-board', dialog.box);
    status.textContent = ms < 0 ? `一起集合！${Math.ceil(-ms / 1000)} 秒後開始（${Object.values(data.players || {}).filter(p => p.active).length} 人）`
      : ms < PLAY ? `剩下 ${Math.ceil((PLAY - ms) / 1000)} 秒${data.meta.kind === 'statue' ? ' · ' + ({green:'🟢 綠燈，前進！',yellow:'🟡 準備停！',red:'🔴 紅燈，木頭人！'}[light(ms)]) : ''}`
      : ms < PLAY + SETTLE ? '終點到了！正在整理成績…' : '🎉 大家都好棒！';
    board.dataset.light = data.meta.kind === 'statue' ? light(ms) : '';
    for (const [uid, p] of Object.entries(data.players || {})) {
      let row = roster.get(uid);
      if (!row) {
        row = html('<div class="party-racer"><div class="party-track"><div class="party-avatar"></div></div><span class="party-label"></span><b class="party-score"></b></div>');
        $('.party-avatar', row).innerHTML = petSvg(safeLook(p.look));
        row.classList.toggle('mine', uid === conn.fb.uid);
        roster.set(uid, row); board.append(row);
      }
      $('.party-label', row).textContent = `${text(p.name)}${uid === conn.fb.uid ? '（我）' : ''}${p.active ? '' : ' · 已離開'}`;
      const points = uid === conn.fb.uid && local && ms < PLAY ? score(uid, local) : score(uid, p);
      $('.party-score', row).textContent = data.meta.kind === 'seeds' ? `${points} 顆` : `${points} / 100`;
      if (data.meta.kind === 'seeds') { row.style.left = `${p.x / 10}%`; row.style.top = `${p.y / 10}%`; }
      else $('.party-avatar', row).style.left = `${Math.min(100, points)}%`;
      row.classList.toggle('departed', !p.active);
    }
    placeMine();
    for (const seed of $$('.party-seed', board)) seed.hidden = ms < Number(seed.dataset.seed) * 700 || ms >= PLAY || !!data.claims?.[seed.dataset.seed];
    for (const b of $$('[data-party-action]', dialog.box)) b.disabled = ms < 0 || ms >= PLAY;
    if (ms >= PLAY && dirty && !sending) send();
    if (ms >= PLAY + SETTLE && rewarded !== roundKey()) results();
  }
  function results() {
    rewarded = roundKey();
    const compare = (a, b) => score(b[0], b[1]) - score(a[0], a[1]) ||
      (data.meta.kind !== 'seeds' && a[1].score === 100 ? (a[1].done || PLAY + 1) - (b[1].done || PLAY + 1) : 0);
    const ranks = Object.entries(data.players || {}).sort((a, b) => compare(a, b) || a[0].localeCompare(b[0]));
    const mine = ranks.find(r => r[0] === conn.fb.uid);
    if (!mine) return;
    const rank = 1 + ranks.filter(r => compare(r, mine) < 0).length;
    const coins = Math.max(8, 32 - (rank - 1) * 4);
    // Persist a receipt before awarding so reload cannot award the same round twice.
    const receipt = `party-reward:${conn.room}`;
    let paid = false;
    try { paid = localStorage.getItem(receipt) === rewarded; if (!paid) localStorage.setItem(receipt, rewarded); } catch { /* session guard still applies */ }
    if (!paid) { addCoins(coins); sfx.win(); }
    const box = $('.party-results', dialog.box); box.hidden = false;
    const h = document.createElement('h3'); h.innerHTML = `第 ${rank} 名 · 獲得 ${HAMSTER_COIN_ICON} ${paid ? 0 : coins} 鼠鼠幣`; box.append(h);
    const list = document.createElement('ol');
    for (const [uid, p] of ranks) { const li = document.createElement('li'); li.textContent = `${text(p.name)} · ${score(uid, p)}${p.done ? `（${(p.done / 1000).toFixed(2)} 秒）` : ''}${p.active ? '' : '（已離開）'}`; list.append(li); }
    box.append(list);
    const back = document.createElement('button'); back.className = 'btn btn-pink'; back.textContent = '回公園'; back.onclick = close; box.append(back);
    $('.party-controls', dialog.box).hidden = true;
    $('.party-board', dialog.box).hidden = true; $('.party-tip', dialog.box).hidden = true;
  }
  $('button', chip).onclick = menu;
  $('button', invite).onclick = e => { e.stopPropagation(); join(); };
  // Observe room changes without replacing Net.on handlers used by online.js.
  setInterval(() => {
    if (currentScreen !== 'outdoor' || !Net.room) { if (conn) disconnect(); chip.hidden = currentScreen !== 'outdoor'; return; }
    if (conn?.room !== Net.room) connect();
  }, 250);
  PARK.hooks.leave.push(disconnect);
  window.addEventListener('pagehide', disconnect);
  chip.hidden = true;
  return { menu };
})();
