/*
 * Shape recipes for the study buddy: a ginger Maine Coon in a firefly
 * headband. Three poses share one head (catHead + catFace), so it stays the
 * same cat whatever the body is doing — walking, sitting, or curled up asleep.
 *
 * Maine Coon tells, all of which have to survive at ~100 px: tufted lynx
 * ears, a big head with a square muzzle, a cream ruff on the chest, a shaggy
 * belly fringe, sturdy legs, and a big bushy ringed tail.
 */
const GW = 56, GH = 52;

/* Skull geometry, kept in one place so the band can follow its top edge. */
const SKULL = { rx: 8.6, ry: 7.8, n: 2.3 };

function inSkull(hx, hy, x, y) {
  const dx = (x + 0.5 - hx) / SKULL.rx, dy = (y + 0.5 - hy) / SKULL.ry;
  return Math.pow(Math.abs(dx), SKULL.n) + Math.pow(Math.abs(dy), SKULL.n) <= 1;
}

/* Top edge of the skull in column x: where the headband sits. */
function skullTop(hx, hy, x) {
  for (let y = Math.floor(hy - SKULL.ry) - 1; y < hy; y += 1) if (inSkull(hx, hy, x, y)) return y;
  return null;
}

/* Ears sit wide apart, so the antennae can rise through the gap between. */
function ears(hx, hy, tilt) {
  return {
    far: { base: [[hx - 8.4, hy - 3.6], [hx - 3.4, hy - 7.6]], tip: [hx - 6.6 - tilt, hy - 12.8] },
    near: { base: [[hx + 0.2, hy - 7.8], [hx + 6.6, hy - 4.6]], tip: [hx + 3.8 + tilt, hy - 15] },
  };
}

/* Paint onto a scratch grid, outline it on its own, and hand back the rows —
   a part that keeps its own dark edge where it overlaps the body. */
function part(paint) {
  const g = blank(GW, GH);
  paint(g);
  return toStrings(outline(g, "o"));
}

/* Silhouette of the head. Ears first, so the skull overlaps their bases. */
function catHead(g, hx, hy, { earTilt = 0 } = {}) {
  const e = ears(hx, hy, earTilt);
  tri(g, ...e.far.base[0], ...e.far.base[1], ...e.far.tip, "d");     // far ear, in shade
  tri(g, ...e.near.base[0], ...e.near.base[1], ...e.near.tip, "f");   // near ear
  blob(g, hx, hy, SKULL.rx, SKULL.ry, "f", SKULL.n);
  blob(g, hx - 1.2, hy + 4.2, 9.2, 4.8, "f", 2.2);    // fluffy cheeks
  blob(g, hx + 5.8, hy + 2.8, 3.5, 2.8, "f", 2.2);    // square muzzle
}

/* Shading on the head — done before the outline pass. */
function catHeadShade(g, hx, hy) {
  blobShade(g, hx - 1, hy - 4.4, 7.4, 3.2, "l", 2.2);    // sunlit crown
  blobShade(g, hx + 6, hy + 3.6, 3.7, 2.3, "c", 2.2);    // cream muzzle
  blobShade(g, hx + 1.4, hy + 7, 6.4, 2.6, "c", 2.2);    // cream chin and throat
  // tabby: an "M" on the forehead and a stripe back from the eye
  rect(g, hx, hy - 5, 1, 2, "d");
  rect(g, hx + 2, hy - 5, 1, 2, "d");
  rect(g, hx - 4, hy, 3, 1, "d");
  rect(g, hx - 6, hy + 1, 3, 1, "d");
}

function frontOfRow(g, y) {
  for (let x = g[0].length - 1; x >= 0; x -= 1) if (g[y] && g[y][x] !== ".") return x;
  return null;
}

