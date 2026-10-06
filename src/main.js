// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
import { readConfig } from './config.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { TwitchChat } from './chat.js';
import { DemoChat } from './demo.js';
import { makeI18n } from './i18n.js';
import { Sound } from './sound.js';
import { VFX } from './vfx.js';
import { Post } from './post.js';
import { VERSION } from './version.js';

const STEP = 1 / 60;
const cfg = readConfig(location.search);
const game = new Game(cfg);
// The renderer draws into a 2D canvas; with the post-process on, that canvas stays offscreen and the visible
// one is WebGL. Without WebGL (or with fx=0) the renderer draws straight to the screen.
const screen = document.getElementById('screen');
const post = cfg.fx ? Post.create(screen) : null;
const frame2d = post ? document.createElement('canvas') : screen;
const renderer = new Renderer(frame2d, game, makeI18n(cfg.lang));
renderer.sizeFrom = screen;
const vfx = new VFX(game);
renderer.vfx = vfx;
renderer.post = post;
const present = () => {
  renderer.draw();
  if (post) post.render(frame2d, { ...vfx.look(), punch: vfx.punch, flash: vfx.flash, crt: cfg.crt }, renderer.emit);
};
const demo = cfg.demo ? new DemoChat(game, cfg) : null;
const sound = new Sound(game, cfg);
sound.camera = () => renderer.camX;

if (cfg.channel) {
  renderer.channel = cfg.channel;
  renderer.chatStatus = 'connecting';
  new TwitchChat(cfg.channel, (m) => game.handleChat(m), (s) => (renderer.chatStatus = s)).connect();
} else if (demo) {
  renderer.chatStatus = 'demo';
}

// Keys for the streamer (OBS: right click the source → Interact): S start · G go/skip · X stop · M sound ·
// 1-9 pick the winner while she is choosing
window.addEventListener('keydown', (e) => {
  if (/^[1-9]$/.test(e.key)) return game.admin('pick', e.key);
  const action = { s: 'start', g: 'go', x: 'stop', m: 'sound' }[e.key.toLowerCase()];
  if (action) game.admin(action);
});

// A read-only snapshot of the match, for overlays and stream tools: window.yeet2waifu.state()
const names = (list) => (list || []).filter(Boolean).map((p) => p.name);
window.yeet2waifu = Object.freeze({
  version: VERSION,
  state() {
    const g = game;
    const lang = cfg.lang === 'es' ? 'es' : 'en';
    return {
      phase: g.phase,
      secondsLeft: Math.max(0, Math.ceil(g.phaseDur - g.phaseT)),
      round: g.round,
      isFinal: g.isFinal,
      heat: g.heatIndex + 1,
      heats: g.heats.length,
      world: g.world ? g.world.name[lang] : '',
      map: g.map ? g.map.name[lang] : '',
      suitors: g.players.size,
      alive: g.round > 0 ? g.alive().length : g.players.size,
      lastHeat: g.lastHeatNames.slice(),
      qualified: g.roundQualified.map((id) => g.players.get(id)).filter(Boolean).map((p) => p.name),
      choosing: g.phase === 'choose' && g.choice ? names(g.choice.finalists) : [],
      winner: g.result && g.result.winner ? g.result.winner.name : null,
      finalists: g.result ? names(g.result.finalists) : [],
      waifu: renderer.waifuName,
    };
  },
});

function tick(n) {
  for (let i = 0; i < n; i++) {
    if (demo) demo.step(STEP);
    game.step(STEP);
  }
}

if (cfg.manual) {
  // Frame-exact driving for recordings and screenshots: y2w.step(60) = one second of game.
  window.y2w = { game, cfg, renderer, sound, vfx, post, step: (n = 1) => { tick(n); present(); sound.update(); }, draw: present };
  present();
} else {
  let last = performance.now();
  let acc = 0;
  const frame = (now) => {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    let n = 0;
    while (acc >= STEP && n < 5) {
      tick(1);
      acc -= STEP;
      n++;
    }
    if (n === 5) acc = 0;
    present();
    sound.update();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
