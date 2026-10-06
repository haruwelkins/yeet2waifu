// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Two layers, both scaled to the screen with hard (nearest) pixels:
//   world: 480×270, the level and everything that moves;
//   mid:   640×360, the waifu: her pixels are 3/4 of a world pixel, so a 32×32 waifu stands 24 world px
//           tall next to the 14-px chibis instead of towering over them;
//   ui:    960×540, text and panels (half-size pixels, so the HUD stays small but still pixel-crisp);
//   and on top, the players' names at full screen resolution (see label()).
import { VIEW_W, VIEW_H, PPM } from './physics.js';
import { composeLevel, PARALLAX } from './level.js';
import { ROUND_MAPS } from './maps.js';
import { THEMES } from './art/themes.js';
import { drawElement } from './art/elements_art.js';
import { drawAmbient } from './art/ambient.js';
import { catapultFrames, CATAPULT_ANCHOR, jellyFrame, basketImage } from './art/props.js';
import { chibiSprite } from './art/chibi.js';
import { waifuSprite, waifuName } from './art/waifus.js';
import { PAL } from './art/palette.js';
import { drawText, loadFonts, textSprite, LABEL_FONT } from './text.js';
import { VERSION } from './version.js';

function toCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.w;
  c.height = img.h;
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(img.w, img.h);
  id.data.set(img.px);
  ctx.putImageData(id, 0, 0);
  return c;
}

