// ============================================
// sw-registration-snippet.js
// ضع هذا الكود في index.html بدل الكود الحالي لتسجيل SW
// ============================================

// ✅ CACHE_NAME المصدر الوحيد للحقيقة — غيّره هنا فقط
const SW_CACHE_NAME = 'semester-4-cache-2026-04-05-03-07';

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
