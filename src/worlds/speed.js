// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Speed world. Grid: '#' checkered earth · slopes '/' '\\' · 'K' rock · 'I' item box · decor 'p' palm ·
// 'f' sunflower · 'r' red flower. Empty columns at the bottom are the sea.
import { buildLevel, paint } from '../level.js';

// Two screens of pure speed: down the hill onto a dash strip, a spring that throws you over the sea, a
// second dash strip on landing and a big spring up to the cliff where the basket waits.
const coast = buildLevel({
  id: 'coast',
  theme: 'speed',
  name: { en: 'Green Coast', es: 'Costa Verde' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [120, 380], y: 205 },
  wind: [-1, 1],
  settleSeconds: 15,
  basket: { x: 866, y: 106, w: 68, h: 38, t: 6 },
  bumpers: [{ x: 600, y: 120, r: 9 }],
  elements: [
    { kind: 'boost', x: 288, y: 240, w: 80, dir: 1, speed: 12, lift: 1 },
    { kind: 'spring', x: 368, y: 234, angle: 40, power: 19 },
    { kind: 'boost', x: 664, y: 240, w: 80, dir: 1, speed: 9, lift: 1 },
    { kind: 'spring', x: 746, y: 234, angle: 72, power: 20 },
  ],
  grid: paint(60, [
    ['#', 0, 15, 25, 16],
    ['/', 9, 14], ['/', 10, 13], ['#', 10, 14], ['/', 11, 12], ['#', 11, 13, 11, 14],
    ['#', 12, 12, 14, 14],
    ['\\', 15, 12], ['#', 15, 13, 15, 14], ['\\', 16, 13], ['#', 16, 14], ['\\', 17, 14],
    ['#', 34, 15, 47, 16],
    ['#', 50, 9, 59, 16],
    ['I', 29, 7, 30, 7],
    ['p', 3, 14], ['f', 6, 14], ['p', 20, 14], ['r', 22, 14], ['f', 36, 14], ['p', 40, 14], ['r', 45, 14],
    ['p', 52, 8], ['f', 58, 8],
  ]),
});

// One screen of pinball: springs in the valley, round bumpers in the air, a rock pillar with the basket.
const springs = buildLevel({
  id: 'springs',
  theme: 'speed',
  name: { en: 'Spring Valley', es: 'Valle de Resortes' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [390, 452], y: 136 },
  wind: [-1, 1],
  basket: { x: 398, y: 138, w: 68, h: 38, t: 6 },
  bumpers: [{ x: 230, y: 52, r: 12 }, { x: 290, y: 200, r: 11 }, { x: 336, y: 176, r: 9 }],
  elements: [
    { kind: 'spring', x: 112, y: 234, angle: 72, power: 15 },
    { kind: 'spring', x: 272, y: 234, angle: 62, power: 16 },
  ],
  grid: paint(30, [
    ['#', 0, 15, 11, 16], ['#', 16, 15, 29, 16],
    ['K', 25, 11, 28, 14],
    ['I', 17, 3, 18, 3],
    ['p', 3, 14], ['f', 5, 14], ['r', 18, 14], ['p', 22, 14], ['f', 29, 14],
  ]),
});

const cliff = buildLevel({
  id: 'cliff',
  theme: 'speed',
  mood: 'sunset',
  final: true,
  name: { en: 'Sunset Cliff', es: 'Acantilado al Atardecer' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-1.5, 1.5],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  bumpers: [{ x: 236, y: 176, r: 14, bounce: 1.15 }],
  elements: [{ kind: 'spring', x: 112, y: 234, angle: 58, power: 17 }],
  grid: paint(30, [
    ['#', 0, 15, 8, 16],
    ['#', 22, 9, 29, 16],
    ['I', 13, 6, 14, 6],
    ['p', 2, 14], ['f', 4, 14],
  ]),
});

export const SPEED = {
  name: { en: 'Speed Coast', es: 'Costa Veloz' },
  rounds: [springs, coast],
  final: cliff,
};
