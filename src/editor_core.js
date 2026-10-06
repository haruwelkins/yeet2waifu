// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The waifu editor's insides, without the page: the 32×32 art as palette indices, the tools, the timelapse
// frames and a small GIF encoder. src/draw.js is the page around it.
import { PAL_ORDER, RGBA } from './art/palette.js';
import { makeImage } from './art/raster.js';
import { encodeWaifu, decodeWaifu } from './waifucode.js';

export const SIZE = 32;
export const CLEAR = 32; // the transparent "color", as in waifu codes

export const blank = () => new Uint8Array(SIZE * SIZE).fill(CLEAR);
export const isEmpty = (art) => art.every((c) => c === CLEAR);
export const sameArt = (a, b) => a.length === b.length && a.every((c, i) => c === b[i]);

export function toImg(art) {
  const img = makeImage(SIZE, SIZE);
  for (let i = 0; i < art.length; i++) if (art[i] !== CLEAR) img.px.set(RGBA[PAL_ORDER[art[i]]], i * 4);
  return img;
}

const EXACT = new Map(PAL_ORDER.map((k, i) => [`${RGBA[k][0]},${RGBA[k][1]},${RGBA[k][2]}`, i]));

// Any 32×32 image (a house waifu, a decoded code) back to indices; off palette colors snap like codes do.
export function fromImg(img) {
  const snapped = decodeWaifu(encodeWaifu(img, 'x')).img;
  const art = blank();
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (snapped.px[i * 4 + 3] < 128) continue;
    art[i] = EXACT.get(`${snapped.px[i * 4]},${snapped.px[i * 4 + 1]},${snapped.px[i * 4 + 2]}`) ?? CLEAR;
  }
  return art;
}

// One timelapse frame = the code's data part (a few hundred characters), so a long session still fits in storage.
export function artData(art) {
  const code = encodeWaifu(toImg(art), 'x');
  return code.slice(code.indexOf('.') + 1);
}
export function artFromData(data) {
  const w = decodeWaifu(`x.${data}`);
  return w ? fromImg(w.img) : null;
}

// Mirror paints the same pixel on the other side of the vertical middle (faces, bows, twin tails).
export function paint(art, x, y, c, mirror = false) {
  let changed = false;
  for (const px of mirror ? [x, SIZE - 1 - x] : [x]) {
    if (px < 0 || y < 0 || px >= SIZE || y >= SIZE) continue;
    const i = y * SIZE + px;
    if (art[i] !== c) {
      art[i] = c;
      changed = true;
    }
  }
  return changed;
}

// A square brush of 1-4 pixels around (x, y) (for an even size the extra pixel goes right/down).
export function brush(art, x, y, c, size = 1, mirror = false) {
  const a = Math.floor((size - 1) / 2);
  let changed = false;
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) changed = paint(art, x - a + dx, y - a + dy, c, mirror) || changed;
  }
  return changed;
}

// Shapes from two corners: every pixel to paint. Outline thickness = the brush size.
export function rectPixels(x0, y0, x1, y1, filled = false, size = 1) {
  const l = Math.min(x0, x1);
  const r = Math.max(x0, x1);
  const t = Math.min(y0, y1);
  const b = Math.max(y0, y1);
  const out = [];
  for (let y = t; y <= b; y++) {
    for (let x = l; x <= r; x++) if (filled || x - l < size || r - x < size || y - t < size || b - y < size) out.push([x, y]);
  }
  return out;
}

export function ellipsePixels(x0, y0, x1, y1, filled = false, size = 1) {
  const l = Math.min(x0, x1);
  const r = Math.max(x0, x1) + 1;
  const t = Math.min(y0, y1);
  const b = Math.max(y0, y1) + 1;
  const cx = (l + r) / 2;
  const cy = (t + b) / 2;
  const rx = (r - l) / 2;
  const ry = (b - t) / 2;
  const inside = (x, y, ex = rx, ey = ry) => ex > 0 && ey > 0 && ((x + 0.5 - cx) / ex) ** 2 + ((y + 0.5 - cy) / ey) ** 2 <= 1;
  const out = [];
  for (let y = t; y < b; y++) {
    for (let x = l; x < r; x++) {
      if (!inside(x, y)) continue;
      if (filled) out.push([x, y]);
      else if (size <= 1) {
        if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) out.push([x, y]);
      } else if (!inside(x, y, rx - size, ry - size)) out.push([x, y]);
    }
  }
  return out;
}

