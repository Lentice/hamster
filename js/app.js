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
// 收集獎勵上線前就已經買齊的分類，開遊戲時補發
{
  const before = Object.keys(save.collected || {}).length;
  [...CATEGORIES.map((c) => c.id), 'furniture', 'rooms'].forEach(checkCollection);
  if (Object.keys(save.collected || {}).length !== before) persist();
}
updateCoins();

let startScreen = 'wardrobe';
try { startScreen = localStorage.getItem('hamster-screen') || startScreen; } catch { /* 忽略 */ }
// 存檔內容有問題時不要讓整個遊戲卡住（設定按鈕還要能用來還原）
try { showScreen(SCREENS[startScreen] ? startScreen : 'wardrobe'); } catch (err) {
  console.error(err);
  try { showScreen('wardrobe'); } catch { /* 至少讓設定按鈕能用 */ }
}

// 第一次玩的歡迎訊息
try {
  if (!localStorage.getItem('hamster-welcomed')) {
    localStorage.setItem('hamster-welcomed', '1');
    modal(`<div class="game-intro"><div class="game-icon">🐹</div><h2>歡迎來到鼠鼠小屋！</h2>
      <p>👗 幫鼠鼠換上喜歡的衣服<br>🏠 佈置鼠鼠的家<br>🌳 出門散步、玩小遊戲賺鼠鼠幣<br>🛒 用鼠鼠幣買特別的衣服和家具</p>
      <p>先送你 <b>${HAMSTER_COIN_ICON} ${START_COINS}</b> 鼠鼠幣當見面禮！<br>每天登入再領 <b>☾ 12 枚月亮金幣</b>，開月亮盲盒抽夢幻稀有配飾。<br>普通盲盒可以開出玫瑰花等小驚喜喔！</p></div>`, { cls: 'small' });
  }
} catch { /* 忽略 */ }

// 晝夜：17–19 點黃昏、19–6 點晚上（每 5 分鐘檢查一次）
function updateDayTime() {
  const h = new Date().getHours();
  document.body.classList.toggle('dusk', h >= 17 && h < 19);
  document.body.classList.toggle('night', h >= 19 || h < 6);
}
updateDayTime();
setInterval(updateDayTime, 5 * 60 * 1000);

// 檢查備份檔的主要欄位型別，避免壞掉的檔案讓遊戲開不起來
function validBackup(d) {
  const obj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const opt = (v, ok) => v === undefined || ok(v);
  return obj(d) && Number.isFinite(d.coins) && obj(d.look)
    && opt(d.look.name, (v) => typeof v === 'string')
    && opt(d.look.species, (v) => typeof v === 'string')
    && opt(d.moonCoins, Number.isFinite)
    && opt(d.house, (v) => obj(v) && Array.isArray(v.floors) && v.floors.length > 0 && v.floors.every(obj))
    && ['owned', 'best', 'collected', 'fresh', 'played', 'quest'].every((k) => opt(d[k], obj))
    && opt(d.outfits, Array.isArray)
    && opt(d.diy, (v) => obj(v) && Object.values(v).every(Array.isArray));
}

// ⚙️ 設定（點左上角標誌）：音效、備份存檔到檔案、從檔案還原（換手機、清瀏覽器資料前可以先備份）
$('#settings').addEventListener('click', () => {
  const m = modal(`<div class="settings-box"><div class="game-icon">🐹</div><h2>設定與備份</h2>
    <div class="settings-list">
      <button class="btn btn-gray" data-act="mute">${muted ? '🔇 音效：關' : '🔊 音效：開'}</button>
      <button class="btn btn-blue" data-act="export">📥 備份存檔（下載檔案）</button>
      <button class="btn btn-yellow" data-act="import">📤 從備份檔還原</button>
      <button class="btn btn-pink" data-act="records">🏆 我的紀錄</button>
      <input type="file" accept=".json,application/json" hidden>
    </div>
    <p class="settings-note">存檔只存在這台裝置的瀏覽器裡。換手機或清除瀏覽器資料前，記得先備份喔！</p></div>`, { cls: 'small' });
  const file = $('input[type=file]', m.box);
  m.box.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'mute') { setMuted(!muted); e.target.closest('button').textContent = muted ? '🔇 音效：關' : '🔊 音效：開'; }
    if (act === 'export') {
      persist();
      const blob = new Blob([localStorage.getItem(SAVE_KEY) || JSON.stringify(save)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `鼠鼠小屋存檔-${localDay()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('存檔下載好了！');
    }
    if (act === 'import') file.click();
    if (act === 'records') {
      // 每款遊戲的最佳紀錄，沒玩過的顯示「還沒玩過」
      const rows = Object.entries(GAMES).map(([id, g]) => `<li><span>${g.icon} ${g.name}</span><b>${save.best[id] ? `🏆 ${save.best[id]}` : '<i>還沒玩過</i>'}</b></li>`).join('');
      modal(`<div class="records-box"><h2>🏆 我的紀錄</h2><ul class="records">${rows}</ul></div>`, { cls: 'small' });
    }
  });
  file.addEventListener('change', async () => {
    const f = file.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      // 簡單檢查是不是鼠鼠小屋的存檔
      if (!validBackup(data)) throw new Error('bad');
      const ok = modal(`<div class="buy-box"><h3>要用這個備份蓋掉現在的存檔嗎？</h3><p>備份裡有 ${HAMSTER_COIN_ICON} ${Math.floor(data.coins)} 鼠鼠幣。<br>現在的存檔會被取代，沒辦法復原喔。</p>
        <div class="modal-actions"><button class="btn btn-pink" data-act="yes">還原</button><button class="btn btn-gray" data-act="no">先不要</button></div></div>`, { cls: 'small' });
      $('[data-act=no]', ok.box).onclick = ok.close;
      $('[data-act=yes]', ok.box).onclick = () => {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); location.reload(); } catch { toast('瀏覽器不讓存檔，還原失敗了'); ok.close(); }
      };
    } catch {
      toast('這個檔案看起來不是鼠鼠小屋的存檔');
    }
    file.value = '';
  });
});

