/* ourAmrita service worker: offline shell, static asset cache and web push.
 * It never caches pages, API calls or anything with a session, only static files and the offline page. */
const VERSION = "v1";
const STATIC_CACHE = `ouramrita-static-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/amrita-192.png", "/icons/amrita-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => ["ouramrita-", "myamrita-", "campusconnect-"].some((prefix) => key.startsWith(prefix)) && key !== STATIC_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: always the network, with the offline page when there is no connection.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Built assets and icons are content-hashed or static: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) { const copy = response.clone(); caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)); }
        return response;
      })),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "ourAmrita", body: event.data ? event.data.text() : "" }; }
  const title = data.title || "ourAmrita";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "",
    icon: "/icons/amrita-192.png",
    badge: "/icons/amrita-192.png",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    vibrate: [120, 60, 120],
    data: { link: data.link || "/notifications" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) { client.navigate(link); return client.focus(); }
      }
      return self.clients.openWindow(link);
    }),
  );
});
