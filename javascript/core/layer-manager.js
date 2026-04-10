// ============================================
// layer-manager.js - إدارة ترتيب الطبقات (z-index)
// ============================================

export function sendImagesToBack() {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) return;
    const allImages = Array.from(groupContainer.querySelectorAll('image[data-src]'));
    allImages.forEach(img => {
        groupContainer.insertBefore(img, groupContainer.firstChild);
    });
    console.log(`🔽 تم نقل ${allImages.length} صورة إلى الخلف (أسفل المستطيلات)`);
}

export function bringRectsToFront() {
    const groupContainer = document.getElementById('group-specific-content');
    if (!groupContainer) return;
    const allRects = Array.from(groupContainer.querySelectorAll('rect'));
    allRects.forEach(rect => {
        groupContainer.appendChild(rect);
    });
    console.log(`🔼 تم رفع ${allRects.length} مستطيل إلى الأمام`);
}

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
        img: img,
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
        
        const isExactlyOverlapping = sectionRects.some(sr => {
            const sameX = Math.abs(sr.x - gx) < 5;
            const sameY = Math.abs(sr.y - gy) < 5;
            const sameW = Math.abs(sr.w - gw) < 5;
            const sameH = Math.abs(sr.h - gh) < 5;
            return sameX && sameY && sameW && sameH;
        });
        
        if (isExactlyOverlapping) {
            groupImg.style.visibility = 'hidden';
            groupImg.style.opacity = '0';
            groupImg.style.pointerEvents = 'none';
            console.log(`🗺️ إخفاء صورة الجروب عند (${gx}, ${gy}) - تداخل مع صورة سكشن`);
        } else {
            groupImg.style.visibility = 'visible';
            groupImg.style.opacity = '1';
            groupImg.style.pointerEvents = 'none';
        }
    });
}