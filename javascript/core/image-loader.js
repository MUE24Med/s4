// ============================================
// image-loader.js - تحميل الصور من GitHub Cache
// ============================================

import { CACHE_NAME } from './config.js';
import { imageUrlsToLoad, loadingProgress, addImageUrl, clearImageUrls } from './loading-state.js';
import { updateLoadProgress } from './loading-ui.js';

const STATIC_IMAGES = ['image/wood.webp', 'image/Upper_wood.webp'];

function applyImageSrc(url, src) {
    const mainSvg = document.getElementById('main-svg');
    const filesContainer = document.getElementById('files-list-container');
    const allImages = [
        ...(mainSvg?.querySelectorAll('image') || []),
        ...(filesContainer?.querySelectorAll('image') || [])
    ];
    allImages.forEach(si => {
        if (si.getAttribute('data-src') === url) {
            si.setAttribute('href', src);
        }
    });
}

async function loadSingleImage(url) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url);
        if (cached) {
            const blob = await cached.blob();
            applyImageSrc(url, URL.createObjectURL(blob));
            return;
        }
    } catch (e) {}
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = async function () {
            applyImageSrc(url, this.src);
            try {
                const cache = await caches.open(CACHE_NAME);
                const res = await fetch(url);
                if (res.ok) await cache.put(url, res);
            } catch (e) {}
            resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
    });
}

export async function loadImages(finishCallback) {
    const allToLoad = [...STATIC_IMAGES, ...imageUrlsToLoad];
    console.log(`🖼️ تحميل ${allToLoad.length} صورة (ثابتة + من الجروب والسكشن)`);
    if (allToLoad.length === 0) {
        if (finishCallback) finishCallback();
        return;
    }
    const MAX_CONCURRENT = 3;
    for (let i = 0; i < allToLoad.length; i += MAX_CONCURRENT) {
        const batch = allToLoad.slice(i, i + MAX_CONCURRENT);
        await Promise.all(batch.map(async (url) => {
            await loadSingleImage(url);
            loadingProgress.completedSteps++;
            updateLoadProgress();
        }));
    }
    if (finishCallback) finishCallback();
}

export { STATIC_IMAGES, clearImageUrls, addImageUrl };