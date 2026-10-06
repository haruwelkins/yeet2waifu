// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// How the interactive pieces look, drawn every frame on the world canvas (they animate): the spring
// squashes, the dash strip's chevrons run, the gel wobbles and bubbles, the fan spins and blows.
// Colors come from the world's skin, so the same piece fits every world.
import { PAL } from './palette.js';

const rect = (ctx, c, x, y, w, h) => {
  ctx.fillStyle = PAL[c];
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

export function drawElement(ctx, e, t, skin) {
  const hit = t - e.lastHit;
  switch (e.kind) {
    case 'spring': {
      const [top, shade, metal] = skin.spring;
      const squashed = hit < 0.12;
      rect(ctx, 'ink', e.x - 1, e.y + 2, e.w + 2, 5);
      rect(ctx, 'steel', e.x, e.y + 3, e.w, 3);
      if (!squashed) {
        for (let i = 0; i < 4; i++) rect(ctx, metal, e.x + 3 + (i % 2) * 4, e.y + 1 - i * 2, e.w - 10, 1);
      }
      const ty = squashed ? e.y : e.y - 8;
      rect(ctx, 'ink', e.x - 1, ty - 1, e.w + 2, 4);
      rect(ctx, top, e.x, ty, e.w, 2);
      rect(ctx, shade, e.x, ty + 1, e.w, 1);
      rect(ctx, 'white', e.x + 1, ty, 2, 1);
      break;
    }
    case 'boost': {
      const [a, b, base] = skin.boost;
      rect(ctx, 'ink', e.x, e.y - 1, e.w, 6);
      rect(ctx, base, e.x + 1, e.y, e.w - 2, 4);
      const off = Math.floor(t * 24) % 8;
      for (let cx = -8; cx < e.w; cx += 8) {
        const x0 = e.x + 1 + ((cx + off * e.dir + 16) % (e.w - 2) + (e.w - 2)) % (e.w - 2);
        for (let i = 0; i < 2; i++) {
          const dx = e.dir > 0 ? i : 1 - i;
          rect(ctx, hit < 0.2 ? 'white' : i ? b : a, x0 + dx, e.y + i, 2, 1);
          rect(ctx, hit < 0.2 ? 'white' : i ? b : a, x0 + dx, e.y + 3 - i, 2, 1);
        }
      }
      break;
    }
    case 'gel': {
      const [light, mid, dark] = skin.gel;
      rect(ctx, dark, e.x, e.y + 2, e.w, e.h - 2);
      rect(ctx, mid, e.x + 1, e.y + 2, e.w - 2, e.h - 3);
      const wob = hit < 0.3 ? 2 : 1;
      for (let x = 0; x < e.w; x++) {
        const s = Math.round(Math.sin(x * 0.45 + t * 3) * wob);
        rect(ctx, light, e.x + x, e.y + 1 + s, 1, 2);
        rect(ctx, dark, e.x + x, e.y + s, 1, 1);
      }
      for (let i = 0; i < Math.max(2, e.w / 12); i++) {
        const bx = e.x + 3 + ((i * 13) % Math.max(4, e.w - 6));
        const by = e.y + e.h - 3 - ((t * 9 + i * 7) % Math.max(4, e.h - 5));
        rect(ctx, 'white', bx, by, 1, 1);
      }
      break;
    }
    case 'fan': {
      const [light, mid, dark] = skin.fan;
      for (let i = 0; i < Math.round(e.w / 3); i++) {
        const wx = e.x + 2 + ((i * 11) % (e.w - 4));
        const wy = e.y - ((t * 70 + i * 29) % e.h);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(Math.round(wx), Math.round(wy), 1, 3);
      }
      rect(ctx, 'ink', e.x - 1, e.y - 1, e.w + 2, 8);
      rect(ctx, dark, e.x, e.y, e.w, 6);
      const frame = Math.floor(t * 20) % 2;
      for (let x = 2; x < e.w - 2; x += 4) rect(ctx, (x / 4 + frame) % 2 ? light : mid, e.x + x, e.y + 1, 3, 3);
      break;
    }
    case 'spinner': {
      const [light, mid, dark] = skin.spinner;
      ctx.save();
      ctx.translate(Math.round(e.x), Math.round(e.y));
      ctx.rotate(e.body.getAngle());
      rect(ctx, dark, -e.len / 2 - 1, -3, e.len + 2, 6);
      rect(ctx, mid, -e.len / 2, -2, e.len, 4);
      rect(ctx, light, -e.len / 2, -2, e.len, 1);
      ctx.restore();
      rect(ctx, 'ink', e.x - 2, e.y - 2, 5, 5);
      rect(ctx, 'silver', e.x - 1, e.y - 1, 3, 3);
      break;
    }
    case 'mover': {
      const [light, mid, dark] = skin.mover;
      const p = e.body.getPosition();
      const x = p.x * 16 - e.w / 2;
      const y = p.y * 16 - e.h / 2;
      rect(ctx, 'ink', x - 1, y - 1, e.w + 2, e.h + 2);
      rect(ctx, mid, x, y, e.w, e.h);
      rect(ctx, light, x, y, e.w, 1);
      for (let i = 6; i < e.w; i += 8) rect(ctx, dark, x + i, y + 1, 1, e.h - 1);
      break;
    }
    case 'warp': {
      if (e.pipe) {
        // the pipe is part of the level; its mouth flashes when someone goes in
        if (hit < 0.25) rect(ctx, 'white', e.x + 6, e.y + 1, e.w - 12, 2);
        break;
      }
      const [light, mid, dark] = skin.portal;
      for (const [cx, cy] of [[e.x + e.w / 2, e.y - 6], [e.to.x, e.to.y]]) {
        for (let a = 0; a < 16; a++) {
          const ang = (a / 16) * Math.PI * 2 + t * 4;
          rect(ctx, a % 3 ? mid : light, cx + Math.cos(ang) * 9, cy + Math.sin(ang) * 6, 2, 2);
        }
        rect(ctx, dark, cx - 4, cy - 2, 8, 4);
      }
      break;
    }
  }
}
