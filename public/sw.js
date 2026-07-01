// Service Worker untuk Kos-kosan PWA
// Versi: v2 — lebih konservatif, tidak intercept navigasi HTML
const CACHE_NAME = 'koskosan-v2';

// ── Install ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/icons/icon-192.png',
        '/icons/icon-512.png',
      ]);
    })
  );
  self.skipWaiting();
});

// ── Activate: hapus cache lama ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Abaikan semua non-GET
  if (request.method !== 'GET') return;

  // JANGAN intercept navigasi HTML — biarkan browser & Next.js handle sendiri
  // Ini mencegah bug: SW return halaman yang salah saat route belum compiled
  if (request.mode === 'navigate') return;

  // JANGAN intercept Next.js internal requests (JS chunks, CSS, data)
  if (url.pathname.startsWith('/_next/')) return;

  // JANGAN intercept API calls
  if (url.pathname.startsWith('/api/')) return;

  // Hanya cache icon/gambar statis dari folder /icons/
  // Ini ringan dan tidak mengganggu routing Next.js
  if (url.pathname.startsWith('/icons/') &&
      url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }

  // Semua request lain: biarkan browser handle normal (tidak di-intercept)
});
