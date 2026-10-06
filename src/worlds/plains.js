// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Plains world. Grid: '#' ground · '/' '\' slopes · 'B' brick · 'H' heart block · 'S' stone ·
// decor 'b' bush · 'f' flower. Pipes and the basket are objects in pixels.
import { buildLevel, paint } from '../level.js';

const E = '..............................';

const plains = buildLevel({
  id: 'plains',
  theme: 'plains',
  name: { en: 'Sunny Plains', es: 'Llanura Soleada' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [350, 470], y: 150 },
  wind: [-1, 1],
  basket: { x: 382, y: 154, w: 68, h: 38, t: 6 },
  pipes: [{ x: 144, y: 176, h: 64 }, { x: 400, y: 192, h: 48 }],
  bumpers: [{ x: 320, y: 212, r: 12 }],
  grid: [
    E, E, E, E, E, E, E,
    '.............BBHBB............',
    E, E, E, E, E, E,
    '...f..b.....f......b..f.....b.',
    '##############....############',
    '##############....############',
  ],
});

const stairs = buildLevel({
  id: 'stairs',
  theme: 'plains',
  name: { en: 'Brick Heights', es: 'Alturas de Ladrillo' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [370, 470], y: 114 },
  wind: [-1, 1],
  basket: { x: 382, y: 106, w: 68, h: 38, t: 6 },
  pipes: [{ x: 400, y: 144, h: 96 }],
  bumpers: [{ x: 216, y: 150, r: 13, bounce: 1.15 }],
  grid: [
    E, E, E, E, E, E, E, E,
    '..........BHB.................',
    E, E,
    '...................S..........',
    '..................SS..........',
    '.................SSS..........',
    '...b...f........SSSS.....f.b..',
    '###########.....SSSS##########',
    '###########.....SSSS##########',
  ],
});

// Two screens. The main line: land on the hill's far slope, slide onto the long dash strip, fly the first
// pit into a V valley that funnels everyone into a pipe flush with the ground, and come out of the far
// pipe next to her tower. What breaks the line: the pits, a gel patch on the slope, a spinner over the
// valley, and overshooting the valley into the second pit.
const pipeRun = buildLevel({
  id: 'piperun',
  theme: 'plains',
  name: { en: 'Pipe Run', es: 'Carrera de Tubos' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [190, 300], y: 210 },
  wind: [-1, 1],
  settleSeconds: 15,
  basket: { x: 862, y: 138, w: 68, h: 38, t: 6 },
  pipes: [{ x: 512, y: 240, h: 30 }, { x: 800, y: 176, h: 64 }],
  elements: [
    { kind: 'boost', x: 272, y: 240, w: 80, dir: 1, speed: 15, lift: 12 },
    { kind: 'gel', x: 440, y: 210, w: 30, h: 20 },
    { kind: 'spinner', x: 560, y: 168, len: 40, speed: 2.5 },
    { kind: 'warp', pipe: true, x: 512, y: 240, w: 32, to: { x: 816, y: 160 }, vx: 3.6, vy: -16, jitter: 0.8 },
    { kind: 'mover', x: 656, y: 212, w: 48, h: 8, dx: 56, dy: 0, period: 4 },
  ],
  grid: paint(60, [
    ['#', 0, 15, 22, 16],
    ['/', 9, 14], ['/', 10, 13], ['/', 11, 12], ['#', 10, 14], ['#', 11, 13, 11, 14],
    ['#', 12, 12, 13, 14],
    ['\\', 14, 12], ['\\', 15, 13], ['\\', 16, 14], ['#', 14, 13, 14, 14], ['#', 15, 14],
    ['#', 27, 15, 38, 16],
    ['\\', 27, 12], ['#', 27, 13, 27, 14], ['\\', 28, 13], ['#', 28, 14], ['\\', 29, 14],
    ['/', 35, 14], ['/', 36, 13], ['#', 36, 14], ['/', 37, 12], ['#', 37, 13, 37, 14], ['/', 38, 11], ['#', 38, 12, 38, 14],
    ['#', 48, 15, 59, 16],
    ['S', 54, 11, 57, 14],
    ['b', 3, 14], ['f', 6, 14], ['f', 19, 14], ['b', 21, 14], ['f', 49, 14], ['b', 52, 14], ['f', 58, 14],
    ['B', 22, 5, 24, 5], ['H', 23, 5],
  ]),
});

const balcony = buildLevel({
  id: 'balcony',
  theme: 'plains',
  mood: 'sunset',
  final: true,
  name: { en: 'Her Balcony', es: 'Su Balcón' },
  catapult: { x: 36, y: 192 },
  randomTarget: { x: [384, 428], y: 94 },
  wind: [-1.5, 1.5],
  basket: { x: 372, y: 106, w: 66, h: 38, t: 6 },
  waifu: { x: 444, y: 112 },
  bumpers: [{ x: 236, y: 176, r: 14, bounce: 1.15 }],
  grid: [
    E, E, E, E, E, E,
    '..............BHB.............',
    E, E,
    '.......................SSSSSSS',
    '.......................SSSSSSS',
    '.......................SSSSSSS',
    '.......................SSSSSSS',
    '.......................SSSSSSS',
    '..f.b..................SSSSSSS',
    '########...............SSSSSSS',
    '########...............SSSSSSS',
  ],
});

export const PLAINS = {
  name: { en: 'Platform Land', es: 'Tierra Plataforma' },
  rounds: [plains, pipeRun, stairs],
  final: balcony,
};
