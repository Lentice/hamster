// 短局型新遊戲共用暫停時鐘、回饋與既有結算介面。
const DELIVERY_FOODS = [
  { icon: '🥕', name: '紅蘿蔔', lane: 0 }, { icon: '🥦', name: '花椰菜', lane: 0 }, { icon: '🌽', name: '玉米', lane: 0 },
  { icon: '🌻', name: '葵花子', lane: 1 }, { icon: '🌰', name: '栗子', lane: 1 }, { icon: '🥜', name: '花生', lane: 1 },
  { icon: '🍰', name: '蛋糕', lane: 2 }, { icon: '🍩', name: '甜甜圈', lane: 2 }, { icon: '🧁', name: '杯子蛋糕', lane: 2 },
];
const deliveryOrder = (rng = Math.random) => DELIVERY_FOODS[Math.floor(rng() * DELIVERY_FOODS.length)];
function shuffledList(values, rng = Math.random) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

Object.assign(GAMES, {
  delivery: { name: '點心快遞', icon: '🧺', desc: '把桌上的食物送進正確籃子：鮮蔬、堅果或甜點。<br>送對 +1 分，連續 5 次正確再 +3！送錯扣 1 分。<br>點籃子，或按鍵盤 1 / 2 / 3。', start: startDelivery },
  starlight: { name: '星光尋寶', icon: '🌟', desc: '依照 1 → 9 的順序，找出藏在夜空裡的星星！<br>每顆 +1 分，找齊一片星空再 +5 分。點錯扣 1 分。<br>可點選星星，也能用 Tab 與 Enter 操作。', start: startStarlight },
});

function cozySession(area, ctl, seconds, content) {
  area.innerHTML = `${hudHtml()}<div class="cozy-game">${content}<p class="play-feedback" role="status">準備好了，開始吧！</p></div>`;
  const clock = gameClock(ctl);
  let score = 0, ended = false;
  const tick = () => {
    if (ctl.isStopped() || ended) return;
    const remaining = Math.max(0, seconds - clock.now() / 1000);
    $('.h-time', area).textContent = Math.ceil(remaining);
    if (remaining <= 0) { ended = true; ctl.finish(score, Math.min(150, score * 3)); }
  };
  const timer = setInterval(tick, 100);
  ctl.onStop(() => clearInterval(timer));
  tick();
  return {
    active: () => !ended && !ctl.isStopped() && !gamePaused() && clock.now() < seconds * 1000,
    award(points) { score = Math.max(0, score + points); $('.h-score', area).textContent = score; },
    feedback(text, good = true) { const el = $('.play-feedback', area); el.textContent = text; el.dataset.tone = good ? 'good' : 'miss'; },
    clock,
  };
}

function startDelivery(area, ctl) {
  const session = cozySession(area, ctl, 35, `<div class="delivery-counter"><span class="eyebrow">鼠鼠的點心訂單</span><div class="delivery-order"></div><div class="delivery-next" aria-label="接下來的訂單"></div></div>
    <div class="delivery-lanes">${['🥕 鮮蔬', '🌰 堅果', '🧁 甜點'].map((name, i) => `<button class="delivery-lane" data-lane="${i}"><span>${name}</span><small>按 ${i + 1}</small></button>`).join('')}</div><p class="section-note">連續送對 5 份，額外加 3 分。慢慢看準再送！</p>`);
  const queue = Array.from({ length: 4 }, () => deliveryOrder());
  let streak = 0;
  function draw() {
    $('.delivery-order', area).innerHTML = `<span aria-hidden="true">${queue[0].icon}</span><b>${queue[0].name}</b>`;
    $('.delivery-next', area).innerHTML = `接下來 ${queue.slice(1).map((food) => `<span aria-label="${food.name}">${food.icon}</span>`).join('')}`;
  }
  function deliver(lane) {
    if (!session.active()) return;
    const correct = queue[0].lane === lane;
    if (correct) {
      streak++;
      const bonus = streak % 5 === 0;
      session.award(bonus ? 4 : 1);
      session.feedback(bonus ? `連續 ${streak} 份！額外 +3 分` : `送到了！連續 ${streak} 份`);
      sfx.pop();
    } else { streak = 0; session.award(-1); session.feedback('送錯籃子了，下一份再試試！', false); sfx.bad(); }
    queue.shift(); queue.push(deliveryOrder()); draw();
  }
  area.addEventListener('click', (e) => { const lane = e.target.closest('[data-lane]'); if (lane) deliver(Number(lane.dataset.lane)); });
  const onKey = (e) => { if (!e.repeat && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); deliver(Number(e.key) - 1); } };
  window.addEventListener('keydown', onKey);
  ctl.onStop(() => window.removeEventListener('keydown', onKey));
  draw();
}

function startStarlight(area, ctl) {
  const session = cozySession(area, ctl, 45, '<div class="star-sky"><span class="eyebrow">把散落的星星串成星空</span><h2 class="star-prompt"></h2><div class="star-grid" role="group" aria-label="依照數字順序尋找星星"></div><p class="star-round"></p></div>');
  let next = 1, round = 1;
  function prompt() { $('.star-prompt', area).textContent = `下一顆：${next}`; }
  function board() {
    const stars = shuffledList(Array.from({ length: 9 }, (_, i) => i + 1));
    $('.star-grid', area).innerHTML = stars.map((n) => `<button class="star-node" data-star="${n}" aria-label="星星 ${n}" aria-pressed="false"><span aria-hidden="true">★</span><b>${n}</b></button>`).join('');
    $('.star-round', area).textContent = `第 ${round} 片星空 · 找齊 9 顆額外 +5 分`;
    prompt();
  }
  area.addEventListener('click', (e) => {
    const button = e.target.closest('[data-star]'); if (!button || !session.active()) return;
    const n = Number(button.dataset.star);
    if (n < next) return;
    if (n !== next) { session.award(-1); session.feedback(`先找星星 ${next}，慢慢看沒關係`, false); sfx.bad(); return; }
    button.setAttribute('aria-pressed', 'true'); session.award(1); sfx.pop(); next++;
    if (next > 9) {
      session.award(5); session.feedback(`第 ${round} 片星空完成！額外 +5 分`); sfx.coin();
      const hadFocus = button === document.activeElement;
      round++; next = 1; board();
      if (hadFocus) $('.star-node', area).focus();
    } else { session.feedback(`找到 ${n} 了！再找 ${next}`); prompt(); }
  });
  board();
}
