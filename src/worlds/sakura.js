// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Sakura world. Grid: '#' grass and soil · 'S' stone · 'W' red lacquered wood · 'H' blossom block · slopes ·
// decor 'l' stone lantern · 'p' cherry sapling · 'b' bamboo. torii: gates you fly through (objects, not solid).
// Empty columns at the bottom are the river.
import { buildLevel, paint } from '../level.js';

const steps = buildLevel({
  id: 'toriisteps',
  theme: 'sakura',
  name: { en: 'Torii Steps', es: 'Escalones del Torii' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [385, 455], y: 128 },
  wind: [-1, 1],
  basket: { x: 398, y: 138, w: 68, h: 38, t: 6 },
  torii: [{ x: 300, ground: 176, w: 56, h: 64 }],
  bumpers: [{ x: 250, y: 120, r: 11 }],
  elements: [{ kind: 'spinner', x: 196, y: 150, len: 40, speed: 1.8 }],
  grid: paint(30, [
    ['#', 0, 15, 10, 16],
    ['S', 11, 14, 12, 16], ['S', 13, 13, 14, 16], ['S', 15, 12, 16, 16],
    ['#', 17, 11, 29, 16],
    ['l', 2, 14], ['b', 7, 14], ['b', 8, 14], ['p', 5, 14], ['l', 18, 10], ['p', 29, 10],
  ]),
});

// Two screens across the river: a raft drifts in the first channel, a dash strip on the island throws you
// onto the lacquered bridge, a second strip on the bridge carries you off its end, and a red spring at the
// bottom sends you up to the basket on the stone terrace.
const river = buildLevel({
  id: 'petalriver',
  theme: 'sakura',
  name: { en: 'Petal River', es: 'Río de Pétalos' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [400, 500], y: 225 },
  wind: [-0.5, 0.5],
  settleSeconds: 15,
  basket: { x: 862, y: 154, w: 68, h: 38, t: 6 },
  torii: [{ x: 430, ground: 240, w: 52, h: 60 }],
  elements: [
    { kind: 'mover', x: 232, y: 228, w: 48, h: 8, dx: 56, dy: 0, period: 4 },
    { kind: 'boost', x: 400, y: 240, w: 80, dir: 1, speed: 12, lift: 13 },
    { kind: 'boost', x: 600, y: 176, w: 112, dir: 1, speed: 5, lift: 1 },
    { kind: 'boost', x: 760, y: 240, w: 56, dir: 1, speed: 5, lift: 0 },
    { kind: 'spring', x: 816, y: 234, angle: 75, power: 15.7 },
    { kind: 'spinner', x: 560, y: 120, len: 40, speed: -2 },
  ],
  grid: paint(60, [
    ['#', 0, 15, 12, 16],
    ['#', 23, 15, 34, 16],
    ['W', 37, 11, 45, 11], ['W', 45, 12, 45, 13],
    ['#', 47, 15, 59, 16],
    ['S', 54, 12, 57, 14],
    ['l', 3, 14], ['b', 9, 14], ['b', 10, 14], ['p', 24, 14], ['l', 33, 14], ['p', 48, 14], ['l', 52, 14], ['b', 59, 14],
  ]),
});

const moonGate = buildLevel({
  id: 'moongate',
  theme: 'sakura',
  mood: 'sunset',
  final: true,
  name: { en: 'Moon Gate', es: 'Puerta de la Luna' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-1.5, 1.5],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  torii: [{ x: 210, ground: 252, w: 60, h: 76 }],
  bumpers: [{ x: 300, y: 196, r: 12 }],
  elements: [{ kind: 'spinner', x: 290, y: 56, len: 36, speed: 1.6 }],
  grid: paint(30, [
    ['#', 0, 15, 7, 16],
    ['W', 23, 9, 29, 16],
    ['l', 2, 14], ['p', 5, 14],
  ]),
});

export const SAKURA = {
  name: { en: 'Sakura Shrine', es: 'Santuario Sakura' },
  rounds: [steps, river],
  final: moonGate,
};
