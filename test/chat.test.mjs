// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIrc, chatMessageFromIrc, parseCommand } from '../src/chat.js';

const LINE =
  '@badge-info=;badges=moderator/1,subscriber/12;display-name=MochiMochi;mod=1;subscriber=1;user-id=4242 ' +
  ':mochimochi!mochimochi@mochimochi.tmi.twitch.tv PRIVMSG #somestreamer :!yeet 45 70';

test('a tagged PRIVMSG becomes a chat message with identity and badges', () => {
  const m = chatMessageFromIrc(parseIrc(LINE));
  assert.equal(m.id, '4242');
  assert.equal(m.login, 'mochimochi');
  assert.equal(m.name, 'MochiMochi');
  assert.equal(m.text, '!yeet 45 70');
  assert.equal(m.isMod, true);
  assert.equal(m.isSub, true);
  assert.equal(m.isBroadcaster, false);
});

test('the broadcaster counts as mod; other IRC lines are ignored', () => {
  const b = chatMessageFromIrc(parseIrc('@badges=broadcaster/1;user-id=1 :somestreamer!somestreamer@x PRIVMSG #somestreamer :!y2w start'));
  assert.equal(b.isBroadcaster, true);
  assert.equal(b.isMod, true);
  assert.equal(chatMessageFromIrc(parseIrc(':tmi.twitch.tv 001 justinfan123 :Welcome')), null);
});

test('!yeet alone is a random shot', () => {
  assert.deepEqual(parseCommand('!yeet'), { cmd: 'yeet', aim: null });
  assert.deepEqual(parseCommand('  !YEET  '), { cmd: 'yeet', aim: null });
  assert.deepEqual(parseCommand('!yeet lol'), { cmd: 'yeet', aim: null });
});

test('!yeet with numbers aims (clamped), power optional', () => {
  assert.deepEqual(parseCommand('!yeet 45 70'), { cmd: 'yeet', aim: { angle: 45, power: 70 } });
  assert.deepEqual(parseCommand('!yeet 60'), { cmd: 'yeet', aim: { angle: 60, power: null } });
  assert.deepEqual(parseCommand('!yeet 200 -5'), { cmd: 'yeet', aim: { angle: 85, power: 0 } });
  assert.deepEqual(parseCommand('!yeet 30 abc'), { cmd: 'yeet', aim: { angle: 30, power: null } });
});

test('admin commands and noise', () => {
  assert.deepEqual(parseCommand('!y2w start'), { cmd: 'admin', action: 'start', arg: '' });
  assert.deepEqual(parseCommand('!yeet2waifu bots off'), { cmd: 'admin', action: 'bots', arg: 'off' });
  assert.deepEqual(parseCommand('!y2w sound off'), { cmd: 'admin', action: 'sound', arg: 'off' });
  assert.deepEqual(parseCommand('!y2w sound'), { cmd: 'admin', action: 'sound', arg: '' });
  assert.equal(parseCommand('!y2w dance'), null);
  assert.equal(parseCommand('hello !yeet'), null);
  assert.equal(parseCommand('!yeeter'), null);
});
