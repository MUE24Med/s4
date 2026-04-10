// ============================================
// group-loader.js - الملف الرئيسي (يستدعي الوحدات)
// ============================================

import { RAW_CONTENT_BASE, TREE_API_URL, NAV_STATE } from './config.js';
import { resetBrowserZoom } from './utils.js';
import { pushNavigationState, goToWood } from './navigation.js';
import { setCurrentGroup, setCurrentFolder, setGlobalFileTree, globalFileTree, currentGroup, currentFolder, setCurrentSection, currentSection } from './state.js';

// استيراد الوحدات المقسمة
import { showLoadingScreen, hideLoadingScreen, updateLoadProgress } from './loading-ui.js';
import { loadImages, clearImageUrls } from './image-loader.js';
import { loadGroupSVG, loadSectionSVG } from './svg-loader.js';
import { hideOverlappingGroupImages, bringSectionRectsToFront } from './layer-manager.js';
import { updateDynamicSizes } from './dynamic-size.js';
import { updateSectionName } from './section-name.js';
import { loadingProgress } from './loading-state.js';

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

// ---------- عرض شاشة اختيار السكشن ----------
export async function showSectionSelection(groupLetter) {
    const groupSelectionScreen = document.getElementById('group-selection-screen');
    const sectionScreen = document.getElementById('section-selection-screen');
    if (!sectionScreen) return;

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

// ---------- تهيئة المجموعة ----------
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
                console.log(`🗑️ تم حذف كاش المجموعة السابقة: ${name}`);
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
    
    // تحميل الصور ثم إنهاء التحميل
    await new Promise((resolve) => {
        loadImages(() => {
            finishLoading(groupLetter, sectionNum);
            resolve();
        });
    });
}

async function finishLoading(groupLetter, sectionNum) {
    loadingProgress.completedSteps = loadingProgress.totalSteps;
    loadingProgress.currentPercentage = 100;
    updateLoadProgress();

    const { scan } = await import('../features/svg-processor.js');
    const { updateWoodInterface } = await import('../ui/wood-interface.js');

    updateDynamicSizes();
    scan();
    
    // تطبيق أولويات الطبقات (بدون نقل العناصر خارج مجموعاتها)
    hideOverlappingGroupImages();
    bringSectionRectsToFront();   // فقط مستطيلات السكشن تُرفع إلى الأمام
    
    // إضافة اسم السكشن
    updateSectionName(groupLetter, sectionNum);
    
    updateWoodInterface();
    goToWood();

    const mainSvg = document.getElementById('main-svg');
    if (mainSvg) {
        mainSvg.style.opacity = '1';
        mainSvg.style.visibility = 'visible';
        mainSvg.classList.add('loaded');
    }
    hideLoadingScreen();
    console.log('🎉 اكتمل تحميل المجموعة والسكشن بنجاح');
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