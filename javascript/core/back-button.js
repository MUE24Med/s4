/* ========================================
   back-button.js – زر الرجوع الموحد (يدعم زر المتصفح)
   ======================================== */

// متغيرات لتتبع حالة الفتح
let isFolderOpen = false;
let isPDFOpen = false;
let isPopupOpen = false; // لأي نافذة منبثقة أخرى

/**
 * تهيئة زر الرجوع وإضافة مستمعات الأحداث
 */
export function setupBackButton() {
    // زر الرجوع المخصص داخل SVG
    const backButton = document.getElementById('back-button-group');
    if (backButton) {
        backButton.removeEventListener('click', handleBackClick);
        backButton.addEventListener('click', handleBackClick);
    } else {
        console.warn('⚠️ زر الرجوع (back-button-group) غير موجود');
    }

    // التعامل مع زر الرجوع في المتصفح
    window.addEventListener('popstate', handlePopState);

    // دفع حالة افتراضية عند تحميل الصفحة إذا لم تكن موجودة
    if (!history.state || !history.state.appState) {
        history.replaceState({ appState: 'main' }, '');
    }

    console.log('✅ تم تفعيل زر الرجوع (يدعم زر المتصفح)');
}

/**
 * معالج النقر على زر الرجوع المخصص
 */
function handleBackClick(e) {
    e.preventDefault();
    e.stopPropagation();
    performBackAction();
}

/**
 * معالج حدث popstate (زر الرجوع في المتصفح)
 */
function handlePopState(event) {
    console.log('🔙 زر الرجوع في المتصفح', event.state);

    if (isFolderOpen || isPDFOpen || isPopupOpen) {
        performBackAction();

        // بعد الإغلاق، ندفع حالة جديدة إذا بقي شيء مفتوح
        if (isFolderOpen || isPDFOpen || isPopupOpen) {
            history.pushState({ appState: 'still-open' }, '');
        } else {
            history.pushState({ appState: 'main' }, '');
        }
    } else {
        console.log('لا يوجد شيء مفتوح، سيغادر الصفحة');
    }
}

/**
 * تنفيذ إجراء الرجوع: إغلاق PDF، الفولدر، التمرير، إلخ
 */
function performBackAction() {
    console.log('🔙 تنفيذ إجراء الرجوع');

    // 1️⃣ إغلاق عارض PDF
    if (isPDFOpen) {
        closePDFViewer();
    }

    // 2️⃣ إغلاق الفولدر المفتوح
    if (isFolderOpen) {
        closeOpenFolder();
    }

    // 3️⃣ إغلاق أي نوافذ منبثقة
    if (isPopupOpen) {
        closePopups();
    }

    // 4️⃣ التمرير إلى أقصى اليسار
    scrollToLeftmost();

    // 5️⃣ إعادة تعيين واجهة المستخدم
    resetUI();

    // 6️⃣ تحديث الحالة (للتأكد)
    updateOpenStates();
}

// ========================================
// دوال لتحديث حالة الفتح (يجب استدعاؤها من الأماكن المناسبة)
// ========================================

/**
 * استدعِ هذه الدالة عند فتح فولدر
 */
export function setFolderOpen(open = true) {
    isFolderOpen = open;
    if (open) {
        history.pushState({ appState: 'folder' }, '');
    } else {
        updateHistoryAfterClose();
    }
}

/**
 * استدعِ هذه الدالة عند فتح PDF
 */
export function setPDFOpen(open = true) {
    isPDFOpen = open;
    if (open) {
        history.pushState({ appState: 'pdf' }, '');
    } else {
        updateHistoryAfterClose();
    }
}

/**
 * استدعِ هذه الدالة عند فتح نافذة منبثقة (مثل معاينة PDF أو اختيار طريقة الفتح)
 */
export function setPopupOpen(open = true) {
    isPopupOpen = open;
    if (open) {
        history.pushState({ appState: 'popup' }, '');
    } else {
        updateHistoryAfterClose();
    }
}

/**
 * تحديث history بعد إغلاق أي عنصر
 */
function updateHistoryAfterClose() {
    if (!isFolderOpen && !isPDFOpen && !isPopupOpen) {
        history.pushState({ appState: 'main' }, '');
    }
}

/**
 * تحديث متغيرات الحالة بناءً على الوضع الحالي
 */
function updateOpenStates() {
    // يمكن استدعاؤها بعد الإغلاق للتأكد
    if (isFolderOpen || isPDFOpen || isPopupOpen) {
        // إذا كان أي منها لا يزال مفتوحاً (بسبب خطأ) نغلقه بالقوة
        if (isFolderOpen) {
            forceCloseFolder();
        }
        if (isPDFOpen) {
            forceClosePDF();
        }
        if (isPopupOpen) {
            forceClosePopups();
        }
    }
}

