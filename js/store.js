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

const saveObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const safeAmount = (v, fallback = 0) => Number.isFinite(v) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(v))) : fallback;
const saveFlags = (v) => Object.fromEntries(Object.entries(saveObject(v) ? v : {}).filter(([k, value]) => !['__proto__', 'constructor', 'prototype'].includes(k) && (value === true || value === 1)));
const validSaveDay = (v) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(`${v}T12:00:00`);
  return date.getFullYear() === Number(v.slice(0, 4)) && date.getMonth() + 1 === Number(v.slice(5, 7)) && date.getDate() === Number(v.slice(8, 10));
};

// 載入與匯入共用清理流程；單一欄位損壞時保留其他有效進度。
function normalizeSave(saved) {
  const base = defaultSave();
  if (!saveObject(saved)) return base;
  const cleanLook = (value) => {
    const out = { ...DEFAULT_LOOK };
    if (!saveObject(value)) return out;
    for (const key of Object.keys(out)) {
      if (typeof value[key] === 'string') out[key] = value[key].slice(0, key === 'name' ? 24 : 100);
    }
    return out;
  };
  base.coins = safeAmount(saved.coins, START_COINS);
  base.moonCoins = safeAmount(saved.moonCoins);
  if (saved.pricingV === 1) base.pricingV = 1;
  base.lastMoonLogin = validSaveDay(saved.lastMoonLogin) ? saved.lastMoonLogin : '';
  base.look = cleanLook(saved.look);
  for (const key of ['owned', 'fresh', 'collected', 'played', 'favoriteGames']) base[key] = saveFlags(saved[key]);
  if (saveObject(saved.best)) base.best = Object.fromEntries(Object.entries(saved.best)
    .filter(([id, score]) => /^[a-z][a-z0-9_-]*$/i.test(id) && Number.isFinite(score) && score >= 0)
    .map(([id, score]) => [id, safeAmount(score)]));
  const house = saveObject(saved.house) ? saved.house : saveObject(saved.room) ? { floors: [saved.room] } : null;
  if (house && Array.isArray(house.floors) && house.floors.some(saveObject)) {
    const usedUids = new Set();
    let uid = Math.max(0, ...house.floors.filter(saveObject).slice(0, 5).flatMap((floor) =>
      (Array.isArray(floor.items) ? floor.items : []).slice(0, 500).map((it) => Number.isSafeInteger(it?.uid) && it.uid > 0 && it.uid < Number.MAX_SAFE_INTEGER - 2500 ? it.uid : 0)));
    const itemUid = (value) => {
      const id = Number.isSafeInteger(value) && value > 0 && value <= uid && !usedUids.has(value) ? value : ++uid;
      usedUids.add(id); return id;
    };
    const clamp = (v, min, max, fallback) => Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
    base.house.floors = house.floors.filter(saveObject).slice(0, 5).map((floor) => ({
      bg: ROOMS.some((r) => r.id === floor.bg) ? floor.bg : 'wood',
      items: (Array.isArray(floor.items) ? floor.items : []).filter((it) => saveObject(it) && FURNITURE.some((f) => f.id === it.id)).slice(0, 500).map((it) => ({
        uid: itemUid(it.uid), id: it.id, x: clamp(it.x, 40, 1460, 750), y: clamp(it.y, 420, 1000, 780),
        flip: it.flip === true, size: clamp(it.size, 0.55, 1.6, 1),
      })),
    }));
    base.house.petFloor = Math.min(base.house.floors.length - 1, safeAmount(house.petFloor));
  }
  if (saveObject(saved.quest) && validSaveDay(saved.quest.day)) base.quest = {
    day: saved.quest.day, done: saved.quest.done === true,
    games: [...new Set((Array.isArray(saved.quest.games) ? saved.quest.games : []).filter((id) => typeof id === 'string' && /^[a-z][a-z0-9_-]*$/i.test(id)))].slice(0, 20),
  };
  if (Array.isArray(saved.outfits)) base.outfits = saved.outfits.slice(0, 3).map((o) => saveObject(o) ? cleanLook(o) : null);
  if (saveObject(saved.diy)) {
    const cells = { clothes: 216, hat: 312, neck: 180, held: 234 };
    base.diy = {};
    for (const [type, count] of Object.entries(cells)) {
      const seen = new Set();
      base.diy[type] = (Array.isArray(saved.diy[type]) ? saved.diy[type] : []).filter((d) => {
        if (!saveObject(d) || typeof d.id !== 'string' || !/^diy_[a-z0-9_-]+$/i.test(d.id) || seen.has(d.id)
          || typeof d.px !== 'string' || d.px.length !== count || !/^[0-9a-o]+$/.test(d.px)) return false;
        seen.add(d.id); return true;
      }).slice(0, 8).map((d) => ({ id: d.id, name: typeof d.name === 'string' ? d.name.slice(0, 16) : '', px: d.px }));
    }
  }
  return base;
}

