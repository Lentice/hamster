// 啟動

// 素材還沒產生或載入失敗時隱藏，不顯示破圖
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') e.target.classList.add('missing');
}, true);

$$('.nav-btn').forEach((b) => b.addEventListener('click', () => { showScreen(b.dataset.screen); sfx.tab(); }));
$('#mute').addEventListener('click', () => setMuted(!muted));
setMuted(muted);
updateCoins();

let startScreen = 'wardrobe';
try { startScreen = localStorage.getItem('hamster-screen') || startScreen; } catch { /* 忽略 */ }
showScreen(SCREENS[startScreen] ? startScreen : 'wardrobe');

// 第一次玩的歡迎訊息
try {
  if (!localStorage.getItem('hamster-welcomed')) {
    localStorage.setItem('hamster-welcomed', '1');
    modal(`<div class="game-intro"><div class="game-icon">🐹</div><h2>歡迎來到鼠鼠小屋！</h2>
      <p>👗 幫鼠鼠換上喜歡的衣服<br>🏠 佈置鼠鼠的家<br>🌳 出門散步、玩小遊戲賺鼠鼠幣<br>🛒 用鼠鼠幣買特別的衣服和家具</p>
      <p>先送你 <b>🪙 ${START_COINS}</b> 鼠鼠幣當見面禮！</p></div>`, { cls: 'small' });
  }
} catch { /* 忽略 */ }