/* Face and costume — after the outline, so they can sit on the edge. */
function catFace(g, hx, hy, { asleep = false, earTilt = 0 } = {}) {
  const e = ears(hx, hy, earTilt);

  // inner ear: a smaller triangle inset from the near ear, fur left round it
  const inner = blank(GW, GH);
  tri(inner, hx + 1.6, hy - 7.6, hx + 5.2, hy - 6, e.near.tip[0] - 0.2, e.near.tip[1] + 3.4, "#");
  paintIf(g, "p", (x, y, k) => inner[y][x] === "#" && k === "f");

  // lynx tufts — the Maine Coon signature
  for (const tip of [e.far.tip, e.near.tip]) {
    rect(g, Math.round(tip[0] - 0.5), Math.round(tip[1]) - 2, 1, 2, "o");
  }

  // eye: green with a slit pupil, or shut
  if (asleep) {
    rect(g, hx + 2, hy - 1, 3, 1, "n");
    rect(g, hx + 1, hy - 2, 1, 1, "n");
  } else {
    rect(g, hx + 2, hy - 2, 3, 2, "e");
    rect(g, hx + 3, hy - 2, 1, 2, "n");
  }

  // nose at the very front of the muzzle, mouth tucked under it
  const noseY = hy + 1;
  const front = frontOfRow(g, noseY);
  if (front !== null) {
    rect(g, front - 1, noseY, 2, 1, "p");
    rect(g, front - 2, noseY + 2, 2, 1, "n");
    // whiskers fan out past the silhouette
    rect(g, front + 1, noseY + 1, 3, 1, "w");
    rect(g, front + 1, noseY + 3, 2, 1, "w");
    rect(g, front + 3, noseY + 4, 1, 1, "w");
  }

  // headband over the crown, with a dark line under it so it reads on any coat
  for (let x = hx - 4; x <= hx + 3; x += 1) {
    const y = skullTop(hx, hy, x);
    if (y === null) continue;
    g[y][x] = "a";
    if (g[y + 1] && g[y + 1][x] !== ".") g[y + 1][x] = "o";
  }
}

/* Tabby stripes: slanted bands, only over fur, only above a line. */
function stripes(g, xs, { slope = 0.35, width = 0.9, below = 99, above = 0 } = {}) {
  paintIf(g, "d", (x, y, k) =>
    (k === "f" || k === "l") && y < below && y > above &&
    xs.some((x0) => Math.abs((x - x0) - (y - 30) * slope) < width));
}

/* Long fur hanging off the belly: little downward tufts. */
function fringe(g, xs, y) {
  for (const x of xs) tri(g, x - 1.3, y, x + 1.3, y, x, y + 2.6, "f");
}

/* A leg with its paw, as it stands on the ground line (y = 47). */
function leg(g, x, top, key) {
  blob(g, x, (top + 46) / 2, 2.7, (46 - top) / 2 + 0.4, key, 2.4);
  blob(g, x + 0.6, 46.2, 3.1, 1.6, "c", 2.2);
}

/* A bushy tail with tabby rings. Rings run across the tube. */
function bushyTail(g, p0, p1, p2, radius, rings) {
  tube(g, p0, p1, p2, radius, "f");
  for (let i = 0; i < rings.length; i += 1) {
    const t = rings[i];
    const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
    const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
    blobShade(g, x, y, 1.1, radius(t) + 1, "d", 2, 0);
  }
}

/* ---------------- Standing / walking ---------------- */
const STAND_HEAD = [42, 20];

function catStand() {
  const g = blank(GW, GH);
  const [hx, hy] = STAND_HEAD;
  blob(g, 18, 31, 7.4, 8, "f", 2.2);        // fluffy rump
  blob(g, 27, 31, 13.5, 7.6, "f", 2.4);     // long body
  blob(g, 38, 29.5, 6.8, 8.6, "f", 2.2);    // chest under the head
  fringe(g, [20, 24, 28, 32], 37.6);
  catHead(g, hx, hy);

  blobShade(g, 27, 24.5, 12, 2.8, "l", 2.2);           // sunlit back
  stripes(g, [17, 22, 27, 32], { below: 34 });
  blobShade(g, 39.5, 32, 4.8, 6.2, "c", 2.2);           // cream ruff
  catHeadShade(g, hx, hy);

  const o = outline(g, "o");
  catFace(o, hx, hy);
  return o;
}

/* Raised, gently curled tail. Its own layer so it can sway. */
function tailStand() {
  return part((g) => {
    bushyTail(g, [14, 27], [4, 19], [10, 8],
      (t) => 2.7 + Math.sin(t * Math.PI) * 1.4 - t * 0.6, [0.32, 0.55, 0.78, 0.95]);
    paintIf(g, "l", (x, y, k) => k === "f" && x > 11 && y > 14 && y < 25);
  });
}

/* ---------------- Sitting ---------------- */
/*
 * Traced from a photo of a cat sitting in profile. The body is one tall
 * teardrop leaning forward: a single back line runs from the nape down to the
 * rump, and the haunch is just its lower bulge. Long front legs come straight
 * down from the chest with the paws a touch forward; the hind paw lies flat on
 * the ground between them and the haunch; and the tail goes out behind along
 * the ground with the tip curled up — not round the front, which is what the
 * first two drafts did and why they never looked like a cat sitting.
 */
