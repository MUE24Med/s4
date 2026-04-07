// ============================================
// group-loader.js - تحميل المجموعات والصور و SVG
// ============================================

import { RAW_CONTENT_BASE, REPO_NAME, GITHUB_USER, TREE_API_URL, NAV_STATE, CACHE_NAME } from './config.js';
import { getDisplayName, debounce, resetBrowserZoom } from './utils.js';
import { pushNavigationState, goToWood } from './navigation.js';
import { setCurrentGroup, setCurrentFolder, setGlobalFileTree, globalFileTree, currentGroup, currentFolder, setCurrentSection, currentSection } from './state.js';

// ---------- متغيرات داخلية للتحميل ----------
let imageUrlsToLoad = [];
let loadingProgress = {
    totalSteps: 0,
    completedSteps: 0,
    currentPercentage: 0
};

const STATIC_IMAGES = ['image/wood.webp', 'image/Upper_wood.webp'];

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

export function saveSelectedGroup(group) {
    setCurrentGroup(group);
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
    if (loadingProgress.totalSteps === 0) return;
    const progress = (loadingProgress.completedSteps / loadingProgress.totalSteps) * 100;
    loadingProgress.currentPercentage = Math.min(100, Math.round(progress));
    const pct = loadingProgress.currentPercentage;
    if (pct >= 20) document.getElementById('bulb-4')?.classList.add('on');
    if (pct >= 40) document.getElementById('bulb-3')?.classList.add('on');
    if (pct >= 60) document.getElementById('bulb-2')?.classList.add('on');
    if (pct >= 80) document.getElementById('bulb-1')?.classList.add('on');
}

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

export async function loadGroupSVG(groupLetter) {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) return;
    groupContainer.innerHTML = '';

    const svgPath = `groups/group-${groupLetter}.svg`;
    try {
        const cache = await caches.open(CACHE_NAME);
        let response = await cache.match(svgPath);
        if (!response) {
            response = await fetch(svgPath);
            if (response.ok) cache.put(svgPath, response.clone());
        }
        if (!response.ok) {
            loadingProgress.completedSteps++;
            updateLoadProgress();
            return;
        }
        const svgText = await response.text();
        const match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        if (match && match[1]) {
            groupContainer.innerHTML = match[1];
            const injectedImages = groupContainer.querySelectorAll('image[data-src]');
            imageUrlsToLoad = [];
            injectedImages.forEach(img => {
                const src = img.getAttribute('data-src');
                if (!src) return;
                const isGroupImage = src.includes(`image/${groupLetter}/`) ||
                    src.includes(`logo-${groupLetter}`) ||
                    src.includes(`logo-wood-${groupLetter}`);
                if (isGroupImage && !imageUrlsToLoad.includes(src)) {
                    imageUrlsToLoad.push(src);
                }
            });
            const allToLoad = [...STATIC_IMAGES, ...imageUrlsToLoad];
            loadingProgress.totalSteps = allToLoad.length;
            loadingProgress.completedSteps = 0;
            updateLoadProgress();
        } else {
            loadingProgress.totalSteps = 1;
            loadingProgress.completedSteps = 1;
            updateLoadProgress();
        }
    } catch (err) {
        loadingProgress.totalSteps = 1;
        loadingProgress.completedSteps = 1;
        updateLoadProgress();
    }
}

async function loadSectionSVG(groupLetter, sectionNum) {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) return;
    const sectionSvgPath = `sections/group-${groupLetter}/section-${sectionNum}.svg`;
    try {
        const cache = await caches.open(CACHE_NAME);
        let response = await cache.match(sectionSvgPath);
        if (!response) {
            response = await fetch(sectionSvgPath);
            if (response.ok) cache.put(sectionSvgPath, response.clone());
        }
        if (!response.ok) {
            console.warn(`⚠️ SVG السكشن ${sectionNum} غير موجود`);
            return;
        }
        const svgText = await response.text();
        const match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        if (match && match[1]) {
            const fragment = document.createRange().createContextualFragment(match[1]);
            const children = fragment.children;
            while (children.length) {
                const child = children[0];
                if (child.tagName === 'g' || child.tagName === 'rect') {
                    child.classList.add('section-specific');
                }
                groupContainer.appendChild(child);
            }
            const newImages = groupContainer.querySelectorAll('image[data-src]');
            newImages.forEach(img => {
                const src = img.getAttribute('data-src');
                if (src && !imageUrlsToLoad.includes(src)) imageUrlsToLoad.push(src);
            });
        }
    } catch (err) {
        console.error(`❌ خطأ في تحميل SVG السكشن:`, err);
    }
}

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

