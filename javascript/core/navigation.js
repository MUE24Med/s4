// ============================================
// navigation.js - نظام التنقل الخلفي وإدارة الحالات
// ============================================

import { NAV_STATE } from './config.js';
import { resetBrowserZoom } from './utils.js';
import { currentFolder, currentSection, setCurrentSection } from './state.js';

export let navigationHistory = [];

export function pushNavigationState(state, data = {}) {
    navigationHistory.push({ state, data, timestamp: Date.now() });
    console.log(`📍 تم إضافة حالة: ${state}`, data);
}

export function popNavigationState() {
    if (navigationHistory.length > 0) {
        const popped = navigationHistory.pop();
        console.log(`🔙 تم إزالة حالة: ${popped.state}`);
        return popped;
    }
    return null;
}

export function getCurrentNavigationState() {
    return navigationHistory.length > 0
        ? navigationHistory[navigationHistory.length - 1]
        : null;
}

export function handleBackNavigation(e) {
    const currentState = getCurrentNavigationState();
    console.log('🔙 زر الرجوع - الحالة الحالية:', currentState);

    if (!currentState) {
        console.log('📱 لا توجد حالة - السماح بالخروج');
        return;
    }

    e.preventDefault();

    if (currentState.state === NAV_STATE.PDF_VIEW) {
        console.log('📄 إغلاق PDF');
        popNavigationState();

        const overlay = document.getElementById("pdf-overlay");
        const pdfViewer = document.getElementById("pdfFrame");

        if (currentState.data.isPreview) {
            import('../ui/pdf-viewer.js').then(({ closePDFPreview }) => {
                closePDFPreview();
            });
        } else {
            pdfViewer.src = "";
            overlay.classList.add("hidden");
            if (overlay.classList.contains('fullscreen-mode')) {
                overlay.classList.remove('fullscreen-mode');
            }
        }

        if (currentState.data.scrollPosition !== undefined) {
            setTimeout(() => {
                const scrollContainer = document.getElementById('scroll-container');
                if (scrollContainer) {
                    scrollContainer.scrollLeft = currentState.data.scrollPosition;
                }
            }, 100);
        }
        return;
    }

    if (currentState.state === NAV_STATE.MAP_VIEW) {
        console.log('🗺️ العودة من الخريطة إلى الملفات');
        popNavigationState();
        import('./state.js').then(({ setCurrentFolder }) => {
            setCurrentFolder("");
        }).then(() => {
            import('../ui/wood-interface.js').then(({ updateWoodInterface }) => {
                updateWoodInterface();
            });
        });
        return;
    }

    if (currentState.state === NAV_STATE.WOOD_VIEW) {
        // إذا كان هناك سكشن مفتوح (وليس مجلد عادي) نغلق السكشن أولاً
        if (currentSection && currentSection !== null) {
            console.log('📂 العودة من سكشن إلى شاشة اختيار السكشن');
            setCurrentSection(null);
            // حذف العناصر الخاصة بالسكشن من DOM
            const groupContainer = document.getElementById('group-specific-content');
            if (groupContainer) {
                const sectionElements = groupContainer.querySelectorAll('.section-specific');
                sectionElements.forEach(el => el.remove());
            }
            // إعادة معالجة SVG وتحديث الواجهة
            import('../features/svg-processor.js').then(({ scan }) => {
                scan();
            });
            import('../ui/wood-interface.js').then(({ updateWoodInterface }) => {
                updateWoodInterface();
            });
            // إظهار شاشة اختيار السكشن مرة أخرى
            const groupLetter = localStorage.getItem('selectedGroup') || currentState.data.group;
            if (groupLetter) {
                import('./group-loader.js').then(({ showSectionSelection }) => {
                    showSectionSelection(groupLetter);
                });
            }
            return;
        }

        if (currentFolder && currentFolder !== "") {
            console.log('📂 العودة من مجلد إلى المجلد الأب');
            const parts = currentFolder.split('/');
            parts.pop();
            import('./state.js').then(({ setCurrentFolder }) => {
                setCurrentFolder(parts.join('/'));
            }).then(() => {
                import('../ui/wood-interface.js').then(({ updateWoodInterface }) => {
                    updateWoodInterface();
                });
            });
            return;
        }

        console.log('🌲 العودة لاختيار المجموعة');
        popNavigationState();
        const groupSelectionScreen = document.getElementById('group-selection-screen');
        const toggleContainer = document.getElementById('js-toggle-container');
        const scrollContainer = document.getElementById('scroll-container');
        if (groupSelectionScreen) {
            groupSelectionScreen.classList.remove('hidden');
            groupSelectionScreen.style.display = 'flex';
        }
        if (toggleContainer) toggleContainer.classList.add('fully-hidden');
        if (scrollContainer) scrollContainer.style.display = 'none';
        navigationHistory = [];
        return;
    }

    if (currentState.state === NAV_STATE.GROUP_SELECTION) {
        console.log('🏠 محاولة الخروج من اختيار المجموعة');
        popNavigationState();
        return;
    }
}

export function setupBackButton() {
    console.log('🔧 إعداد نظام التنقل الخلفي');

    if (!window.history.state || window.history.state.page !== 'main') {
        window.history.replaceState({ page: 'main' }, '', '');
    }

    window.addEventListener('popstate', (e) => {
        handleBackNavigation(e);
        const currentNav = getCurrentNavigationState();
        if (currentNav) {
            window.history.pushState({ page: 'main' }, '', '');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const pdfOverlay = document.getElementById('pdf-overlay');
            if (pdfOverlay && pdfOverlay.classList.contains('fullscreen-mode')) {
                import('../ui/pdf-viewer.js').then(({ toggleMozillaToolbar }) => {
                    toggleMozillaToolbar();
                });
            }
        }
    });

    console.log('✅ نظام التنقل الخلفي جاهز');
}

export function goToWood() {
    const scrollContainer = document.getElementById('scroll-container');
    if (scrollContainer) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
    }
    const currentState = getCurrentNavigationState();
    if (!currentState || currentState.state !== NAV_STATE.WOOD_VIEW) {
        pushNavigationState(NAV_STATE.WOOD_VIEW, { folder: currentFolder });
    }
}

export function goToMapEnd() {
    const scrollContainer = document.getElementById('scroll-container');
    if (!scrollContainer) return;
    const maxScrollRight = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    scrollContainer.scrollTo({ left: maxScrollRight, behavior: 'smooth' });
    pushNavigationState(NAV_STATE.MAP_VIEW);
}