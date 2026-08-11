// 青付安 Service Worker — 已弃用，自毁
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', () => {
  self.registration.unregister()
    .then(() => self.clients.matchAll().then(clients => clients.forEach(c => c.navigate(c.url))))
})
