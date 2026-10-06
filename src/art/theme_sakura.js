// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// World "sakura": a mountain shrine in cherry-blossom season. Petal-strewn grass, stone paths, red lacquered
// wood, torii gates, stone lanterns, bamboo, a snowy peak behind and petals in the wind. Drawn from scratch.
import { RGBA } from './palette.js';
import { sprite, setPx, fillRect, makeImage } from './raster.js';
import { brickTile, blockTile, withTop, slopeTile, edges, mountains } from './kit.js';
import { skyBands, cloud } from './sky.js';
import { makeRng } from '../rng.js';

const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const slope = (c) => c === '/' || c === '\\';
const GRASS = ['lime', 'lime', 'green', 'green', 'forest'];

const soil = makeImage(16, 16);
{
  const rng = makeRng(41);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) setPx(soil, x, y, RGBA[rng.next() < 0.12 ? 'plum' : rng.next() < 0.1 ? 'brown' : 'bark']);
}
const ground = withTop(soil, GRASS, 21);
{
  const rng = makeRng(42);
  for (let i = 0; i < 4; i++) setPx(ground, rng.int(0, 15), rng.int(0, 2), RGBA[i % 2 ? 'rose' : 'white']);
}
const stone = blockTile({ base: 'gray', light: 'silver', dark: 'slate', line: 'steel', speckle: 'slate', seed: 43 });
const lacquer = brickTile({ base: 'red', light: 'rose', dark: 'crimson', mortar: 'bark', h: 4, w: 16 });
const blossomBlock = blockTile({ base: 'rose', light: 'white', dark: 'hot', line: 'crimson', seed: 44 });
['.WW.WW.', 'WWWWWWW', 'WWWWWWW', '.WWWWW.', '..WWW..', '...W...'].forEach((row, y) =>
  [...row].forEach((ch, x) => ch === 'W' && setPx(blossomBlock, 4 + x, 5 + y, RGBA.white)));

const lantern = sprite({ S: 'silver', G: 'gray', Y: 'amber', y: 'yellow', D: 'slate' }, `
...SSSS...
..SSSSSS..
.SSSSSSSS.
...GGGG...
...GyYG...
...GYYG...
...GGGG...
..SSSSSS..
....GD....
....GD....
....GD....
...GGDD...
..SSSSSS..
`);

const sapling = sprite({ R: 'rose', H: 'hot', W: 'white', B: 'bark', b: 'brown' }, `
....RRR.RR......
..RRHRRRRRRR....
.RRRRWRRRHRRR...
RRHRRRRRRRRWRR..
RRRRRHRRRRRRRR..
.RRWRRRRRHRRR...
..RRRRBRRRRR....
....RR.B.RR.....
.......Bb.......
.......Bb.......
.......Bb.......
.......Bb.......
......BBbb......
`);

const bamboo = sprite({ L: 'lime', G: 'green', F: 'forest' }, `
.LG.
.LG.
FFFF
.LG.
.LG.
.LG.
.LG.
FFFF
.LG.
.LG.
.LG.
.LGL
FFFF
.LG.
.LG.
.LG.
.LG.
FFFF
`);

// A torii gate (not solid: you fly through it): two red pillars, the black top beam with upturned ends, the
// red tie beam below.
function torii(img, x, ground, w = 56, h = 64) {
  const top = ground - h;
  for (const px of [x + 6, x + w - 12]) {
    fillRect(img, px, top + 6, 6, h - 6, RGBA.crimson);
    fillRect(img, px + 1, top + 6, 4, h - 6, RGBA.red);
    fillRect(img, px - 1, ground - 4, 8, 4, RGBA.ink);
  }
  fillRect(img, x - 4, top, w + 8, 4, RGBA.ink);
  setPx(img, x - 5, top - 1, RGBA.ink);
  setPx(img, x + w + 4, top - 1, RGBA.ink);
  fillRect(img, x - 2, top + 4, w + 4, 3, RGBA.red);
  fillRect(img, x + 2, top + 14, w - 4, 3, RGBA.red);
  fillRect(img, x + w / 2 - 3, top + 7, 6, 7, RGBA.crimson);
}

