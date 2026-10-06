// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The streamer's link: the setup page (index.html) turns choices into the OBS URL of the game (play.html).
// Only what differs from DEFAULTS goes in, so the usual link stays short: play.html?channel=name
import { DEFAULTS } from './config.js';

// What the setup page lets you change, in the order it appears in the link.
export const LINK_KEYS = ['channel', 'lang', 'waifu', 'world', 'pace', 'sound', 'volume', 'fx', 'crt', 'idle', 'replay',
  'joinSeconds', 'maxPlayers', 'bots', 'auto', 'pick'];

// "https://www.twitch.tv/SomeOne", "@SomeOne", "#someone " → "someone"
export function normalizeChannel(raw) {
  let s = String(raw ?? '').trim().replace(/^https?:\/\//i, '').replace(/^(www\.|m\.)?twitch\.tv\//i, '');
  s = s.replace(/^[@#]+/, '');
  return s.split(/[/?#\s]/)[0].toLowerCase();
}

// Twitch logins: letters, digits and underscore (4 to 25; a few old ones are shorter).
export const validChannel = (c) => /^[a-z0-9_]{3,25}$/.test(c);

export function gameQuery(settings) {
  const q = new URLSearchParams();
  for (const key of LINK_KEYS) {
    const v = settings[key];
    const def = DEFAULTS[key];
    if (v === undefined || v === null || v === '' || v === def) continue;
    q.set(key, typeof def === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  return q.toString();
}

export function gameUrl(base, settings) {
  const url = new URL('play.html', base);
  url.search = gameQuery(settings);
  return url.toString();
}
