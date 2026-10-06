// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WAIFUS, resolveWaifu } from '../src/art/waifus.js';
import { encodeWaifu, decodeWaifu, cleanName } from '../src/waifucode.js';
import { DEFAULTS } from '../src/config.js';
import { Game } from '../src/game.js';

test('every house waifu is 32×32 and survives a round trip through a code', () => {
  for (const [id, w] of Object.entries(WAIFUS)) {
    assert.equal(w.img.w, 32, id);
    assert.equal(w.img.h, 32, id);
    const back = decodeWaifu(encodeWaifu(w.img, w.name));
    assert.ok(back, id);
    assert.deepEqual(Buffer.from(back.img.px), Buffer.from(w.img.px), id);
    assert.equal(back.name, w.name);
  }
});

test('codes fit a URL: letters, digits, _ and . only, and the name is cleaned', () => {
  const code = encodeWaifu(WAIFUS.kuro.img, 'Kuro-chan!!');
  assert.match(code, /^[A-Za-z0-9_.]+$/);
  assert.ok(code.startsWith('Kurochan.1'));
  assert.equal(cleanName(''), 'Waifu');
});

test('broken codes are refused and fall back to the default waifu', () => {
  assert.equal(decodeWaifu('nope'), null);
  assert.equal(decodeWaifu('Hana.1AA'), null, 'too few pixels');
  assert.equal(decodeWaifu('Hana.1A'), null, 'odd length');
  assert.equal(resolveWaifu('garbage').id, 'hana');
  assert.equal(resolveWaifu('rosa').name, 'Rosa');
  const custom = resolveWaifu(encodeWaifu(WAIFUS.aoi.img, 'Blue'));
  assert.equal(custom.id, 'custom');
  assert.equal(custom.name, 'Blue');
});

test('mods switch the waifu from chat (case kept for codes)', () => {
  const g = new Game({ ...DEFAULTS, seed: 3 });
  const seen = [];
  g.on((ev) => ev.type === 'waifu' && seen.push(ev.waifu));
  g.handleChat({ id: 'v', name: 'viewer', text: '!y2w waifu kuro' });
  assert.equal(g.cfg.waifu, DEFAULTS.waifu, 'a viewer cannot');
  g.handleChat({ id: 'm', name: 'mod', text: '!y2w waifu KURO', isMod: true });
  assert.equal(g.cfg.waifu, 'kuro');
  const code = encodeWaifu(WAIFUS.momo.img, 'MyMomo');
  g.handleChat({ id: 'm', name: 'mod', text: `!y2w waifu ${code}`, isMod: true });
  assert.equal(g.cfg.waifu, code);
  assert.deepEqual(seen, ['kuro', code]);
});
