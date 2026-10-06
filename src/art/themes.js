// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// A theme = the look of a world: which sprite each grid character draws, which characters are solid
// (and how bouncy), the backdrop in parallax layers (sky fixed, far and near hills), its multi-tile
// objects, and the colors its interactive pieces wear.
import { RGBA } from './palette.js';
import { blit, setPx, makeImage, getPx } from './raster.js';
import { skyBands, hills, cloud } from './sky.js';
import * as plains from './tiles_plains.js';
import { dungeon } from './theme_dungeon.js';
import { speed } from './theme_speed.js';
import { castle } from './theme_castle.js';
import { midnight } from './theme_midnight.js';
import { sakura } from './theme_sakura.js';
import { candy } from './theme_candy.js';
import { ice } from './theme_ice.js';
import { space } from './theme_space.js';

export const TILE = 16;
const at = (grid, x, y) => (grid[y] && grid[y][x]) || '.';
const isSlope = (ch) => ch === '/' || ch === '\\';

// Dark 1-px sides where solid ground meets air, so a cliff reads as a cliff.
function groundEdges(img, grid, ch, topColor, sideColor, grassRows) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== ch) continue;
      for (const [nx, px] of [[x - 1, x * TILE], [x + 1, x * TILE + TILE - 1]]) {
        const n = at(grid, nx, y);
        if (n === ch || isSlope(n)) continue;
        const grassy = at(grid, x, y - 1) !== ch && !isSlope(at(grid, x, y - 1));
        for (let r = 0; r < TILE; r++) setPx(img, px, y * TILE + r, RGBA[grassy && r < grassRows ? topColor : sideColor]);
      }
    }
  }
}

// A 45° slope tile cut from the ground fill, with the surface band following the diagonal.
// band: palette names from the surface down (e.g. grass rows).
export function slopeTile(fill, band, dir) {
  const img = makeImage(TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const surface = dir === 'up' ? TILE - 1 - x : x;
      const depth = y - surface;
      if (depth < 0) continue;
      const c = depth < band.length ? RGBA[band[depth]] : getPx(fill, x, y);
      setPx(img, x, y, c);
    }
  }
  return img;
}

const plainsSlopes = {
  '/': slopeTile(plains.dirt, ['lime', 'lime', 'green', 'green', 'forest'], 'up'),
  '\\': slopeTile(plains.dirt, ['lime', 'lime', 'green', 'green', 'forest'], 'down'),
};

export const THEMES = {
  plains: {
    solid: plains.SOLID,
    abyss: [RGBA.deep, RGBA.ink],
    tile(grid, x, y) {
      const ch = at(grid, x, y);
      if (ch === '#') {
        const up = at(grid, x, y - 1);
        return up === '#' || isSlope(up) ? plains.dirt : plains.grassTop;
      }
      if (isSlope(ch)) return plainsSlopes[ch];
      return { B: plains.brick, H: plains.heartBlock, S: plains.stone }[ch] || null;
    },
    decor: plains.DECOR,
    sky(img, map) {
      const seed = map.seed || 7;
      const sunset = map.mood === 'sunset';
      if (sunset) skyBands(img, [['navy', 44], ['magenta', 104], ['rose', 156], ['amber', 270]], 10);
      else skyBands(img, [['blue', 186], ['cyan', 270]], 12);
      const puff = sunset ? { light: 'rose', shade: 'magenta' } : {};
      cloud(img, 40, 30, 48, { seed: seed + 1, ...puff });
      cloud(img, 190, 18, 36, { seed: seed + 2, ...puff });
      cloud(img, 300, 44, 56, { seed: seed + 3, ...puff });
      cloud(img, 420, 22, 40, { seed: seed + 4, ...puff });
    },
    far(img, map) {
      const sunset = map.mood === 'sunset';
      hills(img, { seed: (map.seed || 7) + 10, baseY: 240, color: sunset ? 'deep' : 'forest', outline: sunset ? 'ink' : 'deep',
        count: Math.ceil(img.w / 50), minW: 70, maxW: 130, minH: 40, maxH: 78 });
    },
    near(img, map) {
      const sunset = map.mood === 'sunset';
      hills(img, { seed: (map.seed || 7) + 20, baseY: 240, color: sunset ? 'forest' : 'green', rim: sunset ? 'green' : 'lime',
        outline: sunset ? 'deep' : 'forest', count: Math.ceil(img.w / 40), minW: 40, maxW: 80, minH: 16, maxH: 36 });
    },
    edges(img, grid) {
      groundEdges(img, grid, '#', 'forest', 'bark', 5);
    },
    objects(img, map) {
      for (const p of map.pipes || []) {
        for (let y = p.y + plains.pipeLip.h; y < p.y + p.h; y++) blit(img, plains.pipeBody, p.x, y);
        blit(img, plains.pipeLip, p.x, p.y);
      }
    },
    // the colors its interactive pieces wear
    skin: {
      spring: ['red', 'crimson', 'silver'], boost: ['yellow', 'orange', 'steel'], gel: ['lime', 'green', 'forest'],
      fan: ['silver', 'gray', 'steel'], spinner: ['tan', 'brown', 'bark'], mover: ['clay', 'rust', 'bark'],
      portal: ['cyan', 'blue', 'navy'],
    },
  },
  dungeon,
  speed,
  castle,
  midnight,
  sakura,
  candy,
  ice,
  space,
};
