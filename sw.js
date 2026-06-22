// 经济法刷题 - Service Worker
const CACHE_NAME = 'jingjifa-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安装：预缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 正在缓存核心文件...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('🗑️ 删除旧缓存:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先，网络兜底
self.addEventListener('fetch', event => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 缓存命中，直接返回
      if (cached) return cached;

      // 没缓存，走网络
      return fetch(event.request).then(response => {
        // 只缓存成功的 GET 响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });

        return response;
      }).catch(() => {
        // 网络失败，离线兜底
        // 对于 HTML 请求返回缓存的 index.html
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
        // 其他资源静默失败
        return new Response('', { status: 408 });
      });
    })
  );
});
