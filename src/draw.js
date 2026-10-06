// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The waifu editor (draw.html): a 32×32 canvas in the game's palette, Aseprite style tools, her live preview on
// a balcony at stream size, a GIF timelapse of every stroke, and her code (copy it, or send her to the setup page).
// The drawing, its history and the timelapse stay in this browser (localStorage).
import { PAL, PAL_ORDER, RGBA } from './art/palette.js';
import { WAIFUS } from './art/waifus.js';
import { WORLDS } from './maps.js';
import { composeLevel, flatten } from './level.js';
import { encodeWaifu, decodeWaifu, cleanName } from './waifucode.js';
import { loadFonts, textSprite } from './text.js';
import { VERSION } from './version.js';
import { SIZE, CLEAR, blank, isEmpty, sameArt, toImg, fromImg, artData, artFromData, paint, line, fill, encodeGif, brush, rectPixels,
  ellipsePixels, normRect, copyRect, clearRect, pasteBuf, flipBuf } from './editor_core.js';
import { h, note, imgCanvas, paintImg, gridCanvas, ICONS, ICON_COLORS, readLang, writeLang, loadStore, saveStore, DRAW_KEY,
  appIcon, listMine, upsertMine, deleteMine, newMineId, confirmDialog } from './uikit.js';

const T = {
  en: {
    ask: 'who gets the waifu?',
    navSetup: 'Setup',
    navDraw: 'Draw your waifu',
    propsTitle: 'Your waifu',
    propsHint: '32×32, the game palette',
    tools: { pencil: 'Pencil (B)', eraser: 'Eraser (E)', fill: 'Fill (G)', picker: 'Color picker (I)', select: 'Select (S)',
      rect: 'Rectangle (R)', ellipse: 'Circle (O)', filled: 'Filled shapes (F)', mirror: 'Mirror (M)', grid: 'Grid',
      guide: 'Body guide', undo: 'Undo (Ctrl+Z)', redo: 'Redo (Ctrl+Y)', size: (n) => `Brush size ${n} (${n})` },
    toolNames: { pencil: 'Pencil', eraser: 'Eraser', fill: 'Fill', picker: 'Color picker', select: 'Select', rect: 'Rectangle',
      ellipse: 'Circle' },
    hints: { select: 'Drag to select · drag inside to move, Alt copies · H flips · Delete erases · Enter drops',
      rect: 'Shift: a perfect square · F fills it', ellipse: 'Shift: a perfect circle · F fills it' },
    secColor: 'Color',
    clear: 'transparent',
    secName: 'Name',
    namePh: 'her name',
    nameNote: 'Letters and numbers, up to 12. It shows under her portrait in the game.',
    secStart: 'Start from',
    blank: 'Blank',
    startNote: 'Starting over keeps your drawing in the history: Ctrl+Z brings it back.',
    loadLabel: 'Code',
    loadPh: 'paste a waifu code to edit her',
    loadOk: (n) => `${n} is on the canvas.`,
    loadBad: 'That code does not read. Copy it whole.',
    secPreview: 'In the game',
    otherWorld: 'Another world',
    previewNote: 'Her size on stream at 1080p, breathing on her balcony.',
    secTime: 'Timelapse',
    timeCount: (n) => (n === 1 ? '1 frame recorded' : `${n} frames recorded`),
    timeEmpty: 'Draw something and every stroke turns into a frame.',
    saveGif: 'Save GIF',
    making: 'Making the GIF…',
    timeNote: 'Post it with her code and tag @haru717171x.',
    codeTitle: 'Her code',
    codeLen: (n) => `${n} characters`,
    codeEmpty: 'Draw something and her code shows up here.',
    mineTitle: 'My waifus',
    newWaifu: '+ New waifu',
    mineNote: 'They save themselves in this browser. Copy a code to keep one safe anywhere.',
    mineEmpty: 'Nothing yet: draw one and she shows up here.',
    delTip: (n) => `Delete ${n}`,
    delTitle: 'Delete waifu',
    delText: (n) => `Are you sure you want to delete the waifu ${n}? This can't be undone.`,
    delOk: 'Delete',
    delCancel: 'Cancel',
    copy: 'COPY CODE',
    copied: 'COPIED!',
    use: 'USE HER',
    useTip: 'Puts her in your OBS link on the setup page',
    stPos: (x, y) => `x ${x}  y ${y}`,
    stHint: 'Right click erases · Alt+click picks a color',
  },
  es: {
    ask: '¿quién se queda con la waifu?',
    navSetup: 'Configuración',
    navDraw: 'Dibuja tu waifu',
    propsTitle: 'Tu waifu',
    propsHint: '32×32, la paleta del juego',
    tools: { pencil: 'Lápiz (B)', eraser: 'Borrador (E)', fill: 'Bote de pintura (G)', picker: 'Gotero (I)', select: 'Selección (S)',
      rect: 'Rectángulo (R)', ellipse: 'Círculo (O)', filled: 'Formas rellenas (F)', mirror: 'Espejo (M)', grid: 'Cuadrícula',
      guide: 'Guía del cuerpo', undo: 'Deshacer (Ctrl+Z)', redo: 'Rehacer (Ctrl+Y)', size: (n) => `Tamaño de pincel ${n} (${n})` },
    toolNames: { pencil: 'Lápiz', eraser: 'Borrador', fill: 'Bote', picker: 'Gotero', select: 'Selección', rect: 'Rectángulo',
      ellipse: 'Círculo' },
    hints: { select: 'Arrastra para seleccionar · arrastra adentro para mover, Alt copia · H voltea · Supr borra · Enter suelta',
      rect: 'Shift: cuadrado perfecto · F lo rellena', ellipse: 'Shift: círculo perfecto · F lo rellena' },
    secColor: 'Color',
    clear: 'transparente',
    secName: 'Nombre',
    namePh: 'su nombre',
    nameNote: 'Letras y números, hasta 12. Sale bajo su retrato en el juego.',
    secStart: 'Empezar desde',
    blank: 'En blanco',
    startNote: 'Empezar de nuevo guarda tu dibujo en el historial: Ctrl+Z lo regresa.',
    loadLabel: 'Código',
    loadPh: 'pega un código de waifu para editarla',
    loadOk: (n) => `${n} está en el lienzo.`,
    loadBad: 'Ese código no se lee. Cópialo completo.',
    secPreview: 'En el juego',
    otherWorld: 'Otro mundo',
    previewNote: 'Su tamaño en el stream a 1080p, respirando en su balcón.',
    secTime: 'Timelapse',
    timeCount: (n) => (n === 1 ? '1 cuadro grabado' : `${n} cuadros grabados`),
    timeEmpty: 'Dibuja algo y cada trazo se vuelve un cuadro.',
    saveGif: 'Guardar GIF',
    making: 'Armando el GIF…',
    timeNote: 'Publícalo con su código y etiqueta a @haru717171x.',
    codeTitle: 'Su código',
    codeLen: (n) => `${n} caracteres`,
    codeEmpty: 'Dibuja algo y aquí aparece su código.',
    mineTitle: 'Mis waifus',
    newWaifu: '+ Nueva waifu',
    mineNote: 'Se guardan solas en este navegador. Copia su código para tenerla segura en cualquier lado.',
    mineEmpty: 'Aún nada: dibuja una y aparece aquí.',
    delTip: (n) => `Borrar a ${n}`,
    delTitle: 'Borrar waifu',
    delText: (n) => `¿Seguro que quieres borrar a la waifu ${n}? No se puede deshacer.`,
    delOk: 'Borrar',
    delCancel: 'Cancelar',
    copy: 'COPIAR CÓDIGO',
    copied: '¡COPIADO!',
    use: 'USARLA',
    useTip: 'La pone en tu link para OBS en la configuración',
    stPos: (x, y) => `x ${x}  y ${y}`,
    stHint: 'Clic derecho borra · Alt+clic toma un color',
  },
};

