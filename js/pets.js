// 鼠鼠物種與表情。
// 每隻鼠鼠的腳底都在 y=370。身體大小 (rx, ry)、外形、耳朵、整體縮放各不相同，形成不同體態。
// 臉、帽子、衣服等上半身部件以「倉鼠標準頭頂 y=146」為基準繪製，再依各物種實際頭頂平移 dy。

const FEET_Y = 370;

// 讓斑紋可以寫成相對標準頭頂的座標
const up = (dy, svg) => `<g transform="translate(0 ${dy})">${svg}</g>`;

const SPECIES = [
  {
    id: 'golden', name: '黃金鼠', desc: '圓滾滾的經典款',
    rx: 118, ry: 112, scale: 1, shape: 'smooth', ears: 'round',
    fur: '#F4B860', belly: '#FFF3DE', ear: '#EFA94F', inner: '#FFB9B0',
  },
  {
    id: 'longhair', name: '長毛鼠', desc: '蓬蓬毛像棉花糖',
    rx: 124, ry: 114, scale: 1.02, shape: 'fluffy', ears: 'round',
    fur: '#F7C98A', belly: '#FFF6E8', ear: '#EDB36A', inner: '#FFBDB2',
    markings: ({ dy }) => up(dy, `<path d="M170 150 Q200 132 230 150 Q214 160 200 156 Q186 160 170 150Z" fill="#FFE2B5"/>`),
  },
  {
    id: 'pudding', name: '布丁鼠', desc: '矮矮胖胖，頭上有焦糖',
    rx: 126, ry: 102, scale: 0.9, shape: 'smooth', ears: 'small',
    fur: '#FBE3A4', belly: '#FFF9EC', ear: '#F2C56E', inner: '#FFC4B8',
    markings: ({ dy }) => up(dy, `<path d="M50 186 C85 196 98 214 114 206 C130 198 138 182 158 192 C174 200 184 212 200 200 C216 188 228 200 242 206 C260 214 270 190 290 194 C308 198 318 208 350 192 L350 90 L50 90 Z" fill="#E7A24E"/>
      <ellipse cx="170" cy="160" rx="22" ry="7" fill="#F5C57E" opacity=".8" transform="rotate(-15 170 160)"/>`),
  },
  {
    id: 'djungarian', name: '三線鼠', desc: '額頭三條線',
    rx: 110, ry: 108, scale: 0.86, shape: 'smooth', ears: 'small',
    fur: '#C3C6D0', belly: '#FFFFFF', ear: '#A9ADBA', inner: '#FFC4C4',
    markings: ({ dy }) => up(dy, `<path d="M190 132 Q200 128 210 132 L205 200 Q200 206 195 200 Z" fill="#6E7384"/>
      <path d="M168 142 Q172 170 178 192" stroke="#9EA2B0" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M232 142 Q228 170 222 192" stroke="#9EA2B0" stroke-width="6" fill="none" stroke-linecap="round"/>`),
  },
  {
    id: 'oneline', name: '一線鼠', desc: '背上一條帥氣的線',
    rx: 112, ry: 106, scale: 0.86, shape: 'smooth', ears: 'small',
    fur: '#B79C86', belly: '#FFF8F0', ear: '#9E8470', inner: '#FFC0B5',
    markings: ({ dy }) => up(dy, `<path d="M186 128 Q200 122 214 128 L208 206 Q200 214 192 206 Z" fill="#4E3E36"/>`),
  },
  {
    id: 'winter', name: '冬白鼠', desc: '雪白毛毛冬天限定',
    rx: 108, ry: 106, scale: 0.84, shape: 'fluffy', ears: 'small',
    fur: '#FCFCFF', belly: '#FFFFFF', ear: '#D8DAE6', inner: '#FFC8D4',
    markings: ({ dy }) => up(dy, `<path d="M194 132 Q200 129 206 132 L203 184 Q200 188 197 184 Z" fill="#C9CCDA"/>`),
  },
  {
    id: 'sapphire', name: '紫倉鼠', desc: '淡淡的薰衣草色',
    rx: 110, ry: 106, scale: 0.86, shape: 'smooth', ears: 'small',
    fur: '#D3CBEB', belly: '#FBFAFF', ear: '#B9AEDB', inner: '#FFC8D8',
    markings: ({ dy }) => up(dy, `<path d="M193 132 Q200 128 207 132 L203 186 Q200 190 197 186 Z" fill="#9C8FC6" opacity=".8"/>`),
  },
  {
    id: 'robo', name: '老公公鼠', desc: '迷你小不點，白眉毛',
    rx: 104, ry: 100, scale: 0.74, shape: 'smooth', ears: 'small',
    fur: '#E8C48F', belly: '#FFFFFF', ear: '#D9AE73', inner: '#FFC0B0',
    markings: ({ dy }) => up(dy, `<ellipse cx="160" cy="199" rx="19" ry="9" fill="#FFFFFF" transform="rotate(-12 160 199)"/>
      <ellipse cx="240" cy="199" rx="19" ry="9" fill="#FFFFFF" transform="rotate(12 240 199)"/>
      <path d="M176 266 Q200 278 224 266 Q214 282 200 280 Q186 282 176 266Z" fill="#FFFFFF"/>`),
  },
  {
    id: 'granny', name: '老婆婆鼠', desc: '迷你小不點，白髮捲捲',
    rx: 106, ry: 98, scale: 0.74, shape: 'smooth', ears: 'small',
    fur: '#E4C9A6', belly: '#FFFFFF', ear: '#CFAE86', inner: '#FFC0C8',
    markings: ({ dy }) => up(dy, `<ellipse cx="160" cy="200" rx="17" ry="8" fill="#FFFFFF" transform="rotate(-12 160 200)"/>
      <ellipse cx="240" cy="200" rx="17" ry="8" fill="#FFFFFF" transform="rotate(12 240 200)"/>`),
    extra: ({ dy }) => up(dy, `<g fill="#FFFFFF" ${SW3}><circle cx="184" cy="150" r="13"/><circle cx="216" cy="150" r="13"/><circle cx="200" cy="140" r="15"/></g>
      <path d="M190 140 q10 -8 20 0" fill="none" stroke="#D8D0CC" stroke-width="2.5" stroke-linecap="round"/>`),
  },
  {
    id: 'bear', name: '熊熊鼠', desc: '大隻又穩重',
    rx: 124, ry: 120, scale: 1.08, shape: 'smooth', ears: 'round',
    fur: '#6A5650', belly: '#EFE2D8', ear: '#5A4843', inner: '#E9A3A0',
    markings: ({ dy }) => up(dy, `<ellipse cx="200" cy="238" rx="78" ry="46" fill="#8E766D"/>`),
  },
  {
    id: 'tricolor', name: '三色天竺鼠', desc: '長長的身體，垂垂耳',
    rx: 142, ry: 100, scale: 1.08, shape: 'smooth', ears: 'droop', pig: true,
    fur: '#FFFDF7', belly: '#FFFDF7', ear: '#E9A35E', inner: '#FFC4B8',
    markings: ({ dy }) => up(dy, `<path d="M40 110 L186 110 C182 170 168 208 122 228 C92 240 62 252 40 262 Z" fill="#E9A35E"/>
      <path d="M360 130 L244 130 C232 182 258 230 300 244 L360 254 Z" fill="#4E4240"/>`),
  },
  {
    id: 'teddy', name: '泰迪天竺鼠', desc: '短短捲毛，頭頂一撮',
    rx: 138, ry: 102, scale: 1.06, shape: 'fluffy', ears: 'droop', pig: true,
    fur: '#C98B5A', belly: '#F3D7BA', ear: '#A96E43', inner: '#FFC4B8',
    markings: ({ dy }) => up(dy, `<ellipse cx="200" cy="246" rx="60" ry="36" fill="#E2B28A"/>`),
    extra: ({ dy }) => up(dy, `<path d="M176 160 L170 136 L188 148 L200 126 L212 148 L230 136 L224 160 Z" fill="#C98B5A" ${SW}/>`),
  },
  {
    id: 'abyssinian', name: '阿比天竺鼠', desc: '亂翹的漩渦毛',
    rx: 140, ry: 102, scale: 1.08, shape: 'spiky', ears: 'droop', pig: true,
    fur: '#E7E1DA', belly: '#FFFFFF', ear: '#8A7468', inner: '#FFC4B8',
    markings: ({ dy }) => up(dy, `<path d="M40 120 L170 120 C160 180 120 220 40 236 Z" fill="#8A7468"/>
      <path d="M360 120 L236 120 C240 180 290 216 360 226 Z" fill="#B59A86"/>
      <path d="M120 310 q12 -14 24 0 q-12 14 -24 0Z M260 310 q12 -14 24 0 q-12 14 -24 0Z" fill="#D2C7BE"/>`),
  },
];

