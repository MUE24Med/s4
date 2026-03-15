/* ========================================
   back-button.js – زر الرجوع الموحد (يدعم زر المتصفح)
   ========================================
   يقوم هذا الملف بتهيئة زر الرجوع الموجود في SVG
   كما يتعامل مع زر الرجوع في المتصفح (popstate)
   ليؤدي الوظائف التالية عند النقر أو الضغط على زر الرجوع:
   1. إغلاق عارض PDF إذا كان مفتوحاً
   2. إغلاق الفولدر المفتوح (مسح محتوى المجموعة)
   3. التمرير إلى أقصى اليسار (الخريطة الرئيسية)
   4. إعادة تعيين حالة البحث والتفاعلات
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

    // إذا كانت هناك حالة خاصة تشير إلى أننا في وضع مفتوح، ننفذ الإجراء
    if (isFolderOpen || isPDFOpen || isPopupOpen) {
        // ننفذ إجراء الرجوع
        performBackAction();

        // نعيد دفع الحالة السابقة لمنع الخروج من الصفحة
        // لكن يجب أن نكون حذرين: هذا قد يسبب تكراراً
        // الحل الأفضل: بعد تنفيذ الإجراء، نتحقق مما إذا كان لا يزال هناك شيء مفتوح
        // إذا لم يعد هناك شيء مفتوح، نسمح بالخروج (أو ندفع حالة جديدة)
        if (isFolderOpen || isPDFOpen || isPopupOpen) {
            // لا يزال هناك شيء مفتوح؟ نعيد دفع نفس الحالة أو حالة جديدة
            history.pushState({ appState: 'still-open' }, '');
        } else {
            // كل شيء مغلق، ندفع حالة main
            history.pushState({ appState: 'main' }, '');
        }
    } else {
        // لا يوجد شيء مفتوح، نسمح بالخروج الطبيعي
        console.log('لا يوجد شيء مفتوح، سيغادر الصفحة');
        // لا نفعل شيئاً، سيغادر المتصفح الصفحة
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

    // 6️⃣ تحديث الحالة
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
        // دفع حالة جديدة إلى history
        history.pushState({ appState: 'folder' }, '');
    } else {
        // إذا تم الإغلاق بواسطة وسيلة أخرى، نعدل الحالة
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
    // إذا لم يعد هناك أي شيء مفتوح، ندفع حالة main
    if (!isFolderOpen && !isPDFOpen && !isPopupOpen) {
        history.pushState({ appState: 'main' }, '');
    } else {
        // لا يزال هناك شيء مفتوح، ندفع حالة مناسبة (يمكن أن تكون آخر شيء مفتوح)
        // لكن هذا ليس ضرورياً لأن history سيكون له حالة بالفعل
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
            document.getElementById('group-specific-content').innerHTML = '';
            isFolderOpen = false;
        }
        if (isPDFOpen) {
            document.getElementById('pdf-overlay')?.classList.add('hidden');
            isPDFOpen = false;
        }
        if (isPopupOpen) {
            document.getElementById('pdf-preview-popup')?.classList.remove('active');
            document.getElementById('open-method-popup')?.classList.remove('active');
            isPopupOpen = false;
        }
    }
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

        // إلغاء تحميل PDF من الإطار
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
    const groupContent = document.getElementById('group-specific-content');
    if (groupContent) {
        groupContent.innerHTML = '';
        console.log('📁 تم إغلاق الفولدر وإزالة محتواه');
    }

    // إزالة أي كلاسات نشطة
    document.querySelectorAll('.wood-folder-group.active-folder').forEach(el => {
        el.classList.remove('active-folder');
    });

    localStorage.removeItem('current_open_folder');
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