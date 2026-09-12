/*
 * LegalCore service worker — offline support for an installed app.
 *
 * Hand-written rather than generated, because the caching rules here are not
 * generic: this app ships its legal corpus inside the JavaScript bundle, so
 * caching the bundle caches the library. What must never be cached is anything
 * touching Supabase — sessions, profiles, config and analytics all have to be
 * live, and a stale auth response is how you end up serving one person's session
 * to another.
 *
 * Strategy per request type:
 *   Supabase, non-GET, cross-origin APIs → not handled at all (straight to network)
 *   navigations                          → network first, cached shell when offline
 *   /assets/* (content-hashed by Vite)   → cache first; the URL changes when the
 *                                          content does, so it can never go stale
 *   fonts, images                        → cache first
 *   other same-origin GETs               → stale-while-revalidate
 */

const VERSION = 'v1';
const SHELL = `legalcore-shell-${VERSION}`;
const ASSETS = `legalcore-assets-${VERSION}`;
const MEDIA = `legalcore-media-${VERSION}`;
const CURRENT = new Set([SHELL, ASSETS, MEDIA]);

const SHELL_URL = '/index.html';

// Enough to boot the app with no network. Hashed bundles are added at runtime
// because their filenames are only known after a build.
const PRECACHE = [
  '/',
  SHELL_URL,
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/font/Anak Paud.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then(async (cache) => {
      // Individually, so one missing file cannot fail the whole install.
      await Promise.all(
        PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})),
      );
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('legalcore-') && !CURRENT.has(k)).map((k) => caches.delete(k)));
      // Navigation preload is a free win where supported.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(() => {});
      }
      await self.clients.claim();
    })(),
  );
});

// The page asks for this once the user accepts an update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/** Anything user-specific or authenticated must not be intercepted. */
function isLive(url, request) {
  return (
    url.hostname.endsWith('.supabase.co') ||
    url.pathname.startsWith('/auth/v1') ||
    url.pathname.startsWith('/rest/v1') ||
    request.headers.has('Authorization')
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  // Opaque (cross-origin, no-cors) responses have status 0 but are still usable.
  if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()).catch(() => {});
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => undefined);
  return hit || (await network) || Response.error();
}

async function handleNavigation(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) {
      caches.open(SHELL).then((c) => c.put(SHELL_URL, preloaded.clone())).catch(() => {});
      return preloaded;
    }
    // Network first, so a fresh deploy is picked up rather than pinned forever.
    const res = await fetch(event.request);
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(SHELL).then((c) => c.put(SHELL_URL, copy)).catch(() => {});
    }
    return res;
  } catch {
    // Offline. Hand back the shell and let the SPA router resolve the path.
    const cache = await caches.open(SHELL);
    return (await cache.match(SHELL_URL)) || (await cache.match('/')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (isLive(url, request)) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  if (request.destination === 'font' || request.destination === 'image' || /\.(png|jpe?g|svg|webp|woff2?|ttf|otf|geojson)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, MEDIA));
    return;
  }

  if (sameOrigin) event.respondWith(staleWhileRevalidate(request, SHELL));
});
