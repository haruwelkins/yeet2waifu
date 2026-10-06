// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// World "space": a little station on the moon. Riveted metal floors with a light strip, dark hull blocks,
// light panels, glass, antennas, a cute robot, crates, a ringed planet in a starry sky, the grey lunar
// horizon. Courses here can lower gravity (map.gravity). Drawn from scratch.
import { RGBA } from './palette.js';
import { sprite, setPx, fillRect, makeImage } from './raster.js';
import { blockTile, withTop, slopeTile, edges, stars } from './kit.js';
import { skyBands, hills } from './sky.js';
import { makeRng } from '../rng.js';

const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const slope = (c) => c === '/' || c === '\\';
const STRIP = ['cyan', 'silver', 'gray'];

const plate = blockTile({ base: 'gray', light: 'silver', dark: 'slate', line: 'steel', seed: 91 });
for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) setPx(plate, x, y, RGBA.steel);
const floor = withTop(plate, STRIP, 92);
const hull = blockTile({ base: 'slate', light: 'gray', dark: 'steel', line: 'night', seed: 93 });
fillRect(hull, 3, 7, 10, 2, RGBA.steel);
const panel = blockTile({ base: 'navy', light: 'blue', dark: 'night', line: 'ink', seed: 94 });
for (const [x, y, c] of [[3, 4, 'lime'], [6, 4, 'red'], [9, 4, 'lime'], [12, 4, 'amber'], [3, 9, 'cyan'], [6, 11, 'lime']]) {
  setPx(panel, x, y, RGBA[c]);
  setPx(panel, x + 1, y, RGBA[c]);
}
const glass = blockTile({ base: 'blue', light: 'cyan', dark: 'navy', line: 'steel', seed: 95 });
setPx(glass, 3, 3, RGBA.white);
setPx(glass, 4, 4, RGBA.white);
const starHeart = blockTile({ base: 'slate', light: 'gray', dark: 'steel', line: 'night', seed: 96 });
['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'].forEach((row, y) =>
  [...row].forEach((ch, x) => ch === 'R' && setPx(starHeart, 4 + x, 5 + y, RGBA[y < 2 ? 'rose' : 'hot'])));

const antenna = sprite({ S: 'silver', G: 'gray', R: 'red', K: 'steel' }, `
...R....
..RRR...
...R....
...S....
..SSS...
.S.S.S..
...S....
...S....
...G....
...G....
...G....
..GGG...
.KKKKK..
`);

const robot = sprite({ S: 'silver', G: 'gray', K: 'steel', C: 'cyan', R: 'red', N: 'night' }, `
.....R......
.....K......
..SSSSSSS...
..SNNNNNS...
..SNCNCNS...
..SNNNNNS...
..SSSSSSS...
...GGGGG....
.KGSSSSSGK..
.K.SRSRS.K..
...SSSSS....
...GG.GG....
..KKK.KKK...
`);

const crate = blockTile({ base: 'amber', light: 'yellow', dark: 'orange', line: 'bark', seed: 97 });
for (let i = 2; i < 14; i++) {
  setPx(crate, i, i, RGBA.bark);
  setPx(crate, 15 - i, i, RGBA.bark);
}

export const space = {
  solid: {
    '#': { friction: 0.5, restitution: 0.15 },
    M: { friction: 0.5, restitution: 0.15 },
    P: { friction: 0.5, restitution: 0.15 },
    G: { friction: 0.3, restitution: 0.2 },
    X: { friction: 0.6, restitution: 0.1 },
    H: { friction: 0.5, restitution: 0.35 },
  },
  abyss: [RGBA.ink, RGBA.ink],
  ambient: 'stars',
  tile(grid, x, y) {
    const ch = at(grid, x, y);
    if (ch === '#') {
      const up = at(grid, x, y - 1);
      return up === '#' || slope(up) ? plate : floor;
    }
    if (ch === '/') return slopeTile(plate, STRIP, 'up');
    if (ch === '\\') return slopeTile(plate, STRIP, 'down');
    return { M: hull, P: panel, G: glass, X: crate, H: starHeart }[ch] || null;
  },
  decor: { a: antenna, r: robot },
  sky(img, map) {
    skyBands(img, [['ink', 270]], 0);
    // a faint nebula
    const rng = makeRng((map.seed || 9) + 2);
    for (let i = 0; i < 900; i++) {
      const x = Math.round(160 + rng.range(-120, 120) * Math.cos(i));
      const y = Math.round(90 + rng.range(-40, 40) * Math.sin(i * 1.7));
      if ((x + y) % 2) setPx(img, x, y, RGBA[i % 3 ? 'night' : 'grape']);
    }
    stars(img, { seed: (map.seed || 9) + 3, count: 90, maxY: 200 });
    // the ringed planet
    const cx = 370;
    const cy = 64;
    const r = 26;
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > r) continue;
        const band = Math.floor((y - cy + r) / 6) % 2;
        const lit = x - cx + (y - cy) < r * 0.5;
        setPx(img, x, y, RGBA[!lit ? 'rust' : band ? 'amber' : 'orange']);
      }
    }
    for (let a = 0; a < 720; a++) {
      const t = (a / 720) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(t) * (r + 16));
      const y = Math.round(cy + Math.sin(t) * 6);
      const behind = Math.sin(t) < 0 && Math.hypot(x - cx, y - cy) < r;
      if (!behind) setPx(img, x, y, RGBA[a % 3 ? 'tan' : 'sand']);
    }
    // a small moon
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) setPx(img, 120 + x, 40 + y, RGBA[x + y < 0 ? 'silver' : 'gray']);
  },
  far(img, map) {
    // the lunar horizon with craters
    hills(img, { seed: (map.seed || 9) + 5, baseY: 236, color: 'gray', outline: 'slate', count: Math.ceil(img.w / 60), minW: 80, maxW: 160, minH: 18, maxH: 40 });
    const rng = makeRng((map.seed || 9) + 6);
    for (let i = 0; i < img.w / 30; i++) {
      const x = rng.int(0, img.w);
      const y = rng.int(214, 250);
      const w = rng.int(5, 12);
      for (let k = -w; k <= w; k++) {
        const yy = Math.round(Math.sqrt(1 - (k / w) ** 2) * 2);
        for (let j = 0; j <= yy; j++) {
          const p = (y + j) * img.w + x + k;
          if (x + k >= 0 && x + k < img.w && img.px[p * 4 + 3]) setPx(img, x + k, y + j, RGBA.slate);
        }
      }
    }
  },
  near(img, map) {
    hills(img, { seed: (map.seed || 9) + 8, baseY: 250, color: 'steel', outline: 'night', count: Math.ceil(img.w / 50), minW: 30, maxW: 70, minH: 10, maxH: 24 });
  },
  edges(img, grid) {
    edges(img, grid, '#', 'cyan', 'steel', 2);
  },
  objects() {},
  skin: {
    spring: ['lime', 'green', 'silver'], boost: ['cyan', 'blue', 'steel'], gel: ['lime', 'green', 'forest'],
    fan: ['cyan', 'white', 'steel'], spinner: ['silver', 'gray', 'steel'], mover: ['silver', 'gray', 'steel'],
    portal: ['magenta', 'hot', 'grape'],
  },
};
