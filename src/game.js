// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The match: sign-ups → rounds (one map each, split into heats) → the final at her balcony.
// Pure logic + physics, no DOM: the browser and the node tests drive the very same step().
import { makeRng } from './rng.js';
import { Arena, resolveAim, VIEW_W } from './physics.js';
import { WORLDS } from './maps.js';
import { parseCommand } from './chat.js';
import { WAIFUS } from './art/waifus.js';

export const LAUNCH_GAP = 0.15;   // s between two chibis of the same heat: a machine-gun of suitors

// The pace the streamer picks (?pace= or !y2w pace). Every wait that is not physics lives here.
// The aim window and sign-ups close themselves once chat goes quiet (up to a maximum): a fixed window
// spends most of its time waiting on nobody (tools/medir_esperas.mjs measures the waits).
//   aimMin/aimQuiet/aimMax: the aim window lasts at least aimMin, ends after aimQuiet s without a new
//     aim, never passes aimMax · joinQuiet: sign-ups close after this many s without a new suitor (once
//     half the window has gone) · hold: s everything must be still to count a heat · quiet: s without
//     anything moving that could still matter, also enough to count · settleScale: × each course's longest wait
export const PACES = {
  fast: { roundIntro: 2, longIntro: 1.5, aimMin: 5, aimQuiet: 2.5, aimMax: 8, heatIntro: 0.6, heatResult: 1.4,
    roundResult: 2.2, end: 7, hold: 0.4, quiet: 1.0, settleScale: 0.75, joinQuiet: 6 },
  normal: { roundIntro: 2.5, longIntro: 2, aimMin: 7, aimQuiet: 3, aimMax: 12, heatIntro: 1.0, heatResult: 2.0,
    roundResult: 3.0, end: 9, hold: 0.5, quiet: 1.5, settleScale: 1, joinQuiet: 9 },
  chill: { roundIntro: 4, longIntro: 2.5, aimMin: 10, aimQuiet: 4, aimMax: 20, heatIntro: 1.8, heatResult: 3.2,
    roundResult: 4.5, end: 12, hold: 0.7, quiet: 2.5, settleScale: 1.3, joinQuiet: 15 },
};
const IDLE = 3;
const REPLAY = { before: 1.8, after: 0.7, speed: 0.4 };   // the winning shot, slowed down

export const BOT_NAMES = [
  'Sir Flops', 'Lord Nobody', 'Count Fumble', 'Baron Bonk', 'Mr. Maybe', 'Duke Splat', 'Prince Oops',
  'Captain Thud', 'Earl Wobble', 'Sir Yeets-a-Lot', 'Lady Kerplunk', 'The Intern', 'Uncle Gerald',
  'A Pigeon', 'Marquis Meh', 'Viscount Vroom',
];

// Splits n players into the fewest heats of at most `size`, as even as possible (31 → 16 + 15).
export function splitHeats(ids, size) {
  if (!ids.length) return [];
  const k = Math.ceil(ids.length / size);
  const heats = [];
  let i = 0;
  for (let h = 0; h < k; h++) {
    const n = Math.floor(ids.length / k) + (h < ids.length % k ? 1 : 0);
    heats.push(ids.slice(i, i + n));
    i += n;
  }
  return heats;
}

export class Game {
  constructor(cfg) {
    this.cfg = cfg;
    this.rng = makeRng(cfg.seed);
    this.listeners = [];
    this.time = 0;
    this.autoStart = cfg.auto || cfg.demo;
    this.reset();
    this.setPhase('idle', IDLE);
  }

  get pace() {
    return PACES[this.cfg.pace] || PACES.normal;
  }

  reset() {
    this.players = new Map();
    this.round = 0;
    this.arena = null;
    this.map = null;
    this.isFinal = false;
    this.heats = [];
    this.heatIndex = -1;
    this.launchQueue = [];
    this.launchClock = 0;
    this.roundQualified = [];
    this.heatQualified = [];
    this.result = null;
    this.replay = null;
    this.choice = null;
    this.lastHeatNames = [];
    this.botsUsed = 0;
    this.lastJoinAt = -Infinity;
    this.lastAimAt = -Infinity;
    this.lastLively = 0;
  }

  on(fn) {
    this.listeners.push(fn);
  }

