// playwright-cli -s=hamster-test run-code --filename=tools/browser-test.js
async (page) => {
  page.setDefaultTimeout(10000);
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // route 會停用快取，確保本機連續編輯測試使用目前的檔案。
  await page.unrouteAll({ behavior: 'wait' });
  await page.route('**/*', (route) => route.continue());
  await page.goto('http://127.0.0.1:8000');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('hamster-welcomed', '1'); });
  await page.reload();
  await page.locator('#tabs [aria-selected=true]').waitFor();

  await page.locator('#tabs [aria-selected=true]').focus();
  await page.keyboard.press('ArrowRight');
  check(await page.locator('#tabs [aria-selected=true]').getAttribute('data-cat') === 'expression', '換裝方向鍵切換');
  check(await page.locator('#tabs [aria-selected=true]').evaluate((el) => el === document.activeElement), '分類重繪後保留焦點');
  await page.keyboard.press('End');
  check(await page.locator('#tabs [aria-selected=true]').getAttribute('data-cat') === 'outfits', '換裝 End');
  await page.keyboard.press('Home');
  await page.locator('#stage').focus();
  await page.keyboard.press('Enter');
  check(await page.locator('#stage .float-text').count() > 0, '鍵盤與鼠鼠互動');
  await page.locator('#name').fill('測試鼠');
  const pngEvent = page.waitForEvent('download');
  await page.locator('#save-img').click();
  check((await pngEvent).suggestedFilename() === '測試鼠.png', 'PNG 下載檔名');
  await page.waitForFunction(() => !document.querySelector('#save-img').disabled);

  await page.locator('#settings').click();
  check(await page.locator('main').evaluate((el) => el.inert), '背景 inert');
  check(await page.locator('body').evaluate((el) => el.classList.contains('modal-open')), '背景捲動鎖定');
  const dialog = page.locator('[role=dialog][aria-modal=true]');
  await dialog.locator('[data-act=records]').click();
  check(await page.locator('[role=dialog][aria-modal=true]').count() === 1, '巢狀視窗僅最上層 aria-modal');
  await page.keyboard.press('Escape');
  check(await dialog.getAttribute('aria-label') === '設定與備份', 'Escape 返回下層視窗');
  await dialog.locator('[data-act=records]').focus();
  await page.keyboard.press('Tab');
  check(await dialog.locator('.modal-x').evaluate((el) => el === document.activeElement), 'Tab 焦點循環');
  await page.keyboard.press('Shift+Tab');
  check(await dialog.locator('[data-act=records]').evaluate((el) => el === document.activeElement), 'Shift Tab 焦點循環');
  const backupEvent = page.waitForEvent('download');
  await dialog.locator('[data-act=export]').click();
  check((await backupEvent).suggestedFilename().endsWith('.json'), '備份下載');
  await page.keyboard.press('Escape');
  check(await page.locator('#settings').evaluate((el) => el === document.activeElement), '關閉後恢復焦點');
  check(!(await page.locator('main').evaluate((el) => el.inert)), '關閉後解除 inert');

  await page.locator('[data-screen=shop]').click();
  await page.locator('#shop-tabs [aria-selected=true]').focus();
  await page.keyboard.press('ArrowRight');
  check(await page.locator('#shop-tabs [aria-selected=true]').getAttribute('data-tab') === 'rare', '商店鍵盤分類');
  await page.locator('#open-blind-box').click();
  await page.locator('#confirm-box').click();
  await page.locator('#wear-prize').click();
  await page.locator('#screen-wardrobe.active').waitFor();

  // 每個小遊戲皆能載入，Escape 走既有的暫停／離開確認流程。
  const games = await page.evaluate(() => Object.keys(GAMES));
  for (const id of games) {
    await page.evaluate((game) => openGame(game), id);
    await page.locator('[role=dialog][aria-modal=true] [data-act=start]').click();
    await page.waitForFunction(() => document.querySelector('.game-area')?.getAttribute('aria-busy') === 'false');
    await page.keyboard.press('Escape');
    await page.locator('[role=dialog][aria-modal=true] [data-q=yes]').click();
    await page.waitForFunction(() => openModals === 0);
    // 等待已關閉視窗從 DOM 移除，避免舊遊戲的 selector 干擾下一局。
    await page.waitForFunction(() => document.querySelectorAll('.modal-back').length === 0);
  }
  check(errors.length === 0, `瀏覽器錯誤：${errors.join('; ')}`);

  // 素材失敗時顯示可重試介面，重試後回到遊戲。
  await page.route('**/assets/hat_cupcake.webp', (route) => route.fulfill({ status: 404, body: '' }));
  await page.evaluate(() => { delete dataUrlCache['assets/hat_cupcake.webp']; save.look.hat = 'r_cupcake'; openGame('catch'); });
  await page.locator('[role=dialog][aria-modal=true] [data-act=start]').click();
  await page.locator('[data-act=retry]').waitFor();
  await page.unroute('**/assets/hat_cupcake.webp');
  await page.locator('[data-act=retry]').click();
  await page.waitForFunction(() => document.querySelector('.game-area')?.getAttribute('aria-busy') === 'false');
  check(await page.locator('.game-area canvas').count() === 1, '素材重試成功');
  await page.keyboard.press('Escape');
  await page.locator('[role=dialog][aria-modal=true] [data-q=yes]').click();
  await page.waitForFunction(() => openModals === 0);
  await page.waitForFunction(() => document.querySelectorAll('.modal-back').length === 0);

  // 儲存配額用盡時仍可從記憶體備份。
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.restoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (key, value) {
      if (key === SAVE_KEY) throw new DOMException('full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.locator('#name').fill('備份救援');
  check(await page.locator('#toasts').textContent().then((text) => text.includes('無法存進瀏覽器')), '儲存失敗提示');
  await page.locator('#settings').click();
  const rescueEvent = page.waitForEvent('download');
  await dialog.locator('[data-act=export]').click();
  check((await rescueEvent).suggestedFilename().endsWith('.json'), '儲存失敗仍可下載');
  await page.evaluate(() => window.restoreStorage());
  await page.keyboard.press('Escape');

  await page.locator('#settings').click();
  const input = dialog.locator('input[type=file]');
  const selectBackup = async (name, content) => input.evaluate((el, { name, content }) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([content], name, { type: 'application/json' }));
    el.files = transfer.files;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { name, content });
  await selectBackup('large.json', ' '.repeat(2 * 1024 * 1024 + 1));
  await page.waitForFunction(() => document.querySelector('#toasts').textContent.includes('備份檔太大'));
  check(await input.inputValue() === '', '超大備份清除檔案選擇');
  await selectBackup('invalid.json', '{"coins":-1,"look":{}}');
  await page.waitForFunction(() => document.querySelector('#toasts').textContent.includes('不是鼠鼠小屋的存檔'));
  const imported = { coins: 135, moonCoins: 7, pricingV: 1, look: { name: '還原測試' }, house: { petFloor: 100, floors: [{ bg: 'wood' }] } };
  await selectBackup('backup.json', JSON.stringify(imported));
  await page.locator('[role=dialog][aria-modal=true] [data-act=yes]').click();
  await page.waitForFunction(() => typeof save !== 'undefined' && save.look.name === '還原測試' && save.coins === 135);
  check(await page.evaluate(() => save.house.petFloor === 0 && save.house.floors[0].items.length === 0), '匯入備份正規化');
  await page.locator('[data-screen=wardrobe]').click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const screen of ['wardrobe', 'home', 'outdoor', 'shop']) {
    await page.locator(`[data-screen=${screen}]`).click();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${screen} 手機寬度`);
    // 首次進公園會出現多人功能說明。
    if (await page.locator('[role=dialog][aria-modal=true]').count()) await page.keyboard.press('Escape');
  }
  await page.locator('#settings').click();
  check(await dialog.isVisible(), '手機設定可見');
  await page.keyboard.press('Escape');
  check(errors.length === 0, `瀏覽器錯誤：${errors.join('; ')}`);
  return { passed: true, games: games.length, viewport: '390 × 844', checks: 'keyboard, dialogs, downloads, backup import, blind box, all games, asset retry, storage failure, mobile' };
}
