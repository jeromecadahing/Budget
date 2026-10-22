// Lets the Budget Tracker (and Quick log) open as an app and work without signal.
// Pages are fetched fresh whenever you're online (so updates show straight away),
// and the last copy is used when you're offline. Data sync is handled separately by Firebase.
const CACHE = "budget-tracker-v5";
const CORE = ["./", "./index.html", "./log.html", "./log.webmanifest", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
const FIREBASE_JS = "https://www.gstatic.com/firebasejs/";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Firebase's script files: keep a copy so Quick log can start offline. Its data calls still go to the network.
  if (req.url.startsWith(FIREBASE_JS)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
    return;
  }
  if (url.origin !== self.location.origin) return;          // Firestore, fonts, exchange rates: leave to the network
  const isPage = req.mode ===
