// FCM background message handler. Loaded by Firebase when the app calls
// getToken(). Must live at the site root with this exact filename.

// Take over from any older SW immediately so a hosting redeploy doesn't get
// stuck behind a cached worker.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// Keep these values in sync with js/firebase-config.js. Service workers can't
// import ES modules in Safari yet, so we duplicate the config here.
firebase.initializeApp({
  apiKey: "AIzaSyD_spm6KjI7zV3Z0NjZVdNNp7AsroqGmSk",
  authDomain: "kelly-farm-pool-status-6bd85.firebaseapp.com",
  projectId: "kelly-farm-pool-status-6bd85",
  storageBucket: "kelly-farm-pool-status-6bd85.firebasestorage.app",
  messagingSenderId: "412302688419",
  appId: "1:412302688419:web:36a94ee13680a19012ff16",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || "Kelly Farm Pool status update";
  const body = data.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    // No tag: Chrome on macOS sometimes silently replaces same-tag
    // notifications even with renotify:true, so we let each status change
    // alert independently.
    data: { url: data.url || "/index.html" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./index.html";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = all.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url).catch(() => {});
      } else {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
