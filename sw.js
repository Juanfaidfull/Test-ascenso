/* ASCENSO: modo sin conexión. El juego queda guardado en el teléfono; la nube (Supabase) siempre va en vivo. */
const CACHE = 'ascenso-84bfd135cc7f';
const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.add('./index.html');
    for (const u of ['./manifest.json', './icon-192.png', './icon-512.png']) { try { await c.add(u); } catch (_) { } }
    try { const r = await fetch(CDN, { mode: 'no-cors' }); await c.put(CDN, r); } catch (_) { }
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.indexOf('ascenso-') === 0) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;          /* el multijugador y el ranking siempre van a la red */
  const propio = url.origin === self.location.origin;
  if (!propio && req.url !== CDN) return;
  e.respondWith(porCache(req));
});
async function porCache(req) {
  const c = await caches.open(CACHE);
  if (req.mode === 'navigate') { const pagina = await c.match('./index.html'); if (pagina) return pagina; }
  const hit = await c.match(req.url === CDN ? CDN : req, { ignoreSearch: true });
  if (hit) return hit;
  try {
    const r = await fetch(req);
    if (r.ok || r.type === 'opaque') c.put(req, r.clone());
    return r;
  } catch (err) { return Response.error(); }
}
