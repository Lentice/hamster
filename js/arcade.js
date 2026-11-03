// 遊戲室統一整理玩法資訊；不改變既有遊戲的計分規則。
const GAME_DETAILS = {
  catch: { kind: 'reaction', time: '30 秒', tip: '接住瓜子，閃開辣椒', goals: [10, 30, 60], color: '#fff0cf' },
  wheel: { kind: 'reaction', time: '10 秒', tip: '左右交替，越跑越快', goals: [20, 50, 90], color: '#e5f4e9' },
  memory: { kind: 'puzzle', time: '慢慢想', tip: '把一樣的圖案找出來', goals: [30, 60, 90], color: '#f3e9fb' },
  whack: { kind: 'reaction', time: '30 秒', tip: '眼明手快，小心別打錯', goals: [10, 25, 45], color: '#ffe8dd' },
  runner: { kind: 'reaction', time: '挑戰最遠', tip: '跳過障礙，還能二段跳', goals: [100, 400, 800], color: '#e4f2ff' },
  maze: { kind: 'puzzle', time: '90 秒', tip: '探索路線，帶瓜子回家', goals: [40, 100, 180], color: '#e9f5db' },
  stack: { kind: 'reaction', time: '挑戰最高', tip: '瞄準中心，疊出夢幻蛋糕', goals: [5, 12, 25], color: '#ffe4ef' },
  music: { kind: 'puzzle', time: '一關接一關', tip: '跟著旋律，記住順序', goals: [3, 6, 10], color: '#eee8ff' },
  fish: { kind: 'relax', time: '45 秒', tip: '看準時機，釣起金色驚喜', goals: [10, 25, 50], color: '#dff5f5' },
  bubble: { kind: 'relax', time: '40 秒', tip: '找對顏色，戳出連擊', goals: [15, 40, 80], color: '#e7edff' },
};
const GAME_KINDS = { reaction: '手速挑戰', puzzle: '動動腦', relax: '輕鬆玩' };
const gameDetails = (id) => GAME_DETAILS[id] || { kind: 'relax', time: '輕鬆一局', tip: '一起試試新玩法', goals: [10, 25, 50], color: '#fff0f5' };
const arcadeMatches = (id, game, kind, query) => (kind === 'all' || gameDetails(id).kind === kind)
  && `${game.name} ${gameDetails(id).tip} ${GAME_KINDS[gameDetails(id).kind]}`.toLowerCase().includes(query.trim().toLowerCase());
function dailyGameId(day, ids) {
  if (!ids.length) return null;
  const hash = [...day].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);
  return [...ids].sort()[hash % ids.length];
}

const Arcade = (() => {
  const grid = $('#arcade-grid');
  let kind = 'all';
  function launch(id) {
    if (!Object.hasOwn(GAMES, id)) return;
    openGame(id, () => { if (currentScreen === 'arcade') draw(); });
  }
  function draw() {
    const q = questState();
    const ids = Object.keys(GAMES), pending = ids.filter((id) => !q.games.includes(id));
    const pick = dailyGameId(localDay(), pending.length ? pending : ids);
    const game = GAMES[pick];
    $('#arcade-spotlight').innerHTML = `<div class="daily-pick"><span class="eyebrow">TODAY'S LITTLE ADVENTURE</span><h2>${game.icon} 今天試試${game.name}</h2><p>${gameDetails(pick).tip}</p><div class="chip-row"><button class="btn btn-pink" data-spotlight="${pick}">玩今日推薦</button><button class="btn btn-gray" data-surprise>幫我選一個</button></div></div>
      <div class="daily-pass"><span class="eyebrow">每日冒險集章</span><h2>${q.done ? '今天的獎勵到手了！' : `再玩 ${Math.max(0, QUEST_GAMES - q.games.length)} 種，帶回 50 幣`}</h2>
      <div class="quest-stamps" aria-label="今日任務 ${Math.min(QUEST_GAMES, q.games.length)} / ${QUEST_GAMES}">${Array.from({ length: QUEST_GAMES }, (_, i) => `<span class="${q.games.length > i ? 'stamped' : ''}" aria-hidden="true">${q.games.length > i ? '✓' : i + 1}</span>`).join('')}</div><p>每款拿到 1 分就能蓋章，獎勵自動領取。</p></div>`;
    $('.arcade-count').textContent = `${Object.keys(GAMES).length} 種小冒險`;
    const entries = Object.entries(GAMES).filter(([id, game]) => arcadeMatches(id, game, kind === 'favorites' ? 'all' : kind, $('#arcade-search').value)
      && (kind !== 'favorites' || save.favoriteGames?.[id]));
    $('#arcade-results').textContent = `找到 ${entries.length} 個遊戲`;
    grid.innerHTML = entries.map(([id, game]) => {
      const info = gameDetails(id);
      return `<article class="arcade-card" style="--game-color:${info.color}">
        <div class="arcade-art"><span aria-hidden="true">${game.icon}</span><button class="favorite-game" data-favorite="${id}" aria-pressed="${!!save.favoriteGames?.[id]}" aria-label="收藏${game.name}">${save.favoriteGames?.[id] ? '♥' : '♡'}</button></div><div class="arcade-card-body">
        <div class="arcade-meta"><span>${GAME_KINDS[info.kind]}</span><span>${info.time}</span></div>
        <h2>${game.name}</h2><p>${info.tip}</p><div class="arcade-record">${save.best[id] ? `最佳 ${save.best[id]} 分` : '第一個紀錄，等你來創造'}</div>
        <button class="btn btn-pink" data-play="${id}" aria-label="玩${game.name}">開始玩 <span aria-hidden="true">↗</span></button></div></article>`;
    }).join('') || '<div class="empty-state soft-panel">還沒找到這種小冒險。<br><button class="btn btn-gray" data-clear-search>看看全部遊戲</button></div>';
  }
  grid.addEventListener('click', (e) => {
    const favorite = e.target.closest('[data-favorite]');
    if (favorite) {
      const id = favorite.dataset.favorite;
      syncStoredSave(); save.favoriteGames ||= {};
      if (save.favoriteGames[id]) delete save.favoriteGames[id]; else save.favoriteGames[id] = true;
      persist(); draw();
      ($(`[data-favorite="${id}"]`, grid) || $('[data-kind=favorites]')).focus();
      return;
    }
    const button = e.target.closest('[data-play]'); if (button) launch(button.dataset.play);
    if (e.target.closest('[data-clear-search]')) { kind = 'all'; $('#arcade-search').value = ''; syncFilters(); draw(); }
  });
  function syncFilters() { $$('#arcade-filters [data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === kind))); }
  $('#arcade-search').addEventListener('input', draw);
  $('#arcade-spotlight').addEventListener('click', (e) => {
    const pick = e.target.closest('[data-spotlight]'); if (pick) launch(pick.dataset.spotlight);
    if (e.target.closest('[data-surprise]')) {
      const pending = Object.keys(GAMES).filter((id) => !questState().games.includes(id));
      const ids = pending.length ? pending : Object.keys(GAMES);
      launch(ids[Math.floor(Math.random() * ids.length)]);
    }
  });
  $('#arcade-filters').addEventListener('click', (e) => {
    const button = e.target.closest('[data-kind]'); if (!button) return;
    kind = button.dataset.kind; syncFilters(); draw();
  });
  SCREENS.arcade = { enter: draw };
  saveListeners.push(() => { if (currentScreen === 'arcade') draw(); });
  return { draw, launch };
})();
