# Buddy sprite sheet

A viewer for the study buddy — a ginger Maine Coon in a sage firefly
headband. **Not part of the extension** — exclude this folder from the Chrome
Web Store zip.

There is nothing to export any more. `buddy.js` (in the repository root)
describes every part of the cat with shapes — superellipses, triangles, thick
curves for the tail and legs, one-pixel curves for the whiskers and antenna
stalks — plus a few hand-placed pixels for the eyes, nose and mouth, and
rasterises them into canvases when the page opens. This page loads the same
`buddy.js` and lays every frame out zoomed, on the Midnight, Daylight and
Sage backgrounds, so a change can be judged before opening the panel.

## Editing the art

1. Serve the repository root (any static server) and open
   `tools/buddy-sprite/index.html`. A plain `file://` works for looking too.
2. Change the shapes in `buddy.js` and reload. The sheet shows the standing
   frame and all eight walking frames, the sitting cat with every eye (open,
   looking, half-shut, blinking, purring) and with the bulbs off, and the
   sleeping cat.
3. Open the side panel, or `index.html` served from the root, to see it move.

Things that are easy to break:

- **One head for every pose.** `drawHead()` is shared, so the face cannot
  drift between poses. It faces the viewer and stays symmetric, because the
  cat is mirrored when it turns round.
- **Legs grow out of the body.** Far legs are drawn whole behind the body;
  near legs sit in front, and their rim only starts below the belly
  (`outline(..., { from })`). Outlined all round, a leg gets a dark cap and
  reads as a stick propped under the cat.
- **`fillHoles()` before every outline.** Overlapping parts leave little
  enclosed pockets that the outline would otherwise ring into pinholes.
- **Every pose stands on the ground row (57).** A tail lying on the floor
  slips below it easily, and then the cat floats above its own tail.
- **Moving parts are separate layers.** The tail, the tip of a sitting cat's
  tail, the whiskers and each antenna rotate about a pivot set in `buddy.js`
  (`WALK.tailBase`, `SIT.tipBase`, `LIE.tipBase`, `HEAD.whiskerRoots`,
  `HEAD.antennaBases`). Move a part and move its pivot with it.

Letters in the grids are colours, listed in `PALETTE` in `buddy.js`. The coat
and the sage headband stay the same in every theme.

`window.save(name)` and `window.saveHead(eyes, name)` post a PNG to a local
server that accepts `POST /__save?path=…`, handy for comparing versions;
otherwise right-click the canvas and save it.