const $ = (sel) => document.querySelector(sel);
const TOOLS = ['pencil', 'eraser', 'fill', 'picker', 'select', 'rect', 'ellipse'];
const SIZED = ['pencil', 'eraser', 'rect', 'ellipse'];
const MAX_UNDO = 200;
const MAX_FRAMES = 2000;
const WORLD_IDS = Object.keys(WORLDS);

// ---------- state ----------
const st = { lang: readLang(), art: blank(), name: '', color: PAL_ORDER.indexOf('ink'), tool: 'pencil', size: 1, filled: false,
  mirror: false, grid: true, guide: true, world: 0, frames: [], open: {}, mineId: null };
let undoStack = [];
let redoStack = [];
let hover = null;
let stroke = null; // a pencil or eraser drag
let shape = null; // a rectangle or circle being dragged
let sel = null; // the selected rectangle {x, y, w, h}
let marquee = null; // a new selection being dragged
let floating = null; // lifted pixels {buf, x, y}: moved with the mouse or the arrows, dropped with Enter / a click outside
let selBase = null; // the art before lifting, so a whole move is one undo step
let moving = null;
let clip = null; // Ctrl+C / Ctrl+X {buf, x, y}
let ants = 0;

function load() {
  const s = loadStore(DRAW_KEY);
  if (!s) return;
  const art = typeof s.art === 'string' ? artFromData(s.art) : null;
  if (art) st.art = art;
  if (typeof s.name === 'string') st.name = cleanName(s.name) === 'Waifu' && s.name !== 'Waifu' ? '' : s.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
  if (Number.isInteger(s.color) && s.color >= 0 && s.color < PAL_ORDER.length) st.color = s.color;
  for (const k of ['mirror', 'grid', 'guide', 'filled']) if (typeof s[k] === 'boolean') st[k] = s[k];
  if (Number.isInteger(s.size) && s.size >= 1 && s.size <= 4) st.size = s.size;
  if (Number.isInteger(s.world)) st.world = ((s.world % WORLD_IDS.length) + WORLD_IDS.length) % WORLD_IDS.length;
  if (Array.isArray(s.frames)) st.frames = s.frames.filter((f) => typeof f === 'string').slice(-MAX_FRAMES);
  if (s.open && typeof s.open === 'object') st.open = s.open;
  if (typeof s.mineId === 'string') st.mineId = s.mineId;
}

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 250);
}
function saveNow() {
  clearTimeout(saveTimer);
  saveStore(DRAW_KEY, { art: artData(st.art), name: st.name, color: st.color, size: st.size, filled: st.filled, mirror: st.mirror,
    grid: st.grid, guide: st.guide, world: st.world, frames: st.frames.slice(-MAX_FRAMES), open: st.open, mineId: st.mineId });
  // every waifu with something drawn lives in "My waifus"
  const c = code();
  if (c) {
    if (!st.mineId) st.mineId = newMineId();
    upsertMine({ id: st.mineId, name: st.name || 'Waifu', code: c });
    refreshMine();
  }
}

