const CACHE_NAME = "transaction-tracker-cache-v3";
const DATA_CACHE_NAME = "tt-data-cache-v1";

const FILES_TO_CACHE = [
	"/",
	"index.html",
	"/assets/css/styles.css",
	"/assets/icons/icon-192x192.png",
	"/assets/icons/icon-512x512.png",
	"/assets/js/database.js",
	"/assets/js/index.js"
];

// INSTALL;
// =============: - stores files to cache;
self.addEventListener("install", function (evt) {
	evt.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			console.log("Pre-cache was successful!");
			return cache.addAll(FILES_TO_CACHE);
		})
	);

	self.skipWaiting();
});

// CLEAN;
// =============: - clears stale caches;
self.addEventListener("activate", function (evt) {
	evt.waitUntil(
		caches.keys().then(keyList => {
			return Promise.all(
				keyList.map(key => {
					if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
						console.log("Removing old cache data", key);
						return caches.delete(key);
					}
				})
			);
		})
	);

	self.clients.claim();
});

// Fetch;
// =============: - grabs data from api and stores it to cache;
self.addEventListener("fetch", function (event) {
	if (event.request.url.includes("/api/")) {
		// - cache data from /api routes
		event.respondWith(
			caches
				// - open DATA_CACHE;
				.open(DATA_CACHE_NAME)
				.then(cache => {
					return fetch(event.request)
						.then(response => {
							if (response.status === 200) {
								// - store data in cache.
								cache.put(event.request.url, response.clone());
							}

							return response;
						})
						.catch(err => {
							return cache.match(event.request);
						});
				})
				.catch(err => console.log(err))
		);

		return;
	}

	event.respondWith(
		fetch(event.request).catch(function () {
			return caches.match(event.request).then(function (response) {
				if (response) {
					return response;
				} else if (event.request.headers.get("accept").includes("text/html")) {
					// - return to homepage;
					return caches.match("/");
				}
			});
		})
	);
});
