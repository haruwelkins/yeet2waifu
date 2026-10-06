// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Space world (low gravity: long floaty arcs). Grid: '#' metal floor · 'M' hull · 'P' light panel · 'G' glass ·
// 'X' crate · 'H' star heart · slopes · decor 'a' antenna · 'r' robot. Empty columns at the bottom are space.
import { buildLevel, paint } from '../level.js';

const hop = buildLevel({
  id: 'moonhop',
  theme: 'space',
  gravity: 0.55,
  name: { en: 'Moon Hop', es: 'Salto Lunar' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [385, 455], y: 128 },
  wind: [-0.5, 0.5],
  settleSeconds: 13,
  basket: { x: 398, y: 138, w: 68, h: 38, t: 6 },
  bumpers: [{ x: 250, y: 48, r: 10 }, { x: 340, y: 200, r: 10 }],
  grid: paint(30, [
    ['#', 0, 15, 9, 16], ['#', 14, 15, 29, 16],
    ['P', 13, 4, 15, 4],
    ['X', 16, 14, 17, 14],
    ['M', 25, 11, 28, 14],
    ['a', 3, 14], ['r', 7, 14], ['r', 22, 14],
  ]),
});

// Two screens of orbit: a dash strip launches you long and floaty over the void (hover platforms drift in
// it), a satellite spins in the way, and a portal on the far deck drops you over the basket on the hull tower.
const orbit = buildLevel({
  id: 'orbit',
  theme: 'space',
  gravity: 0.55,
  name: { en: 'Orbit Run', es: 'Carrera Orbital' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [80, 180], y: 225 },
  wind: [-0.5, 0.5],
  settleSeconds: 16,
  basket: { x: 846, y: 106, w: 68, h: 38, t: 6 },
  elements: [
    { kind: 'boost', x: 96, y: 240, w: 80, dir: 1, speed: 11, lift: 6 },
    { kind: 'mover', x: 216, y: 200, w: 48, h: 8, dx: 0, dy: -40, period: 3 },
    { kind: 'spinner', x: 300, y: 140, len: 48, speed: 1.6 },
    { kind: 'boost', x: 368, y: 240, w: 112, dir: 1, speed: 5, lift: 0 },
    { kind: 'warp', x: 480, y: 240, w: 48, to: { x: 880, y: 80 }, vx: 0, vy: -2, jitter: 1.2 },
  ],
  grid: paint(60, [
    ['#', 0, 15, 10, 16],
    ['#', 21, 15, 34, 16],
    ['M', 33, 11, 34, 14],
    ['#', 44, 15, 59, 16],
    ['M', 52, 9, 58, 14],
    ['P', 47, 10, 48, 14],
    ['a', 3, 14], ['r', 7, 14], ['r', 24, 14], ['a', 30, 14], ['a', 45, 14], ['r', 50, 14],
  ]),
});

const deck = buildLevel({
  id: 'deck',
  theme: 'space',
  gravity: 0.7,
  final: true,
  name: { en: 'Observation Deck', es: 'Mirador' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-0.5, 0.5],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  bumpers: [{ x: 236, y: 150, r: 13 }],
  grid: paint(30, [
    ['#', 0, 15, 7, 16],
    ['M', 23, 9, 29, 16],
    ['G', 22, 9, 22, 16],
    ['P', 13, 6, 15, 6],
    ['a', 2, 14], ['r', 5, 14],
  ]),
});

export const SPACE = {
  name: { en: 'Star Station', es: 'Estación Estelar' },
  rounds: [hop, orbit],
  final: deck,
};
