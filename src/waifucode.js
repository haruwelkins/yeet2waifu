// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Waifu codes: a whole 32×32 waifu in a short string that fits in an OBS URL or a post.
//   <name>.<data>   name = 1-12 letters/digits · data = '1' (version) + runs of 2 characters:
//   [palette index 0-31, or 32 = transparent][run length 1-64], in reading order, 1024 pixels in all.
// The palette is ENDESGA 32 in palette.js order, so a code always draws the same in every copy of the game.
import { PAL_ORDER, RGBA } from './art/palette.js';
import { makeImage } from './art/raster.js';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.';
const SIZE = 32;
const CLEAR = 32;

function indexOf(px, i) {
  if (px[i + 3] < 128) return CLEAR;
  for (let k = 0; k < PAL_ORDER.length; k++) {
    const c = RGBA[PAL_ORDER[k]];
    if (px[i] === c[0] && px[i + 1] === c[1] && px[i + 2] === c[2]) return k;
  }
  // off-palette pixels snap to the nearest palette color
  let best = 0;
  let bestD = Infinity;
  for (let k = 0; k < PAL_ORDER.length; k++) {
    const c = RGBA[PAL_ORDER[k]];
    const d = (px[i] - c[0]) ** 2 + (px[i + 1] - c[1]) ** 2 + (px[i + 2] - c[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best;
}

export function cleanName(name) {
  return String(name || 'Waifu').replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'Waifu';
}

export function encodeWaifu(img, name) {
  if (img.w !== SIZE || img.h !== SIZE) throw new Error('a waifu is 32×32');
  const idx = [];
  for (let i = 0; i < SIZE * SIZE * 4; i += 4) idx.push(indexOf(img.px, i));
  let data = '1';
  for (let i = 0; i < idx.length; ) {
    let n = 1;
    while (i + n < idx.length && idx[i + n] === idx[i] && n < 64) n++;
    data += ABC[idx[i]] + ABC[n - 1];
    i += n;
  }
  return `${cleanName(name)}.${data}`;
}

// Returns { name, img } or null if the code is not a valid waifu.
export function decodeWaifu(code) {
  const m = /^([A-Za-z0-9]{1,12})\.1([A-Za-z0-9_.]+)$/.exec(String(code).trim());
  if (!m || m[2].length % 2) return null;
  const img = makeImage(SIZE, SIZE);
  let p = 0;
  for (let i = 0; i < m[2].length; i += 2) {
    const k = ABC.indexOf(m[2][i]);
    const n = ABC.indexOf(m[2][i + 1]) + 1;
    if (k < 0 || k > CLEAR || n < 1 || p + n > SIZE * SIZE) return null;
    for (let j = 0; j < n; j++, p++) if (k !== CLEAR) img.px.set(RGBA[PAL_ORDER[k]], p * 4);
  }
  return p === SIZE * SIZE ? { name: m[1], img } : null;
}
