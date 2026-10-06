// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Midnight world. Grid: '#' dark floor · 'G' glass building block · 'T' clock block · 'H' heart block ·
// slopes · decor 'C' coffin · 'l' street lamp. Empty columns at the bottom are the void.
import { buildLevel, paint } from '../level.js';

const darkHour = buildLevel({
  id: 'darkhour',
  theme: 'midnight',
  name: { en: 'Dark Hour', es: 'Hora Oscura' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [385, 455], y: 136 },
  wind: [-1, 1],
  basket: { x: 398, y: 138, w: 68, h: 38, t: 6 },
  elements: [
    { kind: 'spring', x: 144, y: 234, angle: 64, power: 15 },
    { kind: 'spinner', x: 232, y: 110, len: 52, speed: 1.4 },
  ],
  bumpers: [{ x: 330, y: 200, r: 11 }],
  grid: paint(30, [
    ['#', 0, 15, 10, 16], ['#', 17, 15, 29, 16],
    ['T', 12, 8, 14, 8],
    ['G', 20, 10, 21, 14],
    ['G', 25, 11, 28, 14],
    ['l', 3, 14], ['C', 6, 14], ['C', 18, 14], ['C', 23, 14], ['l', 29, 14],
  ]),
});

// Two screens up the city: a dash strip over the first gap, a spring onto a rooftop, and from that roof one
// long spring over the lower roof into the basket on the tallest building. Every step leaks a few, so the
// chain stays short.
const climb = buildLevel({
  id: 'climb',
  theme: 'midnight',
  name: { en: 'Rooftop Climb', es: 'Escalada de Azoteas' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [40, 280], y: 224 },
  wind: [-0.5, 0.5],
  settleSeconds: 16,
  basket: { x: 866, y: 58, w: 68, h: 38, t: 6 },
  elements: [
    { kind: 'boost', x: 96, y: 240, w: 80, dir: 1, speed: 14, lift: 7 },
    { kind: 'boost', x: 320, y: 240, w: 80, dir: 1, speed: 6, lift: 0 },
    { kind: 'spring', x: 400, y: 234, angle: 58, power: 17 },
    { kind: 'boost', x: 512, y: 160, w: 64, dir: 1, speed: 5, lift: 0 },
    { kind: 'spring', x: 576, y: 154, angle: 50, power: 21 },
    { kind: 'spinner', x: 244, y: 168, len: 40, speed: -1.8 },
  ],
  grid: paint(60, [
    ['#', 0, 15, 12, 16],
    ['#', 17, 15, 26, 16],
    ['G', 32, 10, 37, 16],
    ['G', 43, 8, 47, 16],
    ['G', 53, 6, 58, 16],
    ['T', 22, 7, 24, 7],
    ['l', 3, 14], ['C', 8, 14], ['C', 20, 14], ['l', 24, 14], ['C', 34, 9], ['C', 45, 7],
  ]),
});

const topFloor = buildLevel({
  id: 'topfloor',
  theme: 'midnight',
  final: true,
  name: { en: 'Top Floor', es: 'Último Piso' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-1, 1],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  elements: [{ kind: 'spinner', x: 240, y: 170, len: 50, speed: 1.5 }],
  grid: paint(30, [
    ['#', 0, 15, 7, 16],
    ['G', 23, 9, 29, 16],
    ['T', 13, 6, 15, 6],
    ['l', 2, 14], ['C', 5, 14],
  ]),
});

export const MIDNIGHT = {
  name: { en: 'Midnight City', es: 'Ciudad de Medianoche' },
  rounds: [darkHour, climb],
  final: topFloor,
};