// ---------------- selection ----------------
export function normRect(x0, y0, x1, y1) {
  return { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0) + 1, h: Math.abs(y1 - y0) + 1 };
}
// A piece of the art ({w, h, px}); outside the canvas reads as transparent.
export function copyRect(art, r) {
  const px = new Uint8Array(r.w * r.h).fill(CLEAR);
  for (let y = 0; y < r.h; y++) {
    for (let x = 0; x < r.w; x++) {
      const ax = r.x + x;
      const ay = r.y + y;
      if (ax >= 0 && ay >= 0 && ax < SIZE && ay < SIZE) px[y * r.w + x] = art[ay * SIZE + ax];
    }
  }
  return { w: r.w, h: r.h, px };
}
export function clearRect(art, r) {
  for (let y = Math.max(0, r.y); y < Math.min(SIZE, r.y + r.h); y++) {
    for (let x = Math.max(0, r.x); x < Math.min(SIZE, r.x + r.w); x++) art[y * SIZE + x] = CLEAR;
  }
}
// Pasted like Aseprite: its transparent pixels let the art below show.
export function pasteBuf(art, buf, x0, y0) {
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      const c = buf.px[y * buf.w + x];
      const ax = x0 + x;
      const ay = y0 + y;
      if (c !== CLEAR && ax >= 0 && ay >= 0 && ax < SIZE && ay < SIZE) art[ay * SIZE + ax] = c;
    }
  }
}
export function flipBuf(buf) {
  const px = new Uint8Array(buf.px.length);
  for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) px[y * buf.w + x] = buf.px[y * buf.w + (buf.w - 1 - x)];
  return { w: buf.w, h: buf.h, px };
}

// Every pixel between two points (Bresenham), so a fast drag leaves no gaps.
export function line(x0, y0, x1, y1, fn) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    fn(x0, y0);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// The paint bucket: the touching pixels of the same color (4 neighbours, like Aseprite's default).
export function fill(art, x, y, c, mirror = false) {
  const one = (fx) => {
    if (fx < 0 || y < 0 || fx >= SIZE || y >= SIZE) return false;
    const target = art[y * SIZE + fx];
    if (target === c) return false;
    const stack = [[fx, y]];
    while (stack.length) {
      const [px, py] = stack.pop();
      if (px < 0 || py < 0 || px >= SIZE || py >= SIZE || art[py * SIZE + px] !== target) continue;
      art[py * SIZE + px] = c;
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
    return true;
  };
  const a = one(x);
  const b = mirror ? one(SIZE - 1 - x) : false;
  return a || b;
}

// ---------------- GIF ----------------
// frames: arrays of palette indices (w×h each); palette: [[r,g,b], ...] with a power of two length (2..256);
// delays: hundredths of a second per frame. Loops forever. LZW as in the GIF89a spec (same scheme as omggif).
export function encodeGif(frames, w, h, palette, delays) {
  const out = [];
  const put = (...b) => {
    for (const x of b) out.push(x & 255);
  };
  const word = (n) => put(n & 255, (n >> 8) & 255);
  const text = (s) => [...s].forEach((ch) => put(ch.charCodeAt(0)));
  const bits = Math.max(1, Math.ceil(Math.log2(palette.length)));
  text('GIF89a');
  word(w);
  word(h);
  put(0x80 | ((bits - 1) << 4) | (bits - 1), 0, 0);
  for (let i = 0; i < 1 << bits; i++) put(...(palette[i] || [0, 0, 0]));
  put(0x21, 0xff, 0x0b);
  text('NETSCAPE2.0');
  put(0x03, 0x01, 0x00, 0x00, 0x00);
  const minCode = Math.max(2, bits);
  frames.forEach((idx, f) => {
    put(0x21, 0xf9, 0x04, 0x04);
    word(delays[f] ?? 10);
    put(0x00, 0x00);
    put(0x2c);
    word(0);
    word(0);
    word(w);
    word(h);
    put(0x00, minCode);
    const data = lzw(idx, minCode);
    for (let i = 0; i < data.length; i += 255) {
      const n = Math.min(255, data.length - i);
      put(n);
      for (let j = 0; j < n; j++) out.push(data[i + j]);
    }
    put(0x00);
  });
  put(0x3b);
  return new Uint8Array(out);
}

function lzw(index, minCode) {
  const out = [];
  let cur = 0;
  let shift = 0;
  const clear = 1 << minCode;
  const eoi = clear + 1;
  let next = eoi + 1;
  let size = minCode + 1;
  let table = new Map();
  const emit = (code) => {
    cur |= code << shift;
    shift += size;
    while (shift >= 8) {
      out.push(cur & 0xff);
      cur >>= 8;
      shift -= 8;
    }
  };
  emit(clear);
  let prefix = index[0];
  for (let i = 1; i < index.length; i++) {
    const k = index[i];
    const key = (prefix << 8) | k;
    const found = table.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    emit(prefix);
    if (next === 4096) {
      emit(clear);
      next = eoi + 1;
      size = minCode + 1;
      table = new Map();
    } else {
      if (next >= 1 << size) size++;
      table.set(key, next++);
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (shift > 0) out.push(cur & 0xff);
  return out;
}
