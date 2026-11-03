// 跨畫面的遊玩入口與日常小目標。
(() => {
  const welcome = $('#daily-welcome');
  function drawWelcome() {
    const q = questState();
    const name = escapeXml(save.look.name.trim() || '鼠鼠');
    welcome.innerHTML = `<div><span class="eyebrow">A LITTLE HAPPY PLACE</span><h1>${name}，今天也一起玩吧！</h1>
      <p>${q.done ? '今天的小冒險完成了，自由玩喜歡的遊戲吧。' : `換套新衣、佈置小屋，再玩 ${Math.max(0, QUEST_GAMES - q.games.length)} 種遊戲，帶回今日獎勵。`}</p></div>
      <button class="btn btn-pink" data-discover>開始小冒險 <span aria-hidden="true">↗</span></button>`;
  }
  welcome.addEventListener('click', (e) => { if (e.target.closest('[data-discover]')) showScreen('arcade'); });
  $('#park-arcade').addEventListener('click', () => showScreen('arcade'));
  saveListeners.push(drawWelcome);
  drawWelcome();
})();
