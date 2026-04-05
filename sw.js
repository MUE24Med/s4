/* ========================================
   sw.js - Service Worker v2.2
   ======================================== */

const CACHE_NAME = new URL(location.href).searchParams.get('v') || 'semester-4-cache-default';

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
// ACTIVATE
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
// FETCH — Cache First
// ============================================================
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;
    if (url.pathname.includes('sw.js')) return;

    const allowedOrigins = [
        self.location.origin,
        'raw.githubusercontent.com',
        'api.github.com',
        'cdnjs.cloudflare.com',
        'mozilla.github.io'
    ];
    if (!allowedOrigins.some(o => url.origin.includes(o))) return;

    event.respondWith(handleFetch(event.request));
});

async function handleFetch(request) {
    const cached = await caches.match(request);

    if (cached) {
        // ✅ background update — clone قبل أي استخدام
        if (shouldCache(request.url)) {
            updateCacheInBackground(request);
        }
        return cached;
    }

    // مش في الكاش — جيب من الشبكة
    try {
        const response = await fetch(request);
        if (shouldCache(request.url) && response && response.status === 200) {
            // ✅ clone الـ response قبل ما نرجعه أو نحطه في الكاش
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache).catch(() => {});
            });
        }
        return response;
    } catch (_err) {
        if (request.destination === 'document') {
            const fallback = await caches.match('./index.html');
            return fallback || offlinePage();
        }
        return new Response('Offline', { status: 503 });
    }
}

// ✅ background update منفصل — يعمل clone خاص بيه
function updateCacheInBackground(request) {
    fetch(request.clone()).then(response => {
        if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
                cache.put(request, response).catch(() => {});
            });
        }
    }).catch(() => {});
}

// ============================================================
// صفحة Offline
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
                body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }
                .container { max-width: 500px; padding: 40px; }
                h1 { font-size: 48px; margin: 0; }
                p { font-size: 18px; margin: 20px 0; }
                button { background: white; color: #667eea; border: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; cursor: pointer; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔌 وضع Offline</h1>
                <p>لا يوجد اتصال بالإنترنت</p>
                <button onclick="location.reload()">🔄 إعادة المحاولة</button>
            </div>
        </body>
        </html>`,
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }
    );
}

// ============================================================
// shouldCache
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
// رسائل
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

console.log(`%c✅ SW v2.2 - الكاش: ${CACHE_NAME}`, 'color:#00ff00;font-weight:bold;');
