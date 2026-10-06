// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Sound effects, synthesized live with WebAudio (no files, nothing to license). Built to feel good:
// every hit goes through a compressor and a short room reverb, is panned to where it happens on screen,
// and varies its pitch a little so a hundred landings never sound like one loop. Basket entries in the same
// heat climb a pentatonic scale (a combo), and each new suitor's tick is a step higher than the last.
// URL: sound=0 starts muted, volume=0..1 (default 0.35). Live: !y2w sound on|off, or the M key (toggle).
// OBS plays it on its own; a browser tab needs one click first.
// Your own sounds: put files in sounds/ and list them in sounds/sounds.json ({"bump": "bump.ogg", ...}, names
// in SAMPLE_NAMES); each plays instead of the synthesized one, with the same panning and pitch variation.

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export const SAMPLE_NAMES = ['launch', 'impact', 'bump', 'spring', 'boost', 'warp', 'gel', 'basket', 'tick', 'beep', 'jingle',
  'nobody', 'fanfare', 'wahwah', 'rewind', 'slowDing'];
const note = (semi, base = 523.25) => base * Math.pow(2, semi / 12);

export class Sound {
  constructor(game, cfg) {
    this.game = game;
    this.on = cfg.sound !== false;
    this.ctx = null;
    this.vol = Math.min(1, Math.max(0, cfg.volume ?? 0.35));
    this.camera = () => 0;
    this.lastBeep = -1;
    this.combo = 0;
    this.joins = 0;
    this.impactBudget = 0;
    this.lastUpdate = 0;
    if (typeof window === 'undefined' || !window.AudioContext) return;
    const ctx = (this.ctx = new AudioContext());
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -18;
    this.comp.ratio.value = 4;
    this.master = ctx.createGain();
    this.master.gain.value = this.on ? this.vol : 0;
    this.comp.connect(this.master).connect(ctx.destination);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(1.6, 2.6);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.22;
    this.verb.connect(this.wet).connect(this.comp);
    this.noiseBuf = this.makeNoise();
    this.samples = {};
    this.loadSamples();
    const wake = () => this.on && ctx.state === 'suspended' && ctx.resume();
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    game.on((ev) => this.onEvent(ev));
  }

  // Mute or unmute without a click: a short fade, then the context sleeps (no CPU spent while muted).
  setOn(on) {
    this.on = on;
    if (!this.ctx) return;
    const g = this.master.gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    if (on) {
      this.ctx.resume();
      g.linearRampToValueAtTime(this.vol, now + 0.08);
    } else {
      g.linearRampToValueAtTime(0, now + 0.08);
      setTimeout(() => !this.on && this.ctx.suspend(), 150);
    }
  }

  // Optional sound files, looked up once; missing ones stay synthesized.
  async loadSamples() {
    let list = {};
    try {
      const res = await fetch('sounds/sounds.json');
      if (res.ok) list = await res.json();
    } catch {
      return;
    }
    for (const [name, file] of Object.entries(list)) {
      if (!SAMPLE_NAMES.includes(name) || typeof file !== 'string') continue;
      try {
        const res = await fetch(`sounds/${file}`);
        if (res.ok) this.samples[name] = await this.ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        /* unreadable: stays synthesized */
      }
    }
  }

  // Plays a loaded file for this effect if there is one; returns false so the synth runs otherwise.
  sample(name, { pan = 0, gain = 1, rate = 1 } = {}) {
    const buf = this.samples[name];
    if (!buf || !this.ready()) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    this.out(src.connect(g), { pan, send: 0.2 });
    src.start();
    return true;
  }

  ready() {
    return this.ctx && this.ctx.state === 'running';
  }

