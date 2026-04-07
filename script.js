/* ========================================
   script.js - نقطة الدخول الرئيسية (ES Module)
   ======================================== */

import { initPreloadSystem } from './javascript/features/preload-game.js';
import { setupBackButton } from './javascript/core/back-button.js';
import { preventInteractionWhenHidden, initWoodUI, updateWelcomeMessages } from './javascript/ui/wood-interface.js';
import { initPDFViewer } from './javascript/ui/pdf-viewer.js';
import { initializeGroup, loadSelectedGroup } from './javascript/core/group-loader.js';
import { scan } from './javascript/features/svg-processor.js';
import { resetBrowserZoom } from './javascript/core/utils.js';
import { setupInstallButton } from './javascript/ui/ui-controls.js';

// ---------- تحميل آخر جروب تلقائياً ----------
function autoLoadLastGroup() {
    const preloadDone = localStorage.getItem('preload_done');

    if (!preloadDone) {
        console.log('⏭️ أول زيارة - تخطي التحميل التلقائي');
        return;
    }

    const savedGroup = localStorage.getItem('selectedGroup');

    if (savedGroup && /^[A-D]$/.test(savedGroup)) {
        console.log(`🚀 تحميل آخر جروب تلقائياً: ${savedGroup}`);
        const groupSelectionScreen = document.getElementById('group-selection-screen');
        if (groupSelectionScreen) {
            groupSelectionScreen.style.display = 'none';
        }
        initializeGroup(savedGroup);
    } else {
        console.log('📋 لا يوجد جروب محفوظ - عرض شاشة الاختيار');
    }
}

// ---------- مراقب تغيير Z-Index (إعادة تعيين التكبير) ----------
function observeZIndexChanges() {
    let zoomTimeout;

    const shouldTriggerReset = (el) => {
        if (!el || !el.style) return false;
        const style = window.getComputedStyle(el);
        return (
            style.zIndex !== 'auto' &&
            parseInt(style.zIndex) >= 10 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const target = mutation.target;

            if (mutation.type === 'attributes') {
                if (
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class') &&
                    shouldTriggerReset(target)
                ) {
                    clearTimeout(zoomTimeout);
                    zoomTimeout = setTimeout(() => {
                        console.log('🧠 تغيير z-index / ظهور شاشة → Reset Zoom');
                        resetBrowserZoom();
                    }, 80);
                    break;
                }
            }

            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && shouldTriggerReset(node)) {
                        clearTimeout(zoomTimeout);
                        zoomTimeout = setTimeout(() => {
                            console.log('🧠 إضافة شاشة جديدة → Reset Zoom');
                            resetBrowserZoom();
                        }, 80);
                        break;
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
        subtree: true
    });

    console.log('✅ مراقبة z-index وظهور/اختفاء الشاشات مفعّلة');
}

// ---------- منع قائمة السياق على العناصر البصرية ----------
function preventContextMenu() {
    document.addEventListener('contextmenu', (e) => {
        const target = e.target;
        if (
            target.tagName === 'image' ||
            target.tagName === 'IMG' ||
            target.tagName === 'svg' ||
            target.tagName === 'rect' ||
            target.closest('svg')
        ) {
            e.preventDefault();
            return false;
        }
    });
}

// ---------- التهيئة عند تحميل DOM ----------
document.addEventListener('DOMContentLoaded', () => {
    const preloadDone = localStorage.getItem('preload_done');

    if (!preloadDone) {
        initPreloadSystem();
    } else {
        autoLoadLastGroup();
        setupBackButton();
        preventInteractionWhenHidden();
        initWoodUI();
        initPDFViewer();
        setupInstallButton();
        observeZIndexChanges();
        updateWelcomeMessages();
        preventContextMenu();
    }

    console.log('✅ script.js تم تحميله بالكامل - جميع الوحدات جاهزة');
});

export { scan };

// داخل state.js
export let currentGroup = 'A';
export let currentSection = null; // رقم السكشن أو null إذا لم يتم اختياره

export function setCurrentGroup(group) {
  currentGroup = group;
}

export function setCurrentSection(section) {
  currentSection = section;
}