const CACHE_NAME = 'buildcalc-pwa-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon192px.png',
  './icon512px.png'
];

// Event Install: Menyimpan file-file penting ke memori cache HP
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  // Memaksa Service Worker baru untuk langsung aktif tanpa menunggu pengguna menutup browser
  self.skipWaiting();
});

// Event Activate: Membersihkan cache versi lama jika ada update aplikasi di GitHub
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Mengambil alih kontrol klien (halaman web) seketika
  self.clients.claim();
});

// Event Fetch (STRATEGI BARU: NETWORK-FIRST)
// Meminta file terbaru dari Internet (GitHub) terlebih dahulu. 
// Jika sukses, tampilkan yang terbaru dan simpan ke HP. Jika offline/gagal, tampilkan versi tersimpan di HP.
self.addEventListener('fetch', (event) => {
  // Hanya proses request dengan skema http/https
  if (!(event.request.url.startsWith('http:') || event.request.url.startsWith('https:'))) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika online dan berhasil ambil data dari GitHub, update cache di HP pengguna secara diam-diam
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Jika gagal fetch (karena HP pengguna sedang offline / tidak ada sinyal internet),
        // maka berikan file yang sudah tersimpan (cache) dari HP.
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jika file tidak ada di cache dan ini adalah request navigasi halaman, arahkan ke index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