function dimmed(canvas, alpha = 0.45) {
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(24,20,37,${alpha})`;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

const UI = 2; // ui pixels per world pixel
const MID = 4 / 3; // mid (waifu) pixels per world pixel

export class Renderer {
  constructor(canvas, game, t) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.t = t;
    this.world = Object.assign(document.createElement('canvas'), { width: VIEW_W, height: VIEW_H });
    this.wctx = this.world.getContext('2d');
    this.ui = Object.assign(document.createElement('canvas'), { width: VIEW_W * UI, height: VIEW_H * UI });
    this.uctx = this.ui.getContext('2d');
    this.mid = Object.assign(document.createElement('canvas'), { width: VIEW_W * MID, height: VIEW_H * MID });
    this.mctx = this.mid.getContext('2d');
    // what glows (only with the post-process): same world coordinates, drawn again here on black
    this.glow = Object.assign(document.createElement('canvas'), { width: VIEW_W, height: VIEW_H });
    this.gctx = this.glow.getContext('2d');
    this.emit = document.createElement('canvas');
    this.labels = [];
    this.levels = new Map();
    this.catFrames = catapultFrames().map(toCanvas);
    this.jellies = new Map();
    this.chibis = new Map();
    this.waifu = toCanvas(waifuSprite(game.cfg.waifu));
    this.waifuName = waifuName(game.cfg.waifu);
    this.fontsReady = false;
    loadFonts().then(() => (this.fontsReady = true)).catch(() => (this.fontsReady = true));
    this.chatStatus = 'off';
    this.channel = '';
    this.joiners = [];
    this.lastHeat = [];
    this.lastLaunch = -10;
    this.squash = new Map();
    this.camX = 0;
    this.camTarget = 0;
    this.camT = 0;
    this.camMap = null;
    game.on((ev) => {
      if (ev.type === 'join') this.joiners = [ev.player, ...this.joiners].slice(0, 10);
      if (ev.type === 'phase' && ev.phase === 'join') this.joiners = [];
      if (ev.type === 'heatResult') this.lastHeat = ev.qualified;
      if (ev.type === 'launch') this.lastLaunch = game.time;
      if (ev.type === 'waifu') {
        this.waifu = toCanvas(waifuSprite(ev.waifu));
        this.waifuName = waifuName(ev.waifu);
      }
    });
  }

  levelLayers(map) {
    let l = this.levels.get(map.id);
    if (!l) {
      const img = composeLevel(map);
      l = { sky: toCanvas(img.sky), far: toCanvas(img.far), near: toCanvas(img.near), fg: toCanvas(img.fg) };
      this.levels.set(map.id, l);
    }
    return l;
  }

  // The camera only moves on courses longer than the screen. It tours the course while people sign up,
  // flies from the basket back to the catapult in the round intro, follows the front of the flying swarm,
  // and rests on the basket for the results.
  updateCamera(map) {
    const g = this.game;
    const maxX = Math.max(0, map.width - VIEW_W);
    const dt = Math.min(0.1, Math.max(0, g.time - this.camT));
    this.camT = g.time;
    if (this.camMap !== map.id) {
      this.camMap = map.id;
      this.camX = 0;
      this.camTarget = 0;
    }
    if (!maxX) {
      this.camX = 0;
      return;
    }
    const clamp = (v) => Math.min(maxX, Math.max(0, v));
    const basketView = clamp(map.basket.x + map.basket.w / 2 - VIEW_W * 0.62);
    let target = basketView;
    let speed = 3;
    if (['join', 'aim', 'idle'].includes(g.phase)) {
      target = maxX * (0.5 - 0.5 * Math.cos((g.time * 2 * Math.PI) / 16));
      speed = 12;
    } else if (g.phase === 'roundIntro') {
      const k = Math.min(1, g.phaseT / Math.max(0.5, g.phaseDur - 0.6));
      const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      target = basketView * (1 - ease);
      speed = 30;
    } else if (g.phase === 'heatIntro') {
      target = 0;
      speed = 5;
    } else if (g.phase === 'replay') {
      const w = this.replayWinner();
      if (w) target = clamp(w[1] - VIEW_W * 0.5);
      speed = 4;
    } else if ((g.phase === 'launch' || g.phase === 'settle') && g.arena) {
      const xs = [];
      for (const c of g.arena.chibis) {
        if (c.heat !== g.heatIndex || c.state !== 'flying') continue;
        const v = c.body.getLinearVelocity();
        if (Math.hypot(v.x, v.y) > 0.8) xs.push(c.body.getPosition().x * PPM);
      }
      if (xs.length) {
        xs.sort((a, b) => a - b);
        target = clamp(xs[Math.floor(xs.length * 0.8)] - VIEW_W * 0.55);
      }
      speed = 2.4;
    }
    // two chained low-pass filters: the camera eases in and out instead of snapping to a new target
    const k = Math.min(1, dt * speed);
    this.camTarget += (target - this.camTarget) * k;
    this.camX += (this.camTarget - this.camX) * k;
  }

  // The recorded frame of the final at the replay's current time.
  replayFrame() {
    const g = this.game;
    const rec = g.arena && g.arena.recording;
    if (!rec || !rec.length || !g.replay) return null;
    const t = g.replayTime;
    let lo = 0;
    let hi = rec.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (rec[mid].t <= t) lo = mid;
      else hi = mid - 1;
    }
    return rec[lo];
  }

  replayWinner() {
    const f = this.replayFrame();
    return f && f.chibis.find((c) => c[0] === this.game.replay.winner.id);
  }

  // Her idle (on by default, ?idle=0 or !y2w idle off), one beat every 1.05 s: she settles down (squash),
  // pushes up past her height with a tiny lift (stretch), and relaxes, each part with smoothstep easing.
  // Width moves against height so she keeps her volume. Draws her standing on (x, y), bottom center.
  drawWaifuAt(ctx, x, y, scale) {
    let sy = 1;
    if (this.game.cfg.idle !== false) {
      const u = (this.game.time % 1.05) / 1.05;
      const ease = (k) => k * k * (3 - 2 * k);
      if (u < 0.35) sy = 1 - 0.08 * ease(u / 0.35);
      else if (u < 0.62) sy = 0.92 + 0.13 * ease((u - 0.35) / 0.27);
      else sy = 1.05 - 0.05 * ease((u - 0.62) / 0.38);
    }
    const sx = 1 + (1 - sy) * 0.6;
    const lift = sy > 1 ? Math.round((sy - 1) * 40 * scale) : 0;
    const w = Math.round(this.waifu.width * scale * sx);
    const h = Math.round(this.waifu.height * scale * sy);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.waifu, Math.round(x - w / 2), Math.round(y - h - lift), w, h);
  }

  jelly(r, squashed) {
    let pair = this.jellies.get(r);
    if (!pair) {
      pair = [toCanvas(jellyFrame(r)), toCanvas(jellyFrame(r, 0.22))];
      this.jellies.set(r, pair);
    }
    return pair[squashed ? 1 : 0];
  }

  chibiFor(player) {
    let s = this.chibis.get(player.id);
    if (!s) {
      const sp = chibiSprite(player.name, { sub: player.sub, bot: player.bot });
      const canvas = toCanvas(sp.img);
      s = { canvas, ko: dimmed(canvas), ox: sp.ox, oy: sp.oy };
      this.chibis.set(player.id, s);
    }
    return s;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const from = this.sizeFrom || this.canvas;
    const w = Math.round(from.clientWidth * dpr);
    const h = Math.round(from.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    let s = Math.min(w / VIEW_W, h / VIEW_H);
    if (s >= 1 && Math.floor(s) / s > 0.85) s = Math.floor(s);
    this.s = s;
    this.ox = Math.round((w - VIEW_W * s) / 2);
    this.oy = Math.round((h - VIEW_H * s) / 2);
  }

  draw() {
    this.resize();
    if (this.vfx) this.vfx.update();
    this.labels = [];
    this.drawWorld();
    this.uctx.clearRect(0, 0, this.ui.width, this.ui.height);
    this.uctx.imageSmoothingEnabled = false;
    if (this.fontsReady) this.drawHud();
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const [sx, sy] = this.vfx ? this.vfx.offset() : [0, 0];
    ctx.drawImage(this.world, this.ox + sx * this.s, this.oy + sy * this.s, VIEW_W * this.s, VIEW_H * this.s);
    ctx.drawImage(this.mid, this.ox + sx * this.s, this.oy + sy * this.s, VIEW_W * this.s, VIEW_H * this.s);
    ctx.drawImage(this.ui, this.ox, this.oy, VIEW_W * this.s, VIEW_H * this.s);
    this.drawLabels(ctx);
    if (this.post) this.drawEmissive(sx, sy);
    if (!this.post && this.vfx && this.vfx.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.vfx.flash})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // The glow layer placed over the frame at quarter size (the post-process blurs it there).
  drawEmissive(sx, sy) {
    const w = Math.max(1, Math.round(this.canvas.width / 4));
    const h = Math.max(1, Math.round(this.canvas.height / 4));
    if (this.emit.width !== w || this.emit.height !== h) Object.assign(this.emit, { width: w, height: h });
    const E = this.emit.getContext('2d');
    E.fillStyle = '#000';
    E.fillRect(0, 0, w, h);
    E.imageSmoothingEnabled = true;
    E.drawImage(this.glow, (this.ox + sx * this.s) / 4, (this.oy + sy * this.s) / 4, (VIEW_W * this.s) / 4, (VIEW_H * this.s) / 4);
  }

  // A name to draw at full resolution, in ui coordinates (960×540). size = ui pixels.
  label(text, x, y, { color = '#ffffff', size = 9, align = 'center' } = {}) {
    this.labels.push({ text, x, y, color, size, align });
  }

  // Width of a label in ui pixels (to place two labels side by side).
  labelWidth(text, size) {
    const k = this.s / UI;
    const px = Math.max(10, Math.round(size * k));
    this.ctx.font = `700 ${px}px "${LABEL_FONT.family}", sans-serif`;
    return this.ctx.measureText(text).width / k;
  }

  drawLabels(ctx) {
    if (!this.fontsReady) return;
    const k = this.s / UI;
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = PAL.ink;
    for (const l of this.labels) {
      const px = Math.max(10, Math.round(l.size * k));
      ctx.font = `700 ${px}px "${LABEL_FONT.family}", sans-serif`;
      ctx.textAlign = l.align;
      ctx.lineWidth = Math.max(3, Math.round(px * 0.2));
      const X = Math.round(this.ox + l.x * k);
      const Y = Math.round(this.oy + l.y * k);
      ctx.shadowColor = 'rgba(24,20,37,0.7)';
      ctx.shadowOffsetY = Math.max(2, Math.round(px / 10));
      ctx.strokeText(l.text, X, Y);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, X, Y);
    }
    ctx.restore();
  }

  // ---------------- world ----------------

  drawWorld() {
    const g = this.game;
    const W = this.wctx;
    W.imageSmoothingEnabled = false;
    const map = g.arena ? g.arena.map : ROUND_MAPS[0];
    this.updateCamera(map);
    const cx = Math.round(this.camX);
    const L = this.levelLayers(map);
    W.drawImage(L.sky, 0, 0);
    W.drawImage(L.far, -Math.round(cx * PARALLAX.far), 0);
    W.drawImage(L.near, -Math.round(cx * PARALLAX.near), 0);
    W.drawImage(L.fg, -cx, 0);
    W.save();
    W.translate(-cx, 0);
    const G = this.gctx;
    G.setTransform(1, 0, 0, 1, 0, 0);
    G.clearRect(0, 0, VIEW_W, VIEW_H);
    G.imageSmoothingEnabled = false;
    G.setTransform(1, 0, 0, 1, -cx, 0);
    const frame = g.phase === 'replay' ? this.replayFrame() : null;
    if (g.arena) {
      for (const e of g.arena.elements) {
        let el = e;
        if (frame && e.body) {
          const r = frame.els.find((x) => x[0] === e.id);
          if (r) el = { ...e, body: { getAngle: () => r[3], getPosition: () => ({ x: r[1], y: r[2] }) } };
        }
        drawElement(W, el, frame ? frame.t : g.arena.time, THEMES[map.theme].skin);
        if (el.kind === 'warp') drawElement(G, el, frame ? frame.t : g.arena.time, THEMES[map.theme].skin);
      }
    }

    W.save();
    W.translate(cx, 0); // ambient particles live in screen space, with their own parallax
    drawAmbient(W, THEMES[map.theme].ambient, g.time, cx);
    W.restore();
    const flying = g.arena ? g.arena.chibis.filter((c) => c.state === 'flying') : [];
    for (const b of map.bumpers || []) {
      const key = `${b.x},${b.y}`;
      const near = flying.some((c) => {
        const p = c.body.getPosition();
        return Math.hypot(p.x * PPM - b.x, p.y * PPM - b.y) < b.r + 9;
      });
      if (near && g.time - (this.squash.get(key) ?? -9) > 0.2 && this.onBump) this.onBump();
      if (near) this.squash.set(key, g.time);
      const squashed = g.time - (this.squash.get(key) ?? -9) < 0.12;
      const f = this.jelly(b.r, squashed);
      W.drawImage(f, Math.round(b.x - f.width / 2), Math.round(b.y - f.height / 2));
    }

    if (g.arena) {
      const b = g.arena.basket;
      const key = `${b.w}x${b.h}`;
      if (!this.baskets) this.baskets = new Map();
      if (!this.baskets.has(key)) this.baskets.set(key, toCanvas(basketImage(b)));
      W.drawImage(this.baskets.get(key), b.x, b.y - 12);
    }

    const since = g.time - this.lastLaunch;
    const n = this.catFrames.length - 1;
    const fi = since < 0.05 ? n : since < 0.17 ? Math.max(0, Math.round(n * (1 - (since - 0.05) / 0.12))) : 0;
    const c = map.catapult;
    W.drawImage(this.catFrames[fi], c.x - CATAPULT_ANCHOR.x, c.y - CATAPULT_ANCHOR.y);

    const M = this.mctx;
    M.clearRect(0, 0, this.mid.width, this.mid.height);
    if (map.waifu) this.drawWaifuAt(M, (map.waifu.x + 16 - cx) * MID, (map.waifu.y + 32) * MID, 1);

    if (!g.arena) {
      W.restore();
      return;
    }
    if (frame) {
      this.drawReplay(W, frame);
      if (this.vfx) this.vfx.draw(W, G);
      W.restore();
      return;
    }
    W.fillStyle = 'rgba(255,255,255,0.35)';
    for (const ch of g.arena.chibis) {
      if (ch.state === 'flying' && ch.heat === g.heatIndex) for (const p of ch.trail) W.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    for (const ch of g.arena.chibis) {
      const player = g.players.get(ch.playerId);
      if (!player) continue;
      const s = this.chibiFor(player);
      const pos = ch.body.getPosition();
      W.save();
      W.translate(Math.round(pos.x * PPM), Math.round(pos.y * PPM));
      W.rotate(ch.body.getAngle());
      W.drawImage(ch.state === 'frozen' ? s.ko : s.canvas, -s.ox, -s.oy);
      W.restore();
    }
    if (this.vfx) this.vfx.draw(W, G);
    W.restore();
  }

  // The final, slowed down: the winner's path so far in gold, every chibi where the recording has it.
  drawReplay(W, frame) {
    const g = this.game;
    const rec = g.arena.recording;
    const win = g.replay.winner.id;
    W.fillStyle = PAL.yellow;
    for (let i = 0; i < rec.length && rec[i].t <= frame.t; i += 2) {
      if (rec[i].t < g.replay.from) continue;
      const c = rec[i].chibis.find((x) => x[0] === win);
      if (c) W.fillRect(Math.round(c[1]), Math.round(c[2]), 1, 1);
    }
    for (const [id, x, y, a] of frame.chibis) {
      const player = g.players.get(id);
      if (!player) continue;
      const s = this.chibiFor(player);
      W.save();
      W.translate(Math.round(x), Math.round(y));
      W.rotate(a);
      W.drawImage(s.canvas, -s.ox, -s.oy);
      W.restore();
    }
  }

  // ---------------- HUD ----------------

  panel(x, y, w, h) {
    const U = this.uctx;
    U.fillStyle = PAL.ink;
    U.fillRect(x, y, w, h);
    U.fillStyle = PAL.steel;
    U.fillRect(x + 2, y + 2, w - 4, 2);
    U.fillStyle = PAL.night;
    U.fillRect(x + 2, y + 4, w - 4, h - 6);
  }

  text(str, x, y, opts) {
    return drawText(this.uctx, str, x, y, opts);
  }

  icon(player, x, y, scale = 2) {
    const s = this.chibiFor(player);
    this.uctx.drawImage(s.canvas, Math.round(x), Math.round(y), s.canvas.width * scale, s.canvas.height * scale);
  }

  wind(cx, y) {
    const g = this.game;
    const w = g.arena ? g.arena.wind : 0;
    const U = this.uctx;
    const label = `${this.t.wind} ${Math.abs(w).toFixed(1)}`;
    const lw = this.text(label, cx, y, { font: 'body', scale: 3, align: 'center', color: w ? 'yellow' : 'silver' });
    if (!w) return;
    const len = 10 + Math.round(Math.abs(w) * 14);
    const dir = Math.sign(w);
    const ax = dir > 0 ? cx + lw / 2 + 10 : cx - lw / 2 - 10 - len;
    const ay = y + 11;
    U.fillStyle = PAL.ink;
    U.fillRect(ax - 1, ay - 2, len + 2, 6);
    U.fillStyle = PAL.yellow;
    U.fillRect(ax, ay - 1, len, 4);
    const tip = dir > 0 ? ax + len : ax;
    for (let i = 0; i < 6; i++) {
      U.fillStyle = PAL.ink;
      U.fillRect(tip - dir * i - (dir < 0 ? 1 : 0), ay + 1 - (6 - i) - 1, 2, 2 * (6 - i) + 2);
      U.fillStyle = PAL.yellow;
      U.fillRect(tip - dir * i - (dir < 0 ? 1 : 0), ay + 1 - (5 - i), 1, 2 * (5 - i) + 1);
    }
  }

  drawHud() {
    const g = this.game;
    const t = this.t;
    const secs = Math.ceil(g.timeLeft);
    const inRound = g.round > 0 && ['roundIntro', 'aim', 'heatIntro', 'launch', 'settle', 'heatResult', 'roundResult'].includes(g.phase);
    const mapName = g.map ? g.map.name[this.lang()].toUpperCase() : '';

    if (inRound) {
      this.text(`${g.isFinal ? t.final : t.round(g.round)}: ${mapName}`, 16, 12, { font: 'body', scale: 2 });
      if (g.heats.length > 1) this.text(t.heat(g.heatIndex + 1, g.heats.length), 16, 34, { font: 'body', scale: 2, color: 'silver' });
      this.text(t.alive(g.alive().length), 944, 12, { font: 'body', scale: 2, align: 'right' });
    }
    if (inRound || g.phase === 'join') this.wind(480, 12);
    if ((inRound && !g.isFinal) || g.phase === 'join') this.portrait(g.phase === 'join' ? 60 : 44);
    if (inRound) this.drawNames();
    if (inRound || g.phase === 'join') this.minimap();

    switch (g.phase) {
      case 'idle':
        this.text(t.title, 480, 96, { font: 'title', scale: 6, align: 'center', color: 'yellow' });
        this.text(t.subtitle, 480, 168, { font: 'title', scale: 3, align: 'center' });
        this.panel(250, 222, 460, 44);
        this.text(t.idleHint, 480, 234, { font: 'body', scale: 2, align: 'center', color: 'silver' });
        this.label(`v${VERSION}`, 480, 276, { color: PAL.silver, size: 9 });
        break;
      case 'join': {
        this.panel(190, 52, 580, 180);
        this.text(t.joinTitle, 480, 66, { font: 'title', scale: 3, align: 'center', color: 'yellow' });
        this.text(String(secs), 480, 100, { font: 'title', scale: 6, align: 'center' });
        t.joinHint.forEach((line, i) => this.text(line, 480, 170 + i * 24, { font: 'body', scale: 2, align: 'center' }));
        this.text(t.suitors(g.players.size), 16, 44, { font: 'title', scale: 2, color: 'yellow' });
        this.joiners.forEach((p, i) => {
          const y = 76 + i * 30;
          this.icon(p, 16, y - 4, 2);
          this.label(p.name, 54, y, { size: 12, align: 'left' });
        });
        break;
      }
      case 'roundIntro':
        this.text(g.isFinal ? t.final : t.round(g.round), 480, 150, { font: 'title', scale: 6, align: 'center', color: 'yellow' });
        this.text(mapName, 480, 216, { font: 'title', scale: 3, align: 'center' });
        break;
      case 'aim':
        this.panel(220, 80, 520, 118);
        this.text(t.aimTitle, 480, 94, { font: 'title', scale: 2, align: 'center', color: 'yellow' });
        this.text(String(secs), 480, 118, { font: 'title', scale: 5, align: 'center' });
        this.text(t.aimHint, 480, 168, { font: 'body', scale: 2, align: 'center', color: 'silver' });
        break;
      case 'heatIntro':
        if (g.heats.length > 1) this.text(t.heat(g.heatIndex + 1, g.heats.length), 480, 200, { font: 'title', scale: 5, align: 'center', color: 'yellow' });
        break;
      case 'heatResult':
        if (this.lastHeat.length) {
          this.text(t.madeIt(this.lastHeat.length), 480, 110, { font: 'title', scale: 4, align: 'center', color: 'yellow' });
          this.roster(this.lastHeat, 160);
        } else {
          this.text(t.nobodyHeat, 480, 130, { font: 'title', scale: 3, align: 'center', color: 'silver' });
        }
        break;
      case 'roundResult':
        this.panel(120, 90, 720, 250);
        this.text(t.qualified, 480, 106, { font: 'title', scale: 2, align: 'center', color: 'yellow' });
        this.roster(g.roundQualified.map((id) => g.players.get(id)), 140);
        break;
      case 'end':
        this.drawEnd();
        break;
      case 'choose': {
        // the numbered finalists in the panel too: in a full basket the names over the chibis can overlap
        const fins = g.choice.finalists;
        const rows = Math.ceil(fins.length / 4);
        this.panel(170, 52, 620, 96 + rows * 26);
        this.text(t.chooseTitle, 480, 64, { font: 'title', scale: 3, align: 'center', color: 'yellow' });
        this.text(String(secs), 480, 94, { font: 'title', scale: 4, align: 'center' });
        fins.forEach((p, i) => {
          const row = Math.floor(i / 4);
          const inRow = Math.min(4, fins.length - row * 4);
          const x = 480 + ((i % 4) - (inRow - 1) / 2) * 150;
          this.label(`${i + 1}  ${p.name}`, x, 140 + row * 26, { color: '#ffffff', size: 12 });
        });
        this.text(t.chooseHint(g.choice.finalists.length), 480, 500, { font: 'body', scale: 2, align: 'center', color: 'silver' });
        g.choice.finalists.forEach((p, i) => {
          const ch = g.arena && g.arena.chibis.find((c) => c.playerId === p.id);
          if (!ch) return;
          const pos = ch.body.getPosition();
          this.label(`${i + 1}  ${p.name}`, (pos.x * PPM - this.camX) * UI, (pos.y * PPM - 13) * UI - 16 - (i % 2) * 22, { color: PAL.yellow, size: 13 });
        });
        break;
      }
      case 'replay': {
        const U = this.uctx;
        U.fillStyle = PAL.ink;
        U.fillRect(0, 0, 960, 40);
        U.fillRect(0, 500, 960, 40);
        const blink = Math.floor(g.time * 2) % 2 === 0;
        if (blink) {
          U.fillStyle = PAL.red;
          U.fillRect(24, 14, 12, 12);
        }
        this.text(t.replay, 46, 12, { font: 'title', scale: 2, color: 'white' });
        this.text('x0.4', 936, 12, { font: 'title', scale: 2, color: 'yellow', align: 'right' });
        const w = this.replayWinner();
        if (w) this.label(g.replay.winner.name, (w[1] - this.camX) * UI, (w[2] - 13) * UI - 16, { color: PAL.yellow, size: 12 });
        break;
      }
    }

    const chat = this.chatStatus === 'demo' ? t.chatDemo : this.chatStatus === 'off' ? t.chatOff : `#${this.channel}: ${this.chatStatus}`;
    const status = g.cfg.sound === false ? `${chat}  ·  ${t.soundOff}` : chat;
    this.label(status, 12, 518, { color: PAL.silver, size: 9, align: 'left' });
    this.credit();
  }

  credit() {
    const size = 12;
    const [game, by] = this.t.credit;
    const wBy = this.labelWidth(by, size);
    const wGame = this.labelWidth(`${game} `, size);
    const right = 948;
    const U = this.uctx;
    U.fillStyle = 'rgba(24,20,37,0.82)';
    U.fillRect(Math.round(right - wBy - wGame - 10), 510, Math.round(wBy + wGame + 18), 26);
    this.label(by, right, 512, { color: PAL.yellow, size, align: 'right' });
    this.label(game, right - wBy - 4, 512, { color: '#ffffff', size, align: 'right' });
  }

  roster(players, y) {
    const shown = players.slice(0, 15);
    const perRow = 5;
    shown.forEach((p, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, shown.length - row * perRow);
      const col = i % perRow;
      const x = 480 + (col - (inRow - 1) / 2) * 150;
      this.icon(p, x - 16, y + row * 62, 2);
      this.label(p.name, x, y + row * 62 + 36, { size: 13 });
    });
    if (players.length > shown.length) this.text(`+${players.length - shown.length}`, 480, y + 3 * 62, { font: 'title', scale: 2, align: 'center', color: 'silver' });
  }

  drawEnd() {
    const g = this.game;
    const t = this.t;
    const r = g.result;
    const U = this.uctx;
    U.fillStyle = 'rgba(24,20,37,0.6)';
    U.fillRect(0, 0, 960, 540);
    if (r && r.winner) {
      // the cut-in: her, big, and the one who reached her
      this.drawWaifuAt(U, 330, 330, 5);
      const s = this.chibiFor(r.winner);
      U.drawImage(s.canvas, 560, 210, s.canvas.width * 7, s.canvas.height * 7);
      this.heart(490, 240);
      if (r.finalists.length > 1) this.text(t.sheChose(r.finalists.length), 480, 50, { font: 'title', scale: 2, align: 'center', color: 'silver' });
      this.label(r.winner.name, 480, 392, { color: PAL.yellow, size: 40 });
      this.text(t.winnerLine, 480, 456, { font: 'title', scale: 2, align: 'center' });
    } else {
      this.drawWaifuAt(U, 480, 310, 5);
      this.text(t.single, 480, 360, { font: 'title', scale: 4, align: 'center', color: 'yellow' });
      this.text(g.isFinal ? t.singleHint : t.wiped(g.round), 480, 410, { font: 'title', scale: 2, align: 'center', color: 'silver' });
    }
  }

  // On a course longer than the screen: a strip with the whole course, the basket, the chibis and the
  // camera's window, so nobody loses the swarm.
  minimap() {
    const g = this.game;
    const map = g.map;
    if (!map || map.width <= VIEW_W) return;
    const U = this.uctx;
    const w = 360;
    const h = 14;
    const x0 = 300;
    const y0 = 498;
    const k = w / map.width;
    U.fillStyle = 'rgba(24,20,37,0.75)';
    U.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
    U.fillStyle = PAL.yellow;
    U.fillRect(Math.round(x0 + map.basket.x * k), y0 + 2, Math.max(3, Math.round(map.basket.w * k)), h - 4);
    U.fillStyle = PAL.tan;
    U.fillRect(Math.round(x0 + map.catapult.x * k) - 1, y0 + 3, 3, h - 6);
    if (g.arena) {
      for (const c of g.arena.chibis) {
        if (c.state !== 'flying' && c.state !== 'in') continue;
        const p = c.body.getPosition();
        U.fillStyle = c.heat === g.heatIndex ? PAL.white : PAL.slate;
        U.fillRect(Math.round(x0 + p.x * PPM * k) - 1, Math.round(y0 + Math.min(h - 3, Math.max(1, (p.y * PPM * h) / VIEW_H))), 2, 2);
      }
    }
    const cx = Math.round(x0 + this.camX * k);
    const cw = Math.round(VIEW_W * k);
    U.fillStyle = PAL.white;
    U.fillRect(cx, y0 - 3, cw, 1);
    U.fillRect(cx, y0 + h + 2, cw, 1);
    U.fillRect(cx, y0 - 3, 1, h + 6);
    U.fillRect(cx + cw - 1, y0 - 3, 1, h + 6);
  }

  // While she is not on the map: a small framed portrait in the corner, so everyone knows who is waiting.
  portrait(y) {
    const U = this.uctx;
    const k = 2;
    const size = this.waifu.width * k;
    const x = 944 - size - 8;
    U.fillStyle = PAL.ink;
    U.fillRect(x - 6, y - 6, size + 12, size + 12);
    U.fillStyle = PAL.rose;
    U.fillRect(x - 4, y - 4, size + 8, size + 8);
    U.fillStyle = PAL.night;
    U.fillRect(x, y, size, size);
    this.drawWaifuAt(U, x + size / 2, y + size, k);
    this.label(this.waifuName, x + size / 2, y + size + 6, { color: PAL.rose, size: 11 });
    this.label(this.t.waiting, x + size / 2, y + size + 24, { size: 8 });
  }

  heart(x, y) {
    const rows = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];
    const beat = 1 + 0.15 * Math.sin(this.game.time * 8);
    const k = Math.round(8 * beat);
    this.uctx.fillStyle = PAL.hot;
    rows.forEach((row, j) => [...row].forEach((ch, i) => ch === 'R' && this.uctx.fillRect(x + i * k - (k * 7) / 2, y + j * k, k, k)));
  }

  lang() {
    return this.game.cfg.lang;
  }

  // A name on a small dark tag: readable over sky, grass or another chibi, at the smallest size.
  tag(name, cx, y, color = 'white', scale = 1) {
    const s = textSprite(name, { font: 'name', color, shadow: null, scale });
    const x = Math.round(cx - s.width / 2);
    const U = this.uctx;
    U.fillStyle = 'rgba(24,20,37,0.62)';
    U.fillRect(x - 2 * scale, Math.round(y) + scale, s.width + 3 * scale, s.height - scale);
    U.drawImage(s, x, Math.round(y));
  }

  drawNames() {
    const g = this.game;
    if (!g.arena) return;
    for (const ch of g.arena.chibis) {
      if (ch.heat !== g.heatIndex || (ch.state !== 'flying' && ch.state !== 'in')) continue;
      const p = g.players.get(ch.playerId);
      const pos = ch.body.getPosition();
      this.label(p.name, (pos.x * PPM - this.camX) * UI, (pos.y * PPM - 13) * UI - 16, { color: ch.state === 'in' ? PAL.yellow : '#ffffff', size: 11 });
    }
  }
}
