// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The props every level shares, drawn procedurally so they fit any size: the catapult (its arm swings
// on every launch), the basket (a woven scoop with a heart) and the jelly bumper (squashes when hit).
import { RGBA } from './palette.js';
import { makeImage, setPx, fillRect } from './raster.js';
import { basketWalls } from '../physics.js';

const DEG = Math.PI / 180;

function disc(img, cx, cy, r, color) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) setPx(img, x, y, RGBA[color]);
    }
  }
}

function thickLine(img, x0, y0, x1, y1, width, color, edge) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.ceil(len * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    disc(img, x, y, width / 2 + 0.6, edge);
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    disc(img, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width / 2 - 0.2, color);
  }
}

// ---- catapult ----
// Frame geometry: the launch point (where chibis appear) is the bucket at the FIRED angle.
export const CATAPULT = { w: 46, h: 54, armLen: 22, fired: 290, rest: 160 };
const PIVOT = { x: 24, y: 26 };
// Offset from the frame's top-left to the launch point.
export const CATAPULT_ANCHOR = {
  x: Math.round(PIVOT.x + Math.cos(CATAPULT.fired * DEG) * CATAPULT.armLen),
  y: Math.round(PIVOT.y + Math.sin(CATAPULT.fired * DEG) * CATAPULT.armLen),
};

export function catapultFrame(angleDeg) {
  const img = makeImage(CATAPULT.w, CATAPULT.h);
  const px = PIVOT.x;
  const py = PIVOT.y;
  const baseY = py + 16;
  // A-frame and base
  thickLine(img, px - 9, baseY, px, py, 3, 'brown', 'bark');
  thickLine(img, px + 9, baseY, px, py, 3, 'brown', 'bark');
  fillRect(img, Math.round(px - 17), Math.round(baseY - 1), 34, 5, RGBA.bark);
  fillRect(img, Math.round(px - 16), Math.round(baseY), 32, 3, RGBA.brown);
  fillRect(img, Math.round(px - 16), Math.round(baseY), 32, 1, RGBA.tan);
  // wheels
  for (const wx of [px - 11, px + 11]) {
    disc(img, wx, baseY + 6, 4.5, 'ink');
    disc(img, wx, baseY + 6, 3.4, 'bark');
    disc(img, wx, baseY + 6, 1.2, 'tan');
  }
  // arm, counterweight, bucket
  const a = angleDeg * DEG;
  const ex = px + Math.cos(a) * CATAPULT.armLen;
  const ey = py + Math.sin(a) * CATAPULT.armLen;
  const cx = px - Math.cos(a) * 7;
  const cy = py - Math.sin(a) * 7;
  thickLine(img, cx, cy, ex, ey, 3, 'tan', 'bark');
  disc(img, cx, cy, 4, 'steel');
  disc(img, cx - 1, cy - 1, 2.6, 'slate');
  disc(img, ex, ey, 4, 'bark');
  disc(img, ex, ey, 2.8, 'clay');
  disc(img, ex - 1, ey - 1, 1, 'tan');
  disc(img, px, py, 1.6, 'amber');
  return img;
}

export const catapultFrames = () => {
  const frames = [];
  for (let i = 0; i <= 8; i++) frames.push(catapultFrame(CATAPULT.rest + ((CATAPULT.fired - CATAPULT.rest) * i) / 8));
  return frames;
};

// ---- basket ----
export function paintBasket(img, b) {
  // the inside back of the basket, darker, so it reads as a container and not a wire frame
  const lip = b.lip ?? Math.round(b.h * 0.45);
  for (let yy = b.y + b.h - lip; yy < b.y + b.h - b.t; yy++) {
    for (let xx = b.x + b.t; xx < b.x + b.w - b.t; xx++) {
      setPx(img, xx, yy, RGBA[((xx >> 1) + (yy >> 1)) & 1 ? 'rust' : 'bark']);
    }
  }
  for (const [x, y, w, h] of basketWalls(b)) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        const weave = ((xx >> 1) + (yy >> 1)) & 1;
        let c = weave ? 'amber' : 'orange';
        if (xx === x || xx === x + w - 1 || yy === y + h - 1) c = 'bark';
        setPx(img, xx, yy, RGBA[c]);
      }
    }
    fillRect(img, x, y, w, 1, RGBA.yellow);
    setPx(img, x, y, RGBA.bark);
    setPx(img, x + w - 1, y, RGBA.bark);
  }
  // A heart flag on the back wall: you know where to aim.
  const hx = b.x + b.w - b.t - 3;
  const hy = b.y - 12;
  fillRect(img, hx + 1, hy, 1, 12, RGBA.bark);
  const heart = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];
  heart.forEach((row, y) => [...row].forEach((ch, x) => ch === 'R' && setPx(img, hx + 2 + x, hy + y, RGBA[x < 2 && y < 3 ? 'rose' : 'hot'])));
}

// The basket as a stand-alone picture, `b.w` × (`b.h` + 12): its top-left is (b.x, b.y - 12).
export function basketImage(b) {
  const img = makeImage(b.w + 12, b.h + 12);
  paintBasket(img, { ...b, x: 0, y: 12 });
  return img;
}

// ---- jelly bumper ----
export function jellyFrame(r, squash = 0) {
  const w = Math.ceil(r * 2 + 4);
  const img = makeImage(w, w);
  const c = w / 2;
  const rx = r * (1 + squash);
  const ry = r * (1 - squash);
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5 - c) / rx;
      const v = (y + 0.5 - c - squash * r) / ry;
      const d = u * u + v * v;
      if (d > 1) continue;
      let col = 'rose';
      if (d > 0.78) col = 'magenta';
      if (u < -0.25 && v < -0.35 && d < 0.5) col = 'white';
      setPx(img, x, y, RGBA[col]);
    }
  }
  // outline
  const out = makeImage(w, w);
  out.px.set(img.px);
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (img.px[i + 3]) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const xx = x + dx;
        const yy = y + dy;
        return xx >= 0 && yy >= 0 && xx < w && yy < w && img.px[(yy * w + xx) * 4 + 3];
      });
      if (n) setPx(out, x, y, RGBA.grape);
    }
  }
  // face
  const ey = Math.round(c + squash * r - r * 0.05);
  const ex = Math.round(r * 0.38);
  for (const sx of [-1, 1]) {
    fillRect(out, Math.round(c + sx * ex) - (sx < 0 ? 1 : 0), ey - 1, 1, squash ? 1 : 2, RGBA.ink);
  }
  setPx(out, Math.round(c), ey + 2, RGBA.ink);
  return out;
}
