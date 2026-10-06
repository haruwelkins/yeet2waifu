# yeet2waifu

**Who gets the waifu?** Your chat climbs into a catapult and gets yeeted across a physics course.
Whoever lands in the basket goes through to the next round; the last ones fly to her balcony.
Nobody makes it? She stays single.

> 9 worlds, 28 courses, 5 house waifus and an editor to draw your own.

## Use it on your stream
Go to **https://haruwelkins.github.io/yeet2waifu/**, type your channel, pick the waifu, the world and the
rest, and copy your link. In OBS add a **Browser Source** (1920×1080) with that link and tick **Control audio via
OBS** so the game sounds reach your stream. The short version:

```
https://haruwelkins.github.io/yeet2waifu/play.html?channel=YOUR_TWITCH_NAME
```

No login, no token: the game only reads your chat.

| Chat | What it does |
|---|---|
| `!yeet` | join with a random shot |
| `!yeet 45 70` | join (or re-aim) with angle 45° and power 70% |
| `!y2w start` | streamer/mods: open sign-ups |
| `!y2w go` | streamer/mods: close sign-ups now / skip a wait |
| `!y2w stop` | streamer/mods: cancel the match |
| `!y2w bots off` | no house bots filling a small chat |
| `!y2w waifu kuro` | change who waits at the end (or paste a waifu code) |
| `!y2w sound off` | streamer/mods: mute (`!y2w sound on` brings it back; `!y2w sound` alone toggles) |
| `!y2w pick 2` | streamer/mods: with `pick=1`, choose who gets her when several reach her (a number or a name; keys 1-9 too) |

URL options: `lang=es`, `world=plains|dungeon|speed|castle|midnight|sakura|candy|ice|space` (default: a random one each match),
`waifu=hana|rosa|momo|aoi|kuro` or a waifu code, `joinSeconds=45`, `maxPlayers=120`, `heatSize=30`, `finalSize=8`,
`fx=0` (no glow/vignette post-process, for slow PCs), `crt=1` (scanlines), `pace=fast|normal|chill` (how long it waits between things; also `!y2w pace fast`), `idle=0` (the waifu stops
breathing), `replay=0` (no slow-motion replay of the winning shot), `bots=0`, `sound=0` (start muted), `volume=0.35`,
`pick=1` (you pick the winner when several reach her; `pickSeconds=15`), `auto=1` (starts matches by itself), `demo=1` (fake chat to try it without a stream; works together
with `channel`, so you can play against fake viewers).

## Draw your own waifu
Open **https://haruwelkins.github.io/yeet2waifu/draw.html**: a 32×32 canvas in the game's palette with pencil,
eraser, fill, color picker, selection, rectangle and circle (outlined or filled), brush sizes 1 to 4, mirror, undo
and a body guide. You see her breathing on her balcony at stream size while you draw. **Use her** puts her in your
OBS link; **Copy code** gives you her waifu code to share; **Save GIF** makes a timelapse of every stroke.
Every waifu you draw saves itself in **My waifus** (in your browser): open one to keep editing, start a new one,
or delete it (it asks first). They also show up next to the house waifus on the setup page.

Keys: B pencil, E eraser, G fill, I picker, S select, R rectangle, O circle, F filled shapes, 1 to 4 brush size,
M mirror, Ctrl+Z / Ctrl+Y. With a selection: drag inside to move it (Alt copies), arrows nudge, H flips, Delete
erases, Ctrl+C / Ctrl+X / Ctrl+V, Enter drops it.

## Waifus
Five come with the game: **Hana** (the sweetheart with the big red bow), **Rosa** (the princess in pink),
**Momo** (cat hoodie, toy hammer), **Aoi** (blue knight with a tiara) and **Kuro** (a bratty little demon).
Any 32×32 waifu also fits in a **waifu code**, a short text you put after `waifu=` in the URL or send with
`!y2w waifu <code>`. Codes are how custom waifus travel: share yours.

## How a match goes
1. Sign-ups (45 s, capped). Few people? House bots fill the field.
2. Each round is a new map; big chats fly in heats. Whoever rests inside the basket goes through, the rest
   stay where they fell and become terrain for the next heat (unless they fell into a pit).
3. The final is at her balcony. Several make it? She picks one.

## Develop
```
npm install
npm test                         # rules, chat parsing, whole simulated matches
node tools/medir_mapas.mjs       # how often random vs aimed shots get in, per map
node tools/medir_partidas.mjs    # whole-match funnel: rounds, length, how often someone wins
```
Serve the folder with any static server: `index.html` is the setup page, `play.html?demo=1` the game with a fake chat.

Levels are drawn as text: `src/maps.js` (tile grids) + `src/art/` (tiles, props, chibis, waifus as rows of
palette letters). `node tools/preview_all.mjs out 3` renders every level to PNG with hard pixels.

## License
**Free to play, all rights reserved.** You can use yeet2waifu on your streams and videos (monetized too) from the
official site, share clips with the credit visible, and share the waifus you draw. You cannot copy, modify, host,
embed, sell or rebrand it, remove the credit, or use it to train AI. The full terms are in [LICENSE](LICENSE).

## Credits
- Physics: [planck.js](https://github.com/piqnt/planck.js) (MIT), vendored in `vendor/`.
- Palette: [ENDESGA 32](https://lospec.com/palette-list/endesga-32) by Endesga.
- Fonts (SIL Open Font License, in `vendor/fonts/`): Press Start 2P by CodeMan38, Silkscreen by Jason Kottke,
  Tiny5 by Stefan Schmidt, Fredoka by The Fredoka Project Authors.
- Every sprite, tile and character is original.
