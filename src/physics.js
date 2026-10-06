// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The arena: one map built in Box2D (planck.js). Box2D over matter.js for two reasons that show on
// screen: continuous collision (a fast chibi does not tunnel through a thin wall) and stable stacks
// (a full basket does not jitter its chibis out).
import { World, Vec2, Box, Circle, Polygon } from '../vendor/planck.mjs';
import { buildElements, updateElements, touchElements, inClearZone, isCarried } from './elements.js';

export const VIEW_W = 480;
export const VIEW_H = 270;
export const PPM = 16;            // canvas pixels per meter
export const GRAVITY = 18;        // snappier than Earth's 9.8: arcs read better at stream speed
export const V_MIN = 6;           // m/s at power 0
export const V_MAX = 27;          // m/s at power 100
export const CHIBI_W = 12;        // px
export const CHIBI_H = 14;        // px
// Chibis of a heat leave the same point 0.15 s apart: without this grace the faster one rear-ends the
// slower one at the catapult and both drop dead there (towers: 12 % solo → 2 % in heats). After it they
// collide normally: the mid-air crashes are the fun part.
const LAUNCH_GRACE = 0.5;         // s
const FRESH = -1;                 // collision group: same negative group never collides
const DEG = Math.PI / 180;
const H_M = VIEW_H / PPM;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const px = (v) => v / PPM;

export function aimToVelocity(angle, power) {
  const v = V_MIN + (V_MAX - V_MIN) * (power / 100);
  return { x: v * Math.cos(angle * DEG), y: -v * Math.sin(angle * DEG) };
}

// A random shot is not garbage: it picks a point in the map's target zone (around the basket) and
// solves the exact arc to it for the given angle, ignoring wind and obstacles. Wind, obstacles and the
// crowd do the rest; the zone's width is the knob for how often a random shot gets in.
export function randomPower(rng, map, angle) {
  const g = GRAVITY * (map.gravity ?? 1);
  const z = map.randomTarget;
  const dx = (rng.range(z.x[0], z.x[1]) - map.catapult.x) / PPM;
  const up = (map.catapult.y - z.y) / PPM;
  const th = angle * DEG;
  const denom = 2 * Math.cos(th) ** 2 * (dx * Math.tan(th) - up);
  const v = denom > 0 ? Math.sqrt((g * dx * dx) / denom) : V_MAX;
  return clamp(Math.round(((v - V_MIN) / (V_MAX - V_MIN)) * 100), 0, 100);
}

export function resolveAim(rng, map, aim) {
  const angle = aim && aim.angle != null ? aim.angle : Math.round(rng.range(30, 65));
  const power = aim && aim.power != null ? aim.power : randomPower(rng, map, angle);
  return { angle, power, random: !aim };
}

// The front wall (facing the catapult) is lower (a scoop, not a box): an arc that comes in a bit low
// still hits the back wall and drops in instead of bouncing off the outside of the front one.
export function basketWalls(b) {
  const lip = b.lip ?? Math.round(b.h * 0.45);
  return [
    [b.x, b.y + b.h - lip, b.t, lip],
    [b.x + b.w - b.t, b.y, b.t, b.h],
    [b.x, b.y + b.h - b.t, b.w, b.t],
  ];
}

// Each round past the first the basket loses 12 % of its width (at most 30 %), centered where it was.
export function scaledBasket(b, round = 1) {
  const k = Math.max(0.7, 1 - 0.12 * (round - 1));
  const w = Math.max(2 * b.t + 28, Math.round((b.w * k) / 2) * 2);
  return { ...b, w, x: b.x + Math.round((b.w - w) / 2) };
}

// Jelly bumpers kick: touching one sends you away from its center at least this fast (m/s).
const BUMPER_KICK = 13;

export class Arena {
  constructor(map, rng, { round = 1 } = {}) {
    this.map = map;
    this.rng = rng;
    this.gravity = GRAVITY * (map.gravity ?? 1);   // a course may change gravity (the moon)
    this.world = new World({ gravity: new Vec2(0, this.gravity) });
    this.wind = 0;                // m/s², + pushes right
    this.chibis = [];
    this.steps = 0;
    this.time = 0;
    this.fx = [];                  // what happened this step, for the effects and the sounds
    this.widthM = (map.width || VIEW_W) / PPM;   // courses can be several screens long
    this.basket = scaledBasket(map.basket, round);
    const b = this.basket;
    this.basketInner = { x: b.x + b.t, y: b.y, w: b.w - 2 * b.t, h: b.h - b.t };
    this.build();
  }

