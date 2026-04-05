// ============================================
// group-loader.js - تحميل المجموعات والصور و SVG
// ============================================

import { RAW_CONTENT_BASE, REPO_NAME, GITHUB_USER, TREE_API_URL, NAV_STATE, CACHE_NAME } from './config.js';
import { getDisplayName, debounce, resetBrowserZoom } from './utils.js';
import { pushNavigationState, goToWood } from './navigation.js';
import { setCurrentGroup, setCurrentFolder, setGlobalFileTree, globalFileTree, currentGroup, currentFolder } from './state.js';

// ---------- متغيرات داخلية للتحميل ----------
let imageUrlsToLoad = [];
let loadingProgress = {
    totalSteps: 0,
    completedSteps: 0,
    currentPercentage: 0
};

// ---------- شجرة الملفات ----------
export async function fetchGlobalTree() {
    if (globalFileTree.length > 0) return;
    try {
        const response = await fetch(TREE_API_URL);
        const data = await response.json();
        setGlobalFileTree(data.tree || []);
        console.log("✅ تم تحميل شجرة الملفات:", globalFileTree.length);
    } catch (err) {
        console.error("❌ خطأ في الاتصال بـ GitHub:", err);
    }
}

// ---------- حفظ وتحميل المجموعة ----------
export function saveSelectedGroup(group) {
    setCurrentGroup(group);
}

export function loadSelectedGroup() {
    const saved = localStorage.getItem('selectedGroup');
    if (saved) {
        setCurrentGroup(saved);
        return true;
    }
    return false;
}

// ---------- شاشة التحميل ----------
export function showLoadingScreen(groupLetter) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;

    const splashImage = document.getElementById('splash-image');
    if (splashImage) {
        splashImage.style.display = 'none';
        let textElement = document.getElementById('group-text-display');
        if (!textElement) {
            textElement = document.createElement('div');
            textElement.id = 'group-text-display';
            textElement.style.cssText = `
                font-size: 120px;
                font-weight: bold;
                color: #ffca28;
                text-shadow: 
                    0 0 30px rgba(255,202,40,0.8),
                    0 0 60px rgba(255,202,40,0.5),
                    0 0 90px rgba(255,202,40,0.3);
                font-family: 'Arial Black', sans-serif;
                letter-spacing: 15px;
                animation: pulse 2s ease-in-out infinite;
                text-align: center;
                margin: 20px 0;
            `;
            splashImage.parentNode.insertBefore(textElement, splashImage);
        }
        textElement.textContent = `Group ${groupLetter}`;
        textElement.style.display = 'block';
    }

    loadingProgress = { totalSteps: 0, completedSteps: 0, currentPercentage: 0 };

    document.querySelectorAll('.light-bulb').forEach(bulb => bulb.classList.remove('on'));
    loadingOverlay.classList.add('active');
    console.log(`🔦 شاشة التحميل نشطة: Group ${groupLetter}`);

    import('../ui/wood-interface.js').then(({ updateWelcomeMessages }) => {
        updateWelcomeMessages();
    });
}

export function hideLoadingScreen() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;
    loadingOverlay.classList.remove('active');

    const splashImage = document.getElementById('splash-image');
    if (splashImage) splashImage.style.display = '';

    const textElement = document.getElementById('group-text-display');
    if (textElement) textElement.style.display = 'none';

    console.log('✅ تم إخفاء شاشة التحميل');
}

export function updateLoadProgress() {
    if (loadingProgress.totalSteps === 0) {
        console.warn('⚠️ totalSteps = 0');
        return;
    }
    const progress = (loadingProgress.completedSteps / loadingProgress.totalSteps) * 100;
    loadingProgress.currentPercentage = Math.min(100, Math.round(progress));
    console.log(`📊 التقدم: ${loadingProgress.currentPercentage}% (${loadingProgress.completedSteps}/${loadingProgress.totalSteps})`);

    const pct = loadingProgress.currentPercentage;
    // ✅ المصابيح عكسية مقصودة (4 → 1)
    if (pct >= 20) document.getElementById('bulb-4')?.classList.add('on');
    if (pct >= 40) document.getElementById('bulb-3')?.classList.add('on');
    if (pct >= 60) document.getElementById('bulb-2')?.classList.add('on');
    if (pct >= 80) document.getElementById('bulb-1')?.classList.add('on');
}

