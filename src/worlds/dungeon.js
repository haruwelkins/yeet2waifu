// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Dungeon world. Grid: '#' floor · 'W' wall block · 'R' rune block · 'H' heart stone · slopes '/' '\\' ·
// decor 't' torch · 'k' banner · 'p' pot · 'c' chain. Empty columns at the bottom are lava.
import { buildLevel, paint } from '../level.js';

const gate = buildLevel({
  id: 'gate',
  theme: 'dungeon',
  name: { en: 'Gate Hall', es: 'Salón de la Puerta' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [370, 445], y: 148 },
  wind: [-0.5, 0.5],
  basket: { x: 384, y: 154, w: 64, h: 38, t: 6 },
  elements: [
    { kind: 'gel', x: 288, y: 228, w: 48, h: 12 },
    { kind: 'spinner', x: 232, y: 120, len: 44, speed: 2 },
  ],
  bumpers: [{ x: 340, y: 205, r: 11 }],
  grid: paint(30, [
    ['#', 0, 15, 8, 16], ['#', 16, 15, 29, 16],
    ['W', 11, 9, 12, 16],
    ['R', 17, 6, 19, 6], ['H', 18, 6],
    ['W', 24, 12, 27, 14],
    ['t', 5, 11], ['t', 21, 10], ['k', 14, 3], ['k', 28, 4], ['c', 8, 0], ['c', 8, 1], ['p', 3, 14], ['p', 20, 14],
  ]),
});

// Two screens: a dash strip into a gold spring over the first lava, a valley that funnels into a portal,
// and the portal drops you over the basket at the far end. Losses: the lavas, a slab, an iron bar.
const crypt = buildLevel({
  id: 'crypt',
  theme: 'dungeon',
  name: { en: 'Crypt Run', es: 'Carrera de la Cripta' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [90, 170], y: 222 },
  wind: [-0.5, 0.5],
  settleSeconds: 15,
  basket: { x: 866, y: 138, w: 68, h: 38, t: 6 },
  elements: [
    { kind: 'boost', x: 80, y: 240, w: 80, dir: 1, speed: 10, lift: 1 },
    { kind: 'spring', x: 160, y: 234, angle: 52, power: 17 },
    { kind: 'mover', x: 216, y: 196, w: 40, h: 8, dx: 40, dy: 0, period: 3 },
    { kind: 'warp', x: 360, y: 240, w: 48, to: { x: 892, y: 104 }, vx: 0, vy: -4, jitter: 1.2 },
    { kind: 'spinner', x: 576, y: 150, len: 52, speed: -2.2 },
    { kind: 'fan', x: 720, y: 234, w: 32, h: 100, lift: 24 },
  ],
  grid: paint(60, [
    ['#', 0, 15, 10, 16],
    ['#', 19, 15, 30, 16],
    ['\\', 19, 12], ['#', 19, 13, 19, 14], ['\\', 20, 13], ['#', 20, 14], ['\\', 21, 14],
    ['/', 27, 14], ['/', 28, 13], ['#', 28, 14], ['/', 29, 12], ['#', 29, 13, 29, 14], ['/', 30, 11], ['#', 30, 12, 30, 14],
    ['#', 41, 15, 59, 16],
    ['W', 54, 11, 58, 14],
    ['R', 34, 7, 36, 7], ['H', 35, 7],
    ['t', 4, 11], ['t', 24, 9], ['t', 47, 10], ['k', 13, 2], ['k', 38, 3], ['k', 52, 4],
    ['c', 16, 0], ['c', 16, 1], ['c', 44, 0], ['p', 2, 14], ['p', 45, 14], ['p', 50, 14],
  ]),
});

const chamber = buildLevel({
  id: 'chamber',
  theme: 'dungeon',
  final: true,
  name: { en: 'Her Chamber', es: 'Su Recámara' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-0.5, 0.5],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  bumpers: [{ x: 236, y: 172, r: 14, bounce: 1.15 }],
  elements: [{ kind: 'spinner', x: 300, y: 70, len: 36, speed: 1.8 }],
  grid: paint(30, [
    ['#', 0, 15, 7, 16],
    ['W', 23, 9, 29, 16],
    ['R', 15, 3, 17, 3], ['H', 16, 3],
    ['t', 4, 11], ['t', 21, 7], ['k', 9, 2], ['k', 18, 2], ['c', 15, 0], ['c', 15, 1], ['p', 2, 14],
  ]),
});

export const DUNGEON = {
  name: { en: 'Hero Dungeon', es: 'Calabozo del Héroe' },
  rounds: [gate, crypt],
  final: chamber,
};
