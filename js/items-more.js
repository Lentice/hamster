// 更多手繪 SVG 配件（追加在 items.js 之後載入）。
// 座標同樣以標準倉鼠為準：頭頂 y=146、雙眼 y=225、脖子 y≈288、雙手 y=302。
// price 依照精緻程度：0 免費、簡單 20–40、中等 60–120、精緻 140–220、招牌 240–320。

{
  // ── 小工具（只在這個區塊內使用）──
  const pts = (n, f) => Array.from({ length: n }, (_, i) => f(i, n > 1 ? i / (n - 1) : 0));
  const both = (f) => [165, 235].map(f).join('');
  // 沿二次貝茲曲線取點
  const qpt = (t, [x0, y0], [x1, y1], [x2, y2]) => [
    (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2,
    (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2,
  ];
  // 外框粗線 + 內色線（像描邊的繩子、緞帶）
  const cord = (d, color, w = 6) => `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // 彎月：圓心 (cx, cy)、半徑 r，開口朝右
  const crescent = (cx, cy, r, fill, extra = '') => {
    const tx = (cx + r * 0.259).toFixed(1), ty = (cy - r * 0.966).toFixed(1), by = (cy + r * 0.966).toFixed(1);
    return `<path d="M${tx} ${ty} A${r} ${r} 0 1 0 ${tx} ${by} A${(r * 1.07).toFixed(1)} ${(r * 1.07).toFixed(1)} 0 0 1 ${tx} ${ty} Z" fill="${fill}" ${extra}/>`;
  };
  const fx = (cls, i, x, y, inner, step = 0.4) => `<g class="${cls}" style="animation-delay:${(i * step).toFixed(2)}s;transform-origin:${x}px ${y}px">${inner}</g>`;

  // ───────────────────────── 衣服 ─────────────────────────
  CLOTHES.push(
    {
      id: 'm_sunnytee', name: '小雛菊背心', price: 0,
      clipped: () => band('#FFF1A8', 288),
      front: () => `<path d="M162 288 Q200 316 238 288" fill="none" ${SW3}/>
        <path d="M206 330 Q216 340 226 334" fill="none" stroke="#8BD47A" stroke-width="4" stroke-linecap="round"/>
        <g stroke="${LINE}" stroke-width="2">${flower(200, 324, 9, '#FFFFFF', '#FFB74D')}</g>`,
    },
    {
      id: 'm_rainbowknit', name: '彩虹毛衣', price: 80,
      clipped: () => ['#FF8FA3', '#FFB74D', '#FFE07A', '#9EDCC8', '#7FB3F0', '#B8A4F0', '#FF8FA3', '#FFB74D']
        .map((c, i) => `<rect x="20" y="${286 + i * 16}" width="360" height="16" fill="${c}"/>`).join('') +
        pts(8, (i) => `<path d="M20 ${300 + i * 16} ${pts(23, (j) => `L${28 + j * 16} ${304 + i * 16} L${36 + j * 16} ${300 + i * 16}`).join(' ')}" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>`).join(''),
      front: () => `<rect x="160" y="278" width="80" height="18" rx="9" fill="#FFF3DE" ${SW3}/>
        ${pts(6, (i) => `<path d="M${172 + i * 11} 282 V292" stroke="#E9D5BC" stroke-width="3" stroke-linecap="round"/>`).join('')}`,
    },
    {
      id: 'm_denim', name: '牛仔外套', price: 120,
      clipped: () => `${band('#7FA6D8', 284)}<path d="M168 284 L200 336 L232 284 Z" fill="#FFFFFF"/>
        <path d="M200 336 V460" stroke="#5E86BE" stroke-width="4"/>
        <path d="M126 312 H170 V338 Q148 344 126 338 Z M230 312 H274 V338 Q252 344 230 338 Z" fill="#6E96CE" ${SW3}/>
        <path d="M131 318 H165 M235 318 H269" stroke="#FFE07A" stroke-width="2" stroke-dasharray="4 3"/>
        ${heart(148, 328, 6, '#FF8FA3', SW3)}${star(252, 328, 7, '#FFD54F', SW3)}
        ${[322, 342].map((y) => `<circle cx="212" cy="${y}" r="4" fill="#C9D3E3" ${SW3}/>`).join('')}`,
      front: () => `<path d="M166 284 L192 322 L196 296 Z M234 284 L208 322 L204 296 Z" fill="#5E86BE" ${SW3}/>`,
    },
    {
      id: 'm_pajamas', name: '星月睡衣', price: 140,
      clipped: (p) => `<rect x="20" y="284" width="360" height="220" fill="url(#${p}-mpj)"/>
        <path d="M200 300 V460" stroke="#FFF3DE" stroke-width="5"/><path d="M200 300 V460" stroke="${LINE}" stroke-width="2"/>
        ${[322, 342, 362].map((y) => `<circle cx="212" cy="${y}" r="4" fill="#FFF3DE" ${SW3}/>`).join('')}`,
      front: () => `<path d="M160 284 L186 312 L200 298 L214 312 L240 284 Q200 300 160 284 Z" fill="#FFF3DE" ${SW3}/>`,
      defs: (p) => `<pattern id="${p}-mpj" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="#8E9BE0"/>${star(10, 10, 5, '#FFF1A8', '', 0.45)}
        ${crescent(30, 29, 7, '#FFF3DE')}<circle cx="32" cy="8" r="1.6" fill="#fff"/><circle cx="8" cy="32" r="1.6" fill="#fff"/></pattern>`,
    },
    {
      id: 'm_bunnysuit', name: '兔兔連身衣', price: 200,
      back: (p, sp) => `${[[160, -12], [240, 12]].map(([x, r]) => `<ellipse cx="${x}" cy="82" rx="21" ry="52" transform="rotate(${r} ${x} 82)" fill="#FFF6FA" ${SW}/>
        <ellipse cx="${x}" cy="88" rx="10" ry="36" transform="rotate(${r} ${x} 88)" fill="#FFC0D0"/>`).join('')}
        <path d="M${200 - sp.rx * 1.04} 262 Q${200 - sp.rx * 1.15} 128 200 118 Q${200 + sp.rx * 1.15} 128 ${200 + sp.rx * 1.04} 262 Z" fill="#FFF6FA" ${SW}/>`,
      clipped: () => `${band('#FFF6FA', 282)}<ellipse cx="200" cy="360" rx="62" ry="48" fill="#FFE4EC"/>`,
      front: () => `<path d="M156 282 Q200 300 244 282" fill="none" stroke="#FFB3C7" stroke-width="7" stroke-linecap="round"/>
        ${heart(200, 340, 10, '#FF8FA3', SW3)}
        ${[176, 224].map((x) => `<circle cx="${x}" cy="296" r="6" fill="#FFF" ${SW3}/>`).join('')}`,
    },
    {
      id: 'm_mermaid', name: '人魚公主裝', price: 280,
      // 尾鰭貼著身體右下（cy + 0.8ry 處，身體邊緣約在 200 + 0.6rx）
      back: (p, sp) => `<g transform="translate(${(sp.rx * 0.6 - 70).toFixed(1)} ${(sp.cy + sp.ry * 0.8 - sp.dy - 352).toFixed(1)})"><path d="M286 346 Q326 340 350 304 Q348 330 366 340 Q378 314 386 300 Q384 346 360 370 Q330 380 292 366 Z" fill="#7CD3C8" ${SW}/>
        <path d="M320 352 Q344 342 356 322 M326 362 Q352 360 370 338" fill="none" stroke="#B8EDE4" stroke-width="3" stroke-linecap="round"/></g>`,
      clipped: (p) => `<rect x="20" y="284" width="360" height="220" fill="url(#${p}-mscale)"/>
        <rect x="20" y="284" width="360" height="20" fill="#D9CCF7"/>`,
      front: () => `${pts(9, (i, t) => { const [x, y] = qpt(t, [150, 300], [200, 316], [250, 300]); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="#FFFDF7" stroke="#C9B6D8" stroke-width="1.5"/>`; }).join('')}
        <g transform="translate(200 326)"><path d="M0 12 L-18 -6 Q-12 -18 0 -16 Q12 -18 18 -6 Z" fill="#FFC0D0" ${SW3}/>
        <path d="M0 12 L-9 -14 M0 12 V-16 M0 12 L9 -14" stroke="#F49AB4" stroke-width="2"/><circle cx="0" cy="12" r="3.5" fill="#FFF" ${SW3}/></g>
        ${star(140, 300, 11, '#FFB3A7', SW3)}`,
      defs: (p) => `<pattern id="${p}-mscale" width="24" height="18" patternUnits="userSpaceOnUse">
        <rect width="24" height="18" fill="#7CD3C8"/><path d="M0 0 Q12 20 24 0 M-12 9 Q0 29 12 9 M12 9 Q24 29 36 9" fill="none" stroke="#B8EDE4" stroke-width="2.5"/></pattern>`,
    },
  );

  // ───────────────────────── 帽子 ─────────────────────────
  HATS.push(
    {
      id: 'm_bearears', name: '小熊耳髮箍', price: 0,
      render: () => `<path d="M124 169 Q200 123 276 169" fill="none" stroke="${LINE}" stroke-width="10"/><path d="M124 169 Q200 123 276 169" fill="none" stroke="#C98B5A" stroke-width="5"/>
        ${[144, 256].map((x) => `<circle cx="${x}" cy="130" r="23" fill="#C98B5A" ${SW}/><circle cx="${x}" cy="132" r="12" fill="#F2C9A0"/>`).join('')}`,
    },
    {
      id: 'm_bucket', name: '雛菊漁夫帽', price: 100,
      render: () => `<path d="M136 154 Q136 96 200 94 Q264 96 264 154 Z" fill="#BFE6FF" ${SW}/>
        <path d="M144 140 Q200 130 256 140" fill="none" stroke="#7FB3F0" stroke-width="3" stroke-dasharray="6 4"/>
        <path d="M108 172 Q114 148 138 148 H262 Q286 148 292 172 Q200 184 108 172 Z" fill="#A8D8F5" ${SW}/>
        <path d="M120 166 Q200 176 280 166" fill="none" stroke="#7FB3F0" stroke-width="2.5" stroke-dasharray="6 4"/>
        <g stroke="${LINE}" stroke-width="2">${flower(176, 120, 9, '#FFFFFF', '#FFD54F')}${flower(212, 112, 7, '#FFFFFF', '#FFD54F')}</g>`,
    },
    {
      id: 'm_tophat', name: '紳士小禮帽', price: 160,
      render: () => `<g transform="rotate(12 232 150)">
        <rect x="204" y="88" width="56" height="58" rx="6" fill="#3A3340" ${SW}/>
        <rect x="205" y="122" width="54" height="13" fill="#FF8FA3"/>
        <path d="M206 122 H258 M206 135 H258" ${SW3}/>
        <ellipse cx="232" cy="148" rx="46" ry="10" fill="#3A3340" ${SW}/>
        <path d="M212 96 Q214 112 212 120" stroke="#6A6170" stroke-width="4" stroke-linecap="round" fill="none"/>
        <g stroke="${LINE}" stroke-width="2">${flower(212, 128, 7, '#FFFFFF', '#FFD54F')}</g></g>`,
    },
  );

  // ───────────────────────── 眼鏡 ─────────────────────────
  GLASSES.push(
    {
      id: 'm_blackframe', name: '黑框眼鏡', price: 0,
      render: () => both((x) => `<rect x="${x - 25}" y="208" width="50" height="36" rx="8" fill="#fff" fill-opacity=".2" stroke="#3A3340" stroke-width="7"/>
        <path d="M${x - 16} 216 L${x - 9} 213" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`) +
        `<path d="M190 221 Q200 214 210 221 M140 218 L126 213 M260 218 L274 213" fill="none" stroke="#3A3340" stroke-width="6" stroke-linecap="round"/>`,
    },
    {
      id: 'm_browline', name: '半框眼鏡', price: 0,
      render: () => both((x) => `<path d="M${x - 24} 222 Q${x - 23} 247 ${x} 247 Q${x + 23} 247 ${x + 24} 222" fill="none" stroke="#C79B4B" stroke-width="2.5"/>
        <path d="M${x - 27} 222 Q${x - 27} 197 ${x} 197 Q${x + 27} 197 ${x + 27} 222 L${x + 21} 222 Q${x + 20} 205 ${x} 205 Q${x - 20} 205 ${x - 21} 222 Z" fill="#B23A5A" ${SW3}/>`) +
        `<path d="M193 210 H207 M139 218 L126 214 M261 218 L274 214" fill="none" stroke="#C79B4B" stroke-width="3" stroke-linecap="round"/>`,
    },
    {
      id: 'm_hexgold', name: '六角金框', price: 60,
      render: () => both((x) => `<polygon points="${pts(6, (i) => { const a = (i * Math.PI) / 3; return `${(x + 25 * Math.cos(a)).toFixed(1)},${(225 + 23 * Math.sin(a)).toFixed(1)}`; }).join(' ')}" fill="#FFF3DE" fill-opacity=".15" stroke="#D9A73A" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${x - 12} 214 L${x - 6} 210" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`) +
        `<path d="M190 222 Q200 216 210 222 M140 222 L126 216 M260 222 L274 216" fill="none" stroke="#D9A73A" stroke-width="3.5"/>`,
    },
    {
      id: 'm_swirl', name: '漩渦眼鏡', price: 60,
      render: () => both((x) => `<circle cx="${x}" cy="225" r="23" fill="#FFFFFF" stroke="${LINE}" stroke-width="5"/>
        <polyline points="${pts(40, (i) => { const a = i * 0.42, r = 1 + i * 0.47; return `${(x + r * Math.cos(a)).toFixed(1)},${(225 + r * Math.sin(a)).toFixed(1)}`; }).join(' ')}" fill="none" stroke="#7FB3F0" stroke-width="3" stroke-linecap="round"/>`) +
        `<path d="M188 222 Q200 214 212 222 M142 220 L126 214 M258 220 L274 214" fill="none" ${SW}/>`,
    },
    {
      id: 'm_shutter', name: '百葉窗眼鏡', price: 80,
      render: () => both((x) => `<rect x="${x - 25}" y="208" width="50" height="34" rx="9" fill="none" stroke="#FF5C8A" stroke-width="5"/>
        ${[216, 225, 234].map((y) => `<path d="M${x - 23} ${y} H${x + 23}" stroke="#FF5C8A" stroke-width="3.5"/>`).join('')}`) +
        `<path d="M190 218 H210 M140 216 L126 212 M260 216 L274 212" stroke="#FF5C8A" stroke-width="5" stroke-linecap="round"/>`,
    },
    {
      id: 'm_cloudglass', name: '雲朵眼鏡', price: 80,
      render: () => both((x) => {
        const d = `M${x - 26} 236 Q${x - 35} 222 ${x - 21} 213 Q${x - 16} 199 ${x} 205 Q${x + 16} 198 ${x + 21} 213 Q${x + 35} 221 ${x + 27} 236 Q${x + 20} 249 ${x} 244 Q${x - 19} 250 ${x - 26} 236 Z`;
        return `<path d="${d}" fill="#E6F6FF" fill-opacity=".3" stroke="${LINE}" stroke-width="10" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>`;
      }) + `<path d="M192 220 H208" stroke="${LINE}" stroke-width="9" stroke-linecap="round"/><path d="M192 220 H208" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
        <path d="M150 214 Q154 210 160 210" fill="none" stroke="#BFE6FF" stroke-width="3" stroke-linecap="round"/>`,
    },
    {
      id: 'm_aviator', name: '飛行員墨鏡', price: 100,
      render: (p) => `<defs><linearGradient id="${p}-mavi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A4E7E"/><stop offset="1" stop-color="#F4A6B8"/></linearGradient></defs>` +
        [[165, 1], [235, -1]].map(([x, s]) => `<path d="M${x - 24 * s} 212 Q${x} 205 ${x + 23 * s} 212 Q${x + 24 * s} 238 ${x + 6 * s} 246 Q${x - 22 * s} 250 ${x - 24 * s} 212 Z" fill="url(#${p}-mavi)" fill-opacity=".92" stroke="#E0B23E" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${x - 14 * s} 217 L${x - 6 * s} 214" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`).join('') +
        `<path d="M188 212 Q200 207 212 212 M189 220 Q200 217 211 220 M141 213 L126 210 M259 213 L274 210" fill="none" stroke="#E0B23E" stroke-width="3.5" stroke-linecap="round"/>`,
    },
    {
      id: 'm_lemon', name: '檸檬片眼鏡', price: 120,
      render: () => both((x) => `<circle cx="${x}" cy="225" r="24" fill="#FFF59D" fill-opacity=".35" stroke="${LINE}" stroke-width="9"/>
        <circle cx="${x}" cy="225" r="24" fill="none" stroke="#FFE04F" stroke-width="5"/>
        <circle cx="${x}" cy="225" r="20" fill="none" stroke="#FFFBE0" stroke-width="2"/>
        ${pts(8, (i) => { const a = (i * Math.PI) / 4 + 0.39; return `<path d="M${(x + 13 * Math.cos(a)).toFixed(1)} ${(225 + 13 * Math.sin(a)).toFixed(1)} L${(x + 19 * Math.cos(a)).toFixed(1)} ${(225 + 19 * Math.sin(a)).toFixed(1)}" stroke="#FFFBE0" stroke-width="2" stroke-linecap="round"/>`; }).join('')}`) +
        `<path d="M189 222 Q200 216 211 222" fill="none" stroke="#8BD47A" stroke-width="5" stroke-linecap="round"/>
        <path d="M144 203 Q138 190 150 186 Q156 198 144 203 Z" fill="#8BD47A" ${SW3}/>`,
    },
    {
      id: 'm_bunnyglass', name: '兔兔眼鏡', price: 120,
      render: () => both((x) => `${[[-9, -14], [9, 14]].map(([o, r]) => `<ellipse cx="${x + o}" cy="194" rx="6.5" ry="13" transform="rotate(${r} ${x + o} 194)" fill="#FFFFFF" ${SW3}/><ellipse cx="${x + o}" cy="196" rx="2.5" ry="7" transform="rotate(${r} ${x + o} 196)" fill="#FFC0D0"/>`).join('')}
        <circle cx="${x}" cy="225" r="22" fill="#FFF" fill-opacity=".2" stroke="${LINE}" stroke-width="9"/><circle cx="${x}" cy="225" r="22" fill="none" stroke="#FFB3C7" stroke-width="5"/>`) +
        `<path d="M188 222 Q200 215 212 222" fill="none" stroke="#FFB3C7" stroke-width="5" stroke-linecap="round"/><path d="M142 220 L126 214 M258 220 L274 214" ${SW3}/>`,
    },
    {
      id: 'm_strawglass', name: '草莓眼鏡', price: 140,
      render: () => both((x) => `<path d="M${x - 25} 215 Q${x} 202 ${x + 25} 215 Q${x + 25} 238 ${x} 251 Q${x - 25} 238 ${x - 25} 215 Z" fill="#FF8A95" fill-opacity=".35" stroke="${LINE}" stroke-width="9" stroke-linejoin="round"/>
        <path d="M${x - 25} 215 Q${x} 202 ${x + 25} 215 Q${x + 25} 238 ${x} 251 Q${x - 25} 238 ${x - 25} 215 Z" fill="none" stroke="#FF5C6C" stroke-width="5" stroke-linejoin="round"/>
        ${[[-20, 222], [20, 222], [-14, 238], [14, 238], [0, 248]].map(([o, y]) => `<ellipse cx="${x + o}" cy="${y}" rx="1.6" ry="2.4" fill="#FFE07A"/>`).join('')}
        <path d="M${x} 210 L${x - 12} 200 L${x - 4} 206 L${x} 196 L${x + 4} 206 L${x + 12} 200 Z" fill="#6CC46A" ${SW3}/>`) +
        `<path d="M190 222 Q200 216 210 222 M140 220 L126 214 M260 220 L274 214" fill="none" stroke="#6CC46A" stroke-width="4" stroke-linecap="round"/>`,
    },
    {
      id: 'm_flowerglass', name: '花朵眼鏡', price: 160,
      render: () => both((x) => `<g stroke="${LINE}" stroke-width="2.5">${pts(8, (i) => { const a = (i * Math.PI) / 4; return `<circle cx="${(x + 24 * Math.cos(a)).toFixed(1)}" cy="${(225 + 24 * Math.sin(a)).toFixed(1)}" r="9" fill="${i % 2 ? '#FFFFFF' : '#FFB3C7'}"/>`; }).join('')}</g>
        <circle cx="${x}" cy="225" r="18" fill="#FFF6FA" fill-opacity=".25" stroke="#FF8FA3" stroke-width="4"/>`) +
        `<circle cx="200" cy="216" r="5" fill="#FFE07A" ${SW3}/>`,
    },
    {
      id: 'm_rainbowglass', name: '彩虹鏡框', price: 180,
      render: () => both((x) => `<circle cx="${x}" cy="225" r="30" fill="none" stroke="${LINE}" stroke-width="2.5"/>
        ${['#FF8FA3', '#FFE07A', '#9EDCC8', '#B8A4F0'].map((c, i) => `<circle cx="${x}" cy="225" r="${27 - i * 3.4}" fill="none" stroke="${c}" stroke-width="3.6"/>`).join('')}
        <circle cx="${x}" cy="225" r="15.5" fill="#FFF" fill-opacity=".18" stroke="${LINE}" stroke-width="2.5"/>`) +
        `<path d="M195 220 Q200 214 205 220" fill="none" ${SW3}/>${star(268, 198, 7, '#FFF1A8', SW3)}${star(130, 252, 5, '#FFFFFF', SW3)}`,
    },
    {
      id: 'm_pearlchain', name: '珍珠鏈眼鏡', price: 200,
      render: () => [[128, 222, 120, 296, 1], [272, 222, 280, 296, -1]].map(([x0, y0, x2, y2]) =>
        pts(10, (i, t) => { const [x, y] = qpt(t, [x0, y0], [x0 + (x2 - x0) * 2.6, 266], [x2, y2]); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 === 2 ? 4.5 : 3}" fill="#FFFDF7" stroke="#D8C8C0" stroke-width="1.5"/>`; }).join('')).join('') +
        both((x) => `<ellipse cx="${x}" cy="225" rx="25" ry="21" fill="#FFF6FA" fill-opacity=".2" stroke="#E8A0B8" stroke-width="4.5"/>
        <path d="M${x - 14} 214 L${x - 7} 210" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`) +
        `<path d="M190 221 Q200 214 210 221 M140 220 L128 222 M260 220 L272 222" fill="none" stroke="#E8A0B8" stroke-width="4" stroke-linecap="round"/>
        ${heart(141, 207, 6, '#FF8FA3', SW3)}${heart(259, 207, 6, '#FF8FA3', SW3)}`,
    },
    {
      id: 'm_skigoggle', name: '滑雪護目鏡', price: 140,
      render: (p) => `<defs><linearGradient id="${p}-mski" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB74D"/><stop offset=".5" stop-color="#FF8FA3"/><stop offset="1" stop-color="#B8A4F0"/></linearGradient></defs>
        <path d="M108 226 H292" stroke="${LINE}" stroke-width="15" stroke-linecap="round"/><path d="M108 226 H292" stroke="#7FD0F0" stroke-width="9" stroke-linecap="round"/>
        <path d="M118 226 H134 M266 226 H282" stroke="#FFF" stroke-width="3" stroke-dasharray="4 4"/>
        <rect x="134" y="203" width="132" height="46" rx="22" fill="#FFFFFF" ${SW}/>
        <rect x="141" y="209" width="118" height="34" rx="16" fill="url(#${p}-mski)" fill-opacity=".55"/>
        <path d="M154 216 L172 216 M150 224 L160 224" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>`,
    },
    {
      id: 'm_masquerade', name: '星光舞會面具', price: 260,
      render: () => `<g transform="translate(270 212)">
          <path d="M0 0 Q4 -40 26 -62 Q22 -28 0 0 Z" fill="#FFB3C7" ${SW3}/><path d="M0 0 Q16 -30 44 -40 Q30 -12 0 0 Z" fill="#9EDCC8" ${SW3}/>
          <path d="M2 -4 Q8 -32 22 -52 M4 -4 Q18 -24 38 -36" fill="none" stroke="#fff" stroke-width="2"/></g>
        <path fill-rule="evenodd" d="M124 214 Q138 194 170 203 Q200 214 230 203 Q262 194 276 214 Q286 238 262 249 Q236 256 214 241 Q200 234 186 241 Q164 256 138 249 Q114 238 124 214 Z M147 226 a18 15 0 1 0 36 0 a18 15 0 1 0 -36 0 Z M217 226 a18 15 0 1 0 36 0 a18 15 0 1 0 -36 0 Z" fill="#9474DA" ${SW3}/>
        <path d="M132 210 Q150 200 170 207 Q200 218 230 207 Q250 200 268 210" fill="none" stroke="#FFD54F" stroke-width="3" stroke-linecap="round"/>
        ${[[136, 236], [264, 236], [200, 223]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#FFF1A8" ${SW3}/>`).join('')}
        ${star(200, 244, 6, '#FFD54F', SW3)}`,
    },
    {
      id: 'm_eyepatch', name: '海盜眼罩', price: 0,
      render: () => `<path d="M124 194 Q170 176 220 212 M252 232 L276 244" fill="none" stroke="#3A3340" stroke-width="5" stroke-linecap="round"/>
        <path d="M216 214 Q236 204 254 216 Q258 238 236 244 Q216 240 216 214 Z" fill="#3A3340" ${SW3}/>
        ${heart(236, 225, 5, '#FFFFFF')}`,
    },
  );

  // ───────────────────────── 頸飾 ─────────────────────────
  NECK.push(
    {
      id: 'm_whistle', name: '運動哨子', price: 0,
      render: () => `${cord('M162 282 L196 318 M238 282 L204 318', '#7FB3F0', 4)}
        <path d="M186 318 H210 Q218 318 218 326 Q218 336 206 336 Q194 336 192 328 H186 Z" fill="#D8DEE8" ${SW3}/>
        <circle cx="206" cy="327" r="3.5" fill="#9AA6B8"/><path d="M188 322 H196" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    },
    {
      id: 'm_clover', name: '幸運草項鍊', price: 0,
      render: () => `<path d="M150 284 Q200 322 250 284" fill="none" stroke="#A47A58" stroke-width="3"/>
        ${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 200 318)">${heart(200, 310, 6.5, '#8BD47A', SW3)}</g>`).join('')}
        <path d="M201 320 Q206 330 212 332" fill="none" stroke="#5FA85C" stroke-width="3" stroke-linecap="round"/><circle cx="200" cy="318" r="2.5" fill="#5FA85C"/>`,
    },
    {
      id: 'm_dogtag', name: '骨頭名牌項圈', price: 0,
      render: () => `${cord('M138 284 Q200 304 262 284', '#F0506A', 7)}
        ${[156, 178, 222, 244].map((x) => `<circle cx="${x}" cy="${x < 200 ? 290 + (x - 156) / 6 : 290 + (244 - x) / 6}" r="2.5" fill="#FFE07A"/>`).join('')}
        <path d="M200 296 V302" ${SW3}/>
        <g fill="#E3E8EF" ${SW3}><circle cx="187" cy="307" r="5"/><circle cx="187" cy="317" r="5"/><circle cx="213" cy="307" r="5"/><circle cx="213" cy="317" r="5"/></g>
        <rect x="185" y="305" width="30" height="14" fill="#E3E8EF"/><path d="M185 305 H215 M185 319 H215" ${SW3}/>
        ${heart(200, 311, 4, '#F0506A')}`,
    },
    {
      id: 'm_starchain', name: '小星星項鍊', price: 0,
      render: () => `<path d="M150 284 Q200 318 250 284" fill="none" stroke="#C9CED8" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 5.5"/>
        <path d="M150 284 Q200 318 250 284" fill="none" stroke="#C9CED8" stroke-width="1.2"/>
        ${star(200, 312, 11, '#FFE07A', SW3)}<circle cx="197" cy="309" r="2" fill="#fff"/>`,
    },
    {
      id: 'm_cherry', name: '櫻桃項鍊', price: 0,
      render: () => `<path d="M148 284 Q200 316 252 284" fill="none" stroke="#FFB3C7" stroke-width="4" stroke-linecap="round"/>
        <path d="M201 302 Q196 312 190 322 M201 302 Q206 312 211 324" fill="none" stroke="#5FA85C" stroke-width="3" stroke-linecap="round"/>
        <path d="M201 302 Q214 292 222 300 Q210 308 201 302 Z" fill="#8BD47A" ${SW3}/>
        <circle cx="189" cy="326" r="8" fill="#F0506A" ${SW3}/><circle cx="211" cy="328" r="8" fill="#F0506A" ${SW3}/>
        <circle cx="186" cy="323" r="2.2" fill="#fff"/><circle cx="208" cy="325" r="2.2" fill="#fff"/>`,
    },
    {
      id: 'm_candy', name: '糖果項鍊', price: 60,
      render: () => `<path d="M140 282 Q200 324 260 282" fill="none" stroke="#FFFFFF" stroke-width="2"/>` +
        pts(9, (i, t) => {
          if (i === 4) return '';
          const [x, y] = qpt(t, [140, 282], [200, 324], [260, 282]);
          const c = ['#FFB3C7', '#9EDCC8', '#FFE07A', '#B8A4F0'][i % 4];
          return i % 3 === 1 ? heart(x, y, 6, c, SW3) : i % 3 === 2 ? star(x, y, 7, c, SW3) : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${c}" ${SW3}/>`;
        }).join('') +
        `<circle cx="200" cy="314" r="12" fill="#FFF" ${SW3}/><path d="M200 314 m0 -1 a2 2 0 1 1 -2 2 a5 5 0 1 1 6 -5 a8 8 0 1 1 -11 9" fill="none" stroke="#FF8FA3" stroke-width="3" stroke-linecap="round"/>`,
    },
    {
      id: 'm_bib', name: '小鴨圍兜', price: 60,
      render: () => `<path d="M154 285 Q200 300 246 285 Q258 332 200 348 Q142 332 154 285 Z" fill="#FFF3DE" ${SW3}/>
        <path d="M160 292 Q200 305 240 292 Q248 328 200 340 Q152 328 160 292 Z" fill="none" stroke="#FFB3C7" stroke-width="2.5" stroke-dasharray="5 4"/>
        <ellipse cx="203" cy="326" rx="13" ry="9" fill="#FFE07A" ${SW3}/><circle cx="192" cy="314" r="8" fill="#FFE07A" ${SW3}/>
        <path d="M184 314 L177 317 L184 319 Z" fill="#FF9F43" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="191" cy="312" r="1.8" fill="${LINE}"/>`,
    },
    {
      id: 'm_moonpendant', name: '彎月項鍊', price: 80,
      render: () => `<path d="M148 284 Q200 316 252 284" fill="none" stroke="#E8B830" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 5"/>
        <path d="M148 284 Q200 316 252 284" fill="none" stroke="#E8B830" stroke-width="1"/>
        ${crescent(200, 318, 15, '#FFE07A', SW3)}
        ${star(210, 312, 5, '#FFF8D0', SW3)}<circle cx="200" cy="301" r="2.5" fill="#E8B830"/>`,
    },
    {
      id: 'm_lacecollar', name: '蕾絲圓領', price: 100,
      render: () => [1, -1].map((s) => `<path d="M200 290 Q${200 - 30 * s} 288 ${200 - 54 * s} 280 Q${200 - 66 * s} 300 ${200 - 52 * s} 313 Q${200 - 24 * s} 320 200 296 Z" fill="#FFFFFF" ${SW3}/>
        ${pts(5, (i, t) => { const [x, y] = qpt(t, [200 - 58 * s, 300], [200 - 46 * s, 320], [200 - 10 * s, 304]); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="#FFB3C7"/>`; }).join('')}`).join('') +
        `<path d="M200 300 L187 292 V308 Z M200 300 L213 292 V308 Z" fill="#FF8FA3" ${SW3}/><circle cx="200" cy="300" r="4" fill="#FF8FA3" ${SW3}/>`,
    },
    {
      id: 'm_heartlocket', name: '愛心鎖墜', price: 120,
      render: () => `<path d="M150 284 Q200 316 250 284" fill="none" stroke="#E8B830" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="0.1 5"/>
        <path d="M150 284 Q200 316 250 284" fill="none" stroke="#E8B830" stroke-width="1.2"/>
        <circle cx="200" cy="302" r="3.5" fill="none" stroke="#E8B830" stroke-width="2"/>
        ${heart(200, 320, 16, '#FFD54F', SW3)}${heart(200, 320, 10, '#FFB3C7')}
        <circle cx="200" cy="318" r="2.6" fill="${LINE}"/><path d="M200 319 L200 325" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M188 310 Q190 306 194 305" fill="none" stroke="#FFF8D0" stroke-width="2.5" stroke-linecap="round"/>`,
    },
    {
      id: 'm_ruff', name: '伊莉莎白領', price: 140,
      render: () => {
        const n = 12, o = [110, 282], oc = [200, 356], oe = [290, 282], i0 = [150, 280], ic = [200, 302], ie = [250, 280];
        const out = pts(n + 1, (i, t) => qpt(t, o, oc, oe)), inn = pts(n + 1, (i, t) => qpt(t, i0, ic, ie));
        const f = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
        let d = `M${f(out[0])}`;
        for (let i = 0; i < n; i++) {
          const mx = (out[i][0] + out[i + 1][0]) / 2, my = (out[i][1] + out[i + 1][1]) / 2;
          d += ` Q${f([mx + (mx - 200) * 0.12, my + (my - 250) * 0.16])} ${f(out[i + 1])}`;
        }
        d += ` L${f(inn[n])} ` + inn.slice().reverse().map((q) => `L${f(q)}`).join(' ') + ' Z';
        return `<path d="${d}" fill="#FFFFFF" ${SW3}/>
          <path d="${pts(n - 1, (i) => `M${f(inn[i + 1])} L${f(out[i + 1])}`).join(' ')}" stroke="#C9B6F2" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M${f(inn[0])} Q${f(ic)} ${f(inn[n])}" fill="none" stroke="#B8A4F0" stroke-width="4"/>
          <circle cx="200" cy="300" r="6" fill="#FFD54F" ${SW3}/><circle cx="200" cy="300" r="2.5" fill="#FF8FA3"/>`;
      },
    },
    {
      id: 'm_knitscarf', name: '彩虹條紋圍巾', price: 160,
      render: (p) => `<path d="M118 276 Q200 312 282 276 L284 298 Q200 334 116 298 Z" fill="url(#${p}-mknit)" ${SW}/>
        <path d="M138 298 L122 362 L146 366 L158 304 Z" fill="url(#${p}-mknit2)" ${SW}/>
        <path d="M124 366 L120 378 M131 367 L128 379 M138 368 L136 380 M145 368 L144 380" ${SW3}/>
        <path d="M160 304 Q170 296 158 290" fill="none" ${SW3}/>`,
      defs: (p) => `<pattern id="${p}-mknit" width="42" height="40" patternUnits="userSpaceOnUse">
          <rect width="14" height="40" fill="#FFB3C7"/><rect x="14" width="14" height="40" fill="#FFF3DE"/><rect x="28" width="14" height="40" fill="#9EDCC8"/></pattern>
        <pattern id="${p}-mknit2" width="40" height="42" patternUnits="userSpaceOnUse">
          <rect width="40" height="14" fill="#FFB3C7"/><rect y="14" width="40" height="14" fill="#FFF3DE"/><rect y="28" width="40" height="14" fill="#9EDCC8"/></pattern>`,
    },
    {
      id: 'm_fluffboa', name: '粉粉羽毛圍巾', price: 200,
      render: () => {
        const balls = [
          ...pts(14, (i, t) => [...qpt(t, [118, 278], [200, 320], [282, 278]), 13]),
          ...pts(4, (i) => [112 - i * 2, 294 + i * 15, 12 - i]), ...pts(4, (i) => [288 + i * 2, 294 + i * 15, 12 - i]),
        ];
        const c = (stroke) => balls.map(([x, y, r], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${i % 3 ? '#FFC2D4' : '#FFB3C7'}" ${stroke}/>`).join('');
        return c(`stroke="${LINE}" stroke-width="6"`) + c('') +
          balls.map(([x, y, r], i) => `<path d="M${(x - r * 0.5).toFixed(1)} ${(y + r * 0.2).toFixed(1)} q${(r * 0.3).toFixed(1)} ${(-r * 0.6).toFixed(1)} ${(r * 0.8).toFixed(1)} ${(-r * 0.5).toFixed(1)}" fill="none" stroke="${i % 2 ? '#FFFFFF' : '#F48FB1'}" stroke-width="2" stroke-linecap="round" opacity=".9"/>`).join('');
      },
    },
    {
      id: 'm_gemcollar', name: '寶石頸鍊', price: 200,
      render: () => {
        const gem = (x, y0, r, c) => `<path d="M${x} ${y0} V${y0 + 5}" stroke="#E8B830" stroke-width="2.5"/><circle cx="${x}" cy="${y0 + 5}" r="2.5" fill="#FFD54F" stroke="${LINE}" stroke-width="1.5"/>
          <path d="M${x} ${y0 + 7} Q${x + r} ${y0 + 7 + r * 1.2} ${x} ${y0 + 7 + r * 2.1} Q${x - r} ${y0 + 7 + r * 1.2} ${x} ${y0 + 7} Z" fill="${c}" ${SW3}/>
          <circle cx="${(x - r * 0.3).toFixed(1)}" cy="${(y0 + 7 + r * 0.9).toFixed(1)}" r="${(r * 0.25).toFixed(1)}" fill="#fff"/>`;
        return cord('M140 284 Q200 308 260 284', '#FFD54F', 7) +
          pts(9, (i, t) => { const [x, y] = qpt(0.06 + t * 0.88, [140, 284], [200, 308], [260, 284]); return `<circle cx="${x.toFixed(1)}" cy="${(y + 0.5).toFixed(1)}" r="2.2" fill="${i % 2 ? '#FFFFFF' : '#FF8FA3'}"/>`; }).join('') +
          gem(148, 290, 6, '#7FB3F0') + gem(252, 290, 6, '#7FB3F0') + gem(200, 298, 11, '#F0506A') +
          star(200, 323, 3.5, '#FFF8D0');
      },
    },
  );

  // ───────────────────────── 手持 ─────────────────────────
  HELD.push(
    {
      id: 'm_icepop', name: '雙色冰棒', price: 0,
      render: () => `<g transform="rotate(22 236 318)"><rect x="231" y="292" width="11" height="40" rx="5" fill="#E8BE8C" ${SW3}/>
        <path d="M218 262 Q218 242 236.5 242 Q255 242 255 262 V292 Q255 298 249 298 H224 Q218 298 218 292 Z" fill="#9EDCC8" ${SW3}/>
        <path d="M218 262 Q218 242 236.5 242 Q255 242 255 262 V270 Q249 278 243 270 Q237 280 231 270 Q224 278 218 270 Z" fill="#FFB3C7" ${SW3}/>
        <path d="M226 254 V264" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></g>`,
    },
    {
      id: 'm_fan', name: '金魚團扇', price: 100,
      render: () => `${cord('M234 320 L282 254', '#E8BE8C', 5)}
        <g transform="translate(16 -18)"><circle cx="284" cy="244" r="36" fill="#FFB3C7" ${SW}/><circle cx="284" cy="244" r="29" fill="#DDF3FF"/>
        <path d="M262 258 Q272 252 282 258 M288 266 Q296 260 304 266" fill="none" stroke="#9AD8FF" stroke-width="2.5" stroke-linecap="round"/>
        <g transform="translate(282 240)"><path d="M10 0 L24 -10 Q20 0 24 10 Z" fill="#FF9F43" ${SW3}/><ellipse cx="0" cy="0" rx="14" ry="9" fill="#FF7A45" ${SW3}/><circle cx="-7" cy="-2" r="2" fill="${LINE}"/></g>
        <circle cx="270" cy="226" r="3" fill="#fff" stroke="#9AD8FF" stroke-width="1.5"/><circle cx="264" cy="216" r="2" fill="#fff" stroke="#9AD8FF" stroke-width="1.5"/></g>`,
    },
    {
      id: 'm_teacup', name: '花花茶杯', price: 140,
      render: () => `<ellipse cx="200" cy="324" rx="38" ry="9" fill="#FFF" ${SW3}/><ellipse cx="200" cy="322" rx="26" ry="5" fill="#FFE4EC"/>
        <path d="M226 296 Q244 296 242 306 Q240 316 222 314" fill="none" ${SW}/>
        <path d="M172 292 H228 Q228 322 200 324 Q172 322 172 292 Z" fill="#FFFFFF" ${SW3}/>
        <ellipse cx="200" cy="292" rx="28" ry="6" fill="#D9A06A" ${SW3}/>
        <g>${flower(186, 308, 4, '#FFB3C7')}${flower(212, 310, 4, '#B8A4F0')}</g>
        <path d="M192 282 Q186 276 192 270 M208 284 Q214 278 208 272" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".9"/>`,
    },
  );

  // ───────────────────────── 特效 ─────────────────────────
  // 盡量放在畫面四周（鼠鼠大約佔 x 80–320、y 140–370），避免擋住臉。
  const EDGE = [[48, 60], [130, 34], [270, 30], [352, 66], [40, 170], [362, 160], [56, 268], [348, 262], [200, 22], [30, 350]];
  EFFECTS.push(
    {
      id: 'm_rain', name: '小雨滴', price: 0,
      render: () => EDGE.map(([x, y], i) => fx('fall', i, x, y,
        `<path d="M${x} ${y - 10} Q${x + 8} ${y + 2} ${x} ${y + 7} Q${x - 8} ${y + 2} ${x} ${y - 10} Z" fill="#9AD8FF" stroke="#5CB6EA" stroke-width="1.5"/><circle cx="${x - 2}" cy="${y + 1}" r="1.6" fill="#fff"/>`, 0.37)).join(''),
    },
    {
      id: 'm_seeds', name: '瓜子雨', price: 0,
      render: () => EDGE.slice(0, 9).map(([x, y], i) => fx('fall', i, x, y,
        `<g transform="rotate(${i * 47 - 60} ${x} ${y})"><path d="M${x} ${y - 11} Q${x + 9} ${y} ${x + 4} ${y + 9} Q${x} ${y + 12} ${x - 4} ${y + 9} Q${x - 9} ${y} ${x} ${y - 11} Z" fill="#4A4040" stroke="${LINE}" stroke-width="2"/>
        <path d="M${x} ${y - 8} V${y + 9} M${x - 4} ${y - 2} V${y + 7} M${x + 4} ${y - 2} V${y + 7}" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>`, 0.45)).join(''),
    },
    {
      id: 'm_clouds', name: '雲朵飄飄', price: 0,
      render: () => [[62, 70, 1], [336, 52, 1.2], [44, 214, 0.8], [356, 230, 0.9]].map(([x, y, s], i) => fx('float', i,
        x, y, `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 10 Q-40 -4 -24 -8 Q-22 -24 -4 -20 Q6 -32 20 -18 Q36 -18 32 0 Q40 12 26 14 H-24 Q-32 14 -30 10 Z" fill="#FFFFFF" ${SW3}/>
        <ellipse cx="-12" cy="4" rx="5" ry="3" fill="#FFC0D0" opacity=".7"/><ellipse cx="14" cy="4" rx="5" ry="3" fill="#FFC0D0" opacity=".7"/><circle cx="-8" cy="-2" r="2" fill="${LINE}"/><circle cx="10" cy="-2" r="2" fill="${LINE}"/></g>`, 0.7)).join(''),
    },
    {
      id: 'm_paws', name: '肉球腳印', price: 0,
      render: () => [[52, 80, -20], [346, 70, 25], [40, 196, -10], [360, 190, 15], [58, 300, -30], [342, 312, 20]].map(([x, y, r], i) => fx('float', i, x, y,
        `<g transform="rotate(${r} ${x} ${y})" fill="${i % 2 ? '#FFB3C7' : '#FFC9A8'}" stroke="${LINE}" stroke-width="2.5"><ellipse cx="${x}" cy="${y + 5}" rx="10" ry="8"/>
        <circle cx="${x - 10}" cy="${y - 6}" r="4"/><circle cx="${x - 3}" cy="${y - 11}" r="4"/><circle cx="${x + 4}" cy="${y - 11}" r="4"/><circle cx="${x + 11}" cy="${y - 6}" r="4"/></g>`, 0.45)).join(''),
    },
    {
      id: 'm_clovers', name: '幸運草', price: 60,
      render: () => EDGE.slice(0, 8).map(([x, y], i) => fx('fall', i, x, y,
        `<g transform="rotate(${i * 40} ${x} ${y})">${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a} ${x} ${y})">${heart(x, y - 6, 5.5, i % 2 ? '#8BD47A' : '#A8DE8C', 'stroke="#4E9A4C" stroke-width="1.5"')}</g>`).join('')}
        <path d="M${x} ${y} Q${x + 3} ${y + 8} ${x + 8} ${y + 11}" fill="none" stroke="#4E9A4C" stroke-width="2" stroke-linecap="round"/></g>`, 0.5)).join(''),
    },
    {
      id: 'm_fireflies', name: '螢火蟲', price: 80,
      render: () => [[50, 90], [110, 50], [300, 44], [350, 110], [36, 200], [364, 210], [70, 300], [334, 300], [200, 30], [24, 130]].map(([x, y], i) => fx('twinkle', i, x, y,
        `<circle cx="${x}" cy="${y}" r="14" fill="#FFE07A" opacity=".3"/><circle cx="${x}" cy="${y}" r="9" fill="#FFF59D" opacity=".55"/><circle cx="${x}" cy="${y}" r="5.5" fill="#FFF8C4" stroke="#E8A400" stroke-width="1.8"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.8" fill="#fff"/>`, 0.23)).join(''),
    },
    {
      id: 'm_dandelion', name: '蒲公英', price: 80,
      render: () => `<g><path d="M44 396 Q50 360 46 330" fill="none" stroke="#8BB47A" stroke-width="4" stroke-linecap="round"/>
        <circle cx="46" cy="318" r="15" fill="#FFFFFF" fill-opacity=".6" stroke="#DDD6CE" stroke-width="1.5"/>
        ${pts(12, (i) => { const a = (i * Math.PI) / 6; return `<path d="M46 318 L${(46 + 15 * Math.cos(a)).toFixed(1)} ${(318 + 15 * Math.sin(a)).toFixed(1)}" stroke="#E6DED6" stroke-width="1.2"/>`; }).join('')}<circle cx="46" cy="318" r="3" fill="#C9B79A"/></g>` +
        [[90, 250], [60, 160], [120, 70], [300, 50], [350, 140], [340, 250], [200, 26]].map(([x, y], i) => fx('float', i, x, y,
          `<g transform="rotate(${i * 25 - 40} ${x} ${y})"><path d="M${x} ${y} Q${x + 2} ${y + 10} ${x} ${y + 20}" fill="none" stroke="#A8957A" stroke-width="2" stroke-linecap="round"/><ellipse cx="${x}" cy="${y + 21}" rx="2" ry="3" fill="#A8957A"/>
          ${pts(7, (k) => { const a = Math.PI + (k * Math.PI) / 6; return `<path d="M${x} ${y} L${(x + 13 * Math.cos(a)).toFixed(1)} ${(y + 13 * Math.sin(a)).toFixed(1)}" stroke="#A89C90" stroke-width="1.6" stroke-linecap="round"/><circle cx="${(x + 13 * Math.cos(a)).toFixed(1)}" cy="${(y + 13 * Math.sin(a)).toFixed(1)}" r="2.2" fill="#fff" stroke="#C9BFB4" stroke-width="1"/>`; }).join('')}</g>`, 0.5)).join(''),
    },
    {
      id: 'm_sunny', name: '太陽公公', price: 60,
      render: () => `<g class="float"><g transform="translate(58 62)">
          ${pts(10, (k) => `<path d="M0 -40 L6 -30 H-6 Z" transform="rotate(${k * 36})" fill="#FFB74D" ${SW3}/>`).join('')}
          <circle r="27" fill="#FFE07A" ${SW}/><circle cx="-9" cy="-3" r="3" fill="${LINE}"/><circle cx="9" cy="-3" r="3" fill="${LINE}"/>
          <path d="M-6 6 Q0 12 6 6" fill="none" ${SW3}/><ellipse cx="-16" cy="6" rx="5" ry="3" fill="#FF8FA3" opacity=".7"/><ellipse cx="16" cy="6" rx="5" ry="3" fill="#FF8FA3" opacity=".7"/></g></g>` +
        [[120, 40], [350, 60], [40, 150], [360, 170]].map(([x, y], i) => fx('twinkle', i, x, y, star(x, y, 6, '#FFF1A8', 'stroke="#F7B932" stroke-width="1.5"', 0.35), 0.4)).join(''),
    },
    {
      id: 'm_moonstars', name: '月亮晚安', price: 100,
      render: () => [[60, 74, 18], [344, 96, 14], [52, 250, 12]].map(([x, y, r], i) => fx('float', i, x, y,
        `${crescent(x, y, r, '#FFE07A', SW3)}
        <circle cx="${x - r * 0.45}" cy="${y + r * 0.15}" r="${r * 0.12}" fill="#FF8FA3" opacity=".7"/>`, 0.7)).join('') +
        [[130, 40], [290, 34], [356, 200], [30, 160], [350, 300], [210, 18]].map(([x, y], i) => fx('twinkle', i, x, y, star(x, y, 6 + (i % 2) * 3, '#FFF8D0', SW3), 0.3)).join(''),
    },
    {
      id: 'm_snowflakes', name: '雪花結晶', price: 120,
      render: () => EDGE.slice(0, 9).map(([x, y], i) => {
        const r = 8 + (i % 3) * 3;
        const arm = pts(6, (k) => { const a = (k * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a), m = r * 0.55;
          return `M${x} ${y} L${(x + r * c).toFixed(1)} ${(y + r * s).toFixed(1)} M${(x + m * c).toFixed(1)} ${(y + m * s).toFixed(1)} l${(r * 0.32 * Math.cos(a + 0.8)).toFixed(1)} ${(r * 0.32 * Math.sin(a + 0.8)).toFixed(1)} M${(x + m * c).toFixed(1)} ${(y + m * s).toFixed(1)} l${(r * 0.32 * Math.cos(a - 0.8)).toFixed(1)} ${(r * 0.32 * Math.sin(a - 0.8)).toFixed(1)}`; }).join(' ');
        return fx('fall', i, x, y, `<path d="${arm}" fill="none" stroke="#8CC8E8" stroke-width="4.5" stroke-linecap="round"/><path d="${arm}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`, 0.45);
      }).join(''),
    },
    {
      id: 'm_minirainbow', name: '小彩虹雲', price: 120,
      render: () => [[66, 92, 1], [334, 80, -1]].map(([x, y, s], i) => fx('float', i, x, y,
        `<g transform="translate(${x} ${y}) scale(${s} 1)">${['#FF8FA3', '#FFE07A', '#9EDCC8', '#B8A4F0'].map((c, k) => `<path d="M${-34 + k * 6} 0 A${34 - k * 6} ${34 - k * 6} 0 0 1 ${34 - k * 6} 0" fill="none" stroke="${c}" stroke-width="6"/>`).join('')}
        <path d="M-37 0 A37 37 0 0 1 37 0 M-13 0 A13 13 0 0 1 13 0" fill="none" stroke="${LINE}" stroke-width="2"/>
        ${[-31, 31].map((cx) => `<path d="M${cx - 16} 8 Q${cx - 20} -4 ${cx - 8} -4 Q${cx - 4} -14 ${cx + 6} -6 Q${cx + 18} -6 ${cx + 15} 8 Z" fill="#FFFFFF" ${SW3}/>`).join('')}</g>`, 0.9)).join('') +
        [[40, 160], [360, 150], [200, 24]].map(([x, y], i) => fx('twinkle', i, x, y, star(x, y, 7, '#FFF1A8', SW3), 0.4)).join(''),
    },
    {
      id: 'm_strawberries', name: '草莓雨', price: 100,
      render: () => EDGE.slice(0, 9).map(([x, y], i) => fx('fall', i, x, y,
        `<g transform="rotate(${i * 30 - 60} ${x} ${y})"><path d="M${x - 10} ${y - 5} Q${x} ${y - 10} ${x + 10} ${y - 5} Q${x + 11} ${y + 6} ${x} ${y + 13} Q${x - 11} ${y + 6} ${x - 10} ${y - 5} Z" fill="#FF5C6C" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M${x} ${y - 6} L${x - 8} ${y - 12} L${x - 3} ${y - 7} L${x} ${y - 14} L${x + 3} ${y - 7} L${x + 8} ${y - 12} Z" fill="#6CC46A" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>
        <g fill="#FFE07A"><circle cx="${x - 4}" cy="${y}" r="1.2"/><circle cx="${x + 4}" cy="${y}" r="1.2"/><circle cx="${x}" cy="${y + 6}" r="1.2"/></g></g>`, 0.42)).join(''),
    },
    {
      id: 'm_balloons', name: '飄飄氣球', price: 140,
      render: () => [[46, 110, '#FFB3C7'], [84, 70, '#9EDCC8'], [40, 190, '#FFE07A'], [354, 90, '#B8A4F0'], [326, 50, '#7FD0F0'], [360, 176, '#FF8FA3']].map(([x, y, c], i) => fx('float', i, x, y,
        `<path d="M${x} ${y + 24} Q${x + 8} ${y + 40} ${x - 2} ${y + 54} Q${x - 10} ${y + 66} ${x + 2} ${y + 78}" fill="none" stroke="#B59A86" stroke-width="1.8"/>
        <ellipse cx="${x}" cy="${y}" rx="18" ry="22" fill="${c}" ${SW3}/><path d="M${x - 4} ${y + 25} L${x} ${y + 20} L${x + 4} ${y + 25} Z" fill="${c}" ${SW3}/>
        <ellipse cx="${x - 7}" cy="${y - 8}" rx="3.5" ry="6" fill="#fff" opacity=".7" transform="rotate(20 ${x - 7} ${y - 8})"/>`, 0.5)).join(''),
    },
    {
      id: 'm_candyrain', name: '糖果雨', price: 140,
      render: () => EDGE.slice(0, 9).map(([x, y], i) => {
        const c = ['#FF8FA3', '#9EDCC8', '#FFE07A', '#B8A4F0'][i % 4];
        return fx('fall', i, x, y, `<g transform="rotate(${i * 35 - 30} ${x} ${y})">
          <path d="M${x - 10} ${y} L${x - 20} ${y - 8} L${x - 18} ${y} L${x - 20} ${y + 8} Z M${x + 10} ${y} L${x + 20} ${y - 8} L${x + 18} ${y} L${x + 20} ${y + 8} Z" fill="${c}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="${x}" cy="${y}" rx="12" ry="9" fill="${c}" stroke="${LINE}" stroke-width="2.5"/>
          <path d="M${x - 5} ${y - 8} L${x - 1} ${y + 8} M${x + 3} ${y - 8} L${x + 7} ${y + 6}" stroke="#fff" stroke-width="2.5" opacity=".85"/></g>`, 0.4);
      }).join(''),
    },
    {
      id: 'm_fishes', name: '小魚游游', price: 160,
      render: () => [[58, 96, 1, '#FF9F43'], [342, 76, -1, '#7FB3F0'], [44, 236, 1, '#FF8FA3'], [352, 240, -1, '#FFD54F']].map(([x, y, s, c], i) => fx('float', i, x, y,
        `<g transform="translate(${x} ${y}) scale(${s} 1)"><path d="M10 0 L26 -11 Q22 0 26 11 Z" fill="${c}" ${SW3}/><ellipse cx="0" cy="0" rx="16" ry="11" fill="${c}" ${SW3}/>
        <path d="M2 -9 Q6 0 2 9" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/><circle cx="-8" cy="-2" r="2.4" fill="${LINE}"/><circle cx="-8.8" cy="-2.8" r=".8" fill="#fff"/>
        <circle cx="-22" cy="-14" r="4" fill="#CFEFFF" fill-opacity=".6" stroke="#8CC8E8" stroke-width="1.5"/><circle cx="-28" cy="-26" r="2.6" fill="#CFEFFF" fill-opacity=".6" stroke="#8CC8E8" stroke-width="1.5"/></g>`, 0.55)).join(''),
    },
    {
      id: 'm_gems', name: '寶石閃閃', price: 200,
      render: () => [[56, 80, '#7FD0F0'], [344, 64, '#FF8FA3'], [40, 200, '#B8A4F0'], [362, 190, '#8BD47A'], [66, 316, '#FFD54F'], [338, 314, '#7FD0F0'], [200, 24, '#FF8FA3']].map(([x, y, c], i) => fx('twinkle', i, x, y,
        `<g transform="translate(${x} ${y})"><path d="M-14 -5 L-8 -12 H8 L14 -5 L0 14 Z" fill="${c}" ${SW3}/>
        <path d="M-14 -5 H14 M-8 -12 L-4 -5 L0 14 L4 -5 L8 -12 M-4 -5 L0 -12 L4 -5" fill="none" stroke="#fff" stroke-width="1.5" opacity=".75"/>
        <path d="M18 -14 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 Z" fill="#FFF8D0"/></g>`, 0.3)).join(''),
    },
    {
      id: 'm_fireworks', name: '夜空煙火', price: 220,
      render: () => [[70, 76, '#FF8FA3', 30], [330, 64, '#FFD54F', 34], [356, 200, '#9EDCC8', 24], [44, 210, '#B8A4F0', 24]].map(([x, y, c, r], i) => fx('twinkle', i, x, y,
        pts(12, (k) => { const a = (k * Math.PI) / 6, c1 = Math.cos(a), s1 = Math.sin(a);
          return `<path d="M${(x + r * 0.3 * c1).toFixed(1)} ${(y + r * 0.3 * s1).toFixed(1)} L${(x + r * 0.85 * c1).toFixed(1)} ${(y + r * 0.85 * s1).toFixed(1)}" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/><circle cx="${(x + r * c1).toFixed(1)}" cy="${(y + r * s1).toFixed(1)}" r="${k % 2 ? 2 : 3}" fill="${k % 2 ? '#FFFFFF' : c}"/>`; }).join('') +
        star(x, y, r * 0.22, '#FFF8D0', `stroke="${c}" stroke-width="1.5"`), 0.5)).join(''),
    },
    {
      id: 'm_aurora', name: '夢幻極光', price: 240,
      render: (p) => `<defs><linearGradient id="${p}-maur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9EDCC8"/><stop offset=".5" stop-color="#B8A4F0"/><stop offset="1" stop-color="#FFB3C7"/></linearGradient></defs>` +
        [[0, 0.45], [26, 0.32], [52, 0.22]].map(([o, op], i) => `<g class="float" style="animation-delay:${i * 0.8}s"><path d="M-10 ${30 + o} C60 ${0 + o} 110 ${70 + o} 200 ${36 + o} S330 ${10 + o} 410 ${44 + o} L410 ${62 + o} C330 ${30 + o} 280 ${88 + o} 200 ${56 + o} S60 ${22 + o} -10 ${52 + o} Z" fill="url(#${p}-maur)" opacity="${op}"/></g>`).join('') +
        [[60, 40], [150, 70], [250, 24], [340, 60], [30, 120], [370, 120]].map(([x, y], i) => fx('twinkle', i, x, y, star(x, y, 5 + (i % 2) * 2, '#FFFFFF', 'stroke="#B8A4F0" stroke-width="1.2"', 0.4), 0.3)).join(''),
    },
    {
      id: 'm_magiccircle', name: '魔法陣', price: 280,
      render: () => `<g class="float" style="animation-duration:3.2s">
          <path d="M44 368 A156 30 0 0 0 356 368 Z" fill="#D9CCF7" opacity=".28"/>
          <path d="M30 366 A170 34 0 0 0 370 366" fill="none" stroke="#D9CCF7" stroke-width="3" stroke-dasharray="10 6" stroke-linecap="round"/>
          <path d="M44 368 A156 30 0 0 0 356 368" fill="none" stroke="#9474DA" stroke-width="7" stroke-linecap="round" opacity=".5"/>
          <path d="M44 368 A156 30 0 0 0 356 368" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M66 372 A134 22 0 0 0 334 372" fill="none" stroke="#FFD54F" stroke-width="2.5" stroke-dasharray="3 7" stroke-linecap="round"/>
          ${[[70, 380], [120, 392], [200, 397], [280, 392], [330, 380]].map(([x, y]) => star(x, y, 6.5, '#FFF1A8', 'stroke="#9474DA" stroke-width="1.5"')).join('')}</g>` +
        [[50, 330], [350, 330], [40, 250], [360, 246], [70, 180], [330, 176], [60, 110], [340, 104]].map(([x, y], i) => fx(i % 2 ? 'float' : 'twinkle', i, x, y,
          i < 4 ? `<path d="M${x} ${y + 14} V${y - 14}" stroke="#D9CCF7" stroke-width="3" stroke-linecap="round" opacity=".8"/>${star(x, y - 18, 6, '#FFF1A8', 'stroke="#9474DA" stroke-width="1.5"')}`
            : star(x, y, 8, i % 2 ? '#D9CCF7' : '#FFF1A8', 'stroke="#9474DA" stroke-width="1.5"'), 0.35)).join(''),
    },
  );
}
