/*
 * Offline cache for the installed app.
 *
 * Not to be confused with service_worker.js, which is the extension's timer
 * engine — the app loads that one as an ordinary script. This file only makes
 * the app start without a network, which is the whole promise of installing a
 * timer that never talks to a server anyway.
 *
 * Bump CACHE when any precached file changes, or an installed copy will keep
 * serving the old one.
 */
const CACHE = "firefly-focus-v2.5.0-cat-9";

const PRECACHE = [
  "./",
  "index.html",
  "ambient.html",
  "manifest.webmanifest",

  "app/shim.js",
  "app/boot.js",
  "app/app.css",

  // The extension's own pages and logic — the app runs these unchanged.
  "sidepanel.html",
  "sidepanel.css",
  "sidepanel.js",
  "fullscreen.html",
  "fullscreen.css",
  "fullscreen.js",
  "shared.js",
  "buddy.js",
  "service_worker.js",
  "offscreen.js",

  "icon128.png",
  "assets/logo/icon-256.png",
  "assets/logo/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      /*
       * Individually, so one missing file cannot fail the whole install and
       * leave the app with no offline copy at all — but say which one failed,
       * or a typo in the list above turns into "offline is just broken".
       */
      .then((cache) =>
        Promise.all(
          PRECACHE.map((url) =>
            cache.add(url).catch(() => console.warn("Not precached:", url))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/*
 * Cache first: every asset is versioned by the cache name, nothing here is
 * fetched from anywhere else, and starting instantly offline is the point.
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;

      return fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match("index.html"));
    })
  );
});