// 物種的幾何資料（由 rx/ry 推算）
for (const sp of SPECIES) {
  sp.cy = FEET_Y - sp.ry;
  sp.top = sp.cy - sp.ry;
  sp.dy = sp.top - 146;
  sp.path = bodyPath(200, sp.cy, sp.rx, sp.ry, sp.shape);
}

function renderEars(sp) {
  const { rx, dy } = sp;
  if (sp.ears === 'droop') {
    const x = rx * 0.8;
    const y = 178 + dy;
    return `<g class="ear ear-l"><ellipse cx="${200 - x}" cy="${y}" rx="32" ry="19" transform="rotate(-28 ${200 - x} ${y})" fill="${sp.ear}" ${SW}/></g>
      <g class="ear ear-r"><ellipse cx="${200 + x}" cy="${y}" rx="32" ry="19" transform="rotate(28 ${200 + x} ${y})" fill="${sp.ear}" ${SW}/></g>`;
  }
  const r = sp.ears === 'small' ? 22 : 28;
  const x = rx * 0.58;
  const y = 160 + dy + (sp.ears === 'small' ? 4 : 0);
  return [[-1, 'l'], [1, 'r']].map(([s, k]) => `<g class="ear ear-${k}">
    <circle cx="${200 + s * x}" cy="${y}" r="${r}" fill="${sp.ear}" ${SW}/>
    <circle cx="${200 + s * x}" cy="${y + 2}" r="${r * 0.55}" fill="${sp.inner}"/></g>`).join('');
}

