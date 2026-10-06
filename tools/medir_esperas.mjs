// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Where the time of a match goes: seconds per phase (mean per occurrence and share of the match), and for
// the "settle" wait after each heat, how long it took, how often it ran into the timeout, and how much of
// it was dead air (the last seconds where nothing that could still matter was moving).
//   node tools/medir_esperas.mjs [matches] [viewers] [pace]
import { DEFAULTS } from '../src/config.js';
import { Game } from '../src/game.js';
import { WORLDS } from '../src/maps.js';

const STEP = 1 / 60;
const matches = Number(process.argv[2]) || 25;
const viewers = Number(process.argv[3]) || 30;
const pace = process.argv[4] || DEFAULTS.pace;

const total = {};
const count = {};
let settleTimeouts = 0;
let settles = 0;
let deadAir = 0;
let matchTime = 0;
const worlds = Object.keys(WORLDS);

for (let i = 0; i < matches; i++) {
  const g = new Game({ ...DEFAULTS, seed: 1000 + i * 31, world: worlds[i % worlds.length], pace, joinSeconds: 30 });
  let phase = g.phase;
  let since = 0;
  let lastLively = 0;
  g.on((ev) => {
    if (ev.type !== 'phase') return;
    total[phase] = (total[phase] || 0) + (g.time - since);
    count[phase] = (count[phase] || 0) + 1;
    if (phase === 'settle') {
      settles++;
      if (g.time - since >= (g.map.settleSeconds ?? g.cfg.settleSeconds) - 0.02) settleTimeouts++;
      deadAir += Math.max(0, g.time - Math.max(lastLively, since));
    }
    phase = ev.phase;
    since = g.time;
  });
  g.admin('start');
  for (let v = 0; v < viewers; v++) g.handleChat({ id: `u${v}`, name: `viewer${v}`, text: '!yeet' });
  const t0 = g.time;
  while (g.phase !== 'end' && g.time - t0 < 900) {
    g.step(STEP);
    if (g.phase === 'settle' && g.arena) {
      // "lively": something of this heat still moving fast enough to change the result
      const lively = g.arena.heatChibis(g.heatIndex).some((c) => {
        if (c.state !== 'flying') return false;
        const v = c.body.getLinearVelocity();
        return Math.hypot(v.x, v.y) > 2;
      });
      if (lively) lastLively = g.time;
    }
  }
  matchTime += g.time - t0;
}

console.log(`${matches} matches, ${viewers} viewers, pace ${pace}: ${Math.round(matchTime / matches)} s a match (join 30 s included)`);
for (const [p, s] of Object.entries(total).sort((a, b) => b[1] - a[1])) {
  if (p === 'idle') continue;
  console.log(`  ${p.padEnd(12)} ${(s / count[p]).toFixed(1).padStart(5)} s each × ${(count[p] / matches).toFixed(1)} per match = ${Math.round((100 * s) / matchTime)} % of the match`);
}
console.log(`  settle: ${Math.round((100 * settleTimeouts) / settles)} % hit the timeout · dead air ${(deadAir / settles).toFixed(1)} s per heat`);
