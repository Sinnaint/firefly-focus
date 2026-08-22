# Buddy sprite generator

Authoring tool for the study-buddy capybara. **Not part of the extension** —
exclude this folder from the Chrome Web Store zip.

The sprite in `shared.js` (`BUDDY_BODY`, `BUDDY_WING`, `BUDDY_ANTENNAE`,
`BUDDY_LEGS`) is a set of character grids. Typing them by hand gives lumpy
curves and no consistent dark rim, so they are rasterised from shapes instead:
`shapes.js` describes the capybara as superellipses, and `index.html` paints
them onto a 56x52 grid, adds the silhouette outline, and draws the result
zoomed so it can be judged.

## Editing the art

1. Open `index.html` in a browser (a plain `file://` works for viewing).
2. Change the shapes in `shapes.js` and reload — the canvas shows both leg
   frames composited.
3. When it looks right, run this in the console to get the grid strings:

```js
(() => {
  const SHIFT = 7, WIDTH = 46;
  const trim = (rows, y0, y1) => rows.slice(y0, y1 + 1)
    .map((r) => r.slice(SHIFT, SHIFT + WIDTH).padEnd(WIDTH, "."));
  const fmt = (rows) => rows.map((r) => '  "' + r + '",').join("\n");
  return Object.entries({
    body: trim(OUT.body, 7, 43), wing: trim(OUT.wing, 3, 22),
    ant: trim(OUT.ant, 0, 11), legsA: trim(OUT.legsA, 0, 11), legsB: trim(OUT.legsB, 0, 11)
  }).map(([k, v]) => "### " + k + "\n" + fmt(v)).join("\n\n");
})()
```

4. Paste each block into the matching constant in `shared.js`. Every row must
   keep the same width, and `BUDDY_OFFSETS` must match the trim ranges above.

Letters are CSS class names, not colours — the palette lives in
`sidepanel.css`, so the costume keeps following `--accent`.
