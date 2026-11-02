// 依精美程度重新定價：簡單的小東西免費或便宜，細節多、點陣貼紙等精緻款比較貴。
// 盲盒限定（boxOnly）的價格不動。衣櫃與商店都依價格由低到高排序。
// 改價前就能免費穿的東西，舊存檔照樣保留（不會因為漲價被收走）。

const PRICE_TABLE = {
  hat: {
    leaf: 0, catband: 0, cap: 0, bow: 0, beret: 30, bunny: 40, beanie: 40, earmuffs: 60, chef: 60, chickhood: 60, chick: 60,
    santa: 80, devil: 80, strawberry: 80, knitflaps: 100, witch: 100, halo: 120, pirate: 120, frog: 120, reindeer: 140,
    flowers: 140, crown: 160, royalwreath: 200,
    r_party: 160, r_lemon: 180, r_sunflower: 180, r_mushroom: 200, r_pumpkin: 220, r_straw: 220, r_cupcake: 260,
    r_sakura: 260, r_cloud: 280, r_wizard: 280, r_unicorn: 300, r_tiara: 300,
  },
  clothes: {
    heartT: 0, overalls: 0, stripe: 0, raincoat: 30, hoodie: 40, sport: 40, sailor: 60, suspender: 60, sweater: 60,
    cheer: 80, chefapron: 80, cardigan: 80, santa: 100, dress: 100, hero: 120, suit: 120, pumpkin: 120, hawaii: 120,
    maid: 140, panda: 140, bee: 140, ballettutu: 160, frograin: 160, dino: 180, haori: 180, astronaut: 200, angel: 200,
    yukata: 220, wizardrobe: 240, princess: 300,
  },
  glasses: {
    round: 0, sun: 0, goggles: 30, eggmask: 30, glasses3d: 40, hearts: 40, mono: 60, starglass: 60, cateye: 60,
    pinkheart: 60, scholargold: 80, tortoise: 80, divemask: 100, heartshades: 100, starvisor: 160,
  },
  neck: {
    tie: 0, bowtie: 0, bandana: 0, scarf: 30, bell: 40, tinybell: 40, heartchoker: 80, medal: 100, pomscarf: 120,
    pawmedal: 140, pearl: 140, capecollar: 160, flowerlei: 160, pearlbow: 180,
  },
  held: {
    seed: 0, heartbox: 0, carrot: 0, cheese: 0, berry: 30, cupcake: 40, balloon: 40, watermelon: 40, wand: 80, pinwheel: 80,
    bouquet: 140, spellbook: 160, balloonbunch: 180,
    r_lollipop: 160, r_sunflower: 160, r_donut: 160, r_icecream: 180, r_boba: 180, r_book: 180, r_umbrella: 200,
    r_fish: 200, r_cottoncandy: 220, r_teddy: 240, r_camera: 240, r_lantern: 260, r_guitar: 280,
  },
  effect: {
    hearts: 0, bubbles: 0, sparkle: 40, notes: 40, driftstars: 60, confetti: 80, petals: 100, snow: 100,
    bubblehearts: 120, autumnleaves: 120, meteors: 160, butterflies: 220,
  },
};

// 排序用：免費 → 鼠鼠幣由低到高 → 盲盒 → 月亮金幣
function priceRank(item) {
  if (item.id === 'none') return -1;
  if (item.currency === 'moon') return 100000 + (item.price || 0);
  if (item.boxOnly) return 50000 + (item.price || 0);
  return item.price || 0;
}
const byPrice = (items) => items.map((it, i) => [it, i]).sort((a, b) => priceRank(a[0]) - priceRank(b[0]) || a[1] - b[1]).map(([it]) => it);

(() => {
  const hadSave = (() => { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } })();
  const wasFree = [];
  for (const cat of CATEGORIES) {
    const table = PRICE_TABLE[cat.id];
    if (!table) continue;
    for (const item of cat.items) {
      if (item.boxOnly || !(item.id in table)) continue;
      if (!item.price && table[item.id] > 0) wasFree.push(itemKey(cat.id, item.id));
      item.price = table[item.id];
    }
    // 依價格排序（原地排序，所有用到這些陣列的地方都一致）
    const sorted = byPrice(cat.items);
    cat.items.splice(0, cat.items.length, ...sorted);
  }
  FURNITURE.splice(0, FURNITURE.length, ...byPrice(FURNITURE));
  // 舊玩家：改價前免費的東西直接算已擁有
  if (hadSave && !save.pricingV) {
    for (const k of wasFree) save.owned[k] = true;
    save.pricingV = 1;
    persist();
  } else if (!save.pricingV) {
    save.pricingV = 1;
  }
})();
