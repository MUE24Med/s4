/* ========================================
   sw.js - Service Worker v2.1
   ======================================== */

const CACHE_NAME = 'semester-4-cache-2026-04-05-02-00';
const urlsToCache = [
   './',
   './index.html',
   './style.css',
   './tracker.js',
   './script.js',
   './manifest.json',
   './javascript/core/config.js',
   './javascript/core/utils.js',
   './javascript/core/navigation.js',
   './javascript/core/group-loader.js',
   './javascript/core/state.js',
   './javascript/ui/pdf-viewer.js',
   './javascript/ui/wood-interface.js',
   './javascript/ui/search-and-eye.js',
   './javascript/ui/ui-controls.js',
   './javascript/ui/scroll-system.js',
   './javascript/features/leaderboard-core.js',
   './javascript/features/mini-game.js',
   './javascript/features/leaderboard-ui.js',
   './javascript/features/preload-game.js',
   './javascript/features/preload.js',
   './javascript/features/svg-processor.js',
   './image/0.webp',
   './image/0.png',
   './image/wood.webp',
   './image/Upper_wood.webp'
];

// ============================================================
// INSTALL
// ============================================================
self.addEventListener('install', event => {
    console.log('🔧 SW: تثبيت الإصدار', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.all(
                urlsToCache.map(url =>
                    cache.add(url).catch(err => {
                        console.warn(`⚠️ فشل تخزين: ${url}`, err);
                        return Promise.resolve();
                    })
                )
            )
        ).then(() => {
            console.log('✅ SW: تم التثبيت');
            return self.skipWaiting();
        })
    );
});

// ============================================================
// ACTIVATE — حذف الكاش القديم
// ============================================================
self.addEventListener('activate', event => {
    console.log('🚀 SW: تفعيل الإصدار', CACHE_NAME);
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log(`🗑️ حذف كاش قديم: ${key}`);
                        return caches.delete(key);
                    })
            )
        ).then(() => {
            console.log('✅ SW: تم التفعيل');
            return self.clients.claim();
        })
    );
});

// ============================================================
// FETCH — Cache First مع Background Update
// ============================================================
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // تجاهل طلبات غير مدعومة
    if (event.request.method !== 'GET') return;
    if (url.pathname.includes('sw.js')) return;

    // تجاهل مصادر خارجية غير مصرّح بها
    const allowedOrigins = [
        self.location.origin,
        'raw.githubusercontent.com',
        'api.github.com',
        'cdnjs.cloudflare.com',
        'mozilla.github.io'
    ];
    const isAllowed = allowedOrigins.some(o => url.origin.includes(o));
    if (!isAllowed) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            // تحديث في الخلفية إن وجد في الكاش
            if (cached) {
                if (shouldCache(event.request.url)) {
                    fetch(event.request)
                        .then(response => {
                            if (response && response.status === 200) {
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, response.clone()).catch(() => {});
                                });
                            }
                        })
                        .catch(() => {});
                }
                return cached;
            }

            // جلب من الشبكة
            return fetch(event.request)
                .then(response => {
                    if (shouldCache(event.request.url) && response && response.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response.clone()).catch(() => {});
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback للصفحات
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html').then(r => r || offlinePage());
                    }
                    return new Response('Offline', { status: 503 });
                });
        })
    );
});

// ============================================================
// صفحة Offline الاحتياطية
// ============================================================
function offlinePage() {
    return new Response(
        `<!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>وضع Offline</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                }
                .container { max-width: 500px; padding: 40px; }
                h1 { font-size: 48px; margin: 0; }
                p { font-size: 18px; margin: 20px 0; }
                button {
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 15px 30px;
                    font-size: 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 20px;
                }
                button:hover { background: #f0f0f0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔌 وضع Offline</h1>
                <p>لا يوجد اتصال بالإنترنت</p>
                <p>تأكد من اتصالك بالشبكة ثم حاول مرة أخرى</p>
                <button onclick="location.reload()">🔄 إعادة المحاولة</button>
            </div>
        </body>
        </html>`,
        {
            status: 503,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            }
        }
    );
}

// ============================================================
// shouldCache — ما يُحفظ في الكاش
// ============================================================
function shouldCache(url) {
    try {
        const pathname = new URL(url).pathname;
        if (pathname.includes('sw.js')) return false;
        if (pathname.includes('/javascript/')) return true;
        if (pathname.includes('/image/')) return true;
        if (pathname.match(/\.(html|css|js|webp|png|jpg|jpeg|svg|pdf|json|woff2?)$/)) return true;
        return false;
    } catch {
        return false;
    }
}

// ============================================================
// رسائل من الصفحة الرئيسية
// ============================================================
self.addEventListener('message', event => {
    if (!event.data) return;

    if (event.data.action === 'skipWaiting') {
        console.log('⏭️ skipWaiting');
        self.skipWaiting();
    }

    if (event.data.action === 'clearCache') {
        console.log('🗑️ مسح الكاش');
        event.waitUntil(
            caches.keys()
                .then(names => Promise.all(names.map(n => caches.delete(n))))
                .then(() => {
                    console.log('✅ تم مسح الكاش');
                    self.clients.matchAll().then(clients =>
                        clients.forEach(c => c.postMessage({ type: 'CACHE_CLEARED' }))
                    );
                })
        );
    }
});

console.log(`%c✅ SW v2.1 - الكاش: ${CACHE_NAME}`, 'color:#00ff00;font-weight:bold;');
