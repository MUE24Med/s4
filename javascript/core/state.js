// ============================================
// state.js - الحالة المشتركة للتطبيق
// ============================================

// المجموعة الحالية (A, B, C, D)
export let currentGroup = null;

// المجلد الحالي في واجهة الخشب
export let currentFolder = "";

// السكشن الحالي (رقم، أو null)
export let currentSection = null;

// شجرة الملفات من GitHub
export let globalFileTree = [];

// دوال التعديل الآمنة
export function setCurrentGroup(group) {
    currentGroup = group;
    localStorage.setItem('selectedGroup', group);
    window.dispatchEvent(new CustomEvent('groupChanged', { detail: group }));
}

export function setCurrentFolder(folder) {
    currentFolder = folder;
}

export function setCurrentSection(section) {
    currentSection = section;
    if (section) {
        localStorage.setItem('selectedSection', section);
    } else {
        localStorage.removeItem('selectedSection');
    }
}

export function setGlobalFileTree(tree) {
    globalFileTree = tree;
}