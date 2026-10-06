// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// My level editor's eyes: renders every level to <outDir>/<id>.png with hard pixels, as the camera sees
// it screen by screen (parallax included), with the catapult, bumpers, interactive pieces and a few chibis.
//   node tools/preview_all.mjs <outDir> [zoom]
import { MAPS } from '../src/maps.js';
import { composeLevel, flatten } from '../src/level.js';
import { makeImage, blit } from '../src/art/raster.js';
import { catapultFrame, CATAPULT, CATAPULT_ANCHOR, jellyFrame, basketImage } from '../src/art/props.js';
import { chibiSprite } from '../src/art/chibi.js';
import { waifuSprite } from '../src/art/waifus.js';
import { THEMES } from '../src/art/themes.js';
import { drawElement } from '../src/art/elements_art.js';
import { RGBA } from '../src/art/palette.js';
import { VIEW_W } from '../src/physics.js';
import { writePng } from './png.mjs';

const [outDir = 'out', zoom = '3'] = process.argv.slice(2);

// A tiny stand-in for a canvas 2D context, enough for drawElement (fillRect + translate/rotate).
function fakeCtx(img) {
  let tx = 0;
  let ty = 0;
  let rot = 0;
  const stack = [];
  return {
    fillStyle: '#000',
    save() { stack.push([tx, ty, rot]); },
    restore() { [tx, ty, rot] = stack.pop(); },
    translate(x, y) { tx += x; ty += y; },
    rotate(a) { rot += a; },
    fillRect(x, y, w, h) {
      const m = /^#/.test(this.fillStyle) ? this.fillStyle : null;
      if (!m) return;
      const n = parseInt(m.slice(1), 16);
      const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const lx = x + i;
        const ly = y + j;
        const X = Math.round(tx + lx * Math.cos(rot) - ly * Math.sin(rot));
        const Y = Math.round(ty + lx * Math.sin(rot) + ly * Math.cos(rot));
        if (X >= 0 && Y >= 0 && X < img.w && Y < img.h) img.px.set(c, (Y * img.w + X) * 4);
      }
    },
  };
}

for (const level of MAPS) {
  const layers = composeLevel(level);
  const screens = Math.ceil(level.width / VIEW_W);
  const out = makeImage(level.width, 270);
  for (let s = 0; s < screens; s++) {
    const cam = Math.min(s * VIEW_W, level.width - VIEW_W);
    blit(out, flatten(layers, level, cam), cam, 0);
  }
  blit(out, basketImage(level.basket), level.basket.x, level.basket.y - 12);
  const c = level.catapult;
  blit(out, catapultFrame(CATAPULT.rest), c.x - CATAPULT_ANCHOR.x, c.y - CATAPULT_ANCHOR.y);
  for (const b of level.bumpers || []) {
    const f = jellyFrame(b.r);
    blit(out, f, Math.round(b.x - f.w / 2), Math.round(b.y - f.h / 2));
  }
  const ctx = fakeCtx(out);
  for (const [id, e] of (level.elements || []).entries()) {
    const el = { lastHit: -9, id, ...e };
    if (e.kind === 'spinner') el.body = { getAngle: () => 0.5 };
    if (e.kind === 'mover') el.body = { getPosition: () => ({ x: (e.x + (e.w ?? 48) / 2) / 16, y: (e.y + (e.h ?? 8) / 2) / 16 }) };
    drawElement(ctx, { w: 32, h: 120, len: 48, dir: 1, ...el }, 0.3, THEMES[level.theme].skin);
  }
  if (level.waifu) blit(out, waifuSprite(), level.waifu.x, level.waifu.y);
  ['mochiuwu', 'pixelpanda', 'tofu_', 'gremlin99'].forEach((n, i) => {
    const s = chibiSprite(n);
    blit(out, s.img, 120 + i * 40 - s.ox, 70 - s.oy);
  });
  void RGBA;
  writePng(`${outDir}/${level.id}.png`, out, Number(zoom));
}
console.log('ok', MAPS.map((m) => `${m.id}(${m.width})`).join(' '));