function renderBody(sp, clipId) {
  const belly = `<ellipse cx="200" cy="${sp.cy + sp.ry * 0.45}" rx="${sp.rx * 0.74}" ry="${sp.ry * 0.68}" fill="${sp.belly}"/>`;
  const muzzle = `<ellipse cx="200" cy="${252 + sp.dy}" rx="30" ry="18" fill="${sp.belly}" opacity=".9"/>`;
  return `${renderEars(sp)}
    <path d="${sp.path}" fill="${sp.fur}"/>
    <g clip-path="url(#${clipId})">${belly}${sp.markings ? sp.markings(sp) : ''}${muzzle}</g>
    <path d="${sp.path}" fill="none" ${SW}/>
    ${sp.extra ? sp.extra(sp) : ''}`;
}

function renderFeet(sp) {
  const fx = sp.rx * 0.44;
  return `<g class="foot foot-l"><ellipse cx="${200 - fx}" cy="364" rx="22" ry="12" fill="${sp.inner}" ${SW}/></g>
    <g class="foot foot-r"><ellipse cx="${200 + fx}" cy="364" rx="22" ry="12" fill="${sp.inner}" ${SW}/></g>`;
}

function renderPaws(sp) {
  return `<g class="paws"><ellipse cx="172" cy="302" rx="14" ry="11" fill="${sp.inner}" ${SW}/>
    <ellipse cx="228" cy="302" rx="14" ry="11" fill="${sp.inner}" ${SW}/></g>`;
}

// ───────────────────────── 表情 ─────────────────────────

