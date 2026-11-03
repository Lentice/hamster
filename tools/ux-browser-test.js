// 使用專用工作階段：會清除本機測試來源的存檔。
async (page) => {
  page.setDefaultTimeout(10000);
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.unrouteAll({ behavior: 'wait' });
  await page.route('**/*', (route) => route.continue());
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto('http://127.0.0.1:8000');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('hamster-welcomed', '1'); });
  await page.reload();
  await page.locator('[data-discover]').click();
  check(await page.locator('.arcade-card').count() === 13, '13 款遊戲入口');
  await page.locator('#arcade-search').fill('不存在');
  await page.locator('[data-clear-search]').click();
  check(await page.locator('.arcade-card').count() === 13, '清除空搜尋');
  await page.locator('[data-kind=puzzle]').click();
  check(await page.locator('[data-play=snackmath]').count() === 1, '動腦分類');
  await page.locator('[data-kind=all]').click();
  await page.locator('[data-favorite=delivery]').click();
  await page.reload();
  await page.locator('[data-kind=favorites]').click();
  check(await page.locator('.arcade-card').count() === 1, '收藏跨重新載入保留');
  await page.locator('[data-kind=all]').click();

  // 保留正式的暫停時鐘，只在操作驗證後推進讀取時間來觸發結算。
  await page.evaluate(() => {
    const original = gameClock;
    window.cozyTimeOffset = 0;
    gameClock = (ctl) => { const clock = original(ctl); return { ...clock, now: () => clock.now() + window.cozyTimeOffset }; };
  });
  const start = async (id) => {
    await page.evaluate(() => { window.cozyTimeOffset = 0; });
    await page.locator(`[data-play=${id}]`).click();
    await page.locator('[role=dialog][aria-modal=true] [data-act=start]').click();
    await page.waitForFunction(() => document.querySelector('.game-area')?.getAttribute('aria-busy') === 'false');
  };
  const settle = async () => {
    await page.evaluate(() => { window.cozyTimeOffset = 60000; });
    await page.locator('.game-result').waitFor();
    await page.locator('[data-act=back]').click();
    await page.waitForFunction(() => !document.querySelector('.modal-back'));
  };
  await start('delivery');
  for (let i = 0; i < 5; i++) {
    const lane = await page.evaluate(() => DELIVERY_FOODS.find((food) => food.name === document.querySelector('.delivery-order b').textContent).lane);
    await page.keyboard.press(String(lane + 1));
  }
  check(await page.locator('.h-score').textContent() === '8', '快遞 5 連擊 +3');
  const wrongLane = await page.evaluate(() => (DELIVERY_FOODS.find((food) => food.name === document.querySelector('.delivery-order b').textContent).lane + 1) % 3);
  await page.locator(`[data-lane="${wrongLane}"]`).click();
  check(await page.locator('.h-score').textContent() === '7', '快遞錯誤扣分');
  await page.locator('.game-pause').click();
  const pausedTime = await page.locator('.h-time').textContent();
  await page.keyboard.press('1');
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 220)));
  check(await page.locator('.h-score').textContent() === '7', '暫停不能送單');
  check(await page.locator('.h-time').textContent() === pausedTime, '暫停不扣時間');
  await page.locator('[data-q=go]').click();
  await settle();
  check(await page.evaluate(() => save.best.delivery === 7), '快遞紀錄寫入');

  await start('starlight');
  for (let n = 1; n <= 9; n++) await page.locator(`[data-star="${n}"]`).click();
  check(await page.locator('.h-score').textContent() === '14', '整片星空 +5');
  check(await page.locator('.star-round').textContent().then((s) => s.includes('第 2')), '星空進入下一關');
  await settle();

  await start('snackmath');
  for (let n = 0; n < 5; n++) {
    const equation = await page.locator('.snack-equation').textContent();
    const match = equation.match(/(\d+)\s*([+−])\s*(\d+)/);
    const answer = match[2] === '+' ? Number(match[1]) + Number(match[3]) : Number(match[1]) - Number(match[3]);
    const button = page.locator('.snack-answer').filter({ has: page.locator('b', { hasText: new RegExp(`^${answer}$`) }) });
    await button.click();
  }
  check(await page.locator('.h-score').textContent() === '13', '算術 5 連擊 +3');
  await settle();
  check(await page.evaluate(() => questState().done), '三款新遊戲可完成每日任務');
  await page.locator('#adventure-passport').click();
  check(await page.locator('.passport-badge.unlocked').count() >= 1, '冒險成就解鎖');
  await page.keyboard.press('Escape');

  await page.locator('[data-screen=wardrobe]').click();
  await page.locator('#name').fill('小布丁');
  await page.locator('#tabs [data-cat=hat]').click();
  await page.locator('#closet-search').fill('不存在');
  await page.locator('[data-clear-closet]').click();
  await page.locator('#grid [data-id=cap]').click();
  check(await page.evaluate(() => save.look.hat === 'cap'), '換裝成功');
  await page.locator('#undo-look').click();
  check(await page.evaluate(() => save.look.hat === 'none' && save.look.name === '小布丁'), '復原搭配保留名字');
  await page.locator('[data-screen=home]').click();
  await page.locator('#home-pat').click();
  check(await page.locator('#room .float-text').count() > 0, '摸摸鼠鼠');
  await page.locator('#home-call').click();
  await page.locator('#edit-toggle').click();
  check(await page.locator('#home-guide').textContent().then((s) => s.includes('佈置模式')), '小屋模式提示');
  await page.locator('#edit-toggle').click();
  await page.locator('[data-screen=shop]').click();
  await page.locator('#shop-tabs [data-tab=hat]').click();
  await page.locator('#shop-filter').selectOption('affordable');
  check(await page.locator('.shop-item.owned').count() === 0, '預算篩選排除已擁有');
  await page.locator('#shop-search').fill('不存在');
  await page.locator('[data-reset-shop]').click();
  check(await page.locator('.shop-item').count() > 0, '商店清除篩選');

  for (const width of [375, 768, 1360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const screen of ['arcade', 'wardrobe', 'home', 'shop']) {
      await page.locator(`[data-screen=${screen}]`).click();
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px ${screen} 無水平溢出`);
    }
  }
  check(errors.length === 0, errors.join('; '));
  return { passed: true, games: 13, checks: 'new game scoring, pause, results, quest, favorites, search, outfit undo, home, shop, 375/768/1360px' };
}
