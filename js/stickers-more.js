// Codex 畫的點陣貼紙配件（batch 6）。圖還沒處理好的就先不上架。

(() => {
  const ready = (img) => !!(window.ASSET_SIZES || {})[img];
  const add = (list, items) => list.push(...items.filter((it) => ready(it.img)));
  add(HATS, [
    { id: 'r_beret', name: '畫家貝雷帽', price: 160, img: 'hat_beret', place: { w: 170, bottom: 172 } },
    { id: 'r_chef', name: '高高廚師帽', price: 180, img: 'hat_chef', place: { w: 150, bottom: 174 } },
    { id: 'r_bunnyears', name: '毛毛兔耳', price: 200, img: 'hat_bunnyears', place: { w: 190, bottom: 182 } },
    { id: 'r_crownjewel', name: '寶石皇冠', price: 320, img: 'hat_crownjewel', place: { w: 150, bottom: 166 } },
    { id: 'r_frog', name: '大眼青蛙帽', price: 220, img: 'hat_frog', place: { w: 190, bottom: 182 } },
    { id: 'r_strawberrybonnet', name: '草莓蕾絲帽', price: 260, img: 'hat_strawberrybonnet', place: { w: 210, bottom: 196 } },
  ]);
  add(HELD, [
    { id: 'r_heartballoon', name: '愛心氣球', price: 160, img: 'held_balloon', place: { w: 90, cx: 262, bottom: 336 } },
    { id: 'r_bubblewand', name: '泡泡棒', price: 180, img: 'held_bubblewand', place: { w: 90, cx: 258, bottom: 338 } },
    { id: 'r_pinwheel', name: '彩虹風車', price: 160, img: 'held_pinwheel', place: { w: 80, cx: 256, bottom: 338 } },
    { id: 'r_cake', name: '草莓蛋糕', price: 200, img: 'held_cake', place: { w: 92, bottom: 344 } },
    { id: 'r_watermelon', name: '大西瓜片', price: 160, img: 'held_watermelon', place: { w: 92, bottom: 344 } },
    { id: 'r_present', name: '驚喜禮物', price: 220, img: 'held_present', place: { w: 88, bottom: 346 } },
  ]);
  add(NECK, [
    { id: 'r_pearlbow', name: '珍珠蝴蝶結鍊', price: 240, img: 'neck_pearlbow', place: { w: 150, cy: 302 } },
    { id: 'r_flowerlei', name: '夏威夷花環', price: 220, img: 'neck_flowerlei', place: { w: 180, cy: 304 } },
    { id: 'r_scarfknit', name: '粗針織圍巾', price: 200, img: 'neck_scarfknit', place: { w: 180, cy: 306 } },
    { id: 'r_bellcollar', name: '金鈴鐺項圈', price: 160, img: 'neck_bellcollar', place: { w: 140, cy: 300 } },
    { id: 'r_medal', name: '冠軍金牌', price: 180, img: 'neck_medal', place: { w: 110, cy: 312 } },
    { id: 'r_cape', name: '國王披肩', price: 280, img: 'neck_cape', place: { w: 200, cy: 304 } },
  ]);
  add(GLASSES, [
    { id: 'r_heartglasses', name: '粉紅愛心墨鏡', price: 180, img: 'glasses_heart', place: { w: 150, cy: 226 } },
    { id: 'r_starglasses', name: '派對星星鏡', price: 180, img: 'glasses_star', place: { w: 156, cy: 224 } },
    { id: 'r_goggle', name: '藍藍蛙鏡', price: 160, img: 'glasses_goggle', place: { w: 160, cy: 226 } },
    { id: 'r_roundgold', name: '金框圓眼鏡', price: 160, img: 'glasses_round', place: { w: 140, cy: 226 } },
  ]);
})();