  impulse(seconds, decay) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  makeNoise() {
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Where on screen (world x) a sound comes from → stereo position.
  pan(x) {
    if (x == null) return 0;
    return Math.max(-0.8, Math.min(0.8, (x - this.camera() - 240) / 260));
  }

  // One voice: envelope → pan → dry into the compressor + a send into the reverb.
  out(node, { pan = 0, send = 0.25 } = {}) {
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    p.connect(this.comp);
    const s = this.ctx.createGain();
    s.gain.value = send;
    p.connect(s).connect(this.verb);
  }

  osc({ type = 'sine', f0, f1 = f0, dur = 0.15, gain = 0.4, delay = 0, attack = 0.004, vib = 0, vibRate = 0, pan = 0, send = 0.25, lp = 0 }) {
    if (!this.ready()) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (vib) {
      const l = ctx.createOscillator();
      const lg = ctx.createGain();
      l.frequency.value = vibRate;
      lg.gain.value = vib;
      l.connect(lg).connect(o.frequency);
      l.start(t);
      l.stop(t + dur + 0.05);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let last = o.connect(g);
    if (lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lp;
      last = last.connect(f);
    }
    this.out(last, { pan, send });
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise({ dur = 0.15, gain = 0.3, f0 = 2000, f1 = 400, q = 1, type = 'bandpass', delay = 0, pan = 0, send = 0.2 }) {
    if (!this.ready()) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    this.out(src.connect(f).connect(g), { pan, send });
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  bell(freq, { gain = 0.25, dur = 0.7, delay = 0, pan = 0, send = 0.4 } = {}) {
    for (const [k, g] of [[1, 1], [2.01, 0.45], [3.02, 0.22], [4.17, 0.1]]) {
      this.osc({ f0: freq * k, dur: dur / Math.sqrt(k), gain: gain * g, delay, pan, send });
    }
  }

  brass(freq, { dur = 0.3, gain = 0.18, delay = 0 } = {}) {
    this.osc({ type: 'sawtooth', f0: freq, dur, gain, delay, attack: 0.03, lp: 1800, send: 0.3, vib: dur > 0.5 ? 5 : 0, vibRate: 5.5 });
    this.osc({ type: 'square', f0: freq / 2, dur, gain: gain * 0.4, delay, attack: 0.03, lp: 900, send: 0.3 });
  }

  jitter(r = 0.08) {
    return 1 + (Math.random() * 2 - 1) * r;
  }

  // ---------------- the effects ----------------
  launch() {
    if (this.sample('launch', { pan: this.pan(36), rate: this.jitter() })) return;
    const j = this.jitter();
    const pan = this.pan(36);
    this.osc({ f0: 150 * j, f1: 42, dur: 0.14, gain: 0.55, pan, send: 0.1 });
    this.osc({ type: 'sawtooth', f0: 420 * j, f1: 260, dur: 0.07, gain: 0.08, lp: 1400, pan });
    this.noise({ dur: 0.28, gain: 0.16, f0: 500, f1: 3500, q: 0.8, pan, send: 0.15 });
  }

  impact(x, power) {
    if (this.impactBudget < 1) return;
    this.impactBudget--;
    if (this.sample('impact', { pan: this.pan(x), gain: Math.min(1, 0.3 + power * 0.05), rate: this.jitter(0.15) })) return;
    const g = Math.min(0.4, 0.08 + power * 0.02);
    const pan = this.pan(x);
    this.osc({ f0: 130 * this.jitter(0.15), f1: 55, dur: 0.09, gain: g, pan, send: 0.08 });
    this.noise({ dur: 0.05, gain: g * 0.5, f0: 700, f1: 200, type: 'lowpass', pan, send: 0.05 });
  }

  bump(x) {
    if (this.sample('bump', { pan: this.pan(x), rate: this.jitter(0.1) })) return;
    const j = this.jitter(0.1);
    const pan = this.pan(x);
    this.osc({ f0: 280 * j, f1: 920 * j, dur: 0.22, gain: 0.4, vib: 40, vibRate: 28, pan, send: 0.3 });
    this.osc({ type: 'triangle', f0: 560 * j, f1: 1400 * j, dur: 0.12, gain: 0.12, pan });
    this.osc({ f0: 2400 * j, f1: 3200 * j, dur: 0.07, gain: 0.05, delay: 0.04, pan, send: 0.5 });
  }

  spring(x) {
    if (this.sample('spring', { pan: this.pan(x), rate: this.jitter(0.06) })) return;
    const j = this.jitter(0.06);
    this.osc({ type: 'triangle', f0: 170 * j, f1: 640 * j, dur: 0.34, gain: 0.42, vib: 70, vibRate: 22, pan: this.pan(x), send: 0.3 });
  }

  boost(x) {
    if (this.sample('boost', { pan: this.pan(x), rate: this.jitter(0.05) })) return;
    const pan = this.pan(x);
    this.osc({ type: 'square', f0: 500 * this.jitter(0.05), f1: 2100, dur: 0.12, gain: 0.08, lp: 3000, pan });
    this.noise({ dur: 0.16, gain: 0.14, f0: 1200, f1: 5000, q: 1.5, pan });
  }

  warp(x, tx) {
    if (this.sample('warp', { pan: this.pan(x) })) return;
    this.osc({ f0: 180, f1: 1500, dur: 0.32, gain: 0.25, vib: 60, vibRate: 13, pan: this.pan(x), send: 0.5 });
    this.osc({ f0: 1500, f1: 300, dur: 0.3, gain: 0.18, vib: 50, vibRate: 13, delay: 0.18, pan: this.pan(tx), send: 0.5 });
  }

  gel(x) {
    if (this.sample('gel', { pan: this.pan(x), rate: this.jitter() })) return;
    const pan = this.pan(x);
    this.noise({ dur: 0.2, gain: 0.3, f0: 380, f1: 140, q: 4, pan, send: 0.1 });
    this.osc({ f0: 110 * this.jitter(), f1: 70, dur: 0.18, gain: 0.2, vib: 25, vibRate: 30, pan, send: 0.1 });
  }

  basket(x) {
    const semi = PENTA[Math.min(this.combo, PENTA.length - 1)];
    this.combo++;
    if (this.sample('basket', { pan: this.pan(x), rate: Math.pow(2, semi / 12) })) return;
    const pan = this.pan(x);
    this.bell(note(semi + 12, 523.25), { gain: 0.22, dur: 0.8, pan });
    [24, 28, 31].forEach((s, i) => this.osc({ f0: note(semi + s, 523.25), dur: 0.09, gain: 0.05, delay: 0.05 + i * 0.045, pan, send: 0.5 }));
  }

  tick() {
    const semi = PENTA[this.joins % PENTA.length];
    this.joins++;
    if (this.sample('tick', { rate: Math.pow(2, semi / 12) })) return;
    this.osc({ type: 'triangle', f0: note(semi + 12, 392), dur: 0.08, gain: 0.12, send: 0.2 });
  }

  beep(high) {
    if (this.sample('beep', { rate: high ? 1.5 : 1 })) return;
    this.osc({ type: 'square', f0: high ? 988 : 659, dur: high ? 0.22 : 0.08, gain: 0.12, lp: 2500, send: 0.15 });
  }

  jingle() {
    if (this.sample('jingle')) return;
    [0, 4, 7, 12].forEach((s, i) => this.bell(note(s + 12), { gain: 0.14, dur: 0.5, delay: i * 0.08 }));
  }

  nobody() {
    if (this.sample('nobody')) return;
    this.osc({ type: 'triangle', f0: 330, f1: 250, dur: 0.25, gain: 0.25, send: 0.2 });
    this.osc({ type: 'triangle', f0: 247, f1: 160, dur: 0.45, gain: 0.25, delay: 0.22, send: 0.2 });
  }

  fanfare() {
    if (this.sample('fanfare')) return;
    const C = 261.63;
    [[0, 0.0, 0.16], [4, 0.17, 0.16], [7, 0.34, 0.16], [12, 0.51, 0.7]].forEach(([s, d, dur]) => this.brass(C * Math.pow(2, s / 12) * 2, { dur, delay: d }));
    [[0, 4, 7], [5, 9, 12]].forEach((chord, k) => chord.forEach((s) => this.brass(C * Math.pow(2, s / 12), { dur: 0.6, gain: 0.08, delay: 0.51 + k * 0.01 })));
    [0, 0.17, 0.34, 0.51].forEach((d) => this.osc({ f0: 150, f1: 45, dur: 0.15, gain: 0.45, delay: d, send: 0.05 }));
    this.noise({ dur: 0.9, gain: 0.12, f0: 9000, f1: 4000, type: 'highpass', delay: 0.51, send: 0.4 });
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.osc({ f0: note(s + 12), dur: 0.12, gain: 0.05, delay: 1.0 + i * 0.05, send: 0.5 }));
  }

  wahwah() {
    if (this.sample('wahwah')) return;
    [[392, 0.28], [370, 0.28], [349, 0.28], [330, 0.9]].forEach(([f, dur], i) => this.brass(f / 2, { dur, gain: 0.2, delay: i * 0.3 }));
  }

  rewind() {
    if (this.sample('rewind')) return;
    this.osc({ type: 'sawtooth', f0: 1400, f1: 120, dur: 0.4, gain: 0.1, lp: 2400, send: 0.3 });
    this.noise({ dur: 0.4, gain: 0.08, f0: 4000, f1: 300, q: 2 });
  }

  slowDing() {
    if (this.sample('slowDing')) return;
    this.bell(note(0, 261.63), { gain: 0.3, dur: 1.6, send: 0.7 });
  }

  onEvent(ev) {
    if (ev.type === 'sound') this.setOn(ev.on);
    if (!this.on) return;
    switch (ev.type) {
      case 'fx':
        if (ev.kind === 'impact') this.impact(ev.x, ev.power);
        else if (ev.kind === 'bump') this.bump(ev.x);
        else if (ev.kind === 'spring') this.spring(ev.x);
        else if (ev.kind === 'boost') this.boost(ev.x);
        else if (ev.kind === 'warp') this.warp(ev.x, ev.tx);
        else if (ev.kind === 'gel') this.gel(ev.x);
        else if (ev.kind === 'basket') this.basket(ev.x);
        break;
      case 'join': this.tick(); break;
      case 'phase':
        if (ev.phase === 'join') this.joins = 0;
        if (ev.phase === 'launch') this.combo = 0;
        break;
      case 'launch': this.launch(); break;
      case 'heatResult': ev.qualified.length ? this.jingle() : this.nobody(); break;
      case 'end': ev.winner ? this.fanfare() : this.wahwah(); break;
      case 'replay':
        this.replayDinged = false;
        this.rewind();
        break;
      default:
    }
  }

  // Every frame: the impact budget refills (at most ~25 thuds a second), the slow-motion ding, the countdown.
  update() {
    if (!this.ctx || !this.on) return;
    const g = this.game;
    const dt = Math.max(0, g.time - this.lastUpdate);
    this.lastUpdate = g.time;
    this.impactBudget = Math.min(4, this.impactBudget + dt * 25);
    if (g.phase === 'replay' && !this.replayDinged && g.replayTime >= g.replay.enter) {
      this.replayDinged = true;
      this.slowDing();
    }
    if ((g.phase === 'join' || g.phase === 'aim' || g.phase === 'choose') && g.timeLeft <= 5) {
      const s = Math.ceil(g.timeLeft);
      if (s !== this.lastBeep && s > 0) {
        this.lastBeep = s;
        this.beep(s === 1);
      }
    } else this.lastBeep = -1;
  }

  bumper() {}
}
