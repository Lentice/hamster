// 跨功能試用：專用測試工作階段，會清除該來源存檔。
async (page) => {
  page.setDefaultTimeout(10000);
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.unrouteAll({ behavior: 'wait' });
  await page.route('**/*', (route) => route.continue());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8000');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('hamster-welcomed', '1'); localStorage.setItem('hamster-online', JSON.stringify('solo')); });
  await page.reload();
  const nav = await page.locator('.nav').boundingBox();
  check(nav.y > 700 && Math.abs(nav.y + nav.height - 844) < 2, '手機導覽固定於視窗底部');

  await page.locator('#tabs [data-cat=clothes]').click();
  await page.locator('[data-diy-new=clothes]').click();
  await page.locator('.diy-name input').fill('藍莓T');
  await page.keyboard.press('Escape');
  await page.locator('.quit-box [data-q=no]').click();
  check(await page.locator('.diy-name input').inputValue() === '藍莓T', '只改名字也有離開保護');
  await page.locator('.diy-color[data-c="12"]').click();
  await page.locator('[data-tool=fill]').click();
  await page.locator('.diy-cells rect[data-i="100"]').click({ force: true });
  await page.locator('[data-act=undo]').click();
  await page.locator('[data-act=redo]').click();
  await page.locator('[data-act=code]').click();
  check((await page.locator('.diy-code textarea').first().inputValue()).startsWith('鼠c'), '作品代碼');
  await page.locator('[data-c=no]').click();
  await page.locator('.diy > .modal-actions [data-act=save]').click();
  const design = await page.evaluate(() => save.look.clothes);
  check(design.startsWith('diy_'), '作品儲存並試穿');
  await page.locator(`[data-diy-edit="${design}"]`).click();
  await page.locator('.diy [data-act=delete]').click();
  await page.locator('.quit-box [data-q=no]').click();
  await page.keyboard.press('Escape');
  await page.locator('#tabs [data-cat=outfits]').click();
  await page.locator('[data-outfit-save="0"]').click();
  await page.locator('#reset').click();
  await page.locator('[data-outfit-wear="0"]').click();
  check(await page.evaluate((id) => save.look.clothes === id, design), '搭配套用包含 DIY 作品');
  await page.locator('[data-outfit-del="0"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('.quit-box [data-q=no]').click();
  check(await page.locator('[data-outfit-wear="0"]').count() === 1, '刪除搭配可取消');

  await page.locator('[data-screen=home]').click();
  await page.locator('#edit-toggle').click();
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '手機佈置面板無水平溢出');
  await page.locator('#inventory-search').fill('滾輪');
  await page.locator('#inventory-owned').check();
  const beforeCount = await page.locator('#room .furniture').count();
  await page.locator('#inventory [data-id=wheel]').click();
  check(await page.locator('#room .furniture').count() === beforeCount + 1, '搜尋後放家具');
  await page.locator('#home-undo').click();
  check(await page.locator('#room .furniture').count() === beforeCount, '放置家具可復原');
  const furniture = page.locator('#room .furniture').first();
  const originalLeft = await furniture.evaluate((el) => el.style.left);
  const r = await furniture.boundingBox();
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width / 2 + 30, r.y + r.height / 2 + 10, { steps: 8 });
  await page.mouse.up();
  await page.locator('#home-undo').click();
  check(await page.locator('#room .furniture').first().evaluate((el) => el.style.left) === originalLeft, '拖曳可復原');
  await page.locator('#edit-toggle').click();

  await page.locator('[data-screen=shop]').click();
  await page.locator('.box-odds summary').click();
  check(await page.locator('.box-odds').innerText().then((s) => s.includes('30%') && s.includes('15%') && s.includes('5%')), '盲盒完整機率');
  const ownedBefore = await page.evaluate(() => Object.keys(save.owned).length);
  await page.locator('#open-blind-box').click();
  await page.locator('#confirm-box').click();
  await page.locator('#wear-prize').click();
  check(await page.evaluate(() => Object.keys(save.owned).length) === ownedBefore + 1, '實際開盒並試戴');

  await page.locator('[data-screen=outdoor]').click();
  if (await page.locator('[role=dialog][aria-modal=true]').count()) await page.keyboard.press('Escape');
  await page.locator('.map-ui button').click();
  await page.locator('[data-map-play=memory]').click();
  await page.locator('[data-act=start]').click();
  await page.locator('.mcard.flip').first().waitFor();
  // 只從開場可見的預覽記錄圖案，不讀取蓋牌後的內部遊戲狀態。
  const groups = await page.locator('.mcard.flip .mface img').evaluateAll((images) => {
    const pairs = {}; images.forEach((img, i) => (pairs[img.getAttribute('src')] ||= []).push(i)); return Object.values(pairs);
  });
  await page.waitForFunction(() => document.querySelectorAll('.mcard.flip').length === 0);
  for (const pair of groups) for (const i of pair) await page.locator('.mcard').nth(i).click();
  await page.locator('.game-result').waitFor();
  check(await page.locator('.game-result .score').innerText() === '分數 100', '舊翻牌遊戲完整結算');
  await page.locator('[data-act=back]').click();
  await page.locator('#park-arcade').click();

  for (const id of ['delivery', 'starlight', 'snackmath']) {
    const before = await page.evaluate(() => JSON.stringify({ coins: save.coins, best: save.best, quest: save.quest }));
    await page.locator(`[data-play=${id}]`).click();
    await page.locator('[data-act=practice]').click();
    check(await page.locator('.h-time').innerText() === '∞', `${id} 無限時練習`);
    if (id === 'delivery') {
      const lane = await page.evaluate(() => DELIVERY_FOODS.find((f) => f.name === document.querySelector('.delivery-order b').textContent).lane);
      await page.locator(`[data-lane="${lane}"]`).click();
    } else if (id === 'starlight') await page.locator('[data-star="1"]').click();
    else {
      const text = await page.locator('.snack-equation').innerText(), m = text.match(/(\d+)\s*([+−])\s*(\d+)/);
      const answer = m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3];
      const values = await page.locator('.snack-answer b').allTextContents();
      await page.locator('.snack-answer').nth(values.findIndex((n) => +n === answer)).click();
    }
    await page.locator('[data-end-practice]').click();
    check(await page.evaluate(() => JSON.stringify({ coins: save.coins, best: save.best, quest: save.quest })) === before, `${id} 練習不更新獎勵紀錄任務`);
    await page.locator('[data-act=back]').click();
    await page.waitForFunction(() => !document.querySelector('.modal-back'));
  }
  check(errors.length === 0, errors.join('; '));
  return { passed: true, checks: 'DIY paint/undo/code/save, unsaved names, deletion protection, outfits, furniture search/undo, blind-box purchase, map launch, classic memory settlement, all practice modes, bottom navigation' };
}
