import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = ['svg', 'pets', 'items', 'look', 'store']
  .map((name) => readFileSync(new URL(`../js/${name}.js`, import.meta.url), 'utf8')).join('\n');
function boot(saved, sharedData) {
  const data = sharedData || new Map(saved ? [['hamster-house-v2', JSON.stringify(saved)]] : []);
  const context = vm.createContext({
    localStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) },
    assetUrl: (id) => `assets/${id}.webp`,
  });
  vm.runInContext(source, context);
  // 一般測試固定為無額外金幣，驚喜獎勵另測各個機率邊界。
  vm.runInContext('Math.random = () => 0.99', context);
  return { run: (code) => vm.runInContext(code, context), data };
}

const game = boot({ coins: 777, owned: { 'held:r_camera': true }, look: { name: '小鼠' }, room: { bg: 'wood', items: [] } });
const run = game.run;
assert.equal(run('save.coins'), 777);
assert.equal(run('save.moonCoins'), 0);
assert.equal(run('save.look.name'), '小鼠');
assert.equal(run('save.house.floors[0].bg'), 'wood');
assert.equal(run("claimDailyMoonCoins(new Date(2026, 9, 30, 0, 0))"), true);
assert.equal(run("claimDailyMoonCoins(new Date(2026, 9, 30, 23, 59))"), false);
assert.equal(run('save.moonCoins'), 12);

// 稀有配飾只能從月亮盲盒抽，不能直接購買。
assert.equal(run("buy('held', HELD.find(it => it.id === 'moon_bouquet'))"), false);
assert.equal(run("buy('neck', NECK.find(it => it.id === 'moon_shell'))"), false);
assert.equal(run("openBlindBox('moon').item.currency"), 'moon');
assert.equal(run('save.moonCoins'), 0);
assert.equal(run('save.coins'), 777);
assert.equal(run("openBlindBox('moon')"), null);
assert.equal(run('save.moonCoins'), 0);
assert.equal(run("claimDailyMoonCoins(new Date(2026, 9, 31))"), true);
assert.equal(run("claimDailyMoonCoins(new Date(2026, 9, 30))"), false);
assert.equal(run("buy('furniture', FURNITURE.find(it => it.id === 'cakehouse'))"), true);
assert.equal(run('save.coins'), 527);
assert.equal(run('save.moonCoins'), 12);

// 開盒不足額不扣款，不能直接購買，集齊後停止。
assert.equal(run("buy('held', HELD.find(it => it.id === 'box_rose'))"), false);
run('save.coins = 59');
assert.equal(run('openNormalBox()'), null);
assert.equal(run('save.coins'), 59);
const normalCount = run('boxItems("normal").length');
run(`save.coins = ${normalCount * 60}`);
const won = new Set();
for (let i = 0; i < normalCount; i++) {
  const prize = run('openNormalBox()');
  assert.ok(prize);
  won.add(prize.item.id);
  assert.equal(run(`isOwned('${prize.cat.id}', CATEGORIES.find(cat => cat.id === '${prize.cat.id}').items.find(it => it.id === '${prize.item.id}'))`), true);
}
assert.equal(won.size, normalCount);
assert.equal(run('save.coins'), 0);
run('save.coins = 100; persist()');
assert.equal(run('openNormalBox()'), null);
assert.equal(run('save.coins'), 100);
const reloaded = boot(JSON.parse(game.data.get('hamster-house-v2')));
assert.equal(reloaded.run('save.moonCoins'), 12);
assert.equal(reloaded.run('normalBoxPool().length'), 0);
assert.equal(reloaded.run('claimDailyMoonCoins(new Date(2026, 9, 31))'), false);

// 月亮與普通獎池互不混入，稀有集齊後不再扣款。
const moon = boot();
const rareCount = moon.run('boxItems("moon").length');
moon.run(`save.moonCoins = ${rareCount * 12}`);
const rareWon = new Set();
for (let i = 0; i < rareCount; i++) {
  const prize = moon.run("openBlindBox('moon')");
  assert.equal(prize.item.currency, 'moon');
  rareWon.add(prize.item.id);
}
assert.equal(rareWon.size, rareCount);
assert.equal(moon.run('save.coins'), 100);
assert.equal(moon.run('save.moonCoins'), 0);
assert.equal(moon.run("boxPool('normal').length"), normalCount);
moon.run('save.moonCoins = 12');
assert.equal(moon.run("openBlindBox('moon')"), null);
assert.equal(moon.run('save.moonCoins'), 12);
assert.equal(moon.run('openNormalBox().item.currency || "coins"'), 'coins');
assert.equal(moon.run('save.moonCoins'), 12);

// 舊分頁領獎／交易前讀取最新存檔，保留新分頁的收藏及物件引用。
const firstTab = boot({ coins: 180, moonCoins: 0, lastMoonLogin: '2026-10-29' });
const oldTab = boot(undefined, firstTab.data);
oldTab.run('const originalLook = save.look; const originalHouse = save.house');
assert.equal(firstTab.run('claimDailyMoonCoins(new Date(2026, 9, 30))'), true);
const firstPrize = firstTab.run("openBlindBox('moon')");
assert.equal(oldTab.run('claimDailyMoonCoins(new Date(2026, 9, 30))'), false);
assert.ok(JSON.parse(firstTab.data.get('hamster-house-v2')).owned[`${firstPrize.cat.id}:${firstPrize.item.id}`]);
assert.equal(oldTab.run('save.moonCoins'), 0);
assert.equal(oldTab.run('originalLook === save.look && originalHouse === save.house'), true);
firstTab.run('save.look.name = "新名字"; persist(); openBlindBox("normal")');
assert.ok(oldTab.run('openBlindBox("normal")'));
assert.equal(oldTab.run('save.coins'), 60);
assert.equal(oldTab.run('save.look.name'), '新名字');
assert.equal(oldTab.run('Object.keys(save.owned).length'), 3);
assert.equal(firstTab.run('syncStoredSave()'), true);
assert.equal(firstTab.run('save.coins'), 60);
assert.equal(firstTab.run('syncStoredSave()'), false);
oldTab.run('save.look.name = "保留收藏"; persist()');
assert.equal(firstTab.run('recordBest("catch", 99)'), true);
firstTab.run('addCoins(10)');
assert.equal(firstTab.run('save.look.name'), '保留收藏');
assert.equal(firstTab.run('Object.keys(save.owned).length'), 3);
assert.equal(firstTab.run('save.coins'), 70);
for (const [roll, amount] of [[0, 120], [0.049, 120], [0.05, 60], [0.199, 60], [0.20, 30], [0.499, 30], [0.50, 0], [0.999, 0]]) {
  const bonusGame = boot();
  bonusGame.run(`Math.random = () => ${roll}`);
  const prize = bonusGame.run('openNormalBox()');
  assert.equal(prize.bonusCoins, amount);
  assert.equal(bonusGame.run('save.coins'), 40 + amount);
  assert.equal(bonusGame.run('Object.keys(save.owned).length'), 1);
  const persisted = JSON.parse(bonusGame.data.get('hamster-house-v2'));
  assert.equal(persisted.coins, 40 + amount);
}
const moonBonus = boot();
moonBonus.run('save.moonCoins = 12; Math.random = () => 0.01');
assert.equal(moonBonus.run('openBlindBox("moon").bonusCoins'), 240);
assert.equal(moonBonus.run('save.coins'), 340);
assert.equal(moonBonus.run('save.moonCoins'), 0);
assert.equal(moonBonus.run('Object.keys(save.owned).length'), 1);
console.log('Economy tests passed: migration, daily rewards, both currencies, blind boxes, reload.');