// ---------- my waifus ----------
let refreshMine = () => {};
function freshStart() {
  deselect();
  undoStack = [];
  redoStack = [];
}
function openMine(item) {
  const w = decodeWaifu(item.code);
  if (!w) return;
  saveNow();
  freshStart();
  st.mineId = item.id;
  st.art = fromImg(w.img);
  st.name = item.name === 'Waifu' ? '' : item.name;
  st.frames = [artData(st.art)];
  changed();
  renderPanel();
}
function newWaifu() {
  saveNow();
  freshStart();
  st.mineId = null;
  st.art = blank();
  st.name = '';
  st.frames = [];
  changed();
  renderPanel();
}
async function askDelete(item) {
  const t = T[st.lang];
  const w = decodeWaifu(item.code);
  const yes = await confirmDialog({ title: t.delTitle, text: t.delText(item.name), art: w ? imgCanvas(w.img) : null,
    ok: t.delOk, cancel: t.delCancel });
  if (!yes) return;
  deleteMine(item.id);
  if (item.id === st.mineId) newWaifu();
  else refreshMine();
}
function mineBody(t) {
  const grid = h('div', { class: 'picks waifus' });
  const empty = h('p', { class: 'note' });
  const add = h('button', { type: 'button', class: 'btn raised cut', text: t.newWaifu });
  add.addEventListener('click', newWaifu);
  let firma = '';
  refreshMine = () => {
    const list = listMine();
    const nueva = JSON.stringify([st.mineId, list.map((w) => [w.id, w.name, w.code])]);
    if (nueva === firma) return;
    firma = nueva;
    grid.replaceChildren(...list.map((item) => {
      const w = decodeWaifu(item.code);
      const pick = h('button', { type: 'button', class: 'btn raised pick', title: item.name, 'aria-pressed': String(item.id === st.mineId) },
        w ? imgCanvas(w.img, 'who') : h('span', { class: 'empty-who', text: '?' }), h('span', { class: 'lbl', text: item.name }));
      pick.addEventListener('click', () => openMine(item));
      const del = h('button', { type: 'button', class: 'btn raised pick-del', title: t.delTip(item.name), 'aria-label': t.delTip(item.name) },
        gridCanvas(ICONS.trash, ICON_COLORS));
      del.addEventListener('click', () => askDelete(item));
      return h('div', { class: 'pick-wrap' }, pick, del);
    }));
    note(empty, '', list.length ? t.mineNote : t.mineEmpty);
  };
  refreshMine();
  return [h('div', { class: 'mine-row' }, add), grid, empty];
}

// ---------- the canvas ----------
const stage = $('#stage');
const wrap = $('#artWrap');
const artC = $('#art');
const guideC = $('#guide');
const over = $('#over');

// The body guide: Hana's silhouette, faint, behind the art (never exported).
(() => {
  const g = guideC.getContext('2d');
  const img = WAIFUS.hana.img;
  const data = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) if (img.px[i * 4 + 3] > 127) data.data.set([24, 20, 37, 40], i * 4);
  g.putImageData(data, 0, 0);
})();

function layout() {
  // desktop: the biggest whole zoom that fits the stage; phone (one column): the width of the screen
  const r = stage.getBoundingClientRect();
  const avail = (window.innerWidth > 1100 ? Math.min(r.width, r.height) : Math.min(r.width, 600)) - 28;
  const zoom = Math.max(6, Math.min(28, Math.floor(avail / SIZE)));
  const px = zoom * SIZE;
  wrap.style.width = `${px + 4}px`;
  wrap.style.height = `${px + 4}px`;
  wrap.style.backgroundSize = `${zoom * 2}px ${zoom * 2}px`;
  const dpr = window.devicePixelRatio || 1;
  over.width = Math.round(px * dpr);
  over.height = Math.round(px * dpr);
  drawOver();
}

// The art as it looks right now: with the lifted pixels where they are being moved.
function current() {
  if (!floating) return st.art;
  const a = st.art.slice();
  pasteBuf(a, floating.buf, floating.x, floating.y);
  return a;
}

function drawArt() {
  paintImg(artC, toImg(current()));
  guideC.hidden = !st.guide;
}

