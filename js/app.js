// 啟動

// 素材還沒產生或載入失敗時隱藏，不顯示破圖
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') e.target.classList.add('missing');
}, true);

let warnedStorage = false;
saveListeners.push(() => {
  if (storageFailed && !warnedStorage) {
    warnedStorage = true;
    toast('進度暫時無法存進瀏覽器，請到設定下載備份，避免關閉後遺失');
  }
  if (!storageFailed) warnedStorage = false;
});

const syncTopbar = () => document.documentElement.style.setProperty('--topbar-h', `${$('.topbar').offsetHeight}px`);
new ResizeObserver(syncTopbar).observe($('.topbar'));
syncTopbar();

$$('.nav-btn').forEach((b) => b.addEventListener('click', () => { showScreen(b.dataset.screen); window.scrollTo({ top: 0, behavior: 'auto' }); sfx.tab(); }));
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
      const blob = new Blob([JSON.stringify(save)], { type: 'application/json' });
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
      if (f.size > 2 * 1024 * 1024) { toast('備份檔太大了，請選擇 2 MB 以內的存檔'); return; }
      const text = await f.text();
      const parsed = JSON.parse(text);
      // 簡單檢查是不是鼠鼠小屋的存檔
      if (!validBackup(parsed)) throw new Error('bad');
      const data = normalizeSave(parsed);
      const ok = modal(`<div class="buy-box"><h3>要用這個備份蓋掉現在的存檔嗎？</h3><p>備份裡有 ${HAMSTER_COIN_ICON} ${Math.floor(data.coins)} 鼠鼠幣。<br>現在的存檔會被取代，沒辦法復原喔。</p>
        <div class="modal-actions"><button class="btn btn-pink" data-act="yes">還原</button><button class="btn btn-gray" data-act="no">先不要</button></div></div>`, { cls: 'small' });
      $('[data-act=no]', ok.box).onclick = ok.close;
      $('[data-act=yes]', ok.box).onclick = () => {
        const button = $('[data-act=yes]', ok.box);
        if (button.disabled) return;
        button.disabled = true;
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); location.reload(); } catch { toast('瀏覽器不讓存檔，還原失敗了'); ok.close(); }
      };
    } catch {
      toast('這個檔案看起來不是鼠鼠小屋的存檔');
    }
    finally { file.value = ''; }
  });
});

