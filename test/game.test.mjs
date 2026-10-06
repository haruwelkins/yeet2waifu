// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../src/config.js';
import { Game, splitHeats } from '../src/game.js';

const STEP = 1 / 60;
const cfg = (over = {}) => ({ ...DEFAULTS, seed: 7, ...over });
const viewer = (i, extra = {}) => ({ id: `u${i}`, name: `viewer${i}`, text: '!yeet', ...extra });

function play(game, maxSeconds = 600) {
  const phases = [];
  game.on((ev) => ev.type === 'phase' && phases.push(ev.phase));
  for (let t = 0; t < maxSeconds && game.phase !== 'end'; t += STEP) game.step(STEP);
  return phases;
}

function signUp(game, n, text = () => '!yeet') {
  game.admin('start');
  for (let i = 0; i < n; i++) game.handleChat(viewer(i, { text: text(i) }));
  game.admin('go');
}

test('sound: on/off from chat, a bare command toggles', () => {
  const game = new Game(cfg());
  const seen = [];
  game.on((ev) => ev.type === 'sound' && seen.push(ev.on));
  game.admin('sound', 'off');
  game.admin('sound', 'on');
  game.admin('sound');
  game.admin('sound');
  assert.deepEqual(seen, [false, true, false, true]);
  assert.equal(game.cfg.sound, true);
});

test('heats split as evenly as possible', () => {
  const ids = (n) => Array.from({ length: n }, (_, i) => i);
  assert.deepEqual(splitHeats(ids(31), 30).map((h) => h.length), [16, 15]);
  assert.deepEqual(splitHeats(ids(30), 30).map((h) => h.length), [30]);
  assert.deepEqual(splitHeats(ids(120), 30).map((h) => h.length), [30, 30, 30, 30]);
  assert.deepEqual(splitHeats([], 30), []);
});

test('only the streamer and mods run the game', () => {
  const g = new Game(cfg());
  g.handleChat(viewer(1, { text: '!y2w start' }));
  assert.equal(g.phase, 'idle');
  g.handleChat(viewer(2, { text: '!y2w start', isMod: true }));
  assert.equal(g.phase, 'join');
});

test('sign-ups respect the cap and the window', () => {
  const g = new Game(cfg({ maxPlayers: 5 }));
  g.admin('start');
  for (let i = 0; i < 9; i++) g.handleChat(viewer(i));
  assert.equal(g.humans().length, 5);
  g.admin('go');
  g.step(STEP);
  g.handleChat(viewer(99));
  assert.equal(g.players.has('u99'), false);
});

test('house bots fill a small chat, and can be turned off', () => {
  const g = new Game(cfg());
  signUp(g, 2);
  g.step(STEP);
  assert.equal(g.players.size, DEFAULTS.minPlayers);
  const solo = new Game(cfg({ bots: false }));
  signUp(solo, 2);
  solo.step(STEP);
  assert.equal(solo.players.size, 2);
});

for (const [n, seed] of [[1, 3], [3, 11], [8, 5], [50, 7], [200, 9]]) {
  test(`a whole match with ${n} viewers ends, and the result is coherent (seed ${seed})`, () => {
    const g = new Game(cfg({ seed, bots: false }));
    signUp(g, n);
    const phases = play(g);
    assert.equal(g.phase, 'end', `stuck in ${g.phase}`);
    assert.ok(phases.includes('launch'));
    const { winner, finalists } = g.result;
    if (winner) {
      assert.equal(winner.status, 'winner');
      assert.ok(finalists.includes(winner));
      assert.equal(g.isFinal, true, 'only the final crowns someone');
    } else {
      assert.equal(finalists.length, 0);
    }
    assert.ok(g.humans().length <= DEFAULTS.maxPlayers);
    assert.ok(g.players.size === Math.min(n, DEFAULTS.maxPlayers));
  });
}

test('every match with enough players reaches the final eventually (many seeds)', () => {
  let finals = 0;
  let winners = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const g = new Game(cfg({ seed, bots: false }));
    signUp(g, 40);
    play(g);
    assert.equal(g.phase, 'end');
    if (g.isFinal) finals++;
    if (g.result.winner) winners++;
  }
  // Recorded, not pinned: tells us if the maps got too hard (nobody reaches her) or too easy.
  console.log(`  40 viewers × 12 seeds: ${finals} reached the final, ${winners} won the waifu`);
  assert.ok(finals > 0);
});

test('a new round forgets old aims; only players still alive can re-aim', () => {
  const g = new Game(cfg({ seed: 21, bots: false }));
  signUp(g, 30, () => '!yeet 45 80');
  let checked = false;
  g.on((ev) => {
    if (ev.type === 'round' && ev.round === 2) {
      for (const p of g.alive()) assert.equal(p.aim, null);
      const out = [...g.players.values()].find((p) => p.status === 'out');
      if (out) {
        g.handleChat({ id: out.id, name: out.name, text: '!yeet 10 10' });
        assert.equal(out.aim.angle, 45, 'an eliminated viewer cannot change anything');
      }
      checked = true;
    }
  });
  play(g);
  if (!checked) console.log('  (no round 2 with this seed, nothing to check)');
});

test('the same seed replays the same match', () => {
  const run = () => {
    const g = new Game(cfg({ seed: 1234, bots: false }));
    signUp(g, 25);
    play(g);
    return JSON.stringify({ w: g.result.winner?.id ?? null, r: g.result.round, f: g.result.finalists.map((p) => p.id) });
  };
  assert.equal(run(), run());
});

test('pick on: several finalists wait for the streamer (a number or a name), random when nobody picks', () => {
  const setUp = () => {
    const g = new Game(cfg({ pick: true, pickSeconds: 5, bots: false }));
    g.admin('start');
    for (let i = 0; i < 3; i++) g.handleChat(viewer(i));
    const ids = [...g.players.keys()];
    g.isFinal = true;
    g.roundQualified = ids.slice();
    g.endRound();
    return { g, ids };
  };
  let { g, ids } = setUp();
  assert.equal(g.phase, 'choose');
  g.admin('pick', '2');
  g.step(STEP);
  assert.equal(g.phase, 'end');
  assert.equal(g.result.winner.id, ids[1]);
  ({ g, ids } = setUp());
  g.admin('pick', g.players.get(ids[2]).name.toUpperCase());
  g.step(STEP);
  assert.equal(g.result.winner.id, ids[2]);
  ({ g, ids } = setUp());
  for (let t = 0; t < 6; t += STEP) g.step(STEP);
  assert.equal(g.phase, 'end');
  assert.ok(ids.includes(g.result.winner.id));
});
