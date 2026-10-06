// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Castle world. Grid: '#' stone floor · 'B' red brick · 'P' pillar block · 'H' gem block · slopes ·
// decor 'c' candelabra · 'w' stained glass. Empty columns at the bottom are the moat in the dark.
import { buildLevel, paint } from '../level.js';

// Two screens: a broken bridge high over the moat. Dash runes push you along it, a slab rises and sinks in
// the first gap, iron bars sweep above, and a portal at the end of the bridge drops you over the basket.
const bridge = buildLevel({
  id: 'bridge',
  theme: 'castle',
  name: { en: 'Castle Bridge', es: 'Puente del Castillo' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [170, 280], y: 182 },
  wind: [-1, 1],
  settleSeconds: 15,
  basket: { x: 850, y: 122, w: 68, h: 38, t: 6 },
  elements: [
    { kind: 'boost', x: 176, y: 192, w: 48, dir: 1, speed: 13, lift: 6 },
    { kind: 'mover', x: 240, y: 192, w: 32, h: 8, dx: 0, dy: 36, period: 2.6 },
    { kind: 'boost', x: 288, y: 192, w: 48, dir: 1, speed: 12, lift: 6 },
    { kind: 'spinner', x: 300, y: 140, len: 44, speed: 2.4 },
    { kind: 'spinner', x: 420, y: 150, len: 48, speed: -2.1 },
    { kind: 'warp', x: 432, y: 192, w: 64, to: { x: 884, y: 92 }, vx: 0, vy: -3, jitter: 1.2 },
  ],
  grid: paint(60, [
    ['#', 0, 15, 9, 16],
    ['B', 10, 12, 14, 12], ['B', 17, 12, 30, 12],
    ['P', 10, 13, 10, 16], ['P', 30, 13, 30, 16],
    ['#', 49, 15, 59, 16],
    ['P', 52, 10, 56, 14],
    ['c', 12, 11], ['c', 19, 11], ['c', 25, 11], ['c', 3, 14], ['c', 50, 14],
    ['H', 36, 6, 38, 6],
  ]),
});

// One screen, two iron bars turning over two pits and a patch of ectoplasm.
const clockHall = buildLevel({
  id: 'clockhall',
  theme: 'castle',
  name: { en: 'Clock Hall', es: 'Salón del Reloj' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [392, 452], y: 136 },
  wind: [-1, 1],
  basket: { x: 398, y: 138, w: 68, h: 38, t: 6 },
  elements: [
    { kind: 'spinner', x: 184, y: 176, len: 40, speed: 2.2 },
    { kind: 'spinner', x: 330, y: 180, len: 40, speed: -2.4 },
    { kind: 'gel', x: 224, y: 230, w: 40, h: 10 },
  ],
  grid: paint(30, [
    ['#', 0, 15, 9, 16], ['#', 13, 15, 18, 16], ['#', 22, 15, 29, 16],
    ['P', 25, 11, 28, 14],
    ['B', 14, 3, 16, 3], ['H', 15, 3],
    ['c', 3, 14], ['c', 15, 14], ['c', 23, 14],
  ]),
});

const moonTower = buildLevel({
  id: 'moontower',
  theme: 'castle',
  final: true,
  name: { en: 'Moon Tower', es: 'Torre de la Luna' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-1.5, 1.5],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  bumpers: [{ x: 230, y: 180, r: 13, bounce: 1.15 }],
  elements: [{ kind: 'spinner', x: 300, y: 110, len: 44, speed: 1.9 }],
  grid: paint(30, [
    ['#', 0, 15, 7, 16],
    ['P', 23, 9, 29, 16],
    ['H', 13, 6, 15, 6],
    ['c', 3, 14],
  ]),
});

export const CASTLE = {
  name: { en: 'Moonlit Castle', es: 'Castillo de la Luna' },
  rounds: [clockHall, bridge],
  final: moonTower,
};
