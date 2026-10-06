// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WAIFUS } from '../src/art/waifus.js';
import { encodeWaifu, decodeWaifu } from '../src/waifucode.js';
import { SIZE, CLEAR, blank, isEmpty, toImg, fromImg, artData, artFromData, paint, line, fill, encodeGif, brush, rectPixels, ellipsePixels,
  normRect, copyRect, clearRect, pasteBuf, flipBuf } from '../src/editor_core.js';

test('a house waifu survives the trip into the editor and back out as a code', () => {
  const art = fromImg(WAIFUS.hana.img);
  assert.ok(!isEmpty(art));
  const code = encodeWaifu(toImg(art), 'Hana');
  assert.equal(code, encodeWaifu(WAIFUS.hana.img, 'Hana'));
  assert.deepEqual(artFromData(artData(art)), art);
});

test('mirror paints both sides, line leaves no gaps, the bucket stops at other colors', () => {
  const art = blank();
  paint(art, 3, 5, 7, true);
  assert.equal(art[5 * SIZE + 3], 7);
  assert.equal(art[5 * SIZE + SIZE - 1 - 3], 7);
  const pts = [];
  line(0, 0, 9, 4, (x, y) => pts.push([x, y]));
  assert.equal(pts.length, 10);
  for (let i = 1; i < pts.length; i++) assert.ok(Math.abs(pts[i][0] - pts[i - 1][0]) <= 1 && Math.abs(pts[i][1] - pts[i - 1][1]) <= 1);
  const box = blank();
  for (let i = 0; i < SIZE; i++) {
    box[10 * SIZE + i] = 1; // a wall across row 10
  }
  assert.ok(fill(box, 0, 0, 2));
  assert.equal(box[0], 2);
  assert.equal(box[9 * SIZE + 31], 2);
  assert.equal(box[11 * SIZE], CLEAR);
  assert.ok(!fill(box, 0, 0, 2));
});

test('the GIF is well formed: header, palette, two frames, trailer', () => {
  const pal = Array.from({ length: 32 }, (_, i) => [i * 8, 255 - i * 8, 128]);
  const w = 40;
  const h = 30;
  const f1 = new Uint8Array(w * h).map((_, i) => (i * 7) % 32);
  const f2 = new Uint8Array(w * h).fill(3);
  const gif = encodeGif([f1, f2], w, h, pal, [10, 200]);
  assert.equal(String.fromCharCode(...gif.slice(0, 6)), 'GIF89a');
  assert.equal(gif[6] | (gif[7] << 8), w);
  assert.equal(gif[gif.length - 1], 0x3b);
  let frames = 0;
  for (let i = 0; i < gif.length - 1; i++) if (gif[i] === 0x21 && gif[i + 1] === 0xf9) frames++;
  assert.equal(frames, 2);
  assert.ok(decodeWaifu('x.1') === null);
});

test('brush sizes, shapes with and without fill', () => {
  const art = blank();
  brush(art, 10, 10, 4, 3);
  let n = art.filter((c) => c === 4).length;
  assert.equal(n, 9);
  brush(art, 0, 0, 5, 4, true);
  assert.equal(art[0], 5);
  assert.equal(art[SIZE - 1], 5);
  assert.equal(rectPixels(0, 0, 4, 3, true).length, 20);
  assert.equal(rectPixels(4, 3, 0, 0, false).length, 14);
  assert.equal(rectPixels(0, 0, 9, 9, false, 2).length, 100 - 36);
  const disc = ellipsePixels(0, 0, 9, 9, true);
  const ring = ellipsePixels(0, 0, 9, 9, false);
  assert.ok(disc.length > ring.length && ring.length > 20);
  const key = (p) => p.join(',');
  assert.ok(ring.every((p) => disc.some((q) => key(q) === key(p))));
  // symmetric: the disc mirrored is itself
  const set = new Set(disc.map(key));
  assert.ok(disc.every(([x, y]) => set.has(`${9 - x},${y}`) && set.has(`${x},${9 - y}`)));
});

test('selection: copy, clear, paste with transparency, flip', () => {
  const art = blank();
  art[2 * SIZE + 3] = 7;
  art[2 * SIZE + 4] = 8;
  const r = normRect(4, 3, 3, 2);
  assert.deepEqual(r, { x: 3, y: 2, w: 2, h: 2 });
  const buf = copyRect(art, r);
  assert.deepEqual([...buf.px], [7, 8, CLEAR, CLEAR]);
  clearRect(art, r);
  assert.ok(isEmpty(art));
  art[11 * SIZE + 10] = 1;
  pasteBuf(art, buf, 10, 10);
  assert.equal(art[10 * SIZE + 10], 7);
  assert.equal(art[11 * SIZE + 10], 1);
  assert.deepEqual([...flipBuf(buf).px], [8, 7, CLEAR, CLEAR]);
  pasteBuf(art, buf, 31, 31);
  assert.equal(art[31 * SIZE + 31], 7);
});
