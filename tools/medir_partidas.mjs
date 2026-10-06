// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The funnel, measured on whole matches (the real Game, every viewer on random !yeet):
//   node tools/medir_partidas.mjs [seeds] [world]   (no world = every world, one block each)
// Targets: someone wins ~75-85 % of matches (a "she stays single" now and then is content, every time
// is a letdown), 2-4 rounds, a match of ~2.5-5 minutes so "one more" is easy.
import { DEFAULTS } from '../src/config.js';
import { Game } from '../src/game.js';
import { WORLDS } from '../src/maps.js';

const STEP = 1 / 60;
const seeds = Number(process.argv[2]) || 20;
const worlds = process.argv[3] ? [process.argv[3]] : Object.keys(WORLDS);

for (const world of worlds) {
  for (const n of [3, 15, 40, 120]) {
    let wins = 0;
    let rounds = 0;
    let seconds = 0;
    let endedEarly = 0;
    const perRound = {};
    for (let seed = 1; seed <= seeds; seed++) {
      const g = new Game({ ...DEFAULTS, seed: seed * 7919, world });
      g.on((ev) => {
        if (ev.type !== 'round') return;
        const r = (perRound[ev.round] ||= { players: 0, n: 0 });
        r.players += g.alive().length;
        r.n++;
      });
      g.admin('start');
      for (let i = 0; i < n; i++) g.handleChat({ id: `u${i}`, name: `viewer${i}`, text: '!yeet' });
      g.admin('go');
      const t0 = g.time;
      while (g.phase !== 'end' && g.time - t0 < 900) g.step(STEP);
      seconds += g.time - t0;
      rounds += g.round;
      if (g.result.winner) wins++;
      if (!g.isFinal) endedEarly++;
    }
    const funnel = Object.entries(perRound)
      .map(([r, v]) => `R${r}:${(v.players / v.n).toFixed(1)}×${v.n}`)
      .join(' ');
    console.log(
      `${world.padEnd(9)} ${String(n).padStart(3)} viewers: winner ${String(Math.round((100 * wins) / seeds)).padStart(3)} %, ` +
        `${(rounds / seeds).toFixed(1)} rounds, ${Math.round(seconds / seeds)} s, died before the final ${endedEarly}/${seeds} · ${funnel}`
    );
  }
}