// ---------- عرض شاشة اختيار السكشن (إجباري) ----------
export async function showSectionSelection(groupLetter) {
    const groupSelectionScreen = document.getElementById('group-selection-screen');
    const sectionScreen = document.getElementById('section-selection-screen');
    if (!sectionScreen) return;

    // إخفاء شاشة المجموعات وإظهار شاشة السكاشن
    groupSelectionScreen.classList.add('hidden');
    groupSelectionScreen.style.display = 'none';
    sectionScreen.classList.remove('hidden');
    sectionScreen.style.display = 'flex';

    const container = document.getElementById('sections-container');
    if (!container) return;

    let start, end;
    switch(groupLetter) {
        case 'A': start = 1; end = 10; break;
        case 'B': start = 11; end = 20; break;
        case 'C': start = 21; end = 30; break;
        case 'D': start = 31; end = 40; break;
        default: start = 1; end = 10;
    }

    container.innerHTML = '';
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = 'section-btn';
        btn.textContent = `Section ${i}`;
        btn.dataset.section = i;
        btn.onclick = () => selectSection(i, groupLetter);
        container.appendChild(btn);
    }

    const backBtn = document.getElementById('back-to-groups-from-section');
    if (backBtn) {
        backBtn.onclick = () => {
            // العودة لاختيار المجموعة (مسح السكشن المخزن)
            setCurrentSection(null);
            sectionScreen.classList.add('hidden');
            groupSelectionScreen.classList.remove('hidden');
            groupSelectionScreen.style.display = 'flex';
        };
    }
}

async function selectSection(sectionNum, groupLetter) {
    setCurrentSection(sectionNum);
    const sectionScreen = document.getElementById('section-selection-screen');
    sectionScreen.classList.add('hidden');
    sectionScreen.style.display = 'none';
    await initializeGroup(groupLetter, sectionNum);
}

// ---------- تهيئة المجموعة (تستقبل سكشن إجباري) ----------
export async function initializeGroup(groupLetter, sectionNum) {
    if (!sectionNum) {
        console.error('❌ initializeGroup requires a section number');
        return;
    }
    console.log(`🚀 تهيئة المجموعة: ${groupLetter}, سكشن ${sectionNum}`);

    const previousGroup = localStorage.getItem('selectedGroup');
    if (previousGroup && previousGroup !== groupLetter) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
            if (name.includes(`group-${previousGroup}`)) {
                await caches.delete(name);
            }
        }
    }

    saveSelectedGroup(groupLetter);
    setCurrentSection(sectionNum);

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
    await loadSectionSVG(groupLetter, sectionNum);

    updateDynamicSizes();
    await loadImages();
}

export async function loadImages() {
    const allToLoad = [...STATIC_IMAGES, ...imageUrlsToLoad];
    if (allToLoad.length === 0) {
        finishLoading();
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
    finishLoading();
}

async function finishLoading() {
    loadingProgress.completedSteps = loadingProgress.totalSteps;
    loadingProgress.currentPercentage = 100;
    updateLoadProgress();

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
}

export function updateDynamicSizes() {
    const mainSvg = document.getElementById('main-svg');
    if (!mainSvg) return;
    const allImages = mainSvg.querySelectorAll('image[width][height]');
    if (allImages.length === 0) return;
    let maxX = 0;
    let maxY = 2454;
    allImages.forEach(img => {
        const g = img.closest('g[transform]');
        let translateX = 0;
        if (g) {
            const match = g.getAttribute('transform').match(/translate\s*\(([\d.-]+)(?:[ ,]+([\d.-]+))?\s*\)/);
            if (match) translateX = parseFloat(match[1]) || 0;
        }
        const imgWidth = parseFloat(img.getAttribute('width')) || 0;
        const imgHeight = parseFloat(img.getAttribute('height')) || 0;
        const imgX = parseFloat(img.getAttribute('x')) || 0;
        const totalX = translateX + imgX + imgWidth;
        if (totalX > maxX) maxX = totalX;
        if (imgHeight > maxY) maxY = imgHeight;
    });
    mainSvg.setAttribute('viewBox', `0 0 ${maxX} ${maxY}`);
}

// ---------- تحميل آخر مجموعة محفوظة ----------
export function loadSelectedGroup() {
    const saved = localStorage.getItem('selectedGroup');
    if (saved && /^[A-D]$/.test(saved)) {
        setCurrentGroup(saved);
        return true;
    }
    return false;
}