function validBackup(d) {
  return saveObject(d) && Number.isFinite(d.coins) && d.coins >= 0 && saveObject(d.look)
    && (d.house === undefined || (saveObject(d.house) && Array.isArray(d.house.floors) && d.house.floors.some(saveObject)));
}

function loadSave() {
  const base = defaultSave();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (saved) return normalizeSave(saved);
    // 從第一版換裝遊戲帶過來的搭配
    const v1 = JSON.parse(localStorage.getItem('hamster-dressup-v1') || 'null');
    if (saveObject(v1)) return normalizeSave({ look: v1 });
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
    for (const key of Object.keys(save)) if (!Object.hasOwn(latest, key)) delete save[key];
    Object.assign(save, latest, { look, house });
    lastStoredSave = raw;
    notifySaveListeners();
    return true;
  } catch { return false; }
}

let storageFailed = false;
function notifySaveListeners() {
  for (const fn of saveListeners) {
    try { fn(); } catch (err) { console.error('存檔畫面更新失敗', err); }
  }
}

function persist() {
  let stored = false;
  try {
    const raw = JSON.stringify(save);
    localStorage.setItem(SAVE_KEY, raw);
    lastStoredSave = raw;
    stored = true;
  } catch { /* 仍保留記憶體中的進度，讓玩家可以匯出備份 */ }
  storageFailed = !stored;
  notifySaveListeners();
  return stored;
}

const isOwned = (cat, item) => !item.price || !!save.owned[itemKey(cat, item.id)];

function addCoins(n) {
  if (!Number.isFinite(n)) return;
  syncStoredSave();
  save.coins = safeAmount(save.coins + Math.round(n));
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
  // 衣櫃 NEW 標記，穿過就拿掉（家具、房間不在衣櫃，不用標）
  if (CATEGORIES.some((c) => c.id === cat)) (save.fresh ||= {})[itemKey(cat, item.id)] = 1;
  checkCollection(cat);
  persist();
  return true;
}

// 收集成就：商店賣的某一類全部買齊，送一次鼠鼠幣
const COLLECT_REWARD = 100;
function shopItemsOf(cat) {
  const list = cat === 'furniture' ? FURNITURE : cat === 'rooms' ? ROOMS : CATEGORIES.find((c) => c.id === cat)?.items || [];
  return list.filter((it) => it.price && !it.boxOnly);
}
function checkCollection(cat) {
  const items = shopItemsOf(cat);
  if (!items.length || save.collected?.[cat] || !items.every((it) => isOwned(cat, it))) return;
  (save.collected ||= {})[cat] = 1;
  save.coins = safeAmount(save.coins + COLLECT_REWARD);
  setTimeout(() => { toast(`🏅 全部收集完成！再送 ${COLLECT_REWARD} 鼠鼠幣`); updateCoins?.(); sfx.win(); }, 600);
}

