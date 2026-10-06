// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Candy world. Grid: '#' sponge cake with frosting · 'C' chocolate block · 'J' gummy block (bouncy) ·
// 'H' sweetheart block · slopes · decor 'c' candy cane · 'l' lollipop · 'u' cupcake.
// Empty columns at the bottom are the chocolate river.
import { buildLevel, paint } from '../level.js';

const hills = buildLevel({
  id: 'cupcakehills',
  theme: 'candy',
  name: { en: 'Cupcake Hills', es: 'Colinas de Cupcake' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [385, 455], y: 145 },
  wind: [-1, 1],
  basket: { x: 398, y: 154, w: 68, h: 38, t: 6 },
  bumpers: [{ x: 330, y: 186, r: 11 }],
  grid: paint(30, [
    ['#', 0, 15, 11, 16], ['#', 16, 15, 29, 16],
    ['/', 5, 14], ['/', 6, 13], ['#', 6, 14], ['#', 7, 13, 9, 14], ['\\', 10, 13], ['#', 10, 14], ['\\', 11, 14],
    ['J', 16, 8, 17, 8],
    ['C', 25, 12, 28, 14],
    ['c', 3, 14], ['u', 8, 12], ['l', 19, 14], ['u', 22, 14], ['c', 29, 14],
  ]),
});

// Two screens over the chocolate river: a dash strip into a pink spring throws you far across, gummy
// stepping stones bounce you on, a cookie raft wanders in the way, and a last spring lifts you onto the
// top of the giant cake.
const falls = buildLevel({
  id: 'chocofalls',
  theme: 'candy',
  name: { en: 'Choco Falls', es: 'Cascada de Chocolate' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [40, 230], y: 225 },
  wind: [-0.5, 0.5],
  settleSeconds: 15,
  basket: { x: 846, y: 106, w: 68, h: 38, t: 6 },
  elements: [
    { kind: 'boost', x: 80, y: 240, w: 80, dir: 1, speed: 9, lift: 0 },
    { kind: 'spring', x: 160, y: 234, angle: 45, power: 20 },
    { kind: 'mover', x: 300, y: 196, w: 40, h: 8, dx: 60, dy: 0, period: 3.5 },
    { kind: 'boost', x: 452, y: 208, w: 104, dir: 1, speed: 9, lift: 5 },
    { kind: 'boost', x: 608, y: 240, w: 144, dir: 1, speed: 6, lift: 0 },
    { kind: 'spring', x: 752, y: 234, angle: 70, power: 18.6 },
  ],
  grid: paint(60, [
    ['#', 0, 15, 10, 16],
    ['J', 15, 13, 17, 13], ['J', 22, 12, 24, 12], ['J', 28, 13, 34, 13],
    ['#', 38, 15, 59, 16],
    ['C', 52, 9, 58, 14],
    ['c', 3, 14], ['l', 6, 14], ['u', 43, 14], ['l', 46, 14], ['c', 50, 14], ['u', 59, 14],
  ]),
});

const cakeTop = buildLevel({
  id: 'caketop',
  theme: 'candy',
  final: true,
  name: { en: 'Cake Top', es: 'La Cima del Pastel' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-1.5, 1.5],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  bumpers: [{ x: 236, y: 176, r: 14 }],
  grid: paint(30, [
    ['#', 0, 15, 7, 16],
    ['C', 23, 9, 29, 16],
    ['J', 14, 6, 15, 6],
    ['c', 2, 14], ['u', 5, 14],
  ]),
});

export const CANDY = {
  name: { en: 'Candy Land', es: 'Tierra Dulce' },
  rounds: [hills, falls],
  final: cakeTop,
};
