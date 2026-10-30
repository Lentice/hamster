// 存檔：全部存在瀏覽器 localStorage，GitHub Pages 純靜態即可運作。

const SAVE_KEY = 'hamster-house-v2';
const START_COINS = 100;

function defaultSave() {
  return {
    coins: START_COINS,
    moonCoins: 0,
    lastMoonLogin: '',
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
let lastStoredSave;
try { lastStoredSave = localStorage.getItem(SAVE_KEY); } catch { /* 無法存檔時繼續遊玩 */ }

function syncStoredSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw || raw === lastStoredSave) return false;
    const latest = loadSave();
    // 衣櫃和小屋持有這兩個物件，更新內容而不更換引用。
    const look = save.look;
    const house = save.house;
    Object.assign(look, latest.look);
    Object.assign(house, latest.house);
    Object.assign(save, latest, { look, house });
    lastStoredSave = raw;
    saveListeners.forEach((fn) => fn());
    return true;
  } catch { return false; }
}

function persist() {
  try {
    const raw = JSON.stringify(save);
    localStorage.setItem(SAVE_KEY, raw);
    lastStoredSave = raw;
  } catch { /* 無痕模式等情況下忽略 */ }
  saveListeners.forEach((fn) => fn());
}

const isOwned = (cat, item) => !item.price || !!save.owned[itemKey(cat, item.id)];

function addCoins(n) {
  syncStoredSave();
  save.coins = Math.max(0, save.coins + Math.round(n));
  persist();
}

function buy(cat, item) {
  syncStoredSave();
  if (isOwned(cat, item)) return true;
  if (item.boxOnly) return false;
  const wallet = item.currency === 'moon' ? 'moonCoins' : 'coins';
  if (save[wallet] < item.price) return false;
  save[wallet] -= item.price;
  save.owned[itemKey(cat, item.id)] = true;
  persist();
  return true;
}

const DAILY_MOON_COINS = 12;
const NORMAL_BOX_PRICE = 60;
const BLIND_BOXES = {
  normal: { name: '普通盲盒', title: '花園小驚喜', rarity: '普通', price: NORMAL_BOX_PRICE, wallet: 'coins', currency: 'coins', currencyName: '鼠鼠幣', bonusCoins: [30, 60, 120] },
  moon: { name: '月亮盲盒', title: '月光夢幻收藏', rarity: '稀有', price: 12, wallet: 'moonCoins', currency: 'moon', currencyName: '月亮金幣', bonusCoins: [60, 120, 240] },
};
const itemCurrencyIcon = (item) => item.currency === 'moon' ? '<span class="moon-icon" aria-label="月亮金幣">☾</span>' : HAMSTER_COIN_ICON;

function claimDailyMoonCoins(now = new Date()) {
  syncStoredSave();
  // 依玩家所在地的日曆日期；倒轉時鐘也不能重領已經領過的日期。
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (save.lastMoonLogin >= day) return false;
  save.moonCoins += DAILY_MOON_COINS;
  save.lastMoonLogin = day;
  persist();
  return true;
}

function boxItems(type) {
  const box = BLIND_BOXES[type];
  return CATEGORIES.flatMap((cat) => cat.items
    .filter((item) => item.boxOnly && (item.currency || 'coins') === box.currency)
    .map((item) => ({ cat, item })));
}

function boxPool(type) {
  return boxItems(type).filter(({ cat, item }) => !isOwned(cat.id, item));
}

function openBlindBox(type) {
  syncStoredSave();
  const box = BLIND_BOXES[type];
  const pool = boxPool(type);
  if (!pool.length || save[box.wallet] < box.price) return null;
  const prize = pool[Math.floor(Math.random() * pool.length)];
  save[box.wallet] -= box.price;
  save.owned[itemKey(prize.cat.id, prize.item.id)] = true;
  // 配飾保底，額外金幣不佔收藏名額；與配飾分開抽取。
  const bonusRoll = Math.random();
  const bonusCoins = bonusRoll < 0.05 ? box.bonusCoins[2]
    : bonusRoll < 0.20 ? box.bonusCoins[1]
      : bonusRoll < 0.50 ? box.bonusCoins[0] : 0;
  save.coins += bonusCoins;
  persist();
  return { ...prize, bonusCoins };
}

const normalBoxPool = () => boxPool('normal');
const openNormalBox = () => openBlindBox('normal');

function recordBest(game, score) {
  syncStoredSave();
  const prev = save.best[game] || 0;
  if (score > prev) {
    save.best[game] = score;
    persist();
    return true;
  }
  return false;
}
