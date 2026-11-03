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
function snackQuestion(level = 0, rng = Math.random) {
  const max = Math.min(20, 5 + Math.floor(Math.max(0, level) / 5) * 3);
  let a = 1 + Math.floor(rng() * max), b = 1 + Math.floor(rng() * max);
  const subtract = rng() < 0.5;
  if (subtract && b > a) [a, b] = [b, a];
  const answer = subtract ? a - b : a + b;
  const wrong = shuffledList([-3, -2, -1, 1, 2, 3, 4].map((offset) => answer + offset).filter((value) => value >= 0), rng).slice(0, 3);
  return { a, b, subtract, answer, choices: shuffledList([answer, ...wrong], rng) };
}

Object.assign(GAMES, {
  delivery: { name: '點心快遞', icon: '🧺', desc: '把桌上的食物送進正確籃子：鮮蔬、堅果或甜點。<br>送對 +1 分，連續 5 次正確再 +3！送錯扣 1 分。<br>點籃子，或按鍵盤 1 / 2 / 3。', start: startDelivery },
  starlight: { name: '星光尋寶', icon: '🌟', desc: '依照 1 → 9 的順序，找出藏在夜空裡的星星！<br>每顆 +1 分，找齊一片星空再 +5 分。點錯扣 1 分。<br>可點選星星，也能用 Tab 與 Enter 操作。', start: startStarlight },
  snackmath: { name: '甜點算算', icon: '🍪', desc: '幫點心店算出正確的加減法答案！<br>答對 +2 分，每連續 5 題再 +3 分；答錯扣 1 分。<br>點答案，或按鍵盤 1 / 2 / 3 / 4。', start: startSnackMath },
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

function startSnackMath(area, ctl) {
  const session = cozySession(area, ctl, 45, '<div class="snack-blackboard"><span class="eyebrow">點心店的小小算術師</span><div class="snack-equation"></div><p class="snack-level"></p></div><div class="snack-answers"></div><p class="section-note">每答對 5 題，算式會變得更有挑戰。沒有負數答案。</p>');
  let solved = 0, streak = 0, question;
  function next() {
    question = snackQuestion(solved);
    $('.snack-equation', area).textContent = `${question.a} ${question.subtract ? '−' : '+'} ${question.b} = ?`;
    $('.snack-level', area).textContent = `已完成 ${solved} 題 · ${solved < 5 ? '暖身時間' : '漸入佳境'}`;
    $('.snack-answers', area).innerHTML = question.choices.map((answer, i) => `<button class="snack-answer" data-answer-index="${i}" aria-label="選項 ${i + 1}：${answer}"><small>${i + 1}</small><b>${answer}</b></button>`).join('');
  }
  area.addEventListener('click', (e) => {
    const button = e.target.closest('[data-answer-index]'); if (!button || button.disabled || !session.active()) return;
    const answer = question.choices[Number(button.dataset.answerIndex)];
    if (answer !== question.answer) { streak = 0; session.award(-1); session.feedback('差一點點，再想一想！', false); button.disabled = true; sfx.bad(); return; }
    solved++; streak++; const bonus = streak % 5 === 0;
    session.award(bonus ? 5 : 2); session.feedback(bonus ? `連續 ${streak} 題！額外 +3 分` : '算對了！點心店謝謝你'); sfx.coin();
    const hadFocus = button === document.activeElement;
    next(); if (hadFocus) $('.snack-answer', area).focus();
  });
  const onKey = (e) => { if (!e.repeat && ['1', '2', '3', '4'].includes(e.key) && session.active()) { e.preventDefault(); $(`[data-answer-index="${Number(e.key) - 1}"]`, area)?.click(); } };
  window.addEventListener('keydown', onKey);
  ctl.onStop(() => window.removeEventListener('keydown', onKey));
  next();
}
