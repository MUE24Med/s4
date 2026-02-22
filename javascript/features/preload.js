// ============================================
// preload.js - نظام التحميل المسبق فقط
// ============================================

// قائمة الملفات المراد تحميلها مسبقاً
const FILES_TO_LOAD = [
    './style.css',
    './tracker.js',
    './script.js',
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
    './javascript/features/preload-game.js',
    './javascript/features/svg-processor.js'
];

/**
 * بدء التحميل المسبق
 * @param {Function} onComplete - دالة تُستدعى بعد اكتمال التحميل (اختياري)
 */
export function initPreload(onComplete) {
    const preloadScreen = document.getElementById('preload-screen');
    if (!preloadScreen) return;

    // إظهار الشاشة وإخفاء المحتوى الرئيسي
    preloadScreen.classList.remove('hidden');
    const mainContent = [
        document.getElementById('group-selection-screen'),
        document.getElementById('js-toggle-container'),
        document.getElementById('scroll-container'),
        document.getElementById('loading-overlay')
    ];
    mainContent.forEach(el => {
        if (el) el.style.display = 'none';
    });

    const progressBar = document.getElementById('progressBar');
    const fileStatus = document.getElementById('fileStatus');
    const continueBtn = document.getElementById('continueBtn');

    let loadedFiles = 0;
    const totalFiles = FILES_TO_LOAD.length;

    function updateProgress() {
        const percentage = Math.round((loadedFiles / totalFiles) * 100);
        if (progressBar) {
            progressBar.style.width = percentage + '%';
            progressBar.textContent = percentage + '%';
        }
    }

    async function loadFile(url) {
        try {
            const cache = await caches.open('semester-3-cache-v1');
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                console.log(`✅ كاش: ${url}`);
            } else {
                console.log(`🌐 تحميل: ${url}`);
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response.clone());
                    console.log(`💾 حفظ: ${url}`);
                }
            }

            loadedFiles++;
            updateProgress();
            if (fileStatus) {
                fileStatus.textContent = `✔ ${url.split('/').pop()}`;
            }
        } catch (error) {
            console.error('❌ خطأ:', url, error);
            loadedFiles++;
            updateProgress();
        }
    }

    async function startLoading() {
        for (const file of FILES_TO_LOAD) {
            await loadFile(file);
        }

        if (fileStatus) fileStatus.textContent = '🎉 اكتمل التحميل!';
        if (continueBtn) continueBtn.style.display = 'block';

        // استدعاء callback إذا وُجد
        if (typeof onComplete === 'function') {
            onComplete();
        }
    }

    startLoading();

    // عند الضغط على متابعة
    continueBtn.addEventListener('click', () => {
        console.log('✅ حفظ حالة preload_done');
        localStorage.setItem('preload_done', 'true');
        localStorage.setItem('last_visit_timestamp', Date.now());

        preloadScreen.classList.add('hidden');

        // إظهار المحتوى الرئيسي
        mainContent.forEach(el => {
            if (el) el.style.display = '';
        });

        // إعادة تحميل الصفحة لبدء التشغيل الطبيعي
        window.location.reload();
    });
}