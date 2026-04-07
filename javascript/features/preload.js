// ============================================
// preload.js - تحميل متوازي سريع (أول زيارة فقط)
// ============================================

import { CACHE_NAME } from '../core/config.js';

const FILES_TO_LOAD = [
    './style.css', './tracker.js', './script.js', './manifest.json',
    './javascript/core/config.js', './javascript/core/utils.js',
    './javascript/core/navigation.js', './javascript/core/group-loader.js',
    './javascript/core/state.js', './javascript/core/back-button.js',
    './javascript/ui/pdf-viewer.js', './javascript/ui/wood-interface.js',
    './javascript/ui/search-and-eye.js', './javascript/ui/ui-controls.js',
    './javascript/ui/scroll-system.js',
    './javascript/features/preload-game.js', './javascript/features/preload.js',
    './javascript/features/svg-processor.js', './javascript/features/leaderboard-core.js',
    './javascript/features/leaderboard-ui.js', './javascript/features/mini-game.js',
    './image/wood.webp', './image/Upper_wood.webp'
];

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

export function initPreload(onComplete) {
    const preloadScreen = document.getElementById('preload-screen');
    if (!preloadScreen) return;
    preloadScreen.classList.remove('hidden');

    // إخفاء المحتوى الرئيسي
    const mainContent = ['group-selection-screen', 'js-toggle-container', 'scroll-container', 'loading-overlay'];
    mainContent.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const progressBar = document.getElementById('progressBar');
    const fileStatus = document.getElementById('fileStatus');
    const continueBtn = document.getElementById('continueBtn');

    let completed = 0;
    const total = FILES_TO_LOAD.length;

    function updateProgress() {
        const pct = Math.round((completed / total) * 100);
        if (progressBar) {
            progressBar.style.width = `${pct}%`;
            progressBar.textContent = `${pct}%`;
        }
        updateBulbs(pct);
    }

    async function loadAllInParallel() {
        const cache = await caches.open(CACHE_NAME || 'semester-cache-v2');
        const results = await Promise.allSettled(
            FILES_TO_LOAD.map(async (url) => {
                try {
                    const cached = await cache.match(url);
                    if (!cached) {
                        const response = await fetch(url);
                        if (response.ok) await cache.put(url, response);
                    }
                    completed++;
                    updateProgress();
                    if (fileStatus) fileStatus.textContent = `✔ ${url.split('/').pop()}`;
                } catch (err) {
                    console.warn(`⚠️ فشل تحميل ${url}`, err);
                    completed++;
                    updateProgress();
                }
            })
        );
        console.log(`✅ تم تحميل ${completed} من ${total} ملف`);
        if (fileStatus) fileStatus.textContent = '🎉 اكتمل التحميل!';
        if (continueBtn) continueBtn.style.display = 'block';
        if (onComplete) onComplete();
    }

    loadAllInParallel();

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            localStorage.setItem('preload_done', 'true');
            localStorage.setItem('last_visit_timestamp', Date.now());
            preloadScreen.classList.add('hidden');
            mainContent.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = '';
            });
            window.location.reload();
        });
    }
}