const SIT_HEAD = [40, 16];

/*
 * A part whose own dark rim only starts at row yFrom. Above that row it is
 * plain fur and melts into whatever it overlaps — the chest — so a leg grows
 * out of the body; below it, the rim marks the leg out against the belly.
 */
function partFrom(paint, yFrom) {
  const rows = part(paint).map((r) => r.split(""));
  for (let y = 0; y < Math.min(yFrom, rows.length); y += 1)
    for (let x = 0; x < rows[y].length; x += 1)
      if (rows[y][x] === "o") rows[y][x] = "f";
  return rows.map((r) => r.join(""));
}

/* A slimmer front leg than the walking one — sitting, they read long. */
function frontLeg(g, x, top, key) {
  blob(g, x, (top + 46) / 2, 2.2, (46 - top) / 2 + 0.4, key, 2.4);
  blob(g, x + 1, 46.2, 3, 1.5, "c", 2.2);
}

function catSit() {
  const g = blank(GW, GH);
  const [hx, hy] = SIT_HEAD;

  /*
   * Legs must grow out of the body, not stand under it. Stamped on top as
   * separately outlined parts, each kept a dark rim across its top and read as
   * a stick propped under the cat — "the legs are detached from the body".
   * So: the tail, the hind paw and the far front leg go in first, plain fur
   * with no rim, and the body is painted over their roots. Only the near front
   * leg sits in front, and its rim starts below the chest (see partFrom).
   */
  stamp(g, part((p) => bushyTail(p, [21, 42.8], [8, 48.6], [6.4, 39.2],
    (t) => 2.3 - t * 0.8 + Math.sin(t * Math.PI) * 0.4, [0.36, 0.56, 0.76, 0.93])), 0, 0);
  blob(g, 33.6, 46.1, 4.4, 1.7, "f", 2.2);          // hind paw, flat on the ground
  blob(g, 36.8, 46.3, 1.8, 1.3, "c", 2);
  // As in the photo, the far front leg stands a touch ahead of the near one and
  // shows to its right.
  frontLeg(g, 44.4, 31, "d");

  blob(g, 27, 38.8, 9.2, 8.2, "f", 2.2);            // haunch — the folded hind leg
  blob(g, 36.4, 41.6, 3.4, 3.8, "f", 2.2);          // belly between haunch and front legs — no hole
  blob(g, 31, 31.5, 8.4, 11.4, "f", 2.2, 30);       // torso, leaning forward, back bowed
  blob(g, 36.2, 24.6, 6, 5.6, "f", 2.2);            // shoulders into the neck
  blob(g, 27.2, 30.6, 6.2, 6.4, "f", 2.2);          // rounds the back out — the photo's back is convex
  // The chest runs on down from the chin into the front legs. Without it the
  // space under the chin was empty and the legs started below a notch.
  blob(g, 41.2, 30.4, 4.3, 7.3, "f", 2.2, -6);
  catHead(g, hx, hy);

  blobShade(g, 29.5, 24.5, 4, 3.4, "l", 2.2);       // sun on the shoulders
  blobShade(g, 23.5, 33.5, 6, 2.6, "l", 2.2);       // sun on the top of the thigh
  paintIf(g, "d", (x, y, k) => (k === "f" || k === "l") && x >= 17 && x <= 34 && y >= 35 && y <= 45 &&
    [20.5, 24.5, 28.5].some((c) => Math.abs((x - c) + (y - 40) * 0.25) < 0.8));     // thigh stripes
  // flank stripes run round the body, across the spine rather than along it
  paintIf(g, "d", (x, y, k) => (k === "f" || k === "l") && x >= 22 && x <= 35 && y >= 23 && y <= 34 &&
    [24.5, 28.5].some((c) => Math.abs((x - c) - (y - 28) * 0.6) < 0.7));
  blobShade(g, 39, 26.5, 3, 4.6, "c", 2.2, 24);     // cream throat — a bib, not a sash
  catHeadShade(g, hx, hy);

  // the near front leg, in front of the belly but melting into the chest
  stamp(g, partFrom((p) => frontLeg(p, 41.2, 31, "f"), 38), 0, 0);

  fillHoles(g, "f");
  const o = outline(g, "o");
  catFace(o, hx, hy);
  return o;
}

/* ---------------- Lying, asleep ---------------- */
const LIE_HEAD = [40, 35];

