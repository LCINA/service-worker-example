var CACHE_NAME = 'my-first-cache';
var cacheNames = [
  '/',
  '/index.css',
  '/index.html',
  '/index.js',
  '/images/test-1.jpg'
];

/* 
这里将 cacheNames 缓存到 my-first-cache 中，可以打开 chrome dev-tools --> Application Cache Storage 查看是否该缓存。
*/ 
this.addEventListener('install', function (event) {
  console.log("install");
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('缓存数据：', cacheNames);
      return cache.addAll(cacheNames);
    })
  );
});

/*
安装成功后，进行激活操作，可以看到会把当前缓存列表给清空，所以在 Application Cache Storage 看不到
缓存数据就是这个原因。可以优化一下，在回调函数中重新缓存需要的文件等。
*/
self.addEventListener('activate', function (event) {
  console.log("activate");
  event.waitUntil(
    Promise.all([
      // 清理旧版本
      caches.keys().then(function (cacheList) {
        console.log("当前缓存列表：", cacheList);
        return Promise.all(
          cacheList.map(function (cacheName) {
            if (cacheName === 'my-first-cache') {
              console.log("清除当前缓存列表：", cacheList);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]),
    caches.open('my-second-cache').then(function (cache) {
      return cache.addAll(cacheNames);
    })
  );
});

/*
由于没有对图片某资源进行缓存，所以在离线情况下图片无法正常显示，可以在有网情况下，缓存请求成功的数据
*/ 
self.addEventListener('fetch', function (event) {
  console.log("fetch", event.request);
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // IMPORTANT:Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        var fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(function (response) {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          var responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function (cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }
      )
  );
});

// 实现一个每隔 2s 发送数据

// sw.js - install - activate - fetch - new sw.js - install - sw.js - fetch - new sw.js - activate - fetch

/*
  1. 对应页面对 sw.js 进行注册，浏览器后台启动 Service Worker install 步骤；
  2. install 过程，通常需要缓存某些静态资源，缓存成功后，进入 activate 状态；
  3. 激活成功后，重新加载页面后，Service Worker 将会对其作用域内的所有页面进行控制，一般会处于两种状态之一：Terminated 和 Fetch / Message；
  4. 若存在 fetch 事件，则返回对应缓存的数据，如果不存在，则走网络请求，最终将其也进行缓存；
  5. 修改 sw.js 文件，重现加载页面，Service Worker 会进行 install，进入 waiting 状态，仍由旧的 Service Worker 进行控制，
  关闭该变标签页面后，重新打开该页面，新的 Service Worker 获得控制权，旧的被终止，触发 activate 事件进行激活，进入步骤 3。
*/