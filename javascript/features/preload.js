// ============================================
// preload.js - نظام التحميل المسبق (التحميل الأول فقط)
// يحمل: JS + CSS + صور ثابتة + PDF.js
// ============================================

const FILES_TO_LOAD = [
    // ───── الأساسيات ─────
    './style.css',
    './tracker.js',
    './script.js',
    './manifest.json',

    // ───── Core JS ─────
    './javascript/core/config.js',
    './javascript/core/utils.js',
    './javascript/core/navigation.js',
    './javascript/core/group-loader.js',
    './javascript/core/state.js',
    './javascript/core/back-button.js',

    // ───── UI JS ─────
    './javascript/ui/pdf-viewer.js',
    './javascript/ui/wood-interface.js',
    './javascript/ui/search-and-eye.js',
    './javascript/ui/ui-controls.js',
    './javascript/ui/scroll-system.js',

    // ───── Features JS ─────
    './javascript/features/preload-game.js',
    './javascript/features/preload.js',
    './javascript/features/svg-processor.js',
    './javascript/features/leaderboard-core.js',
    './javascript/features/leaderboard-ui.js',
    './javascript/features/mini-game.js',

    // ───── PDF.js (مكتبة خارجية) ─────
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
];

// ─────────────────────────────────────────
// إضاءة المصابيح بناءً على نسبة التحميل
// ─────────────────────────────────────────
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
            bulb.style.opacity = '';
        } else {
            const prev = at - 25;
            const ratio = Math.max(0, (percentage - prev) / 25);
            if (ratio > 0) {
                bulb.style.opacity = 0.2 + ratio * 0.8;
                bulb.classList.add('on');
            } else {
                bulb.classList.remove('on');
                bulb.style.opacity = '';
            }
        }
    });
}

// ─────────────────────────────────────────
// تحميل ملف واحد مع الكاش
// ─────────────────────────────────────────
async function loadFile(url, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cached = await cache.match(url);

        if (cached) {
            console.log(`✅ كاش: ${url}`);
        } else {
            console.log(`🌐 تحميل: ${url}`);
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response.clone());
                console.log(`💾 حفظ: ${url}`);
            }
        }
    } catch (error) {
        console.warn(`⚠️ تعذّر تحميل: ${url}`, error);
    }
}

// ─────────────────────────────────────────
// بدء التحميل المسبق
// @param {Function} onComplete - تُستدعى بعد اكتمال التحميل
// ─────────────────────────────────────────
export function initPreload(onComplete) {
    const preloadScreen = document.getElementById('preload-screen');
    if (!preloadScreen) return;

    preloadScreen.classList.remove('hidden');

    // إخفاء المحتوى الرئيسي
    const mainContent = [
        document.getElementById('group-selection-screen'),
        document.getElementById('js-toggle-container'),
        document.getElementById('scroll-container'),
        document.getElementById('loading-overlay'),
    ];
    mainContent.forEach(el => { if (el) el.style.display = 'none'; });

    const progressBar = document.getElementById('progressBar');
    const fileStatus  = document.getElementById('fileStatus');
    const continueBtn = document.getElementById('continueBtn');

    let loadedCount = 0;
    const total = FILES_TO_LOAD.length;

    function updateProgress() {
        const pct = Math.round((loadedCount / total) * 100);
        if (progressBar) {
            progressBar.style.width = pct + '%';
            progressBar.textContent = pct + '%';
        }
        updateBulbs(pct);
    }

    async function startLoading() {
        // ─── قراءة اسم الكاش من config ───
        let cacheName = 'semester-cache-v1';
        try {
            const { CACHE_NAME } = await import('../core/config.js');
            if (CACHE_NAME) cacheName = CACHE_NAME;
        } catch (_) {}

        updateBulbs(0);

        // ─── تصنيف الملفات: صور بشكل منفصل ───
        const imageExts = /\.(webp|png|jpg|jpeg|gif|svg|avif)$/i;
        const imageFiles = FILES_TO_LOAD.filter(f => imageExts.test(f));
        const otherFiles = FILES_TO_LOAD.filter(f => !imageExts.test(f));

        // ─── تحميل الملفات الأخرى بالتسلسل ───
        for (const file of otherFiles) {
            await loadFile(file, cacheName);
            loadedCount++;
            updateProgress();
            if (fileStatus) fileStatus.textContent = `✔ ${file.split('/').pop()}`;
        }

        // ─── تحميل الصور بالتوازي كلها في نفس الوقت ───
        if (imageFiles.length > 0) {
            if (fileStatus) fileStatus.textContent = `⏳ تحميل ${imageFiles.length} صور بالتوازي...`;
            await Promise.all(
                imageFiles.map(async (file) => {
                    await loadFile(file, cacheName);
                    loadedCount++;
                    updateProgress();
                })
            );
            if (fileStatus) fileStatus.textContent = `✔ اكتمل تحميل الصور (${imageFiles.length})`;
        }

        if (fileStatus) fileStatus.textContent = '🎉 اكتمل التحميل!';
        if (continueBtn) continueBtn.style.display = 'block';
        if (typeof onComplete === 'function') onComplete();
    }

    startLoading();

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            console.log('✅ حفظ حالة preload_done');
            localStorage.setItem('preload_done', 'true');
            localStorage.setItem('last_visit_timestamp', Date.now());

            preloadScreen.classList.add('hidden');
            mainContent.forEach(el => { if (el) el.style.display = ''; });

            window.location.reload();
        });
    }
}