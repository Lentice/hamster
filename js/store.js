// 存檔：全部存在瀏覽器 localStorage，GitHub Pages 純靜態即可運作。

const SAVE_KEY = 'hamster-house-v2';
const START_COINS = 100;

function defaultSave() {
  return {
    coins: START_COINS,
    owned: {},
    look: { ...DEFAULT_LOOK },
    house: {
      petFloor: 0,
      floors: [{
        bg: 'wood',
        items: [
          { uid: 1, id: 'house', x: 300, y: 620, flip: false, size: 1 },
          { uid: 2, id: 'wheel', x: 1150, y: 640, flip: false, size: 1 },
          { uid: 3, id: 'bowl', x: 760, y: 900, flip: false, size: 1 },
          { uid: 4, id: 'bottle', x: 1380, y: 760, flip: true, size: 1 },
        ],
      }],
    },
    best: {},
  };
}

function loadSave() {
  const base = defaultSave();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (saved) {
      // 舊存檔只有一層 room，轉成多樓層 house
      if (saved.room && !saved.house) saved.house = { petFloor: 0, floors: [saved.room] };
      delete saved.room;
      return { ...base, ...saved, look: { ...base.look, ...saved.look } };
    }
    // 從第一版換裝遊戲帶過來的搭配
    const v1 = JSON.parse(localStorage.getItem('hamster-dressup-v1') || 'null');
    if (v1) base.look = { ...base.look, species: v1.species || 'golden', name: v1.name || '' };
  } catch { /* 存檔壞掉就用預設 */ }
  return base;
}

const save = loadSave();
const saveListeners = [];

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 無痕模式等情況下忽略 */ }
  saveListeners.forEach((fn) => fn());
}

const isOwned = (cat, item) => !item.price || !!save.owned[itemKey(cat, item.id)];

function addCoins(n) {
  save.coins = Math.max(0, save.coins + Math.round(n));
  persist();
}

function buy(cat, item) {
  if (isOwned(cat, item)) return true;
  if (save.coins < item.price) return false;
  save.coins -= item.price;
  save.owned[itemKey(cat, item.id)] = true;
  persist();
  return true;
}

function recordBest(game, score) {
  const prev = save.best[game] || 0;
  if (score > prev) {
    save.best[game] = score;
    persist();
    return true;
  }
  return false;
}
