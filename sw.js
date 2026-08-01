const CACHE_NAME = 'buildcalc-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Event Install: Menyimpan file-file penting ke memori cache HP
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Event Activate: Membersihkan cache lama jika ada update aplikasi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Event Fetch: Mengambil file dari Cache jika offline, atau dari Internet jika online
self.addEventListener('fetch', (event) => {
  // Hanya proses request dengan skema http/https (mencegah error pada ekstensi browser)
  if (!(event.request.url.startsWith('http:') || event.request.url.startsWith('https:'))) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cache jika ada, jika tidak, fetch dari internet
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // Simpan cache baru untuk kunjungan berikutnya
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
      .catch(() => {
        // Jika offline dan file tidak ada di cache, arahkan ke index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
