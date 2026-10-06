// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Fake chat: made-up viewers that sign up and sometimes aim. For testing without a stream and for
// recording trailer takes (same seed = same take).
import { makeRng } from './rng.js';

const HEADS = ['mochi', 'pixel', 'neko', 'tofu', 'bean', 'gremlin', 'toast', 'waffle', 'boba', 'noodle',
  'pudding', 'sprout', 'gecko', 'biscuit', 'cloud', 'pebble', 'yuzu', 'momo', 'kiwi', 'onigiri', 'dango',
  'sushi', 'panda', 'otter', 'comet', 'radish', 'mango', 'taro', 'miso', 'fern'];
const TAILS = ['', '_', 'chan', 'kun', '99', 'uwu', 'main', 'gg', 'xd', '07', 'lord', 'fan', 'bun', 'tv'];

export class DemoChat {
  constructor(game, cfg) {
    this.game = game;
    this.cfg = cfg;
    this.rng = makeRng((cfg.seed ^ 0x9e3779b9) >>> 0);
    this.viewers = [];
    const used = new Set();
    while (this.viewers.length < cfg.demoCount) {
      const name = this.rng.pick(HEADS) + this.rng.pick(TAILS);
      if (used.has(name)) continue;
      used.add(name);
      this.viewers.push({ id: `demo:${name}`, name, aims: this.rng.next() < 0.35 });
    }
    this.next = 0;
    this.wait = 0.5;
    this.aimedRound = 0;
    game.on((ev) => {
      if (ev.type === 'phase' && ev.phase === 'join') {
        this.next = 0;
        this.wait = 0.4;
      }
    });
  }

  say(v, text) {
    this.game.handleChat({ id: v.id, name: v.name, text, isSub: false, isMod: false });
  }

  shot(v) {
    if (!v.aims) return '!yeet';
    return `!yeet ${this.rng.int(32, 62)} ${this.rng.int(62, 96)}`;
  }

  step(dt) {
    const g = this.game;
    if (g.phase === 'join' && this.next < this.viewers.length) {
      // Everyone signs up within the first ~70 % of the window, in bursts like a real chat.
      this.wait -= dt;
      if (this.wait <= 0) {
        const v = this.viewers[this.next++];
        this.say(v, this.shot(v));
        const span = (this.cfg.joinSeconds * 0.7) / this.viewers.length;
        this.wait = this.rng.range(0.2, 1.8) * span;
      }
    }
    if (g.phase === 'aim' && this.aimedRound !== g.round && g.phaseT > 2) {
      this.aimedRound = g.round;
      for (const v of this.viewers) {
        const p = g.players.get(v.id);
        if (p && p.status === 'alive' && v.aims) this.say(v, this.shot(v));
      }
    }
  }
}
