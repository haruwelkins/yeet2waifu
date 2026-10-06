// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The worlds. A match plays one world: its round courses in order, then its final (her place).
// Level format: src/level.js. Interactive pieces: src/elements.js. Each world lives in src/worlds/.
// randomTarget (per course): a random !yeet aims at a random x in this range at height y (wind and
// obstacles not counted). Its width sets how often a random shot goes well (tools/medir_mapas.mjs).
import { PLAINS } from './worlds/plains.js';
import { DUNGEON } from './worlds/dungeon.js';
import { SPEED } from './worlds/speed.js';
import { CASTLE } from './worlds/castle.js';
import { MIDNIGHT } from './worlds/midnight.js';
import { SAKURA } from './worlds/sakura.js';
import { CANDY } from './worlds/candy.js';
import { ICE } from './worlds/ice.js';
import { SPACE } from './worlds/space.js';

export const WORLDS = {
  plains: PLAINS, dungeon: DUNGEON, speed: SPEED, castle: CASTLE, midnight: MIDNIGHT,
  sakura: SAKURA, candy: CANDY, ice: ICE, space: SPACE,
};

export const MAPS = Object.values(WORLDS).flatMap((w) => [...w.rounds, w.final]);
export const mapById = (id) => MAPS.find((m) => m.id === id);
// The first world's courses, for code that only needs "a round" and "a final".
export const ROUND_MAPS = WORLDS.plains.rounds;
export const FINAL_MAPS = [WORLDS.plains.final];
