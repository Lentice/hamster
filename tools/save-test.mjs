import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = ['svg', 'pets', 'items', 'look', 'store', 'diy']
  .map((name) => readFileSync(new URL(`../js/${name}.js`, import.meta.url), 'utf8')).join('\n');
function boot(saved, options = {}) {
  const data = new Map(saved === undefined ? [] : [['hamster-house-v2', JSON.stringify(saved)]]);
  const errors = [];
  const context = vm.createContext({
    localStorage: {
      getItem: (key) => { if (options.blocked) throw Error('blocked'); return data.get(key) ?? null; },
      setItem: (key, value) => { if (options.blocked) throw Error('blocked'); data.set(key, value); },
    },
    console: { error: (...args) => errors.push(args) },
  });
  vm.runInContext(source, context);
  return { run: (code) => vm.runInContext(code, context), data, errors };
}

for (const broken of [null, [], 'broken', 42, true]) {
  const game = boot(broken);
  assert.equal(game.run('save.coins'), 100);
  assert.equal(game.run('save.house.floors.length'), 1);
}
const corrupt = boot({
  coins: -5, moonCoins: '99', lastMoonLogin: '2026-02-31', pricingV: 1,
  look: { name: {}, species: false, hat: 'cap' }, owned: [], best: { catch: 12, wheel: -1, memory: '99' },
  house: { petFloor: 90, floors: [null, { bg: 'missing', items: [null, { id: 'wheel', uid: 1, x: -100, y: 9999, size: 100 }, { id: 'bowl', uid: 1 }, { id: 'missing' }] }, {}] },
  outfits: [null, 1, { name: 'safe' }, {}],
  quest: { day: '2026-11-03', games: ['catch', 'catch', null], done: 'yes' },
  diy: { hat: [null, { id: 'diy_hat_1', px: '1'.repeat(312) }, { id: 'diy_hat_1', px: '2'.repeat(312) }, { id: 'bad"', px: '1'.repeat(312) }] },
});
assert.equal(corrupt.run('save.coins'), 0);
assert.equal(corrupt.run('save.moonCoins'), 0);
assert.equal(corrupt.run('save.lastMoonLogin'), '');
assert.equal(corrupt.run('save.pricingV'), 1);
assert.equal(corrupt.run('save.look.name'), '');
assert.equal(corrupt.run('save.look.species'), 'golden');
assert.equal(corrupt.run('save.look.hat'), 'cap');
assert.equal(corrupt.run('save.best.catch'), 12);
assert.equal(corrupt.run('save.best.wheel'), undefined);
assert.equal(corrupt.run('save.house.petFloor'), 1);
assert.equal(corrupt.run('save.house.floors[0].items.length'), 2);
assert.equal(corrupt.run('save.house.floors[0].items[0].x'), 40);
assert.equal(corrupt.run('save.house.floors[0].items[0].y'), 1000);
assert.equal(corrupt.run('save.house.floors[0].items[0].size'), 1.6);
assert.equal(corrupt.run('new Set(save.house.floors[0].items.map(it => it.uid)).size'), 2);
assert.equal(corrupt.run('save.house.floors[1].items.length'), 0);
assert.equal(corrupt.run('save.outfits.length'), 3);
assert.equal(corrupt.run('save.outfits[1]'), null);
assert.equal(corrupt.run('save.quest.games.length'), 1);
assert.equal(corrupt.run('save.quest.done'), false);
assert.equal(corrupt.run('save.diy.hat.length'), 1);
assert.equal(corrupt.run('HATS.filter(it => it.diy).length'), 1);
assert.equal(corrupt.run('claimDailyMoonCoins(new Date(NaN))'), false);
assert.equal(corrupt.run('openBlindBox("constructor")'), null);
assert.equal(corrupt.run('boxPool("unknown").length'), 0);
corrupt.run('addCoins(NaN); addCoins(Infinity)');
assert.equal(corrupt.run('save.coins'), 0);
assert.equal(corrupt.run('recordBest("catch", Infinity)'), false);
assert.equal(corrupt.run('recordBest("catch", -1)'), false);
assert.equal(corrupt.run('recordBest("__proto__", 10)'), false);
assert.equal(corrupt.run('validBackup({ coins: -1, look: {} })'), false);
assert.equal(corrupt.run('validBackup({ coins: 100, look: {} })'), true);
assert.equal(corrupt.run('validBackup({ coins: 100, look: {}, house: { floors: [] } })'), false);
assert.equal(corrupt.run('validSaveDay("2024-02-29")'), true);
assert.equal(corrupt.run('validSaveDay("2025-02-29")'), false);
const bounded = boot({ coins: Number.MAX_VALUE, house: { floors: Array(6).fill({ items: [] }) } });
assert.equal(bounded.run('save.coins'), Number.MAX_SAFE_INTEGER);
assert.equal(bounded.run('save.house.floors.length'), 5);
const blocked = boot(undefined, { blocked: true });
assert.equal(blocked.run('persist()'), false);
assert.equal(blocked.run('storageFailed'), true);
blocked.run('saveListeners.push(() => { throw Error("listener"); }); let notified = false; saveListeners.push(() => { notified = true; }); persist();');
assert.equal(blocked.run('notified'), true);
assert.equal(blocked.errors.length, 1);
const sync = boot({ coins: 100, outfits: [{}], quest: { day: '2026-11-03', games: [], done: false } });
sync.data.set('hamster-house-v2', JSON.stringify({ coins: 200, look: {} }));
assert.equal(sync.run('syncStoredSave()'), true);
assert.equal(sync.run('save.outfits'), undefined);
assert.equal(sync.run('save.quest'), undefined);
for (const type of ['clothes', 'hat', 'neck', 'held']) {
  assert.equal(corrupt.run(`diyDecode('${type}', diyEncode('${type}', '1'.repeat(DIY_TEMPLATES.${type}.cols * DIY_TEMPLATES.${type}.rows))).length`), corrupt.run(`DIY_TEMPLATES.${type}.cols * DIY_TEMPLATES.${type}.rows`));
}
// parseInt 不應接受部分有效的連續格數（例如 "1!"）。
assert.equal(corrupt.run('diyDecode("hat", "鼠h11!1" + (311).toString(36))'), null);
assert.equal(corrupt.run('diyDecode("unknown", "鼠h100")'), null);
corrupt.run('const GAMES = { catch: {} };');
assert.equal(corrupt.run('questPlayed("unknown")'), false);
assert.equal(corrupt.run('questPlayed(null)'), false);
const legacy = boot();
legacy.data.set('hamster-dressup-v1', JSON.stringify({ name: '舊鼠鼠', species: 'golden' }));
assert.equal(legacy.run('loadSave().look.name'), '舊鼠鼠');
assert.equal(corrupt.run('normalizeSave({ owned: { valid: true, old: 1, broken: "yes", constructor: true } }).owned.valid'), true);
assert.equal(corrupt.run('Object.hasOwn(normalizeSave({ owned: { constructor: true } }).owned, "constructor")'), false);
assert.equal(corrupt.run('normalizeSave({ house: { floors: [{ items: [{ id: "wheel", uid: 17 }] }] } }).house.floors[0].items[0].uid'), 17);
console.log('Save tests passed: malformed fields, migration, limits, storage failure, listeners, sync and DIY codes.');