  emit(type, data = {}) {
    const ev = { type, time: this.time, ...data };
    for (const fn of this.listeners) fn(ev);
  }

  setPhase(phase, duration = Infinity) {
    this.phase = phase;
    this.phaseT = 0;
    this.phaseStart = this.time;
    this.phaseDur = duration;
    this.emit('phase', { phase, round: this.round, heat: this.heatIndex });
  }

  get timeLeft() {
    return Math.max(0, this.phaseDur - this.phaseT);
  }

  alive() {
    return [...this.players.values()].filter((p) => p.status === 'alive');
  }

  humans() {
    return [...this.players.values()].filter((p) => !p.bot);
  }

  // ---- chat ----

  handleChat(m) {
    const c = parseCommand(m.text);
    if (!c) return;
    if (c.cmd === 'admin') {
      if (m.isMod || m.isBroadcaster) this.admin(c.action, c.arg);
      return;
    }
    if (c.cmd === 'yeet') this.yeet(m, c.aim);
  }

  yeet(m, aim) {
    let p = this.players.get(m.id);
    if (this.phase === 'join') {
      if (!p) {
        if (this.humans().length >= this.cfg.maxPlayers) return;
        p = { id: m.id, name: m.name, bot: false, sub: !!m.isSub, status: 'alive', aim: null };
        this.players.set(m.id, p);
        this.lastJoinAt = this.time;
        this.emit('join', { player: p });
      }
      p.aim = aim;
      return;
    }
    // After sign-ups, only those still in the running can re-aim (for a heat that has not flown yet).
    if (p && p.status === 'alive' && this.round > 0 && this.phase !== 'end') {
      p.aim = aim;
      this.lastAimAt = this.time;
      this.emit('aim', { player: p });
    }
  }

  admin(action, arg = '') {
    const a = arg.toLowerCase();
    if (action === 'start' && (this.phase === 'idle' || this.phase === 'end')) this.beginJoin();
    else if (action === 'go') this.phaseT = this.phaseDur;
    else if (action === 'stop') {
      this.reset();
      this.setPhase('idle', IDLE);
    } else if (action === 'bots') this.cfg.bots = a !== 'off';
    else if (action === 'pace' && PACES[a]) {
      this.cfg.pace = a;
      this.emit('pace', { pace: a });
    } else if (action === 'idle') {
      this.cfg.idle = a !== 'off';
      this.emit('idle', { idle: this.cfg.idle });
    } else if (action === 'replay') this.cfg.replay = a !== 'off';
    else if (action === 'pick' && this.phase === 'choose' && this.choice && !this.choice.picked) {
      const list = this.choice.finalists;
      const n = Number(a);
      const byNumber = Number.isInteger(n) && n >= 1 && n <= list.length ? list[n - 1] : null;
      const byName = list.find((p) => p.name.toLowerCase() === a.replace(/^@/, ''));
      const chosen = byNumber || byName;
      if (chosen) {
        this.choice.picked = chosen;
        this.emit('picked', { player: chosen });
      }
    } else if (action === 'sound') {
      this.cfg.sound = a === 'on' ? true : a === 'off' ? false : !this.cfg.sound;
      this.emit('sound', { on: this.cfg.sound });
    }
    else if (action === 'waifu' && arg) {
      this.cfg.waifu = WAIFUS[a] ? a : arg;
      this.emit('waifu', { waifu: this.cfg.waifu });
    }
  }

  // ---- flow ----

  // The first map (and its wind) is on screen during sign-ups, so people can aim before it flies.
  beginJoin() {
    this.reset();
    const worlds = Object.keys(WORLDS);
    this.worldId = WORLDS[this.cfg.world] ? this.cfg.world : this.rng.pick(worlds);
    this.world = WORLDS[this.worldId];
    this.map = this.world.rounds[0];
    this.arena = this.newArena(this.map);
    this.setPhase('join', this.cfg.joinSeconds);
  }

  newArena(map, round = 1) {
    const arena = new Arena(map, this.rng, { round });
    arena.wind = Math.round(this.rng.range(map.wind[0], map.wind[1]) * 2) / 2;
    return arena;
  }

