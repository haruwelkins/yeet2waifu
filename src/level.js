// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Levels are a grid of 16-px tiles, 17 rows tall (the 17th is cut to 14 px by the 270-px screen) and at
// least 30 columns wide; longer courses scroll. Objects go in pixels. The same grid gives the picture and
// the physics, so what you see is what you hit.
// Slopes: '/' rises to the right, '\\' falls to the right (one tile, 45°).
import { THEMES, TILE } from './art/themes.js';
import { makeImage, blit } from './art/raster.js';
import { VIEW_W, VIEW_H } from './physics.js';

export const COLS = 30;
export const ROWS = 17;
export const PARALLAX = { far: 0.25, near: 0.5 };
const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const SLOPES = { '/': 'up', '\\': 'down' };

// Merges solid tiles of the same kind into as few rectangles as possible (no seams for chibis to snag on).
export function tileRects(grid, solid) {
  const cols = grid[0].length;
  const used = Array.from({ length: ROWS }, () => new Array(cols).fill(false));
  const rects = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = at(grid, x, y);
      if (!solid[ch] || SLOPES[ch] || used[y][x]) continue;
      let w = 1;
      while (x + w < cols && at(grid, x + w, y) === ch && !used[y][x + w]) w++;
      let h = 1;
      grow: while (y + h < ROWS) {
        for (let i = 0; i < w; i++) if (at(grid, x + i, y + h) !== ch || used[y + h][x + i]) break grow;
        h++;
      }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = true;
      rects.push({ ch, x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE });
    }
  }
  return rects;
}

// A level is at least one screen (30 columns) wide; longer courses scroll with the camera.
export function checkLevel(def) {
  if (!THEMES[def.theme]) throw new Error(`${def.id}: unknown theme ${def.theme}`);
  if (def.grid.length !== ROWS) throw new Error(`${def.id}: grid has ${def.grid.length} rows, needs ${ROWS}`);
  const cols = def.grid[0].length;
  if (cols < COLS) throw new Error(`${def.id}: ${cols} columns, needs at least ${COLS}`);
  def.grid.forEach((row, i) => {
    if (row.length !== cols) throw new Error(`${def.id}: row ${i} has ${row.length} columns, row 0 has ${cols}`);
  });
}

// Level definition → the map the physics and the game use.
export function buildLevel(def) {
  checkLevel(def);
  const theme = THEMES[def.theme];
  const solid = { ...theme.solid, '/': theme.solid['#'], '\\': theme.solid['#'] };
  const solids = tileRects(def.grid, solid).map((r) => ({
    kind: 'box', x: r.x, y: r.y, w: r.w, h: r.h,
    bounce: solid[r.ch].restitution, friction: solid[r.ch].friction,
  }));
  def.grid.forEach((row, ty) => [...row].forEach((ch, tx) => {
    const x = tx * TILE;
    const y = ty * TILE;
    if (ch === '/') solids.push({ kind: 'poly', points: [[x, y + TILE], [x + TILE, y + TILE], [x + TILE, y]], friction: 0.5, bounce: 0.1 });
    if (ch === '\\') solids.push({ kind: 'poly', points: [[x, y], [x, y + TILE], [x + TILE, y + TILE]], friction: 0.5, bounce: 0.1 });
  }));
  for (const p of def.pipes || []) solids.push({ kind: 'box', x: p.x + 1, y: p.y, w: 30, h: p.h, bounce: 0.15, friction: 0.5 });
  for (const b of def.bumpers || []) solids.push({ kind: 'circle', x: b.x, y: b.y, r: b.r, bounce: b.bounce ?? 1.1, bumper: true });
  return { ...def, width: def.grid[0].length * TILE, solids };
}

// Builds a grid from fills: [char, x0, y0, x1 = x0, y1 = y0] in tiles, inclusive, applied in order.
export function paint(cols, fills) {
  const g = Array.from({ length: ROWS }, () => new Array(cols).fill('.'));
  for (const [ch, x0, y0, x1 = x0, y1 = y0] of fills) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch;
  }
  return g.map((r) => r.join(''));
}

const layerWidth = (map, factor) => Math.ceil(VIEW_W + (map.width - VIEW_W) * factor);

// Columns with nothing under them are a drop: dark and dithered, so a pit reads as a pit.
function abyss(img, map) {
  const theme = THEMES[map.theme];
  const top = (ROWS - 2) * TILE;
  for (let x = 0; x < map.grid[0].length; x++) {
    if (theme.solid[at(map.grid, x, ROWS - 2)] || theme.solid[at(map.grid, x, ROWS - 1)]) continue;
    for (let y = top; y < img.h; y++) {
      for (let px = x * TILE; px < x * TILE + TILE; px++) {
        const t = (y - top) / 20;
        const c = t > 1 || ((px + y) & 1 && t > 0.5) ? theme.abyss[1] : theme.abyss[0];
        img.px.set(c, (y * img.w + px) * 4);
      }
    }
  }
}

// The static picture of a level, in parallax layers: sky (fixed), far, near, and the course itself.
export function composeLevel(map) {
  const theme = THEMES[map.theme];
  const sky = makeImage(VIEW_W, VIEW_H);
  theme.sky(sky, map);
  const far = makeImage(layerWidth(map, PARALLAX.far), VIEW_H);
  theme.far(far, map);
  const near = makeImage(layerWidth(map, PARALLAX.near), VIEW_H);
  theme.near(near, map);
  const fg = makeImage(map.width, VIEW_H);
  abyss(fg, map);
  const cols = map.grid[0].length;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < cols; x++) {
      const d = theme.decor[at(map.grid, x, y)];
      if (d) blit(fg, d, x * TILE, y * TILE + TILE - d.h);
    }
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < cols; x++) {
      const t = theme.tile(map.grid, x, y);
      if (t) blit(fg, t, x * TILE, y * TILE);
    }
  }
  if (theme.edges) theme.edges(fg, map.grid);
  if (theme.objects) theme.objects(fg, map);
  return { sky, far, near, fg };
}

// One flat picture of the whole course (for previews): layers as seen from camera x = cam.
export function flatten(layers, map, cam = 0, w = VIEW_W) {
  const out = makeImage(w, VIEW_H);
  for (let x = 0; x < w; x += VIEW_W) blit(out, layers.sky, x, 0);
  blit(out, layers.far, -Math.round(cam * PARALLAX.far), 0);
  blit(out, layers.near, -Math.round(cam * PARALLAX.near), 0);
  blit(out, layers.fg, -Math.round(cam), 0);
  return out;
}
