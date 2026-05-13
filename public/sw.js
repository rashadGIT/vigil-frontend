// TODO Phase 2: Implement offline-first caching for case list and task checklist reads.
// Strategy: cache-first for GET /cases and GET /cases/:id/tasks.
// Requires workbox-webpack-plugin or next-pwa package.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