  closeJoin() {
    if (this.cfg.bots && this.players.size < this.cfg.minPlayers) {
      const names = this.rng.shuffle([...BOT_NAMES]);
      while (this.players.size < this.cfg.minPlayers && this.botsUsed < names.length) {
        const name = names[this.botsUsed++];
        const id = `bot:${name}`;
        this.players.set(id, { id, name, bot: true, sub: false, status: 'alive', aim: null });
      }
    }
    if (!this.players.size) {
      this.setPhase('idle', IDLE);
      return;
    }
    this.startRound(1);
  }

  startRound(r) {
    this.round = r;
    const alive = this.alive();
    if (r > 1) for (const p of alive) p.aim = null;    // a new map makes the old aim meaningless
    // There is always one qualifying round before her balcony, even for a tiny chat.
    this.isFinal = (r >= 2 && alive.length <= this.cfg.finalSize) || r >= this.cfg.maxRounds;
    const map = this.isFinal ? this.world.final : this.world.rounds[(r - 1) % this.world.rounds.length];
    if (!(r === 1 && this.arena && this.map === map)) this.arena = this.newArena(map, r);
    this.map = map;
    this.arena.recording = this.isFinal && this.cfg.replay !== false ? [] : null;
    const size = r === 1 ? this.cfg.heatSize : this.cfg.heatSizeLate;
    this.heats = splitHeats(this.rng.shuffle(alive.map((p) => p.id)), size);
    this.heatIndex = 0;
    this.roundQualified = [];
    this.emit('round', { round: r, map: this.map.id, final: this.isFinal, wind: this.arena.wind, heats: this.heats.length });
    // a longer course gets a longer intro: the camera flies over it from the basket back to the catapult
    const p = this.pace;
    this.setPhase('roundIntro', this.map.width > VIEW_W ? p.roundIntro + p.longIntro : p.roundIntro);
  }

  startHeat() {
    this.launchQueue = this.rng.shuffle([...this.heats[this.heatIndex]]);
    this.launchClock = LAUNCH_GAP;
    this.heatQualified = [];
    this.setPhase('launch');
  }

  launchNext() {
    const id = this.launchQueue.shift();
    const p = this.players.get(id);
    const aim = resolveAim(this.rng, this.map, p.aim);
    p.lastShot = aim;
    this.arena.spawn(id, this.heatIndex, aim.angle, aim.power);
    this.emit('launch', { player: p, aim });
  }

  countHeat() {
    for (const c of this.arena.heatChibis(this.heatIndex)) {
      if (c.state === 'flying' && this.arena.insideBasket(c)) {
        c.state = 'in';
        this.heatQualified.push(c.playerId);
      }
    }
    this.roundQualified.push(...this.heatQualified);
    this.lastHeatNames = this.heatQualified.map((id) => this.players.get(id).name);
    this.emit('heatResult', {
      heat: this.heatIndex,
      qualified: this.heatQualified.map((id) => this.players.get(id)),
    });
    this.setPhase('heatResult', this.pace.heatResult);
  }

  endRound() {
    const q = new Set(this.roundQualified);
    for (const p of this.alive()) if (!q.has(p.id)) p.status = 'out';
    const qualified = this.roundQualified.map((id) => this.players.get(id));
    if (!qualified.length) return this.finish(null, []);
    if (this.isFinal) {
      // Several made it to her balcony: she picks one (the streamer can pick for her, with pick on).
      if (qualified.length > 1 && this.cfg.pick) {
        this.choice = { finalists: qualified, picked: null };
        this.emit('choose', { finalists: qualified });
        return this.setPhase('choose', Math.max(3, this.cfg.pickSeconds || 15));
      }
      return this.crown(qualified.length === 1 ? qualified[0] : this.rng.pick(qualified), qualified);
    }
    this.emit('roundResult', { round: this.round, qualified });
    this.setPhase('roundResult', this.pace.roundResult);
  }

  // The winner's shot plays again, slowly, then the ending.
  crown(winner, finalists) {
    if (this.startReplay(winner, finalists)) return;
    this.finish(winner, finalists);
  }