function drawOver() {
  const ctx = over.getContext('2d');
  const W = over.width;
  const z = W / SIZE;
  ctx.clearRect(0, 0, W, W);
  if (st.grid) {
    for (let i = 1; i < SIZE; i++) {
      ctx.fillStyle = i % 8 === 0 ? 'rgba(24,20,37,0.34)' : 'rgba(24,20,37,0.13)';
      const p = Math.round(i * z);
      ctx.fillRect(p, 0, 1, W);
      ctx.fillRect(0, p, W, 1);
    }
  }
  if (st.mirror) {
    ctx.fillStyle = PAL.blue;
    ctx.fillRect(Math.round(16 * z) - 1, 0, 2, W);
  }
  // where the brush lands: its whole footprint (and its mirror)
  if (hover && !sel) {
    const n = SIZED.includes(st.tool) && !shape ? st.size : 1;
    const a = Math.floor((n - 1) / 2);
    const x0 = hover[0] - a;
    const spots = st.mirror && st.tool !== 'select' ? [x0, SIZE - x0 - n] : [x0];
    for (const bx of spots) {
      const x = Math.round(bx * z);
      const y = Math.round((hover[1] - a) * z);
      const s = Math.round(n * z);
      ctx.lineWidth = 2;
      ctx.strokeStyle = PAL.ink;
      ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x + 2.5, y + 2.5, s - 5, s - 5);
    }
  }
  // the selection: marching ants
  if (sel) {
    const x = Math.round(sel.x * z);
    const y = Math.round(sel.y * z);
    const w = Math.round(sel.w * z);
    const hh = Math.round(sel.h * z);
    const dash = Math.max(4, Math.round(z / 2));
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(x + 1, y + 1, w - 2, hh - 2);
    ctx.setLineDash([dash, dash]);
    ctx.lineDashOffset = -ants;
    ctx.strokeStyle = PAL.ink;
    ctx.strokeRect(x + 1, y + 1, w - 2, hh - 2);
    ctx.setLineDash([]);
  }
}

function cellOf(e) {
  const r = over.getBoundingClientRect();
  const x = Math.floor(((e.clientX - r.left) / r.width) * SIZE);
  const y = Math.floor(((e.clientY - r.top) / r.height) * SIZE);
  return [Math.max(0, Math.min(SIZE - 1, x)), Math.max(0, Math.min(SIZE - 1, y))];
}

function commit(before) {
  if (sameArt(before, st.art)) return changed(); // nothing new, but the screen may still show a lifted piece
  if (!st.frames.length) st.frames.push(artData(before));
  undoStack.push(before);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack = [];
  st.frames.push(artData(st.art));
  if (st.frames.length > MAX_FRAMES) st.frames.splice(1, st.frames.length - MAX_FRAMES);
  changed();
}

function pick(x, y) {
  const c = current()[y * SIZE + x];
  if (c !== CLEAR) st.color = c;
  setTool('pencil');
  save();
}

function setTool(tool) {
  if (tool !== 'select') deselect();
  st.tool = tool;
  sync();
}
function setSize(n) {
  st.size = Math.max(1, Math.min(4, n));
  sync();
  save();
}

// ---------- selection ----------
const inSel = (x, y) => sel && x >= sel.x && y >= sel.y && x < sel.x + sel.w && y < sel.y + sel.h;
function lift(copy = false) {
  if (floating || !sel) return;
  selBase = st.art.slice();
  floating = { buf: copyRect(st.art, sel), x: sel.x, y: sel.y };
  if (!copy) clearRect(st.art, sel);
}
function drop() {
  if (!floating) return;
  pasteBuf(st.art, floating.buf, floating.x, floating.y);
  const before = selBase;
  floating = null;
  selBase = null;
  commit(before);
}
function deselect() {
  drop();
  sel = null;
  drawOver();
}
function nudge(dx, dy) {
  lift();
  floating.x += dx;
  floating.y += dy;
  sel.x += dx;
  sel.y += dy;
  changed();
}
function deleteSel() {
  if (floating) {
    const before = selBase;
    floating = null;
    selBase = null;
    commit(before);
  } else {
    const before = st.art.slice();
    clearRect(st.art, sel);
    commit(before);
  }
  sel = null;
  drawOver();
}
function copySel(cut = false) {
  clip = { buf: copyRect(current(), sel), x: sel.x, y: sel.y };
  if (cut) deleteSel();
}
function pasteClip() {
  deselect();
  st.tool = 'select';
  selBase = st.art.slice();
  floating = { buf: { w: clip.buf.w, h: clip.buf.h, px: clip.buf.px.slice() }, x: clip.x, y: clip.y };
  sel = { x: clip.x, y: clip.y, w: clip.buf.w, h: clip.buf.h };
  changed();
}
function flipSel() {
  lift();
  floating.buf = flipBuf(floating.buf);
  changed();
}

// ---------- shapes ----------
function drawShape(x, y, square) {
  let x1 = x;
  let y1 = y;
  if (square) {
    const d = Math.max(Math.abs(x - shape.x0), Math.abs(y - shape.y0));
    x1 = shape.x0 + (x < shape.x0 ? -d : d);
    y1 = shape.y0 + (y < shape.y0 ? -d : d);
  }
  st.art = shape.base.slice();
  const pts = (st.tool === 'rect' ? rectPixels : ellipsePixels)(shape.x0, shape.y0, x1, y1, st.filled, st.size);
  for (const [px, py] of pts) paint(st.art, px, py, shape.value, st.mirror);
  drawArt();
}

