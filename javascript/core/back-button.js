/* ========================================
   back-button.js – زر الرجوع الموحد
   ========================================
   يقوم هذا الملف بتهيئة زر الرجوع الموجود في SVG
   ليؤدي الوظائف التالية عند النقر:
   1. إغلاق عارض PDF إذا كان مفتوحاً
   2. إغلاق الفولدر المفتوح (مسح محتوى المجموعة)
   3. التمرير إلى أقصى اليسار (الخريطة الرئيسية)
   4. (اختياري) التمرير إلى أقصى اليمين بناءً على السياق
   5. إعادة تعيين حالة البحث والتفاعلات
   ======================================== */

/**
 * تهيئة زر الرجوع وإضافة مستمع الحدث
 */
export function setupBackButton() {
    const backButton = document.getElementById('back-button-group');
    if (!backButton) {
        console.warn('⚠️ زر الرجوع (back-button-group) غير موجود في الصفحة');
        return;
    }

    // إزالة أي مستمع سابق (تجنب التكرار)
    backButton.removeEventListener('click', handleBackClick);
    backButton.addEventListener('click', handleBackClick);

    console.log('✅ تم تفعيل زر الرجوع');
}

/**
 * معالج النقر على زر الرجوع
 * @param {Event} e 
 */
function handleBackClick(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔙 تم الضغط على زر الرجوع');

    // 1️⃣ إغلاق عارض PDF
    closePDFViewer();

    // 2️⃣ إغلاق الفولدر المفتوح
    closeOpenFolder();

    // 3️⃣ التمرير إلى أقصى اليسار (الخريطة الرئيسية)
    scrollToLeftmost();

    // 4️⃣ إعادة تعيين واجهة البحث والإضاءات
    resetUI();

    // 5️⃣ تحديث رسائل الترحيب (اختياري)
    if (typeof window.updateWelcomeMessages === 'function') {
        window.updateWelcomeMessages();
    }

    // 6️⃣ تحديث حالة الفولدر (إذا كانت متغيرة عامة)
    if (window.__folderOpenState !== undefined) {
        window.__folderOpenState = false;
    }
}

/**
 * إغلاق عارض PDF إذا كان مفتوحاً
 */
function closePDFViewer() {
    const pdfOverlay = document.getElementById('pdf-overlay');
    if (pdfOverlay && !pdfOverlay.classList.contains('hidden')) {
        pdfOverlay.classList.add('hidden');
        console.log('📄 تم إغلاق عارض PDF');

        // إلغاء تحميل PDF من الإطار (اختياري)
        const pdfFrame = document.getElementById('pdfFrame');
        if (pdfFrame) {
            pdfFrame.src = ''; // تفريغ المصدر لتوفير الذاكرة
        }
    }
}

/**
 * إغلاق الفولدر المفتوح وإزالة محتوى المجموعة
 */
function closeOpenFolder() {
    // العنصر الذي يحتوي على ملفات المجموعة داخل الفولدر
    const groupContent = document.getElementById('group-specific-content');
    if (groupContent) {
        groupContent.innerHTML = ''; // إزالة كل الملفات المعروضة
        console.log('📁 تم إغلاق الفولدر وإزالة محتواه');
    }

    // إزالة أي كلاسات تشير إلى فولدر نشط
    document.querySelectorAll('.wood-folder-group.active-folder').forEach(el => {
        el.classList.remove('active-folder');
    });

    // إذا كان هناك أي مؤشرات أخرى للفولدر المفتوح (مثل متغير في localStorage)
    localStorage.removeItem('current_open_folder'); // مثال
}

/**
 * التمرير إلى أقصى يسار الخريطة (الخريطة الرئيسية)
 */
function scrollToLeftmost() {
    const scrollContainer = document.getElementById('scroll-container');
    if (!scrollContainer) return;

    // التمرير السلس إلى أقصى اليسار (بداية SVG)
    scrollContainer.scrollTo({
        left: 0,
        behavior: 'smooth'
    });
    console.log('⬅️ تم التمرير إلى أقصى اليسار');
}

/**
 * التمرير إلى أقصى يمين الخريطة (إذا أردت إضافة هذه الوظيفة)
 * يمكن استدعاؤها بدلاً من scrollToLeftmost إذا كان السياق يتطلب ذلك
 */
function scrollToRightmost() {
    const scrollContainer = document.getElementById('scroll-container');
    if (!scrollContainer) return;

    // أقصى يمين = إجمالي العرض - عرض الحاوية المرئي
    const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    scrollContainer.scrollTo({
        left: maxScrollLeft,
        behavior: 'smooth'
    });
    console.log('➡️ تم التمرير إلى أقصى اليمين');
}

/**
 * إعادة تعيين عناصر الواجهة المرتبطة بالتفاعل
 */
function resetUI() {
    // تفريغ حقل البحث
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }

    // إغلاق أي نافذة منبثقة للمعاينة (إذا كانت مفتوحة)
    const previewPopup = document.getElementById('pdf-preview-popup');
    if (previewPopup && previewPopup.classList.contains('active')) {
        previewPopup.classList.remove('active');
    }

    // إخفاء قائمة اختيار طريقة الفتح
    const openMethodPopup = document.getElementById('open-method-popup');
    if (openMethodPopup && openMethodPopup.classList.contains('active')) {
        openMethodPopup.classList.remove('active');
    }

    // إزالة أي تأثيرات تحديد على العناصر
    document.querySelectorAll('.m.selected, rect.selected').forEach(el => {
        el.classList.remove('selected');
    });

    console.log('🧹 تم إعادة تعيين واجهة المستخدم');
}

// ========================================
// تصدير الدوال الإضافية إذا احتاجها مكان آخر
// ========================================
export {
    closePDFViewer,
    closeOpenFolder,
    scrollToLeftmost,
    scrollToRightmost,
    resetUI
};