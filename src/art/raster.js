// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Pixel art as text: a sprite is rows of characters plus a key that maps each character to a palette name.
// '.' (and ' ') are transparent. Everything rasterizes to plain RGBA buffers, so the same code draws the
// game in the browser and the PNG previews in node.
import { RGBA } from './palette.js';

export function makeImage(w, h) {
  return { w, h, px: new Uint8ClampedArray(w * h * 4) };
}

export function sprite(key, text) {
  const rows = text.split('\n').map((r) => r.replace(/\s+$/, '')).filter((r) => r.length);
  const w = Math.max(...rows.map((r) => r.length));
  const img = makeImage(w, rows.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const name = key[ch];
      if (!name) throw new Error(`sprite: no color for '${ch}'`);
      const c = RGBA[name];
      if (!c) throw new Error(`sprite: unknown palette color '${name}'`);
      img.px.set(c, (y * w + x) * 4);
    }
  });
  return img;
}

export function setPx(img, x, y, c) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  img.px.set(c, (y * img.w + x) * 4);
}

export function getPx(img, x, y) {
  const i = (y * img.w + x) * 4;
  return [img.px[i], img.px[i + 1], img.px[i + 2], img.px[i + 3]];
}

export function fillRect(img, x0, y0, w, h, c) {
  for (let y = Math.max(0, y0); y < Math.min(img.h, y0 + h); y++) {
    for (let x = Math.max(0, x0); x < Math.min(img.w, x0 + w); x++) img.px.set(c, (y * img.w + x) * 4);
  }
}

// Copies src onto dst at (x, y); transparent pixels are skipped (pixel art has no half-alpha).
export function blit(dst, src, x0, y0, { flipX = false } = {}) {
  for (let y = 0; y < src.h; y++) {
    const dy = y0 + y;
    if (dy < 0 || dy >= dst.h) continue;
    for (let x = 0; x < src.w; x++) {
      const dx = x0 + x;
      if (dx < 0 || dx >= dst.w) continue;
      const si = (y * src.w + (flipX ? src.w - 1 - x : x)) * 4;
      if (src.px[si + 3] < 128) continue;
      dst.px.set(src.px.subarray(si, si + 4), (dy * dst.w + dx) * 4);
    }
  }
}

// Swaps palette colors (hair/outfit variants of one chibi, recolored tiles) without redrawing.
export function recolor(src, map) {
  const out = makeImage(src.w, src.h);
  out.px.set(src.px);
  const pairs = Object.entries(map).map(([from, to]) => [RGBA[from], RGBA[to]]);
  for (let i = 0; i < out.px.length; i += 4) {
    if (out.px[i + 3] < 128) continue;
    for (const [a, b] of pairs) {
      if (out.px[i] === a[0] && out.px[i + 1] === a[1] && out.px[i + 2] === a[2]) {
        out.px.set(b, i);
        break;
      }
    }
  }
  return out;
}

// A 1-px outline around everything opaque: the cheapest way to make a sprite read on any background.
export function outline(src, color) {
  const out = makeImage(src.w + 2, src.h + 2);
  const c = RGBA[color];
  const solid = (x, y) => x >= 0 && y >= 0 && x < src.w && y < src.h && src.px[(y * src.w + x) * 4 + 3] >= 128;
  for (let y = -1; y <= src.h; y++) {
    for (let x = -1; x <= src.w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) setPx(out, x + 1, y + 1, c);
    }
  }
  blit(out, src, 1, 1);
  return out;
}
