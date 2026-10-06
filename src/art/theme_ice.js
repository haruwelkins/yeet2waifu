// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// World "ice": a frozen peak at night under the aurora. Snow over rock (slippery), ice blocks (very
// slippery), snowy pines, snowmen, a pine forest and white mountains behind, snowfall. Drawn from scratch.
import { RGBA } from './palette.js';
import { sprite, setPx, fillRect, makeImage } from './raster.js';
import { blockTile, withTop, slopeTile, edges, mountains, stars } from './kit.js';
import { skyBands } from './sky.js';
import { makeRng } from '../rng.js';

const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const slope = (c) => c === '/' || c === '\\';
const SNOW = ['white', 'white', 'silver', 'silver'];

const rock = blockTile({ base: 'slate', light: 'gray', dark: 'steel', line: 'night', speckle: 'steel', seed: 81 });
const snowy = withTop(rock, SNOW, 82);
const iceBlock = makeImage(16, 16);
for (let y = 0; y < 16; y++) {
  for (let x = 0; x < 16; x++) {
    let c = 'blue';
    if (x === 15 || y === 15) c = 'navy';
    else if (x === 0 || y === 0) c = 'cyan';
    else if (x - y === 3 || x - y === 4 || x - y === -6) c = 'cyan';
    setPx(iceBlock, x, y, RGBA[c]);
  }
}
setPx(iceBlock, 3, 2, RGBA.white);
setPx(iceBlock, 4, 2, RGBA.white);
const darkRock = blockTile({ base: 'steel', light: 'slate', dark: 'night', line: 'ink', speckle: 'night', seed: 83 });
const frostHeart = blockTile({ base: 'blue', light: 'cyan', dark: 'navy', line: 'night', seed: 84 });
['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'].forEach((row, y) =>
  [...row].forEach((ch, x) => ch === 'R' && setPx(frostHeart, 4 + x, 5 + y, RGBA[y < 2 ? 'white' : 'hot'])));

const pine = sprite({ W: 'white', S: 'silver', G: 'green', F: 'forest', D: 'deep', B: 'bark' }, `
.......W........
......WGW.......
.....WGGFW......
....WGGGFFW.....
......GGF.......
.....WGGFF......
....WGGGFFFW....
...WGGGGFFFFW...
.....GGGFFF.....
....WGGGGFFF....
...WGGGGGFFFFW..
..WGGGGGGFFFFFW.
.....DDBBDD.....
.......BB.......
`);

const snowman = sprite({ W: 'white', S: 'silver', K: 'ink', O: 'orange', R: 'red', B: 'bark' }, `
....KKKK....
...KKKKKK...
....WWWW....
...WKWWKW...
...WWOOWW...
....WWWW....
..RRRRRRRR..
...WWWWWW...
B.WWWKWWWS.B
.BWWWWWWWSB.
..WWWKWWWS..
.WWWWWWWWWS.
WWWWWWWWWWSS
WWWWWWWWWWSS
.WWWWWWWWSS.
`);

export const ice = {
  solid: {
    '#': { friction: 0.25, restitution: 0.1 },   // packed snow: things slide
    I: { friction: 0.02, restitution: 0.05 },    // ice: they keep sliding
    R: { friction: 0.6, restitution: 0.1 },
    H: { friction: 0.5, restitution: 0.35 },
  },
  abyss: [RGBA.navy, RGBA.ink],
  ambient: 'snow',
  tile(grid, x, y) {
    const ch = at(grid, x, y);
    if (ch === '#') {
      const up = at(grid, x, y - 1);
      return up === '#' || slope(up) ? rock : snowy;
    }
    if (ch === '/') return slopeTile(rock, SNOW, 'up');
    if (ch === '\\') return slopeTile(rock, SNOW, 'down');
    return { I: iceBlock, R: darkRock, H: frostHeart }[ch] || null;
  },
  decor: { p: pine, s: snowman },
  sky(img, map) {
    skyBands(img, [['ink', 60], ['night', 150], ['navy', 270]], 10);
    stars(img, { seed: (map.seed || 8) + 1, count: 60, maxY: 170 });
    // the aurora: two wavy curtains of light fading downwards
    for (const [base, amp, ph, a, b] of [[44, 10, 0, 'green', 'deep'], [70, 7, 2, 'blue', 'navy']]) {
      for (let x = 0; x < img.w; x++) {
        const top = Math.round(base + Math.sin(x * 0.025 + ph) * amp + Math.sin(x * 0.07) * 3);
        setPx(img, x, top, RGBA[a]);
        for (let k = 1; k < 18; k++) {
          if ((x + k) % 2 || (k > 6 && (x * 3 + k) % 4)) continue;
          setPx(img, x, top + k, RGBA[k < 5 ? a : b]);
        }
      }
    }
  },
  far(img, map) {
    mountains(img, { seed: (map.seed || 8) + 3, baseY: 214, color: 'slate', light: 'gray', minH: 60, maxH: 110, snow: 'white' });
  },
  near(img, map) {
    // a pine forest in silhouette
    const rng = makeRng((map.seed || 8) + 7);
    for (let x = rng.int(-10, 10); x < img.w + 10; x += rng.int(10, 22)) {
      const h = rng.int(28, 56);
      const base = 246;
      for (let y = 0; y < h; y++) {
        const half = Math.round((y / h) * (h * 0.32)) + ((y % 8) < 3 ? 1 : 0);
        fillRect(img, x - half, base - h + y, half * 2 + 1, 1, RGBA.deep);
      }
      fillRect(img, x - 1, base, 3, 270 - base, RGBA.deep);
    }
  },
  edges(img, grid) {
    edges(img, grid, '#', 'silver', 'night', 4);
  },
  objects() {},
  skin: {
    spring: ['cyan', 'blue', 'silver'], boost: ['white', 'cyan', 'navy'], gel: ['white', 'silver', 'gray'],
    fan: ['silver', 'gray', 'steel'], spinner: ['cyan', 'blue', 'navy'], mover: ['white', 'cyan', 'blue'],
    portal: ['lime', 'cyan', 'blue'],
  },
};
