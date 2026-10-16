const CACHE_NAME = 'fitdee-v1';
const ASSETS_TO_CACHE = [
	'/',
	'/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
		})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
			);
		})
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	// Let API requests bypass service worker cache
	if (event.request.url.includes('/api/')) {
		return;
	}
	event.respondWith(
		fetch(event.request).catch(() => {
			return caches.match(event.request);
		})
	);
});