over.addEventListener('contextmenu', (e) => e.preventDefault());
over.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  over.setPointerCapture(e.pointerId);
  const [x, y] = cellOf(e);
  if (st.tool === 'select') {
    if (inSel(x, y)) {
      lift(e.altKey || e.ctrlKey || e.metaKey);
      moving = { x0: x, y0: y, fx: floating.x, fy: floating.y };
    } else {
      deselect();
      marquee = { x0: x, y0: y };
      sel = normRect(x, y, x, y);
    }
    drawArt();
    drawOver();
    return;
  }
  if (e.altKey || st.tool === 'picker') {
    pick(x, y);
    return;
  }
  const erase = e.button === 2 || st.tool === 'eraser';
  const value = erase ? CLEAR : st.color;
  if (st.tool === 'fill') {
    const before = st.art.slice();
    if (fill(st.art, x, y, value, st.mirror)) commit(before);
    return;
  }
  if (st.tool === 'rect' || st.tool === 'ellipse') {
    shape = { base: st.art.slice(), x0: x, y0: y, value };
    drawShape(x, y, e.shiftKey);
    return;
  }
  stroke = { before: st.art.slice(), last: [x, y], value };
  brush(st.art, x, y, value, st.size, st.mirror);
  drawArt();
});
over.addEventListener('pointermove', (e) => {
  const [x, y] = cellOf(e);
  hover = [x, y];
  if (stroke) {
    line(stroke.last[0], stroke.last[1], x, y, (px, py) => brush(st.art, px, py, stroke.value, st.size, st.mirror));
    stroke.last = [x, y];
    drawArt();
  } else if (shape) drawShape(x, y, e.shiftKey);
  else if (marquee) sel = normRect(marquee.x0, marquee.y0, x, y);
  else if (moving) {
    floating.x = moving.fx + x - moving.x0;
    floating.y = moving.fy + y - moving.y0;
    sel.x = floating.x;
    sel.y = floating.y;
    drawArt();
  }
  drawOver();
  status();
});
const endStroke = () => {
  if (stroke) {
    const { before } = stroke;
    stroke = null;
    commit(before);
  }
  if (shape) {
    const { base } = shape;
    shape = null;
    commit(base);
  }
  if (marquee) {
    marquee = null;
    if (sel.w * sel.h === 1) sel = null; // a click, not a drag
    drawOver();
  }
  if (moving) {
    moving = null;
    changed();
  }
};
over.addEventListener('pointerup', endStroke);
over.addEventListener('pointercancel', endStroke);
over.addEventListener('pointerleave', () => {
  hover = null;
  drawOver();
  status();
});

function undo() {
  drop();
  sel = null;
  if (!undoStack.length) return changed();
  redoStack.push(st.art);
  st.art = undoStack.pop();
  st.frames.push(artData(st.art));
  changed();
}
function redo() {
  drop();
  sel = null;
  if (!redoStack.length) return changed();
  undoStack.push(st.art);
  st.art = redoStack.pop();
  st.frames.push(artData(st.art));
  changed();
}

// A new drawing (blank, a house waifu, a pasted code): the old one stays one Ctrl+Z away; the timelapse restarts.
function startFrom(art, name = null) {
  deselect();
  undoStack.push(st.art);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack = [];
  st.art = art;
  if (name !== null) st.name = name;
  st.frames = [artData(art)];
  changed();
  renderPanel();
}

document.addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  const k = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  const act = (fn) => {
    e.preventDefault();
    fn();
  };
  if (mod && k === 'z') return act(() => (e.shiftKey ? redo() : undo()));
  if (mod && k === 'y') return act(redo);
  if (mod && k === 'c' && sel) return act(() => copySel());
  if (mod && k === 'x' && sel) return act(() => copySel(true));
  if (mod && k === 'v' && clip) return act(pasteClip);
  if (mod && k === 'd') return act(deselect);
  if (mod && k === 'a') {
    return act(() => {
      setTool('select');
      sel = { x: 0, y: 0, w: SIZE, h: SIZE };
      drawOver();
    });
  }
  if (mod || e.altKey) return;
  if (sel && (e.key === 'Delete' || e.key === 'Backspace')) return act(deleteSel);
  if (sel && (e.key === 'Enter' || e.key === 'Escape')) return act(deselect);
  const arrow = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k];
  if (sel && arrow) return act(() => nudge(...arrow));
  if (sel && k === 'h') return act(flipSel);
  const tool = { b: 'pencil', e: 'eraser', g: 'fill', i: 'picker', s: 'select', r: 'rect', o: 'ellipse' }[k];
  if (tool) setTool(tool);
  else if (k === 'm') toggle('mirror');
  else if (k === 'f') toggle('filled');
  else if ('1234'.includes(k) && k.length === 1) setSize(Number(k));
  else if (k === '[') setSize(st.size - 1);
  else if (k === ']') setSize(st.size + 1);
});
window.addEventListener('pagehide', () => {
  drop();
  saveNow();
});

// ---------- toolbar ----------
const toolbar = $('#toolbar');
const toolBtns = {};
function buildToolbar() {
  const t = T[st.lang];
  const btn = (id, onClick, label = t.tools[id]) => {
    const b = h('button', { type: 'button', class: 'btn raised tool', title: label, 'aria-label': label }, gridCanvas(ICONS[id], ICON_COLORS));
    b.addEventListener('click', onClick);
    toolBtns[id] = b;
    return b;
  };
  const sep = () => h('div', { class: 'tsep', 'aria-hidden': 'true' });
  toolbar.replaceChildren(
    ...TOOLS.map((id) => btn(id, () => setTool(id))),
    btn('filled', () => toggle('filled')),
    sep(),
    ...[1, 2, 3, 4].map((n) => btn(`size${n}`, () => setSize(n), t.tools.size(n))),
    sep(),
    btn('mirror', () => toggle('mirror')),
    btn('grid', () => toggle('grid')),
    btn('guide', () => toggle('guide')),
    sep(),
    btn('undo', undo),
    btn('redo', redo),
  );
}
function toggle(k) {
  st[k] = !st[k];
  sync();
  save();
}