// دوال القوة الإضافية للإغلاق الجبري
function forceCloseFolder() {
    const groupContent = document.getElementById('group-specific-content');
    if (groupContent) groupContent.innerHTML = '';
    document.querySelectorAll('.wood-folder-group.active-folder').forEach(el => {
        el.classList.remove('active-folder');
    });
    localStorage.removeItem('current_open_folder');
    isFolderOpen = false;
    console.log('📁 تم إغلاق الفولدر جبرياً');
}

function forceClosePDF() {
    const pdfOverlay = document.getElementById('pdf-overlay');
    if (pdfOverlay && !pdfOverlay.classList.contains('hidden')) {
        pdfOverlay.classList.add('hidden');
        const pdfFrame = document.getElementById('pdfFrame');
        if (pdfFrame) pdfFrame.src = '';
    }
    isPDFOpen = false;
}

function forceClosePopups() {
    const previewPopup = document.getElementById('pdf-preview-popup');
    if (previewPopup) previewPopup.classList.remove('active');
    const methodPopup = document.getElementById('open-method-popup');
    if (methodPopup) methodPopup.classList.remove('active');
    isPopupOpen = false;
}

// ========================================
// دوال الإجراءات الفعلية
// ========================================

/**
 * إغلاق عارض PDF إذا كان مفتوحاً
 */
function closePDFViewer() {
    const pdfOverlay = document.getElementById('pdf-overlay');
    if (pdfOverlay && !pdfOverlay.classList.contains('hidden')) {
        pdfOverlay.classList.add('hidden');
        console.log('📄 تم إغلاق عارض PDF');

        const pdfFrame = document.getElementById('pdfFrame');
        if (pdfFrame) {
            pdfFrame.src = '';
        }
    }
    isPDFOpen = false;
}

/**
 * إغلاق الفولدر المفتوح وإزالة محتوى المجموعة
 */
function closeOpenFolder() {
    // 1. تفريغ محتوى المجموعة (الملفات داخل الفولدر)
    const groupContent = document.getElementById('group-specific-content');
    if (groupContent) {
        groupContent.innerHTML = '';
        console.log('📁 تم إغلاق الفولدر وإزالة محتواه');
    }

    // 2. إزالة أي كلاسات تشير إلى فولدر نشط
    document.querySelectorAll('.wood-folder-group.active-folder').forEach(el => {
        el.classList.remove('active-folder');
    });

    // 3. إزالة أي بيانات محفوظة عن الفولدر المفتوح
    localStorage.removeItem('current_open_folder');

    // 4. إعادة ضبط أي متغيرات عامة قد تكون ذات صلة
    if (window.__currentFolderPath) {
        window.__currentFolderPath = null;
    }

    // 5. إعادة تعيين أي روابط ديناميكية أو عناصر إضافية
    const dynamicLinks = document.getElementById('dynamic-links-group');
    if (dynamicLinks) {
        // قد تحتاج إلى تنظيفها حسب الحاجة
    }

    isFolderOpen = false;
}

/**
 * إغلاق أي نوافذ منبثقة (مثل معاينة PDF أو نافذة اختيار الطريقة)
 */
function closePopups() {
    const previewPopup = document.getElementById('pdf-preview-popup');
    if (previewPopup && previewPopup.classList.contains('active')) {
        previewPopup.classList.remove('active');
    }

    const methodPopup = document.getElementById('open-method-popup');
    if (methodPopup && methodPopup.classList.contains('active')) {
        methodPopup.classList.remove('active');
    }

    isPopupOpen = false;
    console.log('🪟 تم إغلاق النوافذ المنبثقة');
}

/**
 * التمرير إلى أقصى يسار الخريطة
 */
function scrollToLeftmost() {
    const scrollContainer = document.getElementById('scroll-container');
    if (scrollContainer) {
        scrollContainer.scrollTo({
            left: 0,
            behavior: 'smooth'
        });
        console.log('⬅️ تم التمرير إلى أقصى اليسار');
    }
}

/**
 * التمرير إلى أقصى يمين الخريطة (اختياري)
 */
export function scrollToRightmost() {
    const scrollContainer = document.getElementById('scroll-container');
    if (scrollContainer) {
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        scrollContainer.scrollTo({
            left: maxScrollLeft,
            behavior: 'smooth'
        });
        console.log('➡️ تم التمرير إلى أقصى اليمين');
    }
}

/**
 * إعادة تعيين عناصر الواجهة
 */
function resetUI() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }

    document.querySelectorAll('.m.selected, rect.selected').forEach(el => {
        el.classList.remove('selected');
    });

    console.log('🧹 تم إعادة تعيين واجهة المستخدم');
}

// ========================================
// تصدير الدوال الإضافية
// ========================================
export {
    closePDFViewer,
    closeOpenFolder,
    closePopups,
    scrollToLeftmost,
    resetUI
};