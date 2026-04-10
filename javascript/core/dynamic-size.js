// ============================================
// dynamic-size.js - حساب viewBox ديناميكياً
// ============================================

export function updateDynamicSizes() {
    const mainSvg = document.getElementById('main-svg');
    if (!mainSvg) return;

    const groupContainer = document.getElementById('group-specific-content');
    let maxX = 0;
    let maxY = 2454;

    const processElements = (elements) => {
        elements.forEach(el => {
            let translateX = 0, translateY = 0;
            let parent = el.parentElement;
            while (parent && parent !== mainSvg && parent !== groupContainer) {
                const transform = parent.getAttribute('transform');
                if (transform) {
                    const match = transform.match(/translate\s*\(([\d.-]+)(?:[ ,]+([\d.-]+))?\s*\)/);
                    if (match) {
                        translateX += parseFloat(match[1]) || 0;
                        translateY += parseFloat(match[2]) || 0;
                    }
                }
                parent = parent.parentElement;
            }
            let x = 0, y = 0, width = 0, height = 0;
            if (el.tagName === 'rect') {
                x = parseFloat(el.getAttribute('x')) || 0;
                y = parseFloat(el.getAttribute('y')) || 0;
                width = parseFloat(el.getAttribute('width')) || 0;
                height = parseFloat(el.getAttribute('height')) || 0;
            } else if (el.tagName === 'image') {
                x = parseFloat(el.getAttribute('x')) || 0;
                y = parseFloat(el.getAttribute('y')) || 0;
                width = parseFloat(el.getAttribute('width')) || 0;
                height = parseFloat(el.getAttribute('height')) || 0;
            } else {
                return;
            }
            const totalX = translateX + x + width;
            const totalY = translateY + y + height;
            if (totalX > maxX) maxX = totalX;
            if (totalY > maxY) maxY = totalY;
        });
    };

    const rectsInMain = mainSvg.querySelectorAll('rect');
    const imagesInMain = mainSvg.querySelectorAll('image');
    processElements(rectsInMain);
    processElements(imagesInMain);

    if (groupContainer) {
        const rectsInGroup = groupContainer.querySelectorAll('rect');
        const imagesInGroup = groupContainer.querySelectorAll('image');
        processElements(rectsInGroup);
        processElements(imagesInGroup);
    }

    maxX += 50;
    maxY += 50;
    mainSvg.setAttribute('viewBox', `0 0 ${maxX} ${maxY}`);
    console.log(`📐 viewBox الجديد: 0 0 ${maxX} ${maxY}`);
}