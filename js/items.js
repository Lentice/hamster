// 可更換的部件。座標以標準倉鼠為準（頭頂 y=146、雙眼 y=225、脖子 y≈288、雙手 y=302），
// 繪製時會依物種平移。price > 0 的是商店販售的特別款。
// 衣服：clipped 會被裁成身體形狀；front 畫在身體上；back 畫在身體後面。

// ───────────────────────── 衣服 ─────────────────────────

const band = (fill, y = 286) => `<rect x="20" y="${y}" width="360" height="220" fill="${fill}"/>`;
const collar = (y = 288) => `<path d="M162 ${y} Q200 ${y + 14} 238 ${y}" fill="none" ${SW3}/>`;

const CLOTHES = [
  { id: 'none', name: '不穿' },
  {
    id: 'stripe', name: '條紋上衣',
    clipped: () => {
      let s = band('#FFFFFF');
      for (let y = 298; y < 500; y += 22) s += `<rect x="20" y="${y}" width="360" height="10" fill="#7FB3F0"/>`;
      return s;
    },
    front: () => collar(),
  },
  {
    id: 'heartT', name: '愛心T恤',
    clipped: () => band('#FFF6D6'),
    front: () => collar() + heart(200, 332, 18, '#FF7FA2', SW3) + `<circle cx="194" cy="324" r="3" fill="#fff"/>`,
  },
  {
    id: 'overalls', name: '吊帶褲',
    clipped: () => `${band('#FFF1A8', 290)}<rect x="20" y="318" width="360" height="200" fill="#6FA3E0"/>
      <rect x="164" y="290" width="16" height="32" fill="#6FA3E0"/><rect x="220" y="290" width="16" height="32" fill="#6FA3E0"/>
      <rect x="176" y="326" width="48" height="34" rx="8" fill="#5A8FCF" stroke="#4A7AB8" stroke-width="2" stroke-dasharray="4 3"/>`,
    front: () => `<circle cx="172" cy="322" r="5" fill="#FFD54F" ${SW3}/><circle cx="228" cy="322" r="5" fill="#FFD54F" ${SW3}/>${heart(200, 343, 8, '#FF8FA3')}`,
  },
  {
    id: 'sweater', name: '毛衣',
    clipped: () => {
      let s = band('#9EDCC8', 284);
      for (let y = 310; y < 500; y += 26) {
        let d = `M20 ${y}`;
        for (let x = 20; x < 380; x += 16) d += ` L${x + 8} ${y + 8} L${x + 16} ${y}`;
        s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>`;
      }
      return s + `<rect x="20" y="284" width="360" height="12" fill="#7CC8B0"/>`;
    },
    front: () => `<path d="M150 284 Q200 300 250 284" fill="none" stroke="#5FAE96" stroke-width="3"/>`,
  },
  {
    id: 'hoodie', name: '連帽衫',
    back: () => `<path d="M76 262 Q64 128 200 118 Q336 128 324 262 Z" fill="#FFB3C7" ${SW}/>`,
    clipped: () => band('#FFB3C7', 282),
    front: () => `<path d="M160 340 L240 340 L232 372 L168 372 Z" fill="#FF9AB4" ${SW3}/>
      <path d="M182 288 L178 322 M218 288 L222 322" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <circle cx="178" cy="324" r="4" fill="#fff"/><circle cx="222" cy="324" r="4" fill="#fff"/>`,
  },
  {
    id: 'raincoat', name: '小雨衣',
    clipped: () => `${band('#FFD84D', 282)}<rect x="196" y="282" width="8" height="220" fill="#F2C230"/>`,
    front: () => `<path d="M156 282 L200 300 L244 282" fill="#FFE57F" ${SW3}/>
      ${[322, 344].map((y) => `<circle cx="214" cy="${y}" r="5" fill="#fff" ${SW3}/>`).join('')}`,
  },
  {
    id: 'sailor', name: '水手服',
    clipped: () => band('#FFFFFF'),
    front: () => `<path d="M128 288 L200 336 L272 288 L250 282 L200 314 L150 282 Z" fill="#33508F" ${SW3}/>
      <path d="M146 292 L200 326 L254 292" fill="none" stroke="#fff" stroke-width="3"/>
      <path d="M200 330 l-18 -10 l-4 20 z M200 330 l18 -10 l4 20 z" fill="#F0506A" ${SW3}/>
      <path d="M196 334 l-10 26 l10 -4 l4 6 z M204 334 l10 26 l-10 -4 l-4 6 z" fill="#F0506A" ${SW3}/>`,
  },
  {
    id: 'sport', name: '運動服',
    clipped: () => `${band('#5C8FE6')}<rect x="108" y="286" width="12" height="220" fill="#fff"/><rect x="280" y="286" width="12" height="220" fill="#fff"/>`,
    front: () => `<path d="M174 286 L200 304 L226 286" fill="none" stroke="#fff" stroke-width="6"/>${collar()}
      <circle cx="200" cy="338" r="16" fill="#fff" ${SW3}/><text x="200" y="345" text-anchor="middle" font-size="18" font-weight="bold" fill="#5C8FE6" font-family="Arial">1</text>`,
  },
  {
    id: 'dress', name: '小洋裝', price: 60,
    clipped: (p) => `<rect x="20" y="288" width="360" height="220" fill="url(#${p}-dots)"/>`,
    front: (p) => `<path d="M112 330 Q200 344 288 330 L316 372 Q300 384 284 374 Q268 386 252 376 Q236 388 220 378 Q200 390 180 378 Q164 388 148 376 Q132 386 116 374 Q100 384 84 372 Z" fill="url(#${p}-dots)" ${SW}/>
      ${collar(290)}<path d="M200 296 l-16 -9 v18 z M200 296 l16 -9 v18 z" fill="#FF6F91" ${SW3}/><circle cx="200" cy="296" r="5" fill="#FF6F91" ${SW3}/>`,
    defs: (p) => `<pattern id="${p}-dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <rect width="22" height="22" fill="#FFB3C7"/><circle cx="6" cy="6" r="3.5" fill="#fff"/><circle cx="17" cy="17" r="3.5" fill="#fff"/></pattern>`,
  },
  {
    id: 'hawaii', name: '夏威夷衫', price: 80,
    clipped: (p) => `<rect x="20" y="286" width="360" height="220" fill="url(#${p}-hawaii)"/>`,
    front: () => `<path d="M166 286 L200 316 L234 286" fill="#FFF6D6" ${SW3}/><circle cx="200" cy="330" r="3.5" fill="#fff" ${SW3}/><circle cx="200" cy="350" r="3.5" fill="#fff" ${SW3}/>`,
    defs: (p) => `<pattern id="${p}-hawaii" width="44" height="44" patternUnits="userSpaceOnUse">
      <rect width="44" height="44" fill="#4FB8D8"/>${flower(12, 12, 6, '#FF7FA2', '#FFE07A')}${flower(34, 32, 5, '#FFF', '#FF9F43')}
      <ellipse cx="32" cy="10" rx="7" ry="3" fill="#6CC46A" transform="rotate(-30 32 10)"/></pattern>`,
  },
  {
    id: 'yukata', name: '浴衣', price: 120,
    clipped: (p) => `<rect x="20" y="284" width="360" height="220" fill="url(#${p}-sakura)"/>
      <rect x="20" y="330" width="360" height="28" fill="#F0506A"/><rect x="20" y="340" width="360" height="6" fill="#FFD54F"/>`,
    front: () => `<path d="M164 288 L204 320 M236 288 L200 316" fill="none" stroke="#fff" stroke-width="7"/>
      <path d="M164 288 L204 320 M236 288 L200 316" fill="none" ${SW3}/>${flower(268, 344, 6, '#FFC0D0')}`,
    defs: (p) => `<pattern id="${p}-sakura" width="34" height="34" patternUnits="userSpaceOnUse">
      <rect width="34" height="34" fill="#8FB8E8"/>${flower(9, 9, 4, '#fff', '#FFC0D0')}${flower(26, 26, 3, '#FFE0EA', '#fff')}</pattern>`,
  },
  {
    id: 'suit', name: '帥氣西裝', price: 140,
    clipped: () => `${band('#3D4A6B')}<path d="M168 286 L200 350 L232 286 Z" fill="#fff"/>`,
    front: () => `<path d="M168 286 L200 350 L186 300 Z M232 286 L200 350 L214 300 Z" fill="#2E3A57" ${SW3}/>
      <path d="M194 292 L206 292 L210 330 L200 342 L190 330 Z" fill="#F0506A" ${SW3}/>
      <circle cx="240" cy="334" r="3.5" fill="#FFD54F"/><circle cx="240" cy="352" r="3.5" fill="#FFD54F"/>
      <path d="M248 304 l14 -2 l-2 8 z" fill="#FFF1A8"/>`,
  },
  {
    id: 'maid', name: '女僕裝', price: 160,
    clipped: () => band('#3A3340'),
    front: () => `<path d="M156 300 Q200 312 244 300 L256 380 L144 380 Z" fill="#fff" ${SW3}/>
      <path d="M144 380 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0" fill="#fff" ${SW3}/>
      <path d="M158 288 Q200 306 242 288 L236 298 Q200 316 164 298 Z" fill="#fff" ${SW3}/>
      <path d="M200 300 l-14 -8 v16 z M200 300 l14 -8 v16 z" fill="#F0506A" ${SW3}/>${heart(200, 340, 8, '#FF8FA3')}`,
  },
  {
    id: 'hero', name: '超級英雄', price: 150,
    back: () => `<path d="M140 290 Q90 340 70 396 Q200 380 330 396 Q310 340 260 290 Z" fill="#F0506A" ${SW}/>`,
    clipped: () => `${band('#5C8FE6', 288)}<rect x="20" y="356" width="360" height="14" fill="#FFD54F"/>`,
    front: () => `<circle cx="200" cy="330" r="19" fill="#FFD54F" ${SW3}/>${star(200, 331, 13, '#F0506A')}${collar()}`,
  },
  {
    id: 'bee', name: '小蜜蜂', price: 150,
    back: () => `<ellipse cx="74" cy="168" rx="46" ry="26" transform="rotate(-40 74 168)" fill="#E6F6FF" ${SW3}/>
      <ellipse cx="326" cy="168" rx="46" ry="26" transform="rotate(40 326 168)" fill="#E6F6FF" ${SW3}/>
      <ellipse cx="58" cy="214" rx="30" ry="17" transform="rotate(-15 58 214)" fill="#E6F6FF" ${SW3}/>
      <ellipse cx="342" cy="214" rx="30" ry="17" transform="rotate(15 342 214)" fill="#E6F6FF" ${SW3}/>`,
    clipped: () => {
      let s = band('#FFD84D', 288);
      for (let y = 306; y < 500; y += 30) s += `<rect x="20" y="${y}" width="360" height="14" fill="#4A3B36"/>`;
      return s;
    },
    front: () => collar(),
  },
  {
    id: 'dino', name: '小恐龍', price: 180,
    back: () => {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (1.12 + i * 0.127), x = 200 + 126 * Math.cos(a), y = 258 + 120 * Math.sin(a);
        const ox = 22 * Math.cos(a), oy = 22 * Math.sin(a);
        s += `<path d="M${x - oy * 0.6} ${y + ox * 0.6} L${x + ox} ${y + oy} L${x + oy * 0.6} ${y - ox * 0.6} Z" fill="#FFB74D" ${SW3}/>`;
      }
      return s + `<path d="M300 330 Q360 330 372 300 Q370 350 300 362 Z" fill="#8BD47A" ${SW}/>`;
    },
    clipped: () => `${band('#8BD47A', 280)}<ellipse cx="200" cy="350" rx="60" ry="50" fill="#D8F2C8"/>`,
    front: () => `<path d="M168 330 L232 330 M172 348 L228 348 M180 366 L220 366" stroke="#B6E0A0" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    id: 'panda', name: '熊貓裝', price: 160,
    back: () => `<path d="M76 262 Q64 128 200 118 Q336 128 324 262 Z" fill="#FFFFFF" ${SW}/>
      <circle cx="118" cy="132" r="26" fill="#3A3340" ${SW}/><circle cx="282" cy="132" r="26" fill="#3A3340" ${SW}/>`,
    clipped: () => `${band('#FFFFFF', 282)}<ellipse cx="96" cy="320" rx="50" ry="40" fill="#3A3340"/><ellipse cx="304" cy="320" rx="50" ry="40" fill="#3A3340"/>`,
    front: () => heart(200, 340, 10, '#3A3340'),
  },
  {
    id: 'pumpkin', name: '南瓜裝', price: 140,
    clipped: () => `${band('#FF9F43', 284)}${[120, 160, 240, 280].map((x) => `<path d="M${x} 284 Q${x + (x < 200 ? -14 : 14)} 360 ${x} 440" fill="none" stroke="#E8832A" stroke-width="5"/>`).join('')}`,
    front: () => `<path d="M178 318 l10 -12 l10 12 z M202 318 l10 -12 l10 12 z" fill="#5A3E36"/>
      <path d="M176 336 Q200 356 224 336 L216 342 L208 336 L200 344 L192 336 L184 342 Z" fill="#5A3E36"/>
      <path d="M190 286 Q200 274 210 286" fill="#6CC46A" ${SW3}/>`,
  },
  {
    id: 'santa', name: '聖誕裝', price: 140,
    clipped: () => `${band('#F0506A', 286)}<rect x="20" y="346" width="360" height="16" fill="#3A3340"/><rect x="190" y="286" width="20" height="220" fill="#fff"/>`,
    front: () => `<rect x="186" y="344" width="28" height="20" rx="3" fill="#FFD54F" ${SW3}/><path d="M148 290 Q200 312 252 290" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>`,
  },
  {
    id: 'astronaut', name: '太空裝', price: 240,
    back: () => `<rect x="96" y="238" width="208" height="110" rx="26" fill="#C8CEDC" ${SW}/>`,
    clipped: () => `${band('#F4F6FB', 282)}<rect x="20" y="350" width="360" height="12" fill="#FF9F43"/>`,
    front: () => `<path d="M150 284 Q200 304 250 284" fill="none" stroke="#C8CEDC" stroke-width="10" stroke-linecap="round"/>
      <rect x="176" y="314" width="48" height="30" rx="6" fill="#7FB3F0" ${SW3}/>
      <circle cx="188" cy="329" r="4" fill="#F0506A"/><circle cx="200" cy="329" r="4" fill="#FFD54F"/><circle cx="212" cy="329" r="4" fill="#8BD47A"/>`,
  },
  {
    id: 'angel', name: '小天使', price: 220,
    back: () => {
      const wing = `<path d="M140 250 Q104 168 40 150 Q58 182 46 198 Q72 212 54 232 Q84 244 72 264 Q108 272 140 272 Z" fill="#FFFFFF" ${SW}/>
        <path d="M64 196 Q98 206 120 226 M70 234 Q100 240 124 252" fill="none" stroke="#E6DDE8" stroke-width="3" stroke-linecap="round"/>`;
      return `${wing}<g transform="translate(400 0) scale(-1 1)">${wing}</g>`;
    },
    clipped: () => band('#FFF8FC', 284),
    front: () => `<path d="M152 286 Q200 304 248 286" fill="none" stroke="#FFD54F" stroke-width="6" stroke-linecap="round"/>${heart(200, 330, 10, '#FFD54F')}`,
  },
  {
    id: 'princess', name: '公主禮服', price: 300,
    clipped: () => `${band('#FFB3D9', 286)}<path d="M160 286 L200 340 L240 286" fill="#FFD6EC"/>`,
    front: () => `<path d="M96 326 Q200 346 304 326 L340 380 Q200 400 60 380 Z" fill="#FFB3D9" ${SW}/>
      <path d="M80 352 Q200 372 320 352" fill="none" stroke="#FFD54F" stroke-width="5"/>
      ${[110, 150, 200, 250, 290].map((x) => `<circle cx="${x}" cy="${x === 200 ? 368 : 362}" r="5" fill="#FFF" ${SW3}/>`).join('')}
      <path d="M150 288 Q200 304 250 288" fill="none" stroke="#FFD54F" stroke-width="6" stroke-linecap="round"/>
      <circle cx="200" cy="300" r="8" fill="#7FD0F0" ${SW3}/>`,
  },
];

// ───────────────────────── 帽子 ─────────────────────────

const HATS = [
  { id: 'none', name: '不戴' },
  {
    id: 'bow', name: '蝴蝶結',
    render: () => `<path d="M240 158 Q210 128 212 164 Q214 192 240 168 Z" fill="#FF7FA2" ${SW}/>
      <path d="M248 158 Q282 136 278 170 Q274 196 248 168 Z" fill="#FF7FA2" ${SW}/>
      <circle cx="244" cy="163" r="9" fill="#FF5C8A" ${SW}/><circle cx="226" cy="158" r="3" fill="#fff"/><circle cx="264" cy="160" r="3" fill="#fff"/>`,
  },
  {
    id: 'strawberry', name: '草莓帽',
    render: () => {
      let s = `<path d="M108 172 Q110 76 200 70 Q290 76 292 172 Q200 152 108 172 Z" fill="#FF5C6C" ${SW}/>`;
      [[150, 120], [180, 98], [220, 98], [250, 122], [200, 130], [135, 150], [265, 150], [170, 145], [232, 146]]
        .forEach(([x, y]) => { s += `<ellipse cx="${x}" cy="${y}" rx="3" ry="4.5" fill="#FFE07A"/>`; });
      return s + `<path d="M200 76 L176 62 L190 74 L172 80 L196 80 L200 92 L204 80 L228 80 L210 74 L224 62 Z" fill="#6CC46A" ${SW3}/>
        <path d="M200 66 Q204 54 212 50" fill="none" stroke="#4E9A4C" stroke-width="5" stroke-linecap="round"/>`;
    },
  },
  {
    id: 'cap', name: '棒球帽',
    render: () => `<path d="M124 166 Q120 96 200 92 Q280 96 276 166 Z" fill="#7FB3F0" ${SW}/>
      <path d="M118 166 Q200 150 290 166 Q300 182 250 180 Q200 172 118 176 Z" fill="#5C8FE6" ${SW}/>
      <circle cx="200" cy="94" r="6" fill="#5C8FE6" ${SW3}/>${star(200, 130, 14, '#FFD54F', SW3)}`,
  },
  {
    id: 'beanie', name: '毛線帽',
    render: () => `<path d="M118 170 Q112 92 200 88 Q288 92 282 170 Z" fill="#FF9AB4" ${SW}/>
      <rect x="112" y="152" width="176" height="26" rx="12" fill="#FFC0D0" ${SW}/>
      ${[140, 170, 200, 230, 260].map((x) => `<path d="M${x} 154 L${x} 176" stroke="#FF9AB4" stroke-width="3"/>`).join('')}
      <circle cx="200" cy="84" r="16" fill="#FFF" ${SW}/>`,
  },
  {
    id: 'beret', name: '貝雷帽',
    render: () => `<path d="M112 162 Q96 116 160 100 Q240 84 286 124 Q300 140 280 156 Q200 140 112 162 Z" fill="#F0506A" ${SW}/>
      <path d="M200 96 Q202 84 210 80" fill="none" stroke="#5A3E36" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    id: 'chick', name: '小雞',
    render: () => `<ellipse cx="200" cy="124" rx="38" ry="32" fill="#FFE066" ${SW}/>
      <path d="M180 94 Q186 80 194 92 Q198 78 204 94" fill="none" stroke="#5A3E36" stroke-width="3" stroke-linecap="round"/>
      <circle cx="186" cy="118" r="4.5" fill="#2E211D"/><circle cx="214" cy="118" r="4.5" fill="#2E211D"/>
      <path d="M194 126 L206 126 L200 136 Z" fill="#FF9F43" ${SW3}/>
      <ellipse cx="178" cy="130" rx="6" ry="4" fill="#FF8FA3" opacity=".6"/><ellipse cx="222" cy="130" rx="6" ry="4" fill="#FF8FA3" opacity=".6"/>`,
  },
  {
    id: 'flowers', name: '花圈',
    render: () => {
      let s = `<path d="M110 172 Q200 120 290 172" fill="none" stroke="#7CC47A" stroke-width="6" stroke-linecap="round"/>`;
      const cols = ['#FF8FA3', '#FFD54F', '#B8A4F0', '#FFFFFF', '#FF8FA3', '#7FD0F0', '#FFD54F'];
      for (let i = 0; i < 7; i++) {
        const t = i / 6, x = 114 + t * 172, y = 168 - Math.sin(t * Math.PI) * 36;
        s += flower(x, y, 9, cols[i], i % 2 ? '#FF9F43' : '#FFE07A');
      }
      return s;
    },
  },
  {
    id: 'leaf', name: '小葉子',
    render: () => `<path d="M200 148 Q196 128 204 112" fill="none" stroke="#5FA85C" stroke-width="5" stroke-linecap="round"/>
      <path d="M204 114 Q232 82 262 96 Q246 128 204 114 Z" fill="#8BD47A" ${SW3}/><path d="M208 112 Q232 104 252 98" fill="none" stroke="#5FA85C" stroke-width="2.5"/>`,
  },
  {
    id: 'bunny', name: '兔耳朵',
    render: () => `<path d="M138 164 Q160 120 250 166" fill="none" stroke="#FF8FA3" stroke-width="8" stroke-linecap="round"/>
      ${[[166, -14], [236, 14]].map(([x, r]) => `<ellipse cx="${x}" cy="96" rx="20" ry="50" transform="rotate(${r} ${x} 96)" fill="#FFFFFF" ${SW}/>
      <ellipse cx="${x}" cy="100" rx="9" ry="34" transform="rotate(${r} ${x} 100)" fill="#FFC0D0"/>`).join('')}`,
  },
  {
    id: 'earmuffs', name: '耳罩', price: 60,
    render: () => `<path d="M112 200 Q110 110 200 106 Q290 110 288 200" fill="none" stroke="#F0506A" stroke-width="9" stroke-linecap="round"/>
      <circle cx="110" cy="200" r="28" fill="#FFF" ${SW}/><circle cx="290" cy="200" r="28" fill="#FFF" ${SW}/>`,
  },
  {
    id: 'chef', name: '廚師帽', price: 80,
    render: () => `<rect x="150" y="128" width="100" height="32" rx="6" fill="#FFFFFF" ${SW}/>
      <path d="M152 132 Q122 120 132 92 Q142 66 170 78 Q178 50 204 56 Q228 48 236 76 Q266 66 270 96 Q274 122 248 132 Z" fill="#FFFFFF" ${SW}/>
      <path d="M176 134 L176 154 M200 134 L200 154 M224 134 L224 154" stroke="#E6DDD8" stroke-width="3"/>`,
  },
  {
    id: 'santa', name: '聖誕帽', price: 100,
    render: () => `<path d="M128 156 Q140 82 210 76 Q262 78 290 128 L276 140 Q258 108 238 110 L272 156 Z" fill="#F0506A" ${SW}/>
      <rect x="118" y="146" width="164" height="26" rx="13" fill="#FFFFFF" ${SW}/><circle cx="286" cy="138" r="16" fill="#FFFFFF" ${SW}/>`,
  },
  {
    id: 'witch', name: '魔法帽', price: 120,
    render: () => `<ellipse cx="200" cy="158" rx="104" ry="20" fill="#7E5FC4" ${SW}/>
      <path d="M138 156 Q160 100 196 60 Q220 38 252 44 Q226 58 230 90 L262 156 Z" fill="#9474DA" ${SW}/>
      <path d="M144 140 Q200 130 258 140 L262 156 Q200 146 138 156 Z" fill="#FFD54F" ${SW3}/>${star(214, 108, 12, '#FFE07A', SW3)}`,
  },
  {
    id: 'frog', name: '青蛙帽', price: 120,
    render: () => `<path d="M100 178 Q100 104 200 100 Q300 104 300 178 Q300 160 200 156 Q100 160 100 178 Z" fill="#8BD47A" ${SW}/>
      ${[160, 240].map((x) => `<circle cx="${x}" cy="102" r="24" fill="#8BD47A" ${SW}/><circle cx="${x}" cy="102" r="14" fill="#fff"/>
        <circle cx="${x + 2}" cy="104" r="8" fill="#2E211D"/><circle cx="${x + 5}" cy="100" r="3" fill="#fff"/>`).join('')}
      <path d="M182 136 Q200 146 218 136" fill="none" ${SW3}/>`,
  },
  {
    id: 'devil', name: '小惡魔角', price: 120,
    render: () => `<path d="M118 168 Q120 120 200 116 Q280 120 282 168" fill="none" stroke="#3A3340" stroke-width="7" stroke-linecap="round"/>
      <path d="M140 140 Q126 100 150 84 Q150 110 166 128 Z" fill="#B23A5A" ${SW3}/><path d="M260 140 Q274 100 250 84 Q250 110 234 128 Z" fill="#B23A5A" ${SW3}/>`,
  },
  {
    id: 'halo', name: '天使光環', price: 150,
    render: () => `<ellipse cx="200" cy="104" rx="56" ry="14" fill="none" stroke="#FFD54F" stroke-width="10"/>
      <ellipse cx="200" cy="104" rx="56" ry="14" fill="none" stroke="#FFF3B0" stroke-width="3"/>`,
  },
  {
    id: 'crown', name: '皇冠', price: 200,
    render: () => `<path d="M150 150 L144 96 L172 122 L200 84 L228 122 L256 96 L250 150 Z" fill="#FFD54F" ${SW}/>
      <rect x="148" y="140" width="104" height="16" rx="5" fill="#F7B932" ${SW3}/>
      <circle cx="144" cy="94" r="6" fill="#FF7FA2" ${SW3}/><circle cx="200" cy="82" r="7" fill="#7FB3F0" ${SW3}/><circle cx="256" cy="94" r="6" fill="#FF7FA2" ${SW3}/>
      ${heart(200, 128, 8, '#F0506A')}`,
  },
  {
    id: 'pirate', name: '海盜帽', price: 180,
    render: () => `<path d="M96 160 Q120 80 200 78 Q280 80 304 160 Q200 140 96 160 Z" fill="#3A3340" ${SW}/>
      <path d="M100 158 Q200 138 300 158" fill="none" stroke="#FFD54F" stroke-width="5"/>
      <circle cx="200" cy="112" r="14" fill="#FFF"/><circle cx="195" cy="110" r="3" fill="#3A3340"/><circle cx="205" cy="110" r="3" fill="#3A3340"/>
      <path d="M186 130 L214 138 M214 130 L186 138" stroke="#FFF" stroke-width="4" stroke-linecap="round"/>`,
  },
  // 以下由 Codex 生成的點陣貼紙（底部對齊頭頂）
  { id: 'r_sunflower', name: '向日葵髮夾', price: 100, img: 'hat_sunflower', place: { w: 110, cx: 248, bottom: 190 } },
  { id: 'r_cupcake', name: '杯子蛋糕帽', price: 180, img: 'hat_cupcake', place: { w: 170, bottom: 176 } },
  { id: 'r_pumpkin', name: '南瓜帽', price: 140, img: 'hat_pumpkin', place: { w: 170, bottom: 176 } },
  { id: 'r_unicorn', name: '獨角獸', price: 220, img: 'hat_unicorn', place: { w: 190, bottom: 182 } },
  { id: 'r_cloud', name: '彩虹雲朵帽', price: 200, img: 'hat_cloud', place: { w: 200, bottom: 178 } },
];

// ───────────────────────── 眼鏡 ─────────────────────────

const GLASSES = [
  { id: 'none', name: '不戴' },
  {
    id: 'round', name: '圓框眼鏡',
    render: () => `<circle cx="165" cy="225" r="22" fill="#fff" fill-opacity=".25" stroke="#C4824A" stroke-width="5"/>
      <circle cx="235" cy="225" r="22" fill="#fff" fill-opacity=".25" stroke="#C4824A" stroke-width="5"/>
      <path d="M187 222 Q200 214 213 222" fill="none" stroke="#C4824A" stroke-width="5"/>`,
  },
  {
    id: 'sun', name: '墨鏡',
    render: () => `<path d="M140 212 L190 212 Q192 244 166 244 Q140 244 140 212 Z" fill="#2E2A3A" ${SW3}/>
      <path d="M210 212 L260 212 Q260 244 234 244 Q208 244 210 212 Z" fill="#2E2A3A" ${SW3}/><path d="M190 216 L210 216" ${SW}/>
      <path d="M150 218 L162 218 M220 218 L232 218" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`,
  },
  {
    id: 'goggles', name: '蛙鏡',
    render: () => `<path d="M100 222 L300 222" stroke="#5C8FE6" stroke-width="8"/>
      <ellipse cx="165" cy="225" rx="24" ry="20" fill="#BDEBFF" fill-opacity=".55" stroke="#5C8FE6" stroke-width="7"/>
      <ellipse cx="235" cy="225" rx="24" ry="20" fill="#BDEBFF" fill-opacity=".55" stroke="#5C8FE6" stroke-width="7"/>`,
  },
  {
    id: 'hearts', name: '愛心眼鏡', price: 60,
    render: () => heart(163, 228, 21, '#FF5C8A', `${SW3} fill-opacity=".85"`) + heart(237, 228, 21, '#FF5C8A', `${SW3} fill-opacity=".85"`) +
      `<path d="M186 220 L214 220" ${SW}/><circle cx="154" cy="218" r="4" fill="#fff"/><circle cx="228" cy="218" r="4" fill="#fff"/>`,
  },
  {
    id: 'starglass', name: '星星眼鏡', price: 60,
    render: () => star(163, 226, 26, '#FFD54F', `${SW3} fill-opacity=".9"`, 0.55) + star(237, 226, 26, '#FFD54F', `${SW3} fill-opacity=".9"`, 0.55) +
      `<path d="M186 222 L214 222" ${SW}/>`,
  },
  {
    id: 'cateye', name: '貓眼眼鏡', price: 80,
    render: () => `<path d="M138 214 Q166 206 190 216 Q190 242 164 242 Q140 240 138 214 L130 204 Z" fill="#FFB3C7" fill-opacity=".5" stroke="#FF5C8A" stroke-width="5" stroke-linejoin="round"/>
      <path d="M262 214 Q234 206 210 216 Q210 242 236 242 Q260 240 262 214 L270 204 Z" fill="#FFB3C7" fill-opacity=".5" stroke="#FF5C8A" stroke-width="5" stroke-linejoin="round"/>
      <path d="M190 220 L210 220" stroke="#FF5C8A" stroke-width="5"/>`,
  },
  {
    id: 'glasses3d', name: '3D眼鏡', price: 80,
    render: () => `<rect x="136" y="208" width="128" height="36" rx="8" fill="#fff" ${SW3}/>
      <rect x="144" y="214" width="46" height="24" rx="5" fill="#FF5C6C" fill-opacity=".8"/><rect x="210" y="214" width="46" height="24" rx="5" fill="#5CC8F0" fill-opacity=".8"/>`,
  },
  {
    id: 'mono', name: '單片眼鏡', price: 100,
    render: () => `<circle cx="235" cy="225" r="21" fill="#fff" fill-opacity=".2" stroke="#E8B830" stroke-width="5"/>
      <path d="M252 238 Q270 270 258 300" fill="none" stroke="#E8B830" stroke-width="2.5" stroke-dasharray="4 3"/>`,
  },
];

// ───────────────────────── 頸飾 ─────────────────────────

const NECK = [
  { id: 'none', name: '不戴' },
  {
    id: 'bell', name: '鈴鐺項圈',
    render: () => `<path d="M138 284 Q200 304 262 284" fill="none" stroke="#F0506A" stroke-width="11" stroke-linecap="round"/>
      <circle cx="200" cy="304" r="12" fill="#FFD54F" ${SW3}/><path d="M190 304 L210 304" ${SW3}/><circle cx="200" cy="310" r="2.5" fill="${LINE}"/>`,
  },
  {
    id: 'bowtie', name: '領結',
    render: () => `<path d="M200 294 L174 280 Q168 294 174 308 Z" fill="#5C8FE6" ${SW3}/><path d="M200 294 L226 280 Q232 294 226 308 Z" fill="#5C8FE6" ${SW3}/>
      <rect x="192" y="286" width="16" height="16" rx="5" fill="#4A7AD0" ${SW3}/>`,
  },
  {
    id: 'scarf', name: '圍巾',
    render: () => `<path d="M118 276 Q200 312 282 276 L284 296 Q200 330 116 296 Z" fill="#F0506A" ${SW}/>
      <path d="M140 288 L140 302 M170 296 L170 312 M230 296 L230 312 M260 288 L260 302" stroke="#fff" stroke-width="5" opacity=".8"/>
      <path d="M232 300 L256 352 L232 358 L216 308 Z" fill="#F0506A" ${SW}/>`,
  },
  {
    id: 'bandana', name: '領巾',
    render: (p) => `<path d="M128 280 Q200 300 272 280 L200 340 Z" fill="url(#${p}-band)" ${SW}/>`,
    defs: (p) => `<pattern id="${p}-band" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#6CC46A"/><circle cx="8" cy="8" r="2.5" fill="#fff"/></pattern>`,
  },
  {
    id: 'tie', name: '領帶', price: 40,
    render: () => `<path d="M192 288 L208 288 L204 298 L214 340 L200 356 L186 340 L196 298 Z" fill="#5C8FE6" ${SW3}/>
      <path d="M190 314 L210 306 M188 330 L212 322" stroke="#FFD54F" stroke-width="3"/>`,
  },
  {
    id: 'pearl', name: '珍珠項鍊', price: 80,
    render: () => {
      let s = '';
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, x = 144 + t * 112, y = 284 + Math.sin(t * Math.PI) * 20;
        s += `<circle cx="${x}" cy="${y}" r="6" fill="#FFF8F0" stroke="#D8C8C0" stroke-width="2"/><circle cx="${x - 2}" cy="${y - 2}" r="1.6" fill="#fff"/>`;
      }
      return s + heart(200, 312, 9, '#FF8FA3', SW3);
    },
  },
  {
    id: 'medal', name: '金牌', price: 150,
    render: () => `<path d="M172 280 L194 320 M228 280 L206 320" stroke="#F0506A" stroke-width="9" stroke-linecap="round"/>
      <circle cx="200" cy="330" r="18" fill="#FFD54F" ${SW3}/>${star(200, 331, 10, '#FFF3B0')}`,
  },
];

