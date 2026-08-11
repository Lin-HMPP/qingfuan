// 青付安 Service Worker — 网络优先，离线回退
const CACHE = 'qingfuan-v4'

// 激活：清理所有旧版缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  )
  self.clients.claim()
})

// 请求拦截：网络优先，失败时回退到缓存
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.hostname === 'hm.baidu.com' || url.hostname === 'www.clarity.ms') return

  event.respondWith(
    fetch(event.request).then(response => {
      // 网络成功 → 更新缓存
      if (response.ok && url.origin === self.location.origin) {
        const clone = response.clone()
        caches.open(CACHE).then(cache => cache.put(event.request, clone))
      }
      return response
    }).catch(() => {
      // 网络失败 → 尝试缓存
      return caches.match(event.request).then(cached => {
        return cached || new Response('', { status: 503 })
      })
    })
  )
})
