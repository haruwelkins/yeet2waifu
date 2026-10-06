// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, readConfig } from '../src/config.js';
import { gameQuery, gameUrl, normalizeChannel, validChannel, LINK_KEYS } from '../src/link.js';

test('channel names come out clean from whatever people paste', () => {
  assert.equal(normalizeChannel('https://www.twitch.tv/SomeOne'), 'someone');
  assert.equal(normalizeChannel('twitch.tv/someone/videos'), 'someone');
  assert.equal(normalizeChannel('  @Some_One  '), 'some_one');
  assert.equal(normalizeChannel('#someone'), 'someone');
  assert.equal(normalizeChannel(''), '');
  assert.ok(validChannel('some_one'));
  assert.ok(!validChannel('so'));
  assert.ok(!validChannel('some-one'));
});

test('the default link only carries the channel', () => {
  assert.equal(gameQuery({ ...DEFAULTS, channel: 'someone' }), 'channel=someone');
  assert.equal(gameUrl('https://haruwelkins.github.io/yeet2waifu/', { ...DEFAULTS, channel: 'someone' }),
    'https://haruwelkins.github.io/yeet2waifu/play.html?channel=someone');
});

test('every setting survives the trip through the link', () => {
  const s = { ...DEFAULTS, channel: 'someone', lang: 'es', waifu: 'kuro', world: 'ice', pace: 'chill', sound: false,
    volume: 0.6, fx: false, crt: true, idle: false, replay: false, joinSeconds: 60, maxPlayers: 80, bots: false, auto: true };
  const back = readConfig(`?${gameQuery(s)}`);
  for (const key of LINK_KEYS) assert.equal(back[key], s[key], key);
});
