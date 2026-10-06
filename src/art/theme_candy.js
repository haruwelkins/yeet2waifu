// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// World "candy": a land made of dessert. Sponge cake with dripping frosting, chocolate bars, gummy blocks,
// candy canes, lollipops, cupcakes, chocolate mountains with frosting caps and a chocolate river. Sparkles.
import { RGBA } from './palette.js';
import { sprite, setPx, fillRect, makeImage } from './raster.js';
import { blockTile, slopeTile, edges, mountains } from './kit.js';
import { skyBands, cloud, hills } from './sky.js';
import { makeRng } from '../rng.js';

const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const slope = (c) => c === '/' || c === '\\';
const FROST = ['white', 'white', 'rose', 'rose'];

const sponge = makeImage(16, 16);
{
  const rng = makeRng(61);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) setPx(sponge, x, y, RGBA[rng.next() < 0.1 ? 'clay' : 'tan']);
  fillRect(sponge, 0, 9, 16, 2, RGBA.hot); // a jam layer through the cake
  fillRect(sponge, 0, 11, 16, 1, RGBA.crimson);
}
const cake = makeImage(16, 16);
cake.px.set(sponge.px);
{
  const rng = makeRng(62);
  for (let x = 0; x < 16; x++) {
    const drip = rng.next() < 0.3 ? rng.int(4, 7) : rng.int(2, 4);
    for (let y = 0; y < drip; y++) setPx(cake, x, y, RGBA[FROST[Math.min(y, FROST.length - 1)]]);
  }
  for (let i = 0; i < 3; i++) setPx(cake, rng.int(1, 14), 1, RGBA[['yellow', 'cyan', 'hot'][i]]); // sprinkles
}
const choc = blockTile({ base: 'brown', light: 'clay', dark: 'bark', line: 'plum', seed: 63 });
fillRect(choc, 7, 1, 1, 14, RGBA.bark);
fillRect(choc, 1, 7, 14, 1, RGBA.bark);
const gummy = blockTile({ base: 'lime', light: 'white', dark: 'green', line: 'forest', seed: 64 });
setPx(gummy, 3, 3, RGBA.white);
setPx(gummy, 4, 3, RGBA.white);
const sweetHeart = blockTile({ base: 'rose', light: 'white', dark: 'hot', line: 'crimson', seed: 65 });
['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'].forEach((row, y) =>
  [...row].forEach((ch, x) => ch === 'R' && setPx(sweetHeart, 4 + x, 5 + y, RGBA.hot)));

const cane = sprite({ R: 'red', W: 'white', K: 'crimson' }, `
.RRW..
RW..RW
W....R
.....W
....RW
....WR
....RW
....WR
....RW
....WR
....RW
....WR
....RW
....WR
....RW
....WK
`);

const lollipop = sprite({ H: 'hot', W: 'white', R: 'rose', S: 'sand', K: 'crimson' }, `
...HHHH...
..HWWWWH..
.HWHHHHWH.
.HWHWWHWH.
.HWHHWHWH.
.HWWWWHWH.
..HHHHWH..
...HHHH...
....SS....
....SS....
....SS....
....SS....
....SS....
....SS....
`);

const cupcake = sprite({ W: 'white', R: 'rose', H: 'hot', T: 'tan', C: 'clay', K: 'bark' }, `
.....H......
....RWR.....
..WWWWWWW...
.WWRWWWRWW..
WWWWWWWWWWW.
.KTCTCTCTK..
.KTCTCTCTK..
..KTCTCTK...
..KKKKKKK...
`);

export const candy = {
  solid: {
    '#': { friction: 0.55, restitution: 0.15 },
    C: { friction: 0.6, restitution: 0.1 },
    J: { friction: 0.4, restitution: 0.6 },   // gummy: bouncy
    H: { friction: 0.5, restitution: 0.35 },
  },
  abyss: [RGBA.brown, RGBA.bark],
  ambient: 'sparkle',
  tile(grid, x, y) {
    const ch = at(grid, x, y);
    if (ch === '#') {
      const up = at(grid, x, y - 1);
      return up === '#' || slope(up) ? sponge : cake;
    }
    if (ch === '/') return slopeTile(sponge, FROST, 'up');
    if (ch === '\\') return slopeTile(sponge, FROST, 'down');
    return { C: choc, J: gummy, H: sweetHeart }[ch] || null;
  },
  decor: { c: cane, l: lollipop, u: cupcake },
  sky(img) {
    skyBands(img, [['rose', 70], ['peach', 160], ['sand', 270]], 12);
    cloud(img, 50, 30, 50, { seed: 71, light: 'white', shade: 'rose' });
    cloud(img, 220, 18, 36, { seed: 72, light: 'white', shade: 'rose' });
    cloud(img, 370, 40, 56, { seed: 73, light: 'white', shade: 'rose' });
  },
  far(img, map) {
    mountains(img, { seed: (map.seed || 7) + 4, baseY: 214, color: 'bark', light: 'brown', minH: 40, maxH: 90, snow: 'white' });
  },
  near(img, map) {
    hills(img, { seed: (map.seed || 7) + 12, baseY: 240, color: 'rose', rim: 'white', outline: 'magenta',
      count: Math.ceil(img.w / 40), minW: 40, maxW: 80, minH: 16, maxH: 36 });
  },
  edges(img, grid) {
    edges(img, grid, '#', 'white', 'clay', 3);
  },
  objects() {},
  skin: {
    spring: ['hot', 'rose', 'white'], boost: ['yellow', 'amber', 'rose'], gel: ['rose', 'hot', 'crimson'],
    fan: ['white', 'silver', 'rose'], spinner: ['white', 'red', 'crimson'], mover: ['tan', 'clay', 'bark'],
    portal: ['hot', 'rose', 'magenta'],
  },
};
