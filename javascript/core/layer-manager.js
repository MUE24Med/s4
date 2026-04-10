// ============================================
// layer-manager.js - إدارة ترتيب الطبقات (بدون نقل خارج المجموعات)
// ============================================

export function hideOverlappingGroupImages() {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) return;
    
    const sectionImages = Array.from(groupContainer.querySelectorAll('image.section-image'));
    const groupImages = Array.from(groupContainer.querySelectorAll('image.group-image'));
    
    if (sectionImages.length === 0) {
        groupImages.forEach(img => {
            img.style.visibility = 'visible';
            img.style.opacity = '1';
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
            groupImg.style.visibility = 'hidden';
            groupImg.style.opacity = '0';
            groupImg.style.pointerEvents = 'none';
        } else {
            groupImg.style.visibility = 'visible';
            groupImg.style.opacity = '1';
            groupImg.style.pointerEvents = 'none';
        }
    });
}

export function bringSectionRectsToFront() {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) return;
    
    const sectionRects = Array.from(groupContainer.querySelectorAll('rect.section-specific'));
    sectionRects.forEach(rect => {
        groupContainer.appendChild(rect);
    });
    console.log(`🔼 تم رفع ${sectionRects.length} مستطيل سكشن إلى الأمام`);
}