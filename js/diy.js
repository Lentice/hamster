// 自己畫：用像素畫筆彩繪自己的衣服、帽子、領巾、小旗子。
// 作品存在 save.diy，載入時轉成一般的換裝部件（id 以 diy_ 開頭，免費），
// 可以像其他衣服一樣穿戴、存圖。目前只存在自己的瀏覽器，連線時其他玩家看不到。

const DIY_PALETTE = [
  '', '#FFFFFF', '#2E211D', '#8A6A5C', '#FF8FA3', '#FFC4D2', '#F0506A', '#FFD45C', '#FFF1B8',
  '#F0A070', '#86D9B0', '#3FA36C', '#86C5F2', '#4A7FD6', '#C3A3F0', '#8E6FD0', '#C9A27A',
  // 後來加的顏色接在後面，舊作品的顏色代號不變
  '#D8D0CC', '#9A9290', '#A63A3A', '#FFB347', '#2FB5A8', '#1F3F8A', '#F7D6B5', '#6B4226',
];
const DIY_MAX = 8;
const DIY_CHARS = '0123456789abcdefghijklmno';

// box：作品在 400x400 鼠鼠座標中的範圍（帽子、旗子會依物種的 dy 平移）
const DIY_TEMPLATES = {
  clothes: {
    name: '衣服', icon: '👕', cols: 24, rows: 9, box: [56, 280, 288, 106], list: () => CLOTHES,
    // 身體以外的地方蓋上淡色，看得出哪裡會穿在身上
    guide: (sp, [x, y, w, h]) => `<mask id="diy-body"><rect x="${x - 20}" y="${y - 20}" width="${w + 40}" height="${h + 40}" fill="#fff"/><path d="${sp.path}" transform="translate(0 ${-sp.dy})" fill="#000"/></mask>
      <rect x="${x - 20}" y="${y - 20}" width="${w + 40}" height="${h + 40}" fill="#FFF6EE" opacity=".8" mask="url(#diy-body)"/>
      <path d="${sp.path}" transform="translate(0 ${-sp.dy})" fill="none" stroke="#5A3E36" stroke-width="2"/>`,
  },
  hat: {
    name: '帽子', icon: '🧢', cols: 24, rows: 13, box: [128, 90, 144, 78], list: () => HATS,
    shape: 'M128 168 L128 150 Q128 90 200 90 Q272 90 272 150 L272 168 Z',
  },
  neck: {
    name: '領巾', icon: '🧣', cols: 20, rows: 9, box: [120, 278, 160, 74], list: () => NECK,
    shape: 'M120 280 Q200 302 280 280 L200 352 Z',
  },
  held: {
    name: '小旗子', icon: '🚩', cols: 18, rows: 13, box: [236, 196, 90, 65], list: () => HELD,
    shape: 'M236 196 H326 V261 H236 Z',
    under: () => `<path d="M234 334 L234 188" stroke="#A47452" stroke-width="6" stroke-linecap="round"/><circle cx="234" cy="186" r="6" fill="#FFD45C" ${SW3}/>`,
  },
};

function diyPixelsSvg(t, px) {
  const [bx, by, bw, bh] = t.box;
  const cw = bw / t.cols, ch = bh / t.rows;
  const paths = {};
  for (let i = 0; i < px.length; i++) {
    const c = DIY_CHARS.indexOf(px[i]);
    if (c <= 0) continue;
    const x = bx + (i % t.cols) * cw, y = by + Math.floor(i / t.cols) * ch;
    paths[c] = (paths[c] || '') + `M${x.toFixed(1)} ${y.toFixed(1)}h${(cw + 0.4).toFixed(1)}v${(ch + 0.4).toFixed(1)}h${(-cw - 0.4).toFixed(1)}z`;
  }
  return Object.entries(paths).map(([c, d]) => `<path d="${d}" fill="${DIY_PALETTE[c]}"/>`).join('');
}

// 把一件作品做成換裝部件
function diyItem(type, design) {
  const t = DIY_TEMPLATES[type];
  const base = { id: design.id, name: design.name || `我的${t.name}`, price: 0, diy: type };
  const pixels = () => diyPixelsSvg(t, design.px);
  if (type === 'clothes') {
    return { ...base, clipped: pixels, front: () => `<path d="M162 288 Q200 302 238 288" fill="none" ${SW3}/>` };
  }
  return {
    ...base,
    defs: undefined,
    render: (p) => {
      const cid = `${p}-${design.id}`;
      return `${t.under ? t.under() : ''}<clipPath id="${cid}"><path d="${t.shape}"/></clipPath>
        <path d="${t.shape}" fill="#fff"/><g clip-path="url(#${cid})">${pixels()}</g><path d="${t.shape}" fill="none" ${SW}/>`;
    },
  };
}

