// ============================================
// ui-controls.js - أزرار التحكم والتفاعل
// ============================================

import { NAV_STATE } from '../core/config.js';
import { goToWood, pushNavigationState, goToMapEnd } from '../core/navigation.js';

export function setupGroupChangeButton() {
    const changeGroupBtn = document.getElementById('change-group-btn');
    if (changeGroupBtn) {
        changeGroupBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const groupSelectionScreen = document.getElementById('group-selection-screen');
            if (groupSelectionScreen) {
                groupSelectionScreen.classList.remove('hidden');
                groupSelectionScreen.style.display = 'flex';
            }
            goToWood();
            pushNavigationState(NAV_STATE.GROUP_SELECTION);
        });
    }
}

export function setupGroupSelectionButtons() {
    document.querySelectorAll('.group-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const group = this.getAttribute('data-group');
            console.log('👆 تم اختيار المجموعة:', group);
            import('../core/group-loader.js').then(({ initializeGroup }) => {
                initializeGroup(group);
            });
        });
    });
}

export function setupPreloadButton() {
    const preloadBtn = document.getElementById('preload-btn');
    if (preloadBtn) {
        preloadBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            console.log('🔄 العودة لشاشة التحميل المسبق');
            localStorage.removeItem('preload_done');
            localStorage.removeItem('last_visit_timestamp');
            window.location.reload();
        });
    }
}

export function setupResetButton() {
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async function (e) {
            e.stopPropagation();

            const confirmReset = confirm('⚠️ سيتم حذف جميع الملفات المحمية (Cache) وإعادة ضبط الموقع بالكامل. هل تريد الاستمرار؟');
            if (!confirmReset) return;

            console.log('🧹 بدء التنظيف الشامل...');

            localStorage.clear();
            sessionStorage.clear();

            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
                console.log('📡 تم إرسال أمر مسح الملفات للـ SW');
            }

            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            alert('تم مسح الملفات بنجاح. سيتم إعادة تشغيل الموقع الآن.');
            window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
        });
    }
}

export function setupMoveToggleButton() {
    const moveToggle = document.getElementById('move-toggle');
    if (moveToggle) {
        moveToggle.onclick = (e) => {
            e.preventDefault();
            const toggleContainer = document.getElementById('js-toggle-container');
            if (toggleContainer && toggleContainer.classList.contains('top')) {
                toggleContainer.classList.replace('top', 'bottom');
            } else if (toggleContainer) {
                toggleContainer.classList.replace('bottom', 'top');
            }
        };
    }
}

export function setupSearchIcon() {
    const searchIcon = document.getElementById('search-icon');
    if (searchIcon) {
        searchIcon.onclick = (e) => {
            e.preventDefault();
            goToWood();
        };
    }
}

export function setupBackButtonInSVG(getCurrentFolder, setCurrentFolder, updateWoodInterface) {
    const backButtonGroup = document.getElementById('back-button-group');
    if (backButtonGroup) {
        backButtonGroup.onclick = (e) => {
            e.stopPropagation();

            const folder = getCurrentFolder();

            if (folder !== "") {
                console.log('📂 زر SVG: العودة للمجلد الأب');
                const parts = folder.split('/');
                parts.pop();
                setCurrentFolder(parts.join('/'));
                updateWoodInterface();
            } else {
                console.log('🗺️ زر SVG: الذهاب لنهاية الخريطة');
                goToMapEnd();
            }
        };
    }
}

export function setupInteractionToggle() {
    const jsToggle = document.getElementById('js-toggle');
    if (jsToggle) {
        jsToggle.addEventListener('change', function () {
            // ✅ نحدث المتغير في wood-interface مباشرةً عبر الـ module
            import('../ui/wood-interface.js').then(module => {
                module.setInteractionEnabled(this.checked);
            });
        });
    }
}

// ============================================
// زر تثبيت التطبيق داخل الـ SVG
// ============================================
export function setupInstallButton() {
    const mainSvg = document.getElementById('main-svg');
    const fixedLayer = document.getElementById('fixed-controls-layer');
    if (!mainSvg || !fixedLayer) return;

    const installGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    installGroup.setAttribute('id', 'install-svg-btn');
    installGroup.setAttribute('style', 'cursor: pointer; display: none;');

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '112');
    rect.setAttribute('y', '38');
    rect.setAttribute('width', '800');
    rect.setAttribute('height', '55');
    rect.setAttribute('rx', '12');
    rect.setAttribute('fill', '#ffcc00');
    rect.setAttribute('filter', 'drop-shadow(0 4px 10px rgba(255,204,0,0.5))');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '512');
    text.setAttribute('y', '65');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#000');
    text.setAttribute('font-weight', '900');
    text.setAttribute('font-size', '22');
    text.setAttribute('font-family', 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif');
    text.setAttribute('pointer-events', 'none');
    text.setAttribute('user-select', 'none');
    text.textContent = '📲 أضف الموقع للديسك توب';

    installGroup.appendChild(rect);
    installGroup.appendChild(text);
    fixedLayer.insertBefore(installGroup, fixedLayer.firstChild);

    window.addEventListener('pwaInstallReady', () => {
        installGroup.style.display = '';
    });

    window.addEventListener('appinstalled', () => {
        installGroup.style.display = 'none';
    });

    installGroup.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!window._pwaPrompt) return;
        window._pwaPrompt.prompt();
        const { outcome } = await window._pwaPrompt.userChoice;
        console.log(outcome === 'accepted' ? '✅ تم التثبيت' : '❌ رفض التثبيت');
        window._pwaPrompt = null;
        installGroup.style.display = 'none';
    });
}
