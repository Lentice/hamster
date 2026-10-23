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
  bad: () => tone(300, 0.25, 'sawtooth', 0.06, 0.5),
  win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, 1, i * 0.1)),
  step: () => tone(240 + Math.random() * 60, 0.05, 'sine', 0.04, 1.2),
};

function setMuted(v) {
  muted = v;
  try { localStorage.setItem('hamster-muted', v ? '1' : '0'); } catch { /* 忽略 */ }
  $('#mute').textContent = v ? '🔇' : '🔊';
}

// ───────────────────────── 提示與彈窗 ─────────────────────────

function toast(msg) {
  const el = html(`<div class="toast">${msg}</div>`);
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 1800);
  setTimeout(() => el.remove(), 2300);
}

let openModals = 0;
const uiBlocked = () => openModals > 0;

function modal(content, { cls = '', closable = true } = {}) {
  const root = html(`<div class="modal-back"><div class="modal ${cls}">${closable ? '<button class="modal-x" aria-label="關閉">✕</button>' : ''}</div></div>`);
  const box = $('.modal', root);
  if (typeof content === 'string') box.insertAdjacentHTML('beforeend', content);
  else box.appendChild(content);
  document.body.appendChild(root);
  openModals++;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    openModals--;
    root.classList.add('out');
    setTimeout(() => root.remove(), 200);
    root.dispatchEvent(new Event('closed'));
  };
  if (closable) {
    $('.modal-x', root).onclick = close;
    root.addEventListener('pointerdown', (e) => { if (e.target === root) close(); });
  }
  return { root, box, close };
}

// 購買確認。成功時呼叫 onBought
function askBuy(cat, item, thumbHtml, onBought) {
  const enough = save.coins >= item.price;
  const m = modal(`
    <div class="buy-box">
      <div class="buy-thumb">${thumbHtml}</div>
      <h3>${item.name}</h3>
      <p class="price-big">🪙 ${item.price}</p>
      ${enough ? '<p>要買下來嗎？</p>' : `<p class="warn">鼠鼠幣還差 ${item.price - save.coins} 枚～<br>去「出門玩」玩小遊戲賺吧！</p>`}
      <div class="modal-actions">
        ${enough ? '<button class="btn btn-pink" data-act="buy">買下來！</button>' : '<button class="btn btn-blue" data-act="go">出門賺幣</button>'}
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
function updateCoins() {
  const el = $('#coin-count');
  const target = save.coins;
  if (target === shownCoins) { el.textContent = target; return; }
  const chip = $('#coins');
  chip.classList.remove('bump');
  void chip.offsetWidth;
  chip.classList.add('bump');
  const from = shownCoins;
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / 400);
    el.textContent = Math.round(from + (target - from) * k);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
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
  if (currentScreen === name) return;
  if (currentScreen) SCREENS[currentScreen]?.leave?.();
  currentScreen = name;
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
  $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.screen === name));
  SCREENS[name]?.enter?.();
  try { localStorage.setItem('hamster-screen', name); } catch { /* 忽略 */ }
}

// 鼠鼠的隨機小動作（加在 .pet-svg 上的 class）
function petAct(svgEl, act, ms = 700) {
  if (!svgEl) return;
  [...svgEl.classList].filter((c) => c.startsWith('act-')).forEach((c) => svgEl.classList.remove(c));
  void svgEl.getBoundingClientRect();
  svgEl.classList.add(`act-${act}`);
  setTimeout(() => svgEl.classList.remove(`act-${act}`), ms);
}