// 作品代碼：分享給朋友用。格式「鼠<種類><顏色字元 + 兩位 36 進位的連續格數>…」
const DIY_CODE_TYPES = { clothes: 'c', hat: 'h', neck: 'n', held: 'f' };
function diyEncode(type, px) {
  let out = `鼠${DIY_CODE_TYPES[type]}`;
  for (let i = 0; i < px.length;) {
    let j = i;
    while (j < px.length && px[j] === px[i] && j - i < 1295) j++;
    out += px[i] + (j - i).toString(36).padStart(2, '0');
    i = j;
  }
  return out;
}
// 解不開或種類不合就回傳 null
function diyDecode(type, code) {
  const t = DIY_TEMPLATES[type];
  const s = String(code || '').trim();
  // 每段 3 個字至少 1 格，太長的代碼一定不對，先擋掉
  if (s[0] !== '鼠' || s[1] !== DIY_CODE_TYPES[type] || (s.length - 2) % 3 || s.length > 2 + 3 * t.cols * t.rows) return null;
  let px = '';
  for (let i = 2; i < s.length; i += 3) {
    const c = s[i], n = parseInt(s.slice(i + 1, i + 3), 36);
    if (!DIY_CHARS.includes(c) || !(n > 0)) return null;
    px += c.repeat(n);
    if (px.length > t.cols * t.rows) return null;
  }
  return px.length === t.cols * t.rows ? px : null;
}

function diyDesigns(type) {
  save.diy ||= {};
  save.diy[type] ||= [];
  return save.diy[type];
}

// 把存檔裡的作品放進各類別（放在「不穿」後面）
function syncDiyItems() {
  for (const type of Object.keys(DIY_TEMPLATES)) {
    const list = DIY_TEMPLATES[type].list();
    for (let i = list.length - 1; i >= 0; i--) if (list[i].diy) list.splice(i, 1);
    const at = list[0]?.id === 'none' ? 1 : 0;
    list.splice(at, 0, ...diyDesigns(type).map((d) => diyItem(type, d)));
  }
}
syncDiyItems();
saveListeners.push(() => {
  // 其他分頁改了作品時同步
  const now = JSON.stringify(save.diy || {});
  if (now !== syncDiyItems.last) { syncDiyItems.last = now; syncDiyItems(); }
});
syncDiyItems.last = JSON.stringify(save.diy || {});

// 自己畫的作品只存在自己的瀏覽器裡。別的玩家的 diy_ 編號在這台電腦上對應的是「我的」作品，
// 所以顯示別人時一律換成 none。
function stripDiy(look) {
  const out = { ...look };
  for (const k in out) if (typeof out[k] === 'string' && out[k].startsWith('diy_')) out[k] = 'none';
  return out;
}

// ───────────── 編輯器 ─────────────

