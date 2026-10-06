// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The pixel kit the worlds are built from: tile patterns (bricks, bevelled blocks, checkers, surface
// bands, slopes) and backdrop painters (stars, moons, skylines, mountains, pillars, sea). Everything
// snaps to the grid and the palette; worlds only choose colors and shapes.
import { RGBA } from './palette.js';
import { makeImage, setPx, getPx, fillRect } from './raster.js';
import { makeRng } from '../rng.js';

export const TILE = 16;
const C = (name) => RGBA[name];

// ---------- tiles ----------

// Brick courses `h` px tall, staggered; mortar lines, a lit top row and a shaded bottom row per brick.
export function brickTile({ base, light, dark, mortar, h = 4, w = 8 }) {
  const img = makeImage(TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    const course = Math.floor(y / h);
    const ry = y % h;
    for (let x = 0; x < TILE; x++) {
      const off = course % 2 ? w / 2 : 0;
      const rx = (x + off) % w;
      let c = base;
      if (ry === h - 1 || rx === w - 1) c = mortar;
      else if (ry === 0) c = light;
      else if (ry === h - 2 && h > 3) c = dark;
      setPx(img, x, y, C(c));
    }
  }
  return img;
}

// A bevelled block: lit top-left edge, shaded bottom-right, dark outline; optional speckles.
export function blockTile({ base, light, dark, line, speckle = null, seed = 1 }) {
  const img = makeImage(TILE, TILE);
  const rng = makeRng(seed);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let c = base;
      if (x === TILE - 1 || y === TILE - 1) c = line;
      else if (x === 0 || y === 0) c = light;
      else if (x === TILE - 2 || y === TILE - 2) c = dark;
      else if (speckle && rng.next() < 0.06) c = speckle;
      setPx(img, x, y, C(c));
    }
  }
  return img;
}

export function checkerTile(a, b, size = 4, line = null) {
  const img = makeImage(TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let c = (Math.floor(x / size) + Math.floor(y / size)) % 2 ? a : b;
      if (line && (y === TILE - 1)) c = line;
      setPx(img, x, y, C(c));
    }
  }
  return img;
}

// Paints a surface band (grass, moss, snow...) over the top rows of a tile, with a ragged lower edge.
export function withTop(fill, band, seed = 3) {
  const img = makeImage(TILE, TILE);
  img.px.set(fill.px);
  const rng = makeRng(seed);
  for (let x = 0; x < TILE; x++) {
    const depth = band.length - (rng.next() < 0.35 ? 1 : 0) + (rng.next() < 0.2 ? 1 : 0);
    for (let y = 0; y < Math.min(depth, TILE); y++) setPx(img, x, y, C(band[Math.min(y, band.length - 1)]));
  }
  return img;
}

// A 45° slope cut from a fill tile, with the surface band following the diagonal.
export function slopeTile(fill, band, dir) {
  const img = makeImage(TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const surface = dir === 'up' ? TILE - 1 - x : x;
      const depth = y - surface;
      if (depth < 0) continue;
      setPx(img, x, y, depth < band.length ? C(band[depth]) : getPx(fill, x, y));
    }
  }
  return img;
}

// Dark 1-px sides where a solid tile meets air, so a cliff reads as a cliff.
export function edges(img, grid, ch, topColor, sideColor, topRows) {
  const at = (x, y) => (grid[y] && grid[y][x]) || '.';
  const slope = (c) => c === '/' || c === '\\';
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== ch) continue;
      for (const [nx, px] of [[x - 1, x * TILE], [x + 1, x * TILE + TILE - 1]]) {
        const n = at(nx, y);
        if (n === ch || slope(n)) continue;
        const top = at(x, y - 1) !== ch && !slope(at(x, y - 1));
        for (let r = 0; r < TILE; r++) setPx(img, px, y * TILE + r, C(top && r < topRows ? topColor : sideColor));
      }
    }
  }
}

// ---------- backdrops ----------

export function stars(img, { seed = 1, count = 60, colors = ['white', 'silver'], maxY = 160 } = {}) {
  const rng = makeRng(seed);
  for (let i = 0; i < count; i++) {
    const x = rng.int(0, img.w - 1);
    const y = rng.int(0, maxY);
    const c = C(rng.pick(colors));
    setPx(img, x, y, c);
    if (rng.next() < 0.12) {
      setPx(img, x - 1, y, c);
      setPx(img, x + 1, y, c);
      setPx(img, x, y - 1, c);
      setPx(img, x, y + 1, c);
    }
  }
}

export function moon(img, cx, cy, r, { light = 'sand', shade = 'tan', glow = null, craters = 'tan' } = {}) {
  if (glow) {
    for (let y = cy - r - 6; y <= cy + r + 6; y++) {
      for (let x = cx - r - 6; x <= cx + r + 6; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > r && d <= r + 6 && (x + y) % 2 === 0) setPx(img, x, y, C(glow));
      }
    }
  }
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > r) continue;
      const lit = (x - cx) + (y - cy) < r * 0.6;
      setPx(img, x, y, C(lit ? light : shade));
    }
  }
  const rng = makeRng(cx * 7 + cy);
  for (let i = 0; i < Math.max(3, r / 3); i++) {
    const a = rng.range(0, Math.PI * 2);
    const d = rng.range(0, r * 0.6);
    const cr = rng.range(1, r / 5);
    const mx = cx + Math.cos(a) * d;
    const my = cy + Math.sin(a) * d;
    for (let y = my - cr; y <= my + cr; y++) {
      for (let x = mx - cr; x <= mx + cr; x++) if (Math.hypot(x - mx, y - my) <= cr) setPx(img, Math.round(x), Math.round(y), C(craters));
    }
  }
}