const eye = (x, y = 225) => `<g class="blink"><ellipse cx="${x}" cy="${y}" rx="11" ry="13" fill="#2E211D"/>
  <circle cx="${x + 4}" cy="${y - 5}" r="4.5" fill="#fff"/><circle cx="${x - 4}" cy="${y + 5}" r="2" fill="#fff"/></g>`;
const bigEye = (x) => `<g class="blink"><ellipse cx="${x}" cy="224" rx="14" ry="16" fill="#2E211D"/>
  <circle cx="${x + 5}" cy="217" r="6" fill="#fff"/><circle cx="${x - 5}" cy="230" r="3" fill="#fff"/><circle cx="${x + 6}" cy="230" r="1.6" fill="#fff"/></g>`;
const happyEye = (x) => `<path d="M${x - 13} 229 Q${x} 213 ${x + 13} 229" fill="none" ${SW}/>`;
const sleepEye = (x) => `<path d="M${x - 13} 223 Q${x} 234 ${x + 13} 223" fill="none" ${SW}/>`;
const nose = `<ellipse class="nose" cx="200" cy="246" rx="6.5" ry="4.5" fill="#F0898A"/>`;
const omega = `<path d="M187 254 Q193.5 263 200 254 Q206.5 263 213 254" fill="none" ${SW3}/>`;
const openMouth = `<path d="M188 254 Q200 254 212 254 Q210 272 200 272 Q190 272 188 254 Z" fill="#E86A7A" ${SW3}/>
  <path d="M193 266 Q200 262 207 266 Q205 271 200 271 Q195 271 193 266Z" fill="#FFA6B4"/>`;
const blush = (o = 0.55) => `<ellipse cx="138" cy="257" rx="17" ry="10" fill="#FF8FA3" opacity="${o}"/>
  <ellipse cx="262" cy="257" rx="17" ry="10" fill="#FF8FA3" opacity="${o}"/>`;
const spiral = (x) => `<path d="M${x} 225 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 0 a8 8 0 1 1 15 0 a11 11 0 1 1 -21 0" fill="none" ${SW3}/>`;

