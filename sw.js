const CACHE_NAME = "dance-practice-companion-v2";
const SHELL_FILES = ["./", "./index.html", "./manifest.json",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-180.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let CDN (MediaPipe/fonts) calls go straight to network

  // Network-first: always serve the latest deployed version when online, updating the cache
  // as we go, and only fall back to whatever's cached when there's no connection. The previous
  // cache-first approach always served last visit's version even after a new deploy landed,
  // which made real code changes (like new features) look like they hadn't taken effect.
  event.respondWith(
    fetch(event.request).then((res) => {
      if (res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
      return res;
    }).catch(() => caches.match(event.request))
  );
});