  // The winning shot again at 0.4×: from a little before the moment it dropped into the basket to just
  // after. Needs the final's recording (Arena keeps one frame per step).
  startReplay(winner, finalists) {
    const rec = this.arena.recording;
    if (!rec || rec.length < 10) return false;
    const enter = rec.find((f) => f.chibis.some(([id, x, y]) => id === winner.id && this.arena.insideBasketAt(x, y)));
    if (!enter) return false;
    const from = Math.max(rec[0].t, enter.t - REPLAY.before);
    const to = Math.min(rec[rec.length - 1].t, enter.t + REPLAY.after);
    this.replay = { winner, finalists, from, to, enter: enter.t, speed: REPLAY.speed };
    this.emit('replay', { winner });
    this.setPhase('replay', (to - from) / REPLAY.speed);
    return true;
  }

  // Where the replay is right now, in recorded time.
  get replayTime() {
    return this.replay ? this.replay.from + Math.min(this.phaseT, this.phaseDur) * this.replay.speed : 0;
  }

  finish(winner, finalists) {
    if (winner) winner.status = 'winner';
    this.result = { winner, finalists, round: this.round };
    this.emit('end', this.result);
    this.setPhase('end', this.pace.end);
  }

  step(dt) {
    this.time += dt;
    this.phaseT += dt;
    if (this.arena && ['launch', 'settle', 'heatResult', 'end'].includes(this.phase)) {
      for (const c of this.arena.step(dt)) this.emit('gone', { player: this.players.get(c.playerId) });
      for (const f of this.arena.fx.splice(0)) this.emit('fx', f);
    }
    const p = this.pace;
    const done = this.phaseT >= this.phaseDur;
    switch (this.phase) {
      case 'idle':
        if (done && this.autoStart) this.beginJoin();
        break;
      case 'join': {
        // closes itself once suitors stop coming (after half the window), or at the end of it
        const half = Math.max(15, this.cfg.joinSeconds / 2);
        const quiet = this.humans().length > 0 && this.phaseT >= half && this.time - this.lastJoinAt >= p.joinQuiet;
        if (done || quiet) this.closeJoin();
        break;
      }
      case 'roundIntro':
        if (done) {
          if (this.round > 1) this.setPhase('aim', p.aimMax);
          else this.setPhase('heatIntro', p.heatIntro);
        }
        break;
      case 'aim': {
        // ends once chat stops re-aiming (but not before aimMin: the stream reaches viewers seconds late)
        const lastNews = Math.max(this.phaseStart, this.lastAimAt);
        if (done || (this.phaseT >= p.aimMin && this.time - lastNews >= p.aimQuiet)) this.setPhase('heatIntro', p.heatIntro);
        break;
      }
      case 'heatIntro':
        if (done) this.startHeat();
        break;
      case 'launch':
        this.launchClock += dt;
        while (this.launchQueue.length && this.launchClock >= LAUNCH_GAP) {
          this.launchClock -= LAUNCH_GAP;
          this.launchNext();
        }
        if (!this.launchQueue.length) this.setPhase('settle', (this.map.settleSeconds ?? this.cfg.settleSeconds) * p.settleScale);
        break;
      case 'settle': {
        if (this.arena.heatLively(this.heatIndex)) this.lastLively = this.time;
        const quiet = this.phaseT >= 1 && this.time - Math.max(this.lastLively, this.phaseStart) >= p.quiet;
        if (done || quiet || this.arena.heatSettled(this.heatIndex, p.hold)) this.countHeat();
        break;
      }
      case 'heatResult':
        if (done) {
          // In the final the winners stay in her basket for the ending.
          if (!this.isFinal) this.arena.closeHeat(this.heatIndex);
          if (this.heatIndex + 1 < this.heats.length) {
            this.heatIndex++;
            this.setPhase('heatIntro', p.heatIntro);
          } else {
            this.endRound();
          }
        }
        break;
      case 'choose':
        if (this.choice.picked || done) {
          const { finalists, picked } = this.choice;
          this.crown(picked || this.rng.pick(finalists), finalists);
        }
        break;
      case 'replay':
        if (done) this.finish(this.replay.winner, this.replay.finalists);
        break;
      case 'roundResult':
        if (done) this.startRound(this.round + 1);
        break;
      case 'end':
        if (done) {
          if (this.autoStart) this.beginJoin();
          else this.setPhase('idle', IDLE);
        }
        break;
    }
  }
}
