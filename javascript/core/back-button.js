/* ========================================
   back-button.js – إغلاق الفولدر وعارض PDF والتمرير
   ======================================== */

/**
 * دالة تهيئة زر الرجوع الموجود في الـ SVG
 * تقوم بإغلاق الفولدر المفتوح، إخفاء عارض PDF،
 * وتمرير الخريطة إلى أقصى اليسار (بداية الخريطة الرئيسية).
 */
export function setupBackButton() {
    const backButton = document.getElementById('back-button-group');
    if (!backButton) {
        console.warn('⚠️ زر الرجوع غير موجود في الصفحة');
        return;
    }

    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('🔙 تم الضغط على زر الرجوع');

        // 1️⃣ إغلاق عارض PDF إذا كان مفتوحاً
        const pdfOverlay = document.getElementById('pdf-overlay');
        if (pdfOverlay && !pdfOverlay.classList.contains('hidden')) {
            pdfOverlay.classList.add('hidden');
            console.log('📄 تم إغلاق عارض PDF');
        }

        // 2️⃣ إغلاق الفولدر المفتوح (مسح محتوى المجموعة)
        const groupContent = document.getElementById('group-specific-content');
        if (groupContent) {
            // إزالة كل العناصر المضافة (الملفات داخل الفولدر)
            groupContent.innerHTML = '';
            console.log('📁 تم إغلاق الفولدر وإزالة محتواه');
        }

        // 3️⃣ إعادة تعيين أي حالة تشير إلى وجود فولدر مفتوح
        //    (إذا كان هناك متغير عام أو دالة في state.js)
        if (window.__folderOpenState) {
            window.__folderOpenState = false;
        }
        // يمكنك أيضاً استدعاء دالة من ملف آخر إذا كانت موجودة
        // مثلاً: import { closeFolder } from './state.js';

        // 4️⃣ التمرير إلى أقصى اليسار (بداية الخريطة)
        const scrollContainer = document.getElementById('scroll-container');
        if (scrollContainer) {
            // التمرير السلس إلى أقصى اليسار
            scrollContainer.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
            console.log('⬅️ تم التمرير إلى أقصى اليسار');
        }

        // 5️⃣ اختياري: إعادة تعيين البحث أو الإضاءات
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = ''; // تفريغ حقل البحث
        }

        // إزالة أي كلاسات تفاعلية من العناصر
        document.querySelectorAll('.wood-folder-group.active-folder').forEach(el => {
            el.classList.remove('active-folder');
        });

        // 6️⃣ تحديث رسالة الترحيب إذا أردت
        if (window.updateWelcomeMessages) {
            window.updateWelcomeMessages();
        }
    });

    console.log('✅ تم تفعيل زر الرجوع');
}