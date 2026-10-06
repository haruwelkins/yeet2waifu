// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Twitch chat, read-only and anonymous (justinfan): no login, no token, nothing to leak.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function parseIrc(line) {
  const msg = { tags: {}, prefix: '', command: '', params: [], trailing: '' };
  let rest = line;
  if (rest.startsWith('@')) {
    const sp = rest.indexOf(' ');
    for (const kv of rest.slice(1, sp).split(';')) {
      const eq = kv.indexOf('=');
      msg.tags[eq < 0 ? kv : kv.slice(0, eq)] = eq < 0 ? '' : kv.slice(eq + 1);
    }
    rest = rest.slice(sp + 1);
  }
  if (rest.startsWith(':')) {
    const sp = rest.indexOf(' ');
    msg.prefix = rest.slice(1, sp);
    rest = rest.slice(sp + 1);
  }
  const ti = rest.indexOf(' :');
  if (ti >= 0) {
    msg.trailing = rest.slice(ti + 2);
    rest = rest.slice(0, ti);
  }
  const parts = rest.split(' ').filter(Boolean);
  msg.command = parts.shift() || '';
  msg.params = parts;
  return msg;
}

export function chatMessageFromIrc(msg) {
  if (msg.command !== 'PRIVMSG') return null;
  const login = msg.prefix.split('!')[0];
  const badges = msg.tags.badges || '';
  const isBroadcaster = /(^|,)broadcaster\//.test(badges);
  return {
    id: msg.tags['user-id'] || login,
    login,
    name: msg.tags['display-name'] || login,
    text: msg.trailing,
    isBroadcaster,
    isMod: isBroadcaster || msg.tags.mod === '1',
    isSub: msg.tags.subscriber === '1' || /(^|,)(subscriber|founder)\//.test(badges),
  };
}

// !yeet            → random aim (the default: nobody has to learn anything)
// !yeet 45         → angle 45°, random power
// !yeet 45 70      → angle 45°, power 70%
// !y2w start|go|stop · bots on|off · waifu <id or code> · pace fast|normal|chill · idle on|off ·
//      replay on|off · sound on|off (no word = toggle) · pick <number or name>   → streamer and mods
export function parseCommand(text) {
  const words = String(text).trim().split(/\s+/);
  const head = (words[0] || '').toLowerCase();
  if (head === '!yeet') {
    const angle = Number(words[1]);
    if (words.length < 2 || words[1] === '' || !Number.isFinite(angle)) return { cmd: 'yeet', aim: null };
    const power = Number(words[2]);
    return {
      cmd: 'yeet',
      aim: {
        angle: clamp(angle, 5, 85),
        power: words.length > 2 && Number.isFinite(power) ? clamp(power, 0, 100) : null,
      },
    };
  }
  if (head === '!y2w' || head === '!yeet2waifu') {
    const action = (words[1] || '').toLowerCase();
    if (['start', 'go', 'stop', 'bots', 'waifu', 'pace', 'idle', 'replay', 'sound', 'pick'].includes(action)) {
      return { cmd: 'admin', action, arg: words[2] || '' };
    }
  }
  return null;
}

export class TwitchChat {
  constructor(channel, onMessage, onStatus = () => {}) {
    this.channel = channel;
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.retry = 0;
    this.closed = false;
  }

  connect() {
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    this.ws = ws;
    ws.onopen = () => {
      ws.send('CAP REQ :twitch.tv/tags');
      ws.send('PASS SCHMOOPIIE');
      ws.send(`NICK justinfan${10000 + Math.floor(Math.random() * 80000)}`);
      ws.send(`JOIN #${this.channel}`);
      this.retry = 0;
      this.onStatus('connected');
    };
    ws.onmessage = (ev) => {
      for (const line of String(ev.data).split('\r\n')) {
        if (!line) continue;
        if (line.startsWith('PING')) {
          ws.send('PONG :tmi.twitch.tv');
          continue;
        }
        const m = chatMessageFromIrc(parseIrc(line));
        if (m) this.onMessage(m);
      }
    };
    ws.onclose = () => {
      this.onStatus('disconnected');
      if (!this.closed) setTimeout(() => this.connect(), Math.min(30000, 1000 * 2 ** this.retry++));
    };
  }

  close() {
    this.closed = true;
    if (this.ws) this.ws.close();
  }
}
