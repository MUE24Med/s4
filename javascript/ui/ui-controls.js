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

// ============================================
// زر قفل الاتجاه (Screen Orientation Lock)
// ============================================

export function setupOrientationLockButton() {
    // إنشاء الزر إذا لم يكن موجوداً
    let lockBtn = document.getElementById('orientation-lock-btn');
    if (!lockBtn) {
        const toggleContainer = document.getElementById('js-toggle-container');
        if (!toggleContainer) {
            console.warn('⚠️ لم يتم العثور على حاوية الأزرار');
            return;
        }

        // البحث عن الـ controls-row لإضافة الزر فيه
        const controlsRow = toggleContainer.querySelector('.controls-row');
        if (!controlsRow) {
            console.warn('⚠️ لم يتم العثور على controls-row');
            return;
        }

        // إنشاء زر جديد
        lockBtn = document.createElement('span');
        lockBtn.id = 'orientation-lock-btn';
        lockBtn.textContent = '🔒 أفقي';
        lockBtn.title = 'قفل الشاشة في الوضع الأفقي';
        lockBtn.style.cursor = 'pointer';
        lockBtn.style.padding = '6px';
        lockBtn.style.fontSize = '14px';
        lockBtn.style.opacity = '0.8';
        lockBtn.style.display = 'flex';
        lockBtn.style.alignItems = 'center';
        lockBtn.style.justifyContent = 'center';
        lockBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        lockBtn.style.borderRadius = '8px';
        lockBtn.style.minWidth = '32px';
        lockBtn.style.minHeight = '32px';
        lockBtn.style.transition = 'all 0.2s ease';

        // إضافة الزر قبل hover-toggle-container (اختياري)
        const hoverContainer = controlsRow.querySelector('.hover-toggle-container');
        if (hoverContainer) {
            controlsRow.insertBefore(lockBtn, hoverContainer);
        } else {
            controlsRow.appendChild(lockBtn);
        }

        // إضافة تأثير hover
        lockBtn.addEventListener('mouseenter', () => {
            lockBtn.style.opacity = '1';
            lockBtn.style.transform = 'scale(1.1)';
            lockBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        lockBtn.addEventListener('mouseleave', () => {
            lockBtn.style.opacity = '0.8';
            lockBtn.style.transform = 'scale(1)';
            lockBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        });
    }

    // إزالة المستمع القديم لتجنب التكرار
    const newLockBtn = lockBtn.cloneNode(true);
    lockBtn.parentNode?.replaceChild(newLockBtn, lockBtn);
    
    // إضافة المستمع الجديد
    newLockBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await lockScreenToLandscape();
    });
}

async function lockScreenToLandscape() {
    // التحقق من دعم API
    if (!screen.orientation || typeof screen.orientation.lock !== 'function') {
        console.warn('⚠️ Screen Orientation API غير مدعوم في هذا المتصفح');
        alert('❌ متصفحك لا يدعم قفل اتجاه الشاشة.\nيمكنك تفعيل الدوران من إعدادات النظام.');
        return;
    }

    // التحقق من وجود HTTPS أو localhost
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && !location.hostname.startsWith('127.0.0.1')) {
        console.warn('⚠️ قفل الاتجاه يتطلب HTTPS');
        alert('❌ قفل الشاشة يعمل فقط عبر HTTPS.\nالموقع الحالي غير آمن لهذه الميزة.');
        return;
    }

    try {
        await screen.orientation.lock('landscape');
        console.log('✅ تم قفل الشاشة في الوضع الأفقي');
        
        // تغيير مظهر الزر ليدل على أن القفل نشط
        const btn = document.getElementById('orientation-lock-btn');
        if (btn) {
            btn.textContent = '🔓 حرر';
            btn.title = 'إلغاء قفل الاتجاه';
            btn.style.background = 'rgba(46, 204, 113, 0.3)';
            btn.style.border = '1px solid #2ecc71';
        }
        
        // حفظ الحالة في localStorage
        localStorage.setItem('orientation_locked', 'true');
        
        // إظهار رسالة نجاح قصيرة
        showTemporaryMessage('✅ تم تثبيت الشاشة أفقياً', '#2ecc71');
        
        // تغيير السلوك عند النقر مرة أخرى لفتح القفل
        btn?.removeEventListener('click', lockScreenToLandscape);
        btn?.addEventListener('click', unlockScreenOrientation);
    } catch (error) {
        console.error('❌ فشل قفل الاتجاه:', error);
        let errorMsg = 'لا يمكن قفل الشاشة حالياً.';
        if (error.name === 'NotAllowedError') {
            errorMsg = 'يجب أن تكون هناك نقرة مستخدم مباشرة (مثل زر) لتشغيل هذه الميزة.';
        } else if (error.name === 'SecurityError') {
            errorMsg = 'الميزة غير متاحة على هذا الجهاز أو المتصفح.';
        }
        alert(`❌ ${errorMsg}`);
        showTemporaryMessage('❌ فشل تثبيت الاتجاه', '#e74c3c');
    }
}

async function unlockScreenOrientation() {
    if (!screen.orientation || typeof screen.orientation.unlock !== 'function') {
        alert('❌ لا يمكن إلغاء القفل في هذا المتصفح.');
        return;
    }
    
    try {
        screen.orientation.unlock();
        console.log('🔓 تم إلغاء قفل الاتجاه');
        
        const btn = document.getElementById('orientation-lock-btn');
        if (btn) {
            btn.textContent = '🔒 أفقي';
            btn.title = 'قفل الشاشة في الوضع الأفقي';
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
            btn.style.border = 'none';
        }
        
        localStorage.removeItem('orientation_locked');
        showTemporaryMessage('🔓 تم إلغاء التثبيت', '#f39c12');
        
        // إعادة المستمع الأصلي
        btn?.removeEventListener('click', unlockScreenOrientation);
        btn?.addEventListener('click', lockScreenToLandscape);
    } catch (error) {
        console.error('❌ فشل إلغاء القفل:', error);
        alert('❌ لا يمكن إلغاء القفل حالياً.');
    }
}

// دالة مساعدة لإظهار رسالة منبثقة صغيرة تختفي بعد ثانيتين
function showTemporaryMessage(message, color) {
    let msgDiv = document.getElementById('orientation-temp-msg');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'orientation-temp-msg';
        msgDiv.style.position = 'fixed';
        msgDiv.style.bottom = '80px';
        msgDiv.style.left = '50%';
        msgDiv.style.transform = 'translateX(-50%)';
        msgDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        msgDiv.style.color = '#fff';
        msgDiv.style.padding = '8px 16px';
        msgDiv.style.borderRadius = '20px';
        msgDiv.style.fontSize = '14px';
        msgDiv.style.zIndex = '10000';
        msgDiv.style.backdropFilter = 'blur(5px)';
        msgDiv.style.border = `1px solid ${color}`;
        msgDiv.style.direction = 'rtl';
        document.body.appendChild(msgDiv);
    }
    msgDiv.textContent = message;
    msgDiv.style.borderColor = color;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 2000);
}