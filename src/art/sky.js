// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Procedural backdrops (no sprite sheets needed): banded skies with ordered dithering between bands,
// rounded hill silhouettes and puffy clouds, all snapped to the pixel grid and to the palette.
import { RGBA } from './palette.js';
import { setPx, fillRect } from './raster.js';
import { makeRng } from '../rng.js';

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// bands: [[paletteName, untilY], ...] top to bottom; `dither` px of 4×4 Bayer mix at each boundary.
export function skyBands(img, bands, dither = 6) {
  let top = 0;
  bands.forEach(([name, until], i) => {
    const c = RGBA[name];
    fillRect(img, 0, top, img.w, until - top, c);
    const next = bands[i + 1];
    if (next) {
      const n = RGBA[next[0]];
      for (let y = until - dither; y < until; y++) {
        const t = (y - (until - dither) + 1) / (dither + 1);
        for (let x = 0; x < img.w; x++) if (BAYER4[y & 3][x & 3] / 16 < t) setPx(img, x, y, n);
      }
    }
    top = until;
  });
}

// A row of rounded hills: each hill is a half-ellipse; `stripe` adds vertical highlight stripes.
export function hills(img, { seed, baseY, color, shade, rim, outline, count, minW, maxW, minH, maxH, stripe }) {
  const rng = makeRng(seed);
  const c = RGBA[color];
  const s = shade ? RGBA[shade] : null;
  const o = outline ? RGBA[outline] : null;
  const hs = [];
  let x = -rng.int(0, 30);
  for (let i = 0; i < count && x < img.w + 40; i++) {
    const w = rng.int(minW, maxW);
    const h = rng.int(minH, maxH);
    hs.push({ cx: x + w / 2, w, h });
    x += Math.round(w * rng.range(0.55, 0.9));
  }
  const top = new Array(img.w).fill(Infinity);
  for (const hl of hs) {
    for (let px = Math.floor(hl.cx - hl.w / 2); px <= hl.cx + hl.w / 2; px++) {
      if (px < 0 || px >= img.w) continue;
      const u = (px - hl.cx) / (hl.w / 2);
      const y = Math.round(baseY - hl.h * Math.sqrt(Math.max(0, 1 - u * u)));
      top[px] = Math.min(top[px], y);
    }
  }
  for (let px = 0; px < img.w; px++) {
    if (top[px] === Infinity) continue;
    for (let y = top[px]; y < img.h; y++) {
      let col = c;
      if (s && stripe && (px % stripe === 0 || px % stripe === 1) && y > top[px] + 3) col = s;
      if (rim && y <= top[px] + 2 && (top[px - 1] ?? 0) >= top[px] - 1) col = RGBA[rim];
      setPx(img, px, y, col);
    }
    if (o) {
      setPx(img, px, top[px], o);
      const l = top[px - 1] ?? Infinity;
      const r = top[px + 1] ?? Infinity;
      for (let y = top[px]; y < Math.min(Math.max(l, r), img.h); y++) setPx(img, px, y, o);
    }
  }
}

// Puffy cloud: a union of circles, light on top, shaded underside, optional outline.
export function cloud(img, x0, y0, w, { seed = 1, light = 'white', shade = 'silver', line = null } = {}) {
  const rng = makeRng(seed);
  const h = Math.round(w * 0.45);
  const blobs = [];
  const n = Math.max(3, Math.round(w / 10));
  for (let i = 0; i < n; i++) {
    const r = rng.range(h * 0.35, h * 0.6);
    blobs.push({ x: x0 + r + (i / (n - 1)) * (w - 2 * r), y: y0 + h - r - rng.range(0, h * 0.35), r });
  }
  const inside = (px, py) => blobs.some((b) => (px - b.x) ** 2 + (py - b.y) ** 2 <= b.r * b.r) && py <= y0 + h;
  for (let py = y0 - 2; py <= y0 + h + 1; py++) {
    for (let px = x0 - 2; px <= x0 + w + 2; px++) {
      if (!inside(px, py)) {
        if (line && (inside(px - 1, py) || inside(px + 1, py) || inside(px, py - 1) || inside(px, py + 1))) {
          setPx(img, px, py, RGBA[line]);
        }
        continue;
      }
      const under = !inside(px, py + 2) || py > y0 + h - 3;
      setPx(img, px, py, RGBA[under ? shade : light]);
    }
  }
}
