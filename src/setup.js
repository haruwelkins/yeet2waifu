// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The setup page (index.html): pick the options, watch them live in the preview, copy the OBS link.
// The link is built by src/link.js (only what differs from the defaults). Choices are remembered in this
// browser (localStorage) so a streamer coming back finds their setup as they left it.
import { DEFAULTS } from './config.js';
import { WORLDS } from './maps.js';
import { WAIFUS, DEFAULT_WAIFU } from './art/waifus.js';
import { decodeWaifu } from './waifucode.js';
import { composeLevel, flatten } from './level.js';
import { VERSION } from './version.js';
import { LINK_KEYS, gameUrl, normalizeChannel, validChannel } from './link.js';
import { h, note, imgCanvas, paintImg, gridCanvas, ICONS, ICON_COLORS, readLang, writeLang, loadStore, saveStore, SETUP_KEY,
  appIcon, listMine, deleteMine, confirmDialog } from './uikit.js';

const T = {
  en: {
    ask: 'who gets the waifu?',
    tagline: 'A free catapult game for your Twitch chat. They type !yeet, they fly, the best shot gets the waifu. Set it up here, paste one link in OBS and play.',
    previewNote: 'Live preview with a fake chat.',
    previewNoteLive: (c) => `Live preview with a fake chat plus #${c}: type !yeet there and you show up here.`,
    previewSound: 'Sound in the preview',
    propsTitle: 'Setup',
    propsHint: 'only the channel is required',
    secChannel: 'Your Twitch channel',
    channelPh: 'yourname',
    chEmpty: 'Just the name, as in twitch.tv/yourname. Pasting the whole link works too.',
    chOk: (c) => `Ready: the game reads #${c}. No login, nothing to install.`,
    chBad: 'Twitch names only use letters, numbers and _ (4 to 25).',
    secWaifu: 'Waifu',
    waifuTag: 'who waits at the end',
    blurbs: {
      hana: 'the sweetheart with the big red bow',
      rosa: 'the princess in pink, waiting in her tower',
      momo: 'cat hoodie, toy hammer, zero patience',
      aoi: 'blue knight with a tiara and a sword',
      kuro: 'a bratty little demon who thinks you will never reach her',
    },
    custom: 'Code',
    customAbout: 'from a waifu code',
    codeLabel: 'Waifu code',
    codePh: 'paste a code here',
    codeEmpty: 'Waifu codes travel on X, where @haru717171x posts new ones. Or draw your own.',
    drawOwn: 'DRAW YOUR OWN WAIFU',
    mineAbout: 'drawn by you',
    delTip: (n) => `Delete ${n}`,
    delTitle: 'Delete waifu',
    delText: (n) => `Are you sure you want to delete the waifu ${n}? This can't be undone.`,
    delOk: 'Delete',
    delCancel: 'Cancel',
    drawOwnSub: 'a 32×32 pixel editor, right here',
    newBadge: 'NEW',
    navSetup: 'Setup',
    navDraw: 'Draw your waifu',
    codeOk: (n) => `${n} is waiting for you.`,
    codeBad: 'That code does not read. Copy it whole, from the first letter to the last.',
    secWorld: 'World',
    random: 'Random',
    randomAbout: 'a different world each match',
    secLang: 'Language on screen',
    secPace: 'Pace',
    paceTag: 'how long it waits between things',
    paces: { fast: ['Fast', 'short waits'], normal: ['Normal', 'the usual'], chill: ['Chill', 'time to talk'] },
    secSound: 'Sound',
    soundOn: ['Sound effects', 'mute it live anytime with !y2w sound off'],
    volume: 'Volume',
    secLook: 'Look',
    fx: ['Glow and color', 'turn it off on slow PCs'],
    crt: ['CRT lines', 'old TV scanlines on top'],
    idle: ['Waifu breathing', 'a soft bounce while she waits'],
    replay: ['Winning shot replay', 'in slow motion, before the fanfare'],
    secMore: 'More options',
    joinSeconds: 'Time to sign up, in seconds',
    maxPlayers: 'Most players in one match',
    bots: ['House bots', 'they fill the field when your chat is small'],
    auto: ['Start on its own', 'a new match begins without !y2w start'],
    pick: ['You pick the winner', 'when several reach her: press 1-9 or type !y2w pick 2 (else she picks at random)'],
    linkTitle: 'Your link for OBS',
    linkPending: 'Type your channel above and your link shows up here.',
    copy: 'COPY LINK',
    copied: 'COPIED!',
    openTab: 'Open it in a new tab',
    tabObs: 'Add to OBS',
    tabCmds: 'Chat commands',
    tabKeys: 'Keys',
    obs: ['Copy your link.', 'In OBS, under Sources, click + and pick Browser.', 'Paste the link in URL. Width 1920, height 1080.',
      'Tick Control audio via OBS, so the game sounds go to your stream. OK.', 'Put the source above your camera and your game.'],
    play: 'Then you or a mod type <code>!y2w start</code>, and your chat types <code>!yeet</code> to jump in.',
    cmdsIntro: 'Anyone in chat:',
    cmdsModIntro: 'Streamer and mods:',
    cmds: [['!yeet', 'join with a random shot'], ['!yeet 45 70', 'join or aim again: angle 45°, power 70%']],
    modCmds: [['!y2w start', 'open sign ups'], ['!y2w go', 'close sign ups now, or skip a wait'], ['!y2w stop', 'cancel the match'],
      ['!y2w pace fast', 'change the pace live (fast, normal, chill)'], ['!y2w waifu kuro', 'change the waifu (a name or a code)'],
      ['!y2w sound off', 'mute it; on brings it back'], ['!y2w bots off', 'no house bots'],
      ['!y2w pick 2', 'pick the winner when several reach her (You pick the winner, in More options)']],
    keysIntro: 'In OBS, right click the source and pick Interact. While that window is open:',
    keys: [['S', 'start a match'], ['G', 'skip a wait'], ['X', 'stop the match'], ['M', 'sound on or off'], ['1-9', 'pick the winner while she chooses']],
    stNeed: 'Type your Twitch channel to get your link',
    stOk: (c) => `Ready for #${c}`,
    stBad: 'Check the channel name',
    footFree: 'Free to use on stream',
    footCode: 'Source on GitHub',
  },
  es: {
    ask: '¿quién se queda con la waifu?',
    tagline: 'Un juego de catapulta gratis para el chat de tu stream de Twitch. Escriben !yeet, salen volando y el mejor tiro se queda con la waifu. Lo configuras aquí, pegas un link en OBS y a jugar.',
    previewNote: 'Vista previa en vivo con un chat de prueba.',
    previewNoteLive: (c) => `Vista previa en vivo con un chat de prueba y #${c}: escribe !yeet ahí y sales aquí.`,
    previewSound: 'Sonido en la vista previa',
    propsTitle: 'Configuración',
    propsHint: 'solo el canal es obligatorio',
    secChannel: 'Tu canal de Twitch',
    channelPh: 'tucanal',
    chEmpty: 'Solo el nombre, como en twitch.tv/tucanal. También puedes pegar el link completo.',
    chOk: (c) => `Listo: el juego lee #${c}. Sin login, sin instalar nada.`,
    chBad: 'Los nombres de Twitch solo usan letras, números y _ (de 4 a 25).',
    secWaifu: 'Waifu',
    waifuTag: 'quién espera al final',
    blurbs: {
      hana: 'la dulce del moño rojo',
      rosa: 'la princesa de rosa que espera en su torre',
      momo: 'sudadera de gato, martillo de juguete, cero paciencia',
      aoi: 'guerrera azul con tiara y espada',
      kuro: 'una demonia berrinchuda que cree que nunca la vas a alcanzar',
    },
    custom: 'Código',
    customAbout: 'de un código de waifu',
    codeLabel: 'Código de waifu',
    codePh: 'pega un código aquí',
    codeEmpty: 'Los códigos de waifu viajan por X, donde @haru717171x publica nuevas. O dibuja la tuya.',
    drawOwn: 'DIBUJA TU PROPIA WAIFU',
    mineAbout: 'dibujada por ti',
    delTip: (n) => `Borrar a ${n}`,
    delTitle: 'Borrar waifu',
    delText: (n) => `¿Seguro que quieres borrar a la waifu ${n}? No se puede deshacer.`,
    delOk: 'Borrar',
    delCancel: 'Cancelar',
    drawOwnSub: 'un editor pixel de 32×32, aquí mismo',
    newBadge: 'NUEVO',
    navSetup: 'Configuración',
    navDraw: 'Dibuja tu waifu',
    codeOk: (n) => `${n} te espera.`,
    codeBad: 'Ese código no se lee. Cópialo completo, de la primera letra a la última.',
    secWorld: 'Mundo',
    random: 'Al azar',
    randomAbout: 'un mundo distinto cada partida',
    secLang: 'Idioma en pantalla',
    secPace: 'Ritmo',
    paceTag: 'cuánto espera entre una cosa y otra',
    paces: { fast: ['Rápido', 'esperas cortas'], normal: ['Normal', 'lo de siempre'], chill: ['Tranqui', 'tiempo para platicar'] },
    secSound: 'Sonido',
    soundOn: ['Efectos de sonido', 'lo silencias en vivo con !y2w sound off'],
    volume: 'Volumen',
    secLook: 'Imagen',
    fx: ['Brillo y color', 'apágalo en PCs lentas'],
    crt: ['Líneas de tele vieja', 'efecto CRT encima'],
    idle: ['Waifu respirando', 'un rebote suave mientras espera'],
    replay: ['Repetición del tiro ganador', 'en cámara lenta, antes de la fanfarria'],
    secMore: 'Más opciones',
    joinSeconds: 'Tiempo para inscribirse, en segundos',
    maxPlayers: 'Máximo de jugadores por partida',
    bots: ['Bots de la casa', 'llenan la partida si tu chat es chico'],
    auto: ['Arranca sola', 'empieza otra partida sin !y2w start'],
    pick: ['Tú eliges al ganador', 'si llegan varios: tecla 1-9 o escribe !y2w pick 2 (si no, ella elige al azar)'],
    linkTitle: 'Tu link para OBS',
    linkPending: 'Escribe tu canal arriba y aquí aparece tu link.',
    copy: 'COPIAR LINK',
    copied: '¡COPIADO!',
    openTab: 'Abrirlo en otra pestaña',
    tabObs: 'Agregar a OBS',
    tabCmds: 'Comandos del chat',
    tabKeys: 'Teclas',
    obs: ['Copia tu link.', 'En OBS, en Fuentes, haz clic en + y elige Navegador.', 'Pega el link en URL. Ancho 1920, alto 1080.',
      'Marca la casilla de controlar el audio con OBS (Control audio via OBS), así el sonido del juego sale en tu stream. Aceptar.',
      'Pon la fuente encima de tu cámara y tu juego.'],
    play: 'Luego tú o un mod escriben <code>!y2w start</code>, y tu chat escribe <code>!yeet</code> para entrar.',
    cmdsIntro: 'Cualquiera en el chat:',
    cmdsModIntro: 'Streamer y mods:',
    cmds: [['!yeet', 'entra con un tiro al azar'], ['!yeet 45 70', 'entra o vuelve a apuntar: ángulo 45°, fuerza 70%']],
    modCmds: [['!y2w start', 'abre las inscripciones'], ['!y2w go', 'cierra las inscripciones ya, o salta una espera'],
      ['!y2w stop', 'cancela la partida'], ['!y2w pace fast', 'cambia el ritmo en vivo (fast, normal, chill)'],
      ['!y2w waifu kuro', 'cambia la waifu (un nombre o un código)'], ['!y2w sound off', 'silencia; on lo regresa'],
      ['!y2w bots off', 'sin bots de la casa'], ['!y2w pick 2', 'elige al ganador si llegan varios (Tú eliges al ganador, en Más opciones)']],
    keysIntro: 'En OBS, clic derecho a la fuente y elige Interactuar. Con esa ventana abierta:',
    keys: [['S', 'empieza una partida'], ['G', 'salta una espera'], ['X', 'detiene la partida'], ['M', 'sonido sí o no'], ['1-9', 'elige al ganador mientras ella elige']],
    stNeed: 'Escribe tu canal de Twitch para sacar tu link',
    stOk: (c) => `Listo para #${c}`,
    stBad: 'Revisa el nombre del canal',
    footFree: 'Gratis para usar en stream',
    footCode: 'Código en GitHub',
  },
};