// ---------- the panel ----------
let syncers = [];

function section(id, title, body, openByDefault = true) {
  const open = st.open[id] ?? openByDefault;
  const wrapEl = h('div', { class: 'sec-body', id: `sec-${id}` }, body);
  wrapEl.hidden = !open;
  const head = h('button', { type: 'button', class: 'sec-head', 'aria-expanded': String(open), 'aria-controls': `sec-${id}` },
    h('span', { class: 'arrow', 'aria-hidden': 'true' }), h('span', { text: title }), h('span', { class: 'rule', 'aria-hidden': 'true' }));
  head.addEventListener('click', () => {
    const now = wrapEl.hidden;
    wrapEl.hidden = !now;
    head.setAttribute('aria-expanded', String(now));
    st.open[id] = now;
    save();
  });
  return h('div', { class: 'sec' }, head, wrapEl);
}

function renderColorbar() {
  const sws = PAL_ORDER.map((k, i) => {
    const b = h('button', { type: 'button', class: 'swatch', style: `background:${PAL[k]}`, title: `${k} ${PAL[k]}`, 'aria-label': k });
    b.addEventListener('click', () => {
      st.color = i;
      if (['eraser', 'picker', 'select'].includes(st.tool)) setTool('pencil');
      sync();
      save();
    });
    return b;
  });
  const chip = h('span', { class: 'chip' });
  const label = h('span', { class: 'cur-name' });
  colorSync = () => {
    sws.forEach((b, i) => b.setAttribute('aria-pressed', String(i === st.color)));
    chip.style.background = PAL[PAL_ORDER[st.color]];
    label.textContent = PAL_ORDER[st.color];
  };
  $('#colorbar').replaceChildren(h('div', { class: 'current' }, chip, label), h('div', { class: 'swatches' }, sws));
}
let colorSync = () => {};

function nameBody(t) {
  const input = h('input', { value: st.name, placeholder: t.namePh, maxlength: '12', autocomplete: 'off', spellcheck: 'false', 'aria-label': t.secName });
  input.addEventListener('input', () => {
    const clean = input.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
    if (clean !== input.value) input.value = clean;
    st.name = clean;
    changed(false);
  });
  return [h('label', { class: 'entry big sunken' }, input), h('p', { class: 'note', text: t.nameNote })];
}

function startBody(t) {
  const blankBtn = h('button', { type: 'button', class: 'btn raised pick', title: t.blank }, h('span', { class: 'empty-who', text: '' }), h('span', { class: 'lbl', text: t.blank }));
  blankBtn.addEventListener('click', () => startFrom(blank()));
  const houses = Object.keys(WAIFUS).map((id) => {
    const b = h('button', { type: 'button', class: 'btn raised pick', title: WAIFUS[id].name }, imgCanvas(WAIFUS[id].img, 'who'), h('span', { class: 'lbl', text: WAIFUS[id].name }));
    b.addEventListener('click', () => startFrom(fromImg(WAIFUS[id].img)));
    return b;
  });
  const codeIn = h('input', { placeholder: t.loadPh, autocomplete: 'off', spellcheck: 'false' });
  const codeNote = h('p', { class: 'note' });
  codeIn.addEventListener('input', () => {
    const v = codeIn.value.trim();
    if (!v) return note(codeNote, '', '');
    const w = decodeWaifu(v);
    if (!w) return note(codeNote, 'warn', t.loadBad);
    startFrom(fromImg(w.img), w.name);
  });
  return [h('div', { class: 'picks starts' }, blankBtn, houses), h('p', { class: 'note', text: t.startNote }),
    h('label', { class: 'entry code sunken' }, h('span', { class: 'prefix', text: `${t.loadLabel}: ` }), codeIn), codeNote];
}

