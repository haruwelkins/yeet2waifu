// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Ice world. Grid: '#' snow over rock (slippery) · 'I' ice block (very slippery) · 'R' rock · 'H' frost
// heart · slopes · decor 'p' snowy pine · 's' snowman. Empty columns at the bottom are freezing water.
import { buildLevel, paint } from '../level.js';

const yard = buildLevel({
  id: 'igloo',
  theme: 'ice',
  name: { en: 'Igloo Yard', es: 'Patio del Iglú' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [385, 455], y: 128 },
  wind: [-1, 1],
  basket: { x: 398, y: 138, w: 68, h: 38, t: 6 },
  elements: [{ kind: 'spinner', x: 214, y: 150, len: 40, speed: 2 }],
  grid: paint(30, [
    ['#', 0, 15, 11, 16], ['#', 15, 15, 29, 16],
    ['I', 9, 9, 10, 9],
    ['I', 20, 14, 23, 14],
    ['R', 25, 11, 28, 14],
    ['p', 3, 14], ['s', 6, 14], ['p', 17, 14], ['s', 22, 13],
  ]),
});

// Two screens downhill: the catapult sits on a cliff, everything lands on the long slope and slides down the
// ice into a spring that throws it over the crevasse; a dash strip into a second spring finishes the climb.
// (A spring, not a ramp: a crowd jams in the dip in front of a ramp.)
const avalanche = buildLevel({
  id: 'avalanche',
  theme: 'ice',
  name: { en: 'Avalanche Run', es: 'Bajada de Avalancha' },
  catapult: { x: 36, y: 80 },
  randomTarget: { x: [130, 250], y: 190 },
  wind: [-0.5, 0.5],
  settleSeconds: 16,
  basket: { x: 862, y: 138, w: 68, h: 38, t: 6 },
  elements: [
    { kind: 'boost', x: 384, y: 240, w: 80, dir: 1, speed: 8, lift: 0 },
    { kind: 'spring', x: 464, y: 234, angle: 40, power: 17 },
    { kind: 'spinner', x: 552, y: 150, len: 44, speed: 2.2 },
    { kind: 'gel', x: 610, y: 228, w: 30, h: 12 },
    { kind: 'boost', x: 672, y: 240, w: 96, dir: 1, speed: 8, lift: 0 },
    { kind: 'spring', x: 784, y: 234, angle: 66, power: 16 },
  ],
  grid: paint(60, [
    ['#', 0, 8, 6, 16],
    ['\\', 7, 8], ['#', 7, 9, 7, 16], ['\\', 8, 9], ['#', 8, 10, 8, 16], ['\\', 9, 10], ['#', 9, 11, 9, 16],
    ['\\', 10, 11], ['#', 10, 12, 10, 16], ['\\', 11, 12], ['#', 11, 13, 11, 16], ['\\', 12, 13], ['#', 12, 14, 12, 16],
    ['\\', 13, 14], ['#', 13, 15, 13, 16],
    ['I', 14, 15, 30, 15], ['#', 14, 16, 30, 16],
    ['#', 38, 15, 59, 16],
    ['R', 54, 11, 57, 14],
    ['p', 1, 7], ['s', 4, 7], ['p', 18, 14], ['p', 24, 14], ['s', 40, 14], ['p', 46, 14], ['p', 59, 14],
  ]),
});

const summit = buildLevel({
  id: 'aurora',
  theme: 'ice',
  final: true,
  name: { en: 'Aurora Summit', es: 'Cumbre de la Aurora' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-1.5, 1.5],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  bumpers: [{ x: 240, y: 170, r: 13 }],
  grid: paint(30, [
    ['#', 0, 15, 7, 16],
    ['R', 23, 9, 29, 16],
    ['I', 13, 6, 15, 6],
    ['p', 2, 14], ['s', 5, 14],
  ]),
});

export const ICE = {
  name: { en: 'Frost Peak', es: 'Pico Helado' },
  rounds: [yard, avalanche],
  final: summit,
};