// Skyline of boxy buildings; `lit` = chance a window is lit (0 for a dead city).
export function skyline(img, { seed = 1, baseY = 240, color = 'ink', minH = 30, maxH = 110, lit = 0, window = 'amber' } = {}) {
  const rng = makeRng(seed);
  let x = -rng.int(0, 10);
  while (x < img.w) {
    const w = rng.int(14, 34);
    const h = rng.int(minH, maxH);
    fillRect(img, x, baseY - h, w, h + (img.h - baseY), C(color));
    if (rng.next() < 0.3) fillRect(img, x + Math.floor(w / 2) - 1, baseY - h - rng.int(4, 12), 2, 12, C(color));
    if (lit) {
      for (let wy = baseY - h + 4; wy < baseY - 4; wy += 5) {
        for (let wx = x + 3; wx < x + w - 3; wx += 4) if (rng.next() < lit) fillRect(img, wx, wy, 2, 2, C(window));
      }
    }
    x += w + rng.int(0, 4);
  }
}

// Jagged mountain range; snow caps optional.
export function mountains(img, { seed = 1, baseY = 200, color = 'slate', light = null, minH = 40, maxH = 100, snow = null } = {}) {
  const rng = makeRng(seed);
  const peaks = [];
  for (let x = -40; x < img.w + 40; x += rng.int(50, 90)) peaks.push({ x, h: rng.int(minH, maxH) });
  for (let px = 0; px < img.w; px++) {
    let top = Infinity;
    for (const p of peaks) top = Math.min(top, baseY - p.h + Math.abs(px - p.x) * 1.1);
    top = Math.round(top);
    for (let y = Math.max(0, top); y < img.h; y++) {
      let c = color;
      if (snow && y < top + 5) c = snow;
      else if (light && ((px * 7 + y) % 9 === 0)) c = light;
      setPx(img, px, y, C(c));
    }
  }
}

// Columns (with a capital) standing in a row: halls, temples, dungeons.
export function pillars(img, { seed = 1, every = 64, w = 14, color = 'steel', light = 'slate', dark = 'night', top = 20 } = {}) {
  const rng = makeRng(seed);
  for (let x = rng.int(0, every); x < img.w + w; x += every) {
    fillRect(img, x, top, w, img.h - top, C(color));
    fillRect(img, x + 2, top, 2, img.h - top, C(light));
    fillRect(img, x + w - 3, top, 2, img.h - top, C(dark));
    fillRect(img, x - 3, top, w + 6, 5, C(color));
    fillRect(img, x - 3, top + 5, w + 6, 1, C(dark));
  }
}

// The sea up to the horizon, with glints.
export function sea(img, { y0 = 180, colors = ['blue', 'navy'], glint = 'white', seed = 2 } = {}) {
  const rng = makeRng(seed);
  for (let y = y0; y < img.h; y++) {
    const c = y < y0 + 3 ? colors[0] : colors[1];
    fillRect(img, 0, y, img.w, 1, C(c));
  }
  for (let i = 0; i < img.w / 6; i++) fillRect(img, rng.int(0, img.w), rng.int(y0 + 4, img.h - 1), rng.int(2, 6), 1, C(glint));
}

export function bats(img, { seed = 1, count = 6, color = 'ink', maxY = 120 } = {}) {
  const rng = makeRng(seed);
  const shape = ['X.....X', 'XX.X.XX', '.XXXXX.', '..X.X..'];
  for (let i = 0; i < count; i++) {
    const bx = rng.int(0, img.w - 8);
    const by = rng.int(10, maxY);
    shape.forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && setPx(img, bx + x, by + y, C(color))));
  }
}

// Castle towers in silhouette: crenellated or with a pointed roof and a flag, a few dark arrow slits.
export function castles(img, { seed = 1, baseY = 236, color = 'night', window = 'steel' } = {}) {
  const rng = makeRng(seed);
  let x = rng.int(-10, 20);
  while (x < img.w) {
    const w = rng.int(16, 30);
    const h = rng.int(50, 120);
    const top = baseY - h;
    fillRect(img, x, top, w, img.h - top, C(color));
    if (rng.next() < 0.5) {
      for (let mx = x; mx < x + w; mx += 4) fillRect(img, mx, top - 4, 2, 4, C(color));
    } else {
      const half = Math.ceil(w / 2) + 2;
      for (let r = 0; r < half + 6; r++) {
        const span = Math.max(0, Math.round((r / (half + 6)) * half));
        fillRect(img, x + Math.floor(w / 2) - span, top - (half + 6) + r, span * 2, 1, C(color));
      }
      fillRect(img, x + Math.floor(w / 2), top - half - 14, 1, 8, C(color));
      fillRect(img, x + Math.floor(w / 2) + 1, top - half - 14, 4, 3, C(color));
    }
    for (let k = 0; k < rng.int(1, 3); k++) fillRect(img, x + rng.int(4, Math.max(5, w - 6)), top + rng.int(10, Math.max(12, h - 20)), 2, 5, C(window));
    if (rng.next() < 0.5) fillRect(img, x + w, baseY - rng.int(16, 34), rng.int(12, 30), img.h, C(color));
    x += w + rng.int(10, 40);
  }
}
