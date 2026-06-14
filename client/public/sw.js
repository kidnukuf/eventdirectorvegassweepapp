// Vegas Sweeps Funtime — Service Worker v2.0
// Offline-first PWA: caches all routes and static assets
// QR scanning is disabled in offline mode with a clear fallback message

const CACHE_NAME = "vegas-sweeps-v2";
const STATIC_ASSETS = [
  "/",
  "/admin",
  "/register",
  "/captain",
  "/doorman",
  "/bowler",
  "/program-director",
  "/import",
  "/manifest.json",
];

// Install: pre-cache all static routes
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-fatal: some routes may not be available at install time
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls: network-first, no cache fallback (real-time data must be fresh)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "OFFLINE", message: "No network connection. QR verification disabled." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // SSE stream: never cache
  if (url.pathname === "/api/events/stream") {
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // For navigation requests, return the cached root
          if (event.request.mode === "navigate") {
            return caches.match("/") || new Response("Offline", { status: 503 });
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Message handler: force update
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
