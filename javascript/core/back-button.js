/* ========================================
   back-button.js – زر الرجوع الموحد (يدعم زر المتصفح)
   ======================================== */

// متغيرات لتتبع حالة الفتح
let isFolderOpen = false;
let isPDFOpen = false;
let isPopupOpen = false;

/**
 * تهيئة زر الرجوع وإضافة مستمعات الأحداث
 */
export function setupBackButton() {
    // زر الرجوع المخصص داخل SVG
    const backButton = document.getElementById('back-button-group');
    if (backButton) {
        // إزالة أي مستمع قديم (تجنب التكرار)
        backButton.removeEventListener('click', handleBackClick);
        backButton.addEventListener('click', handleBackClick);
        console.log('✅ زر الرجوع المخصص جاهز');
    } else {
        console.warn('⚠️ زر الرجوع (back-button-group) غير موجود');
    }

    // التعامل مع زر الرجوع في المتصفح
    window.removeEventListener('popstate', handlePopState);
    window.addEventListener('popstate', handlePopState);

    // دفع حالة افتراضية عند تحميل الصفحة
    if (!history.state || !history.state.appState) {
        history.replaceState({ appState: 'main' }, '');
    }

    console.log('✅ تم تفعيل زر الرجوع (يدعم زر المتصفح)');
}

// معالج النقر على زر الرجوع المخصص
function handleBackClick(e) {
    e.preventDefault();
    e.stopPropagation();
    performBackAction();
}

// معالج popstate (زر الرجوع في المتصفح)
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
        // لا نفعل شيئاً، سيغادر المتصفح
    }
}

// تنفيذ إجراء الرجوع
function performBackAction() {
    console.log('🔙 تنفيذ إجراء الرجوع');

    // إغلاق PDF إذا كان مفتوحاً
    if (isPDFOpen) closePDFViewer();

    // إغلاق المجلد إذا كان مفتوحاً
    if (isFolderOpen) closeOpenFolder();

    // إغلاق النوافذ المنبثقة
    if (isPopupOpen) closePopups();

    // التمرير إلى أقصى اليسار
    scrollToLeftmost();

    // إعادة تعيين واجهة المستخدم
    resetUI();

    // تحديث الحالة للتأكد
    updateOpenStates();
}

// ========================================
// دوال تحديث الحالة (يجب استدعاؤها من الأماكن المناسبة)
// ========================================
export function setFolderOpen(open = true) {
    isFolderOpen = open;
    if (open) {
        history.pushState({ appState: 'folder' }, '');
    } else {
        if (!isFolderOpen && !isPDFOpen && !isPopupOpen) {
            history.pushState({ appState: 'main' }, '');
        }
    }
    console.log(`📁 حالة المجلد: ${open ? 'مفتوح' : 'مغلق'}`);
}

export function setPDFOpen(open = true) {
    isPDFOpen = open;
    if (open) {
        history.pushState({ appState: 'pdf' }, '');
    } else {
        if (!isFolderOpen && !isPDFOpen && !isPopupOpen) {
            history.pushState({ appState: 'main' }, '');
        }
    }
}

export function setPopupOpen(open = true) {
    isPopupOpen = open;
    if (open) {
        history.pushState({ appState: 'popup' }, '');
    } else {
        if (!isFolderOpen && !isPDFOpen && !isPopupOpen) {
            history.pushState({ appState: 'main' }, '');
        }
    }
}

// ========================================
// دوال الإجراءات الفعلية
// ========================================
function closePDFViewer() {
    const pdfOverlay = document.getElementById('pdf-overlay');
    if (pdfOverlay && !pdfOverlay.classList.contains('hidden')) {
        pdfOverlay.classList.add('hidden');
        const pdfFrame = document.getElementById('pdfFrame');
        if (pdfFrame) pdfFrame.src = '';
        console.log('📄 تم إغلاق عارض PDF');
    }
    isPDFOpen = false;
}

function closeOpenFolder() {
    const groupContent = document.getElementById('group-specific-content');
    if (groupContent) {
        groupContent.innerHTML = '';
        console.log('📁 تم إغلاق المجلد وإزالة محتواه');
    }

    // إزالة الكلاسات النشطة
    document.querySelectorAll('.wood-folder-group.active-folder').forEach(el => {
        el.classList.remove('active-folder');
    });

    localStorage.removeItem('current_open_folder');
    if (window.__currentFolderPath) window.__currentFolderPath = null;
    isFolderOpen = false;
}

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

function scrollToLeftmost() {
    const scrollContainer = document.getElementById('scroll-container');
    if (scrollContainer) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        console.log('⬅️ تم التمرير إلى أقصى اليسار');
    }
}

function resetUI() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.m.selected, rect.selected').forEach(el => {
        el.classList.remove('selected');
    });
}

function updateOpenStates() {
    // إغلاق جبري إذا بقي شيء
    if (isFolderOpen) forceCloseFolder();
    if (isPDFOpen) forceClosePDF();
    if (isPopupOpen) forceClosePopups();
}

function forceCloseFolder() {
    document.getElementById('group-specific-content').innerHTML = '';
    isFolderOpen = false;
}

function forceClosePDF() {
    document.getElementById('pdf-overlay')?.classList.add('hidden');
    isPDFOpen = false;
}

function forceClosePopups() {
    document.getElementById('pdf-preview-popup')?.classList.remove('active');
    document.getElementById('open-method-popup')?.classList.remove('active');
    isPopupOpen = false;
}

// تصدير الدوال الإضافية
export { closePDFViewer, closeOpenFolder, closePopups, scrollToLeftmost, resetUI };