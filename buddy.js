/*
 * Study buddy — a pixel-art ginger Maine Coon in a sage firefly headband.
 * It paces along the bottom of the timer while a session runs, sits down the
 * moment the timer stops, and if it stays stopped curls up and falls asleep.
 *
 * Two halves:
 *
 * The art is not stored as pictures. Every part is described with shapes
 * (superellipses, triangles, thick curves) and a few hand-placed pixel stamps
 * for the face, then rasterised once per page into small canvases at one
 * canvas pixel per art pixel. CSS scales them up with
 * `image-rendering: pixelated`, so the pixels stay hard at any size, and the
 * scale is rounded to a whole number of device pixels per art pixel so they
 * also stay even.
 *
 * The engine stacks those canvases as layers — tail, legs, body, head,
 * whiskers, two antennae — and moves each one by transform only, from one
 * requestAnimationFrame loop: breathing on a cubic-bezier curve, a head that
 * follows the body with a little lag, antennae on springs driven by that
 * head, a tail that swings behind the body, random blinks. The loop stops
 * whenever the cat cannot be seen (page hidden, scrolled away, switched off).
 *
 * tools/buddy-sprite/index.html lays every frame out zoomed — use it to judge
 * a change to the art before opening the panel.
 */
const FireflyBuddy = (() => {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Frame and palette                                                    */
  /* ------------------------------------------------------------------ */

  /*
   * Every body layer is one 68×66 canvas. Drawing happens in "logical"
   * coordinates, where the paws stand on row 57; logical (0, 0) sits at
   * (FRAME.ox, FRAME.oy) inside the canvas, which leaves headroom for the
   * antennae of a sitting cat and a little room either side for whiskers.
   */
  const FRAME = { w: 68, h: 66, ox: 2, oy: 6 };
  const GROUND = 57;
  // The lane reserves this many rows; the top few are headroom the antennae
  // may swing into, so they overflow the lane instead of padding it.
  const LANE_ROWS = 62;
  // --buddy-size is matched against this many art pixels across.
  const NOMINAL_W = 64;
  // How long the timer has to stay stopped before the cat lies down to sleep.
  const DOZE_AFTER_MS = 14000;

  /*
   * Letters are colours. The coat never follows the theme — this is a
   * character, not chrome — and the headband is sage in every theme too.
   */
  const PALETTE = {
    o: "#3b1609", // rim on the shadow side
    q: "#7a3212", // rim on edges that face the light (top)
    d: "#b3501d", // tabby stripes, shade, far legs
    f: "#e3792d", // ginger coat
    l: "#f5a259", // lit fur
    u: "#ffcf8d", // sheen on the crown and the back
    c: "#fde8c9", // cream: muzzle, ruff, paws
    C: "#e9c39b", // cream in shadow
    p: "#f39aa1", // nose, inner ear
    P: "#c96a7b", // tip of the nose
    b: "#f7907f", // blush
    k: "#1a0e09", // eye rim, pupil
    1: "#2c6a25", // iris under the lid
    2: "#58ad33", // iris
    3: "#a4de57", // iris, lit from below
    4: "#e4fbb0", // glint
    W: "#ffffff", // highlight
    n: "#4a1d0e", // mouth
    w: "rgba(255, 246, 232, 0.92)", // whiskers on a dark page
    v: "rgba(92, 50, 30, 0.78)", // whiskers on a light page
    // the costume
    g: "#2f3c2c", // band rim
    S: "#5d7456", // band in shade, antenna stalk
    s: "#8fa985", // sage
    t: "#c5d8bb", // band highlight
    m: "#748a6c", // bulb, switched off
    M: "#9fb495", // bulb, switched off — highlight
    y: "#b9eca3", // bulb, lit
    Y: "#f4ffee", // bulb, lit — core
    z: "rgba(36, 14, 6, 0.24)", // ground shadow
  };

  /* ------------------------------------------------------------------ */
  /* Grids                                                               */
  /* ------------------------------------------------------------------ */

  /*
   * A grid is { w, h, ox, oy, c }: c holds one letter per cell ("." is
   * empty) and (ox, oy) is where logical (0, 0) sits. Shapes are drawn in
   * logical coordinates; only canvases care about the raw ones.
   */
  const grid = (w, h, ox = 0, oy = 0) => ({ w, h, ox, oy, c: new Array(w * h).fill(".") });
  const frameGrid = () => grid(FRAME.w, FRAME.h, FRAME.ox, FRAME.oy);
  const clone = (g) => ({ ...g, c: g.c.slice() });

  function at(g, x, y) {
    const rx = x + g.ox;
    const ry = y + g.oy;
    return rx < 0 || ry < 0 || rx >= g.w || ry >= g.h ? undefined : g.c[ry * g.w + rx];
  }

  function put(g, x, y, key) {
    const rx = x + g.ox;
    const ry = y + g.oy;
    if (rx >= 0 && ry >= 0 && rx < g.w && ry < g.h) g.c[ry * g.w + rx] = key;
  }

  const isFilled = (g, x, y) => {
    const key = at(g, x, y);
    return key !== undefined && key !== ".";
  };

  /* Superellipse, optionally rotated; `mask(x, y, current)` limits where it paints. */
  function blob(g, cx, cy, rx, ry, key, n = 2, angle = 0, mask = null) {
    const a = (angle * Math.PI) / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const r = Math.max(rx, ry) + 1;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
        const px = x + 0.5 - cx;
        const py = y + 0.5 - cy;
        const dx = (px * ca + py * sa) / rx;
        const dy = (-px * sa + py * ca) / ry;
        if (Math.abs(dx) ** n + Math.abs(dy) ** n > 1) continue;
        if (mask && !mask(x, y, at(g, x, y))) continue;
        put(g, x, y, key);
      }
    }
  }

  /* Same, but only over cells already painted — shading. */
  const shade = (g, cx, cy, rx, ry, key, n = 2, angle = 0, only = null) =>
    blob(g, cx, cy, rx, ry, key, n, angle, (x, y, k) => k !== "." && k !== undefined && (!only || only(k)));

  function tri(g, ax, ay, bx, by, cx, cy, key, mask = null) {
    const side = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
    for (let y = Math.floor(Math.min(ay, by, cy)); y <= Math.ceil(Math.max(ay, by, cy)); y += 1) {
      for (let x = Math.floor(Math.min(ax, bx, cx)); x <= Math.ceil(Math.max(ax, bx, cx)); x += 1) {
        const px = x + 0.5;
        const py = y + 0.5;
        const d1 = side(px, py, ax, ay, bx, by);
        const d2 = side(px, py, bx, by, cx, cy);
        const d3 = side(px, py, cx, cy, ax, ay);
        if ((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)) continue;
        if (mask && !mask(x, y, at(g, x, y))) continue;
        put(g, x, y, key);
      }
    }
  }

  const bezier = (p0, p1, p2, t) => [
    (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  ];

  /* A thick stroke along a quadratic curve; radius(t) for t in 0..1. */
  function tube(g, p0, p1, p2, radius, key, mask = null) {
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const [x, y] = bezier(p0, p1, p2, t);
      const r = radius(t);
      blob(g, x, y, r, r, key, 2, 0, mask);
    }
  }

  /* A one-pixel line along a quadratic curve. */
  function wire(g, p0, p1, p2, key) {
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const [x, y] = bezier(p0, p1, p2, t);
      put(g, Math.floor(x), Math.floor(y), key);
    }
  }

  /* Repaint cells that are already painted and pass test(x, y, key). */
  function paintIf(g, key, test) {
    for (let ry = 0; ry < g.h; ry += 1) {
      for (let rx = 0; rx < g.w; rx += 1) {
        const k = g.c[ry * g.w + rx];
        if (k !== "." && test(rx - g.ox, ry - g.oy, k)) g.c[ry * g.w + rx] = key;
      }
    }
  }

  /* Lay `src` over `dst`, its logical origin landing on (dx, dy). */
  function stamp(dst, src, dx = 0, dy = 0) {
    for (let ry = 0; ry < src.h; ry += 1) {
      for (let rx = 0; rx < src.w; rx += 1) {
        const k = src.c[ry * src.w + rx];
        if (k !== ".") put(dst, rx - src.ox + dx, ry - src.oy + dy, k);
      }
    }
  }

  /* Hand-placed pixels: rows of letters, "." transparent. */
  function stampRows(dst, rows, x0, y0) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) if (row[x] !== ".") put(dst, x0 + x, y0 + y, row[x]);
    });
  }

  /* Empty cells the outside cannot reach — overlapping parts leave pockets
     that the outline would otherwise ring into pinholes. */
  function fillHoles(g, key) {
    const outside = new Uint8Array(g.w * g.h);
    const stack = [];
    for (let x = 0; x < g.w; x += 1) stack.push(x, 0, x, g.h - 1);
    for (let y = 0; y < g.h; y += 1) stack.push(0, y, g.w - 1, y);
    while (stack.length) {
      const y = stack.pop();
      const x = stack.pop();
      if (x < 0 || y < 0 || x >= g.w || y >= g.h) continue;
      const i = y * g.w + x;
      if (outside[i] || g.c[i] !== ".") continue;
      outside[i] = 1;
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    for (let i = 0; i < g.c.length; i += 1) if (g.c[i] === "." && !outside[i]) g.c[i] = key;
  }

  /*
   * Every painted cell that touches empty space becomes rim. Edges facing up
   * get the lighter rim — selective outlining — so the sprite reads as lit
   * from above instead of cut out with a marker. Rows above `from` (logical)
   * keep no rim at all: that part melts into whatever it overlaps.
   */
  function outline(g, { from = -Infinity } = {}) {
    const out = clone(g);
    const filled = (x, y) => x >= 0 && y >= 0 && x < g.w && y < g.h && g.c[y * g.w + x] !== ".";
    for (let y = 0; y < g.h; y += 1) {
      if (y - g.oy < from) continue;
      for (let x = 0; x < g.w; x += 1) {
        if (!filled(x, y)) continue;
        const up = !filled(x, y - 1);
        const down = !filled(x, y + 1);
        const left = !filled(x - 1, y);
        const right = !filled(x + 1, y);
        if (!(up || down || left || right)) continue;
        out.c[y * g.w + x] = up && !down && !(left && right) ? "q" : "o";
      }
    }
    return out;
  }

  /* A part outlined on its own before it is laid over the rest. */
  function part(paint, options) {
    const g = frameGrid();
    paint(g);
    fillHoles(g, "f");
    return outline(g, options);
  }

  /* ------------------------------------------------------------------ */
  /* The head — one drawing for every pose                               */
  /* ------------------------------------------------------------------ */

  /*
   * Facing the viewer, so both eyes and the smile read at a glance, on a body
   * seen from the side. Symmetric on purpose: when the cat turns round at the
   * end of a lap, the mirrored head is still the same face.
   */
  const HEAD_W = 26;
  const HEAD_H = 30;
  const HCX = 13; // the face's centre column
  const HCY = 15; // the row each pose's head anchor refers to
  const SKULL = { cy: 15.8, rx: 9.1, ry: 8.2, n: 2.6 };

  // Where things sit on the head, in head coordinates.
  const HEAD = {
    eyes: [[6, 13], [15, 13]], // top-left of each 5×6 eye
    nose: [12, 20],
    mouth: [9, 22],
    whiskerRoots: [[8.5, 22.5], [17.5, 22.5]],
    antennaBases: [[9.5, 8.5], [16.5, 8.5]], // on top of the band
  };

  const headGrid = () => grid(HEAD_W, HEAD_H + 2, 0, 2); // two rows above for the ear tufts

  /* Top edge of the skull in column x, from its own equation. */
  function skullTop(x) {
    const dx = Math.abs(x + 0.5 - HCX) / SKULL.rx;
    if (dx >= 1) return null;
    return SKULL.cy - SKULL.ry * (1 - dx ** SKULL.n) ** (1 / SKULL.n);
  }

  function headSilhouette(g) {
    // Ears first, so the skull covers their bases. Tall, set wide and
    // leaning out a little, with room between them for the band and the
    // antennae; the outer base lands on the skull so no corner pokes out.
    tri(g, 5.0, 11.4, 10.4, 7.2, 3.4, 0.4, "f");
    tri(g, 21.0, 11.4, 15.6, 7.2, 22.6, 0.4, "f");
    blob(g, HCX, SKULL.cy, SKULL.rx, SKULL.ry, "f", SKULL.n); // skull
    blob(g, HCX, 21.2, 10.8, 5.2, "f", 2.3); // cheek ruff — the Maine Coon jowls
    // tufts sticking out of the ruff
    tri(g, 3.2, 18.6, 4.0, 22.6, 0.4, 22.8, "f");
    tri(g, 22.8, 18.6, 22.0, 22.6, 25.6, 22.8, "f");
    tri(g, 5.0, 24.0, 8.6, 25.0, 5.8, 27.2, "f");
    tri(g, 21.0, 24.0, 17.4, 25.0, 20.2, 27.2, "f");
  }

  function headShading(g) {
    const notEmpty = (x, y, k) => k !== "." && k !== undefined;
    shade(g, HCX, 11.4, 8.2, 3.6, "l", 2.2); // lit crown
    shade(g, HCX, 10.4, 4.6, 1.4, "u", 2); // sheen
    // inner ears, with a cream tuft of ear furnishings
    tri(g, 5.7, 10.0, 9.0, 7.8, 4.3, 2.8, "p", (x, y, k) => k === "f" || k === "l");
    tri(g, 20.3, 10.0, 17.0, 7.8, 21.7, 2.8, "p", (x, y, k) => k === "f" || k === "l");
    stampRows(g, ["c.", ".c", "c."], 5, 7);
    stampRows(g, [".c", "c.", ".c"], 19, 7);
    // tabby "M" on the forehead, under the band
    stampRows(g, ["d.d.d", "d.d.d", ".d.d."], 11, 10);
    // cheek stripes
    stampRows(g, ["dd", "..d"], 3, 18);
    stampRows(g, [".dd", "d"], 21, 18);
    // cream muzzle: two whisker pads and the chin
    blob(g, 10.8, 22.7, 3.3, 2.5, "c", 2.2, 0, notEmpty);
    blob(g, 15.2, 22.7, 3.3, 2.5, "c", 2.2, 0, notEmpty);
    blob(g, HCX, 25.3, 3.4, 2.1, "c", 2.2, 0, notEmpty);
    shade(g, HCX, 26.6, 3.8, 1.2, "C", 2, 0, (k) => k === "c");
  }

  /* 5×6 eyes. One set of pixels for both, so the highlights agree. */
  const EYES = {
    open: [
      ".kkk.",
      "k111k",
      "kWk2k",
      "k2k2k",
      "k3k4k",
      ".kkk.",
    ],
    look: [ // pupils turned toward the way it is going
      ".kkk.",
      "k111k",
      "kW2kk",
      "k22kk",
      "k33k4",
      ".kkk.",
    ],
    half: [
      ".....",
      ".....",
      "kkkkk",
      "kWk2k",
      "k3k4k",
      ".kkk.",
    ],
    shut: [ // a blink, or asleep: the lid line curves down
      ".....",
      ".....",
      ".....",
      "k...k",
      ".kkk.",
      ".....",
    ],
    happy: [ // purring: ^ ^
      ".....",
      ".....",
      ".kkk.",
      "k...k",
      ".....",
      ".....",
    ],
  };

  const NOSE = ["ppp", ".P."];
  const MOUTH = [
    "....n....",
    ".n..n..n.",
    "..nn.nn..",
  ];

  /*
   * An Alice band over the crown, riding the skull's top edge and crossing in
   * front of the ear bases: a dark rim, sage, then sage in shade.
   */
  function costumeBand(g) {
    for (let x = 0; x < HEAD_W; x += 1) {
      const top = skullTop(x);
      if (top === null || Math.abs(x + 0.5 - HCX) > SKULL.rx - 1.2) continue;
      const y = Math.round(top);
      put(g, x, y - 1, isFilled(g, x, y - 2) ? "S" : "g");
      put(g, x, y, (x + 1) % 5 === 0 ? "t" : "s");
      put(g, x, y + 1, "S");
    }
    // sockets for the antennae
    for (const [bx, by] of HEAD.antennaBases) {
      stampRows(g, [".g.", "gsg"], Math.floor(bx) - 1, Math.floor(by) - 1);
    }
  }

  /* Everything on the head but the eyes and blush — drawn once. */
  let headBase = null;
  function bareHead() {
    if (headBase) return headBase;
    const g = headGrid();
    headSilhouette(g);
    headShading(g);
    fillHoles(g, "f");
    const o = outline(g);
    stampRows(o, NOSE, HEAD.nose[0], HEAD.nose[1]);
    stampRows(o, MOUTH, HEAD.mouth[0], HEAD.mouth[1]);
    // lynx tufts — the Maine Coon signature: a dark wisp off each tip
    for (const x of [3, 22]) {
      let y = -2;
      while (y < 8 && !isFilled(o, x, y)) y += 1;
      put(o, x, y - 1, "o");
    }
    costumeBand(o);
    headBase = o;
    return o;
  }

  /* `eyes` — a key of EYES. */
  function drawHead(eyes) {
    const o = clone(bareHead());
    const shapeOfEye = EYES[eyes] || EYES.open;
    for (const [ex, ey] of HEAD.eyes) {
      // a half-shut or shut eye is lid and fur round the line, not a hole
      if (eyes !== "open" && eyes !== "look") {
        for (let y = 0; y < 6; y += 1) {
          for (let x = 0; x < 5; x += 1) {
            if ((y === 0 || y === 5) && (x === 0 || x === 4)) continue;
            put(o, ex + x, ey + y, y < 3 ? "l" : "f");
          }
        }
      }
      stampRows(o, shapeOfEye, ex, ey);
    }
    if (eyes !== "shut") {
      stampRows(o, ["bb"], 4, 20);
      stampRows(o, ["bb"], 20, 20);
    }
    return o;
  }

  /* ------------------------------------------------------------------ */
  /* Antennae and whiskers — their own layers, so they can move          */
  /* ------------------------------------------------------------------ */

  // Bulb centre relative to its base on the band, for the right antenna.
  const ANTENNA_TIP = [3.6, -10.6];
  const antennaGrid = () => grid(34, 26, 4, 10);
  const whiskerGrid = () => grid(46, 32, 10, 2);

  // 5×5 bulbs: a round lamp with a highlight, switched off or lit.
  const BULB = {
    dim: [".mmm.", "mMmmm", "mmmmm", "mmmmS", ".SSS."],
    lit: [".yyy.", "yYYyy", "yYyyy", "yyyyy", ".yyy."],
  };

  /* Top-left of the 5×5 bulb, in head coordinates. */
  function bulbCorner(sideIndex) {
    const side = sideIndex === 0 ? -1 : 1;
    const [bx, by] = HEAD.antennaBases[sideIndex];
    return [Math.round(bx + side * ANTENNA_TIP[0] - 2.5), Math.round(by + ANTENNA_TIP[1] - 2.5)];
  }

  /* A thin sage stalk leaning out from the band, with a round bulb on top. */
  function drawAntenna(sideIndex, lit) {
    const g = antennaGrid();
    const side = sideIndex === 0 ? -1 : 1;
    const [bx, by] = HEAD.antennaBases[sideIndex];
    const [cx, cy] = bulbCorner(sideIndex);
    if (!lit) {
      wire(g, [bx, by - 1], [bx - side * 0.4, cy + 6], [cx + 2.5, cy + 5], "S");
    }
    stampRows(g, lit ? BULB.lit : BULB.dim, cx, cy);
    return g;
  }

  /* Two whiskers a side, fanning out past the cheeks. */
  function drawWhiskers(sideIndex, key) {
    const g = whiskerGrid();
    const side = sideIndex === 0 ? -1 : 1;
    const [rx, ry] = HEAD.whiskerRoots[sideIndex];
    wire(g, [rx, ry - 0.4], [rx + side * 5, ry - 1.6], [rx + side * 9.6, ry - 1.4], key);
    wire(g, [rx, ry + 1.2], [rx + side * 5, ry + 1.4], [rx + side * 9.2, ry + 2.8], key);
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Bodies                                                              */
  /* ------------------------------------------------------------------ */

  /*
   * Tabby stripes: bands running down the flank from the spine, a little
   * curved, thinning toward the belly. Few and broad — thin ones read as
   * hatching at this size.
   */
  function stripes(g, xs, { top = 0, bottom = 99, bend = 0.06, width = 0.95, y0 = 40 } = {}) {
    paintIf(g, "d", (x, y, k) =>
      (k === "f" || k === "l") && y > top && y < bottom &&
      xs.some((x0) => Math.abs(x - x0 - (y - y0) ** 2 * bend * Math.sign(y - y0)) <
        width - ((y - top) / (bottom - top)) * 0.45));
  }

  /* Long fur hanging off the belly. */
  function fringe(g, xs, y, key = "f") {
    for (const x of xs) tri(g, x - 1.4, y, x + 1.4, y, x + 0.4, y + 2.8, key);
  }

  /* A bushy ringed tail along a curve. */
  function bushyTail(g, p0, p1, p2, radius, rings) {
    tube(g, p0, p1, p2, radius, "f");
    for (const t of rings) {
      const [x, y] = bezier(p0, p1, p2, t);
      const [x2, y2] = bezier(p0, p1, p2, Math.min(1, t + 0.01));
      const angle = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
      shade(g, x, y, 0.9, radius(t) + 1.5, "d", 2, angle, (k) => k === "f" || k === "l");
    }
  }

  /* ---------------- Walking ---------------- */

  const WALK = {
    head: [46, 24], // where the head's (HCX, HCY) lands
    tailBase: [14.5, 37.5],
    // hip, resting foot column and place in the gait of each leg
    legs: {
      farHind: { hip: [21.5, 44], foot: 22, phase: 0.5, key: "d" },
      farFront: { hip: [38, 44], foot: 39, phase: 0.75, key: "d" },
      nearHind: { hip: [18.5, 45], foot: 18.5, phase: 0, key: "f" },
      nearFront: { hip: [41, 45], foot: 42, phase: 0.25, key: "f" },
    },
    frames: 8,
    stride: 2.5, // a foot travels ±stride while it is on the ground
    stance: 0.62, // share of the cycle a foot spends on the ground
  };
  // Ground covered by one full cycle of the gait, so the paws never slide.
  const CYCLE_DISTANCE = (2 * WALK.stride) / WALK.stance;

  function walkBody() {
    const g = frameGrid();
    blob(g, 29, 41.6, 13.6, 7.4, "f", 2.4); // body
    blob(g, 19.4, 40.6, 7.6, 8.2, "f", 2.2); // rump
    blob(g, 38.6, 41.2, 7.4, 8.8, "f", 2.2); // deep chest
    fringe(g, [23, 27, 31], 47.8);
    fringe(g, [37.5, 41], 49.2, "c");
    // the head covers the shoulders; this is the neck under it
    blob(g, 43.6, 34.6, 5.4, 6.2, "f", 2.2);

    shade(g, 28.5, 35.2, 12.6, 2.8, "l", 2.2);
    shade(g, 27.5, 34, 9, 1.1, "u", 2);
    stripes(g, [21, 26, 31, 35.5], { top: 33, bottom: 45, y0: 33 });
    shade(g, 41.6, 43.2, 4.6, 6.8, "c", 2.2); // cream ruff
    shade(g, 40, 47.4, 2.4, 2.6, "C", 2, 0, (k) => k === "c");
    fillHoles(g, "f");
    return outline(g);
  }

  function walkTail() {
    return part((g) => {
      bushyTail(g, WALK.tailBase, [3, 32], [8.5, 14.5],
        (t) => 2.9 + Math.sin(t * Math.PI) * 1.2 - t * 0.9, [0.3, 0.52, 0.72, 0.9]);
      shade(g, 7, 26, 3, 6, "l", 2, 20, (k) => k === "f");
    });
  }

  /*
   * One leg from hip to foot. Hind legs are thicker at the top; every foot
   * ends in a cream paw. `lift` raises the paw while it swings forward.
   */
  function leg(g, hip, footX, lift, key, hind) {
    const foot = [footX, GROUND - 1.6 - lift];
    const knee = [(hip[0] + footX) / 2 + (hind ? -1.2 : 0.4), (hip[1] + foot[1]) / 2];
    tube(g, hip, knee, foot, (t) => (hind ? 3.4 - t * 1.1 : 2.7 - t * 0.4), key);
    blob(g, footX + 0.9, GROUND - 0.9 - lift, 2.9, 1.6, "c", 2.2);
  }

  /* Where a foot is in a frame of the gait; frame null = standing square. */
  function footAt(spec, frame) {
    if (frame === null) return { x: spec.foot, lift: 0 };
    const p = (frame / WALK.frames + spec.phase) % 1;
    if (p < WALK.stance) {
      const s = p / WALK.stance;
      return { x: spec.foot + WALK.stride * (1 - 2 * s), lift: 0 };
    }
    const s = (p - WALK.stance) / (1 - WALK.stance);
    return { x: spec.foot - WALK.stride + 2 * WALK.stride * s, lift: Math.sin(s * Math.PI) * 1.6 };
  }

  /*
   * Far legs are drawn whole, behind the body. Near legs sit in front of it,
   * and their rim only starts below the belly, so they grow out of the body
   * instead of hanging under it like sticks.
   */
  function walkLegs(frame, near) {
    const out = frameGrid();
    const names = near ? ["nearHind", "nearFront"] : ["farHind", "farFront"];
    for (const name of names) {
      const spec = WALK.legs[name];
      const { x, lift } = footAt(spec, frame);
      const one = frameGrid();
      leg(one, spec.hip, x, lift, spec.key, name.endsWith("Hind"));
      fillHoles(one, spec.key);
      stamp(out, outline(one, { from: near ? 48 : -Infinity }));
    }
    return out;
  }

  /* ---------------- Sitting ---------------- */

  /*
   * Traced from a photo of a cat sitting in profile: one tall body leaning
   * forward with a rounded back, long front legs straight down from the
   * chest, the hind paw flat on the ground, the tail out behind along the
   * floor with its tip curled up.
   */
  const SIT = {
    head: [45, 20],
    tipBase: [8.2, 52], // where the curled tip of the tail leaves the floor
  };

  function frontLeg(g, x, top, key) {
    blob(g, x, (top + GROUND - 1) / 2, 2.7, (GROUND - 1 - top) / 2 + 0.4, key, 2.4);
    blob(g, x + 1, GROUND - 0.9, 3.2, 1.6, "c", 2.2);
  }

  function sitBody() {
    const g = frameGrid();
    // the tail lying along the floor; its curled tip is a layer of its own
    stamp(g, part((p) => bushyTail(p, [24, 53.2], [9, 59.2], [7.6, 50.5],
      (t) => 2.6 - t * 0.8 + Math.sin(t * Math.PI) * 0.4, [0.36, 0.6, 0.84])));
    blob(g, 38.6, 56, 4.8, 1.8, "f", 2.2); // hind paw flat on the ground
    blob(g, 42.2, 56.2, 2.1, 1.4, "c", 2);
    frontLeg(g, 50.2, 38, "d"); // far front leg, a touch ahead

    blob(g, 31, 47.6, 10.6, 9.4, "f", 2.2); // haunch
    blob(g, 41.8, 50.8, 3.8, 4.4, "f", 2.2); // belly bridge
    blob(g, 36, 39.4, 9.4, 12.8, "f", 2.2, 30); // torso leaning forward
    blob(g, 41.4, 31.2, 6.8, 6.4, "f", 2.2); // shoulders
    blob(g, 31.4, 38.2, 7, 7.4, "f", 2.2); // rounds the back out
    blob(g, 46.6, 38.2, 4.8, 8.4, "f", 2.2, -6); // chest running into the legs

    shade(g, 33.6, 31.4, 4.6, 3.8, "l", 2.2);
    shade(g, 26.6, 41.6, 7, 3, "l", 2.2);
    shade(g, 32.4, 29.6, 2.4, 1.2, "u", 2);
    // thigh stripes, and flank stripes running round the body — across the
    // spine, not along it, or the leaning back turns into a staircase
    paintIf(g, "d", (x, y, k) => (k === "f" || k === "l") && x >= 21 && x <= 37 && y >= 44 && y <= 53 &&
      [25, 30.5].some((c) => Math.abs(x - c + (y - 49) * 0.3) < 1 - (y - 44) * 0.05));
    paintIf(g, "d", (x, y, k) => (k === "f" || k === "l") && x >= 26 && x <= 40 && y >= 30 && y <= 40 &&
      [29.5, 34.5].some((c) => Math.abs(x - c - (y - 35) * 0.55) < 1 - (y - 30) * 0.04));
    shade(g, 45, 36.5, 3.6, 6, "c", 2.2, 22); // cream bib

    // near front leg: in front of the belly, melting into the chest
    const nearLeg = frameGrid();
    frontLeg(nearLeg, 46.6, 38, "f");
    fillHoles(nearLeg, "f");
    stamp(g, outline(nearLeg, { from: 46 }));

    fillHoles(g, "f");
    return outline(g);
  }

  function sitTip() {
    return part((p) => bushyTail(p, [8.2, 52], [5.2, 47.6], [7.4, 43.4], (t) => 2.1 - t * 0.6, [0.5]));
  }

  /* ---------------- Lying, asleep ---------------- */

  const LIE = {
    head: [47, 41],
    tipBase: [36.5, 55.8],
  };

  function lieBody() {
    const g = frameGrid();
    blob(g, 29, 49.2, 17.4, 8.4, "f", 2.6); // curled body
    blob(g, 48.4, 54.6, 7.4, 2.6, "f", 2.4); // forelegs reaching forward
    blob(g, 54.2, 55.4, 3, 1.7, "c", 2.2); // the paws
    shade(g, 28, 42.4, 15, 3, "l", 2.2);
    shade(g, 27, 41.4, 10, 1.1, "u", 2);
    stripes(g, [16, 21, 26, 31], { top: 41, bottom: 53, y0: 41 });
    // the tail wrapped round the front, in front of the body
    stamp(g, part((p) => bushyTail(p, [13, 50.4], [13.6, 57.6], [37, 55.8],
      (t) => 2.7 + Math.sin(t * Math.PI) * 0.6, [0.3, 0.52, 0.74])));
    fillHoles(g, "f");
    return outline(g);
  }

  function lieTip() {
    return part((p) => bushyTail(p, [36, 55.8], [41.5, 56.4], [43.6, 52.6], (t) => 2.4 - t * 0.6, [0.55]));
  }

  /* A soft pixel shadow under whatever stands on the ground. */
  function groundShadow(cx, halfWidth) {
    const g = frameGrid();
    for (let x = Math.round(cx - halfWidth); x <= Math.round(cx + halfWidth); x += 1) {
      put(g, x, GROUND + 1, "z");
      if (Math.abs(x - cx) < halfWidth - 3) put(g, x, GROUND + 2, "z");
    }
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Building everything once                                            */
  /* ------------------------------------------------------------------ */

  const POSES = { walk: WALK, sit: SIT, lie: LIE };

  /* Where the head grid's logical origin lands in the frame, per pose. */
  const headOffset = (pose) => [POSES[pose].head[0] - HCX, POSES[pose].head[1] - HCY];

  let gridCache = null;

  function buildGrids() {
    if (gridCache) return gridCache;

    const heads = {};
    for (const key of Object.keys(EYES)) heads[key] = drawHead(key);

    // The eight frames of the gait are drawn the first time each is needed:
    // a cat that never walks (the one on websites) never pays for them.
    const legs = [];
    for (let i = 0; i < WALK.frames; i += 1) {
      let frame = null;
      Object.defineProperty(legs, i, {
        get: () => (frame ??= { far: walkLegs(i, false), near: walkLegs(i, true) }),
        enumerable: true,
      });
    }
    legs.stand = { far: walkLegs(null, false), near: walkLegs(null, true) };

    gridCache = {
      heads,
      antennae: [0, 1].map((i) => ({ dim: drawAntenna(i, false), lit: drawAntenna(i, true) })),
      whiskers: {
        night: [drawWhiskers(0, "w"), drawWhiskers(1, "w")],
        day: [drawWhiskers(0, "v"), drawWhiskers(1, "v")],
      },
      walk: { body: walkBody(), tail: walkTail(), legs, shadow: groundShadow(30, 19) },
      sit: { body: sitBody(), tip: sitTip(), shadow: groundShadow(33, 21) },
      lie: { body: lieBody(), tip: lieTip(), shadow: groundShadow(33, 22) },
    };
    return gridCache;
  }

  /*
   * One pose flattened into a single frame grid — for the sprite sheet in
   * tools/, and for telling whether a click landed on the cat.
   */
  function compose(pose, { frame = "stand", eyes = null, lit = true, day = false, costume = true } = {}) {
    const A = buildGrids();
    const P = A[pose];
    const g = frameGrid();
    const [hx, hy] = headOffset(pose);
    stamp(g, P.shadow);
    if (pose === "walk") {
      const legs = P.legs[frame] || P.legs.stand;
      stamp(g, P.tail);
      stamp(g, legs.far);
      stamp(g, P.body);
      stamp(g, legs.near);
    } else {
      stamp(g, P.body);
      stamp(g, P.tip);
    }
    stamp(g, A.heads[eyes || (pose === "lie" ? "shut" : "open")], hx, hy);
    if (costume) {
      for (const w of A.whiskers[day ? "day" : "night"]) stamp(g, w, hx, hy);
      for (const a of A.antennae) {
        stamp(g, a.dim, hx, hy);
        if (lit) stamp(g, a.lit, hx, hy);
      }
    }
    return g;
  }

  /* Palette letters as RGBA bytes, parsed once. */
  let paletteRgba = null;
  function rgbaOf(key) {
    if (!paletteRgba) {
      paletteRgba = {};
      for (const [k, color] of Object.entries(PALETTE)) {
        const hex = /^#([0-9a-f]{6})$/i.exec(color);
        if (hex) {
          const n = parseInt(hex[1], 16);
          paletteRgba[k] = [n >> 16, (n >> 8) & 255, n & 255, 255];
        } else {
          const [r, g, b, a = 1] = color.match(/[\d.]+/g).map(Number);
          paletteRgba[k] = [r, g, b, Math.round(a * 255)];
        }
      }
    }
    return paletteRgba[key];
  }

  /* A grid as pixels, one per cell. */
  function gridToImage(g) {
    const image = new ImageData(g.w, g.h);
    const px = image.data;
    for (let i = 0; i < g.c.length; i += 1) {
      const key = g.c[i];
      if (key === ".") continue;
      const rgba = rgbaOf(key);
      if (rgba) px.set(rgba, i * 4);
    }
    return image;
  }

  /* Paint a grid onto a canvas, one canvas pixel per cell. */
  function gridToCanvas(g, canvas = document.createElement("canvas")) {
    canvas.width = g.w;
    canvas.height = g.h;
    canvas.getContext("2d").putImageData(gridToImage(g), 0, 0);
    return canvas;
  }

  let artCache = null;

  /* Pixels for the gait, each made on first use like its grid. */
  function lazyFrames(gridLegs, cv) {
    const frames = [];
    for (let i = 0; i < WALK.frames; i += 1) {
      let frame = null;
      Object.defineProperty(frames, i, {
        get: () => (frame ??= { far: cv(gridLegs[i].far), near: cv(gridLegs[i].near) }),
        enumerable: true,
      });
    }
    frames.stand = { far: cv(gridLegs.stand.far), near: cv(gridLegs.stand.near) };
    return frames;
  }

  /* The grids turned into pixels the engine copies into its layers. */
  function buildArt() {
    if (artCache) return artCache;
    const A = buildGrids();
    const cv = (g) => gridToImage(g);
    const masks = {};
    for (const pose of Object.keys(POSES)) {
      const flat = compose(pose, { costume: false });
      masks[pose] = Uint8Array.from(flat.c, (k) => (k !== "." && k !== "z" ? 1 : 0));
    }
    artCache = {
      heads: Object.fromEntries(Object.entries(A.heads).map(([k, g]) => [k, cv(g)])),
      antennae: A.antennae.map((a) => ({ dim: cv(a.dim), lit: cv(a.lit) })),
      whiskers: { night: A.whiskers.night.map(cv), day: A.whiskers.day.map(cv) },
      walk: {
        body: cv(A.walk.body),
        tail: cv(A.walk.tail),
        shadow: cv(A.walk.shadow),
        legs: lazyFrames(A.walk.legs, cv),
      },
      sit: { body: cv(A.sit.body), tip: cv(A.sit.tip), shadow: cv(A.sit.shadow) },
      lie: { body: cv(A.lie.body), tip: cv(A.lie.tip), shadow: cv(A.lie.shadow) },
      masks,
    };
    return artCache;
  }

  /* ------------------------------------------------------------------ */
  /* Motion helpers                                                      */
  /* ------------------------------------------------------------------ */

  /* CSS cubic-bezier(x1, y1, x2, y2) as a function of progress 0..1. */
  function cubicBezier(x1, y1, x2, y2) {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t) => ((ay * t + by) * t + cy) * t;
    const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i += 1) {
        const error = sampleX(t) - x;
        if (Math.abs(error) < 1e-5) return sampleY(t);
        const d = slopeX(t);
        if (Math.abs(d) < 1e-6) break;
        t -= error / d;
      }
      // Newton stalled — bisect instead.
      let lo = 0;
      let hi = 1;
      t = x;
      for (let i = 0; i < 24; i += 1) {
        if (sampleX(t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
      return sampleY(t);
    };
  }

  // A breath: a quicker, softly landing inhale, then a long even exhale.
  const EASE_INHALE = cubicBezier(0.4, 0, 0.2, 1);
  const EASE_EXHALE = cubicBezier(0.45, 0, 0.55, 1);
  const INHALE_SHARE = 0.42;

  /* 0 = breathed out (body lowest), 1 = breathed in. */
  function breathAt(seconds, period) {
    const p = (((seconds / period) % 1) + 1) % 1;
    if (p < INHALE_SHARE) return EASE_INHALE(p / INHALE_SHARE);
    return 1 - EASE_EXHALE((p - INHALE_SHARE) / (1 - INHALE_SHARE));
  }

  /* One damped spring step: k = stiffness, zeta = damping ratio. */
  function springStep(s, target, k, zeta, dt, force = 0) {
    const a = k * (target - s.x) - 2 * zeta * Math.sqrt(k) * s.v + force;
    s.v += a * dt;
    s.x += s.v * dt;
  }

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);

  /* ------------------------------------------------------------------ */
  /* Purring                                                             */
  /* ------------------------------------------------------------------ */

  /*
   * A purr is a fast train of soft thumps — around 25 a second — that runs
   * through the whole breath: louder and a touch slower breathing out, softer
   * and quicker breathing in, with a hitch between. Three slightly different
   * breaths are synthesised once into a buffer and looped, so the loop does
   * not tick audibly. The breath timings are kept, so the cat's chest can
   * move with what you hear.
   */
  function synthPurr(sampleRate) {
    const breaths = [
      { out: 1.3, gapOut: 0.07, in: 1.0, gapIn: 0.1, level: 1 },
      { out: 1.16, gapOut: 0.06, in: 1.08, gapIn: 0.12, level: 0.9 },
      { out: 1.42, gapOut: 0.08, in: 0.92, gapIn: 0.09, level: 0.96 },
    ];
    const phases = [];
    let t = 0.03;
    for (const b of breaths) {
      phases.push({ from: t, to: t + b.out, kind: "out", level: b.level });
      t += b.out + b.gapOut;
      phases.push({ from: t, to: t + b.in, kind: "in", level: b.level * 0.62 });
      t += b.in + b.gapIn;
    }
    const duration = t;
    const length = Math.round(duration * sampleRate);
    const data = new Float32Array(length);

    // Seeded, so the purr sounds the same every time.
    let seed = 20231;
    const noise = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const attack = Math.max(1, Math.round(0.0025 * sampleRate));
    const decay = 0.0085 * sampleRate;
    const span = Math.round(0.034 * sampleRate);

    for (const phase of phases) {
      const rate = phase.kind === "out" ? 24 : 27.5;
      let tp = phase.from;
      while (tp < phase.to) {
        const u = (tp - phase.from) / (phase.to - phase.from);
        const env = Math.sin((Math.min(1, u / 0.18) * Math.min(1, (1 - u) / 0.28) * Math.PI) / 2) ** 1.4;
        const amp = phase.level * env * (0.82 + noise() * 0.36);
        const start = Math.round(tp * sampleRate);
        const body = 70 + noise() * 30;
        let brown = 0;
        for (let i = 0; i < span && start + i < length; i += 1) {
          const e = i < attack ? i / attack : Math.exp(-(i - attack) / decay);
          brown += (noise() * 2 - 1 - brown) * 0.18;
          data[start + i] += amp * e * (brown * 1.6 + 0.55 * Math.sin((2 * Math.PI * body * i) / sampleRate));
        }
        tp += (1 / rate) * (1 + (noise() - 0.5) * 0.1);
      }
    }

    let peak = 0;
    for (let i = 0; i < length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
    const gain = 0.9 / (peak || 1);
    for (let i = 0; i < length; i += 1) data[i] *= gain;
    return { data, duration, phases };
  }

  const PURR_VOLUME = 0.8;

  function createPurr() {
    let ctx = null;
    let buffer = null;
    let phases = [];
    let duration = 1;
    let input = null;
    let gain = null;
    let source = null;
    let startedAt = 0;
    let on = false;

    function ensure() {
      if (ctx) return true;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx();
      const purr = synthPurr(ctx.sampleRate);
      buffer = ctx.createBuffer(1, purr.data.length, ctx.sampleRate);
      buffer.copyToChannel(purr.data, 0);
      phases = purr.phases;
      duration = purr.duration;

      // No sub-bass a laptop speaker would only rattle on, a warm chest
      // resonance placed where small speakers can still play it, and
      // nothing above the rumble.
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 40;
      const chest = ctx.createBiquadFilter();
      chest.type = "peaking";
      chest.frequency.value = 190;
      chest.Q.value = 1.1;
      chest.gain.value = 5;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 950;
      lowpass.Q.value = 0.6;
      gain = ctx.createGain();
      gain.gain.value = 0;
      highpass.connect(chest).connect(lowpass).connect(gain).connect(ctx.destination);
      input = highpass;
      return true;
    }

    function start() {
      if (on || !ensure()) return on;
      ctx.resume?.().catch?.(() => {});
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(input);
      startedAt = ctx.currentTime + 0.02;
      source.start(startedAt);
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(PURR_VOLUME, now + 0.45);
      on = true;
      return true;
    }

    function stop() {
      if (!on) return;
      on = false;
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      try {
        source.stop(now + 0.35);
      } catch (error) {
        // Already stopped.
      }
      source = null;
    }

    /* Where the purr is right now: { breath 0..1, level 0..1 }. */
    function sample() {
      if (!on || !ctx) return null;
      const t = (((ctx.currentTime - startedAt) % duration) + duration) % duration;
      let breath = 1;
      for (const phase of phases) {
        if (t < phase.from) break;
        const u = (t - phase.from) / (phase.to - phase.from);
        if (u <= 1) {
          const level = phase.level * Math.sin(Math.min(1, u / 0.18, (1 - u) / 0.28) * (Math.PI / 2));
          return {
            breath: phase.kind === "out" ? 1 - EASE_EXHALE(u) : EASE_INHALE(u),
            level: Math.max(0, level),
          };
        }
        breath = phase.kind === "out" ? 0 : 1;
      }
      return { breath, level: 0 };
    }

    return {
      start,
      stop,
      sample,
      pause: () => ctx?.suspend?.().catch?.(() => {}),
      resume: () => {
        if (on) ctx?.resume?.().catch?.(() => {});
      },
      get on() {
        return on;
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /* Little extras: the "z" of a sleeping cat and the sparkles           */
  /* ------------------------------------------------------------------ */

  const SVG_NS = "http://www.w3.org/2000/svg";

  /* A crisp pixel glyph as SVG, coloured by CSS (fill: currentColor). */
  function pixelSvg(rows, colors = null) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${rows[0].length} ${rows.length}`);
    svg.setAttribute("shape-rendering", "crispEdges");
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === ".") continue;
        const r = document.createElementNS(SVG_NS, "rect");
        r.setAttribute("x", x);
        r.setAttribute("y", y);
        r.setAttribute("width", 1.02);
        r.setAttribute("height", 1.02);
        r.setAttribute("fill", colors ? colors[row[x]] : "currentColor");
        svg.appendChild(r);
      }
    });
    return svg;
  }

  const Z_GLYPHS = [
    ["zzzz", "..z.", ".z..", "zzzz"],
    ["zzzzz", "...z.", "..z..", ".z...", "zzzzz"],
  ];

  const SPARK = ["..a..", ".aba.", "abcba", ".aba.", "..a.."];
  const SPARK_COLORS = [
    { a: "#9fd38c", b: "#dff7cf", c: "#ffffff" }, // sage, like the bulbs
    { a: "#f5a259", b: "#ffe2b8", c: "#ffffff" }, // ginger, like the coat
  ];

  /* ------------------------------------------------------------------ */
  /* Styles                                                              */
  /* ------------------------------------------------------------------ */

  /*
   * The cat's CSS travels with it, because it has to work in two kinds of
   * place: the extension's own pages, and the shadow root of the floating
   * widget on websites, which no page stylesheet can reach. create() puts it
   * at the very start of whichever root the cat lands in, so the page's own
   * rules — sizes, margins, positions — come later and win.
   *
   * --px is how many CSS pixels one art pixel takes; measure() writes it.
   * Everything that moves has will-change: transform and moves only by
   * transform.
   */
  const BUDDY_CSS = `
.buddy {
  --buddy-size: clamp(112px, 36vw, 128px);
  --px: 2;
  position: relative;
  display: block;
  width: 100%;
  height: calc(var(--px) * ${LANE_ROWS}px);
  margin: 0;
  overflow-x: clip;
  overflow-y: visible;
  color: var(--buddy-ink, var(--muted, #b9a5c8));
  pointer-events: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.buddy[hidden] { display: none; }
.buddy-probe { position: absolute; width: var(--buddy-size); height: 0; visibility: hidden; }
.buddy-walker {
  position: absolute;
  left: 0;
  bottom: 0;
  width: calc(var(--px) * ${FRAME.w}px);
  height: calc(var(--px) * ${FRAME.h}px);
  pointer-events: auto;
  will-change: transform;
}
.buddy-walker.is-over-cat { cursor: pointer; }
.buddy-pop, .buddy-turn, .buddy-rig, .buddy-fx { position: absolute; inset: 0; }
.buddy-pop, .buddy-turn, .buddy-rig {
  transform-origin: 50% ${(((GROUND + FRAME.oy + 1) / FRAME.h) * 100).toFixed(1)}%;
}
.buddy-px, .buddy-head, .buddy-antenna { position: absolute; }
.buddy-px { image-rendering: pixelated; }
.buddy-turn, .buddy-rig, .buddy-body, .buddy-tail, .buddy-tip,
.buddy-head, .buddy-whisker, .buddy-antenna { will-change: transform; }

/* Day is energy-saving mode: the bulbs stay dark and wink now and then at
   random. Night switches them fully on, with a steady soft sage neon glow. */
.buddy-bulb-lit, .buddy-glow { opacity: 0; transition: opacity 0.6s ease; }
.buddy[data-night] .buddy-bulb-lit, .buddy[data-night] .buddy-glow { opacity: 1; }
.buddy-glow {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(244, 255, 238, 0.95) 0 22%, rgba(185, 236, 163, 0.6) 48%, rgba(185, 236, 163, 0) 72%);
  box-shadow:
    0 0 calc(var(--px) * 2.5px) calc(var(--px) * 1px) rgba(185, 236, 163, 0.7),
    0 0 calc(var(--px) * 8px) calc(var(--px) * 3px) rgba(143, 200, 128, 0.34);
  will-change: opacity;
}

/* The "z" of a sleeping cat, and the sparkles of an entrance. */
.buddy-z, .buddy-spark {
  position: absolute;
  display: block;
  overflow: visible;
  pointer-events: none;
  will-change: transform, opacity;
}
.buddy-spark { width: calc(var(--px) * 5px); height: calc(var(--px) * 5px); }

@media (prefers-reduced-motion: reduce) {
  .buddy-bulb-lit, .buddy-glow { transition: none; }
}
`;

  /* Once per document or shadow root, ahead of everything else in it. */
  function adoptStyles(rootNode) {
    const container = rootNode instanceof ShadowRoot ? rootNode : document.head || document.documentElement;
    if (container.querySelector(":scope > style[data-firefly-buddy]")) return;
    const style = document.createElement("style");
    style.dataset.fireflyBuddy = "";
    style.textContent = BUDDY_CSS;
    container.prepend(style);
  }

  /* ------------------------------------------------------------------ */
  /* The engine                                                          */
  /* ------------------------------------------------------------------ */

  /*
   * create(host) fills an empty element with the cat and returns its
   * controls. The page calls sync({ enabled, running, night }) from its own
   * render loop; everything else — poses, walking, breathing, blinking —
   * happens in here.
   */
  function create(host, { onPurrChange = null } = {}) {
    adoptStyles(host.getRootNode());
    const art = buildArt();
    const reduceQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const purr = createPurr();
    // One timeline for the loop and for step(): real time plus whatever
    // step() has fast-forwarded.
    let shift = 0;
    const nowMs = () => performance.now() + shift;

    const st = {
      ready: false,
      enabled: false,
      running: false,
      night: true,
      reduced: reduceQuery?.matches === true,
      pageVisible: !document.hidden,
      inView: true,
      raf: 0,
      last: 0,
      clock: 0, // seconds of animation time
      // size
      px: 2,
      dpr: 1,
      laneW: 0,
      // pose
      pose: null,
      stoppedAt: nowMs(),
      trans: null,
      squash: [1, 1],
      // walking
      x: null,
      dir: 1,
      speed: 0,
      pauseUntil: 0,
      turn: null,
      stride: 0,
      legs: "stand",
      // body and head
      bodyY: 0,
      breath: 0.5,
      head: { x: 0, v: 0 },
      jitter: [0, 0],
      purrLevel: 0,
      ant: [{ x: 0, v: 0 }, { x: 0, v: 0 }],
      tail: { x: 0, v: 0 },
      tip: { x: 0, v: 0 },
      flick: { to: 0, until: 0, next: 0 },
      walkerV: 0,
      // face
      eyes: null,
      blink: { next: nowMs() + rand(1500, 4000), seq: null, at: 0 },
      glance: { until: 0, next: nowMs() + rand(4000, 9000) },
      // lights and sleep
      flashNext: 0,
      zNext: 0,
      zBig: false,
      written: new Map(),
      hideAnims: [],
    };

    const dom = buildDom();

    /* ---------- DOM ---------- */

    function buildDom() {
      host.replaceChildren();
      host.setAttribute("aria-hidden", "true");
      host.classList.add("buddy");

      const el = (tag, cls, parent) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        parent?.appendChild(node);
        return node;
      };
      const box = (node, x, y, w, h) => {
        node.style.left = `calc(var(--px) * ${x}px)`;
        node.style.top = `calc(var(--px) * ${y}px)`;
        node.style.width = `calc(var(--px) * ${w}px)`;
        node.style.height = `calc(var(--px) * ${h}px)`;
      };
      const canvas = (cls, parent, w = FRAME.w, h = FRAME.h) => {
        const c = el("canvas", `buddy-px ${cls}`, parent);
        c.width = w;
        c.height = h;
        box(c, 0, 0, w, h);
        return c;
      };

      const probe = el("div", "buddy-probe", host);
      const walker = el("div", "buddy-walker", host);
      const pop = el("div", "buddy-pop", walker);
      const turn = el("div", "buddy-turn", pop);
      const rig = el("div", "buddy-rig", turn);

      const shadow = canvas("buddy-shadow", rig);
      const tail = canvas("buddy-tail", rig);
      tail.style.transformOrigin =
        `${((WALK.tailBase[0] + FRAME.ox) / FRAME.w) * 100}% ${((WALK.tailBase[1] + FRAME.oy) / FRAME.h) * 100}%`;
      const far = canvas("buddy-far", rig);
      const body = canvas("buddy-body", rig);
      const near = canvas("buddy-near", rig);
      const tip = canvas("buddy-tip", rig);

      // The head group sits on the head's logical origin; everything on the
      // head is placed relative to it.
      const head = el("div", "buddy-head", rig);
      const face = el("canvas", "buddy-px buddy-face", head);
      face.width = HEAD_W;
      face.height = HEAD_H + 2;
      box(face, 0, -2, HEAD_W, HEAD_H + 2);

      const whiskers = [0, 1].map((i) => {
        const c = el("canvas", "buddy-px buddy-whisker", head);
        c.width = 46;
        c.height = 32;
        box(c, -10, -2, 46, 32);
        const [rx, ry] = HEAD.whiskerRoots[i];
        c.style.transformOrigin = `${((rx + 10) / 46) * 100}% ${((ry + 2) / 32) * 100}%`;
        return c;
      });

      const antennae = [0, 1].map((i) => {
        const wrap = el("div", "buddy-antenna", head);
        box(wrap, -4, -10, 34, 26);
        const [bx, by] = HEAD.antennaBases[i];
        wrap.style.transformOrigin = `${((bx + 4) / 34) * 100}% ${((by + 10) / 26) * 100}%`;
        const glow = el("span", "buddy-glow", wrap);
        const [cx, cy] = bulbCorner(i);
        box(glow, cx + 4, cy + 10, 5, 5);
        const dim = gridToCanvas(buildGrids().antennae[i].dim, el("canvas", "buddy-px buddy-bulb-dim", wrap));
        box(dim, 0, 0, 34, 26);
        const lit = gridToCanvas(buildGrids().antennae[i].lit, el("canvas", "buddy-px buddy-bulb-lit", wrap));
        box(lit, 0, 0, 34, 26);
        return { wrap, glow, lit };
      });

      const fx = el("div", "buddy-fx", walker);
      return { probe, walker, pop, turn, rig, shadow, tail, far, body, near, tip, head, face, whiskers, antennae, fx, box };
    }

    // putImageData replaces every pixel, transparent ones too: clearing and
    // painting in one go.
    function paint(canvas, image) {
      const ctx = canvas.getContext("2d");
      if (image) ctx.putImageData(image, 0, 0);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /* Write a transform only when it changed. */
    function setTransform(node, value) {
      if (st.written.get(node) === value) return;
      st.written.set(node, value);
      node.style.transform = value;
    }

    /* ---------- Size ---------- */

    /*
     * --buddy-size says roughly how wide the sprite should be. Rounded to a
     * whole number of device pixels per art pixel, so every pixel of the cat
     * is the same size, and never more than a little over the asked width.
     */
    function measure() {
      const target = dom.probe.offsetWidth;
      if (!target) return;
      const dpr = window.devicePixelRatio || 1;
      let k = Math.max(1, Math.round((target * dpr) / NOMINAL_W));
      if (k > 1 && (k * NOMINAL_W) / dpr > target * 1.15) k -= 1;
      st.dpr = dpr;
      st.px = k / dpr;
      st.laneW = host.clientWidth;
      host.style.setProperty("--px", String(st.px));
      st.written.clear();
    }

    const snap = (cssPx) => Math.round(cssPx * st.dpr) / st.dpr;

    /* ---------- Poses ---------- */

    function targetPose(now) {
      if (st.running) return "walk";
      return now - st.stoppedAt >= DOZE_AFTER_MS ? "lie" : "sit";
    }

    function showPose(pose) {
      const A = art[pose];
      st.pose = pose;
      paint(dom.shadow, A.shadow);
      paint(dom.body, A.body);
      paint(dom.tail, pose === "walk" ? A.tail : null);
      paint(dom.tip, pose === "walk" ? null : A.tip);
      st.legs = null;
      setLegs(pose === "walk" ? "stand" : null);

      const [hx, hy] = headOffset(pose);
      dom.box(dom.head, FRAME.ox + hx, FRAME.oy + hy, HEAD_W, HEAD_H);
      // Breathing scales the body from the floor, so the paws stay planted.
      dom.body.style.transformOrigin = `50% ${((GROUND + 1 + FRAME.oy) / FRAME.h) * 100}%`;
      if (pose !== "walk") {
        const base = POSES[pose].tipBase;
        dom.tip.style.transformOrigin =
          `${((base[0] + FRAME.ox) / FRAME.w) * 100}% ${((base[1] + FRAME.oy) / FRAME.h) * 100}%`;
      }
      st.head = { x: 0, v: 0 };
      st.tip = { x: 0, v: 0 };
      st.eyes = null;
      st.written.clear();
      stepEyes(nowMs());
    }

    function setLegs(which) {
      if (st.legs === which) return;
      st.legs = which;
      const frame = which === null ? null : which === "stand" ? art.walk.legs.stand : art.walk.legs[which];
      paint(dom.far, frame?.far || null);
      paint(dom.near, frame?.near || null);
    }

    /*
     * Changing pose is a squash, a cut to the new sprite at the bottom of it,
     * and a springy stretch back — quick to stand up, slower to flop down.
     */
    const TRANSITIONS = {
      "walk>sit": { out: 0.2, in: 0.42, depth: 0.86, overshoot: 1.06 },
      "sit>lie": { out: 0.42, in: 0.6, depth: 0.84, overshoot: 1.05 },
      "walk>lie": { out: 0.3, in: 0.6, depth: 0.84, overshoot: 1.05 },
      default: { out: 0.14, in: 0.32, depth: 0.9, overshoot: 1.08 },
    };

    function startTransition(to, now) {
      const spec = TRANSITIONS[`${st.pose}>${to}`] || TRANSITIONS.default;
      st.trans = { to, start: now, swapped: false, ...spec };
    }

    function stepTransition(now) {
      const tr = st.trans;
      const t = (now - tr.start) / 1000;
      if (t < tr.out) {
        const p = t / tr.out;
        const e = p * p;
        st.squash = [1 + (1 - tr.depth) * 0.4 * e, 1 - (1 - tr.depth) * e];
        return;
      }
      if (!tr.swapped) {
        tr.swapped = true;
        showPose(tr.to);
        // the head just moved a long way: the antennae feel it
        st.ant[0].v += rand(-5, -2);
        st.ant[1].v += rand(2, 5);
        st.tip.v += rand(-2, 2);
      }
      const p = Math.min(1, (t - tr.out) / tr.in);
      // squashed → overshoot → settle
      const stretch = p < 0.45
        ? tr.depth + (tr.overshoot - tr.depth) * Math.sin((p / 0.45) * (Math.PI / 2))
        : 1 + (tr.overshoot - 1) * Math.cos(((p - 0.45) / 0.55) * (Math.PI / 2));
      st.squash = [1 + (1 - stretch) * 0.4, stretch];
      if (p >= 1) {
        st.trans = null;
        st.squash = [1, 1];
      }
    }

    /* ---------- Walking ---------- */

    function stageWidth() {
      return FRAME.w * st.px;
    }

    function stepWalk(now, dt) {
      if (!st.laneW) return 0;
      const travel = Math.max(0, st.laneW - stageWidth());
      if (st.x === null) st.x = travel / 2;
      st.x = clamp(st.x, 0, travel);

      let speed = 0;
      if (!st.turn && now >= st.pauseUntil && travel > 0) {
        // art pixels a second: an amble in the panel, a brisker trot across a
        // whole screen, and always the gait's own pace so paws never slide
        speed = clamp(travel / st.px / 24, 4.5, 16);
        st.x += st.dir * speed * st.px * dt;
        if ((st.dir > 0 && st.x >= travel) || (st.dir < 0 && st.x <= 0)) {
          st.x = clamp(st.x, 0, travel);
          st.pauseUntil = now + rand(500, 1300);
          st.turn = { start: st.pauseUntil, ms: 280, to: -st.dir, kicked: false };
        }
      }

      const v = speed * st.dir;
      const accel = (v - st.walkerV) / Math.max(dt, 1 / 240);
      st.walkerV = v;
      st.speed = speed;

      if (speed > 0) {
        st.stride = (st.stride + (speed * dt) / CYCLE_DISTANCE) % 1;
        setLegs(Math.floor(st.stride * WALK.frames) % WALK.frames);
      } else if (!st.turn || now < st.turn.start) {
        setLegs("stand");
      }
      return accel;
    }

    /* A turn plays out in any pose: wait for its start, swing, done. */
    function stepTurn(now) {
      const turn = st.turn;
      if (!turn || now < turn.start) return;
      if (!turn.kicked) {
        turn.kicked = true;
        st.ant[0].v += rand(3, 6) * st.dir;
        st.ant[1].v += rand(3, 6) * st.dir;
        st.tail.v -= 2.4 * st.dir;
        st.tip.v -= 1.5 * st.dir;
      }
      if (now >= turn.start + turn.ms) {
        st.dir = turn.to;
        st.turn = null;
      }
    }

    function turnScale(now) {
      if (!st.turn || now < st.turn.start) return st.dir;
      const p = clamp((now - st.turn.start) / st.turn.ms, 0, 1);
      // through edge-on and out the other side: reads as turning round
      return st.dir * Math.cos(p * Math.PI);
    }

    /* ---------- Face ---------- */

    function baseEyes(now) {
      if (st.pose === "lie") return "shut";
      if (purr.on) return "happy";
      if (st.pose === "walk" && st.speed > 0) return "look";
      if (now < st.glance.until) return "look";
      if (now >= st.glance.next) {
        st.glance.until = now + rand(700, 1500);
        st.glance.next = now + rand(5000, 12000);
      }
      return "open";
    }

    function stepEyes(now) {
      let eyes = baseEyes(now);
      const canBlink = eyes === "open" || eyes === "look";
      const b = st.blink;
      if (!b.seq && canBlink && now >= b.next) {
        const once = [["half", 45], ["shut", 75], ["half", 50]];
        b.seq = Math.random() < 0.2 ? [...once, [eyes, 110], ...once] : once;
        b.at = now;
      }
      if (b.seq) {
        let t = now - b.at;
        let frame = null;
        for (const [shape, ms] of b.seq) {
          if (t < ms) {
            frame = shape;
            break;
          }
          t -= ms;
        }
        if (frame && canBlink) eyes = frame;
        else {
          b.seq = null;
          b.next = now + rand(2200, 6500);
        }
      }
      if (eyes !== st.eyes) {
        st.eyes = eyes;
        paint(dom.face, art.heads[eyes]);
      }
    }

    /* ---------- Lights ---------- */

    function setNight(night) {
      st.night = night;
      host.toggleAttribute("data-night", night);
      const set = art.whiskers[night ? "night" : "day"];
      dom.whiskers.forEach((c, i) => paint(c, set[i]));
      if (night) {
        for (const a of dom.antennae) {
          a.lit.getAnimations().forEach((x) => x.cancel());
          a.glow.getAnimations().forEach((x) => x.cancel());
        }
      }
      st.flashNext = nowMs() + rand(1200, 3000);
    }

    /*
     * Daytime is energy-saving mode: the bulbs are dark and only blink now
     * and then, at random — a single wink, a double, a slow glow, or one
     * bulb answering the other the way fireflies do.
     */
    function flash(now) {
      st.flashNext = now + rand(2600, 9000);
      if (st.reduced && Math.random() < 0.5) return;
      const kinds = [
        { frames: [0, 1, 0.85, 0], offsets: [0, 0.14, 0.4, 1], ms: 720 },
        { frames: [0, 1, 0.1, 1, 0], offsets: [0, 0.1, 0.3, 0.44, 1], ms: 920 },
        { frames: [0, 0.9, 0], offsets: [0, 0.45, 1], ms: 1700 },
      ];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const keyframes = kind.frames.map((opacity, i) => ({ opacity, offset: kind.offsets[i] }));
      const which = Math.random();
      dom.antennae.forEach((a, i) => {
        if (which < 0.2 && i === 1) return; // just the one
        const delay = which > 0.75 ? i * rand(180, 320) : 0; // one answering the other
        for (const node of [a.lit, a.glow]) {
          node.animate(keyframes, { duration: kind.ms, delay, easing: "ease-in-out" });
        }
      });
    }

    /* ---------- Sleep "z" and sparkles ---------- */

    function headCenterInStage() {
      const [hx, hy] = headOffset(st.pose || "sit");
      const x = (FRAME.ox + hx + HCX) * st.px;
      const y = (FRAME.oy + hy + HCY) * st.px;
      return [st.dir < 0 ? stageWidth() - x : x, y];
    }

    function spawnZ() {
      const glyph = Z_GLYPHS[st.zBig ? 1 : 0];
      st.zBig = !st.zBig;
      const z = pixelSvg(glyph);
      z.classList.add("buddy-z");
      const size = glyph.length;
      z.style.width = `calc(var(--px) * ${size}px)`;
      z.style.height = `calc(var(--px) * ${size}px)`;
      const [cx, cy] = headCenterInStage();
      const side = st.dir < 0 ? -1 : 1;
      z.style.left = `${cx + side * 9 * st.px}px`;
      z.style.top = `${cy - 12 * st.px}px`;
      dom.fx.appendChild(z);
      const drift = 7 * st.px * side;
      const anim = z.animate(
        [
          { transform: "translate3d(0, 0, 0)", opacity: 0 },
          { transform: `translate3d(${drift * 0.3}px, ${-4 * st.px}px, 0)`, opacity: 0.85, offset: 0.3 },
          { transform: `translate3d(${drift}px, ${-14 * st.px}px, 0)`, opacity: 0 },
        ],
        { duration: 3400, easing: "ease-out" }
      );
      anim.onfinish = () => z.remove();
      anim.oncancel = () => z.remove();
    }

    function sparkle() {
      if (st.reduced) return;
      const [, cy] = headCenterInStage();
      const cx = stageWidth() / 2;
      const midY = (cy + (FRAME.oy + GROUND) * st.px) / 2;
      for (let i = 0; i < 12; i += 1) {
        const spark = pixelSvg(SPARK, SPARK_COLORS[i % 2]);
        spark.classList.add("buddy-spark");
        spark.style.left = `${cx - 2.5 * st.px}px`;
        spark.style.top = `${midY - 2.5 * st.px}px`;
        dom.fx.appendChild(spark);
        const angle = (i / 12) * Math.PI * 2 + rand(-0.25, 0.25);
        const dist = rand(18, 34) * st.px;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist * 0.75;
        const anim = spark.animate(
          [
            { transform: "translate3d(0, 0, 0) scale(0.4)", opacity: 0 },
            { transform: `translate3d(${dx * 0.55}px, ${dy * 0.55}px, 0) scale(1)`, opacity: 1, offset: 0.35 },
            { transform: `translate3d(${dx}px, ${dy - 6 * st.px}px, 0) scale(0.5)`, opacity: 0 },
          ],
          { duration: rand(650, 950), delay: rand(0, 120), easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" }
        );
        anim.onfinish = () => spark.remove();
        anim.oncancel = () => spark.remove();
      }
    }

    /* ---------- Showing and hiding ---------- */

    function laneHeight() {
      return LANE_ROWS * st.px;
    }

    function setEnabled(on, animate) {
      st.enabled = on;
      // Changed its mind halfway through vanishing: undo every step of it.
      st.hideAnims.forEach((anim) => anim.cancel());
      st.hideAnims = [];

      if (on) {
        const wasHidden = host.hidden;
        host.hidden = false;
        measure();
        if (st.x === null) st.x = Math.max(0, st.laneW - stageWidth()) / 2;
        if (!st.pose) showPose(targetPose(nowMs()));
        render(nowMs());
        if (!wasHidden && !animate) return;
        if (st.reduced || !animate) {
          dom.pop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: "ease-out" });
          return;
        }
        // the lane opens, then the cat pops in with a burst of sparkles
        host.animate([{ height: "0px", marginBottom: "0px" }, { height: `${laneHeight()}px` }],
          { duration: 300, easing: "cubic-bezier(.3,.7,.2,1)" });
        dom.pop.animate(
          [
            { transform: "scale(0.15)", opacity: 0 },
            { transform: "scale(1.14, 0.92)", opacity: 1, offset: 0.5 },
            { transform: "scale(0.95, 1.05)", offset: 0.72 },
            { transform: "scale(1.02, 0.99)", offset: 0.88 },
            { transform: "scale(1)", opacity: 1 },
          ],
          { duration: 680, delay: 120, easing: "cubic-bezier(.25,.8,.3,1)", fill: "backwards" }
        );
        setTimeout(sparkle, 260);
        st.ant[0].v -= 6;
        st.ant[1].v += 6;
        return;
      }

      setPurring(false);
      if (host.hidden) return;
      if (!animate) {
        host.hidden = true;
        return;
      }
      sparkle();
      const vanish = dom.pop.animate(
        st.reduced
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [
              { transform: "scale(1)", opacity: 1 },
              { transform: "scale(1.1, 0.88)", opacity: 1, offset: 0.3 },
              { transform: "scale(0.12)", opacity: 0 },
            ],
        { duration: 380, easing: "cubic-bezier(.5,0,.75,.2)", fill: "forwards" }
      );
      st.hideAnims.push(vanish);
      vanish.onfinish = () => {
        if (st.enabled) return;
        const shrink = host.animate(
          [{ height: `${laneHeight()}px` }, { height: "0px", marginBottom: "0px" }],
          { duration: 260, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }
        );
        st.hideAnims.push(shrink);
        shrink.onfinish = () => {
          if (st.enabled) return;
          host.hidden = true;
          st.hideAnims.forEach((anim) => anim.cancel());
          st.hideAnims = [];
          updateLoop();
        };
      };
    }

    /* ---------- Purring ---------- */

    function setPurring(on) {
      if (on && !st.enabled) return;
      if (on === purr.on) return;
      if (on) purr.start();
      else purr.stop();
      st.ant[0].v += rand(-3, 3);
      st.ant[1].v += rand(-3, 3);
      onPurrChange?.(purr.on);
    }

    /* ---------- The loop ---------- */

    function update(now, dt) {
      st.clock += dt;
      const t = st.clock;

      if (!st.pose) showPose(targetPose(now));
      if (!st.trans && targetPose(now) !== st.pose) {
        if (st.reduced) showPose(targetPose(now));
        else startTransition(targetPose(now), now);
      }
      if (st.trans) stepTransition(now);
      stepTurn(now);

      // walking — the walker keeps its place while the cat sits
      let walkerAccel = 0;
      if (st.pose === "walk" && !st.trans && !st.reduced) walkerAccel = stepWalk(now, dt);
      else {
        st.walkerV = 0;
        st.speed = 0;
        st.pauseUntil = 0;
        // A hidden lane measures zero wide; do not take that as where to sit.
        if (st.laneW > 0) {
          const travel = Math.max(0, st.laneW - stageWidth());
          if (st.x === null || st.reduced) st.x = travel / 2;
          st.x = clamp(st.x, 0, travel);
        }
      }

      // breathing, or the purr's own breaths while it purrs
      const sample = purr.sample();
      const period = st.pose === "lie" ? 4.6 : 3.6;
      st.breath = st.reduced ? 0 : sample ? sample.breath : breathAt(t, period);
      const level = sample ? sample.level : 0;
      st.purrLevel = level;

      // body: a stride bob while walking, the breath otherwise
      let headTarget = 0;
      if (st.pose === "walk") {
        st.bodyY = st.speed > 0 ? 0.5 * (1 - Math.cos(4 * Math.PI * st.stride)) : 0;
        headTarget = st.bodyY * 0.9;
      } else {
        st.bodyY = 0;
        const rise = st.pose === "lie" ? 0.07 : 0.028;
        const headY = POSES[st.pose].head[1];
        headTarget = -rise * st.breath * (GROUND - headY) * (st.pose === "lie" ? 0.6 : 1);
      }

      // purring makes the body hum: a tiny jitter, stronger as it gets louder
      const jitterAmp = st.reduced ? 0 : 0.5 * level;
      st.jitter = [rand(-1, 1) * jitterAmp, rand(-1, 1) * jitterAmp];

      // springs, in small steps so stiff ones stay stable
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      let headAccel = 0;
      for (let i = 0; i < steps; i += 1) {
        const v0 = st.head.v;
        springStep(st.head, headTarget, 150, 0.5, h);
        headAccel = (st.head.v - v0) / h;

        // Antennae: springs whose base rides on the head. Their tips lag when
        // the head moves, then bounce back; a breath of noise keeps them alive.
        st.ant.forEach((a, k) => {
          const side = k === 0 ? -1 : 1;
          const angle = side * 0.33 + a.x;
          const ax = walkerAccel * st.dir; // forward, in the cat's own frame
          let drive = (-(ax * Math.cos(angle) + headAccel * Math.sin(angle)) * 34) / 11;
          drive = clamp(drive, -70, 70);
          drive += 6 * (0.6 * Math.sin(1.31 * t + k * 2.1) + 0.4 * Math.sin(2.93 * t + k * 4.7));
          if (level > 0) drive += rand(-1, 1) * 30 * level;
          springStep(a, 0, 227, 0.13, h, st.reduced ? 0 : drive);
          a.x = clamp(a.x, -0.5, 0.5);
        });

        // The raised tail swings on its own slow beat and lags behind the body.
        if (st.pose === "walk") {
          const swing = 0.06 * Math.sin((2 * Math.PI * t) / 3.1) + 0.035 * Math.sin((2 * Math.PI * t) / 1.37 + 1);
          const stride = st.speed > 0 ? 0.05 * Math.sin(2 * Math.PI * st.stride) : 0;
          springStep(st.tail, swing + stride, 28, 0.3, h, -headAccel * 0.9);
          st.tail.x = clamp(st.tail.x, -0.35, 0.35);
        } else {
          // sitting or lying: the tip sways, and now and then gives a flick
          if (now >= st.flick.next) {
            st.flick.to = (Math.random() < 0.5 ? -1 : 1) * rand(0.18, 0.32);
            st.flick.until = now + rand(250, 450);
            st.flick.next = now + rand(2500, 7000);
          }
          const sway = 0.05 * Math.sin((2 * Math.PI * t) / 4.3);
          springStep(st.tip, now < st.flick.until ? st.flick.to : sway, 40, 0.28, h);
        }
      }
      if (st.reduced) {
        st.head = { x: 0, v: 0 };
        st.ant.forEach((a) => {
          a.x = 0;
          a.v = 0;
        });
        st.tail = { x: 0, v: 0 };
        st.tip = { x: 0, v: 0 };
      }

      stepEyes(now);

      if (!st.night && now >= st.flashNext) flash(now);
      if (st.pose === "lie" && !st.trans && !st.reduced && now >= st.zNext) {
        st.zNext = now + 1700;
        spawnZ();
      }
    }

    function render(now) {
      // art pixels → CSS pixels, landing on whole device pixels
      const toPx = (v) => snap(v * st.px);
      const [jx, jy] = st.jitter;
      const t = st.clock;

      setTransform(dom.walker, `translate3d(${snap(st.x ?? 0)}px, 0, 0)`);
      setTransform(dom.turn, `scaleX(${turnScale(now).toFixed(3)})`);
      setTransform(dom.rig, `scale(${st.squash[0].toFixed(3)}, ${st.squash[1].toFixed(3)})`);

      if (st.pose === "walk") {
        setTransform(dom.body, `translate3d(${toPx(jx)}px, ${toPx(st.bodyY + jy)}px, 0)`);
        setTransform(dom.tail, `translate3d(0, ${toPx(st.bodyY)}px, 0) rotate(${st.tail.x.toFixed(4)}rad)`);
      } else {
        const rise = st.pose === "lie" ? 0.07 : 0.028;
        const b = st.breath;
        setTransform(dom.body,
          `translate3d(${toPx(jx)}px, ${toPx(jy)}px, 0) scale(${(1 + 0.008 * b).toFixed(4)}, ${(1 + rise * b).toFixed(4)})`);
        setTransform(dom.tip, `rotate(${st.tip.x.toFixed(4)}rad)`);
      }

      setTransform(dom.head, `translate3d(${toPx(jx)}px, ${toPx(st.head.x + jy)}px, 0)`);

      // whiskers: both tips rise and fall together, a beat apart
      const sway = 0.035 * Math.sin((2 * Math.PI * t) / 2.6) + 0.012 * Math.sin((2 * Math.PI * t) / 1.15 + 0.7);
      const lag = clamp(st.head.v * 0.02, -0.05, 0.05);
      const wl = st.reduced ? 0 : sway + lag;
      const wr = st.reduced ? 0 : -(0.035 * Math.sin((2 * Math.PI * t) / 2.6 + 0.5) + 0.012 * Math.sin((2 * Math.PI * t) / 1.15)) - lag;
      setTransform(dom.whiskers[0], `rotate(${wl.toFixed(4)}rad)`);
      setTransform(dom.whiskers[1], `rotate(${wr.toFixed(4)}rad)`);

      // a purr hums through the band: the antennae buzz with it
      const buzz = st.reduced ? 0 : st.purrLevel * 0.03;
      dom.antennae.forEach((a, i) => {
        const angle = st.ant[i].x + buzz * Math.sin(2 * Math.PI * 9 * t + i * 1.7);
        setTransform(a.wrap, `rotate(${angle.toFixed(4)}rad)`);
      });
    }

    function frame() {
      st.raf = requestAnimationFrame(frame);
      const now = nowMs();
      // 60 frames a second is plenty, even on a 120 Hz screen
      if (now - st.last < 1000 / 62) return;
      const dt = clamp((now - st.last) / 1000, 0, 0.05);
      st.last = now;
      update(now, dt);
      render(now);
    }

    function updateLoop() {
      const want = st.enabled && st.pageVisible && st.inView && !host.hidden;
      if (want && !st.raf) {
        st.last = nowMs() - 16;
        st.raf = requestAnimationFrame(frame);
      } else if (!want && st.raf) {
        cancelAnimationFrame(st.raf);
        st.raf = 0;
      }
    }

    /* ---------- Watching the page ---------- */

    // The probe too: switching the panel to compact changes --buddy-size
    // without necessarily changing the lane's width.
    const resizeObserver = new ResizeObserver(() => {
      if (!host.hidden) measure();
    });
    resizeObserver.observe(host);
    resizeObserver.observe(dom.probe);

    const viewObserver = new IntersectionObserver(([entry]) => {
      st.inView = entry.isIntersecting;
      updateLoop();
    });
    viewObserver.observe(host);

    function onVisibility() {
      st.pageVisible = !document.hidden;
      if (st.pageVisible) purr.resume();
      else purr.pause();
      updateLoop();
    }
    document.addEventListener("visibilitychange", onVisibility);

    const onReduce = () => {
      st.reduced = reduceQuery.matches;
    };
    reduceQuery?.addEventListener?.("change", onReduce);

    // Moving the window to a screen with another pixel density re-rounds the scale.
    let dprQuery = null;
    function watchDpr() {
      dprQuery?.removeEventListener?.("change", onDpr);
      dprQuery = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprQuery?.addEventListener?.("change", onDpr);
    }
    function onDpr() {
      measure();
      watchDpr();
    }
    watchDpr();

    // Petting the cat makes it purr. Only the cat itself counts, not the
    // empty corners of its frame.
    function overCat(event) {
      if (!st.pose) return false;
      const rect = dom.walker.getBoundingClientRect();
      let x = (event.clientX - rect.left) / st.px;
      const y = (event.clientY - rect.top) / st.px;
      if (st.dir < 0) x = FRAME.w - x;
      const mask = art.masks[st.pose];
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const cx = Math.floor(x) + dx;
          const cy = Math.floor(y) + dy;
          if (cx >= 0 && cy >= 0 && cx < FRAME.w && cy < FRAME.h && mask[cy * FRAME.w + cx]) return true;
        }
      }
      return false;
    }
    dom.walker.addEventListener("pointermove", (event) => {
      dom.walker.classList.toggle("is-over-cat", overCat(event));
    });
    dom.walker.addEventListener("pointerleave", () => dom.walker.classList.remove("is-over-cat"));
    dom.walker.addEventListener("click", (event) => {
      if (!overCat(event)) return;
      setPurring(!purr.on);
    });

    /* ---------- Public ---------- */

    function sync({ enabled, running, night }) {
      const first = !st.ready;
      st.ready = true;
      if (first || night !== st.night) setNight(night);
      if (first || running !== st.running) {
        st.running = running;
        if (!running) st.stoppedAt = nowMs();
      }
      if (first || enabled !== st.enabled) setEnabled(enabled, !first);
      updateLoop();
    }

    /*
     * Runs the animation by hand, `ms` at a time in 60 Hz steps — for tools
     * and tests, where a page in a hidden tab never gets an animation frame.
     */
    function step(ms = 16) {
      if (!host.hidden) measure(); // no rendering in a hidden tab, so no ResizeObserver either
      for (let elapsed = 0; elapsed < ms; elapsed += 1000 / 60) {
        shift += 1000 / 60;
        update(nowMs(), 1 / 60);
      }
      st.last = nowMs();
      render(nowMs());
      return { pose: st.pose, x: st.x, dir: st.dir, eyes: st.eyes, px: st.px, trans: Boolean(st.trans) };
    }

    /* Everything off: the loop, the purr, the watchers. */
    function destroy() {
      purr.stop();
      st.enabled = false;
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
      resizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduceQuery?.removeEventListener?.("change", onReduce);
      dprQuery?.removeEventListener?.("change", onDpr);
    }

    /* Turn to face left (-1) or right (1) — for a cat that does not walk. */
    function face(dir) {
      const heading = st.turn ? st.turn.to : st.dir;
      if (dir === heading) return;
      if (st.reduced || !st.pose) {
        st.dir = dir;
        st.turn = null;
        return;
      }
      st.turn = { start: nowMs(), ms: 280, to: dir, kicked: false };
    }

    return {
      sync,
      face,
      destroy,
      setPurring,
      togglePurring: () => setPurring(!purr.on),
      isPurring: () => purr.on,
      step,
    };
  }

  return {
    create,
    // for tools/buddy-sprite
    FRAME,
    GROUND,
    PALETTE,
    buildGrids,
    compose,
    gridToCanvas,
    synthPurr,
  };
})();