// ---------- تحميل SVG الخاص بالمجموعة ----------
export async function loadGroupSVG(groupLetter) {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) {
        console.error('❌ group-specific-content غير موجود');
        return;
    }
    groupContainer.innerHTML = '';

    const svgPath = `groups/group-${groupLetter}.svg`;

    try {
        console.log(`🔄 تحميل: ${svgPath}`);

        // ✅ CACHE_NAME من config.js — يتغير تلقائياً مع كل تحديث
        const cache = await caches.open(CACHE_NAME);
        let response = await cache.match(svgPath);

        if (response) {
            console.log('✅ SVG من الكاش');
        } else {
            console.log('🌐 تحميل SVG من الشبكة');
            response = await fetch(svgPath);
            if (response.ok) {
                cache.put(svgPath, response.clone());
            }
        }

        if (!response.ok) {
            console.warn(`⚠️ ملف SVG للمجموعة ${groupLetter} غير موجود`);
            loadingProgress.completedSteps++;
            updateLoadProgress();
            return;
        }

        const svgText = await response.text();
        const match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);

        if (match && match[1]) {
            groupContainer.innerHTML = match[1];
            console.log(`✅ تم حقن ${groupContainer.children.length} عنصر`);

            const injectedImages = groupContainer.querySelectorAll('image[data-src]');
            console.log(`🖼️ عدد الصور في SVG: ${injectedImages.length}`);

            // ✅ wood.webp و Upper_wood.webp محملين في preload — لا داعي لإعادة تحميلهم
            imageUrlsToLoad = [];
            injectedImages.forEach(img => {
                const src = img.getAttribute('data-src');
                if (!src) return;
                const isGroupImage =
                    src.includes(`image/${groupLetter}/`) ||
                    src.includes(`logo-${groupLetter}`) ||
                    src.includes(`logo-wood-${groupLetter}`);
                if (isGroupImage && !imageUrlsToLoad.includes(src)) {
                    imageUrlsToLoad.push(src);
                }
            });

            loadingProgress.totalSteps = 1 + imageUrlsToLoad.length;
            loadingProgress.completedSteps = 1;
            updateLoadProgress();
            console.log(`📋 صور الجروب للتحميل (${imageUrlsToLoad.length}):`, imageUrlsToLoad);
        } else {
            console.error('❌ فشل استخراج محتوى SVG');
            loadingProgress.totalSteps = 1;
            loadingProgress.completedSteps = 1;
            updateLoadProgress();
        }
    } catch (err) {
        console.error(`❌ خطأ في loadGroupSVG:`, err);
        loadingProgress.totalSteps = 1;
        loadingProgress.completedSteps = 1;
        updateLoadProgress();
    }
}

// ---------- تحديث شعار الخشب ----------
export function updateWoodLogo(groupLetter) {
    const dynamicGroup = document.getElementById('dynamic-links-group');
    if (!dynamicGroup) return;

    const oldBanner = dynamicGroup.querySelector('.wood-banner-animation');
    if (oldBanner) oldBanner.remove();
    if (currentFolder !== "") return;

    const banner = document.createElementNS("http://www.w3.org/2000/svg", "image");
    banner.setAttribute("href", `image/logo-wood-${groupLetter}.webp`);
    banner.setAttribute("x", "197.20201666994924");
    banner.setAttribute("y", "2074.3139768463334");
    banner.setAttribute("width", "629.8946370139159");
    banner.setAttribute("height", "275.78922917259797");
    banner.setAttribute("class", "wood-banner-animation");
    banner.style.mixBlendMode = "multiply";
    banner.style.opacity = "0.9";
    banner.style.pointerEvents = "auto";

    banner.onclick = (e) => {
        e.stopPropagation();
        resetBrowserZoom();
        const groupSelectionScreen = document.getElementById('group-selection-screen');
        if (groupSelectionScreen) {
            groupSelectionScreen.classList.remove('hidden');
            groupSelectionScreen.style.display = 'flex';
        }
        goToWood();
        pushNavigationState(NAV_STATE.GROUP_SELECTION);
    };

    dynamicGroup.appendChild(banner);
}

// ---------- تهيئة المجموعة ----------
export async function initializeGroup(groupLetter) {
    console.log(`🚀 تهيئة المجموعة: ${groupLetter}`);

    const previousGroup = localStorage.getItem('selectedGroup');
    if (previousGroup && previousGroup !== groupLetter) {
        console.log(`🔄 تغيير الجروب من ${previousGroup} إلى ${groupLetter} - مسح الكاش القديم`);
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
            if (name.includes(`group-${previousGroup}`)) {
                await caches.delete(name);
                console.log(`🗑️ تم مسح: ${name}`);
            }
        }
    }

    saveSelectedGroup(groupLetter);

    const toggleContainer = document.getElementById('js-toggle-container');
    const scrollContainer = document.getElementById('scroll-container');
    const groupSelectionScreen = document.getElementById('group-selection-screen');

    if (toggleContainer) {
        toggleContainer.classList.remove('fully-hidden');
        toggleContainer.style.display = 'flex';
    }
    if (scrollContainer) scrollContainer.style.display = 'block';
    if (groupSelectionScreen) {
        groupSelectionScreen.classList.add('hidden');
        groupSelectionScreen.style.display = 'none';
    }

    pushNavigationState(NAV_STATE.WOOD_VIEW, { group: groupLetter });

    showLoadingScreen(groupLetter);
    await Promise.all([fetchGlobalTree(), loadGroupSVG(groupLetter)]);

    updateDynamicSizes();
    await loadImages();
}

