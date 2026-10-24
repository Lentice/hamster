// 多人連線的公園：看到其他玩家的鼠鼠、聊天、做表情動作、朋友房間、封鎖。
// 連線底層在 net.js；沒有設定 Firebase 時整個功能不會出現。

(() => {
  if (!Net.available()) return;
  const { world, viewport, player } = PARK;
  const PREF_KEY = 'hamster-online';
  const BLOCK_KEY = 'hamster-blocked';
  const LOOK_KEYS = ['species', 'expression', 'hat', 'clothes', 'glasses', 'neck', 'held'];
  const QUICK = ['你好！👋', '一起玩吧！', '你好可愛！', '謝謝～', '跟我來！', '好厲害！', '我先走囉，掰掰～', '😆', '❤️', '🎉'];
  const EMOTES = [['wave', '👋', '揮手'], ['hop', '🐰', '跳跳'], ['dance', '💃', '跳舞'], ['spin', '🌀', '轉圈'], ['heart', '❤️', '比心']];
  const MAX_REMOTES = 40;

  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 忽略 */ } };

  let pref = read(PREF_KEY, null); // 'public' | 'solo' | 'room:XXXXX'
  const blocked = new Set(read(BLOCK_KEY, []));
  const remotes = new Map();
  let state = 'off', joinToken = 0, sendT = 0, lastChat = 0;
  const mySay = { text: '', until: 0 };

  // 用邀請連結打開：直接進公園的那個房間
  const urlRoom = new URLSearchParams(location.search).get('room')?.toUpperCase();
  if (urlRoom && Net.isCode(urlRoom)) {
    pref = `room:${urlRoom}`;
    write(PREF_KEY, pref);
    try { localStorage.setItem('hamster-screen', 'outdoor'); } catch { /* 忽略 */ }
    const u = new URL(location.href);
    u.searchParams.delete('room');
    history.replaceState(null, '', u);
  }

  // ───────────── 過濾訊息 ─────────────

  // 依 UTF-16 長度截斷（資料庫規則用的是這個長度），不切壞 emoji
  function cap(text, units) {
    let out = '';
    for (const ch of text) { if (out.length + ch.length > units) break; out += ch; }
    return out;
  }

  const BAD = /幹(?![嘛麼什活部掉得完])|靠北|靠杯|靠腰|操你|肏|屌|雞掰|機掰|智障|白[痴癡]|低能|去死|三小|王八|婊|賤|fuck|shit|bitch|asshole|dick/gi;
  function clean(text) {
    return cap(String(text).replace(/[\u0000-\u001f\u007f]/g, ' ').trim(), 60)
      .replace(/https?:\/\/\S+|www\.\S+|\S+\.(com|net|org|tw|io|me|cc)\b\S*/gi, '🚫')
      .replace(/\d[\d\s-]{5,}\d/g, '🚫') // 電話號碼之類的個資
      .replace(BAD, (m) => '＊'.repeat([...m].length));
  }

  const myName = (uid = Net.uid) => cap(clean(save.look.name), 12) || `鼠鼠${(uid || '').slice(-3)}`;
  const myLook = () => Object.fromEntries(LOOK_KEYS.map((k) => [k, String(save.look[k])]));

  function tidy(v) {
    const look = { ...DEFAULT_LOOK };
    LOOK_KEYS.forEach((k) => { if (typeof v.look?.[k] === 'string') look[k] = v.look[k]; });
    const num = (n, max) => Math.max(0, Math.min(max, Number(n) || 0));
    return { name: cap(clean(v.name || ''), 12) || '鼠鼠', look, x: num(v.x, 2800), y: num(v.y, 1900), emo: String(v.emo || '') };
  }

  // ───────────── 介面 ─────────────

  const chip = html('<div class="park-ui online-ui"><button class="online-chip" type="button">🌐 <span>一起玩</span></button></div>');
  const dock = html(`<div class="park-ui chat-dock">
    <div class="chat-log" aria-live="polite"></div>
    <div class="chat-pop" hidden></div>
    <form class="chat-bar">
      <button type="button" class="chat-tool" data-pop="quick" aria-label="快速短句">💬</button>
      <button type="button" class="chat-tool" data-pop="emote" aria-label="表情動作">😊</button>
      <input name="text" maxlength="40" placeholder="說點什麼…" autocomplete="off" enterkeyhint="send" aria-label="聊天訊息">
      <button class="btn btn-pink btn-small chat-send">送出</button>
    </form>
  </div>`);
  viewport.append(chip, dock);
  const log = $('.chat-log', dock), pop = $('.chat-pop', dock), input = $('input', dock);

  function setState(s) {
    state = s;
    viewport.classList.toggle('online', s === 'on' || s === 'connecting');
    refreshChip();
  }

  function refreshChip() {
    const n = [...remotes.values()].filter((r) => !r.hidden).length + 1;
    const room = Net.room;
    $('span', chip).textContent =
      state === 'connecting' ? '連線中…'
      : state === 'error' ? '連線失敗'
      : state === 'on' && room?.startsWith('pub') ? `公開公園・${n} 人`
      : state === 'on' ? `朋友房間 ${room}・${n} 人`
      : '自己玩';
  }

  function addLog(name, text, cls = '') {
    const el = html(`<div class="msg ${cls}"><b></b><span></span></div>`);
    $('b', el).textContent = name ? `${name}：` : '';
    $('span', el).textContent = text;
    log.appendChild(el);
    while (log.children.length > 40) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  // ───────────── 其他玩家 ─────────────

  function addRemote(uid, raw) {
    if (remotes.size >= MAX_REMOTES || remotes.has(uid)) return;
    const v = tidy(raw);
    const r = { uid, ...v, tx: v.x, ty: v.y, moving: false, sayUntil: 0, hidden: blocked.has(uid) };
    r.el = html('<div class="walker remote"><div class="bubble say"></div><div class="nametag"></div></div>');
    r.el.dataset.uid = uid;
    r.el.hidden = r.hidden;
    $('.nametag', r.el).textContent = v.name;
    drawRemote(r);
    world.appendChild(r.el);
    remotes.set(uid, r);
    PARK.placeWalker(r.el, r.x, r.y, byId(SPECIES, r.look.species).scale);
    refreshChip();
  }

  function drawRemote(r) {
    $('.pet-svg', r.el)?.remove();
    r.el.insertAdjacentHTML('afterbegin', petSvg(r.look, r.moving ? 'walking' : ''));
    r.lookKey = JSON.stringify(r.look);
  }

  function changeRemote(uid, raw) {
    const r = remotes.get(uid);
    if (!r) return addRemote(uid, raw);
    const v = tidy(raw);
    r.tx = v.x; r.ty = v.y;
    if (v.name !== r.name) { r.name = v.name; $('.nametag', r.el).textContent = v.name; }
    if (JSON.stringify(v.look) !== r.lookKey) { r.look = v.look; drawRemote(r); }
    if (v.emo && v.emo !== r.emo && !r.hidden) playEmote(v.emo.split(':')[0], $('.pet-svg', r.el), r.x, r.y);
    r.emo = v.emo;
  }

  function removeRemote(uid) {
    remotes.get(uid)?.el.remove();
    remotes.delete(uid);
    refreshChip();
  }

  function clearRemotes() {
    remotes.forEach((r) => r.el.remove());
    remotes.clear();
  }

  function playEmote(k, svg, x, y) {
    if (!EMOTES.some(([id]) => id === k)) return;
    if (k === 'heart') {
      for (let i = 0; i < 3; i++) setTimeout(() => floatText(world, x - 30 + i * 30, y - 130, '❤️', 'emoji'), i * 150);
      petAct(svg, 'hop', 500);
    } else petAct(svg, k, 900);
  }

  function showSay(el, text) {
    const b = $('.bubble.say', el);
    if (!b) return;
    b.textContent = text;
    b.classList.add('show');
  }

  // ───────────── 連線 ─────────────

  Net.on.add = addRemote;
  Net.on.change = changeRemote;
  Net.on.remove = removeRemote;
  Net.on.status = (s) => { if (state !== 'error' || s !== 'off') setState(s); };
  Net.on.chat = (m) => {
    if (blocked.has(m.uid) || typeof m.text !== 'string') return;
    const text = clean(m.text);
    const name = m.mine ? myName() : cap(clean(m.name || ''), 12) || '鼠鼠';
    addLog(name, text, m.mine ? 'mine' : '');
    if (m.mine) { mySay.text = text; mySay.until = performance.now() + 5000; return; }
    const r = remotes.get(m.uid);
    if (r) { showSay(r.el, text); r.sayUntil = performance.now() + 5000; }
    sfx.pop();
  };

  async function connect() {
    const token = ++joinToken;
    clearRemotes();
    if (currentScreen !== 'outdoor') return;
    if (!pref || pref === 'solo') { Net.leave(); setState('off'); return; }
    const target = pref === 'public' ? 'public' : pref.slice(5);
    // 大家都從家門口出發，稍微錯開免得疊在一起
    if (Math.hypot(player.x - 420, player.y - 560) < 5) { player.x += Math.random() * 160 - 80; player.y += Math.random() * 60; }
    try {
      const room = await Net.join(target, (uid) => ({ name: myName(uid), look: myLook(), x: Math.round(player.x), y: Math.round(player.y) }));
      if (token !== joinToken || currentScreen !== 'outdoor') return;
      addLog('', room.startsWith('pub') ? '🌳 進入公開公園，跟大家打個招呼吧！' : `🔒 進入朋友房間 ${room}`, 'sys');
    } catch (e) {
      console.warn('連線失敗', e);
      if (token !== joinToken) return;
      Net.leave();
      setState('error');
      toast('連不上線，先自己玩吧～');
    }
  }

  function choose(p) {
    pref = p;
    write(PREF_KEY, p);
    connect();
  }

  // ───────────── 彈窗 ─────────────

  function openRoomMenu() {
    const room = Net.room;
    const inRoom = state === 'on' && room && !room.startsWith('pub');
    const m = modal(`<div class="online-box">
      <div class="game-icon">🌐</div>
      <h2>跟大家一起玩</h2>
      <p class="online-now">現在：<b>${$('span', chip).textContent}</b></p>
      ${inRoom ? `<div class="invite">房間代碼 <b class="code">${room}</b><button class="btn btn-small btn-blue" data-act="share">📋 分享邀請連結</button></div>` : ''}
      <div class="online-opts">
        <button class="btn btn-pink" data-act="public">🌳 公開公園<small>會遇到其他玩家</small></button>
        <button class="btn btn-blue" data-act="create">🔒 開朋友房間<small>只有知道代碼的人能進來</small></button>
        <form class="code-row"><input maxlength="5" placeholder="房間代碼" autocapitalize="characters" autocomplete="off" aria-label="房間代碼"><button class="btn btn-yellow">加入</button></form>
        <button class="btn btn-gray" data-act="solo">🙈 自己玩</button>
      </div>
      ${blocked.size ? `<p class="note">已封鎖 ${blocked.size} 位玩家 <button class="link-btn" data-act="unblock">全部解除</button></p>` : ''}
      <p class="note">⚠️ 聊天時不要說出真實姓名、學校、電話或住址喔！</p>
    </div>`, { cls: 'small' });
    const codeIn = $('.code-row input', m.box);
    $('.code-row', m.box).addEventListener('submit', (e) => {
      e.preventDefault();
      const code = codeIn.value.trim().toUpperCase();
      if (!Net.isCode(code)) { toast('代碼是 5 個英文字母或數字喔'); return; }
      m.close();
      choose(`room:${code}`);
    });
    m.box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      sfx.tab();
      if (act === 'share') return shareInvite(room);
      if (act === 'unblock') {
        blocked.clear();
        write(BLOCK_KEY, []);
        remotes.forEach((r) => { r.hidden = false; r.el.hidden = false; });
        refreshChip();
        e.target.closest('.note').remove();
        return;
      }
      m.close();
      if (act === 'create') choose(`room:${Net.newCode()}`);
      else choose(act);
    });
    m.root.addEventListener('closed', () => { if (!pref) choose('solo'); viewport.focus(); });
  }

  async function shareInvite(room) {
    const url = `${location.origin}${location.pathname}?room=${room}`;
    const text = `來鼠鼠小屋跟我一起玩！房間代碼 ${room}`;
    try {
      if (navigator.share) { await navigator.share({ title: '鼠鼠小屋', text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast('已複製邀請連結，貼給朋友吧！');
    } catch (e) {
      if (e?.name !== 'AbortError') toast(`邀請連結：${url}`);
    }
  }

  function openPlayerMenu(r) {
    const m = modal(`<div class="online-box">
      <div class="pm-pet">${petSvg(r.look)}</div>
      <h2></h2>
      <div class="modal-actions">
        <button class="btn btn-pink" data-act="wave">👋 打招呼</button>
        <button class="btn btn-gray" data-act="block">🚫 封鎖</button>
      </div>
      <p class="note">封鎖後就看不到他的鼠鼠和訊息。</p>
    </div>`, { cls: 'small' });
    $('h2', m.box).textContent = r.name;
    m.box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      m.close();
      if (act === 'wave') doEmote('wave');
      if (act === 'block') {
        blocked.add(r.uid);
        write(BLOCK_KEY, [...blocked]);
        r.hidden = true;
        r.el.hidden = true;
        refreshChip();
        toast(`已封鎖 ${escapeXml(r.name)}`);
      }
    });
    m.root.addEventListener('closed', () => viewport.focus());
  }

  // ───────────── 聊天、表情 ─────────────

  function doEmote(k) {
    playEmote(k, $('.pet-svg', player.el), player.x, player.y);
    Net.emote(k);
  }

  function send(text) {
    text = clean(text);
    if (!text || !Net.room) return false;
    const t = performance.now();
    if (t - lastChat < 1600) { toast('慢慢說～'); return false; }
    lastChat = t;
    Net.chat(text, myName()).catch((e) => { console.warn(e); toast('訊息沒送出去，等一下再試試'); });
    return true;
  }

  function showPop(kind) {
    if (!pop.hidden && pop.dataset.kind === kind) { pop.hidden = true; return; }
    pop.dataset.kind = kind;
    pop.innerHTML = kind === 'quick'
      ? QUICK.map((q) => `<button type="button" data-say="${q}">${q}</button>`).join('')
      : EMOTES.map(([id, icon, label]) => `<button type="button" data-emote="${id}">${icon} ${label}</button>`).join('');
    pop.hidden = false;
  }

  chip.addEventListener('click', () => { sfx.tab(); openRoomMenu(); });
  dock.addEventListener('click', (e) => {
    const tool = e.target.closest('[data-pop]');
    if (tool) { sfx.tab(); showPop(tool.dataset.pop); return; }
    const say = e.target.closest('[data-say]');
    if (say) { if (send(say.dataset.say)) pop.hidden = true; return; }
    const emo = e.target.closest('[data-emote]');
    if (emo) { doEmote(emo.dataset.emote); pop.hidden = true; }
  });
  $('.chat-bar', dock).addEventListener('submit', (e) => {
    e.preventDefault();
    if (!send(input.value)) return;
    input.value = '';
    input.blur();
    viewport.focus();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.blur(); viewport.focus(); }
  });
  // 鍵盤玩家：沒有靠近攤位時按 Enter 開始打字
  window.addEventListener('keydown', (e) => {
    if (currentScreen !== 'outdoor' || state !== 'on' || uiBlocked() || e.key !== 'Enter') return;
    if (e.target.matches('input, textarea') || PARK.near()) return;
    e.preventDefault();
    input.focus();
  });
  // 點別的玩家：打招呼或封鎖
  world.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.walker.remote');
    if (!el || uiBlocked()) return;
    e.stopPropagation();
    const r = remotes.get(el.dataset.uid);
    if (r) openPlayerMenu(r);
  });

  // ───────────── 每一幀 ─────────────

  PARK.hooks.tick.push((dt) => {
    const now = performance.now();
    for (const r of remotes.values()) {
      const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy);
      if (d > 500) { r.x = r.tx; r.y = r.ty; } else if (d > 0.5) {
        const step = Math.min(d, Math.max(320, d * 5) * dt);
        r.x += (dx / d) * step; r.y += (dy / d) * step;
      }
      const moving = d > 3;
      if (moving !== r.moving) {
        r.moving = moving;
        $('.pet-svg', r.el)?.classList.toggle('walking', moving);
      }
      if (moving && Math.abs(dx) > 1) r.el.style.setProperty('--lean', `${dx > 0 ? 5 : -5}deg`);
      if (r.sayUntil && now > r.sayUntil) { r.sayUntil = 0; $('.bubble.say', r.el)?.classList.remove('show'); }
      PARK.placeWalker(r.el, r.x, r.y, byId(SPECIES, r.look.species).scale);
    }
    // 自己的對話泡泡（走動時鼠鼠會重畫，所以每幀補上）
    const b = $('.bubble.say', player.el);
    if (b) {
      if (b.textContent !== mySay.text) b.textContent = mySay.text;
      b.classList.toggle('show', now < mySay.until);
    }
    // 位置最多每 0.15 秒送一次
    if (Net.room && now - sendT > 150) {
      const x = Math.round(player.x), y = Math.round(player.y);
      if (Math.abs(x - (player.sentX ?? -99)) > 2 || Math.abs(y - (player.sentY ?? -99)) > 2) {
        player.sentX = x; player.sentY = y; sendT = now;
        Net.move(x, y);
      }
    }
  });

  PARK.hooks.enter.push(() => {
    chip.hidden = false;
    pop.hidden = true;
    if (!pref) { setState('off'); openRoomMenu(); } else connect();
  });
  PARK.hooks.leave.push(() => {
    joinToken++;
    clearRemotes();
    Net.leave();
    setState('off');
    input.blur();
  });
  window.addEventListener('pagehide', () => Net.leave());
})();
