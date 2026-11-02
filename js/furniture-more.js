// 更多家具，以及每件家具「使用時」的動畫設定（fx，見 home.js 的 DEFAULT_FX）。
// 原本只能擺著看的家具也都可以用了。

// 舊家具補上用法與動畫
(() => {
  const set = (id, patch) => Object.assign(byId(FURNITURE, id), patch);
  set('plant', { use: 'sniff' });
  set('rug', { use: 'roll', fx: { furn: null, particles: ['✨', '💫'], from: [0.5, 0.4] } });
  set('lamp', { use: 'light' });
  set('shelf', { use: 'play', fx: { particles: ['🧸', '🚂', '⭐'] } });
  set('hammock', { fx: { furn: 'swing' } });
  set('slide', { fx: { furn: null, particles: ['💨', '✨', '😆'], act: 'spin' } });
  set('hotair', { fx: { furn: 'float' } });
  set('castle', { fx: { furn: null, particles: ['✨', '👑'], from: [0.5, 0.15], rate: 900 } });
  set('cakehouse', { fx: { furn: 'breathe', particles: ['🍓', '✨'], from: [0.5, 0.1], rate: 900 } });
  set('r_piano', { use: 'music' });
  set('r_aquarium', { use: 'watch', fx: { particles: ['🫧', '🫧', '🐟'], from: [0.5, 0.45], spread: 0.6 } });
  set('r_swing', { use: 'swing', fx: { furn: null, seat: [0.5, 0.78], particles: ['💨', '✨'], from: [0.5, 0.7], rate: 700 } });
  set('r_cushion', { fx: { furn: 'breathe' } });
  set('bowl', { fx: { particles: ['🌻', '😋'] } });
})();

FURNITURE.push(...[
  { id: 'n_seesaw', name: '翹翹板', img: 'f_seesaw', w: 320, use: 'ride', price: 120, fx: { furn: 'rock', pet: 'rock', seat: [0.2, 0.5], particles: ['⭐', '😆'] } },
  { id: 'n_trampoline', name: '彈跳床', img: 'f_trampoline', w: 260, use: 'bounce', price: 140, fx: { seat: [0.5, 0.36] } },
  { id: 'n_bathtub', name: '泡泡浴缸', img: 'f_bathtub', w: 280, use: 'bath', price: 220, fx: { seat: [0.48, 0.62], cover: 0.42 } },
  { id: 'n_tv', name: '小電視', img: 'f_tv', w: 200, use: 'watch', price: 160, fx: { furn: 'glow', particles: ['📺', '✨', '😂'], from: [0.5, 0.3] } },
  { id: 'n_bookshelf', name: '小書櫃', img: 'f_bookshelf', w: 220, use: 'read', price: 100 },
  { id: 'n_carousel', name: '旋轉木馬', img: 'f_carousel', w: 320, use: 'ride', price: 380, fx: { furn: 'bop', pet: 'bob', seat: [0.5, 0.78], particles: ['🎵', '✨', '⭐'] } },
  { id: 'n_fridge', name: '點心冰箱', img: 'f_fridge', w: 180, use: 'eat', price: 140, fx: { furn: 'shake', particles: ['🍓', '🧀', '🍰', '❄️'], from: [0.5, 0.35] } },
  { id: 'n_ballpit', name: '彩球池', img: 'f_ballpit', w: 300, use: 'play', price: 180, fx: { furn: 'shake', pet: 'bob', seat: [0.5, 0.66], cover: 0.4, particles: ['🔴', '🟡', '🔵', '🟢'], from: [0.5, 0.3] } },
  { id: 'n_clock', name: '咕咕鐘', img: 'f_clock', w: 170, use: 'watch', price: 120, fx: { furn: 'tick', particles: ['🎶', '⏰'], from: [0.5, 0.15] } },
  { id: 'n_fireplace', name: '暖暖壁爐', img: 'f_fireplace', w: 280, use: 'warm', price: 240 },
  { id: 'n_telescope', name: '星星望遠鏡', img: 'f_telescope', w: 220, use: 'watch', price: 200, fx: { particles: ['⭐', '🌙', '✨', '💫'], from: [0.2, 0.05], spread: 0.6, rate: 380 } },
  { id: 'n_dresser', name: '公主化妝台', img: 'f_dresser', w: 220, use: 'dress', price: 260 },
  { id: 'n_drum', name: '咚咚小鼓', img: 'f_drum', w: 170, use: 'music', price: 80, fx: { furn: 'squash', particles: ['🥁', '🎵', '💥'] } },
  { id: 'n_teaset', name: '下午茶桌', img: 'f_teaset', w: 240, use: 'eat', price: 160, fx: { furn: null, particles: ['☕', '♨️', '🍰'], from: [0.5, 0.2] } },
  { id: 'n_easel', name: '小畫架', img: 'f_easel', w: 200, use: 'paint', price: 120 },
  { id: 'n_sofa', name: '軟軟沙發', img: 'f_sofa', w: 300, use: 'sit', price: 180, fx: { seat: [0.5, 0.66] } },
  { id: 'n_toybox', name: '玩具箱', img: 'f_toybox', w: 220, use: 'play', price: 90, fx: { particles: ['🧸', '🪀', '🎈', '⭐'], from: [0.5, 0.15] } },
  { id: 'n_cottonball', name: '棉花窩', img: 'f_cottonball', w: 240, use: 'sleep', price: 100, fx: { seat: [0.5, 0.66], cover: 0.5, furn: 'breathe' } },
  { id: 'n_fountain', name: '小噴泉', img: 'f_fountain', w: 230, use: 'drink', price: 200, fx: { furn: null, particles: ['💧', '💦', '✨'], from: [0.5, 0.1], spread: 0.3, rate: 300 } },
  { id: 'n_rockinghorse', name: '搖搖木馬', img: 'f_rockinghorse', w: 240, use: 'ride', price: 150, fx: { seat: [0.5, 0.46] } },
].filter((f) => (window.ASSET_SIZES || {})[f.img])); // 圖還沒處理好的先不上架