function catLie() {
  const g = blank(GW, GH);
  const [hx, hy] = LIE_HEAD;
  blob(g, 25, 39.5, 15.4, 8, "f", 2.6);     // curled body
  // Front legs reach forward out of the chest and the chin rests on them.
  // Plain fur in the body grid, so they grow out of it — a separately
  // outlined paw read as a cushion left lying under the chin.
  blob(g, 42.6, 44.6, 6.6, 2.4, "f", 2.4);
  blob(g, 48, 45.5, 2.6, 1.5, "c", 2.2);    // the paws themselves
  catHead(g, hx, hy, { earTilt: 1.2 });

  blobShade(g, 24, 33, 13, 3, "l", 2.2);
  stripes(g, [14, 19, 24, 29], { below: 42 });
  catHeadShade(g, hx, hy);

  // tail wrapped round the front of the body, in front of it
  stamp(g, part((p) => bushyTail(p, [11, 40.5], [12, 46.2], [33, 44.4],
    (t) => 2.4 + Math.sin(t * Math.PI) * 0.7, [0.3, 0.52, 0.74, 0.92])), 0, 0);
  fillHoles(g, "f");

  const o = outline(g, "o");
  catFace(o, hx, hy, { asleep: true, earTilt: 1.2 });
  return o;
}

/* ---------------- Headband antennae ---------------- */
/*
 * Built for the standing head; the other poses reuse it with a delta. The
 * stems rise through the gap between the ears and the bulbs clear the tufts,
 * so ears and antennae never read as one shape.
 */
function antennae() {
  const g = blank(GW, GH);
  const [hx, hy] = STAND_HEAD;
  const left = [hx - 3, skullTop(hx, hy, hx - 3) - 1];
  const right = [hx, skullTop(hx, hy, hx) - 1];
  const bulbs = [[hx - 5.6, hy - 18.4], [hx + 2.6, hy - 19.2]];

  for (const [bx, by] of bulbs) blob(g, bx, by, 2.9, 2.9, "h", 2);

  const curve = (p0, p1, p2) => {
    for (let t = 0; t <= 1; t += 0.01) {
      const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
      const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
      if (g[Math.round(y)]) g[Math.round(y)][Math.round(x)] = "a";
    }
  };
  curve(left, [hx - 3.6, hy - 14.5], bulbs[0]);
  curve(right, [hx + 0.6, hy - 15], bulbs[1]);

  for (const [bx, by] of bulbs) {
    blob(g, bx, by, 1.6, 1.6, "a", 2.4);
    blob(g, bx - 0.3, by - 0.3, 0.8, 0.8, "g", 2);
  }
  return toStrings(g);
}

/* Walking legs. Each is outlined on its own before compositing, so a near leg
   still reads as separate when it crosses in front of the far one. */
function legFrame(far, near) {
  const out = blank(GW, 14);
  const one = (x, key) => {
    const l = blank(GW, GH);
    leg(l, x, 34, key);
    return toStrings(outline(l, "o")).slice(34, 48);
  };
  far.forEach((x) => stamp(out, one(x, "d"), 0, 0));
  near.forEach((x) => stamp(out, one(x, "f"), 0, 0));
  return toStrings(out);
}

function build() {
  const stand = toStrings(catStand());
  const sit = toStrings(catSit());
  const lie = toStrings(catLie());
  const tail = tailStand();
  const ant = antennae();
  const legsA = legFrame([16, 33], [21, 38]);
  const legsB = legFrame([20, 37], [17, 34]);

  // Antennae follow the head between poses.
  const POSE = {
    stand: { ant: [0, 0] },
    sit: { ant: [SIT_HEAD[0] - STAND_HEAD[0], SIT_HEAD[1] - STAND_HEAD[1]] },
    lie: { ant: [LIE_HEAD[0] - STAND_HEAD[0], LIE_HEAD[1] - STAND_HEAD[1]] },
  };

  // Preview only: pad the top, or a raised head's antennae fall off the grid.
  const PAD = 7;
  const mk = (bodyRows, key, extra) => {
    const c = blank(GW, GH + PAD);
    if (extra?.tail) stamp(c, extra.tail, 0, PAD);
    if (extra?.legs) stamp(c, extra.legs, 0, 34 + PAD);
    stamp(c, bodyRows, 0, PAD);
    stamp(c, ant, POSE[key].ant[0], POSE[key].ant[1] + PAD);
    return toStrings(c);
  };

  window.OUT = { stand, sit, lie, tail, ant, legsA, legsB, POSE };
  draw([
    mk(stand, "stand", { tail, legs: legsA }),
    mk(stand, "stand", { tail, legs: legsB }),
    mk(sit, "sit"),
    mk(lie, "lie"),
  ], 7);
}
