// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Pixel text. Each string is drawn once at the font's native pixel size (8 px for all three) and its alpha
// is thresholded (no antialiasing gray); then it is blown up by a whole number and, at that size, gets a
// drop shadow thinner than one letter pixel. The shadow goes AFTER the scaling on purpose: a shadow of a
// whole letter pixel fills the 1-px gaps inside W, M and e, and the letters turn into blocks.
import { PAL } from './art/palette.js';

export const FONTS = {
  title: { family: 'Y2W Press', file: 'vendor/fonts/PressStart2P-Regular.ttf', px: 8, base: 7 },
  body: { family: 'Y2W Silk', file: 'vendor/fonts/Silkscreen-Regular.ttf', px: 8, base: 6 },
  name: { family: 'Y2W Tiny', file: 'vendor/fonts/Tiny5-Regular.ttf', px: 8, base: 6 },
};

// Names go on top of everything at full screen resolution in a round, very readable font (Fredoka, OFL):
// white with a thin dark border. Pixel fonts stay for titles and the HUD.
export const LABEL_FONT = { family: 'Y2W Label', file: 'vendor/fonts/Fredoka.ttf', weight: '300 700' };

export async function loadFonts(root = '') {
  await Promise.all(
    [...Object.values(FONTS), LABEL_FONT].map(async (f) => {
      const face = new FontFace(f.family, `url(${root}${f.file})`, f.weight ? { weight: f.weight } : {});
      await face.load();
      document.fonts.add(face);
    })
  );
}

const masks = new Map();
const sprites = new Map();

// The glyph mask at native size: { w, h, on: Uint8Array }. Drawn K times larger and sampled at the CENTER
// of each letter pixel: drawn at 8 px, the browser's read-back canvas smeared W, M and Tiny5 into blobs.
const K = 8;
function mask(str, font) {
  const key = `${font}|${str}`;
  let m = masks.get(key);
  if (m) return m;
  const f = FONTS[font];
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.font = `${f.px * K}px "${f.family}"`;
  const w = Math.max(1, Math.ceil(ctx.measureText(str).width / K)) + 2;
  const h = f.px + 3;
  c.width = w * K;
  c.height = h * K;
  ctx.font = `${f.px * K}px "${f.family}"`;
  ctx.fillStyle = '#fff';
  ctx.fillText(str, K, (1 + f.base) * K);
  const data = ctx.getImageData(0, 0, w * K, h * K).data;
  const on = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((y * K + K / 2) * w * K + (x * K + K / 2)) * 4;
      on[y * w + x] = data[i + 3] > 127 ? 1 : 0;
    }
  }
  m = { w, h, on };
  if (masks.size > 3000) masks.clear();
  masks.set(key, m);
  return m;
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function textSprite(str, { font = 'body', color = 'white', shadow = 'ink', scale = 1 } = {}) {
  const key = `${font}|${color}|${shadow}|${scale}|${str}`;
  let c = sprites.get(key);
  if (c) return c;
  const m = mask(str, font);
  const sh = shadow && scale >= 2 ? Math.max(1, Math.floor(scale / 2)) : 0;
  const w = m.w * scale + sh;
  const h = m.h * scale + sh;
  c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const fill = [...hexRgb(PAL[color]), 255];
  const dark = shadow ? [...hexRgb(PAL[shadow]), 255] : null;
  const at = (x, y) => {
    const gx = Math.floor(x / scale);
    const gy = Math.floor(y / scale);
    return x >= 0 && y >= 0 && gx < m.w && gy < m.h && m.on[gy * m.w + gx] === 1;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (at(x, y)) img.data.set(fill, (y * w + x) * 4);
      else if (sh && at(x - sh, y - sh)) img.data.set(dark, (y * w + x) * 4);
    }
  }
  ctx.putImageData(img, 0, 0);
  if (sprites.size > 2000) sprites.clear();
  sprites.set(key, c);
  return c;
}

// Draws text at a whole-number scale; align: 'left' | 'center' | 'right'; y = top. Returns the width.
export function drawText(ctx, str, x, y, { align = 'left', ...opts } = {}) {
  const s = textSprite(str, opts);
  const dx = align === 'center' ? Math.round(x - s.width / 2) : align === 'right' ? Math.round(x - s.width) : Math.round(x);
  ctx.drawImage(s, dx, Math.round(y));
  return s.width;
}
