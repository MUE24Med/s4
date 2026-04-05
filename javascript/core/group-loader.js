// ============================================
// group-preloader.js - التحميل الثاني بعد اختيار الجروب
// يحمل: SVG الجروب + صورته فقط + يشغّل المصابيح
// ============================================

// ─────────────────────────────────────────
// إضاءة مصابيح loading-overlay
// bulb-1 + bulb-2 = SVG (50%)
// bulb-3 + bulb-4 = الصورة (100%)
// ─────────────────────────────────────────
function setGroupBulbs(percentage) {
    const thresholds = [
        { id: 'bulb-1', at: 25 },
        { id: 'bulb-2', at: 50 },
        { id: 'bulb-3', at: 75 },
        { id: 'bulb-4', at: 100 },
    ];
    thresholds.forEach(({ id, at }) => {
        const bulb = document.getElementById(id);
        if (!bulb) return;
        if (percentage >= at) {
            bulb.classList.add('on');
            bulb.style.opacity = '';
        } else {
            const prev = at - 25;
            const ratio = Math.max(0, (percentage - prev) / 25);
            if (ratio > 0) {
                bulb.style.opacity = String(0.2 + ratio * 0.8);
                bulb.classList.add('on');
            } else {
                bulb.classList.remove('on');
                bulb.style.opacity = '';
            }
        }
    });
}

// ─────────────────────────────────────────
// تحميل ملف مع الكاش + callback للنسبة
// ─────────────────────────────────────────
async function fetchAndCache(url, cacheName, onProgress) {
    try {
        const cache = await caches.open(cacheName);
        const cached = await cache.match(url);
        if (cached) {
            console.log(`✅ كاش الجروب: ${url}`);
            onProgress?.();
            return cached;
        }
        console.log(`🌐 تحميل الجروب: ${url}`);
        const response = await fetch(url);
        if (response.ok) {
            await cache.put(url, response.clone());
            console.log(`💾 حفظ الجروب: ${url}`);
        }
        onProgress?.();
        return response;
    } catch (err) {
        console.warn(`⚠️ فشل تحميل: ${url}`, err);
        onProgress?.();
        return null;
    }
}

// ─────────────────────────────────────────
// الدالة الرئيسية: تحميل أصول الجروب
//
// @param {string} group   - حرف الجروب: A | B | C | D
// @param {Object} urls    - { svg, image } - مسارات الملفين
// @param {string} cacheName
// @returns {Promise<{ svgText: string|null, imageUrl: string|null }>}
// ─────────────────────────────────────────
export async function preloadGroupAssets(group, urls, cacheName = 'semester-cache-v1') {
    // ── قراءة اسم الكاش من config لو مش متمرر ──
    if (!cacheName || cacheName === 'semester-cache-v1') {
        try {
            const { CACHE_NAME } = await import('../core/config.js');
            if (CACHE_NAME) cacheName = CACHE_NAME;
        } catch (_) {}
    }

    const svgUrl   = urls?.svg;
    const imageUrl = urls?.image;

    // ── ابدأ المصابيح من صفر ──
    setGroupBulbs(0);

    let loaded = 0;
    const total = [svgUrl, imageUrl].filter(Boolean).length;

    function onItemDone() {
        loaded++;
        const pct = Math.round((loaded / total) * 100);
        setGroupBulbs(pct);
    }

    // ── تحميل SVG ──
    let svgText = null;
    if (svgUrl) {
        const res = await fetchAndCache(svgUrl, cacheName, onItemDone);
        if (res) {
            try { svgText = await res.clone().text(); } catch (_) {}
        }
    }

    // ── تحميل صورة الجروب ──
    let finalImageUrl = null;
    if (imageUrl) {
        await fetchAndCache(imageUrl, cacheName, onItemDone);
        finalImageUrl = imageUrl;
    }

    // ── تأكد إن المصابيح 100% ──
    setGroupBulbs(100);

    return { svgText, imageUrl: finalImageUrl };
}

// ─────────────────────────────────────────
// مساعد: إنشاء مسارات الجروب الافتراضية
// عدّل الـ pattern حسب مشروعك
// ─────────────────────────────────────────
export function getGroupUrls(group) {
    return {
        svg:   `./svg/group-${group}.svg`,
        image: `./image/group-${group}.webp`,
    };
}
