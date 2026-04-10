// ============================================
// section-name.js - إضافة اسم السكشن أعلى الشاشة (فوق Upper_wood.webp)
// ============================================

export function updateSectionName(groupLetter, sectionNum) {
    const upperLayer = document.querySelector('#upper-wood-layer');
    if (!upperLayer) return;
    
    // إزالة أي نصوص قديمة
    const allOldTexts = upperLayer.querySelectorAll('text');
    allOldTexts.forEach(text => text.remove());
    
    const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textElem.setAttribute("class", "section-name-text");
    textElem.setAttribute("x", "30");
    textElem.setAttribute("y", "80");
    textElem.setAttribute("fill", "#ffca28");
    textElem.setAttribute("font-size", "40");
    textElem.setAttribute("font-weight", "bold");
    textElem.setAttribute("font-family", "Arial, sans-serif");
    textElem.style.textShadow = "2px 2px 6px black";
    textElem.style.pointerEvents = "none";
    textElem.textContent = `Group ${groupLetter} - Section ${sectionNum}`;
    upperLayer.appendChild(textElem);
    console.log(`🏷️ تم تحديث النص: Group ${groupLetter} - Section ${sectionNum}`);
}