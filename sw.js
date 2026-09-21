/* HomePlan: service worker
   - index.html: primero la red (así los cambios llegan enseguida); si no hay conexión, la copia guardada.
   - SDK de Firebase, fuentes e iconos: primero la copia guardada.
   - Las peticiones a la base de datos de Firebase NO pasan por aquí. */
const CACHE = 'homeplan-v1.0';
const BASICOS = ['./', './index.html', './manifest.json', './icono-192.png', './icono-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mismoSitio = url.origin === self.location.origin;
  const estatico = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')
    || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (mismoSitio && (req.mode === 'navigate' || url.pathname.endsWith('.html'))) {
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copia));
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (mismoSitio || estatico) {
    e.respondWith(caches.match(req).then(g => g || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return r;
    })));
  }
});