const EXPRESSIONS = [
  { id: 'happy', name: '開心', render: () => eye(165) + eye(235) + nose + omega + blush() },
  { id: 'smile', name: '笑咪咪', render: () => happyEye(165) + happyEye(235) + nose + openMouth + blush() },
  {
    id: 'wink', name: '眨眼',
    render: () => eye(165) + `<path d="M222 218 L246 226 L222 233" fill="none" ${SW}/>` + nose + omega +
      `<path d="M201 260 Q201 272 208 272 Q214 272 213 260" fill="#F57E8E" ${SW3}/>` + blush() + star(268, 200, 9, '#FFD54F', SW3),
  },
  { id: 'sparkle', name: '水汪汪', render: () => bigEye(165) + bigEye(235) + nose + omega + blush(0.7) },
  {
    id: 'surprise', name: '驚訝',
    render: () => [165, 235].map((x) => `<circle cx="${x}" cy="224" r="15" fill="#fff" ${SW3}/>
      <circle cx="${x}" cy="225" r="8" fill="#2E211D"/><circle cx="${x + 3}" cy="222" r="3" fill="#fff"/>`).join('') +
      nose + `<ellipse cx="200" cy="264" rx="8" ry="10" fill="#E86A7A" ${SW3}/>` + blush(0.35) +
      `<path d="M150 196 L156 188 M165 192 L165 182 M180 196 L174 188" ${SW3}/>`,
  },
  {
    id: 'love', name: '愛心眼',
    render: () => heart(165, 226, 15, '#FF5C7C', SW3) + heart(235, 226, 15, '#FF5C7C', SW3) +
      `<circle cx="160" cy="220" r="3" fill="#fff"/><circle cx="230" cy="220" r="3" fill="#fff"/>` + nose + omega + blush(0.7),
  },
  {
    id: 'stars', name: '星星眼',
    render: () => star(165, 226, 17, '#FFD54F', SW3) + star(235, 226, 17, '#FFD54F', SW3) + nose +
      `<path d="M188 254 Q200 254 212 254 Q210 270 200 270 Q190 270 188 254 Z" fill="#E86A7A" ${SW3}/>` + blush(),
  },
  {
    id: 'tongue', name: '吐舌頭',
    render: () => happyEye(165) + `<path d="M222 218 L246 226 L222 233" fill="none" ${SW}/>` + nose + omega +
      `<path d="M194 259 Q194 276 202 276 Q210 276 208 259" fill="#FF7F95" ${SW3}/><path d="M201 262 L201 270" stroke="#E0607A" stroke-width="2"/>` + blush(),
  },
  {
    id: 'smug', name: '得意',
    render: () => `<path d="M152 226 Q165 220 178 226" fill="none" ${SW}/><path d="M222 226 Q235 220 248 226" fill="none" ${SW}/>
      <ellipse cx="165" cy="230" rx="8" ry="5" fill="#2E211D"/><ellipse cx="235" cy="230" rx="8" ry="5" fill="#2E211D"/>` +
      nose + `<path d="M190 258 Q204 264 214 254" fill="none" ${SW3}/>` + blush(0.4),
  },
  {
    id: 'shy', name: '害羞',
    render: () => `<path d="M154 216 L174 225 L154 234" fill="none" ${SW}/><path d="M246 216 L226 225 L246 234" fill="none" ${SW}/>` +
      nose + `<path d="M188 258 Q194 253 200 258 Q206 263 212 258" fill="none" ${SW3}/>` + blush(0.85) +
      `<path d="M128 252 L134 262 M138 252 L144 262 M148 252 L154 262 M248 252 L254 262 M258 252 L264 262 M268 252 L274 262" stroke="#E0607A" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  {
    id: 'sleepy', name: '睡覺',
    render: () => sleepEye(165) + sleepEye(235) + nose + `<ellipse cx="200" cy="260" rx="5" ry="4" fill="#E86A7A"/>` + blush(0.45) +
      `<circle cx="214" cy="262" r="7" fill="#CFEFFF" stroke="#8CC8E8" stroke-width="2" opacity=".9"/>
       <g class="zzz" fill="#7A8CC8" font-weight="bold" font-family="Arial"><text x="268" y="186" font-size="26">Z</text>
       <text x="290" y="166" font-size="19">z</text><text x="306" y="150" font-size="14">z</text></g>`,
  },
  {
    id: 'dizzy', name: '暈暈',
    render: () => spiral(165) + spiral(235) + nose + `<path d="M186 262 Q193 256 200 262 Q207 268 214 262" fill="none" ${SW3}/>` + blush(0.4) +
      star(150, 180, 8, '#FFD54F', SW3) + star(250, 176, 8, '#FFD54F', SW3),
  },
  {
    id: 'pout', name: '嘟嘴生氣',
    render: () => eye(165, 228) + eye(235, 228) + `<path d="M150 206 L178 214 M250 206 L222 214" ${SW}/>` + nose +
      `<path d="M192 266 Q200 258 208 266" fill="none" ${SW3}/>` + blush(0.9) +
      `<g transform="translate(270 180)" stroke="#F0506A" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M-12 -4 Q-4 -4 -4 -12"/><path d="M4 -12 Q4 -4 12 -4"/><path d="M12 4 Q4 4 4 12"/><path d="M-4 12 Q-4 4 -12 4"/></g>`,
  },
  {
    id: 'cry', name: '哭哭',
    render: () => eye(165) + eye(235) + `<path d="M150 208 L176 202 M250 208 L224 202" ${SW3}/>` +
      `<path d="M156 240 Q150 262 160 272 Q170 262 164 240 Z" fill="#9AD8FF" stroke="#5CB6EA" stroke-width="2"/>
       <path d="M236 240 Q230 262 240 272 Q250 262 244 240 Z" fill="#9AD8FF" stroke="#5CB6EA" stroke-width="2"/>` +
      nose + `<path d="M186 264 Q193 256 200 264 Q207 256 214 264" fill="none" ${SW3}/>` + blush(0.4),
  },
  {
    id: 'stuffed', name: '塞滿瓜子',
    render: (sp) => `<circle cx="128" cy="262" r="34" fill="${sp.fur}" ${SW}/><circle cx="272" cy="262" r="34" fill="${sp.fur}" ${SW}/>` +
      `<ellipse cx="128" cy="266" rx="18" ry="11" fill="#FF8FA3" opacity=".55"/><ellipse cx="272" cy="266" rx="18" ry="11" fill="#FF8FA3" opacity=".55"/>` +
      happyEye(165) + happyEye(235) + nose + `<path d="M193 256 Q200 262 207 256" fill="none" ${SW3}/>`,
  },
  {
    id: 'laugh', name: '哈哈大笑',
    render: () => happyEye(165) + happyEye(235) + nose +
      `<path d="M181 254 Q200 260 219 254 Q217 280 200 280 Q183 280 181 254 Z" fill="#E86A7A" ${SW3}/>
       <path d="M188 271 Q200 263 212 271 Q208 279 200 279 Q192 279 188 271 Z" fill="#FFB3C7"/>` + blush(0.7),
  },
  {
    id: 'puffangry', name: '氣鼓鼓',
    render: (sp) => `<ellipse cx="132" cy="259" rx="27" ry="23" fill="${sp.fur}" ${SW3}/>
      <ellipse cx="268" cy="259" rx="27" ry="23" fill="${sp.fur}" ${SW3}/>` +
      eye(165, 228) + eye(235, 228) + nose + blush(0.85) +
      `<path d="M150 204 L178 215 M250 204 L222 215 M190 266 Q200 257 210 266" fill="none" ${SW3}/>
       <path d="M118 257 Q125 264 130 257 M270 257 Q275 264 282 257" fill="none" ${SW3}/>`,
  },
  {
    id: 'yawn', name: '哈欠連連',
    render: () => sleepEye(165) + sleepEye(235) + nose + blush(0.4) +
      `<ellipse cx="200" cy="266" rx="13" ry="18" fill="#E86A7A" ${SW3}/>
       <path d="M191 276 Q200 269 209 276" fill="none" stroke="#FFB3C7" stroke-width="5" stroke-linecap="round"/>
       <path d="M145 209 Q154 202 164 204 M236 204 Q246 202 255 209" fill="none" ${SW3}/>`,
  },
  {
    id: 'excited', name: '超級期待',
    render: () => [165, 235].map((x) => `<g class="blink"><ellipse cx="${x}" cy="224" rx="15" ry="18" fill="#2E211D"/>
      ${star(x + 3, 219, 8, '#FFF3DE', '', 0.35)}<circle cx="${x - 6}" cy="232" r="3.5" fill="#FFD54F"/>
      <circle cx="${x + 7}" cy="232" r="2" fill="#fff"/></g>`).join('') + nose + openMouth + blush(0.75) +
      `<path d="M147 201 Q160 194 174 199 M226 199 Q240 194 253 201" fill="none" ${SW3}/>`,
  },
  {
    id: 'thinking', name: '想想看',
    render: () => eye(165) + `<path d="M222 226 Q235 216 248 226 M223 202 Q238 195 250 205" fill="none" ${SW3}/>` +
      nose + `<path d="M204 262 Q215 268 224 261" fill="none" ${SW3}/>` + blush(0.35) +
      `<circle cx="278" cy="202" r="3" fill="${LINE}"/><circle cx="290" cy="190" r="4" fill="${LINE}"/>`,
  },
  {
    id: 'nervous', name: '緊張兮兮',
    render: () => eye(165) + eye(235) + nose + blush(0.45) +
      `<path d="M151 207 Q164 199 178 209 M222 209 Q236 199 249 207 M185 265 L192 260 L200 265 L208 260 L216 265" fill="none" ${SW3}/>
       <path d="M273 204 Q261 222 273 229 Q285 222 273 204 Z" fill="#BFE6FF" ${SW3}/>`,
  },
];
