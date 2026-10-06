// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Ambient particles drawn over the scenery every frame: petals, snow, sparkles, twinkling stars. They are
// a pure function of time (no state), so a replay with the same seed looks the same. Screen-space, with a
// little parallax so they feel like part of the world when the camera moves.
import { PAL } from './palette.js';

const hash = (i, k) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawAmbient(ctx, kind, t, camX, w = 480, h = 270) {
  if (!kind) return;
  const n = { petals: 26, snow: 60, sparkle: 18, stars: 30 }[kind] || 0;
  for (let i = 0; i < n; i++) {
    const a = hash(i, 1);
    const b = hash(i, 2);
    const c = hash(i, 3);
    if (kind === 'petals') {
      const speed = 14 + c * 16;
      const y = ((b * (h + 20) + t * speed) % (h + 20)) - 10;
      const x = (((a * (w + 40) - t * (10 + c * 12) + Math.sin(t * 1.3 + i) * 8 - camX * 0.6) % (w + 40)) + w + 40) % (w + 40) - 20;
      const flip = Math.sin(t * 3 + i) > 0;
      ctx.fillStyle = PAL[i % 3 ? 'rose' : 'hot'];
      ctx.fillRect(Math.round(x), Math.round(y), flip ? 2 : 1, flip ? 1 : 2);
    } else if (kind === 'snow') {
      const speed = 10 + c * 22;
      const y = ((b * (h + 10) + t * speed) % (h + 10)) - 5;
      const x = (((a * w + Math.sin(t * 0.9 + i * 2) * 6 - camX * 0.7) % w) + w) % w;
      ctx.fillStyle = PAL[c > 0.7 ? 'white' : 'silver'];
      ctx.fillRect(Math.round(x), Math.round(y), c > 0.85 ? 2 : 1, c > 0.85 ? 2 : 1);
    } else if (kind === 'sparkle' || kind === 'stars') {
      const phase = (t * (0.6 + c) + a * 7) % 2;
      if (phase > 0.6) continue;
      const x = (((a * w - camX * (kind === 'stars' ? 0.15 : 0.5)) % w) + w) % w;
      const y = b * (kind === 'stars' ? h * 0.6 : h * 0.8);
      const color = kind === 'stars' ? 'white' : i % 2 ? 'yellow' : 'white';
      ctx.fillStyle = PAL[color];
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (phase > 0.15 && phase < 0.45) {
        ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
        ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
      }
    }
  }
}
