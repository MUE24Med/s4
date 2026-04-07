/* ========================================
   sw.js - Service Worker محسّن للسرعة
   استراتيجية stale-while-revalidate + تحميل متوازي
   ======================================== */

const url = new URL(self.location.href);
const CACHE_NAME = url.searchParams.get('v') || 'semester-4-cache-v2';
const CRITICAL_CACHE_NAME = `${CACHE_NAME}-critical`;

// الموارد الأساسية التي تظهر أول شاشة (يتم تخزينها فوراً)
const criticalResources = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './image/0.png'
];

// باقي الموارد (تحميلها في الخلفية دون انتظار)
const secondaryResources = [
    './tracker.js',
    './manifest.json',
    './javascript/core/config.js',
    './javascript/core/utils.js',
    './javascript/core/navigation.js',
    './javascript/core/group-loader.js',
    './javascript/core/state.js',
    './javascript/core/back-button.js',
    './javascript/ui/pdf-viewer.js',
    './javascript/ui/wood-interface.js',
    './javascript/ui/search-and-eye.js',
    './javascript/ui/ui-controls.js',
    './javascript/ui/scroll-system.js',
    './javascript/features/preload-game.js',
    './javascript/features/preload.js',
    './javascript/features/svg-processor.js',
    './javascript/features/leaderboard-core.js',
    './javascript/features/leaderboard-ui.js',
    './javascript/features/mini-game.js',
    './image/wood.webp',
    './image/Upper_wood.webp'
];

// ========== INSTALL: تخزين أساسي سريع ==========
self.addEventListener('install', event => {
    console.log('🔧 SW install (fast mode)');
    event.waitUntil(
        caches.open(CRITICAL_CACHE_NAME)
            .then(cache => cache.addAll(criticalResources))
            .then(() => {
                // تحميل باقي الموارد في الخلفية دون إبطاء التثبيت
                caches.open(CACHE_NAME).then(cache => {
                    cache.addAll(secondaryResources).catch(console.warn);
                });
                return self.skipWaiting();
            })
    );
});

// ========== ACTIVATE: تنظيف الكاش القديم فوراً ==========
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME && k !== CRITICAL_CACHE_NAME)
                .map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// ========== FETCH: استراتيجيات مختلفة حسب نوع المورد ==========
self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);

    // تجاهل طلبات API و PDF و Formspree
    if (url.pathname.includes('/api/github') ||
        url.pathname.includes('.pdf') ||
        url.pathname.includes('formspree')) {
        return;
    }

    // للموارد النصية (HTML, CSS, JS) => stale-while-revalidate
    if (req.destination === 'document' ||
        req.destination === 'style' ||
        req.destination === 'script') {
        event.respondWith(staleWhileRevalidate(req));
    } else {
        // للصور والملفات الثابتة => cache first سريع جداً
        event.respondWith(cacheFirst(req));
    }
});

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
    }).catch(() => null);
    return cached || fetchPromise;
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
}

// صفحة Offline احتياطية (نفس السابقة)
function offlinePage() {
    return new Response(
        `<!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"><title>وضع Offline</title><style>body{font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;text-align:center}.container{max-width:500px;padding:40px}h1{font-size:48px}button{background:#fff;color:#667eea;border:none;padding:15px 30px;border-radius:8px;cursor:pointer}</style></head>
        <body><div class="container"><h1>🔌 وضع Offline</h1><p>لا يوجد اتصال بالإنترنت</p><button onclick="location.reload()">🔄 إعادة المحاولة</button></div></body>
        </html>`,
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
}

console.log(`%c✅ SW v3.0 - Fast Cache: ${CACHE_NAME}`, 'color:#00ff00;font-weight:bold;');