// 啟動

// iPad / 手機：擋掉連點兩下放大、雙指縮放，避免遊戲畫面被放大後點不到按鈕
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd < 350 && !e.target.closest('input, textarea')) {
    e.preventDefault();
    // 阻止放大的同時也吃掉了這次點擊，幫按鈕補發一次，連點才不會失靈
    e.target.closest('button, a, [data-act]')?.click();
  }
  lastTouchEnd = now;
}, { passive: false });
['gesturestart', 'gesturechange'].forEach((type) => document.addEventListener(type, (e) => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

// 素材還沒產生或載入失敗時隱藏，不顯示破圖
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') e.target.classList.add('missing');
}, true);

const syncTopbar = () => document.documentElement.style.setProperty('--topbar-h', `${$('.topbar').offsetHeight}px`);
new ResizeObserver(syncTopbar).observe($('.topbar'));
syncTopbar();

$$('.nav-btn').forEach((b) => b.addEventListener('click', () => { showScreen(b.dataset.screen); sfx.tab(); }));
$('#mute').addEventListener('click', () => setMuted(!muted));
setMuted(muted);
function collectDailyMoonCoins() {
  if (document.hidden) return;
  if (claimDailyMoonCoins()) toast('☾ 每日登入禮！領到了 12 枚銀色月亮金幣！');
}
window.addEventListener('storage', (e) => {
  if (e.key !== SAVE_KEY || !syncStoredSave()) return;
  if (currentScreen) {
    SCREENS[currentScreen]?.leave?.();
    SCREENS[currentScreen]?.enter?.();
  }
});
collectDailyMoonCoins();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) collectDailyMoonCoins();
});
// 跨午夜仍開著遊戲時，也能領到新一天的登入禮。
setInterval(collectDailyMoonCoins, 60000);
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
      <p>先送你 <b>🪙 ${START_COINS}</b> 鼠鼠幣當見面禮！<br>每天登入再領 <b>☾ 12 枚月亮金幣</b>，開月亮盲盒抽夢幻稀有配飾。<br>普通盲盒可以開出玫瑰花等小驚喜喔！</p></div>`, { cls: 'small' });
  }
} catch { /* 忽略 */ }
