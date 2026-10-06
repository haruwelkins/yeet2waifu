// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Small pieces shared by the tool pages (index.html setup, draw.html editor): a DOM helper, pixel canvases,
// the pixel icons, the remembered language, and the two pages' storage.
import { PAL } from './art/palette.js';

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (typeof v === 'boolean') el[k] = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

// A status line: kind '' (neutral), 'ok' (green) or 'warn' (rust), with a little square mark.
export function note(el, kind, text) {
  el.className = kind ? `note ${kind}` : 'note';
  el.replaceChildren(...(kind ? [h('span', { class: 'mark', 'aria-hidden': 'true' })] : []), text);
}

export function paintImg(canvas, img) {
  canvas.width = img.w;
  canvas.height = img.h;
  const ctx = canvas.getContext('2d');
  const data = ctx.createImageData(img.w, img.h);
  data.data.set(img.px);
  ctx.putImageData(data, 0, 0);
}

export function imgCanvas(img, cls) {
  const c = h('canvas', { class: cls, width: String(img.w), height: String(img.h) });
  paintImg(c, img);
  return c;
}

// Grid art: one letter per pixel, '.' = clear. Short rows are padded.
export function gridCanvas(rows, colors, cls) {
  const w = Math.max(...rows.map((r) => r.length));
  const c = h('canvas', { class: cls, width: String(w), height: String(rows.length) });
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || ch === ' ') return;
    ctx.fillStyle = colors[ch];
    ctx.fillRect(x, y, 1, 1);
  }));
  return c;
}

export const ICON_COLORS = { K: PAL.ink, R: PAL.hot, W: PAL.white, S: PAL.silver, Y: PAL.yellow, P: PAL.rose, T: PAL.tan,
  B: PAL.blue, G: PAL.gray, D: PAL.steel, L: PAL.lime };

export const ICONS = {
  heart: ['................', '..KKKK....KKKK..', '.KRRRRK..KRRRRK.', 'KRWWRRRKKRRRRRRK', 'KRWRRRRRRRRRRRRK', 'KRRRRRRRRRRRRRRK',
    'KRRRRRRRRRRRRRRK', '.KRRRRRRRRRRRRK.', '..KRRRRRRRRRRK..', '...KRRRRRRRRK...', '....KRRRRRRK....', '.....KRRRRK.....',
    '......KRRK......', '.......KK.......', '................', '................'],
  dice: ['................', '..KKKKKKKKKKKK..', '.KWWWWWWWWWWWWK.', '.KWKKWWWWWWKKSK.', '.KWKKWWWWWWKKSK.', '.KWWWWWWWWWWWSK.',
    '.KWWWWWKKWWWWSK.', '.KWWWWWKKWWWWSK.', '.KWWWWWWWWWWWSK.', '.KWKKWWWWWWKKSK.', '.KWKKWWWWWWKKSK.', '.KWWWWWWWWWWWSK.',
    '.KSSSSSSSSSSSSK.', '..KKKKKKKKKKKK..', '................', '................'],
  pencil: ['................', '............KKK.', '...........KPPPK', '..........KSPPPK', '.........KYSSPK.', '........KYYYSK..',
    '.......KYYYYK...', '......KYYYYK....', '.....KYYYYK.....', '....KYYYYK......', '...KTYYYK.......', '..KTTYYK........',
    '..KTTTK.........', '.KDKTK..........', '.KKKK...........', '................'],
  eraser: ['................', '................', '.........KKKKK..', '........KPPPPPK.', '.......KPPPPPPK.', '......KPPPPPPK..',
    '.....KWWPPPPK...', '....KWWWWPPK....', '...KWWWWWWK.....', '..KWWWWWWK......', '..KWWWWWK.......', '...KWWWK........',
    '....KKK.........', '................', '.KKKKKKKKKKKK...', '................'],
  fill: ['................', '.....KKK........', '....K...K.......', '....K...K.......', '...KKKKKKKKK....', '..KWWWWWWWWWK...',
    '..KWSSSSSSSWKK..', '..KWBBBBBBBWKBK.', '..KWBBBBBBBWKBK.', '..KWBBBBBBBWKBK.', '...KWBBBBBWK.KBK', '...KWBBBBBWK..KK',
    '....KKKKKKK.....', '................', '................', '................'],
  picker: ['................', '...........KKK..', '..........KSSSK.', '..........KSSSK.', '.........KKSSK..', '........KWKKK...',
    '.......KWWK.....', '......KWWK......', '.....KWWK.......', '....KWWK........', '...KBWK.........', '..KBBK..........',
    '..KBK...........', '.KK.............', '................', '................'],
  mirror: ['................', '.......B........', '.......B........', '.K.....B.....K..', '.KK....B....KK..', '.KWK...B...KWK..',
    '.KWWK..B..KWWK..', '.KWWWK.B.KWWWK..', '.KWWWK.B.KWWWK..', '.KWWK..B..KWWK..', '.KWK...B...KWK..', '.KK....B....KK..',
    '.K.....B.....K..', '.......B........', '.......B........', '................'],
  grid: ['................', '.KKKKKKKKKKKKK..', '.KWWWKWWWKWWWK..', '.KWWWKWWWKWWWK..', '.KWWWKWWWKWWWK..', '.KKKKKKKKKKKKK..',
    '.KWWWKWWWKWWWK..', '.KWWWKWWWKWWWK..', '.KWWWKWWWKWWWK..', '.KKKKKKKKKKKKK..', '.KWWWKWWWKWWWK..', '.KWWWKWWWKWWWK..',
    '.KWWWKWWWKWWWK..', '.KKKKKKKKKKKKK..', '................', '................'],
  guide: ['................', '.....GGGGGG.....', '....G......G....', '...G........G...', '...G........G...', '...G........G...',
    '....G......G....', '.....GG..GG.....', '....G......G....', '...G........G...', '..G..........G..', '..G..........G..',
    '..G..........G..', '..GGGGGGGGGGGG..', '................', '................'],
  undo: ['................', '................', '.....K..........', '....KK..........', '...KWKKKKKKK....', '..KWWWWWWWWWK...',
    '...KWKKKKKKWWK..', '....KK.....KWK..', '.....K.....KWK..', '...........KWK..', '..........KWWK..', '......KKKKWWK...',
    '......KWWWWK....', '......KKKKK.....', '................', '................'],
};
ICONS.redo = ICONS.undo.map((r) => [...r.padEnd(16, '.')].reverse().join(''));

