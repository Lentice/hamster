import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../js/arcade.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(0, source.indexOf('const Arcade =')), context);
const run = (code) => vm.runInContext(code, context);
vm.runInContext('const GAMES = {};', context);
vm.runInContext(readFileSync(new URL('../js/games-cozy.js', import.meta.url), 'utf8'), context);
assert.equal(run('deliveryOrder(() => 0).lane'), 0);
assert.equal(run('deliveryOrder(() => 0.5).lane'), 1);
assert.equal(run('deliveryOrder(() => 0.999).lane'), 2);
assert.equal(run('DELIVERY_FOODS.every(food => [0, 1, 2].includes(food.lane))'), true);
assert.equal(run('new Set(shuffledList([1,2,3,4,5,6,7,8,9])).size'), 9);
assert.equal(run('shuffledList([1,2,3], () => 0).join(",")'), '2,3,1');
assert.equal(run('shuffledList([]).length'), 0);
for (const [score, stars] of [[0, 0], [9, 0], [10, 1], [25, 2], [45, 3], [NaN, 0], [Infinity, 0]]) {
  context.score = score;
  assert.equal(run('earnedStars("delivery", score)'), stars);
}
assert.equal(run('dailyGameId("2026-11-03", [])'), null);
assert.equal(run('dailyGameId("2026-11-03", ["catch"])'), 'catch');
assert.equal(run('dailyGameId("2026-11-03", ["catch", "wheel"])'), run('dailyGameId("2026-11-03", ["wheel", "catch"])'));
assert.equal(run('arcadeMatches("stack", {name:"疊疊蛋糕"}, "reaction", " 蛋糕 ")'), true);
assert.equal(run('arcadeMatches("stack", {name:"疊疊蛋糕"}, "puzzle", "")'), false);
assert.equal(run('arcadeMatches("stack", {name:"疊疊蛋糕"}, "all", "不存在")'), false);
console.log('Arcade tests passed: search, categories and stable daily recommendations.');