const DAILY_MOON_COINS = 12;
const NORMAL_BOX_PRICE = 60;
const BLIND_BOXES = {
  normal: { name: '普通盲盒', title: '花園小驚喜', rarity: '普通', price: NORMAL_BOX_PRICE, wallet: 'coins', currency: 'coins', currencyName: '鼠鼠幣', bonusCoins: [30, 60, 120] },
  moon: { name: '月亮盲盒', title: '月光夢幻收藏', rarity: '稀有', price: 12, wallet: 'moonCoins', currency: 'moon', currencyName: '月亮金幣', bonusCoins: [60, 120, 240] },
};
const itemCurrencyIcon = (item) => item.currency === 'moon' ? '<span class="moon-icon" aria-label="月亮金幣">☾</span>' : HAMSTER_COIN_ICON;

function claimDailyMoonCoins(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) return false;
  syncStoredSave();
  // 依玩家所在地的日曆日期；倒轉時鐘也不能重領已經領過的日期。
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (save.lastMoonLogin >= day) return false;
  save.moonCoins = safeAmount(save.moonCoins + DAILY_MOON_COINS);
  save.lastMoonLogin = day;
  persist();
  return true;
}

// 每日任務：一天內玩 3 種不同的小遊戲，額外送鼠鼠幣
const QUEST_GAMES = 3, QUEST_REWARD = 50;
const localDay = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
function questState() {
  const day = localDay();
  // 只有日期往後才換新任務；把時鐘往回調不會重設（避免重複領獎）
  if (!save.quest || day > save.quest.day) save.quest = { day, games: [], done: false };
  return save.quest;
}
// 玩完一局時呼叫；剛好完成任務時回傳 true
function questPlayed(game) {
  if (typeof game !== 'string' || (typeof GAMES !== 'undefined' && !Object.hasOwn(GAMES, game))) return false;
  syncStoredSave();
  const q = questState();
  if (!q.games.includes(game)) q.games.push(game);
  if (q.done || q.games.length < QUEST_GAMES) { persist(); return false; }
  q.done = true;
  save.coins = safeAmount(save.coins + QUEST_REWARD);
  persist();
  return true;
}

function boxItems(type) {
  if (!Object.hasOwn(BLIND_BOXES, type)) return [];
  const box = BLIND_BOXES[type];
  return CATEGORIES.flatMap((cat) => cat.items
    .filter((item) => item.boxOnly && (item.currency || 'coins') === box.currency)
    .map((item) => ({ cat, item })));
}

function boxPool(type) {
  return boxItems(type).filter(({ cat, item }) => !isOwned(cat.id, item));
}

function openBlindBox(type) {
  if (!Object.hasOwn(BLIND_BOXES, type)) return null;
  syncStoredSave();
  const box = BLIND_BOXES[type];
  const pool = boxPool(type);
  if (!pool.length || save[box.wallet] < box.price) return null;
  const prize = pool[Math.floor(Math.random() * pool.length)];
  save[box.wallet] -= box.price;
  save.owned[itemKey(prize.cat.id, prize.item.id)] = true;
  (save.fresh ||= {})[itemKey(prize.cat.id, prize.item.id)] = 1;
  // 配飾保底，額外金幣不佔收藏名額；與配飾分開抽取。
  const bonusRoll = Math.random();
  const bonusCoins = bonusRoll < 0.05 ? box.bonusCoins[2]
    : bonusRoll < 0.20 ? box.bonusCoins[1]
      : bonusRoll < 0.50 ? box.bonusCoins[0] : 0;
  save.coins = safeAmount(save.coins + bonusCoins);
  persist();
  return { ...prize, bonusCoins };
}

const normalBoxPool = () => boxPool('normal');
const openNormalBox = () => openBlindBox('normal');

function recordBest(game, score) {
  if (typeof game !== 'string' || !/^[a-z][a-z0-9_-]*$/i.test(game) || !Number.isFinite(score) || score < 0) return false;
  score = safeAmount(score);
  syncStoredSave();
  const prev = save.best[game] || 0;
  if (score > prev) {
    save.best[game] = score;
    persist();
    return true;
  }
  return false;
}