// ───────────────────────── 手持 ─────────────────────────

const HELD = [
  { id: 'none', name: '空手' },
  {
    id: 'seed', name: '葵花子',
    render: () => `<path d="M200 270 Q226 296 214 324 Q200 336 186 324 Q174 296 200 270 Z" fill="#4A4040" ${SW3}/>
      <path d="M200 276 L200 326 M190 290 Q186 306 192 322 M210 290 Q214 306 208 322" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'berry', name: '草莓',
    render: () => `<path d="M178 284 Q200 276 222 284 Q230 310 200 332 Q170 310 178 284 Z" fill="#FF5C6C" ${SW3}/>
      <path d="M200 282 L186 274 L194 284 L182 290 L200 288 L218 290 L206 284 L214 274 Z" fill="#6CC46A" ${SW3}/>
      ${[[190, 298], [210, 298], [200, 310], [190, 318], [210, 318]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3" fill="#FFE07A"/>`).join('')}`,
  },
  {
    id: 'carrot', name: '紅蘿蔔',
    render: () => `<g transform="rotate(30 200 300)"><path d="M168 286 Q204 268 238 288 Q222 304 168 286 Z" fill="#FF9F43" ${SW3}/>
      <path d="M182 280 Q170 262 176 252 M184 282 Q186 260 196 254 M180 284 Q160 274 156 262" fill="none" stroke="#6CC46A" stroke-width="5" stroke-linecap="round"/></g>`,
  },
  {
    id: 'cheese', name: '起司',
    render: () => `<path d="M172 318 L228 318 L228 292 L172 278 Z" fill="#FFD54F" ${SW3}/><path d="M172 278 L228 292 L240 280 L186 268 Z" fill="#FFE57F" ${SW3}/>
      <circle cx="188" cy="300" r="5" fill="#F2B830"/><circle cx="212" cy="306" r="4" fill="#F2B830"/>`,
  },
  { id: 'heartbox', name: '愛心', render: () => heart(200, 296, 30, '#FF5C8A', SW) + `<ellipse cx="186" cy="282" rx="6" ry="9" fill="#fff" opacity=".6" transform="rotate(-30 186 282)"/>` },
  {
    id: 'balloon', name: '氣球', price: 50,
    render: () => `<path d="M228 300 Q270 230 286 160" fill="none" stroke="#9A8A86" stroke-width="2"/>
      <ellipse cx="292" cy="118" rx="36" ry="42" fill="#FF8FA3" ${SW}/><path d="M286 160 L298 160 L292 152 Z" fill="#FF8FA3" ${SW3}/>
      <ellipse cx="278" cy="102" rx="8" ry="13" fill="#fff" opacity=".7" transform="rotate(20 278 102)"/>${heart(296, 124, 10, '#FF5C8A')}`,
  },
  {
    id: 'bouquet', name: '花束', price: 60,
    render: () => `${flower(184, 292, 10, '#FF8FA3')}${flower(216, 292, 10, '#B8A4F0')}${flower(200, 282, 11, '#FFFFFF', '#FF9F43')}
      <path d="M176 298 L224 298 L200 348 Z" fill="#FFF1A8" ${SW3}/><path d="M186 312 Q200 320 214 312" fill="none" stroke="#FF5C8A" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    id: 'cupcake', name: '杯子蛋糕', price: 60,
    render: () => `<path d="M176 290 L224 290 L216 324 L184 324 Z" fill="#7FD0F0" ${SW3}/>
      <path d="M170 292 Q166 270 186 268 Q190 250 210 254 Q232 258 228 274 Q236 286 230 292 Z" fill="#FFC0D8" ${SW3}/><circle cx="206" cy="250" r="7" fill="#F0506A" ${SW3}/>`,
  },
  {
    id: 'wand', name: '魔法棒', price: 100,
    render: () => `<path d="M222 310 L316 240" stroke="${LINE}" stroke-width="11" stroke-linecap="round"/><path d="M222 310 L316 240" stroke="#B8A4F0" stroke-width="5" stroke-linecap="round"/>
      ${star(322, 234, 24, '#FFD54F', SW3)}<circle cx="352" cy="206" r="4" fill="#FFD54F"/><circle cx="350" cy="262" r="3" fill="#FF8FA3"/>`,
  },
  { id: 'r_lollipop', name: '棒棒糖', price: 60, img: 'held_lollipop', place: { w: 72, cx: 252, bottom: 336 } },
  { id: 'r_sunflower', name: '向日葵', price: 60, img: 'held_sunflower', place: { w: 84, cx: 252, bottom: 336 } },
  { id: 'r_icecream', name: '冰淇淋', price: 80, img: 'held_icecream', place: { w: 62, cx: 246, bottom: 334 } },
  { id: 'r_teddy', name: '小熊玩偶', price: 120, img: 'held_teddy', place: { w: 96, cx: 200, bottom: 346 } },
  { id: 'r_umbrella', name: '小雨傘', price: 100, img: 'held_umbrella', place: { w: 170, cx: 296, bottom: 318 } },
];

// ───────────────────────── 特效 ─────────────────────────

const EFFECTS = [
  { id: 'none', name: '無' },
  {
    id: 'hearts', name: '愛心飄飄',
    render: () => [[64, 120, 14], [330, 92, 18], [92, 230, 10], [344, 210, 12], [300, 40, 9], [60, 40, 11]]
      .map(([x, y, s], i) => `<g class="float" style="animation-delay:${i * 0.4}s">${heart(x, y, s, i % 2 ? '#FF8FA3' : '#FF5C8A', 'stroke="#fff" stroke-width="2"')}</g>`).join(''),
  },
  {
    id: 'bubbles', name: '泡泡',
    render: () => [[60, 140, 16], [340, 110, 22], [90, 50, 10], [320, 260, 12], [50, 270, 9], [260, 40, 13]]
      .map(([x, y, r], i) => `<g class="float" style="animation-delay:${i * 0.5}s"><circle cx="${x}" cy="${y}" r="${r}" fill="#CFEFFF" fill-opacity=".5" stroke="#8CC8E8" stroke-width="2"/>
        <circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.22}" fill="#fff"/></g>`).join(''),
  },
  {
    id: 'sparkle', name: '閃閃發亮', price: 50,
    render: () => [[70, 100, 14], [334, 80, 18], [80, 250, 10], [340, 240, 13], [200, 30, 10], [120, 40, 8]]
      .map(([x, y, r], i) => `<g class="twinkle" style="animation-delay:${i * 0.3}s;transform-origin:${x}px ${y}px">${star(x, y, r, i % 2 ? '#FFE07A' : '#FFFFFF', 'stroke="#F7B932" stroke-width="1.5"', 0.32)}</g>`).join(''),
  },
  {
    id: 'notes', name: '音符', price: 50,
    render: () => [[70, 120, '#B8A4F0'], [330, 100, '#FF8FA3'], [340, 230, '#7FD0F0'], [64, 240, '#FFB74D']]
      .map(([x, y, c], i) => `<g class="float" style="animation-delay:${i * 0.5}s" fill="${c}" stroke="${c}">
        <ellipse cx="${x}" cy="${y + 22}" rx="9" ry="7" transform="rotate(-20 ${x} ${y + 22})"/>
        <path d="M${x + 8} ${y + 20} L${x + 8} ${y - 8} Q${x + 18} ${y - 4} ${x + 22} ${y + 6}" fill="none" stroke-width="4" stroke-linecap="round"/></g>`).join(''),
  },
  {
    id: 'petals', name: '花瓣雨', price: 80,
    render: () => [[60, 60], [140, 30], [260, 50], [340, 80], [80, 200], [330, 200], [40, 300], [360, 320]]
      .map(([x, y], i) => `<g class="fall" style="animation-delay:${i * 0.35}s"><ellipse cx="${x}" cy="${y}" rx="8" ry="5" transform="rotate(${i * 40} ${x} ${y})" fill="#FFC0D0" stroke="#FF8FA3" stroke-width="1.5"/></g>`).join(''),
  },
  {
    id: 'snow', name: '下雪了', price: 80,
    render: () => [[50, 40], [130, 70], [210, 20], [290, 60], [360, 30], [70, 160], [340, 170], [30, 260], [370, 280], [110, 320]]
      .map(([x, y], i) => `<g class="fall" style="animation-delay:${i * 0.4}s"><circle cx="${x}" cy="${y}" r="${4 + (i % 3) * 2}" fill="#FFFFFF" stroke="#CFE6F5" stroke-width="1.5"/></g>`).join(''),
  },
];

// ───────────────────────── 背景 ─────────────────────────

const photoBg = (img) => () => `<image href="${assetUrl(img)}" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"/>`;

const BACKGROUNDS = [
  {
    id: 'dots', name: '粉紅點點',
    render: (p) => `<defs><pattern id="${p}-bgdots" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="#FFE4EC"/><circle cx="10" cy="10" r="5" fill="#FFF"/><circle cx="30" cy="30" r="5" fill="#FFF"/></pattern></defs>
      <rect width="400" height="400" fill="url(#${p}-bgdots)"/>`,
  },
  {
    id: 'meadow', name: '草原',
    render: () => `<rect width="400" height="400" fill="#BFE6FF"/><circle cx="340" cy="64" r="30" fill="#FFE07A"/>
      <g fill="#fff"><ellipse cx="90" cy="70" rx="40" ry="16"/><ellipse cx="116" cy="60" rx="26" ry="18"/><ellipse cx="250" cy="110" rx="30" ry="12"/></g>
      <path d="M0 290 Q100 240 200 280 Q300 240 400 280 L400 400 L0 400 Z" fill="#A8DE8C"/>
      <path d="M0 330 Q120 300 240 330 Q330 350 400 320 L400 400 L0 400 Z" fill="#8BD47A"/>
      ${flower(50, 350, 6, '#FFF')}${flower(350, 360, 6, '#FF8FA3')}${flower(330, 300, 5, '#FFE07A', '#FF9F43')}${flower(70, 300, 5, '#B8A4F0')}`,
  },
  {
    id: 'beach', name: '海邊',
    render: () => `<rect width="400" height="400" fill="#BDEBFF"/><circle cx="70" cy="70" r="30" fill="#FFE07A"/>
      <rect y="220" width="400" height="80" fill="#6FC6F0"/>
      <path d="M0 230 Q25 222 50 230 T100 230 T150 230 T200 230 T250 230 T300 230 T350 230 T400 230" fill="none" stroke="#fff" stroke-width="4"/>
      <path d="M0 290 Q200 260 400 290 L400 400 L0 400 Z" fill="#FFE6B0"/>`,
  },
  {
    id: 'sakura', name: '櫻花',
    render: () => `<rect width="400" height="400" fill="#FFF0F5"/>
      <path d="M0 40 Q80 60 140 30 M0 70 Q40 80 70 60" fill="none" stroke="#9C7A6E" stroke-width="7" stroke-linecap="round"/>
      ${[[30, 40], [80, 52], [130, 32], [60, 70], [110, 58]].map(([x, y]) => flower(x, y, 10, '#FFC0D0', '#FF8FA3')).join('')}
      ${[[300, 60], [250, 160], [340, 250], [40, 200], [90, 320], [360, 360]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" transform="rotate(${i * 50} ${x} ${y})" fill="#FFC0D0"/>`).join('')}
      <rect y="360" width="400" height="40" fill="#FFD9E4"/>`,
  },
  {
    id: 'room', name: '我的房間',
    render: (p) => `<defs><pattern id="${p}-wall" width="40" height="400" patternUnits="userSpaceOnUse"><rect width="40" height="400" fill="#FFF6DC"/><rect width="16" height="400" fill="#FFEDC0"/></pattern></defs>
      <rect width="400" height="400" fill="url(#${p}-wall)"/>
      <rect x="250" y="40" width="110" height="100" rx="10" fill="#BDEBFF" stroke="#C98B5A" stroke-width="8"/>
      <path d="M305 40 L305 140 M250 90 L360 90" stroke="#C98B5A" stroke-width="6"/>
      <rect y="330" width="400" height="70" fill="#E8C49A"/><path d="M0 330 L400 330" stroke="#C98B5A" stroke-width="4"/>
      <ellipse cx="200" cy="372" rx="160" ry="22" fill="#FFB3C7" opacity=".7"/>`,
  },
  {
    id: 'night', name: '星空', price: 50,
    render: (p) => `<defs><linearGradient id="${p}-nightg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3F8C"/><stop offset="1" stop-color="#8E7CC8"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#${p}-nightg)"/><path d="M330 36 A36 36 0 1 0 352 100 A30 30 0 1 1 330 36 Z" fill="#FFF3B0"/>
      ${[[40, 40], [100, 90], [180, 30], [250, 120], [60, 180], [360, 180], [30, 300], [370, 300], [140, 150]].map(([x, y], i) => star(x, y, i % 3 ? 5 : 8, '#FFF8D0', '', 0.4)).join('')}
      <ellipse cx="200" cy="390" rx="260" ry="50" fill="#6A5BA8"/>`,
  },
  {
    id: 'rainbow', name: '彩虹雲朵', price: 80,
    render: () => `<rect width="400" height="400" fill="#DDF3FF"/>
      ${['#FF8FA3', '#FFB74D', '#FFE07A', '#8BD47A', '#7FD0F0', '#B8A4F0'].map((c, i) => `<path d="M${30 + i * 14} 300 A${170 - i * 14} ${170 - i * 14} 0 0 1 ${370 - i * 14} 300" fill="none" stroke="${c}" stroke-width="14"/>`).join('')}
      <g fill="#fff"><ellipse cx="50" cy="300" rx="50" ry="26"/><ellipse cx="80" cy="284" rx="34" ry="26"/><ellipse cx="350" cy="300" rx="50" ry="26"/><ellipse cx="320" cy="284" rx="34" ry="26"/></g>
      <rect y="330" width="400" height="70" fill="#FFFFFF"/>`,
  },
  { id: 'r_autumn', name: '楓葉公園', price: 150, render: photoBg('bg_autumn') },
  { id: 'r_candy', name: '糖果王國', price: 150, render: photoBg('bg_candy') },
  { id: 'r_underwater', name: '海底世界', price: 200, render: photoBg('bg_underwater') },
  { id: 'r_space', name: '外太空', price: 200, render: photoBg('bg_space') },
  { id: 'r_castle', name: '童話城堡', price: 250, render: photoBg('bg_castle') },
];

// ───────────────────────── 家具與房間 ─────────────────────────
// w：在房間座標（1500x1000）中的寬度；use：鼠鼠會怎麼使用它

const FURNITURE = [
  { id: 'wheel', name: '滾輪', img: 'f_wheel', w: 260, use: 'run' },
  { id: 'bowl', name: '食物碗', img: 'f_bowl', w: 170, use: 'eat' },
  { id: 'bottle', name: '水瓶', img: 'f_bottle', w: 130, use: 'drink' },
  { id: 'house', name: '木頭小屋', img: 'f_house', w: 280, use: 'sleep' },
  { id: 'bed', name: '軟軟小床', img: 'f_bed', w: 220, use: 'sleep' },
  { id: 'plant', name: '向日葵盆栽', img: 'f_plant', w: 150 },
  { id: 'tunnel', name: '樹洞隧道', img: 'f_tunnel', w: 260, use: 'hide', price: 40 },
  { id: 'sandbath', name: '沙浴盆', img: 'f_sandbath', w: 220, use: 'roll', price: 40 },
  { id: 'ladder', name: '樓梯梯子', img: 'f_ladder', w: 150, use: 'climb' },
  { id: 'rug', name: '圓地毯', img: 'f_rug', w: 380, flat: true, price: 30 },
  { id: 'lamp', name: '蘑菇燈', img: 'f_lamp', w: 140, price: 50 },
  { id: 'shelf', name: '玩具架', img: 'f_shelf', w: 220, price: 60 },
  { id: 'hammock', name: '吊床', img: 'f_hammock', w: 260, use: 'sleep', price: 80 },
  { id: 'slide', name: '溜滑梯', img: 'f_slide', w: 280, use: 'roll', price: 150 },
  { id: 'cakehouse', name: '蛋糕屋', img: 'f_cakehouse', w: 300, use: 'sleep', price: 250 },
  { id: 'hotair', name: '熱氣球床', img: 'f_hotair', w: 260, use: 'sleep', price: 280 },
  { id: 'castle', name: '鼠鼠城堡', img: 'f_castle', w: 380, use: 'sleep', price: 400 },
];

// 加蓋樓層的價格（第 2 層起）
const FLOOR_PRICES = [0, 200, 400, 700, 1000];

const ROOMS = [
  { id: 'wood', name: '木頭小屋', img: 'room_wood' },
  { id: 'pink', name: '粉紅臥室', img: 'room_pink', price: 100 },
  { id: 'garden', name: '陽光溫室', img: 'room_garden', price: 150 },
  { id: 'palace', name: '夢幻宮殿', img: 'room_palace', price: 300 },
];

const CATEGORIES = [
  { id: 'species', name: '鼠鼠', icon: '🐹', items: SPECIES, view: '50 100 300 290' },
  { id: 'expression', name: '表情', icon: '😊', items: EXPRESSIONS, view: '105 175 190 120', face: true },
  { id: 'hat', name: '帽子', icon: '🎀', items: HATS, view: '70 30 260 220', face: true },
  { id: 'clothes', name: '衣服', icon: '👕', items: CLOTHES, view: '30 140 340 260' },
  { id: 'glasses', name: '眼鏡', icon: '👓', items: GLASSES, view: '110 175 180 110', face: true },
  { id: 'neck', name: '頸飾', icon: '🔔', items: NECK, view: '100 240 200 140', face: true },
  { id: 'held', name: '手持', icon: '🍓', items: HELD, view: '80 60 260 320' },
  { id: 'effect', name: '特效', icon: '✨', items: EFFECTS, view: '0 0 400 400' },
  { id: 'background', name: '背景', icon: '🌈', items: BACKGROUNDS, view: '0 0 400 400' },
];

const itemKey = (cat, id) => `${cat}:${id}`;
