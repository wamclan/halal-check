/* Halal Lens offline shell — never caches images, API responses, or user-entered text. */
const CACHE = "halal-lens-evidence-20261102-perf";
const SHELL = ["/","/encyclopedia","/css/app.css","/css/evidence.css","/js/i18n.js","/js/engine.js","/js/evidence-core.js","/js/evidence-ui.js","/js/app.js","/js/scanner.js","/js/scan-utils.js","/data/rules.json","/data/e-number-screening.json","/data/evidence-knowledge.json","/favicon.svg","/manifest.webmanifest"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("halal-lens-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req=event.request;
  if(req.method !== "GET") return;
  const url=new URL(req.url);
  if(url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if(req.mode === "navigate" || url.pathname.startsWith("/data/") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(fetch(req).then(response => {
      if(response.ok) { const clone=response.clone(); caches.open(CACHE).then(c=>c.put(req,clone)).catch(()=>{}); }
      return response;
    }).catch(() => caches.match(req).then(cached => cached || Response.error())));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});