export const sakura = {
  solid: {
    '#': { friction: 0.6, restitution: 0.1 },
    S: { friction: 0.6, restitution: 0.1 },
    W: { friction: 0.5, restitution: 0.15 },
    H: { friction: 0.5, restitution: 0.35 },
  },
  abyss: [RGBA.blue, RGBA.navy],
  ambient: 'petals',
  tile(grid, x, y) {
    const ch = at(grid, x, y);
    if (ch === '#') {
      const up = at(grid, x, y - 1);
      return up === '#' || slope(up) ? soil : ground;
    }
    if (ch === '/') return slopeTile(soil, GRASS, 'up');
    if (ch === '\\') return slopeTile(soil, GRASS, 'down');
    return { S: stone, W: lacquer, H: blossomBlock }[ch] || null;
  },
  decor: { l: lantern, p: sapling, b: bamboo },
  sky(img, map) {
    const dusk = map.mood === 'sunset';
    if (dusk) skyBands(img, [['navy', 50], ['magenta', 110], ['rose', 165], ['peach', 270]], 10);
    else skyBands(img, [['blue', 90], ['cyan', 160], ['peach', 270]], 12);
    cloud(img, 70, 26, 50, { seed: 51, light: 'white', shade: dusk ? 'rose' : 'silver' });
    cloud(img, 330, 44, 42, { seed: 52, light: 'white', shade: dusk ? 'rose' : 'silver' });
  },
  far(img, map) {
    mountains(img, { seed: (map.seed || 6) + 3, baseY: 210, color: 'slate', light: 'gray', minH: 70, maxH: 120, snow: 'white' });
  },
  near(img, map) {
    // cherry trees: a trunk under a full, domed crown (a cluster of circles), lit from the top left,
    // deeper pink underneath, a dark rim, a few white blossoms
    const rng = makeRng((map.seed || 6) + 9);
    for (let x = rng.int(0, 40); x < img.w + 30; x += rng.int(70, 104)) {
      const cy = rng.int(166, 182);
      const k = rng.range(0.85, 1.15);
      fillRect(img, x - 2, cy + 8, 5, 270 - cy - 8, RGBA.bark);
      fillRect(img, x - 7, cy + 14, 5, 2, RGBA.bark);
      fillRect(img, x + 3, cy + 18, 6, 2, RGBA.bark);
      const blobs = [[-15, 5, 11], [15, 5, 11], [0, -8, 14], [-8, -3, 12], [8, -3, 12], [0, 7, 12], [-20, 9, 7], [20, 9, 7]]
        .map(([dx, dy, r]) => [x + dx * k, cy + dy * k, r * k]);
      const inside = (px, py) => blobs.some(([bx, by, r]) => (px - bx) ** 2 + (py - by) ** 2 <= r * r);
      for (let py = Math.floor(cy - 24 * k); py <= cy + 22 * k; py++) {
        for (let px = Math.floor(x - 30 * k); px <= x + 30 * k; px++) {
          if (px < 0 || px >= img.w || !inside(px, py)) continue;
          const edge = !inside(px - 1, py) || !inside(px + 1, py) || !inside(px, py - 1) || !inside(px, py + 1);
          let c = 'rose';
          if (edge) c = 'magenta';
          else if (!inside(px, py + 3)) c = 'hot';
          else if (py > cy + 6 * k) c = 'hot';
          else if (!inside(px - 3, py - 3)) c = 'white';
          setPx(img, px, py, RGBA[c]);
        }
      }
      for (let n = 0; n < 7; n++) {
        const bx = Math.round(x + rng.range(-18, 18) * k);
        const by = Math.round(cy + rng.range(-14, 4) * k);
        if (inside(bx, by) && inside(bx + 1, by + 1)) {
          setPx(img, bx, by, RGBA.white);
          setPx(img, bx + 1, by, RGBA.hot);
        }
      }
    }
  },
  edges(img, grid) {
    edges(img, grid, '#', 'forest', 'plum', 5);
  },
  objects(img, map) {
    for (const t of map.torii || []) torii(img, t.x, t.ground, t.w, t.h);
  },
  skin: {
    spring: ['red', 'crimson', 'tan'], boost: ['rose', 'hot', 'bark'], gel: ['rose', 'magenta', 'grape'],
    fan: ['tan', 'brown', 'bark'], spinner: ['red', 'crimson', 'bark'], mover: ['tan', 'brown', 'bark'],
    portal: ['rose', 'hot', 'crimson'],
  },
};