function openDiyEditor(type, designId, onDone) {
  const t = DIY_TEMPLATES[type];
  const designs = diyDesigns(type);
  const existing = designs.find((d) => d.id === designId);
  if (!existing && designs.length >= DIY_MAX) {
    toast(`${t.name}最多 ${DIY_MAX} 件，先刪掉一件再畫吧！`);
    return;
  }
  const N = t.cols * t.rows;
  let px = existing ? existing.px.padEnd(N, '0').slice(0, N).split('') : Array(N).fill(type === 'clothes' ? '0' : '1');
  let color = 4, tool = 'pen', mirror = true, size = 1;
  const undo = [], redo = [];
  const sp = byId(SPECIES, save.look.species);
  const [bx, by, bw, bh] = t.box;
  const cw = bw / t.cols, ch = bh / t.rows;
  const pad = 10;
  const view = `${bx - pad} ${by - pad} ${bw + pad * 2} ${bh + pad * 2}`;

  const cells = px.map((_, i) => `<rect data-i="${i}" x="${bx + (i % t.cols) * cw}" y="${by + Math.floor(i / t.cols) * ch}" width="${cw + 0.3}" height="${ch + 0.3}"/>`).join('');
  const mask = t.shape
    ? `<path d="M${bx - pad} ${by - pad}h${bw + pad * 2}v${bh + pad * 2}h${-bw - pad * 2}z ${t.shape}" fill="#FFF6EE" fill-rule="evenodd" opacity=".82"/><path d="${t.shape}" fill="none" stroke="#5A3E36" stroke-width="2"/>`
    : t.guide(sp, t.box);
  const gridLines = Array.from({ length: t.cols + 1 }, (_, i) => `<line x1="${bx + i * cw}" y1="${by}" x2="${bx + i * cw}" y2="${by + bh}"/>`).join('')
    + Array.from({ length: t.rows + 1 }, (_, i) => `<line x1="${bx}" y1="${by + i * ch}" x2="${bx + bw}" y2="${by + i * ch}"/>`).join('');

  const m = modal(`<div class="diy">
      <h2>🎨 自己畫${t.name}</h2>
      <div class="diy-main">
        <div class="diy-canvas-wrap">
          <svg class="diy-canvas" viewBox="${view}" shape-rendering="crispEdges">
            <defs><pattern id="diy-check" width="${cw * 2}" height="${ch * 2}" patternUnits="userSpaceOnUse" x="${bx}" y="${by}">
              <rect width="${cw * 2}" height="${ch * 2}" fill="#fff"/><rect width="${cw}" height="${ch}" fill="#F1E8E4"/><rect x="${cw}" y="${ch}" width="${cw}" height="${ch}" fill="#F1E8E4"/></pattern></defs>
            <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="url(#diy-check)"/>
            <g class="diy-cells">${cells}</g>
            <g class="diy-grid" stroke="#5A3E36" stroke-width=".4" opacity=".18">${gridLines}</g>
            <g class="diy-mask" pointer-events="none" shape-rendering="auto">${mask}</g>
          </svg>
        </div>
        <div class="diy-side">
          <button class="diy-preview" type="button" aria-label="放大看看"></button>
          <label class="diy-name">名字 <input maxlength="8" placeholder="我的${t.name}"></label>
        </div>
      </div>
      <div class="diy-palette">${DIY_PALETTE.map((c, i) => `<button class="diy-color ${i === color ? 'on' : ''} ${i ? '' : 'clear'}" data-c="${i}" style="${c ? `--c:${c}` : ''}" aria-label="${i ? c : '透明'}"></button>`).join('')}</div>
      <div class="diy-tools">
        <button class="btn btn-small diy-tool on" data-tool="pen">🖊️ 畫筆</button>
        <button class="btn btn-small diy-tool" data-tool="fill">🪣 填滿</button>
        <button class="btn btn-small diy-tool" data-tool="erase">🧽 橡皮擦</button>
        <button class="btn btn-small diy-tool" data-tool="pick">💧 取色</button>
        <button class="btn btn-small diy-size" data-size="1">● 細</button>
        <button class="btn btn-small diy-mirror on">🪞 左右對稱</button>
        <button class="btn btn-small" data-act="undo">↶ 復原</button>
        <button class="btn btn-small" data-act="redo">↷ 重做</button>
        <button class="btn btn-small" data-act="clear">🗑️ 清空</button>
        <button class="btn btn-small" data-act="code">🔗 作品代碼</button>
      </div>
      <div class="modal-actions">
        ${existing ? '<button class="btn btn-gray" data-act="delete">刪除作品</button>' : ''}
        <button class="btn btn-pink" data-act="save">💾 儲存並穿上</button>
      </div>
    </div>`, { cls: 'diy-modal', fullscreen: true, beforeClose: (close) => { if (!undo.length) return true; confirmQuit(close, '還沒儲存，確定不要這件作品了嗎？', ['繼續畫', '不要了']); return false; } });

  const svg = $('.diy-canvas', m.box);
  // 桌機快捷鍵：Ctrl+Z 復原、Ctrl+Y／Ctrl+Shift+Z 重做（打名字時不攔）
  const onKey = (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.target.matches('input, textarea') || m.root !== $$('.modal-back').at(-1)) return;
    const k = e.key.toLowerCase();
    const act = k === 'z' ? (e.shiftKey ? 'redo' : 'undo') : k === 'y' ? 'redo' : null;
    if (act) { e.preventDefault(); $(`[data-act=${act}]`, m.box).click(); }
  };
  window.addEventListener('keydown', onKey);
  m.root.addEventListener('closed', () => window.removeEventListener('keydown', onKey));
  const rects = $$('.diy-cells rect', m.box);
  const nameInput = $('.diy-name input', m.box);
  nameInput.value = existing?.name || '';
  const paint = (i) => { rects[i].setAttribute('fill', px[i] === '0' ? 'transparent' : DIY_PALETTE[DIY_CHARS.indexOf(px[i])]); };
  rects.forEach((_, i) => paint(i));

  let previewTimer = 0;
  // 用目前的畫畫出穿上的樣子（uid 不同才不會跟別的預覽撞 id）
  function previewSvg(uid) {
    const item = diyItem(type, { id: 'diy_preview', name: '', px: px.join('') });
    const list = t.list();
    list.push(item);
    const out = svgWrap(renderPet({ ...save.look, [type]: 'diy_preview' }, uid), '30 60 340 340');
    list.splice(list.indexOf(item), 1);
    return out;
  }
  function preview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => { $('.diy-preview', m.box).innerHTML = previewSvg('diyp') + '<span class="diy-zoom">🔍</span>'; }, 60);
  }
  preview();

  const cellAt = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    const cx = Math.floor((q.x - bx) / cw), cy = Math.floor((q.y - by) / ch);
    if (cx < 0 || cy < 0 || cx >= t.cols || cy >= t.rows) return null;
    return [cx, cy];
  };
  const idx = (x, y) => y * t.cols + x;
  const ch_ = () => (tool === 'erase' ? '0' : DIY_CHARS[color]);
  function setCell(x, y, v) {
    const r = size === 1 ? 0 : 1;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const xs = mirror ? [x + dx, t.cols - 1 - (x + dx)] : [x + dx];
        for (const xx of xs) {
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= t.cols || yy >= t.rows) continue;
          const i = idx(xx, yy);
          if (px[i] !== v) { px[i] = v; paint(i); }
        }
      }
    }
  }
  function fill(x, y, v) {
    const from = px[idx(x, y)];
    if (from === v) return;
    const stack = [[x, y]];
    while (stack.length) {
      const [a, b] = stack.pop();
      if (a < 0 || b < 0 || a >= t.cols || b >= t.rows || px[idx(a, b)] !== from) continue;
      px[idx(a, b)] = v; paint(idx(a, b));
      stack.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]);
    }
    if (mirror) {
      const mx = t.cols - 1 - x;
      if (px[idx(mx, y)] === from) fill(mx, y, v);
    }
  }
  let drawing = false, lastCell = null;
  function strokeTo(c) {
    if (!lastCell) { setCell(c[0], c[1], ch_()); lastCell = c; return; }
    // 補上快速移動時中間跳過的格子
    const steps = Math.max(Math.abs(c[0] - lastCell[0]), Math.abs(c[1] - lastCell[1]));
    for (let s = 1; s <= steps; s++) {
      setCell(Math.round(lastCell[0] + ((c[0] - lastCell[0]) * s) / steps), Math.round(lastCell[1] + ((c[1] - lastCell[1]) * s) / steps), ch_());
    }
    lastCell = c;
  }
  svg.addEventListener('pointerdown', (e) => {
    const c = cellAt(e);
    if (!c) return;
    e.preventDefault();
    if (tool === 'pick') {
      // 取色：選到畫布上這一格的顏色，然後換回畫筆（透明就換成橡皮擦）
      color = DIY_CHARS.indexOf(px[idx(c[0], c[1])]);
      tool = color ? 'pen' : 'erase';
      $$('.diy-color', m.box).forEach((x) => x.classList.toggle('on', Number(x.dataset.c) === color));
      $$('.diy-tool', m.box).forEach((x) => x.classList.toggle('on', x.dataset.tool === tool));
      sfx.pop();
      return;
    }
    undo.push(px.join(''));
    if (undo.length > 40) undo.shift();
    redo.length = 0;
    if (tool === 'fill') { fill(c[0], c[1], DIY_CHARS[color]); preview(); sfx.pop(); return; }
    drawing = true;
    lastCell = null;
    svg.setPointerCapture(e.pointerId);
    strokeTo(c);
    preview();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const c = cellAt(e);
    if (c) { strokeTo(c); preview(); }
  });
  const end = () => { drawing = false; lastCell = null; };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  m.box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('diy-preview')) {
      const big = modal(`<div class="diy-big">${previewSvg('diypbig')}<p>${escapeXml(nameInput.value.trim() || `我的${t.name}`)}</p></div>`, { cls: 'small' });
      big.box.addEventListener('click', big.close);
      return;
    }
    if (b.dataset.c) {
      color = Number(b.dataset.c);
      if (color === 0) tool = 'erase';
      else if (tool === 'erase') tool = 'pen';
      $$('.diy-color', m.box).forEach((x) => x.classList.toggle('on', x === b));
      $$('.diy-tool', m.box).forEach((x) => x.classList.toggle('on', x.dataset.tool === tool));
    } else if (b.dataset.tool) {
      tool = b.dataset.tool;
      $$('.diy-tool', m.box).forEach((x) => x.classList.toggle('on', x === b));
    } else if (b.dataset.size) {
      size = size === 1 ? 3 : 1;
      b.textContent = size === 1 ? '● 細' : '⬤ 粗';
    } else if (b.classList.contains('diy-mirror')) {
      mirror = !mirror;
      b.classList.toggle('on', mirror);
    } else if (b.dataset.act === 'undo') {
      if (!undo.length) return;
      redo.push(px.join(''));
      px = undo.pop().split('');
      rects.forEach((_, i) => paint(i));
      preview();
    } else if (b.dataset.act === 'redo') {
      if (!redo.length) return;
      undo.push(px.join(''));
      px = redo.pop().split('');
      rects.forEach((_, i) => paint(i));
      preview();
    } else if (b.dataset.act === 'code') {
      // 複製自己的代碼，或貼上朋友的代碼
      const code = diyEncode(type, px.join(''));
      const c = modal(`<div class="buy-box diy-code"><h3>🔗 作品代碼</h3>
        <p>把代碼傳給朋友，朋友在「自己畫${t.name}」貼上就能看到一樣的作品！</p>
        <textarea readonly rows="3">${code}</textarea>
        <div class="modal-actions"><button class="btn btn-blue" data-c="copy">📋 複製</button></div>
        <p>收到朋友的代碼？貼在這裡：</p>
        <textarea class="paste" rows="3" placeholder="貼上代碼…"></textarea>
        <div class="modal-actions"><button class="btn btn-pink" data-c="load">套用到畫布</button><button class="btn btn-gray" data-c="no">關閉</button></div></div>`, { cls: 'small' });
      c.box.addEventListener('click', async (ev) => {
        const k = ev.target.closest('[data-c]')?.dataset.c;
        if (k === 'no') c.close();
        if (k === 'copy') {
          try { await navigator.clipboard.writeText(code); toast('代碼複製好了！'); }
          catch { $('textarea', c.box).select(); toast('請長按代碼複製'); }
        }
        if (k === 'load') {
          const got = diyDecode(type, $('.paste', c.box).value);
          if (!got) { toast(`這不是「${t.name}」的作品代碼喔`); return; }
          undo.push(px.join('')); redo.length = 0;
          px = got.split('');
          rects.forEach((_, i) => paint(i));
          preview();
          c.close();
          toast('套用好了！可以再修改或直接儲存');
        }
      });
    } else if (b.dataset.act === 'clear') {
      undo.push(px.join(''));
      redo.length = 0;
      px = Array(N).fill('0');
      rects.forEach((_, i) => paint(i));
      preview();
    } else if (b.dataset.act === 'delete') {
      syncStoredSave(); // 別的分頁可能剛存過檔，重新找一次
      const list = diyDesigns(type);
      const i = list.findIndex((d) => d.id === designId);
      if (i >= 0) list.splice(i, 1);
      if (save.look[type] === designId) save.look[type] = 'none';
      syncDiyItems();
      persist();
      m.close();
      toast('作品刪掉囉');
      onDone?.();
    } else if (b.dataset.act === 'save') {
      if (!px.some((v) => v !== '0')) { toast('先畫一點東西吧！'); return; }
      const name = [...nameInput.value.trim()].slice(0, 8).join('') || `我的${t.name}`;
      const data = px.join('');
      syncStoredSave(); // 別的分頁可能剛存過檔，重新找一次
      const current = existing && diyDesigns(type).find((d) => d.id === designId);
      if (!current && diyDesigns(type).length >= DIY_MAX) { toast(`${t.name}最多 ${DIY_MAX} 件，先刪掉一件再畫吧！`); return; }
      let id = current?.id;
      if (current) Object.assign(current, { name, px: data });
      else {
        const used = new Set(diyDesigns(type).map((d) => d.id));
        let n = 1;
        while (used.has(`diy_${type}_${n}`)) n++;
        id = `diy_${type}_${n}`;
        diyDesigns(type).push({ id, name, px: data });
      }
      syncDiyItems();
      save.look[type] = id;
      persist();
      sfx.buy();
      m.close();
      toast(`🎨「${escapeXml(name)}」完成了！`);
      onDone?.();
    }
  });
}
