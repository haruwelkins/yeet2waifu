// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// World "speed": the seaside zone of a fast platformer. Checkered earth, ramps, palms, sunflowers, item
// boxes, springs and dash strips everywhere, the sea and waterfalls behind. Drawn from scratch.
import { RGBA } from './palette.js';
import { sprite, setPx, fillRect } from './raster.js';
import { checkerTile, blockTile, withTop, slopeTile, edges, mountains, sea } from './kit.js';
import { skyBands, cloud, hills } from './sky.js';
import { makeRng } from '../rng.js';

const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const slope = (c) => c === '/' || c === '\\';
const GRASS = ['lime', 'lime', 'green', 'green', 'forest'];

const earth = checkerTile('clay', 'brown', 4);
const ground = withTop(earth, GRASS, 9);
const rock = blockTile({ base: 'gray', light: 'silver', dark: 'slate', line: 'steel', speckle: 'slate', seed: 2 });
const itemBox = blockTile({ base: 'silver', light: 'white', dark: 'gray', line: 'ink', seed: 5 });
fillRect(itemBox, 3, 3, 10, 9, RGBA.navy);
for (let a = 0; a < 20; a++) {
  const ang = (a / 20) * Math.PI * 2;
  setPx(itemBox, Math.round(7.5 + Math.cos(ang) * 3), Math.round(7 + Math.sin(ang) * 3), RGBA.yellow);
}
fillRect(itemBox, 3, 12, 10, 1, RGBA.gray);

const palm = sprite({ G: 'green', L: 'lime', F: 'forest', B: 'brown', K: 'bark', T: 'tan' }, `
......FF........
...FFLLLGF.FF...
..FLLGGGLLGLLF..
.FLG...LLL..GLF.
.FG...LGBLG..GF.
.F...LG.BK.G..F.
....FG..KB..GF..
....F...BK...F..
........KB......
........BK......
.......KB.......
.......BK.......
.......KB.......
.......BK.......
.......KB.......
.......BT.......
.......KB.......
.......BK.......
.......KB.......
......BBKK......
`);

const sunflower = sprite({ Y: 'yellow', A: 'amber', B: 'bark', G: 'green', L: 'lime' }, `
....YAY.....
...YYAYY....
..AYBBBYA...
..YYBBBYY...
..AYBBBYA...
...YYAYY....
....YAY.....
.....G......
...L.G......
....LGL.....
.....G......
`);

const redFlower = sprite({ R: 'red', Y: 'yellow', G: 'green' }, `
.R.R.
RRYRR
.RRR.
..G..
.GG..
..G..
`);

export const speed = {
  solid: {
    '#': { friction: 0.5, restitution: 0.1 },
    K: { friction: 0.6, restitution: 0.15 },
    I: { friction: 0.5, restitution: 0.3 },
  },
  abyss: [RGBA.navy, RGBA.ink],
  tile(grid, x, y) {
    const ch = at(grid, x, y);
    if (ch === '#') {
      const up = at(grid, x, y - 1);
      return up === '#' || slope(up) ? earth : ground;
    }
    if (ch === '/') return slopeTile(earth, GRASS, 'up');
    if (ch === '\\') return slopeTile(earth, GRASS, 'down');
    return { K: rock, I: itemBox }[ch] || null;
  },
  decor: { p: palm, f: sunflower, r: redFlower },
  sky(img, map) {
    const sunset = map.mood === 'sunset';
    if (sunset) skyBands(img, [['navy', 50], ['magenta', 110], ['rose', 160], ['amber', 270]], 10);
    else skyBands(img, [['blue', 150], ['cyan', 270]], 12);
    const puff = sunset ? { light: 'rose', shade: 'magenta' } : {};
    cloud(img, 60, 22, 44, { seed: 31, ...puff });
    cloud(img, 250, 40, 60, { seed: 32, ...puff });
    cloud(img, 400, 16, 36, { seed: 33, ...puff });
  },
  far(img, map) {
    const sunset = map.mood === 'sunset';
    mountains(img, { seed: (map.seed || 5) + 2, baseY: 190, color: sunset ? 'forest' : 'green', light: sunset ? 'green' : 'lime', minH: 30, maxH: 70 });
    // waterfalls, only down mountain faces (never across the sky)
    const rng = makeRng(77);
    const rock = (x, y) => img.px[(y * img.w + x) * 4 + 3] > 0;
    for (let x = rng.int(40, 120); x < img.w - 4; x += rng.int(140, 220)) {
      let y = 0;
      while (y < 180 && !rock(x + 2, y)) y++;
      for (y += 6; y < 180; y++) fillRect(img, x, y, 4, 1, RGBA[(y + x) % 3 ? 'cyan' : 'white']);
    }
    sea(img, { y0: 180, colors: sunset ? ['amber', 'grape'] : ['cyan', 'blue'], glint: sunset ? 'yellow' : 'white', seed: 4 });
  },
  near(img, map) {
    const sunset = map.mood === 'sunset';
    hills(img, { seed: (map.seed || 5) + 30, baseY: 240, color: sunset ? 'deep' : 'forest', rim: sunset ? 'forest' : 'green', outline: 'deep',
      count: Math.ceil(img.w / 40), minW: 50, maxW: 90, minH: 14, maxH: 34 });
  },
  edges(img, grid) {
    edges(img, grid, '#', 'forest', 'bark', 5);
  },
  objects() {},
  skin: {
    spring: ['red', 'crimson', 'yellow'], boost: ['yellow', 'orange', 'steel'], gel: ['cyan', 'blue', 'navy'],
    fan: ['silver', 'gray', 'steel'], spinner: ['clay', 'brown', 'bark'], mover: ['gray', 'slate', 'steel'],
    portal: ['yellow', 'amber', 'orange'],
  },
};
