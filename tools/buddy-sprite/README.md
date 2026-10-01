# Buddy sprite generator

Authoring tool for the study buddy — a ginger Maine Coon in a firefly
headband. **Not part of the extension** — exclude this folder from the Chrome
Web Store zip.

The sprite in `shared.js` (`BUDDY_STAND`, `BUDDY_TAIL`, `BUDDY_SIT`,
`BUDDY_LIE`, `BUDDY_ANTENNAE`, `BUDDY_LEGS`) is a set of character grids.
Typing them by hand gives lumpy curves and no consistent dark rim, so they are
rasterised from shapes instead: `shapes.js` describes each pose with
superellipses, triangles (ears) and tubes along curves (the tail), and
`index.html` paints them onto a 56×52 grid, adds the silhouette outline, and
draws the result zoomed so it can be judged.

The three poses share `catHead()`, `catHeadShade()` and `catFace()`, so the
head stays the same cat whatever the body is doing. Change one of those and
all three poses follow. Parts that overlap the body — the wrapped tail, the
sitting front legs, the paws under the sleeping chin — go through `part()`,
which outlines them on their own first; otherwise they melt into the body.

## Editing the art

1. Serve the repository root (any static server) and open
   `tools/buddy-sprite/index.html`. A plain `file://` also works for looking.
2. Change the shapes in `shapes.js` and reload — the canvas shows the two walk
   frames, the sitting pose and the sleeping pose side by side, on a padded
   top so the antennae of a raised head stay in view.
3. Keep every pose on the ground line (row 47) and the sitting cat upright —
   chest stacked over the haunch, not leaning off it.
4. When it looks right, run this in the console to get the grid strings:

```js
(() => {
  const SHIFT = 4, WIDTH = 50;
  const trim = (rows, y0, y1) => rows.slice(y0, y1 + 1)
    .map((r) => r.slice(SHIFT, SHIFT + WIDTH).padEnd(WIDTH, "."));
  const fmt = (rows) => rows.map((r) => '  "' + r + '",').join("\n");
  return Object.entries({
    stand: trim(OUT.stand, 0, 47), sit: trim(OUT.sit, 0, 47), lie: trim(OUT.lie, 0, 47),
    tail: trim(OUT.tail, 6, 29), ant: trim(OUT.ant, 0, 11),
    legsA: trim(OUT.legsA, 0, 13), legsB: trim(OUT.legsB, 0, 13)
  }).map(([k, v]) => "### " + k + "\n" + fmt(v)).join("\n\n");
})()
```

5. Paste each block into the matching constant in `shared.js`. Every row must
   keep the same width, and `BUDDY_OFFSETS` must match the trim ranges above
   (tail from row 6, legs at row 34).
6. If a head moved, update that pose's `antennae` delta in `BUDDY_POSES`
   (`OUT.POSE` prints them) and its `eye` — the top-left of the 3×2 open eye,
   in trimmed coordinates — or the headband floats off and the blink lands
   beside the eye.

Letters are CSS class names, not colours — the palette lives in
`sidepanel.css`, so the headband keeps following `--accent`.
