/*
 * Shape recipes traced off the reference art. Three poses share one head and
 * one snout so the face stays recognisable; what changes is how the body sits
 * under it — standing, sitting back on the haunches, or lying down as a loaf.
 */
const GW = 56, GH = 52;

/* Head, snout, ear and face, placed at (hx, hy) — the head centre. */
function face(g, hx, hy, tilt) {
  blob(g, hx, hy, 11, 11, "f", 2.2);
  blob(g, hx + 8, hy + 3, 5.2, 6, "f", 2.1);
  blob(g, hx - 9, hy - 9 + (tilt || 0), 3.8, 4.4, "f", 2);
}

function faceMarks(g, hx, hy, tilt) {
  blobShade(g, hx, hy - 6, 10, 8, "l", 2.1);
  blobShade(g, hx - 9, hy - 8 + (tilt || 0), 2.4, 2.8, "d", 2);
  blobShade(g, hx + 8, hy + 2, 5.6, 6.4, "m", 2.1);
  blob(g, hx + 9.5, hy - 2, 2.6, 2, "n", 2.4);
  rect(g, hx - 3, hy - 4, 4, 1, "n");
  rect(g, hx - 4, hy - 3, 1, 1, "n"); rect(g, hx + 1, hy - 3, 1, 1, "n");
  rect(g, hx + 5, hy + 6, 3, 1, "n");
  rect(g, hx + 4, hy + 5, 1, 1, "n"); rect(g, hx + 8, hy + 5, 1, 1, "n");
}

/* Standing — the walking pose. Legs come from legFrame(). */
function capyStand() {
  const g = blank(GW, GH);
  blob(g, 23, 31, 16.5, 13, "f", 2.5);
  blob(g, 35, 29, 10.5, 14, "f", 2.5);
  face(g, 40, 20);
  blobShade(g, 26, 21, 17, 11, "l", 2.2);
  blobShade(g, 24, 48, 16, 8, "d", 2.3);
  faceMarks(g, 40, 20);
  return outline(g, "o");
}

/*
 * Sitting — rump on the ground, chest upright, front legs propped straight.
 * The haunch is a darker bump so the folded rear leg reads.
 */
function capySit() {
  const g = blank(GW, GH);
  blob(g, 37, 42, 3, 5.5, "f", 2.4);          // front legs, propped
  blob(g, 43, 42, 3, 5.5, "f", 2.4);
  blob(g, 19, 36, 14, 11, "f", 2.5);          // rump on the ground
  blob(g, 32, 30, 10.5, 14, "f", 2.4);        // upright chest
  face(g, 40, 18);
  blobShade(g, 24, 23, 15, 10, "l", 2.2);
  blobShade(g, 24, 49, 16, 8, "d", 2.3);
  blobShade(g, 16, 39, 8, 7, "d", 2.4);       // folded haunch
  faceMarks(g, 40, 18);
  return outline(g, "o");
}

/* Lying — a loaf. Legs tucked away, head low and forward, back flat. */
function capyLie() {
  const g = blank(GW, GH);
  blob(g, 22, 39, 17, 8.5, "f", 2.7);         // flat back
  blob(g, 31, 38, 9, 9.5, "f", 2.5);          // shoulder
  blob(g, 45, 45, 6.5, 2.8, "f", 2.4);        // paws tucked under the chin
  face(g, 41, 32, 1);
  blobShade(g, 23, 32, 16, 6, "l", 2.3);
  blobShade(g, 24, 50, 17, 7, "d", 2.4);
  faceMarks(g, 41, 32, 1);
  return outline(g, "o");
}

/* Two wings fanning up and back off the shoulder, brighter along the spine. */
function wings() {
  const g = blank(GW, GH);
  blob(g, 19, 11, 13, 4.8, "a", 2.2, 30);
  blob(g, 19, 18, 12, 4.4, "a", 2.2, 14);
  blobShade(g, 17, 12, 9, 2.6, "g", 2.2, 30);
  blobShade(g, 17, 18, 8.5, 2.2, "g", 2.2, 14);
  return toStrings(g);
}

function antennae() {
  const g = blank(GW, GH);
  const curve = (p0, p1, p2) => {
    for (let t = 0; t <= 1; t += 0.01) {
      const x = (1-t)*(1-t)*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0];
      const y = (1-t)*(1-t)*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1];
      if (g[Math.round(y)]) g[Math.round(y)][Math.round(x)] = "a";
    }
  };
  curve([36, 11], [33, 4], [35, 2]);
  curve([40, 9], [45, 2], [49, 6]);
  blob(g, 35, 2, 2.2, 2.2, "g", 3);
  blob(g, 49, 6, 2.2, 2.2, "g", 3);
  return toStrings(g);
}

/* Each leg is outlined on its own before compositing, so a near leg still
   reads as separate when it crosses in front of the far one. */
function legFrame(far, near) {
  const out = blank(GW, 12);
  const one = (x, key) => {
    const l = blank(GW, 12);
    blob(l, x, 6, 2.8, 6, key, 2.4);
    return toStrings(outline(l, "o"));
  };
  far.forEach((x) => stamp(out, one(x, "d"), 0, 0));
  near.forEach((x) => stamp(out, one(x, "f"), 0, 0));
  return toStrings(out);
}

function build() {
  const stand = toStrings(capyStand());
  const sit = toStrings(capySit());
  const lie = toStrings(capyLie());
  const wing = wings();
  const ant = antennae();
  const legsA = legFrame([15, 31], [23, 39]);
  const legsB = legFrame([21, 37], [17, 33]);

  // Head centres per pose drive where the wings and antennae get stamped.
  const POSE = {
    stand: { wing: [0, 0], ant: [0, 0] },
    sit: { wing: [2, 0], ant: [0, -2] },
    lie: { wing: [4, 11], ant: [1, 12] },
  };

  const mk = (bodyRows, legs, key) => {
    const c = blank(GW, GH);
    stamp(c, wing, POSE[key].wing[0], POSE[key].wing[1]);
    if (legs) stamp(c, legs, 0, 36);
    stamp(c, bodyRows, 0, 0);
    stamp(c, ant, POSE[key].ant[0], POSE[key].ant[1]);
    return toStrings(c);
  };

  window.OUT = { stand, sit, lie, wing, ant, legsA, legsB, POSE };
  draw([mk(stand, legsA, 'stand'), mk(stand, legsB, 'stand'), mk(sit, null, 'sit'), mk(lie, null, 'lie')], 7);
}