  build() {
    for (const s of this.map.solids) {
      const restitution = s.bounce ?? 0.15;
      if (s.kind === 'box') {
        const body = this.world.createBody({
          type: 'static',
          position: new Vec2(px(s.x + s.w / 2), px(s.y + s.h / 2)),
          angle: (s.angle || 0) * DEG,
        });
        body.createFixture(new Box(px(s.w / 2), px(s.h / 2)), { friction: s.friction ?? 0.6, restitution });
      } else if (s.kind === 'circle') {
        const body = this.world.createBody({ type: 'static', position: new Vec2(px(s.x), px(s.y)) });
        body.createFixture(new Circle(px(s.r)), { friction: s.friction ?? 0.3, restitution });
      } else if (s.kind === 'poly') {
        const body = this.world.createBody({ type: 'static' });
        body.createFixture(new Polygon(s.points.map(([x, y]) => new Vec2(px(x), px(y)))), { friction: s.friction ?? 0.5, restitution });
      }
    }
    for (const [x, y, w, h] of basketWalls(this.basket)) {
      const body = this.world.createBody({ type: 'static', position: new Vec2(px(x + w / 2), px(y + h / 2)) });
      body.createFixture(new Box(px(w / 2), px(h / 2)), { friction: 0.9, restitution: 0.05 });
    }
    this.elements = buildElements(this.world, this.map.elements);
  }

  spawn(playerId, heat, angle, power) {
    const c = this.map.catapult;
    const body = this.world.createBody({
      type: 'dynamic',
      position: new Vec2(px(c.x), px(c.y)),
      bullet: true,
      linearDamping: 0.05,
      angularDamping: 0.3,
    });
    const fixture = body.createFixture(new Box(px(CHIBI_W / 2), px(CHIBI_H / 2)), {
      density: 1,
      friction: 0.6,
      restitution: 0.3,
      filterGroupIndex: FRESH,
    });
    const v = aimToVelocity(angle, power);
    body.setLinearVelocity(new Vec2(v.x, v.y));
    body.setAngularVelocity(this.rng.range(-6, 6));
    const chibi = { body, fixture, playerId, heat, state: 'flying', trail: [], still: 0, age: 0 };
    this.chibis.push(chibi);
    return chibi;
  }

  // One fixed step. Returns the chibis that left the screen during it.
  step(dt) {
    this.steps++;
    this.time += dt;
    updateElements(this.elements, this.time);
    for (const c of this.chibis) {
      if (c.state !== 'flying' || !this.wind) continue;
      const v = c.body.getLinearVelocity();
      if (Math.hypot(v.x, v.y) > 1.5) c.body.applyForceToCenter(new Vec2(c.body.getMass() * this.wind, 0), false);
    }
    this.world.step(dt, 8, 3);
    for (const c of this.chibis) if (c.state === 'flying') touchElements(this.elements, c, this.time, dt, this.gravity, this.rng, (e) => this.fx.push(e));
    this.kickBumpers();
    if (this.recording) this.record();
    const gone = [];
    for (const c of this.chibis) {
      if (c.state !== 'flying') continue;
      c.age += dt;
      if (c.age >= LAUNCH_GRACE && c.fixture.getFilterGroupIndex() === FRESH) c.fixture.setFilterGroupIndex(0);
      const p = c.body.getPosition();
      if (p.y > H_M + 1.5 || p.x > this.widthM + 1.5 || p.x < -1.5) {
        this.world.destroyBody(c.body);
        c.state = 'gone';
        gone.push(c);
        continue;
      }
      if (this.steps % 3 === 0) {
        c.trail.push({ x: p.x * PPM, y: p.y * PPM });
        if (c.trail.length > 24) c.trail.shift();
      }
      const v = c.body.getLinearVelocity();
      const slow = !c.body.isAwake() || (Math.hypot(v.x, v.y) < 0.25 && Math.abs(c.body.getAngularVelocity()) < 0.6);
      c.still = slow ? c.still + dt : 0;
      c.carried = isCarried(this.elements, p.x * PPM, p.y * PPM) ? (c.carried ?? 0) + dt : 0;
      // a hard stop is an impact (landing, a wall, another chibi): dust and a thud
      const speed = Math.hypot(v.x, v.y);
      if (c.age > 0.25 && (c.lastSpeed ?? 0) - speed > 5 && (c.impactCool ?? 0) < this.time) {
        this.fx.push({ kind: 'impact', x: p.x * PPM, y: p.y * PPM + 7, power: c.lastSpeed - speed });
        c.impactCool = this.time + 0.15;
      }
      c.lastSpeed = speed;
      if (!c.basketFx && this.insideBasket(c)) {
        c.basketFx = true;
        this.fx.push({ kind: 'basket', x: p.x * PPM, y: p.y * PPM, player: c.playerId });
      }
    }
    if (gone.length) this.chibis = this.chibis.filter((c) => c.state !== 'gone');
    return gone;
  }

