// ============================================
// ui-controls.js - أزرار التحكم والتفاعل (معدل لدعم اختيار السكشن الإجباري)
// ============================================

import { NAV_STATE } from '../core/config.js';
import { goToWood, pushNavigationState, goToMapEnd } from '../core/navigation.js';
import { setCurrentSection } from '../core/state.js';

// ---------- زر تغيير المجموعة (يعيد ضبط السكشن ويظهر شاشة المجموعات) ----------
export function setupGroupChangeButton() {
    const changeGroupBtn = document.getElementById('change-group-btn');
    if (changeGroupBtn) {
        changeGroupBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // مسح السكشن المخزن
            setCurrentSection(null);
            // إظهار شاشة المجموعات
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

// ---------- أزرار اختيار المجموعة (تعرض شاشة السكشن إجبارياً) ----------
export function setupGroupSelectionButtons() {
    document.querySelectorAll('.group-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const group = this.getAttribute('data-group');
            console.log('👆 تم اختيار المجموعة:', group);
            // حفظ المجموعة المختارة
            const { setCurrentGroup } = await import('../core/state.js');
            setCurrentGroup(group);
            // عرض شاشة اختيار السكشن
            const { showSectionSelection } = await import('../core/group-loader.js');
            await showSectionSelection(group);
        });
    });
}

// ---------- زر العودة لشاشة التحميل المسبق ----------
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

// ---------- زر مسح الكاش وإعادة الضبط ----------
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

// ---------- زر تحريك شريط الأدوات ----------
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

// ---------- أيقونة البحث (تمرير أقصى اليسار) ----------
export function setupSearchIcon() {
    const searchIcon = document.getElementById('search-icon');
    if (searchIcon) {
        searchIcon.onclick = (e) => {
            e.preventDefault();
            goToWood();
        };
    }
}

// ---------- زر الرجوع داخل SVG ----------
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

// ---------- تبديل تفعيل التفاعل (Hover) ----------
export function setupInteractionToggle() {
    const jsToggle = document.getElementById('js-toggle');
    if (jsToggle) {
        jsToggle.addEventListener('change', function () {
            import('../ui/wood-interface.js').then(module => {
                module.setInteractionEnabled(this.checked);
            });
        });
    }
}

// ============================================
// زر تثبيت التطبيق داخل الـ SVG
// ============================================

let _installButtonInitialized = false;

export function setupInstallButton() {
    if (_installButtonInitialized) {
        console.log('ℹ️ setupInstallButton: تم الإعداد مسبقاً، تخطي');
        return;
    }
    _installButtonInitialized = true;

    _setupAndroidInstallButton();
    _setupIOSInstallHint();
}

function _setupAndroidInstallButton() {
    const mainSvg = document.getElementById('main-svg');
    if (!mainSvg) return;

    const existing = document.getElementById('install-svg-btn');
    if (existing) {
        console.log('♻️ install-svg-btn: إعادة استخدام العنصر الموجود');
        _bindInstallButtonEvents(existing);
        return;
    }

    const installGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    installGroup.setAttribute('id', 'install-svg-btn');
    installGroup.style.cursor = 'pointer';
    installGroup.style.display = 'none';

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '312');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '400');
    rect.setAttribute('height', '45');
    rect.setAttribute('rx', '22');
    rect.setAttribute('fill', '#ffcc00');
    rect.setAttribute('filter', 'drop-shadow(0 3px 8px rgba(255,204,0,0.6))');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '512');
    text.setAttribute('y', '27');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#000');
    text.setAttribute('font-weight', '900');
    text.setAttribute('font-size', '18');
    text.setAttribute('font-family', 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif');
    text.setAttribute('pointer-events', 'none');
    text.textContent = '📲 أضف الموقع للديسك توب';

    installGroup.appendChild(rect);
    installGroup.appendChild(text);
    mainSvg.appendChild(installGroup);

    _bindInstallButtonEvents(installGroup);
    console.log('✅ زر التثبيت SVG جاهز');
}

function _bindInstallButtonEvents(installGroup) {
    if (window._pwaPrompt) {
        installGroup.style.display = '';
    }

    // استبدال العنصر لتجنب تكرار المستمعات
    const newGroup = installGroup.cloneNode(true);
    installGroup.parentNode?.replaceChild(newGroup, installGroup);
    installGroup = newGroup;

    window.addEventListener('pwaInstallReady', () => {
        installGroup.style.display = '';
    });

    window.addEventListener('appinstalled', () => {
        installGroup.style.display = 'none';
        const banner = document.getElementById('ios-install-banner');
        if (banner) banner.classList.remove('show');
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

function _setupIOSInstallHint() {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    const dismissed = localStorage.getItem('ios_banner_dismissed');

    if (!isIOS || isStandalone || dismissed) return;

    const banner = document.getElementById('ios-install-banner');
    if (!banner) return;

    setTimeout(() => banner.classList.add('show'), 2500);

    const closeBtn = document.getElementById('ios-banner-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            banner.classList.remove('show');
            localStorage.setItem('ios_banner_dismissed', '1');
        });
    }

    console.log('✅ iOS Install Banner جاهز');
}