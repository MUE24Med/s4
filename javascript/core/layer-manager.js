// ============================================
// layer-manager.js - إدارة الطبقات (مع الحفاظ على الصور للـ clip-path)
// ============================================

export function hideOverlappingGroupImages() {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) return;
    
    const sectionImages = Array.from(groupContainer.querySelectorAll('image.section-image'));
    const groupImages = Array.from(groupContainer.querySelectorAll('image.group-image'));
    
    if (sectionImages.length === 0) {
        groupImages.forEach(img => {
            img.style.opacity = '1';
            img.style.visibility = 'visible';
        });
        return;
    }
    
    const sectionRects = sectionImages.map(img => ({
        x: parseFloat(img.getAttribute('x') || 0),
        y: parseFloat(img.getAttribute('y') || 0),
        w: parseFloat(img.getAttribute('width') || 1024),
        h: parseFloat(img.getAttribute('height') || 2454)
    }));
    
    groupImages.forEach(groupImg => {
        const gx = parseFloat(groupImg.getAttribute('x') || 0);
        const gy = parseFloat(groupImg.getAttribute('y') || 0);
        const gw = parseFloat(groupImg.getAttribute('width') || 1024);
        const gh = parseFloat(groupImg.getAttribute('height') || 2454);
        
        const isOverlapping = sectionRects.some(sr => {
            return Math.abs(sr.x - gx) < 5 && Math.abs(sr.y - gy) < 5 &&
                   Math.abs(sr.w - gw) < 5 && Math.abs(sr.h - gh) < 5;
        });
        
        if (isOverlapping) {
            // ✅ لا نخفيها تماماً، فقط نجعلها شفافة حتى تظل متاحة للـ clip-path
            groupImg.style.opacity = '0';
            groupImg.style.visibility = 'visible'; // مهم!
            groupImg.style.pointerEvents = 'none';
        } else {
            groupImg.style.opacity = '1';
            groupImg.style.visibility = 'visible';
            groupImg.style.pointerEvents = 'none';
        }
    });
}

// لا نستخدم bringSectionRectsToFront أبداً (تعطيل)
export function bringSectionRectsToFront() {
    console.log("⚠️ bringSectionRectsToFront معطلة - لا داعي لنقل المستطيلات");
}