// ---------- تحميل صورة واحدة مع الكاش ----------
// ✅ دالة موحدة بدل الكود المتكرر 3 مرات في loadImages
async function loadSingleImage(url) {
    const mainSvg = document.getElementById('main-svg');
    const filesContainer = document.getElementById('files-list-container');

    function applyImageSrc(src) {
        const allImages = [
            ...( mainSvg?.querySelectorAll('image') || []),
            ...( filesContainer?.querySelectorAll('image') || [])
        ];
        allImages.forEach(si => {
            if (si.getAttribute('data-src') === url) {
                si.setAttribute('href', src);
            }
        });
    }

    // جرب الكاش أولاً
    try {
        const cache = await caches.open(CACHE_NAME); // ✅ CACHE_NAME من config
        const cached = await cache.match(url);
        if (cached) {
            console.log(`✅ صورة من الكاش: ${url.split('/').pop()}`);
            const blob = await cached.blob();
            applyImageSrc(URL.createObjectURL(blob));
            return;
        }
    } catch (e) {
        console.warn(`⚠️ خطأ في كاش الصورة: ${e}`);
    }

    // تحميل من الشبكة
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = async function () {
            applyImageSrc(this.src);
            console.log(`✅ صورة محملة: ${url.split('/').pop()}`);
            try {
                const cache = await caches.open(CACHE_NAME); // ✅ CACHE_NAME من config
                const res = await fetch(url);
                if (res.ok) await cache.put(url, res);
            } catch (e) {
                console.warn(`⚠️ فشل حفظ الصورة: ${e}`);
            }
            resolve();
        };

        img.onerror = function () {
            console.error(`❌ فشل تحميل: ${url}`);
            resolve();
        };

        img.src = url;
    });
}

// ---------- تحميل كل الصور ----------
export async function loadImages() {
    if (imageUrlsToLoad.length === 0) {
        console.warn('⚠️ لا توجد صور للتحميل');
        finishLoading();
        return;
    }

    console.log(`🖼️ بدء تحميل ${imageUrlsToLoad.length} صورة...`);

    const MAX_CONCURRENT = 3;

    // تحميل على دفعات متوازية
    for (let i = 0; i < imageUrlsToLoad.length; i += MAX_CONCURRENT) {
        const batch = imageUrlsToLoad.slice(i, i + MAX_CONCURRENT);
        await Promise.all(batch.map(async (url) => {
            await loadSingleImage(url);
            loadingProgress.completedSteps++;
            updateLoadProgress();
        }));
    }

    finishLoading();
}

// ---------- إنهاء التحميل ----------
async function finishLoading() {
    loadingProgress.completedSteps = loadingProgress.totalSteps;
    loadingProgress.currentPercentage = 100;
    updateLoadProgress();
    console.log('✅ التحميل اكتمل 100%');

    const { scan } = await import('../features/svg-processor.js');
    const { updateWoodInterface } = await import('../ui/wood-interface.js');

    updateDynamicSizes();
    scan();
    updateWoodInterface();
    goToWood();

    const mainSvg = document.getElementById('main-svg');
    if (mainSvg) {
        mainSvg.style.opacity = '1';
        mainSvg.style.visibility = 'visible';
        mainSvg.classList.add('loaded');
    }

    hideLoadingScreen();
    console.log('🎉 اكتمل التحميل والعرض');
}

// ---------- تحديث أحجام SVG ديناميكياً ----------
export function updateDynamicSizes() {
    const mainSvg = document.getElementById('main-svg');
    if (!mainSvg) return;

    const allImages = mainSvg.querySelectorAll('image[width][height]');
    console.log(`📏 عدد جميع الصور: ${allImages.length}`);
    if (allImages.length === 0) {
        console.warn('⚠️ لم يتم العثور على صور');
        return;
    }

    let maxX = 0;
    let maxY = 2454;

    allImages.forEach(img => {
        const g = img.closest('g[transform]');
        let translateX = 0;
        if (g) {
            const match = g.getAttribute('transform')
                .match(/translate\s*\(([\d.-]+)(?:[ ,]+([\d.-]+))?\s*\)/);
            if (match) translateX = parseFloat(match[1]) || 0;
        }
        const imgWidth  = parseFloat(img.getAttribute('width'))  || 0;
        const imgHeight = parseFloat(img.getAttribute('height')) || 0;
        const imgX      = parseFloat(img.getAttribute('x'))      || 0;
        const totalX    = translateX + imgX + imgWidth;
        if (totalX  > maxX) maxX  = totalX;
        if (imgHeight > maxY) maxY = imgHeight;
    });

    mainSvg.setAttribute('viewBox', `0 0 ${maxX} ${maxY}`);
    console.log(`✅ viewBox: 0 0 ${maxX} ${maxY}`);
}
