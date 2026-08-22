# Buddy sprite generator

Authoring tool for the study-buddy capybara. **Not part of the extension** —
exclude this folder from the Chrome Web Store zip.

The sprite in `shared.js` (`BUDDY_STAND`, `BUDDY_SIT`, `BUDDY_LIE`,
`BUDDY_WING`, `BUDDY_ANTENNAE`, `BUDDY_LEGS`) is a set of character grids.
Typing them by hand gives lumpy curves and no consistent dark rim, so they are
rasterised from shapes instead: `shapes.js` describes each pose as
superellipses, and `index.html` paints them onto a 56x52 grid, adds the
silhouette outline, and draws the result zoomed so it can be judged.

The three poses share `face()` and `faceMarks()`, so the head stays the same
animal no matter what the body is doing. Change one of those and all three
poses follow.

## Editing the art

1. Open `index.html` in a browser (a plain `file://` works for viewing).
2. Change the shapes in `shapes.js` and reload — the canvas shows the two walk
   frames, the sitting pose and the lying pose side by side.
3. When it looks right, run this in the console to get the grid strings:

```js
(() => {
  const SHIFT = 5, WIDTH = 49;
  const trim = (rows, y0, y1) => rows.slice(y0, y1 + 1)
    .map((r) => (".".repeat(SHIFT) + r).slice(SHIFT * 2, SHIFT * 2 + WIDTH).padEnd(WIDTH, "."));
  const fmt = (rows) => rows.map((r) => '  "' + r + '",').join("\n");
  return Object.entries({
    stand: trim(OUT.stand, 5, 47), sit: trim(OUT.sit, 5, 47), lie: trim(OUT.lie, 5, 47),
    wing: trim(OUT.wing, 3, 22), ant: trim(OUT.ant, 0, 11),
    legsA: trim(OUT.legsA, 0, 11), legsB: trim(OUT.legsB, 0, 11)
  }).map(([k, v]) => "### " + k + "\n" + fmt(v)).join("\n\n");
})()
```

4. Paste each block into the matching constant in `shared.js`. Every row must
   keep the same width, and `BUDDY_OFFSETS` must match the trim ranges above.
5. If a pose's shoulder or crown moved, update its `wing` / `antennae` deltas
   in `BUDDY_POSES` — those are what keep the costume attached to the body.

Letters are CSS class names, not colours — the palette lives in
`sidepanel.css`, so the costume keeps following `--accent`.
