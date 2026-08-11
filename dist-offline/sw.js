// 青付安 Service Worker — 离线缓存
const CACHE = 'qingfuan-v3'
const ASSETS = [
  '/qingfuan/',
  '/qingfuan/index.html',
]

// 安装：预缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  )
  self.clients.claim()
})

// 请求拦截：缓存优先，网络回退
self.addEventListener('fetch', event => {
  // 跳过非 GET 请求和第三方统计
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.hostname === 'hm.baidu.com' || url.hostname === 'www.clarity.ms') return

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        // 缓存成功的同源请求
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(event.request, clone))
        }
        return response
      }).catch(() => {
        // 离线且无缓存时，返回空响应
        return new Response('', { status: 503 })
      })
    })
  )
})
