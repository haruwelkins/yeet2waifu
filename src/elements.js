// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The interactive pieces of a course. Positions are in pixels like the rest of a level.
//   spring  {x, y, angle=90, power=16, jitter=0.6}  a pad on the ground; touching it fires you along `angle`
//           (deg, 90 = up) at `power` m/s ± jitter, so a crowd fans out instead of flying one single arc
//   boost   {x, y, w=32, dir=1, speed=15, lift=2} a dash strip: shoots you sideways (lift = the hop, m/s up)
//   gel     {x, y, w, h}                  sticky goo: you slow down and sink, often for good
//   fan     {x, y, w=32, h=120, lift=26}  an updraft for a couple of seconds, then it lets you drop
//   spinner {x, y, len=48, speed=2.5}     a bar turning around its center (rad/s; minus = the other way)
//   mover   {x, y, w=48, h=8, dx, dy, period=4}  a platform going back and forth
//   warp    {x, y, w=32, to:{x, y}, vx=0, vy=-14, jitter=0}  step on its mouth and come out at `to` with that
//           speed (± jitter m/s, so a crowd coming out of the same pipe does not land in one pile)
import { Vec2, Box } from '../vendor/planck.mjs';

const PPM = 16;
const px = (v) => v / PPM;
const DEG = Math.PI / 180;
const inside = (z, x, y) => x >= z[0] && x <= z[2] && y >= z[1] && y <= z[3];

function staticBox(world, x, y, w, h, fx = {}) {
  const body = world.createBody({ type: 'static', position: new Vec2(px(x + w / 2), px(y + h / 2)) });
  body.createFixture(new Box(px(w / 2), px(h / 2)), { friction: 0.6, restitution: 0.1, ...fx });
  return body;
}

