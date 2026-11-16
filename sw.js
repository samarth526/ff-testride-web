/* App-shell cache: the form keeps loading with no network; data still queues
   on-device and syncs when the connection returns. */
var CACHE = 'ffta-shell-v1';
var SHELL = ['./', './index.html', './manifest.json'];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  /* Stale-while-revalidate: serve from cache instantly, refresh in background
     so a deploy reaches the device on its next load. */
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then(function (hit) {
      var fresh = fetch(e.request).then(function (res) {
        if (res && res.ok) c.put(e.request.mode === 'navigate' ? './index.html' : e.request, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || fresh;
    });
  }));
});
