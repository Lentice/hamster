// 共用介面：音效、提示訊息、彈窗、金幣顯示、畫面切換

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function html(str) {
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  return t.content.firstElementChild;
}

// ───────────────────────── 音效 ─────────────────────────

let audioCtx;
let muted = false;
try { muted = localStorage.getItem('hamster-muted') === '1'; } catch { /* 忽略 */ }

// 手機短震動（有支援才會震；關掉音效時也一起關）
function buzz(ms) {
  if (muted) return;
  try { navigator.vibrate?.(ms); } catch { /* 不支援就算了 */ }
}

function tone(freq, dur = 0.15, type = 'sine', vol = 0.12, slide = 1.8, delay = 0) {
  if (muted) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime + delay;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur * 0.6);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch { /* 不支援音效就算了 */ }
}

const sfx = {
  pop: () => tone(660 + Math.random() * 200),
  tab: () => tone(520, 0.1),
  squeak: () => { tone(1200, 0.08, 'sine', 0.1, 1.4); tone(1500, 0.1, 'sine', 0.08, 1.3, 0.09); },
  coin: () => { tone(988, 0.08, 'square', 0.05, 1); tone(1319, 0.16, 'square', 0.05, 1, 0.08); },
  buy: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.1, 1, i * 0.08)),
  bad: () => { tone(300, 0.25, 'sawtooth', 0.06, 0.5); buzz(40); },
  win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, 1, i * 0.1)),
  step: () => tone(240 + Math.random() * 60, 0.05, 'sine', 0.04, 1.2),
};

function setMuted(v) {
  muted = v;
  try { localStorage.setItem('hamster-muted', v ? '1' : '0'); } catch { /* 忽略 */ }
  $('#mute').textContent = v ? '🔇' : '🔊';
  $('#mute').setAttribute('aria-pressed', String(v));
  $('#mute').setAttribute('aria-label', v ? '開啟音效' : '關閉音效');
}

// ───────────────────────── 提示與彈窗 ─────────────────────────

function toast(msg) {
  const el = html(`<div class="toast">${msg}</div>`);
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 1800);
  setTimeout(() => el.remove(), 2300);
}

let openModals = 0;
const modalStack = [];
let backgroundInert = [];
const uiBlocked = () => openModals > 0;

// fullscreen：全螢幕（小遊戲用），點外面不會關閉，只能按 ✕；beforeClose 回傳 false 可攔下 ✕
function modal(content, { cls = '', closable = true, fullscreen = false, beforeClose = null, label = '鼠鼠小屋視窗' } = {}) {
  const previousFocus = document.activeElement;
  const root = html(`<div class="modal-back ${fullscreen ? 'full' : ''}"><div class="modal ${cls} ${fullscreen ? 'fullscreen' : ''}" role="dialog" aria-modal="true" tabindex="-1">${closable ? '<button class="modal-x" aria-label="關閉">✕</button>' : ''}</div></div>`);
  const box = $('.modal', root);
  if (typeof content === 'string') box.insertAdjacentHTML('beforeend', content);
  else box.appendChild(content);
  box.setAttribute('aria-label', $('h2, h3', box)?.textContent || label);
  if (!modalStack.length) {
    backgroundInert = [...document.querySelectorAll('body > header, body > main')].map((el) => [el, el.inert]);
    backgroundInert.forEach(([el]) => { el.inert = true; });
    document.body.classList.add('modal-open');
  }
  modalStack.forEach((entry) => { entry.root.inert = true; entry.box.removeAttribute('aria-modal'); });
  document.body.appendChild(root);
  const entry = { root, box };
  modalStack.push(entry);
  openModals++;
  const focusable = () => $$('button, [href], input, select, textarea, [tabindex]', box)
    .filter((el) => !el.disabled && !el.hidden && el.tabIndex >= 0 && el.getClientRects().length && !el.closest('[inert]'));
  (focusable()[0] || box).focus({ preventScroll: true });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    const wasTop = modalStack.at(-1) === entry;
    modalStack.splice(modalStack.indexOf(entry), 1);
    openModals--;
    document.removeEventListener('keydown', onKey, true);
    root.inert = true;
    box.removeAttribute('aria-modal');
    const top = modalStack.at(-1);
    if (top) { top.root.inert = false; top.box.setAttribute('aria-modal', 'true'); }
    else {
      backgroundInert.forEach(([el, inert]) => { el.inert = inert; });
      backgroundInert = [];
      document.body.classList.remove('modal-open');
    }
    if (wasTop) {
      const target = previousFocus?.isConnected && !previousFocus.closest('[inert]') ? previousFocus : top?.box;
      target?.focus({ preventScroll: true });
    }
    root.classList.add('out');
    setTimeout(() => root.remove(), 200);
    root.dispatchEvent(new Event('closed'));
  };
  const requestClose = () => { if (!beforeClose || beforeClose(close) !== false) close(); };
  function onKey(e) {
    if (modalStack.at(-1) !== entry) return;
    if (e.key === 'Escape' && closable && !e.isComposing) {
      e.preventDefault(); e.stopPropagation(); requestClose();
    }
    if (e.key !== 'Tab') return;
    const list = focusable();
    if (!list.length) { e.preventDefault(); box.focus(); return; }
    const index = list.indexOf(document.activeElement);
    if (index < 0 || (e.shiftKey && index === 0) || (!e.shiftKey && index === list.length - 1)) {
      e.preventDefault(); list[e.shiftKey ? list.length - 1 : 0].focus();
    }
  }
  document.addEventListener('keydown', onKey, true);
  if (closable) {
    $('.modal-x', root).onclick = requestClose;
    if (!fullscreen) root.addEventListener('pointerdown', (e) => { if (e.target === root) requestClose(); });
  }
  return { root, box, close };
}

