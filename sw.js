// App shell service worker. Caches static assets so the page loads offline
// and updates promptly when files change. FCM background messages are handled
// by firebase-messaging-sw.js (registered separately by the Firebase SDK).

const CACHE_VERSION = "kfpool-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/app.js",
  "./js/admin.js",
  "./js/install.js",
  "./js/firebase-config.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/kelly-farm-pool-logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache cross-origin (Firebase SDKs, Google APIs) or Firestore traffic.
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML so updates appear quickly; cache-first for assets.
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("./index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
      );
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = all.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
      } else {
        await self.clients.openWindow("./index.html");
      }
    })(),
  );
});