const PACES = ['fast', 'normal', 'chill'];
const $ = (sel) => document.querySelector(sel);

// ---------- state ----------
const S = Object.fromEntries(LINK_KEYS.map((k) => [k, DEFAULTS[k]]));
const ui = {
  lang: (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en',
  langTouched: false,
  previewSound: false,
  tab: 'obs',
  code: '',
  preset: DEFAULT_WAIFU,
  open: {},
};
let channelRaw = '';

function load() {
  const saved = loadStore(SETUP_KEY);
  if (!saved) return;
  for (const k of LINK_KEYS) if (saved.S && typeof saved.S[k] === typeof DEFAULTS[k]) S[k] = saved.S[k];
  for (const k of ['langTouched', 'previewSound', 'tab', 'code', 'preset']) {
    if (saved.ui && typeof saved.ui[k] === typeof ui[k]) ui[k] = saved.ui[k];
  }
  if (saved.ui && saved.ui.open && typeof saved.ui.open === 'object') ui.open = saved.ui.open;
  channelRaw = typeof saved.channelRaw === 'string' ? saved.channelRaw : S.channel;
}

function sanitize() {
  if (!['en', 'es'].includes(ui.lang)) ui.lang = 'en';
  if (!['en', 'es'].includes(S.lang)) S.lang = ui.lang;
  if (!ui.langTouched) S.lang = ui.lang;
  if (!PACES.includes(S.pace)) S.pace = DEFAULTS.pace;
  if (S.world && !WORLDS[S.world]) S.world = '';
  if (!WAIFUS[ui.preset]) ui.preset = DEFAULT_WAIFU;
  if (!WAIFUS[S.waifu] && !decodeWaifu(S.waifu)) S.waifu = ui.preset;
  S.volume = Math.min(1, Math.max(0, Number(S.volume) || 0));
  S.joinSeconds = Math.min(180, Math.max(10, Math.round(S.joinSeconds)));
  S.maxPlayers = Math.min(300, Math.max(8, Math.round(S.maxPlayers)));
  S.channel = normalizeChannel(channelRaw);
  if (!['obs', 'cmds', 'keys'].includes(ui.tab)) ui.tab = 'obs';
}

function save() {
  saveStore(SETUP_KEY, { S, ui, channelRaw });
}

// The editor sends a finished waifu here as #waifu=<code> (works even without storage).
function takeFromEditor() {
  const m = /[#&]waifu=([^&]+)/.exec(location.hash);
  if (!m) return;
  const code = decodeURIComponent(m[1]);
  if (decodeWaifu(code)) {
    S.waifu = code;
    ui.code = code;
    ui.open.waifu = true;
  }
  history.replaceState(null, '', location.pathname + location.search);
}

const waifuCanvases = new Map();
function waifuCanvas(idOrCode) {
  if (!waifuCanvases.has(idOrCode)) {
    const img = WAIFUS[idOrCode] ? WAIFUS[idOrCode].img : decodeWaifu(idOrCode)?.img;
    if (!img) return null;
    waifuCanvases.set(idOrCode, imgCanvas(img));
  }
  return waifuCanvases.get(idOrCode);
}

// World thumbnails: each world's final (her balcony), with the chosen waifu standing on it. Built one per
// tick after the page shows, so the page never waits for them.
const THUMB = { w: 240, h: 135, x: 240, y: 52 };
const thumbs = {};
const thumbQueue = [];
function worldThumb(id) {
  if (!thumbs[id]) {
    thumbs[id] = { canvas: h('canvas', { width: String(THUMB.w), height: String(THUMB.h) }), base: null, drawn: '' };
    thumbQueue.push(id);
    if (thumbQueue.length === 1) setTimeout(buildThumbs, 30);
  }
  return thumbs[id].canvas;
}
function buildThumbs() {
  const id = thumbQueue.shift();
  if (!id) return;
  const map = WORLDS[id].final;
  const flat = flatten(composeLevel(map), map, 0);
  const full = imgCanvas(flat);
  const base = h('canvas', { width: String(THUMB.w), height: String(THUMB.h) });
  base.getContext('2d').drawImage(full, THUMB.x, THUMB.y, THUMB.w, THUMB.h, 0, 0, THUMB.w, THUMB.h);
  thumbs[id].base = base;
  thumbs[id].at = [map.waifu.x - THUMB.x, map.waifu.y - THUMB.y];
  drawThumb(id);
  if (thumbQueue.length) setTimeout(buildThumbs, 0);
}
function drawThumb(id) {
  const t = thumbs[id];
  if (!t || !t.base || t.drawn === S.waifu) return;
  const ctx = t.canvas.getContext('2d');
  ctx.drawImage(t.base, 0, 0);
  const w = waifuCanvas(S.waifu);
  if (w) ctx.drawImage(w, t.at[0], t.at[1]);
  t.drawn = S.waifu;
}

// ---------- the setup panel ----------
let syncers = [];

function section(id, title, tag, body, openByDefault, fixed = false) {
  const open = fixed || (ui.open[id] ?? openByDefault);
  const wrap = h('div', { class: 'sec-body', id: `sec-${id}` }, body);
  wrap.hidden = !open;
  const parts = [h('span', { text: title }), tag && h('span', { class: 'tag', text: tag }), h('span', { class: 'rule', 'aria-hidden': 'true' })];
  if (fixed) return h('div', { class: 'sec' }, h('div', { class: 'sec-head', style: 'cursor:default' }, h('span', { class: 'arrow', style: 'visibility:hidden' }), parts), wrap);
  const head = h('button', { type: 'button', class: 'sec-head', 'aria-expanded': String(open), 'aria-controls': `sec-${id}` },
    h('span', { class: 'arrow', 'aria-hidden': 'true' }), parts);
  head.addEventListener('click', () => {
    const nowOpen = wrap.hidden;
    wrap.hidden = !nowOpen;
    head.setAttribute('aria-expanded', String(nowOpen));
    ui.open[id] = nowOpen;
    save();
  });
  return h('div', { class: 'sec' }, head, wrap);
}

function check(key, [label, sub]) {
  const input = h('input', { type: 'checkbox' });
  input.addEventListener('change', () => {
    S[key] = input.checked;
    update();
  });
  syncers.push(() => (input.checked = !!S[key]));
  return h('label', { class: 'check' }, input, h('span', { class: 'box', 'aria-hidden': 'true' }),
    h('span', {}, h('span', { text: label }), sub && h('span', { class: 'sub', text: sub })));
}

function buttonSet(key, items, cls = '', onPick = null) {
  const btns = items.map(([value, label, sub]) => {
    const b = h('button', { type: 'button', class: 'btn raised' }, h('span', { text: label }), sub && h('small', { text: sub }));
    b.addEventListener('click', () => {
      S[key] = value;
      if (onPick) onPick(value);
      update();
    });
    return b;
  });
  syncers.push(() => btns.forEach((b, i) => b.setAttribute('aria-pressed', String(S[key] === items[i][0]))));
  return h('div', { class: `bset cut ${cls}`, role: 'group' }, btns);
}

function number(key, label, min, max) {
  const input = h('input', { type: 'number', class: 'num sunken', min: String(min), max: String(max), step: '1', inputmode: 'numeric' });
  input.addEventListener('change', () => {
    const n = Math.round(Number(input.value));
    S[key] = input.value !== '' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : DEFAULTS[key];
    input.value = String(S[key]);
    update();
  });
  syncers.push(() => {
    if (document.activeElement !== input) input.value = String(S[key]);
  });
  return h('label', { class: 'row' }, h('span', { class: 'lbl', text: label }), input);
}

function channelBody(t) {
  const input = h('input', { id: 'channel', value: channelRaw, placeholder: t.channelPh, autocomplete: 'off', autocapitalize: 'off',
    spellcheck: 'false', enterkeyhint: 'done', 'aria-describedby': 'chHint', 'aria-label': t.secChannel });
  // a pasted link or @name becomes the bare name right away; plain typing is left alone until the field is left
  const tidy = (always) => {
    const clean = normalizeChannel(input.value);
    if (input.value !== clean && (always || /[/@#\s]/.test(input.value))) input.value = clean;
  };
  input.addEventListener('input', () => {
    tidy(false);
    channelRaw = input.value;
    S.channel = normalizeChannel(channelRaw);
    update({ previewDelay: 900 });
  });
  input.addEventListener('blur', () => {
    tidy(true);
    channelRaw = input.value;
  });
  const hint = h('p', { class: 'note', id: 'chHint', 'aria-live': 'polite' });
  syncers.push(() => {
    if (!S.channel) note(hint, '', t.chEmpty);
    else if (validChannel(S.channel)) note(hint, 'ok', t.chOk(S.channel));
    else note(hint, 'warn', t.chBad);
  });
  return [h('label', { class: 'entry big sunken' }, h('span', { class: 'prefix', text: 'twitch.tv/' }), input), hint];
}

function waifuBody(t) {
  const ids = Object.keys(WAIFUS);
  const btns = ids.map((id) => {
    const b = h('button', { type: 'button', class: 'btn raised pick', title: WAIFUS[id].name },
      imgCanvas(WAIFUS[id].img, 'who'), h('span', { class: 'lbl', text: WAIFUS[id].name }));
    b.addEventListener('click', () => {
      S.waifu = id;
      ui.preset = id;
      update();
    });
    return b;
  });
  // my waifus (drawn in the editor), each with its delete button
  const mine = listMine().filter((m) => decodeWaifu(m.code));
  const mineBtns = mine.map((item) => {
    const pick = h('button', { type: 'button', class: 'btn raised pick', title: item.name },
      imgCanvas(decodeWaifu(item.code).img, 'who'), h('span', { class: 'lbl', text: item.name }));
    pick.addEventListener('click', () => {
      S.waifu = item.code;
      update();
    });
    const del = h('button', { type: 'button', class: 'btn raised pick-del', title: t.delTip(item.name), 'aria-label': t.delTip(item.name) },
      gridCanvas(ICONS.trash, ICON_COLORS));
    del.addEventListener('click', async () => {
      const yes = await confirmDialog({ title: t.delTitle, text: t.delText(item.name), art: imgCanvas(decodeWaifu(item.code).img),
        ok: t.delOk, cancel: t.delCancel });
      if (!yes) return;
      deleteMine(item.id);
      if (S.waifu === item.code) S.waifu = ui.preset;
      renderOptions();
      update();
    });
    return { item, pick, wrap: h('div', { class: 'pick-wrap' }, pick, del) };
  });
  const codeArt = h('canvas', { class: 'who', width: '32', height: '32' });
  const codeEmpty = h('span', { class: 'empty-who', text: '?' });
  const codeBtn = h('button', { type: 'button', class: 'btn raised pick', title: t.codeLabel }, codeEmpty, codeArt, h('span', { class: 'lbl', text: t.custom }));
  const codeInput = h('input', { id: 'waifuCode', value: ui.code, placeholder: t.codePh, autocomplete: 'off', spellcheck: 'false' });
  codeBtn.addEventListener('click', () => {
    if (decodeWaifu(ui.code)) {
      S.waifu = ui.code;
      update();
    } else codeInput.focus();
  });
  codeInput.addEventListener('input', () => {
    ui.code = codeInput.value.trim();
    if (decodeWaifu(ui.code)) S.waifu = ui.code;
    else if (!WAIFUS[S.waifu]) S.waifu = ui.preset;
    update();
  });
  const about = h('p', { class: 'about' });
  const codeNote = h('p', { class: 'note' });
  syncers.push(() => {
    const mineNow = mineBtns.find((m) => m.item.code === S.waifu);
    const fromCode = !WAIFUS[S.waifu] && !mineNow;
    btns.forEach((b, i) => b.setAttribute('aria-pressed', String(S.waifu === ids[i])));
    mineBtns.forEach((m) => m.pick.setAttribute('aria-pressed', String(m === mineNow)));
    codeBtn.setAttribute('aria-pressed', String(fromCode));
    const w = ui.code ? decodeWaifu(ui.code) : null;
    codeArt.hidden = !w;
    codeEmpty.hidden = !!w;
    if (w) paintImg(codeArt, w.img);
    if (mineNow) about.replaceChildren(h('b', { text: mineNow.item.name }), `: ${t.mineAbout}`);
    else if (fromCode && w) about.replaceChildren(h('b', { text: w.name }), `: ${t.customAbout}`);
    else if (WAIFUS[S.waifu]) about.replaceChildren(h('b', { text: WAIFUS[S.waifu].name }), `: ${t.blurbs[S.waifu]}`);
    else about.replaceChildren(h('b', { text: decodeWaifu(S.waifu)?.name || '?' }), `: ${t.customAbout}`);
    if (!ui.code) note(codeNote, '', t.codeEmpty);
    else if (w) note(codeNote, 'ok', t.codeOk(w.name));
    else note(codeNote, 'warn', t.codeBad);
  });
  // the editor's door: the one loud button on the page, in the waifu's color
  const drawCta = h('a', { class: 'cta-draw cut', href: 'draw.html' }, gridCanvas(ICONS.pencil, ICON_COLORS, 'cta-ico'),
    h('span', { class: 'cta-text' }, h('span', { class: 'cta-title', text: t.drawOwn }), h('span', { class: 'cta-sub', text: t.drawOwnSub })),
    h('span', { class: 'cta-new', text: t.newBadge }));
  return [h('div', { class: 'picks waifus' }, btns, mineBtns.map((m) => m.wrap), codeBtn), drawCta, about,
    h('label', { class: 'entry code sunken' }, h('span', { class: 'prefix', text: `${t.codeLabel}: ` }), codeInput), codeNote];
}

function worldBody(t) {
  const ids = ['', ...Object.keys(WORLDS)];
  const btns = ids.map((id) => {
    const name = id ? WORLDS[id].name[ui.lang] : t.random;
    const art = id ? h('div', { class: 'thumb' }, worldThumb(id)) : h('div', { class: 'thumb dice' }, gridCanvas(ICONS.dice, ICON_COLORS));
    const b = h('button', { type: 'button', class: 'btn raised pick', title: name }, art, h('span', { class: 'lbl', text: name }));
    b.addEventListener('click', () => {
      S.world = id;
      update();
    });
    return b;
  });
  const about = h('p', { class: 'about' });
  syncers.push(() => {
    btns.forEach((b, i) => b.setAttribute('aria-pressed', String(S.world === ids[i])));
    if (!S.world) about.replaceChildren(h('b', { text: t.random }), `: ${t.randomAbout}`);
    else {
      const w = WORLDS[S.world];
      about.replaceChildren(h('b', { text: w.name[ui.lang] }), `: ${[...w.rounds, w.final].map((m) => m.name[ui.lang]).join(', ')}`);
    }
    for (const id of Object.keys(thumbs)) drawThumb(id);
  });
  return [h('div', { class: 'picks worlds' }, btns), about];
}

function renderOptions() {
  syncers = [];
  const t = T[ui.lang];
  const volume = h('input', { type: 'range', min: '0', max: '100', step: '5', 'aria-label': t.volume });
  const volVal = h('span', { class: 'val' });
  volume.addEventListener('input', () => {
    S.volume = Number(volume.value) / 100;
    update();
  });
  syncers.push(() => {
    volume.value = String(Math.round(S.volume * 100));
    volVal.textContent = `${Math.round(S.volume * 100)}%`;
    volume.disabled = !S.sound;
  });
  $('#options').replaceChildren(
    section('channel', t.secChannel, null, channelBody(t), true, true),
    section('waifu', t.secWaifu, t.waifuTag, waifuBody(t), true),
    section('world', t.secWorld, null, worldBody(t), true),
    section('lang', t.secLang, null, buttonSet('lang', [['en', 'English'], ['es', 'Español']], '', () => (ui.langTouched = true)), true),
    section('pace', t.secPace, t.paceTag, buttonSet('pace', PACES.map((p) => [p, ...t.paces[p]]), 'paces'), true),
    section('sound', t.secSound, null, [check('sound', t.soundOn), h('div', { class: 'slider' }, h('span', { text: t.volume }), volume, volVal)], true),
    section('look', t.secLook, null, h('div', { class: 'checks' }, check('fx', t.fx), check('crt', t.crt), check('idle', t.idle), check('replay', t.replay)), false),
    section('more', t.secMore, null, [number('joinSeconds', t.joinSeconds, 10, 180), number('maxPlayers', t.maxPlayers, 8, 300),
      h('div', { class: 'checks' }, check('bots', t.bots), check('auto', t.auto), check('pick', t.pick))], false),
  );
}

// ---------- the static parts, tabs ----------
function table(rows, tag) {
  return h('table', {}, h('tbody', {}, rows.map(([a, b]) => h('tr', {}, h('td', {}, h(tag, { text: a })), h('td', { text: b })))));
}

function applyStatic() {
  const t = T[ui.lang];
  document.documentElement.lang = ui.lang;
  for (const el of document.querySelectorAll('[data-t]')) {
    const v = t[el.dataset.t];
    if (typeof v === 'string') el.textContent = v;
  }
  $('#p-obs').replaceChildren(h('ol', {}, t.obs.map((s) => h('li', { text: s }))), h('p', { html: t.play }));
  $('#p-cmds').replaceChildren(h('p', { text: t.cmdsIntro }), table(t.cmds, 'code'), h('p', { text: t.cmdsModIntro, style: 'margin-top:16px' }), table(t.modCmds, 'code'));
  $('#p-keys').replaceChildren(h('p', { text: t.keysIntro }), table(t.keys, 'kbd'));
  for (const b of document.querySelectorAll('[data-ui-lang]')) b.setAttribute('aria-pressed', String(b.dataset.uiLang === ui.lang));
  $('#version').textContent = `v${VERSION}`;
}

const TABS = ['obs', 'cmds', 'keys'];
function selectTab(id, focus = false) {
  ui.tab = id;
  for (const k of TABS) {
    const tab = $(`#t-${k}`);
    tab.setAttribute('aria-selected', String(k === id));
    tab.tabIndex = k === id ? 0 : -1;
    $(`#p-${k}`).hidden = k !== id;
    if (focus && k === id) tab.focus();
  }
  save();
}

// ---------- link, preview, status ----------
const linkEl = $('#link');
const copyBtn = $('#copy');
const copyText = $('#copyText');
const preview = $('#preview');
let previewTimer = 0;
let previewShown = '';
let copyTimer = 0;

function previewUrl() {
  const ok = validChannel(S.channel);
  const u = new URL(gameUrl(location.href, { ...S, channel: ok ? S.channel : '', joinSeconds: 15, sound: ui.previewSound && S.sound }));
  u.searchParams.set('demo', '1');
  u.searchParams.set('demoCount', '24');
  return u.toString();
}

function update({ previewDelay = 350 } = {}) {
  const t = T[ui.lang];
  for (const s of syncers) s();
  const ok = validChannel(S.channel);
  const url = gameUrl(location.href, { ...S, channel: ok ? S.channel : '' });
  linkEl.classList.toggle('pending', !ok);
  linkEl.textContent = ok ? url : t.linkPending;
  copyBtn.disabled = !ok;
  copyBtn.title = ok ? '' : t.stNeed;
  if (!copyBtn.classList.contains('done')) copyText.textContent = t.copy;
  const open = new URL(url);
  if (!ok) open.searchParams.set('demo', '1');
  $('#openTab').href = open.toString();
  $('#statusDot').className = `dot ${ok ? 'ok' : S.channel ? 'warn' : ''}`;
  $('#statusText').textContent = ok ? t.stOk(S.channel) : S.channel ? t.stBad : t.stNeed;
  $('#previewNote').textContent = ok ? t.previewNoteLive(S.channel) : t.previewNote;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const src = previewUrl();
    if (src !== previewShown) {
      previewShown = src;
      preview.src = src;
    }
  }, previewDelay);
  save();
}

copyBtn.addEventListener('click', async () => {
  const text = linkEl.textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const r = document.createRange();
    r.selectNodeContents(linkEl);
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    document.execCommand('copy');
  }
  copyBtn.classList.add('done');
  copyText.textContent = T[ui.lang].copied;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyBtn.classList.remove('done');
    copyText.textContent = T[ui.lang].copy;
  }, 1600);
});

// ---------- start ----------
load();
sanitize();

ui.lang = readLang();
if (!ui.langTouched) S.lang = ui.lang;
takeFromEditor();
appIcon($('#appIcon'));

for (const b of document.querySelectorAll('[data-ui-lang]')) {
  b.addEventListener('click', () => {
    ui.lang = b.dataset.uiLang;
    writeLang(ui.lang);
    if (!ui.langTouched) S.lang = ui.lang;
    applyStatic();
    renderOptions();
    update();
  });
}
TABS.forEach((k, i) => {
  const tab = $(`#t-${k}`);
  tab.addEventListener('click', () => selectTab(k));
  tab.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') selectTab(TABS[(i + 1) % TABS.length], true);
    if (e.key === 'ArrowLeft') selectTab(TABS[(i + TABS.length - 1) % TABS.length], true);
  });
});
const previewSound = $('#previewSound');
previewSound.checked = ui.previewSound;
previewSound.addEventListener('change', () => {
  ui.previewSound = previewSound.checked;
  update({ previewDelay: 0 });
});

applyStatic();
renderOptions();
selectTab(ui.tab);
update({ previewDelay: 0 });