// Her on a balcony, at the size she has on a 1080p stream: world pixels ×4, her pixels ×3 (the game draws her
// on a 3/4 scale layer), breathing with the game's own idle.
const PREVIEW = { w: 96, h: 54, scale: 4 };
const bases = new Map();
function previewBase(worldId) {
  if (!bases.has(worldId)) {
    const map = WORLDS[worldId].final;
    const full = imgCanvas(flatten(composeLevel(map), map, 0));
    const cx = map.waifu.x + 16;
    const bottom = map.waifu.y + 32;
    const x0 = Math.max(0, Math.min(full.width - PREVIEW.w, cx - 76));
    const y0 = Math.max(0, bottom + 6 - PREVIEW.h);
    const c = h('canvas', { width: String(PREVIEW.w * PREVIEW.scale), height: String(PREVIEW.h * PREVIEW.scale) });
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(full, x0, y0, PREVIEW.w, PREVIEW.h, 0, 0, c.width, c.height);
    bases.set(worldId, { canvas: c, cx: (cx - x0) * PREVIEW.scale, bottom: (bottom - y0) * PREVIEW.scale });
  }
  return bases.get(worldId);
}
let herCanvas = null;
let previewCanvas = null;
function previewBody(t) {
  previewCanvas = h('canvas', { class: 'ingame', width: String(PREVIEW.w * PREVIEW.scale), height: String(PREVIEW.h * PREVIEW.scale) });
  const worldName = h('span', { class: 'app-ask' });
  const next = h('button', { type: 'button', class: 'btn raised cut', text: t.otherWorld });
  next.addEventListener('click', () => {
    st.world = (st.world + 1) % WORLD_IDS.length;
    sync();
    save();
  });
  syncers.push(() => (worldName.textContent = WORLDS[WORLD_IDS[st.world]].name[st.lang]));
  return [previewCanvas, h('div', { class: 'row-btns' }, next, worldName), h('p', { class: 'note', text: t.previewNote })];
}
function drawPreview(time) {
  if (sel) {
    ants = Math.floor(time / 60) % 1000;
    drawOver();
  }
  if (previewCanvas && previewCanvas.isConnected) {
    const g = previewCanvas.getContext('2d');
    const base = previewBase(WORLD_IDS[st.world]);
    g.imageSmoothingEnabled = false;
    g.drawImage(base.canvas, 0, 0);
    if (herCanvas) {
      const u = ((time / 1000) % 1.05) / 1.05;
      const ease = (k) => k * k * (3 - 2 * k);
      let sy;
      if (u < 0.35) sy = 1 - 0.08 * ease(u / 0.35);
      else if (u < 0.62) sy = 0.92 + 0.13 * ease((u - 0.35) / 0.27);
      else sy = 1.05 - 0.05 * ease((u - 0.62) / 0.38);
      const sx = 1 + (1 - sy) * 0.6;
      const scale = 3;
      const lift = sy > 1 ? Math.round((sy - 1) * 40 * scale) : 0;
      const w = Math.round(SIZE * scale * sx);
      const hh = Math.round(SIZE * scale * sy);
      g.drawImage(herCanvas, Math.round(base.cx - w / 2), Math.round(base.bottom - hh - lift), w, hh);
    }
  }
  requestAnimationFrame(drawPreview);
}

function timeBody(t) {
  const count = h('p', { class: 'note' });
  const gifBtn = h('button', { type: 'button', class: 'btn raised cut', text: t.saveGif });
  gifBtn.addEventListener('click', async () => {
    gifBtn.disabled = true;
    gifBtn.textContent = t.making;
    try {
      await saveGif();
    } finally {
      gifBtn.textContent = T[st.lang].saveGif;
      sync();
    }
  });
  syncers.push(() => {
    const n = st.frames.length;
    note(count, '', n > 1 ? `${t.timeCount(n)}. ${t.timeNote}` : t.timeEmpty);
    gifBtn.disabled = n < 2 || isEmpty(st.art);
  });
  return [h('div', { class: 'row-btns' }, gifBtn), count];
}

function renderPanel() {
  syncers = [];
  const t = T[st.lang];
  $('#options').replaceChildren(
    section('mine', t.mineTitle, mineBody(t)),
    section('name', t.secName, nameBody(t)),
    section('preview', t.secPreview, previewBody(t)),
    section('start', t.secStart, startBody(t)),
    section('time', t.secTime, timeBody(t)),
  );
  sync();
}

// ---------- code, status ----------
const codeOut = $('#codeOut');
const copyBtn = $('#copyCode');
const useBtn = $('#useHer');
let copyTimer = 0;

const code = () => {
  const art = current();
  return isEmpty(art) ? '' : encodeWaifu(toImg(art), st.name || 'Waifu');
};

function status() {
  const t = T[st.lang];
  $('#stPos').textContent = hover ? t.stPos(hover[0], hover[1]) : '';
  const under = hover ? current()[hover[1] * SIZE + hover[0]] : st.color;
  const chip = $('#stChip');
  chip.style.background = under === CLEAR ? 'transparent' : PAL[PAL_ORDER[under]];
  $('#stColor').textContent = under === CLEAR ? t.clear : PAL_ORDER[under];
  $('#stTool').textContent = SIZED.includes(st.tool) ? `${t.toolNames[st.tool]} · ${st.size} px` : t.toolNames[st.tool];
  $('#stHint').textContent = t.hints[st.tool] || t.stHint;
}

function sync() {
  const t = T[st.lang];
  for (const id of TOOLS) toolBtns[id]?.setAttribute('aria-pressed', String(st.tool === id));
  for (const id of ['mirror', 'grid', 'guide', 'filled']) toolBtns[id]?.setAttribute('aria-pressed', String(st[id]));
  for (const n of [1, 2, 3, 4]) toolBtns[`size${n}`]?.setAttribute('aria-pressed', String(st.size === n));
  if (toolBtns.undo) toolBtns.undo.disabled = !undoStack.length;
  if (toolBtns.redo) toolBtns.redo.disabled = !redoStack.length;
  over.style.cursor = st.tool === 'picker' ? 'copy' : st.tool === 'fill' ? 'cell' : 'crosshair';
  colorSync();
  for (const s of syncers) s();
  const c = code();
  codeOut.classList.toggle('pending', !c);
  codeOut.textContent = c || t.codeEmpty;
  $('#codeLen').textContent = c ? t.codeLen(c.length) : '';
  copyBtn.disabled = !c;
  useBtn.disabled = !c;
  if (!copyBtn.classList.contains('done')) copyBtn.textContent = t.copy;
  useBtn.textContent = t.use;
  useBtn.title = t.useTip;
  drawArt();
  drawOver();
  status();
}