export const KINDS = {
  spring: {
    defaults: { angle: 90, power: 16, w: 16, jitter: 0.6 },
    build(world, e) {
      staticBox(world, e.x, e.y, e.w, 6);
    },
    // the zone takes in the sides: a chibi sliding along the floor hits the pad's 6-px side, never its top
    // (in a crowd, chibis pile up against the side of a spring)
    zone: (e) => [e.x - 8, e.y - 10, e.x + e.w + 8, e.y + 6],
    clear: (e) => [e.x - 10, e.y - 18, e.x + e.w + 10, e.y + 6],
    // Every launch starts from the middle of the pad, however you arrived: a spring is a reliable cannon.
    touch(e, c, body, t, dt, gravity, rng, emit) {
      if ((c.cool[e.id] ?? -9) > t) return;
      emit({ kind: 'spring', x: e.x + e.w / 2, y: e.y - 4, angle: e.angle });
      const a = e.angle * DEG;
      const p = e.power + (rng ? rng.range(-e.jitter, e.jitter) : 0);
      body.setTransform(new Vec2(px(e.x + e.w / 2), px(e.y - 8)), body.getAngle());
      body.setLinearVelocity(new Vec2(p * Math.cos(a), -p * Math.sin(a)));
      c.cool[e.id] = t + 0.3;
      e.lastHit = t;
    },
  },
  boost: {
    defaults: { w: 32, dir: 1, speed: 15, lift: 2 },
    build(world, e) {
      staticBox(world, e.x, e.y, e.w, 4, { friction: 0.1 });
    },
    zone: (e) => [e.x, e.y - 12, e.x + e.w, e.y + 1],
    clear: (e) => [e.x - 4, e.y - 16, e.x + e.w + 4, e.y + 4],
    // Never slows you down and always gives the hop, even to a chibi that arrives fast.
    touch(e, c, body, t, dt, gravity, rng, emit) {
      if ((c.cool[e.id] ?? -9) > t) return;
      const p = body.getPosition();
      emit({ kind: 'boost', x: p.x * PPM, y: p.y * PPM, dir: e.dir, player: c.playerId });
      const v = body.getLinearVelocity();
      const vx = e.dir > 0 ? Math.max(v.x, e.speed) : Math.min(v.x, -e.speed);
      body.setLinearVelocity(new Vec2(vx, Math.min(v.y, -e.lift)));
      c.cool[e.id] = t + 0.25;
      e.lastHit = t;
    },
  },
  gel: {
    defaults: {},
    build() {},
    zone: (e) => [e.x, e.y, e.x + e.w, e.y + e.h],
    clear: () => null,
    touch(e, c, body, t, dt, gravity, rng, emit) {
      if (!c.inGel || c.inGel < t - 0.2) {
        const p = body.getPosition();
        emit({ kind: 'gel', x: p.x * PPM, y: e.y + 2 });
      }
      c.inGel = t;
      const keep = Math.pow(0.02, dt);
      const v = body.getLinearVelocity();
      body.setLinearVelocity(new Vec2(v.x * keep, v.y * keep));
      body.setAngularVelocity(body.getAngularVelocity() * keep);
      body.applyForceToCenter(new Vec2(0, -body.getMass() * gravity * 0.85), true);
      e.lastHit = t;
    },
  },
  fan: {
    defaults: { w: 32, h: 120, lift: 26 },
    build(world, e) {
      staticBox(world, e.x, e.y, e.w, 6);
    },
    zone: (e) => [e.x, e.y - e.h, e.x + e.w, e.y],
    clear: (e) => [e.x - 4, e.y - e.h, e.x + e.w + 4, e.y + 6],
    touch(e, c, body, t, dt) {
      c.fan = (c.fan ?? 0) + dt;
      if (c.fan > 2.2) return; // it lets go: nobody hovers forever (the heat has to end)
      body.applyForceToCenter(new Vec2(0, -body.getMass() * e.lift), true);
      e.lastHit = t;
    },
  },
  spinner: {
    defaults: { len: 48, speed: 2.5 },
    build(world, e) {
      e.body = world.createBody({ type: 'kinematic', position: new Vec2(px(e.x), px(e.y)) });
      e.body.createFixture(new Box(px(e.len / 2), px(2)), { friction: 0.3, restitution: 0.45 });
      e.body.setAngularVelocity(e.speed);
    },
    zone: () => null,
    clear: (e) => [e.x - e.len / 2 - 8, e.y - e.len / 2 - 8, e.x + e.len / 2 + 8, e.y + e.len / 2 + 8],
    carries: (e) => [e.x - e.len / 2 - 8, e.y - e.len / 2 - 10, e.x + e.len / 2 + 8, e.y + e.len / 2 + 8],
  },
  mover: {
    defaults: { w: 48, h: 8, dx: 0, dy: -40, period: 4 },
    build(world, e) {
      e.body = world.createBody({ type: 'kinematic', position: new Vec2(px(e.x + e.w / 2), px(e.y + e.h / 2)) });
      e.body.createFixture(new Box(px(e.w / 2), px(e.h / 2)), { friction: 0.8, restitution: 0.05 });
    },
    // Position follows a sine exactly (set each step) so a replay with the same seed is identical.
    update(e, t) {
      const k = (2 * Math.PI) / e.period;
      const s = Math.sin(k * t);
      const c = Math.cos(k * t);
      e.body.setTransform(new Vec2(px(e.x + e.w / 2 + e.dx * s), px(e.y + e.h / 2 + e.dy * s)), 0);
      e.body.setLinearVelocity(new Vec2(px(e.dx * k * c), px(e.dy * k * c)));
    },
    zone: () => null,
    clear: (e) => [Math.min(e.x, e.x + e.dx, e.x - e.dx) - 8, Math.min(e.y, e.y + e.dy, e.y - e.dy) - 20,
      Math.max(e.x, e.x + e.dx, e.x - e.dx) + e.w + 8, Math.max(e.y, e.y + e.dy, e.y - e.dy) + e.h + 4],
    carries(e) {
      return this.clear(e);
    },
  },
  warp: {
    defaults: { w: 32, vx: 0, vy: -14, jitter: 0 },
    build() {},
    zone: (e) => [e.x + 4, e.y - 10, e.x + e.w - 4, e.y + 4],
    clear: (e) => [e.x - 2, e.y - 16, e.x + e.w + 2, e.y + 6],
    touch(e, c, body, t, dt, gravity, rng, emit) {
      if ((c.cool[e.id] ?? -9) > t) return;
      const p = body.getPosition();
      emit({ kind: 'warp', x: p.x * PPM, y: p.y * PPM, tx: e.to.x, ty: e.to.y });
      const j = () => (rng ? rng.range(-e.jitter, e.jitter) : 0);
      body.setTransform(new Vec2(px(e.to.x), px(e.to.y)), body.getAngle());
      body.setLinearVelocity(new Vec2(e.vx + j(), e.vy + j()));
      c.cool[e.id] = t + 0.6;
      c.trail = [];
      e.lastHit = t;
    },
  },
};

export function buildElements(world, list = []) {
  return list.map((src, id) => {
    const kind = KINDS[src.kind];
    if (!kind) throw new Error(`unknown element kind ${src.kind}`);
    const e = { ...kind.defaults, ...src, id, lastHit: -9 };
    kind.build(world, e);
    return e;
  });
}

export function updateElements(elements, t) {
  for (const e of elements) if (KINDS[e.kind].update) KINDS[e.kind].update(e, t);
}

// Applies every element whose zone holds the chibi's center.
export function touchElements(elements, c, t, dt, gravity, rng, emit = () => {}) {
  if (!c.cool) c.cool = {};
  const p = c.body.getPosition();
  const x = p.x * PPM;
  const y = p.y * PPM;
  for (const e of elements) {
    const kind = KINDS[e.kind];
    const z = kind.zone(e);
    if (z && kind.touch && inside(z, x, y)) kind.touch(e, c, c.body, t, dt, gravity, rng, emit);
  }
}

export const inClearZone = (elements, x, y) => elements.some((e) => {
  const z = KINDS[e.kind].clear(e);
  return z && inside(z, x, y);
});

// Riding a mover or a spinner keeps you moving forever: for "has the heat stopped?" that counts as stopped.
export const isCarried = (elements, x, y) => elements.some((e) => {
  const k = KINDS[e.kind];
  return k.carries && inside(k.carries(e), x, y);
});
