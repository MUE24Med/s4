/* ========================================
   script.js - نقطة الدخول الرئيسية (محسّن للسرعة)
   ======================================== */

import { preventInteractionWhenHidden, initWoodUI, updateWelcomeMessages } from './javascript/ui/wood-interface.js';
import { resetBrowserZoom } from './javascript/core/utils.js';
import { setupInstallButton } from './javascript/ui/ui-controls.js';

// ---------- تحميل آخر جروب تلقائياً (سريع) ----------
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
        if (groupSelectionScreen) groupSelectionScreen.style.display = 'none';
        import('./javascript/core/group-loader.js').then(m => m.initializeGroup(savedGroup));
    } else {
        console.log('📋 لا يوجد جروب محفوظ - عرض شاشة الاختيار');
    }
}

// ---------- مراقب تغيير Z-Index (نفسه) ----------
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
                if ((mutation.attributeName === 'style' || mutation.attributeName === 'class') && shouldTriggerReset(target)) {
                    clearTimeout(zoomTimeout);
                    zoomTimeout = setTimeout(() => resetBrowserZoom(), 80);
                    break;
                }
            }
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && shouldTriggerReset(node)) {
                        clearTimeout(zoomTimeout);
                        zoomTimeout = setTimeout(() => resetBrowserZoom(), 80);
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
    console.log('✅ مراقبة z-index مفعّلة');
}

// ---------- منع قائمة السياق (نفسه) ----------
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

// ---------- التهيئة عند تحميل DOM (محسّنة بالتحميل الديناميكي) ----------
document.addEventListener('DOMContentLoaded', () => {
    const preloadDone = localStorage.getItem('preload_done');

    if (!preloadDone) {
        // أول زيارة: تحميل شاشة preload فقط
        import('./javascript/features/preload.js').then(({ initPreload }) => {
            initPreload();
        });
    } else {
        // الزيارات التالية: تحميل تدريجي للمكونات دون تعطيل التفاعل
        autoLoadLastGroup();
        preventInteractionWhenHidden();
        updateWelcomeMessages();
        preventContextMenu();
        observeZIndexChanges();

        // تحميل المكونات الأساسية فوراً
        Promise.all([
            import('./javascript/core/back-button.js').then(m => m.setupBackButton()),
            import('./javascript/ui/wood-interface.js').then(m => m.initWoodUI()),
            import('./javascript/ui/ui-controls.js').then(m => m.setupInstallButton())
        ]).then(() => {
            console.log('✅ المكونات الأساسية جاهزة');
        });

        // تحميل المكونات الثانوية بعد 100ms (لا تؤثر على العرض الأول)
        setTimeout(() => {
            import('./javascript/ui/pdf-viewer.js').then(m => m.initPDFViewer());
            import('./javascript/features/svg-processor.js').then(m => m.scan());
            import('./javascript/ui/search-and-eye.js');
        }, 100);
    }

    console.log('✅ script.js تم تحميله بالكامل - وضع السرعة مفعّل');
});