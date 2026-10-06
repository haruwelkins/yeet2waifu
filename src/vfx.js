// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Pixel VFX: small particles that answer what happens in the world (dust when you land, sparks and a ring
// when a jelly kicks you, speed lines on a dash strip, a swirl at a portal, confetti and hearts in the
// basket, smoke at the catapult), plus screen shake, a white flash and a chromatic "punch" the post-process
// shader reads. Everything is drawn on the 480×270 world canvas with whole pixels.
import { PAL } from './art/palette.js';
import { THEMES } from './art/themes.js';

const DUST = { plains: ['sand', 'tan'], dungeon: ['gray', 'slate'], speed: ['tan', 'clay'], castle: ['gray', 'silver'],
  midnight: ['green', 'deep'], sakura: ['rose', 'white'], candy: ['white', 'rose'], ice: ['white', 'silver'], space: ['silver', 'gray'] };
const CONFETTI = ['yellow', 'hot', 'cyan', 'lime', 'white', 'amber', 'rose'];
const HEART = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];

export class VFX {
  constructor(game) {
    this.game = game;
    this.parts = [];
    this.shake = 0;
    this.flash = 0;
    this.punch = 0;      // 0..1, read by the shader for chromatic aberration
    this.lastT = 0;
    this.seed = 1;
    game.on((ev) => this.onEvent(ev));
  }

