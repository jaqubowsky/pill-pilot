const CACHE_VERSION = 1;
const STATIC_CACHE = `pillpilot-static-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `pillpilot-runtime-v${CACHE_VERSION}`;

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter(
						(key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE,
					)
					.map((key) => caches.delete(key)),
			),
		),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (request.method !== "GET") return;
	if (url.origin !== self.location.origin) return;

	if (url.pathname.startsWith("/_next/static/")) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then((response) => {
						const clone = response.clone();
						caches
							.open(STATIC_CACHE)
							.then((cache) => cache.put(request, clone));
						return response;
					}),
			),
		);
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request).catch(() => caches.match(request)),
		);
		return;
	}
});

self.addEventListener("push", (event) => {
	if (!event.data) return;
	const data = event.data.json();
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: data.icon || "/icon-192x192.png",
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(self.clients.openWindow("/dashboard"));
});
