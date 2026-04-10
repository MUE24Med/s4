// ============================================
// svg-loader.js - تحميل ملفات SVG للجروب والسكشن
// ============================================

import { CACHE_NAME } from './config.js';
import { addImageUrl, clearImageUrls, loadingProgress } from './loading-state.js';
import { updateLoadProgress } from './loading-ui.js';
import { STATIC_IMAGES } from './image-loader.js';

export async function loadGroupSVG(groupLetter) {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) {
        console.error('❌ group-specific-content غير موجود');
        return;
    }
    groupContainer.innerHTML = '';

    const svgPath = `groups/group-${groupLetter}.svg`;
    console.log(`📂 تحميل ملف الجروب: ${svgPath}`);
    try {
        const cache = await caches.open(CACHE_NAME);
        let response = await cache.match(svgPath);
        if (!response) {
            response = await fetch(svgPath);
            if (response.ok) cache.put(svgPath, response.clone());
        }
        if (!response.ok) {
            console.warn(`⚠️ فشل تحميل ${svgPath} (${response.status})`);
            loadingProgress.completedSteps++;
            updateLoadProgress();
            return;
        }
        const svgText = await response.text();
        const match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        if (match && match[1]) {
            groupContainer.innerHTML = match[1];
            console.log(`✅ تم تحميل الجروب ${groupLetter}، عدد العناصر: ${groupContainer.children.length}`);
            
            // تمييز صور الجروب
            const groupImages = groupContainer.querySelectorAll('image[data-src]');
            groupImages.forEach(img => {
                img.classList.add('group-image');
            });
            
            const injectedImages = groupContainer.querySelectorAll('image[data-src]');
            clearImageUrls();
            injectedImages.forEach(img => {
                const src = img.getAttribute('data-src');
                if (!src) return;
                const isGroupImage = src.includes(`image/${groupLetter}/`) ||
                    src.includes(`logo-${groupLetter}`) ||
                    src.includes(`logo-wood-${groupLetter}`);
                if (isGroupImage) {
                    addImageUrl(src);
                }
            });
            const allToLoad = [...STATIC_IMAGES, ...imageUrlsToLoad];
            loadingProgress.totalSteps = allToLoad.length;
            loadingProgress.completedSteps = 0;
            updateLoadProgress();
        } else {
            console.warn(`⚠️ لم يتم العثور على محتوى SVG داخل ${svgPath}`);
            loadingProgress.totalSteps = 1;
            loadingProgress.completedSteps = 1;
            updateLoadProgress();
        }
    } catch (err) {
        console.error(`❌ خطأ في تحميل ${svgPath}:`, err);
        loadingProgress.totalSteps = 1;
        loadingProgress.completedSteps = 1;
        updateLoadProgress();
    }
}

export async function loadSectionSVG(groupLetter, sectionNum) {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) {
        console.error('❌ group-specific-content غير موجود');
        return;
    }

    const sectionSvgPath = `sections/group-${groupLetter}/section-${sectionNum}.svg`;
    console.log(`📂 محاولة تحميل السكشن: ${sectionSvgPath}`);

    try {
        const cache = await caches.open(CACHE_NAME);
        let response = await cache.match(sectionSvgPath);
        if (!response) {
            response = await fetch(sectionSvgPath);
            if (response.ok) cache.put(sectionSvgPath, response.clone());
        }

        if (!response.ok) {
            console.warn(`⚠️ SVG السكشن ${sectionNum} غير موجود (${response.status}) - المسار: ${sectionSvgPath}`);
            return;
        }

        const svgText = await response.text();
        const match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        if (!match || !match[1]) {
            console.warn(`⚠️ لم يتم العثور على محتوى SVG داخل ملف السكشن ${sectionNum}`);
            return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(match[0], 'image/svg+xml');
        const svgRoot = doc.documentElement;

        let addedCount = 0;
        while (svgRoot.children.length) {
            const child = svgRoot.children[0];
            if (child.tagName === 'g' || child.tagName === 'rect') {
                child.classList.add('section-specific');
                if (child.tagName === 'rect' && !child.getAttribute('fill')) {
                    child.setAttribute('fill', 'rgba(255, 100, 0, 0.15)');
                }
            }
            if (child.tagName === 'image') {
                child.classList.add('section-image');
            }
            groupContainer.insertBefore(child, groupContainer.firstChild);
            addedCount++;
        }

        console.log(`✅ تم إضافة ${addedCount} عنصراً من السكشن ${sectionNum} إلى بداية الحاوية`);

        const newImages = groupContainer.querySelectorAll('image[data-src]');
        newImages.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) addImageUrl(src);
        });

        const allToLoad = [...STATIC_IMAGES, ...imageUrlsToLoad];
        loadingProgress.totalSteps = allToLoad.length;
        updateLoadProgress();

    } catch (err) {
        console.error(`❌ خطأ فادح في تحميل SVG السكشن ${sectionNum}:`, err);
    }
}