  rand() {
    // deterministic per session so captures repeat; quality is irrelevant here
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  add(p) {
    if (this.parts.length > 600) this.parts.shift();
    this.parts.push({ age: 0, gravity: 0, drag: 0, size: 1, ...p });
  }

  burst(x, y, n, { speed = [40, 120], colors = ['white'], life = [0.25, 0.5], gravity = 0, drag = 2, size = 1, kind = 'dot', dir = null, spread = Math.PI * 2, glow = false } = {}) {
    for (let i = 0; i < n; i++) {
      const a = dir == null ? this.rand() * Math.PI * 2 : dir + (this.rand() - 0.5) * spread;
      const sp = speed[0] + this.rand() * (speed[1] - speed[0]);
      this.add({ kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: life[0] + this.rand() * (life[1] - life[0]),
        color: colors[Math.floor(this.rand() * colors.length)], gravity, drag, size, glow });
    }
  }

  ring(x, y, { r0 = 3, r1 = 16, life = 0.25, color = 'white', glow = false } = {}) {
    this.add({ kind: 'ring', x, y, vx: 0, vy: 0, life, r0, r1, color, glow });
  }

  dustColors() {
    const map = this.game.map;
    return DUST[map && map.theme] || DUST.plains;
  }

  onEvent(ev) {
    const g = this.game;
    if (ev.type === 'fx') {
      switch (ev.kind) {
        case 'impact': {
          const n = Math.min(10, 2 + Math.floor(ev.power / 2));
          this.burst(ev.x, ev.y, n, { speed: [15, 30 + ev.power * 4], colors: this.dustColors(), life: [0.3, 0.6], gravity: 60,
            drag: 3, dir: -Math.PI / 2, spread: Math.PI * 1.3, kind: 'dust' });
          if (ev.power > 12) this.shake = Math.max(this.shake, 1.2);
          break;
        }
        case 'bump':
          this.ring(ev.cx, ev.cy, { r0: ev.r, r1: ev.r + 10, life: 0.22, color: 'white', glow: true });
          this.burst(ev.x, ev.y, 8, { speed: [60, 140], colors: ['yellow', 'white', 'rose'], life: [0.2, 0.4], kind: 'star', glow: true });
          this.shake = Math.max(this.shake, 1.5);
          this.punch = Math.max(this.punch, 0.35);
          break;
        case 'spring':
          this.burst(ev.x, ev.y, 10, { speed: [50, 110], colors: ['white', 'yellow'], life: [0.15, 0.3], dir: -(ev.angle * Math.PI) / 180,
            spread: 1.1, kind: 'line' });
          this.ring(ev.x, ev.y, { r0: 2, r1: 12, life: 0.18, color: 'yellow' });
          break;
        case 'boost':
          this.burst(ev.x - ev.dir * 6, ev.y, 6, { speed: [80, 160], colors: ['white', 'cyan'], life: [0.12, 0.22], dir: ev.dir > 0 ? Math.PI : 0,
            spread: 0.25, kind: 'line' });
          break;
        case 'warp':
          for (const [x, y] of [[ev.x, ev.y], [ev.tx, ev.ty]]) {
            this.ring(x, y, { r0: 2, r1: 14, life: 0.3, color: 'magenta', glow: true });
            this.burst(x, y, 10, { speed: [30, 80], colors: ['magenta', 'hot', 'white'], life: [0.25, 0.45], kind: 'star', glow: true });
          }
          break;
        case 'gel':
          this.burst(ev.x, ev.y, 7, { speed: [20, 60], colors: ['lime', 'white'], life: [0.25, 0.45], gravity: 120, dir: -Math.PI / 2, spread: 1.6 });
          break;
        case 'basket':
          this.burst(ev.x, ev.y - 6, 18, { speed: [40, 110], colors: CONFETTI, life: [0.6, 1.1], gravity: 90, drag: 2.5, dir: -Math.PI / 2,
            spread: 1.8, kind: 'confetti' });
          this.add({ kind: 'heart', x: ev.x, y: ev.y - 10, vx: 0, vy: -24, life: 0.9, color: 'hot', glow: true });
          this.punch = Math.max(this.punch, 0.2);
          break;
        default:
      }
    } else if (ev.type === 'launch' && g.map) {
      const c = g.map.catapult;
      this.burst(c.x - 4, c.y + 30, 3, { speed: [10, 30], colors: this.dustColors(), life: [0.3, 0.5], gravity: -10, drag: 2, kind: 'dust' });
    } else if (ev.type === 'end' && ev.winner) {
      this.flash = 0.7;
      this.shake = 3;
      this.punch = 1;
      const b = g.arena && g.arena.basket;
      if (b) {
        for (let i = 0; i < 6; i++) this.add({ kind: 'heart', x: b.x + b.w / 2 + (this.rand() - 0.5) * 40, y: b.y, vx: (this.rand() - 0.5) * 20, vy: -30 - this.rand() * 30, life: 1.6, color: i % 2 ? 'hot' : 'rose', glow: true });
        this.burst(b.x + b.w / 2, b.y, 40, { speed: [60, 170], colors: CONFETTI, life: [0.9, 1.6], gravity: 80, drag: 1.8, dir: -Math.PI / 2, spread: 2.4, kind: 'confetti' });
      }
    } else if (ev.type === 'end' && !ev.winner) {
      this.shake = 1;
    }
  }

  update() {
    const t = this.game.time;
    const dt = Math.min(0.1, Math.max(0, t - this.lastT));
    this.lastT = t;
    this.shake = Math.max(0, this.shake - dt * 8);
    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.punch = Math.max(0, this.punch - dt * 2.5);
    for (const p of this.parts) {
      p.age += dt;
      p.vy += p.gravity * dt;
      const k = Math.max(0, 1 - p.drag * dt);
      p.vx *= k;
      p.vy *= k;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.age < p.life);
  }

  // Screen-shake offset in world pixels for this frame (whole pixels, so nothing goes soft).
  offset() {
    if (this.shake < 0.2) return [0, 0];
    const t = this.game.time;
    return [Math.round(Math.sin(t * 73) * this.shake), Math.round(Math.cos(t * 61) * this.shake)];
  }

  // glowCtx: the renderer's emissive layer; particles marked glow are drawn there too
  draw(ctx, glowCtx = null) {
    this.drawParts(ctx, this.parts);
    if (glowCtx) this.drawParts(glowCtx, this.parts.filter((p) => p.glow));
  }

  drawParts(ctx, parts) {
    for (const p of parts) {
      const k = p.age / p.life;
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      ctx.fillStyle = PAL[p.color] || p.color;
      switch (p.kind) {
        case 'ring': {
          const r = p.r0 + (p.r1 - p.r0) * k;
          const steps = Math.ceil(r * 6);
          for (let i = 0; i < steps; i++) {
            const a = (i / steps) * Math.PI * 2;
            ctx.fillRect(Math.round(p.x + Math.cos(a) * r), Math.round(p.y + Math.sin(a) * r), 1, 1);
          }
          break;
        }
        case 'star':
          ctx.fillRect(x, y, 1, 1);
          if (k < 0.5) {
            ctx.fillRect(x - 1, y, 3, 1);
            ctx.fillRect(x, y - 1, 1, 3);
          }
          break;
        case 'line': {
          const len = 4;
          const sp = Math.hypot(p.vx, p.vy) || 1;
          for (let i = 0; i < len; i++) ctx.fillRect(Math.round(p.x - (p.vx / sp) * i), Math.round(p.y - (p.vy / sp) * i), 1, 1);
          break;
        }
        case 'confetti':
          ctx.fillRect(x, y, Math.sin(p.age * 20 + p.x) > 0 ? 2 : 1, Math.sin(p.age * 20 + p.x) > 0 ? 1 : 2);
          break;
        case 'dust':
          ctx.fillRect(x, y, k < 0.5 ? 2 : 1, k < 0.5 ? 2 : 1);
          break;
        case 'heart':
          HEART.forEach((row, j) => [...row].forEach((ch, i) => {
            if (ch === 'R') ctx.fillRect(Math.round(p.x + Math.sin(p.age * 6) * 2) - 3 + i, y + j, 1, 1);
          }));
          break;
        default:
          ctx.fillRect(x, y, p.size, p.size);
      }
    }
  }

  // Shader knobs per world: how strong the (selective) glow is, the vignette, a color grade.
  look() {
    const theme = this.game.map ? this.game.map.theme : 'plains';
    const night = ['castle', 'midnight', 'ice', 'space', 'dungeon'].includes(theme);
    const t = THEMES[theme] || {};
    return {
      bloom: t.bloom ?? (night ? 1.6 : 1.2),
      vignette: night ? 0.42 : 0.28,
      saturation: night ? 1.12 : 1.08,
      contrast: 1.05,
    };
  }
}
