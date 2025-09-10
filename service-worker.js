const CACHE_NAME = 'coc-timer-v250902123427';
const STATIC_CACHE = 'coc-timer-static-v250902123427';
const DYNAMIC_CACHE = 'coc-timer-dynamic-v250902123427';

// 静态资源缓存列表
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/main.css',
  './assets/js/app.js',
  './assets/js/pwa.js',
  './assets/data/namemap.js',
  './assets/img/setting.png',
  './assets/img/pwa-64x64.png',
  './assets/img/pwa-192x192.png',
  './assets/img/pwa-512x512.png',
  './assets/img/maskable-icon-512x512.png',
  './assets/img/favicon.ico',
  './assets/img/apple-touch-icon-180x180.png'
];

// CDN资源缓存列表
const CDN_ASSETS = [
  'https://unpkg.com/vue@2/dist/vue.js',
  'https://unpkg.com/element-ui/lib/index.js',
  'https://unpkg.com/element-ui/lib/theme-chalk/index.css'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  console.log('Service Worker: 安装中...');
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      }),
      // 缓存CDN资源
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('Service Worker: 缓存CDN资源');
        return cache.addAll(CDN_ASSETS);
      })
    ]).then(() => {
      console.log('Service Worker: 安装完成');
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('Service Worker: 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: 激活完成');
      return self.clients.claim();
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 处理静态资源请求
  if (url.origin === location.origin) {
    event.respondWith(handleStaticAssets(request));
    return;
  }

  // 处理CDN资源请求
  if (url.hostname === 'unpkg.com') {
    event.respondWith(handleCDNAssets(request));
    return;
  }

  // 其他请求使用网络优先策略
  event.respondWith(handleOtherRequests(request));
});

// 处理静态资源 - 缓存优先策略
async function handleStaticAssets(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: 静态资源请求失败', error);
    // 返回离线页面或默认响应
    if (request.destination === 'document') {
      return caches.match('./index.html');
    }
    throw error;
  }
}

// 处理CDN资源 - 缓存优先策略
async function handleCDNAssets(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: CDN资源请求失败', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 处理其他请求 - 网络优先策略
async function handleOtherRequests(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: 网络请求失败', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 处理消息事件
self.addEventListener('message', event => {
  const { data } = event;
  
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data && data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (data && data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// 后台同步事件（如果支持）
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
      console.log('Service Worker: 后台同步');
      // 这里可以添加后台同步逻辑
    }
  });
}

// 推送通知事件（如果需要）
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: './assets/img/icon-192x192.png',
      badge: './assets/img/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: '查看详情',
          icon: './assets/img/icon-96x96.png'
        },
        {
          action: 'close',
          title: '关闭',
          icon: './assets/img/icon-96x96.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});