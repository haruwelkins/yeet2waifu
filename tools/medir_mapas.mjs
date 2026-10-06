// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// How many make it into the basket on each map: random !yeet (the default) vs. a viewer who aims.
//   node tools/medir_mapas.mjs [trials] [mapId]
// solo    = one chibi alone in the arena, random shot, random wind
// heats N = a real round: 4 heats of N in a row, losers freezing into terrain between heats
// aimed   = the best fixed aim found without wind, then fired with the round's random wind
// Targets: first round ~15 % in heats of 30, second
// round ~25-30 % in small heats, the final ~35 % per shot so a final of 3-5 usually crowns someone.
// Aiming must clearly beat random, or it is Marbles.
import { makeRng } from '../src/rng.js';
import { Arena, resolveAim } from '../src/physics.js';
import { MAPS } from '../src/maps.js';

const STEP = 1 / 60;
const trials = Number(process.argv[2]) || 200;
const only = process.argv[3];

function runHeat(arena, rng, heat, n, aim = null) {
  let launched = 0;
  for (let t = 0; t < 30; t += STEP) {
    if (launched < n && t >= launched * 0.15) {
      const a = resolveAim(rng, arena.map, aim);
      arena.spawn(`p${heat}:${launched}`, heat, a.angle, a.power);
      launched++;
    }
    arena.step(STEP);
    if (launched === n && t > n * 0.15 + 0.5 && arena.heatSettled(heat, 0.6)) break;
    if (launched === n && t > n * 0.15 + 10) break;
  }
  let inside = 0;
  for (const c of arena.heatChibis(heat)) {
    if (c.state === 'flying' && arena.insideBasket(c)) {
      c.state = 'in';
      inside++;
    }
  }
  arena.closeHeat(heat);
  return inside;
}

const freshArena = (map, rng, wind = true) => {
  const a = new Arena(map, rng);
  a.wind = wind ? Math.round(rng.range(map.wind[0], map.wind[1]) * 2) / 2 : 0;
  return a;
};
const pct = (a, b) => `${((100 * a) / b).toFixed(0).padStart(2)} %`;

for (const map of MAPS.filter((m) => !only || m.id === only)) {
  const rng = makeRng(99);
  let solo = 0;
  for (let i = 0; i < trials; i++) solo += runHeat(freshArena(map, rng), rng, 0, 1);

  const heats = {};
  for (const n of [30, 10]) {
    const rounds = Math.max(3, Math.round(trials / 40));
    let inside = 0;
    for (let r = 0; r < rounds; r++) {
      const arena = freshArena(map, rng);
      for (let h = 0; h < 4; h++) inside += runHeat(arena, rng, h, n);
    }
    heats[n] = { inside, total: rounds * 4 * n };
  }

  // The best aim a viewer could learn (no wind), then fired under the real random wind.
  let best = null;
  for (let angle = 25; angle <= 75; angle += 5) {
    for (let power = 30; power <= 100; power += 2) {
      let hits = 0;
      for (let k = 0; k < 3; k++) hits += runHeat(freshArena(map, rng, false), rng, 0, 1, { angle, power });
      if (!best || hits > best.hits) best = { angle, power, hits };
    }
  }
  let aimed = 0;
  for (let i = 0; i < trials; i++) aimed += runHeat(freshArena(map, rng), rng, 0, 1, best);

  console.log(
    `${map.id.padEnd(8)} random solo ${pct(solo, trials)} · heats of 30 ${pct(heats[30].inside, heats[30].total)}` +
      ` · heats of 10 ${pct(heats[10].inside, heats[10].total)} | aimed ${best.angle}° ${best.power}%: ${pct(aimed, trials)}`
  );
}
