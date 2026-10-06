// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// World "dungeon": the side-view palace of an adventure game. Stone bricks, lava pits, torches, banners,
// carved rune blocks, magenta slime. A genre homage drawn from scratch.
import { RGBA } from './palette.js';
import { sprite, setPx, fillRect } from './raster.js';
import { brickTile, blockTile, withTop, slopeTile, edges, pillars } from './kit.js';
import { skyBands } from './sky.js';
import { makeRng } from '../rng.js';

const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const slope = (c) => c === '/' || c === '\\';

const floorFill = brickTile({ base: 'slate', light: 'gray', dark: 'steel', mortar: 'night' });
const floorTop = withTop(floorFill, ['silver', 'gray', 'gray'], 5);
const wall = brickTile({ base: 'steel', light: 'slate', dark: 'night', mortar: 'ink', h: 8, w: 16 });
const rune = blockTile({ base: 'gray', light: 'silver', dark: 'slate', line: 'ink', speckle: 'slate', seed: 4 });
for (let a = 0; a < 24; a++) {
  const ang = (a / 24) * Math.PI * 2;
  setPx(rune, Math.round(7.5 + Math.cos(ang) * 4), Math.round(7.5 + Math.sin(ang) * 4), RGBA.cyan);
}
fillRect(rune, 7, 7, 2, 2, RGBA.cyan);
const heartStone = blockTile({ base: 'gray', light: 'silver', dark: 'slate', line: 'ink', seed: 8 });
['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'].forEach((row, y) =>
  [...row].forEach((ch, x) => ch === 'R' && setPx(heartStone, 4 + x, 5 + y, RGBA[x < 2 && y < 2 ? 'rose' : 'hot'])));

const torch = sprite({ Y: 'yellow', A: 'amber', O: 'orange', R: 'red', b: 'bark', g: 'gray' }, `
...Y....
..YAY...
..AOA...
.YAOAY..
..AOA...
...R....
.gggg...
..gg....
..gg....
..gg....
`);

const banner = sprite({ K: 'ink', R: 'crimson', r: 'red', Y: 'amber', y: 'yellow' }, `
KKKKKKKKKKKK
.YRRRRRRRRY.
.YRrRRRRrRY.
.YRRRYyRRRY.
.YRRYyyYRRY.
.YRRRYyRRRY.
.YRRRRRRRRY.
.YRrRRRRrRY.
.YRRRRRRRRY.
.YRRRRRRRRY.
.YRRR..RRRY.
.YRR....RRY.
.YR......RY.
`);

const pot = sprite({ K: 'ink', C: 'clay', c: 'rust', T: 'tan', B: 'bark' }, `
...KKKKKK...
..KTTTTTTK..
...KCCCCK...
..KCCTCCcK..
.KCCTCCCCcK.
.KCCCCCCCcK.
.KCCCCCCccK.
..KcCCCccK..
...KKKKKK...
`);

const chain = sprite({ G: 'gray', S: 'slate' }, `
.GG.
G..G
.GG.
.SS.
.GG.
G..G
.GG.
.SS.
.GG.
G..G
.GG.
.SS.
.GG.
G..G
.GG.
.SS.
`);

export const dungeon = {
  solid: {
    '#': { friction: 0.6, restitution: 0.1 },
    W: { friction: 0.6, restitution: 0.1 },
    R: { friction: 0.5, restitution: 0.2 },
    H: { friction: 0.5, restitution: 0.35 },
  },
  abyss: [RGBA.orange, RGBA.crimson],
  tile(grid, x, y) {
    const ch = at(grid, x, y);
    if (ch === '#') {
      const up = at(grid, x, y - 1);
      return up === '#' || slope(up) ? floorFill : floorTop;
    }
    if (ch === '/') return slopeTile(floorFill, ['silver', 'gray', 'gray'], 'up');
    if (ch === '\\') return slopeTile(floorFill, ['silver', 'gray', 'gray'], 'down');
    return { W: wall, R: rune, H: heartStone }[ch] || null;
  },
  decor: { t: torch, k: banner, p: pot, c: chain },
  sky(img) {
    skyBands(img, [['ink', 150], ['night', 270]], 10);
  },
  far(img, map) {
    // the back wall, with arched windows onto a starry night
    const rng = makeRng((map.seed || 3) + 5);
    for (let y = 0; y < img.h; y++) {
      for (let x = 0; x < img.w; x++) {
        const course = Math.floor(y / 10);
        const rx = (x + (course % 2) * 12) % 24;
        setPx(img, x, y, RGBA[y % 10 === 9 || rx === 23 ? 'ink' : 'night']);
      }
    }
    for (let wx = rng.int(20, 60); wx < img.w - 30; wx += rng.int(110, 150)) {
      const top = 40;
      for (let y = top; y < top + 70; y++) {
        for (let x = wx; x < wx + 28; x++) {
          const arch = y - top < 14 ? Math.hypot(x - wx - 14, y - top - 14) <= 14 : true;
          if (arch) setPx(img, x, y, RGBA.navy);
        }
      }
      for (let i = 0; i < 5; i++) setPx(img, wx + rng.int(3, 25), top + rng.int(6, 60), RGBA.white);
      fillRect(img, wx + 13, top + 4, 2, 66, RGBA.ink);
      fillRect(img, wx, top + 36, 28, 2, RGBA.ink);
    }
  },
  near(img, map) {
    pillars(img, { seed: (map.seed || 3) + 9, every: 96, w: 16, color: 'steel', light: 'slate', dark: 'ink', top: 14 });
  },
  edges(img, grid) {
    edges(img, grid, '#', 'gray', 'ink', 3);
  },
  objects() {},
  skin: {
    spring: ['amber', 'orange', 'silver'], boost: ['cyan', 'blue', 'night'], gel: ['rose', 'magenta', 'grape'],
    fan: ['cyan', 'blue', 'navy'], spinner: ['gray', 'slate', 'ink'], mover: ['gray', 'slate', 'ink'],
    portal: ['hot', 'magenta', 'grape'],
  },
};
