// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Every knob can be set from the OBS URL: ?channel=yourname&joinSeconds=60&lang=es
export const DEFAULTS = {
  channel: '',        // Twitch channel to read (anonymous, no login)
  lang: 'en',         // en | es
  sound: true,        // effects (sound=0 starts muted; !y2w sound or the M key toggle it live)
  idle: true,         // the waifu breathes (a soft squash and stretch); idle=0 keeps her still
  pick: false,        // several reach her: the streamer picks the winner (keys 1-9 or !y2w pick N); random if nobody does
  pickSeconds: 15,    // how long the pick waits
  replay: true,       // the winning shot again in slow motion before the fanfare
  fx: true,           // the glow / vignette / color post-process (WebGL); fx=0 for a plain picture
  crt: false,         // CRT scanlines on top (crt=1)
  volume: 0.35,       // 0..1
  waifu: 'hana',      // who waits at the end: hana, rosa, momo, aoi, kuro (src/art/waifus.js) or a waifu code
  world: '',          // which world to play (src/maps.js WORLDS); empty = a random one each match
  joinSeconds: 45,    // sign-up window after !y2w start
  pace: 'normal',     // fast | normal | chill: how long the game waits between things (src/game.js PACES)
  maxPlayers: 120,    // sign-up cap (humans)
  heatSize: 30,       // most chibis on screen at once
  heatSizeLate: 15,   // rounds 2+: smaller heats: each shot reads better and the crowd chokes the basket less
                      //   (towers: 7 % in heats of 30, 18 % in heats of 10)
  minPlayers: 8,      // house bots fill the field up to this
  bots: true,
  finalSize: 8,       // this many left (or fewer) = the final at her balcony (5 starved mid chats: 60 % won)
  maxRounds: 5,       // safety: the round after this many is the final no matter what
  settleSeconds: 10,  // longest wait for a heat to stop moving
  auto: false,        // start matches by itself (no streamer command)
  demo: false,        // fake chat (testing, trailer takes)
  demoCount: 40,      // fake viewers in demo mode
  manual: false,      // no real-time loop: window.y2w.step(n) drives it (recording, tests)
  seed: 0,            // 0 = random
};

export function readConfig(search = '') {
  const params = new URLSearchParams(search);
  const cfg = { ...DEFAULTS };
  for (const [key, def] of Object.entries(DEFAULTS)) {
    if (!params.has(key)) continue;
    const raw = params.get(key);
    if (typeof def === 'number') {
      const n = Number(raw);
      if (Number.isFinite(n)) cfg[key] = n;
    } else if (typeof def === 'boolean') {
      cfg[key] = ['', '1', 'true', 'on', 'yes'].includes(raw.toLowerCase());
    } else {
      cfg[key] = raw;
    }
  }
  cfg.channel = cfg.channel.replace(/^#/, '').trim().toLowerCase();
  if (!['en', 'es'].includes(cfg.lang)) cfg.lang = 'en';
  if (!cfg.seed) cfg.seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  return cfg;
}
