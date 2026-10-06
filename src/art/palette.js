// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// ENDESGA 32 (by Endesga, lospec.com/palette-list/endesga-32): every pixel in the game comes from here,
// so levels, chibis and waifus made by different hands still look like one game.
export const PAL = {
  rust: '#be4a2f', clay: '#d77643', sand: '#ead4aa', tan: '#e4a672', brown: '#b86f50', bark: '#733e39',
  plum: '#3e2731', crimson: '#a22633', red: '#e43b44', orange: '#f77622', amber: '#feae34', yellow: '#fee761',
  lime: '#63c74d', green: '#3e8948', forest: '#265c42', deep: '#193c3e', navy: '#124e89', blue: '#0099db',
  cyan: '#2ce8f5', white: '#ffffff', silver: '#c0cbdc', gray: '#8b9bb4', slate: '#5a6988', steel: '#3a4466',
  night: '#262b44', ink: '#181425', hot: '#ff0044', grape: '#68386c', magenta: '#b55088', rose: '#f6757a',
  peach: '#e8b796', skin: '#c28569',
};

export const PAL_ORDER = Object.keys(PAL);

export function rgba(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export const RGBA = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, rgba(v)]));
