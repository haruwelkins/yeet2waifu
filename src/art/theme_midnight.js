// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// World "midnight": the hidden hour between days. A dead city under a huge green moon, a strange tower on
// the horizon, standing coffins, stopped clocks, lamps that do not light. A genre homage drawn from scratch.
import { RGBA } from './palette.js';
import { sprite, setPx, fillRect } from './raster.js';
import { blockTile, withTop, slopeTile, edges, moon, skyline, stars } from './kit.js';
import { skyBands } from './sky.js';

const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const slope = (c) => c === '/' || c === '\\';

const tileFill = blockTile({ base: 'night', light: 'steel', dark: 'ink', line: 'ink', speckle: 'deep', seed: 12 });
const tileTop = withTop(tileFill, ['lime', 'green', 'deep'], 13);
const glass = blockTile({ base: 'deep', light: 'forest', dark: 'ink', line: 'ink', seed: 14 });
fillRect(glass, 3, 3, 4, 4, RGBA.forest);
fillRect(glass, 9, 3, 4, 4, RGBA.forest);
fillRect(glass, 3, 9, 4, 4, RGBA.forest);
const clock = blockTile({ base: 'tan', light: 'sand', dark: 'brown', line: 'bark', seed: 15 });
for (let a = 0; a < 28; a++) {
  const ang = (a / 28) * Math.PI * 2;
  setPx(clock, Math.round(7.5 + Math.cos(ang) * 5), Math.round(7.5 + Math.sin(ang) * 5), RGBA.bark);
}
fillRect(clock, 7, 4, 1, 4, RGBA.ink);
fillRect(clock, 7, 7, 4, 1, RGBA.ink);
const heart = blockTile({ base: 'night', light: 'steel', dark: 'ink', line: 'ink', seed: 16 });
['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'].forEach((row, y) =>
  [...row].forEach((ch, x) => ch === 'R' && setPx(heart, 4 + x, 5 + y, RGBA[x < 2 && y < 2 ? 'lime' : 'green'])));

const coffin = sprite({ K: 'ink', B: 'bark', b: 'plum', S: 'silver' }, `
...KKKK...
..KBBBBK..
.KBBBBBBK.
.KBBSSBbK.
KBBBSSBBbK
KBBSSSSBbK
KBBBSSBBbK
KBBBSSBBbK
KBBBBBBBbK
.KBBBBBbK.
.KBBBBBbK.
.KBBBBBbK.
.KBBBBBbK.
..KBBBbK..
..KBBBbK..
...KKKK...
`);

const lamp = sprite({ K: 'ink', S: 'slate', G: 'gray' }, `
.KKKK.
KSGGSK
.KSSK.
..KK..
..SK..
..SK..
..SK..
..SK..
..SK..
..SK..
..SK..
..SK..
..SK..
..SK..
.KSSK.
KKKKKK
`);

export const midnight = {
  solid: {
    '#': { friction: 0.6, restitution: 0.1 },
    G: { friction: 0.5, restitution: 0.2 },
    T: { friction: 0.5, restitution: 0.25 },
    H: { friction: 0.5, restitution: 0.35 },
  },
  abyss: [RGBA.deep, RGBA.ink],
  tile(grid, x, y) {
    const ch = at(grid, x, y);
    if (ch === '#') {
      const up = at(grid, x, y - 1);
      return up === '#' || slope(up) ? tileFill : tileTop;
    }
    if (ch === '/') return slopeTile(tileFill, ['lime', 'green', 'deep'], 'up');
    if (ch === '\\') return slopeTile(tileFill, ['lime', 'green', 'deep'], 'down');
    return { G: glass, T: clock, H: heart }[ch] || null;
  },
  decor: { C: coffin, l: lamp },
  sky(img, map) {
    skyBands(img, [['ink', 70], ['deep', 170], ['forest', 270]], 12);
    stars(img, { seed: (map.seed || 4) + 2, count: 25, colors: ['lime', 'green'], maxY: 150 });
    moon(img, 330, 76, 40, { light: 'yellow', shade: 'lime', craters: 'lime', glow: 'green' });
  },
  far(img, map) {
    // the strange tower on the horizon, then a dead city in front of it
    const cx = Math.round(img.w * 0.55);
    for (let y = 30; y < img.h; y++) {
      const half = 6 + Math.round((y - 30) * 0.12) + ((y >> 3) % 2 ? 2 : 0);
      fillRect(img, cx - half, y, half * 2, 1, RGBA.ink);
    }
    for (let y = 20; y < 30; y++) fillRect(img, cx - 2, y, 4, 1, RGBA.ink);
    skyline(img, { seed: (map.seed || 4) + 5, baseY: 236, color: 'deep', minH: 30, maxH: 90, lit: 0 });
  },
  near(img, map) {
    skyline(img, { seed: (map.seed || 4) + 9, baseY: 244, color: 'ink', minH: 16, maxH: 50, lit: 0 });
  },
  edges(img, grid) {
    edges(img, grid, '#', 'green', 'ink', 3);
  },
  objects() {},
  skin: {
    spring: ['lime', 'green', 'deep'], boost: ['cyan', 'blue', 'navy'], gel: ['hot', 'crimson', 'plum'],
    fan: ['silver', 'slate', 'steel'], spinner: ['tan', 'brown', 'bark'], mover: ['steel', 'night', 'ink'],
    portal: ['lime', 'green', 'deep'],
  },
};
