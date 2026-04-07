
/* ============================================================
   sw-register.js - Service Worker Registration
   ✅ لتغيير الكاش: غيّر SW_CACHE_NAME هنا فقط
   ============================================================ */
(function () {
  // ✅ المصدر الوحيد للحقيقة — غيّر هذا السطر فقط عند كل تحديث
  const SW_CACHE_NAME = 'semester-4-cache-2026-04-07-1030';

  // احفظه في localStorage عشان config.js يقدر يقرأه
  localStorage.setItem('sw_cache_name', SW_CACHE_NAME);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`./sw.js?v=${SW_CACHE_NAME}`)
        .then(registration => {
          console.log('✅ Service Worker مسجل:', SW_CACHE_NAME);
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('🔄 يوجد تحديث جديد. هل تريد إعادة التحميل؟')) {
                  newWorker.postMessage({ action: 'skipWaiting' });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch(err => console.error('❌ فشل تسجيل SW:', err));
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }
})();