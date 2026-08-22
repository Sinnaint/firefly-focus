/*
 * Shape recipe traced off the reference art: a big rounded body, a large head
 * set high on the right, blunt snout, rounded ear, closed happy eye, and two
 * swept firefly wings rising off the shoulder.
 */
const GW = 56, GH = 52;

function capy() {
  const g = blank(GW, GH);

  // silhouette — flat-bottomed superellipses so the legs have somewhere to sit
  blob(g, 23, 31, 16.5, 13, "f", 2.5);
  blob(g, 35, 29, 10.5, 14, "f", 2.5);
  blob(g, 40, 20, 11, 11, "f", 2.2);
  blob(g, 48, 23, 5.2, 6, "f", 2.1);
  blob(g, 31, 11, 3.8, 4.4, "f", 2);

  // sunlit top, shadow underneath
  blobShade(g, 26, 21, 17, 11, "l", 2.2);
  blobShade(g, 40, 14, 10, 8, "l", 2.1);
  blobShade(g, 24, 48, 16, 8, "d", 2.3);
  blobShade(g, 31, 12, 2.4, 2.8, "d", 2);

  // muzzle patch and features
  blobShade(g, 48, 22, 5.6, 6.4, "m", 2.1);
  blob(g, 49.5, 18, 2.6, 2, "n", 2.4);
  rect(g, 37, 16, 4, 1, "n");
  rect(g, 36, 17, 1, 1, "n"); rect(g, 41, 17, 1, 1, "n");
  rect(g, 45, 26, 3, 1, "n");
  rect(g, 44, 25, 1, 1, "n"); rect(g, 48, 25, 1, 1, "n");

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
  const body = toStrings(capy());
  const wing = wings();
  const ant = antennae();
  const legsA = legFrame([15, 31], [23, 39]);
  const legsB = legFrame([21, 37], [17, 33]);

  const mk = (legs) => {
    const c = blank(GW, GH);
    stamp(c, wing, 0, 0);
    stamp(c, legs, 0, 36);
    stamp(c, body, 0, 0);
    stamp(c, ant, 0, 0);
    return toStrings(c);
  };

  window.OUT = { body, wing, ant, legsA, legsB };
  draw([mk(legsA), mk(legsB)], 9);
}
