// 短局型新遊戲共用暫停時鐘、回饋與既有結算介面。
const DELIVERY_FOODS = [
  { icon: '🥕', name: '紅蘿蔔', lane: 0 }, { icon: '🥦', name: '花椰菜', lane: 0 }, { icon: '🌽', name: '玉米', lane: 0 },
  { icon: '🌻', name: '葵花子', lane: 1 }, { icon: '🌰', name: '栗子', lane: 1 }, { icon: '🥜', name: '花生', lane: 1 },
  { icon: '🍰', name: '蛋糕', lane: 2 }, { icon: '🍩', name: '甜甜圈', lane: 2 }, { icon: '🧁', name: '杯子蛋糕', lane: 2 },
];
const deliveryOrder = (rng = Math.random) => DELIVERY_FOODS[Math.floor(rng() * DELIVERY_FOODS.length)];

Object.assign(GAMES, {
  delivery: { name: '點心快遞', icon: '🧺', desc: '把桌上的食物送進正確籃子：鮮蔬、堅果或甜點。<br>送對 +1 分，連續 5 次正確再 +3！送錯扣 1 分。<br>點籃子，或按鍵盤 1 / 2 / 3。', start: startDelivery },
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
