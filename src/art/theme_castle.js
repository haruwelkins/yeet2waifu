// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// World "castle": a vampire castle at night. Big stone blocks, red brick, candelabras, stained glass, a huge
// moon, bats, towers with lit windows. A genre homage drawn from scratch.
import { RGBA } from './palette.js';
import { sprite, setPx, fillRect } from './raster.js';
import { brickTile, blockTile, withTop, slopeTile, edges, stars, moon, castles, bats } from './kit.js';
import { skyBands, hills } from './sky.js';

const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const slope = (c) => c === '/' || c === '\\';

const stoneFill = brickTile({ base: 'slate', light: 'gray', dark: 'steel', mortar: 'night', h: 8, w: 16 });
const stoneTop = withTop(stoneFill, ['silver', 'gray'], 11);
const redBrick = brickTile({ base: 'rust', light: 'clay', dark: 'crimson', mortar: 'plum' });
const pillar = blockTile({ base: 'steel', light: 'slate', dark: 'night', line: 'ink', speckle: 'night', seed: 6 });
const gem = blockTile({ base: 'slate', light: 'gray', dark: 'steel', line: 'ink', seed: 9 });
['..R..', '.RRR.', 'RRRRR', '.RRR.', '..R..'].forEach((row, y) =>
  [...row].forEach((ch, x) => ch === 'R' && setPx(gem, 5 + x, 5 + y, RGBA[y < 2 ? 'rose' : 'hot'])));

const candle = sprite({ Y: 'yellow', A: 'amber', W: 'white', S: 'sand', G: 'amber', g: 'orange' }, `
.Y...Y...Y.
.A...A...A.
.W...W...W.
.S...S...S.
.S...S...S.
.GgggGgggG.
.....G.....
.....g.....
.....G.....
....GGG....
...GgggG...
`);

const windowGlass = sprite({ K: 'ink', R: 'hot', C: 'cyan', A: 'amber', L: 'lime', M: 'magenta' }, `
....KKKK....
..KKRRRRKK..
.KRRKCCKRRK.
.KRKCCCCKRK.
KAAKCCCCKAAK
KAAKKKKKKAAK
KLLKMMMMKLLK
KLLKMMMMKLLK
KLLKMMMMKLLK
KKKKKKKKKKKK
KCCKAAAAKCCK
KCCKAAAAKCCK
KKKKKKKKKKKK
`);

export const castle = {
  solid: {
    '#': { friction: 0.6, restitution: 0.1 },
    B: { friction: 0.5, restitution: 0.2 },
    P: { friction: 0.6, restitution: 0.1 },
    H: { friction: 0.5, restitution: 0.35 },
  },
  abyss: [RGBA.night, RGBA.ink],
  tile(grid, x, y) {
    const ch = at(grid, x, y);
    if (ch === '#') {
      const up = at(grid, x, y - 1);
      return up === '#' || slope(up) ? stoneFill : stoneTop;
    }
    if (ch === '/') return slopeTile(stoneFill, ['silver', 'gray'], 'up');
    if (ch === '\\') return slopeTile(stoneFill, ['silver', 'gray'], 'down');
    return { B: redBrick, P: pillar, H: gem }[ch] || null;
  },
  decor: { c: candle, w: windowGlass },
  sky(img, map) {
    skyBands(img, [['ink', 90], ['night', 190], ['navy', 270]], 10);
    stars(img, { seed: (map.seed || 2) + 1, count: 70, maxY: 170 });
    moon(img, 380, 62, 28, { light: 'sand', shade: 'tan', craters: 'tan', glow: 'steel' });
    bats(img, { seed: (map.seed || 2) + 3, count: 5, color: 'ink', maxY: 110 });
  },
  far(img, map) {
    castles(img, { seed: (map.seed || 2) + 7, baseY: 236, color: 'night', window: 'steel' });
  },
  near(img, map) {
    hills(img, { seed: (map.seed || 2) + 11, baseY: 248, color: 'ink', outline: 'ink', count: Math.ceil(img.w / 40), minW: 40, maxW: 90, minH: 14, maxH: 40 });
  },
  edges(img, grid) {
    edges(img, grid, '#', 'gray', 'ink', 3);
  },
  objects() {},
  skin: {
    spring: ['silver', 'gray', 'steel'], boost: ['magenta', 'grape', 'ink'], gel: ['lime', 'green', 'forest'],
    fan: ['gray', 'slate', 'steel'], spinner: ['silver', 'gray', 'steel'], mover: ['slate', 'steel', 'night'],
    portal: ['magenta', 'grape', 'plum'],
  },
};