// 遊戲進行中按 ✕：先確認，避免不小心點到
function confirmQuit(onYes, text = '遊戲還沒結束，確定要離開嗎？', [stay, quit] = ['繼續玩', '離開遊戲']) {
  const m = modal(`<div class="buy-box"><div class="game-icon">🐹</div><h3>${text}</h3>
    <div class="modal-actions"><button class="btn btn-gray" data-q="no">${stay}</button><button class="btn btn-pink" data-q="yes">${quit}</button></div></div>`, { cls: 'small quit-box' });
  $('[data-q=no]', m.box).onclick = m.close;
  $('[data-q=yes]', m.box).onclick = () => { m.close(); onYes(); };
}

// 購買確認。成功時呼叫 onBought
function askBuy(cat, item, thumbHtml, onBought) {
  if (item.boxOnly) {
    const type = item.currency === 'moon' ? 'moon' : 'normal';
    toast(`這是${BLIND_BOXES[type].name}配飾，到商店開盲盒就有機會獲得喔！`);
    SCREENS.shop.openBox(type);
    return;
  }
  const moon = item.currency === 'moon';
  const balance = moon ? save.moonCoins : save.coins;
  const enough = balance >= item.price;
  const m = modal(`
    <div class="buy-box">
      <div class="buy-thumb">${thumbHtml}</div>
      <h3>${item.name}</h3>
      <p class="price-big">${itemCurrencyIcon(item)} ${item.price}</p>
      ${enough ? '<p>要買下來嗎？</p>' : `<p class="warn">${moon ? '月亮金幣' : '鼠鼠幣'}還差 ${item.price - balance} 枚～<br>${moon ? '每天登入可領 12 枚，慢慢收集吧！' : '去「出門玩」玩小遊戲賺吧！'}</p>`}
      <div class="modal-actions">
        ${enough ? '<button class="btn btn-pink" data-act="buy">買下來！</button>' : moon ? '' : '<button class="btn btn-blue" data-act="go">出門賺幣</button>'}
        <button class="btn btn-gray" data-act="no">先不要</button>
      </div>
    </div>`, { cls: 'small' });
  m.box.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'buy' && buy(cat, item)) {
      sfx.buy();
      toast(`買到了「${item.name}」！`);
      onBought?.();
    }
    if (act === 'go') showScreen('outdoor');
    m.close();
  });
}

// ───────────────────────── 金幣 ─────────────────────────

let shownCoins = save.coins;
let coinAnimation = 0;
function updateCoins() {
  $('#moon-count').textContent = save.moonCoins;
  const el = $('#coin-count');
  const target = save.coins;
  cancelAnimationFrame(coinAnimation);
  if (target === shownCoins) { el.textContent = target; return; }
  const chip = $('#coins');
  chip.classList.remove('bump');
  void chip.offsetWidth;
  chip.classList.add('bump');
  const from = Number(el.textContent) || 0;
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / 400);
    el.textContent = Math.round(from + (target - from) * k);
    if (k < 1) coinAnimation = requestAnimationFrame(step);
  };
  coinAnimation = requestAnimationFrame(step);
  shownCoins = target;
}
saveListeners.push(updateCoins);

// 在指定元素位置飄出「+N」
function floatText(parent, x, y, text, cls = '') {
  const el = html(`<div class="float-text ${cls}">${text}</div>`);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  parent.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ───────────────────────── 畫面切換 ─────────────────────────

const SCREENS = {};
let currentScreen = null;

function showScreen(name) {
  if (!Object.hasOwn(SCREENS, name)) return;
  if (currentScreen === name) return;
  if (currentScreen) SCREENS[currentScreen]?.leave?.();
  currentScreen = name;
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
  $$('.nav-btn').forEach((b) => {
    const active = b.dataset.screen === name;
    b.classList.toggle('active', active);
    if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  SCREENS[name]?.enter?.();
  try { localStorage.setItem('hamster-screen', name); } catch { /* 忽略 */ }
}

// 分類頁籤共用鍵盤操作；重繪後重新取得按鈕，保留焦點。
function keyboardTabs(root, selector) {
  root.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const tabs = $$(selector, root);
    const index = tabs.indexOf(e.target.closest(selector));
    if (index < 0) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1
      : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].click();
    $$(selector, root)[next]?.focus();
  });
}

// 鼠鼠的隨機小動作（加在 .pet-svg 上的 class）
function petAct(svgEl, act, ms = 700) {
  if (!svgEl) return;
  [...svgEl.classList].filter((c) => c.startsWith('act-')).forEach((c) => svgEl.classList.remove(c));
  void svgEl.getBoundingClientRect();
  svgEl.classList.add(`act-${act}`);
  setTimeout(() => svgEl.classList.remove(`act-${act}`), ms);
}