  kickBumpers() {
    const bumpers = this.map.bumpers;
    if (!bumpers) return;
    for (const c of this.chibis) {
      if (c.state !== 'flying') continue;
      const p = c.body.getPosition();
      for (const [i, b] of bumpers.entries()) {
        const dx = p.x * PPM - b.x;
        const dy = p.y * PPM - b.y;
        const d = Math.hypot(dx, dy);
        if (d > b.r + 9 || d < 0.01) continue;
        c.cool = c.cool || {};
        if ((c.cool[`b${i}`] ?? -9) > this.time) continue;
        c.cool[`b${i}`] = this.time + 0.2;
        const v = c.body.getLinearVelocity();
        const speed = Math.max(b.kick ?? BUMPER_KICK, Math.hypot(v.x, v.y) * 1.05);
        c.body.setLinearVelocity(new Vec2((dx / d) * speed, (dy / d) * speed));
        this.fx.push({ kind: 'bump', x: b.x + (dx / d) * b.r, y: b.y + (dy / d) * b.r, nx: dx / d, ny: dy / d, cx: b.x, cy: b.y, r: b.r });
      }
    }
  }

  // One frame of the final for the slow-motion replay: every chibi still around, and the moving pieces.
  record() {
    const chibis = [];
    for (const c of this.chibis) {
      if (c.state !== 'flying' && c.state !== 'in') continue;
      const p = c.body.getPosition();
      chibis.push([c.playerId, p.x * PPM, p.y * PPM, c.body.getAngle()]);
    }
    const els = this.elements.filter((e) => e.body).map((e) => {
      const p = e.body.getPosition();
      return [e.id, p.x, p.y, e.body.getAngle()];
    });
    this.recording.push({ t: this.time, chibis, els });
  }

  heatChibis(heat) {
    return this.chibis.filter((c) => c.heat === heat);
  }

  // Settled = every chibi of the heat still on screen has been still for `hold` seconds.
  heatSettled(heat, hold = 0.6) {
    // Riding a mover or a spinner for 1.5 s straight counts as stopped. Just flying past one does not,
    // or a heat could end with chibis still in the air.
    return this.heatChibis(heat).every((c) => c.state !== 'flying' || c.still >= hold || (c.carried ?? 0) >= 1.5);
  }

  // Something of this heat that could still change the result: anything moving fast, or anything
  // moving at all right around the basket mouth.
  heatLively(heat) {
    const r = this.basketInner;
    return this.heatChibis(heat).some((c) => {
      if (c.state !== 'flying') return false;
      const v = c.body.getLinearVelocity();
      const s = Math.hypot(v.x, v.y);
      if (s > 1.5) return true;
      const p = c.body.getPosition();
      const x = p.x * PPM;
      const y = p.y * PPM;
      return s > 0.3 && x > r.x - 48 && x < r.x + r.w + 48 && y > r.y - 48 && y < r.y + r.h + 16;
    });
  }

  insideBasket(c) {
    const p = c.body.getPosition();
    return this.insideBasketAt(p.x * PPM, p.y * PPM);
  }

  insideBasketAt(x, y) {
    const r = this.basketInner;
    return x > r.x && x < r.x + r.w && y > r.y + 2 && y < r.y + r.h;
  }

  // The heat's survivors leave the arena (to the bench); the rest freeze where they fell and become
  // terrain for the next heat, except near the catapult (would block launches), around the basket mouth
  // (would plug it) and on the interactive pieces (a body lying on a spring or in a pipe mouth jams it).
  closeHeat(heat, maxFrozen = 80) {
    const b = this.basket;
    const c0 = this.map.catapult;
    for (const c of this.heatChibis(heat)) {
      if (c.state === 'in') {
        this.world.destroyBody(c.body);
        c.state = 'benched';
        continue;
      }
      if (c.state !== 'flying') continue;
      const p = c.body.getPosition();
      const x = p.x * PPM;
      const y = p.y * PPM;
      const nearBasket = x > b.x - 14 && x < b.x + b.w + 14 && y > b.y - 24 && y < b.y + b.h + 6;
      const nearCatapult = Math.hypot(x - c0.x, y - c0.y) < 34;
      if (nearBasket || nearCatapult || inClearZone(this.elements, x, y)) {
        this.world.destroyBody(c.body);
        c.state = 'cleared';
      } else {
        c.body.setStatic();
        c.state = 'frozen';
      }
    }
    this.chibis = this.chibis.filter((c) => c.state === 'flying' || c.state === 'frozen' || c.state === 'in');
    const frozen = this.chibis.filter((c) => c.state === 'frozen');
    for (const c of frozen.slice(0, Math.max(0, frozen.length - maxFrozen))) {
      this.world.destroyBody(c.body);
      c.state = 'cleared';
    }
    this.chibis = this.chibis.filter((c) => c.state !== 'cleared');
  }
}