ICONS.trash = ['................', '......KKKK......', '.....KSSSSK.....', '..KKKKKKKKKKKK..', '..KSSSSSSSSSSK..', '..KKKKKKKKKKKK..',
  '...KWWWWWWWWK...', '...KWSWWSWWSK...', '...KWSWWSWWSK...', '...KWSWWSWWSK...', '...KWSWWSWWSK...', '...KWSWWSWWSK...',
  '...KWWWWWWWWK...', '....KKKKKKKK....', '................', '................'];

// The shape icons are drawn by rule: 16×16 grids of letters like the others.
function grid16(at) {
  return Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => at(x, y) || '.').join(''));
}
ICONS.select = grid16((x, y) => {
  const edge = (x === 1 || x === 14) && y >= 1 && y <= 14 ? y : (y === 1 || y === 14) && x >= 1 && x <= 14 ? x : -1;
  return edge >= 0 && edge % 4 !== 0 ? 'K' : '';
});
ICONS.rect = grid16((x, y) => (x >= 2 && x <= 13 && y >= 3 && y <= 12 && (x === 2 || x === 13 || y === 3 || y === 12) ? 'K' : ''));
const inCircle = (x, y, r) => (x - 7.5) ** 2 + (y - 7.5) ** 2 <= r * r;
ICONS.ellipse = grid16((x, y) => (inCircle(x, y, 6.6) && !inCircle(x, y, 5.4) ? 'K' : ''));
ICONS.filled = grid16((x, y) => {
  if (inCircle(x - 3, y - 3, 4.6)) return inCircle(x - 3, y - 3, 3.5) ? 'P' : 'K';
  if (x >= 2 && x <= 9 && y >= 2 && y <= 9) return x === 2 || x === 9 || y === 2 || y === 9 ? 'K' : 'B';
  return '';
});
for (const n of [1, 2, 3, 4]) {
  const a = 8 - n;
  ICONS[`size${n}`] = grid16((x, y) => (x >= a && x < a + 2 * n && y >= a && y < a + 2 * n ? 'K' : ''));
}

// The language of the tool pages, shared by both (and by the game's default language in the setup).
const LANG_KEY = 'y2w-lang';
export function readLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === 'en' || v === 'es') return v;
  } catch {
    // no storage: fall through to the browser's language
  }
  return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
}
export function writeLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // private window: the choice lasts for this page only
  }
}

export function loadStore(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}
export function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private window or full storage: the page keeps working, it just forgets
  }
}
export const SETUP_KEY = 'y2w-setup-1';
export const DRAW_KEY = 'y2w-draw-1';

// "My waifus": the ones drawn in the editor, kept in this browser. [{id, name, code, t}], newest first.
const MINE_KEY = 'y2w-mine-1';
export function listMine() {
  const v = loadStore(MINE_KEY);
  const list = Array.isArray(v && v.list) ? v.list : [];
  return list.filter((w) => w && typeof w.id === 'string' && typeof w.code === 'string').sort((a, b) => (b.t || 0) - (a.t || 0));
}
export function upsertMine(item) {
  const list = listMine().filter((w) => w.id !== item.id);
  list.unshift({ ...item, t: Date.now() });
  saveStore(MINE_KEY, { list: list.slice(0, 60) });
}
export function deleteMine(id) {
  saveStore(MINE_KEY, { list: listMine().filter((w) => w.id !== id) });
}
export const newMineId = () => `w${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

// The one confirmation of the tool pages (an Aseprite style dialog). Cancel is the default; Esc cancels.
export function confirmDialog({ title, text, art = null, ok, cancel }) {
  return new Promise((resolve) => {
    const okBtn = h('button', { type: 'button', class: 'btn raised cut btn-danger', text: ok });
    const noBtn = h('button', { type: 'button', class: 'btn raised cut', text: cancel });
    const dlg = h('dialog', { class: 'dlg raised', 'aria-label': title },
      h('div', { class: 'panel-title' }, h('span', { text: title })),
      h('div', { class: 'dlg-body' }, art, h('p', { text })),
      h('div', { class: 'dlg-foot' }, noBtn, okBtn));
    const close = (v) => {
      dlg.close();
      dlg.remove();
      resolve(v);
    };
    okBtn.addEventListener('click', () => close(true));
    noBtn.addEventListener('click', () => close(false));
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close(false);
    });
    document.body.append(dlg);
    dlg.showModal();
    noBtn.focus();
  });
}

// The heart in the title bar and the browser tab.
export function appIcon(canvas) {
  const icon = gridCanvas(ICONS.heart, ICON_COLORS);
  canvas.getContext('2d').drawImage(icon, 0, 0);
  document.head.append(h('link', { rel: 'icon', href: icon.toDataURL() }));
}
