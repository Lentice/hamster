// 把一套搭配（look）組成 SVG。
// p 是 id 前綴，讓同一頁多個 SVG 的 clipPath / pattern 不互相衝突。

const DEFAULT_LOOK = {
  species: 'golden', expression: 'happy', hat: 'none', clothes: 'none', glasses: 'none',
  neck: 'none', held: 'none', effect: 'none', background: 'dots', name: '',
};

const byId = (list, id) => list.find((x) => x.id === id) || list[0];

function renderItem(item, p, sp) {
  if (item.img) return stickerImage(item.img, item.place);
  return item.render ? item.render(p, sp) : '';
}

// 只畫鼠鼠本身（不含背景、特效、名牌）
function renderPet(look, p) {
  const sp = byId(SPECIES, look.species);
  const clothes = byId(CLOTHES, look.clothes);
  const neck = byId(NECK, look.neck);
  const clipId = `${p}-body`;
  const shift = (svg) => (svg ? `<g transform="translate(0 ${sp.dy})">${svg}</g>` : '');
  const call = (fn) => (fn ? fn(p, sp) : '');

  return `<defs><clipPath id="${clipId}"><path d="${sp.path}"/></clipPath>${call(clothes.defs)}${call(neck.defs)}</defs>
    <g transform="translate(200 ${FEET_Y}) scale(${sp.scale}) translate(-200 -${FEET_Y})">
      <ellipse class="pet-shadow" cx="200" cy="${FEET_Y + 4}" rx="${sp.rx + 6}" ry="13" fill="#000" opacity=".1"/>
      <g class="pet-body">
        ${shift(call(clothes.back))}
        ${renderBody(sp, clipId)}
        ${clothes.clipped ? `<g clip-path="url(#${clipId})">${shift(clothes.clipped(p, sp))}</g><path d="${sp.path}" fill="none" ${SW}/>` : ''}
        ${shift(call(clothes.front))}
        ${renderFeet(sp)}
        ${shift(renderItem(neck, p, sp))}
        ${shift(renderItem(byId(HELD, look.held), p, sp))}
        ${shift(renderPaws(sp))}
        <g class="face">${shift(byId(EXPRESSIONS, look.expression).render(sp))}${shift(renderItem(byId(GLASSES, look.glasses), p, sp))}</g>
        <g class="hat">${shift(renderItem(byId(HATS, look.hat), p, sp))}</g>
      </g>
    </g>`;
}

function renderNameplate(name) {
  const n = [...name.trim()].slice(0, 12).join('');
  if (!n) return '';
  const w = Math.max(90, [...n].length * 22 + 40);
  return `<g transform="translate(200 382)">
    <path d="M${-w / 2 - 18} -14 L${-w / 2} 0 L${-w / 2 - 18} 14 L${-w / 2 + 6} 14 L${-w / 2 + 6} -14 Z M${w / 2 + 18} -14 L${w / 2} 0 L${w / 2 + 18} 14 L${w / 2 - 6} 14 L${w / 2 - 6} -14 Z" fill="#FF8FA3"/>
    <rect x="${-w / 2}" y="-16" width="${w}" height="32" rx="10" fill="#FFB3C7" stroke="#fff" stroke-width="3"/>
    <text y="7" text-anchor="middle" font-size="20" font-weight="bold" fill="#fff" stroke="#E0607A" stroke-width="4" paint-order="stroke"
      font-family="Huninn, 'Microsoft JhengHei', 'PingFang TC', sans-serif">${escapeXml(n)}</text></g>`;
}

function renderScene(look, p, { background = true, pet = true, effect = true, name = true } = {}) {
  let out = '';
  if (background) out += byId(BACKGROUNDS, look.background).render(p);
  if (pet) out += renderPet(look, p);
  if (effect) out += renderItem(byId(EFFECTS, look.effect), p);
  if (name && look.name) out += renderNameplate(look.name);
  return out;
}

// 獨立的鼠鼠 SVG（房間、外出、小遊戲用），裁掉上方多餘空白
let petUid = 0;
function petSvg(look, cls = '') {
  return svgWrap(renderPet(look, `pet${++petUid}`), '0 40 400 340', `pet-svg ${cls}`);
}

function randomLook() {
  const pick = (list) => list[Math.floor(Math.random() * list.length)].id;
  const free = (list) => list.filter((x) => !x.price);
  return {
    ...DEFAULT_LOOK,
    species: pick(SPECIES),
    expression: pick(EXPRESSIONS.filter((e) => !['sleepy', 'cry', 'dizzy', 'pout'].includes(e.id))),
    hat: Math.random() < 0.6 ? pick(free(HATS)) : 'none',
    clothes: Math.random() < 0.7 ? pick(free(CLOTHES)) : 'none',
    neck: Math.random() < 0.4 ? pick(free(NECK)) : 'none',
  };
}