function changed(redraw = true) {
  const art = current();
  herCanvas = isEmpty(art) ? null : imgCanvas(toImg(art));
  if (redraw) drawArt();
  sync();
  save();
}

copyBtn.addEventListener('click', async () => {
  const c = code();
  if (!c) return;
  try {
    await navigator.clipboard.writeText(c);
  } catch {
    const r = document.createRange();
    r.selectNodeContents(codeOut);
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    document.execCommand('copy');
  }
  copyBtn.classList.add('done');
  copyBtn.textContent = T[st.lang].copied;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyBtn.classList.remove('done');
    copyBtn.textContent = T[st.lang].copy;
  }, 1600);
});
useBtn.addEventListener('click', () => {
  const c = code();
  if (c) location.href = `./#waifu=${encodeURIComponent(c)}`;
});

// ---------- the timelapse GIF ----------
const fontsReady = loadFonts().catch(() => {});
const GIF_FRAMES = 150;

async function saveGif() {
  await fontsReady;
  const all = st.frames.map(artFromData).filter(Boolean);
  if (!sameArt(all[all.length - 1] || blank(), current())) all.push(current().slice());
  const picked = all.length <= GIF_FRAMES ? all : Array.from({ length: GIF_FRAMES }, (_, i) => all[Math.round((i * (all.length - 1)) / (GIF_FRAMES - 1))]);
  const SCALE = 8;
  const M = 24;
  const art = SIZE * SCALE;
  const title = textSprite(cleanName(st.name || 'Waifu'), { font: 'title', color: 'white', shadow: 'ink', scale: 3 });
  const c1 = textSprite('yeet2waifu', { font: 'name', color: 'white', shadow: 'ink', scale: 2 });
  const c2 = textSprite('by:@haru717171x', { font: 'name', color: 'yellow', shadow: 'ink', scale: 2 });
  const W = Math.max(art + 2 * M + 8, c1.width + c2.width + 8 + 2 * M);
  const top = M + title.height + 14;
  const H = top + art + 4 + 18 + c1.height + M;
  const cv = h('canvas', { width: String(W), height: String(H) });
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  const tile = h('canvas', { width: String(SIZE), height: String(SIZE) });
  const palette = PAL_ORDER.map((k) => RGBA[k].slice(0, 3));
  const exact = new Map(palette.map((c, i) => [(c[0] << 16) | (c[1] << 8) | c[2], i]));
  const nearest = (r, gg, b) => {
    let best = 0;
    let bd = Infinity;
    palette.forEach((c, i) => {
      const d = (r - c[0]) ** 2 + (gg - c[1]) ** 2 + (b - c[2]) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const ax = Math.round((W - art) / 2);
  const frames = picked.map((a) => {
    g.fillStyle = PAL.slate;
    g.fillRect(0, 0, W, H);
    g.fillStyle = PAL.ink;
    g.fillRect(ax - 4, top - 4, art + 8, art + 8);
    g.fillStyle = PAL.silver;
    g.fillRect(ax, top, art, art);
    paintImg(tile, toImg(a));
    g.drawImage(tile, ax, top, art, art);
    g.drawImage(title, Math.round((W - title.width) / 2), M);
    const cx = Math.round((W - c1.width - c2.width - 8) / 2);
    g.drawImage(c1, cx, H - M - c1.height);
    g.drawImage(c2, cx + c1.width + 8, H - M - c2.height);
    const d = g.getImageData(0, 0, W, H).data;
    const idx = new Uint8Array(W * H);
    for (let i = 0, p = 0; p < idx.length; i += 4, p++) {
      const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      idx[p] = exact.get(key) ?? nearest(d[i], d[i + 1], d[i + 2]);
    }
    return idx;
  });
  const delays = frames.map((_, i) => (i === 0 ? 60 : i === frames.length - 1 ? 300 : 8));
  const gif = encodeGif(frames, W, H, palette, delays);
  const a = h('a', { href: URL.createObjectURL(new Blob([gif], { type: 'image/gif' })), download: `${cleanName(st.name || 'Waifu')}_timelapse.gif` });
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 4000);
}

// ---------- the static parts, language ----------
function applyStatic() {
  const t = T[st.lang];
  document.documentElement.lang = st.lang;
  for (const el of document.querySelectorAll('[data-t]')) {
    const v = t[el.dataset.t];
    if (typeof v === 'string') el.textContent = v;
  }
  for (const b of document.querySelectorAll('[data-ui-lang]')) b.setAttribute('aria-pressed', String(b.dataset.uiLang === st.lang));
  $('#stHint').textContent = t.stHint;
  $('#version').textContent = `v${VERSION}`;
}

for (const b of document.querySelectorAll('[data-ui-lang]')) {
  b.addEventListener('click', () => {
    st.lang = b.dataset.uiLang;
    writeLang(st.lang);
    applyStatic();
    buildToolbar();
    renderPanel();
  });
}

// ---------- start ----------
load();
appIcon($('#appIcon'));
renderColorbar();
applyStatic();
buildToolbar();
renderPanel();
changed();
new ResizeObserver(layout).observe(stage);
layout();
requestAnimationFrame(drawPreview);
