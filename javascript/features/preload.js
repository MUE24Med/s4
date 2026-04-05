// ============================================
// preload.js - نظام التحميل المسبق فقط
// ============================================

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
    './javascript/features/svg-processor.js',
   './image/0.webp',
   './image/0.png',
   './image/wood.webp',
   './image/Upper_wood.webp'
];

// إضاءة المصابيح بناءً على نسبة التحميل
function updateBulbs(percentage) {
    const thresholds = [
        { id: 'bulb-1', at: 25 },
        { id: 'bulb-2', at: 50 },
        { id: 'bulb-3', at: 75 },
        { id: 'bulb-4', at: 100 },
    ];
    thresholds.forEach(({ id, at }) => {
        const bulb = document.getElementById(id);
        if (!bulb) return;
        if (percentage >= at) {
            bulb.classList.add('on');
        } else {
            // إضاءة جزئية: نسبة الضوء داخل النطاق (0→25، 25→50، إلخ)
            const prev = at - 25;
            const ratio = Math.max(0, (percentage - prev) / 25); // 0..1
            if (ratio > 0) {
                // نضيء المصباح بشفافية منخفضة حتى يكتمل
                bulb.style.opacity = 0.2 + ratio * 0.8;
                bulb.classList.add('on');
            } else {
                bulb.classList.remove('on');
                bulb.style.opacity = '';
            }
        }
        // لما يكتمل نرجع opacity كامل
        if (percentage >= at) {
            bulb.style.opacity = '';
        }
    });
}

/**
 * بدء التحميل المسبق
 * @param {Function} onComplete - دالة تُستدعى بعد اكتمال التحميل (اختياري)
 */
export function initPreload(onComplete) {
    const preloadScreen = document.getElementById('preload-screen');
    if (!preloadScreen) return;

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
    const fileStatus  = document.getElementById('fileStatus');
    const continueBtn = document.getElementById('continueBtn');

    let loadedFiles = 0;
    const totalFiles = FILES_TO_LOAD.length;

    function updateProgress() {
        const percentage = Math.round((loadedFiles / totalFiles) * 100);
        if (progressBar) {
            progressBar.style.width = percentage + '%';
            progressBar.textContent = percentage + '%';
        }
        updateBulbs(percentage);
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
        // نبدأ بصفر عشان المصابيح تبدأ فاضية
        updateBulbs(0);

        for (const file of FILES_TO_LOAD) {
            await loadFile(file);
        }

        if (fileStatus) fileStatus.textContent = '🎉 اكتمل التحميل!';
        if (continueBtn) continueBtn.style.display = 'block';

        if (typeof onComplete === 'function') {
            onComplete();
        }
    }

    startLoading();

    continueBtn.addEventListener('click', () => {
        console.log('✅ حفظ حالة preload_done');
        localStorage.setItem('preload_done', 'true');
        localStorage.setItem('last_visit_timestamp', Date.now());

        preloadScreen.classList.add('hidden');
        mainContent.forEach(el => {
            if (el) el.style.display = '';
        });

        window.location.reload();
    });
}
