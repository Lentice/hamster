// SVG 繪圖小工具。所有鼠鼠與配件都畫在 400x400 的畫布上。

const LINE = '#5A3E36';
const SW = 'stroke="#5A3E36" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
const SW3 = 'stroke="#5A3E36" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const HAMSTER_COIN_ICON = '<img class="hamster-coin" src="assets/coin_hamster.svg" alt="鼠鼠幣">';

function heart(cx, cy, s, fill, extra = '') {
  return `<path d="M${cx} ${cy + s * 0.9} C${cx - s * 1.5} ${cy + s * 0.05} ${cx - s * 0.95} ${cy - s * 1.15} ${cx} ${cy - s * 0.35} C${cx + s * 0.95} ${cy - s * 1.15} ${cx + s * 1.5} ${cy + s * 0.05} ${cx} ${cy + s * 0.9} Z" fill="${fill}" ${extra}/>`;
}

function star(cx, cy, r, fill, extra = '', inner = 0.48) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${extra}/>`;
}

function flower(cx, cy, r, petal, center = '#FFE07A') {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    s += `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="${r * 0.75}" fill="${petal}"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="${center}"/>`;
}

// 身體外形：smooth 平滑橢圓、fluffy 蓬蓬毛邊、spiky 刺刺毛（阿比西尼亞）
function bodyPath(cx, cy, rx, ry, shape = 'smooth') {
  if (shape === 'smooth') {
    return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
  }
  const n = shape === 'fluffy' ? 26 : 20;
  const pt = (a, k) => [(cx + rx * k * Math.cos(a)).toFixed(1), (cy + ry * k * Math.sin(a)).toFixed(1)];
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const am = ((i + 0.5) / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const [x0, y0] = pt(a0, 0.97);
    const [xm, ym] = pt(am, shape === 'fluffy' ? 1.07 : 1.09);
    const [x1, y1] = pt(a1, 0.97);
    if (i === 0) d += `M${x0} ${y0}`;
    d += shape === 'fluffy' ? ` Q${xm} ${ym} ${x1} ${y1}` : ` L${xm} ${ym} L${x1} ${y1}`;
  }
  return d + ' Z';
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

const svgWrap = (inner, view = '0 0 400 400', cls = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${view}" class="${cls}">${inner}</svg>`;

// 點陣素材：assets/<name>.webp，尺寸由 assets/manifest.js 提供（不存在時當正方形）
const assetUrl = (name) => `assets/${name}.webp`;
function assetSize(name) {
  const s = (window.ASSET_SIZES || {})[name];
  return s ? { w: s[0], h: s[1] } : { w: 512, h: 512 };
}
// 以寬度 w 放置貼紙，(cx, bottom) 為底部中心；或指定 cy 為中心
function stickerImage(name, { w, cx = 200, bottom, cy }) {
  const { w: iw, h: ih } = assetSize(name);
  const h = (w * ih) / iw;
  const y = bottom !== undefined ? bottom - h : cy - h / 2;
  return `<image href="${assetUrl(name)}" x="${(cx - w / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h.toFixed(1)}"/>`;
}

// 把 SVG 內引用的 assets 轉成 data URL，才能畫進 canvas（存圖、小遊戲）
const dataUrlCache = {};
async function inlineAssets(svg) {
  const names = [...new Set([...svg.matchAll(/href="(assets\/[^"]+)"/g)].map((m) => m[1]))];
  await Promise.all(names.map(async (url) => {
    if (dataUrlCache[url]) return;
    try {
      const blob = await (await fetch(url)).blob();
      dataUrlCache[url] = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(blob);
      });
    } catch { /* file:// 下無法讀取，就保留原連結 */ }
  }));
  return svg.replace(/href="(assets\/[^"]+)"/g, (m, url) => (dataUrlCache[url] ? `href="${dataUrlCache[url]}"` : m));
}

async function svgToImage(svg) {
  const inlined = await inlineAssets(svg);
  const url = URL.createObjectURL(new Blob([inlined], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  URL.revokeObjectURL(url);
  return img;
}
