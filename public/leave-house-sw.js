/* Service worker for the Leave House Alarm PWA.
 *
 * Kept deliberately small: it makes the app installable and handles
 * notification clicks (focus/open the app). It does NOT promise background
 * alarms — iOS does not allow web apps to run timers in the background, so the
 * authoritative alarm logic lives in the page while it is open. */

const CACHE = "leave-house-v1";
const APP_SHELL = ["/alarm"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Network-first for navigations so transit data stays fresh; fall back to cache
// when offline so the shell still opens.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/alarm").then((r) => r || fetch(req)))
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clients) => {
        for (const client of clients) {
          if (client.url.includes("/alarm") && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow("/alarm");
      }
    )
  );
});
