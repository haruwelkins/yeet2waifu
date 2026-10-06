// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// Every viewer gets a chibi generated from their name: the same name always gives the same chibi, so
// people recognize themselves (and their rivals) from one match to the next. Body = the 12×14 hitbox.
import { sprite, recolor, makeImage, blit, setPx } from './raster.js';
import { RGBA } from './palette.js';

// Template colors: H hair, h hair shade, F skin, f skin shade, E eye, e eye shine, W white, O outfit,
// o outfit shade, K shoes, B blush.
const KEY = { H: 'amber', h: 'orange', F: 'peach', f: 'skin', E: 'ink', e: 'blue', W: 'white', O: 'red', o: 'crimson', K: 'bark', B: 'rose' };

const FACE = `
...HHHHHH...
..HHHHHHHH..
.HHHHHHHHHH.
.HhHHhHHhHH.
HHFhFFFFhFHH
HFFFFFFFFFFH
HFEEFFFFEEFH
HFEeFFFFEeFH
HFBFFFFFFBFH
.HFFFFfFFFH.
..oOOOOOOo..
.FOOOOOOOOF.
..OOOoOOOO..
..KK....KK..
`;

// Hair styles: overlays painted after the face (H/h only). '.' leaves the face as is.
const STYLES = [
  // 0 bob (the template itself)
  null,
  // 1 long hair down the sides
  `
............
............
............
............
............
............
H..........H
H..........H
H..........H
HH........HH
H..........H
H..........H
............
............
`,
  // 2 twin tails sticking out
  `
............
............
............
............
............
............
H..........H
HH........HH
HH........HH
.H........H.
............
............
............
............
`,
  // 3 ahoge (one rebel strand) + spiky top
  `
.....HH.....
......H.....
............
............
............
............
............
............
............
............
............
............
............
............
`,
];

// Rare accessories (the gacha thrill, no money involved): who gets one is decided by the name.
const ACCESSORIES = {
  bow: `
..........RR
.........RRR
..........RR
`,
  catEars: `
.H........H.
HH........HH
`,
  horns: `
.K........K.
.K........K.
`,
  crown: `
...Y.YY.Y...
...YYYYYY...
`,
};

const HAIR = [['amber', 'orange'], ['yellow', 'amber'], ['bark', 'plum'], ['brown', 'bark'], ['ink', 'night'],
  ['red', 'crimson'], ['rose', 'magenta'], ['hot', 'crimson'], ['cyan', 'blue'], ['blue', 'navy'],
  ['lime', 'green'], ['silver', 'gray'], ['white', 'silver'], ['magenta', 'grape'], ['clay', 'rust']];
const SKIN = [['peach', 'skin'], ['peach', 'tan'], ['tan', 'skin'], ['skin', 'brown'], ['brown', 'bark']];
const OUTFIT = [['red', 'crimson'], ['blue', 'navy'], ['lime', 'green'], ['amber', 'orange'], ['hot', 'crimson'],
  ['cyan', 'blue'], ['white', 'silver'], ['ink', 'night'], ['magenta', 'grape'], ['orange', 'rust'], ['slate', 'steel']];
const EYES = ['blue', 'green', 'red', 'amber', 'magenta', 'cyan', 'brown', 'lime'];

export function nameHash(name) {
  let h = 2166136261;
  for (const ch of String(name).toLowerCase()) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}

function overlay(img, text, color, dy = 0, dx = 0) {
  const rows = text.split('\n').filter((r) => r.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const c = typeof color === 'string' ? color : color[ch];
      if (c) setPx(img, x + dx, y + dy, RGBA[c]);
    }
  });
}

export function chibiLook(name, { sub = false, bot = false } = {}) {
  let h = nameHash(name);
  const pick = (arr) => {
    const v = arr[h % arr.length];
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    return v;
  };
  const look = {
    hair: pick(HAIR), skin: pick(SKIN), outfit: pick(OUTFIT), eyes: pick(EYES), style: h % STYLES.length,
  };
  h = Math.imul(h ^ (h >>> 15), 0x27d4eb2d) >>> 0;
  const roll = h % 100;
  look.accessory = sub ? 'crown' : roll < 8 ? 'catEars' : roll < 14 ? 'bow' : roll < 18 ? 'horns' : null;
  if (bot) {
    look.hair = ['slate', 'steel'];
    look.outfit = ['gray', 'slate'];
    look.accessory = null;
  }
  return look;
}

export function chibiSprite(name, opts = {}) {
  const look = chibiLook(name, opts);
  const base = sprite(KEY, FACE);
  const colored = recolor(base, {
    amber: look.hair[0], orange: look.hair[1], peach: look.skin[0], skin: look.skin[1],
    blue: look.eyes, red: look.outfit[0], crimson: look.outfit[1],
  });
  // 2 px of margin on each side for tails, ears and crowns that stick out of the hitbox.
  const img = makeImage(16, 17);
  blit(img, colored, 2, 3);
  const style = STYLES[look.style];
  if (style) overlay(img, style, { H: look.hair[0] }, 3, 2);
  if (look.style === 2) {
    // twin tails reach past the head
    for (const [x, y] of [[0, 10], [1, 10], [0, 11], [15, 10], [14, 10], [15, 11]]) setPx(img, x, y, RGBA[look.hair[1]]);
  }
  const acc = look.accessory && ACCESSORIES[look.accessory];
  if (acc) {
    const colors = { R: 'hot', H: look.hair[0], K: 'ink', Y: 'yellow' };
    overlay(img, acc, colors, look.accessory === 'bow' ? 3 : 1, 2);
  }
  return { img, look, ox: 8, oy: 10 };   // ox/oy: where the hitbox center sits in the image
}
