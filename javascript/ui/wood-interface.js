// ============================================
// wood-interface.js - واجهة عرض الملفات والمجلدات
// مع إضافة زر تبديل الاتجاه (Portrait/Landscape) في أعلى اليمين
// ============================================

import { RAW_CONTENT_BASE, NAV_STATE, SUBJECT_FOLDERS, REPO_NAME } from '../core/config.js';
import { normalizeArabic, autoTranslate, getDisplayName, resetBrowserZoom } from '../core/utils.js';
import { pushNavigationState, goToWood, getCurrentNavigationState, navigationHistory } from '../core/navigation.js';
import { smartOpen } from './pdf-viewer.js';
import { globalFileTree, currentGroup, currentFolder, setCurrentFolder, currentSection } from '../core/state.js';
import { updateDynamicSizes, fetchGlobalTree, updateWoodLogo } from '../core/group-loader.js';
import { addScrollSystem } from './scroll-system.js';
import {
    setupGroupChangeButton,
    setupGroupSelectionButtons,
    setupPreloadButton,
    setupResetButton,
    setupMoveToggleButton,
    setupSearchIcon,
    setupBackButtonInSVG,
    setupInteractionToggle,
    setupInstallButton
} from './ui-controls.js';
import { setupSearchInput, setupEyeToggleSystem } from './search-and-eye.js';

// ---------- متغير التفاعل ----------
export let interactionEnabled = true;

export function setInteractionEnabled(value) {
    interactionEnabled = value;
    console.log('🔄 Hover:', value ? 'مفعّل ✅' : 'معطّل ❌');
}

// ============================================
// دوال تبديل الاتجاه (Portrait / Landscape)
// ============================================

let currentOrientation = 'portrait'; // portrait or landscape

async function toggleScreenOrientation() {
    if (!screen.orientation || typeof screen.orientation.lock !== 'function') {
        alert('❌ متصفحك لا يدعم تغيير اتجاه الشاشة تلقائياً.\nيمكنك تغيير الاتجاه يدوياً من إعدادات النظام.');
        return;
    }

    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && !location.hostname.startsWith('127.0.0.1')) {
        alert('❌ تغيير الاتجاه يعمل فقط عبر HTTPS.\nالموقع الحالي غير آمن لهذه الميزة.');
        return;
    }

    try {
        const newOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
        await screen.orientation.lock(newOrientation);
        currentOrientation = newOrientation;
        console.log(`✅ تم تغيير الاتجاه إلى ${newOrientation === 'landscape' ? 'أفقي' : 'طولي'}`);
        
        // تحديث نص الزر
        const orientationBtn = document.getElementById('orientation-toggle-svg-btn');
        if (orientationBtn) {
            const textElem = orientationBtn.querySelector('text');
            if (textElem) {
                textElem.textContent = currentOrientation === 'portrait' ? '🔄 أفقي' : '🔄 طولي';
            }
        }
        
        showTemporaryOrientationMsg(`✅ تم التبديل إلى الوضع ${newOrientation === 'landscape' ? 'الأفقي' : 'الطولي'}`, '#2ecc71');
    } catch (error) {
        console.error('❌ فشل تغيير الاتجاه:', error);
        let errorMsg = 'لا يمكن تغيير الاتجاه حالياً.';
        if (error.name === 'NotAllowedError') {
            errorMsg = 'يجب أن تكون هناك نقرة مستخدم مباشرة لتشغيل هذه الميزة.';
        } else if (error.name === 'SecurityError') {
            errorMsg = 'الميزة غير متاحة على هذا الجهاز أو المتصفح.';
        }
        alert(`❌ ${errorMsg}`);
        showTemporaryOrientationMsg(`❌ ${errorMsg}`, '#e74c3c');
    }
}

function showTemporaryOrientationMsg(message, color) {
    let msgDiv = document.getElementById('orientation-temp-msg');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'orientation-temp-msg';
        msgDiv.style.position = 'fixed';
        msgDiv.style.bottom = '80px';
        msgDiv.style.left = '50%';
        msgDiv.style.transform = 'translateX(-50%)';
        msgDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        msgDiv.style.color = '#fff';
        msgDiv.style.padding = '8px 16px';
        msgDiv.style.borderRadius = '20px';
        msgDiv.style.fontSize = '14px';
        msgDiv.style.zIndex = '10000';
        msgDiv.style.backdropFilter = 'blur(5px)';
        msgDiv.style.border = `1px solid ${color}`;
        msgDiv.style.direction = 'rtl';
        document.body.appendChild(msgDiv);
    }
    msgDiv.textContent = message;
    msgDiv.style.borderColor = color;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 2000);
}

function createOrientationToggleButtonInUpperLayer() {
    // تجنب التكرار
    if (document.getElementById('orientation-toggle-svg-btn')) return;

    const upperLayer = document.querySelector('#upper-wood-layer');
    if (!upperLayer) {
        console.warn('⚠️ upper-wood-layer غير موجود');
        return;
    }

    // مجموعة الزر
    const btnGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    btnGroup.setAttribute('id', 'orientation-toggle-svg-btn');
    btnGroup.setAttribute('style', 'cursor: pointer;');
    
    // خلفية الزر (مستطيل)
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '820');      // يمين الشاشة تقريباً (عرض SVG 1024)
    rect.setAttribute('y', '20');       // أعلى الصفحة
    rect.setAttribute('width', '140');
    rect.setAttribute('height', '40');
    rect.setAttribute('rx', '20');
    rect.setAttribute('fill', '#000000cc'); // شفاف قليلاً
    rect.setAttribute('stroke', '#ffcc00');
    rect.setAttribute('stroke-width', '2');
    
    // النص
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '890');
    text.setAttribute('y', '45');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-size', '18px');
    text.setAttribute('font-family', 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif');
    text.textContent = '🔄 أفقي';
    
    btnGroup.appendChild(rect);
    btnGroup.appendChild(text);
    
    // إضافة مستمع الحدث
    btnGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleScreenOrientation();
    });
    
    upperLayer.appendChild(btnGroup);
    console.log('✅ زر تبديل الاتجاه مضاف إلى upper-wood-layer (اليمين العلوي)');
}

// ---------- تحديث واجهة الخشب ----------
export async function updateWoodInterface() {
    const dynamicGroup = document.getElementById('dynamic-links-group');
    const backBtnText = document.getElementById('back-btn-text');
    const groupBtnText = document.getElementById('group-btn-text');
    const mainSvg = document.getElementById('main-svg');
    const searchInput = document.getElementById('search-input');

    if (!dynamicGroup || !backBtnText) return;

    // تنظيف العناصر السابقة
    dynamicGroup.querySelectorAll('.wood-folder-group, .wood-file-group, .scroll-container-group, .subject-separator-group, .scroll-bar-group, .window-frame')
        .forEach(el => el.remove());

    // ===== إضافة اسم المجموعة / السكشن في upper-wood-layer =====
    const upperLayer = document.querySelector('#upper-wood-layer');
    if (upperLayer) {
        // إزالة أي نص قديم خاص بالمجموعة (نترك النص المدمج إن وجد)
        const oldGroupText = upperLayer.querySelector('.group-name-text');
        if (oldGroupText) oldGroupText.remove();
        
        // إضافة اسم المجموعة أو السكشن
        let displayText = '';
        if (currentSection && currentGroup) {
            displayText = `Group ${currentGroup} - Section ${currentSection}`;
        } else if (currentGroup && !currentSection) {
            displayText = `Group ${currentGroup}`;
        }
        
        if (displayText) {
            const groupText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            groupText.setAttribute("class", "group-name-text");
            groupText.setAttribute("x", "30");
            groupText.setAttribute("y", "45");
            groupText.setAttribute("fill", "#ffca28");
            groupText.setAttribute("font-size", "26");
            groupText.setAttribute("font-weight", "bold");
            groupText.setAttribute("font-family", "Arial, sans-serif");
            groupText.style.textShadow = "2px 2px 6px black";
            groupText.style.pointerEvents = "none";
            groupText.textContent = displayText;
            upperLayer.appendChild(groupText);
            console.log(`🏷️ تم إضافة اسم المجموعة/السكشن: ${displayText}`);
        }
    }

    await fetchGlobalTree();

    const query = normalizeArabic(searchInput ? searchInput.value : '');

    // تحديث نص زر الرجوع
    if (currentFolder === "") {
        backBtnText.textContent = "➡️ إلى الخريطة ➡️";
        const currentState = getCurrentNavigationState();
        if (!currentState || currentState.state !== NAV_STATE.WOOD_VIEW) {
            navigationHistory.length = 0;
            pushNavigationState(NAV_STATE.WOOD_VIEW, { folder: "" });
        }
    } else {
        const folderName = currentFolder.split('/').pop();
        const countInCurrent = globalFileTree.filter(f => {
            const isInside = f.path.startsWith(currentFolder + '/');
            const isPdf = f.path.toLowerCase().endsWith('.pdf');
            if (query === "") return isInside && isPdf;
            const fileName = f.path.split('/').pop().toLowerCase();
            const arabicName = autoTranslate(fileName);
            return isInside && isPdf && (
                normalizeArabic(fileName).includes(query) ||
                normalizeArabic(arabicName).includes(query)
            );
        }).length;

        const pathParts = currentFolder.split('/');
        const breadcrumb = "الرئيسية > " + pathParts.join(' > ');
        const displayLabel = ` (${countInCurrent}) ملف`;

        backBtnText.textContent = breadcrumb.length > 30 ?
            `🔙 ... > ${folderName} ${displayLabel}` :
            `🔙 ${breadcrumb} ${displayLabel}`;
    }

    // تحديث نص زر تغيير الجروب
    if (groupBtnText && currentGroup) {
        groupBtnText.textContent = `Change Group 🔄 ${currentGroup}`;
    }

    const folderPrefix = currentFolder ? currentFolder + '/' : '';
    const itemsMap = new Map();

    globalFileTree.forEach(item => {
        if (item.path.startsWith(folderPrefix)) {
            const relativePath = item.path.substring(folderPrefix.length);
            const pathParts = relativePath.split('/');
            const name = pathParts[0];

            if (!itemsMap.has(name)) {
                const isDir = pathParts.length > 1 || item.type === 'tree';
                const isPdf = item.path.toLowerCase().endsWith('.pdf');

                const lowerName = name.toLowerCase();
                let isSubjectItem = false;
                let mainSubject = null;

                for (const subject of SUBJECT_FOLDERS) {
                    if (lowerName.startsWith(subject) ||
                        lowerName.includes(`-${subject}`) ||
                        lowerName.startsWith(subject + '-')) {
                        isSubjectItem = true;
                        mainSubject = subject;
                        break;
                    }
                }

                if (isDir && name !== 'image' && name !== 'groups' && name !== 'javascript') {
                    itemsMap.set(name, {
                        name: name,
                        type: 'dir',
                        path: folderPrefix + name,
                        isSubject: isSubjectItem,
                        subject: mainSubject
                    });
                } else if (isPdf && pathParts.length === 1) {
                    itemsMap.set(name, {
                        name: name,
                        type: 'file',
                        path: item.path,
                        isSubject: isSubjectItem,
                        subject: mainSubject
                    });
                }
            }
        }
    });

    let filteredData = Array.from(itemsMap.values());

    // ترتيب العناصر
    filteredData.sort((a, b) => {
        if (a.isSubject && !b.isSubject) return -1;
        if (!a.isSubject && b.isSubject) return 1;

        if (a.isSubject && b.isSubject) {
            const aSubjectIndex = SUBJECT_FOLDERS.indexOf(a.subject);
            const bSubjectIndex = SUBJECT_FOLDERS.indexOf(b.subject);
            if (aSubjectIndex !== bSubjectIndex) {
                return aSubjectIndex - bSubjectIndex;
            }
        }

        if (a.type !== b.type) {
            return a.type === 'dir' ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
    });

    // إنشاء مجموعة التمرير
    const scrollContainerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    scrollContainerGroup.setAttribute("class", "scroll-container-group");

    // إعداد الـ ClipPath
    const oldClips = mainSvg.querySelectorAll('clipPath[id^="window-clip"]');
    oldClips.forEach(clip => clip.remove());

    const clipPathId = "window-clip-" + Date.now();
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", clipPathId);

    const clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    clipRect.setAttribute("x", "120");
    clipRect.setAttribute("y", "250");
    clipRect.setAttribute("width", "780");
    clipRect.setAttribute("height", "1700");
    clipRect.setAttribute("rx", "15");

    clipPath.appendChild(clipRect);
    mainSvg.querySelector('defs').appendChild(clipPath);

    const scrollContent = document.createElementNS("http://www.w3.org/2000/svg", "g");
    scrollContent.setAttribute("class", "scrollable-content");
    scrollContent.setAttribute("clip-path", `url(#${clipPathId})`);

    const BOTTOM_PADDING = 100;

    const separatorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    separatorGroup.setAttribute("class", "subject-separator-group");
    separatorGroup.setAttribute("clip-path", `url(#${clipPathId})`);

    let yPosition = 250;
    let fileRowCounter = 0;
    let itemsAdded = 0;

    // تجميع العناصر حسب المادة
    const itemsBySubject = {};
    filteredData.forEach(item => {
        const subjectKey = item.isSubject ? item.subject : 'other';
        if (!itemsBySubject[subjectKey]) {
            itemsBySubject[subjectKey] = [];
        }
        itemsBySubject[subjectKey].push(item);
    });

    let subjectIndex = 0;
    const subjectKeys = Object.keys(itemsBySubject);

    for (const subjectKey of subjectKeys) {
        const subjectItems = itemsBySubject[subjectKey];
        const isSubjectSection = subjectKey !== 'other';

        if (subjectIndex > 0 && itemsAdded > 0) {
            yPosition += 20;
            const separatorLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            separatorLine.setAttribute("x1", "120");
            separatorLine.setAttribute("y1", yPosition);
            separatorLine.setAttribute("x2", "900");
            separatorLine.setAttribute("y2", yPosition);
            separatorLine.setAttribute("stroke", "#ffcc00");
            separatorLine.setAttribute("stroke-width", "4");
            separatorLine.setAttribute("stroke-dasharray", "15,8");
            separatorLine.setAttribute("opacity", "0.9");
            separatorLine.setAttribute("stroke-linecap", "round");
            separatorGroup.appendChild(separatorLine);
            yPosition += 40;
            fileRowCounter = 0;
        }

        for (let i = 0; i < subjectItems.length; i++) {
            const item = subjectItems[i];

            if (item.type === 'dir' && fileRowCounter > 0) {
                if (fileRowCounter % 2 === 1) {
                    yPosition += 90;
                }
                fileRowCounter = 0;
            }

            let x, width;
            if (item.type === 'dir') {
                x = 120;
                width = 780;
            } else {
                const isLeftColumn = fileRowCounter % 2 === 0;
                x = isLeftColumn ? 120 : 550;
                width = 350;
            }

            const y = yPosition;

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("class", item.type === 'dir' ? "wood-folder-group" : "wood-file-group");
            g.style.cursor = "pointer";

            const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            r.setAttribute("x", x);
            r.setAttribute("y", y);
            r.setAttribute("width", width);
            r.setAttribute("height", "70");
            r.setAttribute("rx", "12");
            r.setAttribute("class", "list-item");

            if (item.type === 'dir') {
                r.style.fill = isSubjectSection ? "#8d6e63" : "#5d4037";
                r.style.stroke = isSubjectSection ? "#ffcc00" : "#fff";
                r.style.strokeWidth = isSubjectSection ? "3" : "2";
            } else {
                r.style.fill = "rgba(0,0,0,0.85)";
                r.style.stroke = "#fff";
                r.style.strokeWidth = "2";
            }

            const cleanName = item.name.replace(/\.[^/.]+$/, "");

            const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
            t.setAttribute("x", x + (width / 2));
            t.setAttribute("y", y + 42);
            t.setAttribute("text-anchor", "middle");
            t.setAttribute("fill", "white");
            t.style.fontWeight = "bold";
            t.style.fontSize = item.type === 'dir' ? "20px" : "18px";
            t.style.fontFamily = "Arial, sans-serif";
            t.style.pointerEvents = "none";

            let shouldDisplay = true;

            if (item.type === 'dir') {
                const filteredCount = globalFileTree.filter(f => {
                    const isInsideFolder = f.path.startsWith(item.path + '/');
                    const isPdf = f.path.toLowerCase().endsWith('.pdf');
                    if (query === "") return isInsideFolder && isPdf;

                    const fileName = f.path.split('/').pop().toLowerCase();
                    const fileArabic = autoTranslate(fileName);

                    return isInsideFolder && isPdf && (
                        normalizeArabic(fileName).includes(query) ||
                        normalizeArabic(fileArabic).includes(query)
                    );
                }).length;

                const maxLength = width === 780 ? 45 : 25;
                const displayName = cleanName.length > maxLength ?
                    cleanName.substring(0, maxLength - 3) + "..." : cleanName;
                t.textContent = `📁 (${filteredCount}) ${displayName}`;

                if (query !== "" && filteredCount === 0) {
                    shouldDisplay = false;
                }
            } else {
                const displayName = cleanName.length > 25 ? cleanName.substring(0, 22) + "..." : cleanName;
                t.textContent = "📄 " + displayName;

                const arabicName = autoTranslate(cleanName);
                if (query !== "" &&
                    !normalizeArabic(cleanName).includes(query) &&
                    !normalizeArabic(arabicName).includes(query)) {
                    shouldDisplay = false;
                }
            }

            if (shouldDisplay) {
                g.appendChild(r);
                g.appendChild(t);

                // نظام الضغط المطول للمعاينة
                let longPressTimer = null;
                let longPressTriggered = false;
                let touchStartTime = 0;

                g.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                    longPressTriggered = false;
                    longPressTimer = setTimeout(() => {
                        longPressTriggered = true;
                        if (item.type === 'file') {
                            if (navigator.vibrate) navigator.vibrate(50);
                            import('./pdf-viewer.js').then(({ showPDFPreview }) => {
                                showPDFPreview(item);
                            });
                        }
                    }, 500);
                }, { passive: true });

                g.addEventListener('touchend', (e) => {
                    clearTimeout(longPressTimer);
                    const touchDuration = Date.now() - touchStartTime;
                    if (!longPressTriggered && touchDuration < 500) {
                        e.stopPropagation();
                        e.preventDefault();
                        resetBrowserZoom();
                        if (item.type === 'dir') {
                            setCurrentFolder(item.path);
                            updateWoodInterface();
                        } else {
                            smartOpen(item);
                        }
                    }
                });

                g.addEventListener('touchmove', (e) => {
                    clearTimeout(longPressTimer);
                }, { passive: true });

                g.addEventListener('click', (e) => {
                    e.stopPropagation();
                    resetBrowserZoom();
                    if (item.type === 'dir') {
                        setCurrentFolder(item.path);
                        updateWoodInterface();
                    } else {
                        smartOpen(item);
                    }
                });

                scrollContent.appendChild(g);
                itemsAdded++;
            }

            if (item.type === 'dir') {
                yPosition += 90;
                fileRowCounter = 0;
            } else {
                fileRowCounter++;
                if (fileRowCounter % 2 === 0) {
                    yPosition += 90;
                }
            }
        }

        subjectIndex++;
        if (fileRowCounter % 2 === 1) {
            yPosition += 90;
            fileRowCounter = 0;
        }
    }

    yPosition += BOTTOM_PADDING;
    const totalContentHeight = yPosition - 250;
    const needsScroll = totalContentHeight > 1700;

    if (needsScroll) {
        const woodBanner = dynamicGroup.querySelector('.wood-banner-animation');
        const nameInputGroup = dynamicGroup.querySelector('.name-input-group');
        if (woodBanner) woodBanner.style.display = 'none';
        if (nameInputGroup) nameInputGroup.style.display = 'none';
    } else {
        renderNameInput();
        if (currentFolder === "" && currentGroup) {
            updateWoodLogo(currentGroup);
        }
    }

    scrollContainerGroup.appendChild(separatorGroup);
    scrollContainerGroup.appendChild(scrollContent);

    const maxScroll = Math.max(0, totalContentHeight - 1700);
    addScrollSystem(scrollContainerGroup, scrollContent, separatorGroup, maxScroll, totalContentHeight);

    dynamicGroup.appendChild(scrollContainerGroup);

    // ✅ بعد كل تحديث، نضمن إن زر التثبيت لسه آخر عنصر في main-svg
    const installBtn = document.getElementById('install-svg-btn');
    const mainSvgEl = document.getElementById('main-svg');
    if (installBtn && mainSvgEl && mainSvgEl.lastElementChild !== installBtn) {
        mainSvgEl.appendChild(installBtn);
    }
}

// ---------- إدخال اسم المستخدم ----------
export function renderNameInput() {
    const dynamicGroup = document.getElementById('dynamic-links-group');
    if (!dynamicGroup) return;

    const oldInput = dynamicGroup.querySelector('.name-input-group');
    if (oldInput) oldInput.remove();

    const inputGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    inputGroup.setAttribute("class", "name-input-group");

    const containerWidth = 1024;
    const inputWidth = 780;
    const centerX = (containerWidth - inputWidth) / 2;
    const inputY = 1980;

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", centerX);
    bg.setAttribute("y", inputY);
    bg.setAttribute("width", inputWidth);
    bg.setAttribute("height", "60");
    bg.setAttribute("rx", "10");
    bg.style.fill = "rgba(0,0,0,0.7)";
    bg.style.stroke = "#ffca28";
    bg.style.strokeWidth = "2";

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", containerWidth / 2);
    label.setAttribute("y", inputY + 30);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "white");
    label.style.fontSize = "18px";
    label.style.fontWeight = "bold";

    const currentName = localStorage.getItem('user_real_name');
    label.textContent = currentName ? `مرحباً ${currentName} - اضغط للتعديل` : "اضغط هنا لإدخال اسمك";

    inputGroup.appendChild(bg);
    inputGroup.appendChild(label);
    inputGroup.style.cursor = "pointer";

    inputGroup.onclick = () => {
        const currentName = localStorage.getItem('user_real_name');
        const promptMessage = currentName ?
            `الاسم الحالي: ${currentName}\nأدخل اسم جديد أو اترك فارغاً للإلغاء:` :
            "ما اسمك؟";
        const name = prompt(promptMessage, currentName || "");
        if (name !== null && name.trim()) {
            localStorage.setItem('user_real_name', name.trim());
            if (typeof trackNameChange === 'function') {
                trackNameChange(name.trim());
            }
            updateWelcomeMessages();
            updateWoodInterface();
            alert("أهلاً بك يا " + name.trim());
        }
    };

    dynamicGroup.appendChild(inputGroup);
}

// ---------- تحديث رسائل الترحيب ----------
export function updateWelcomeMessages() {
    const displayName = getDisplayName();
    const groupScreenH1 = document.querySelector('#group-selection-screen h1');
    if (groupScreenH1) {
        groupScreenH1.innerHTML = `مرحباً بك يا <span style="color: #ffca28;">${displayName}</span> إختر جروبك`;
    }
    const loadingH1 = document.querySelector('#loading-content h1');
    if (loadingH1 && currentGroup) {
        loadingH1.innerHTML = `أهلاً بك يا <span style="color: #ffca28;">${displayName}</span><br>في ${REPO_NAME.toUpperCase()}`;
    }
}

// ---------- منع التفاعل مع العناصر المخفية ----------
export function preventInteractionWhenHidden() {
    const toggleContainer = document.getElementById('js-toggle-container');
    const searchContainer = document.getElementById('search-container');

    if (!toggleContainer || !searchContainer) {
        console.warn('⚠️ لم يتم العثور على الحاويات، إعادة المحاولة...');
        setTimeout(preventInteractionWhenHidden, 500);
        return;
    }

    const blockAllEvents = (e) => {
        e.stopPropagation();
        e.preventDefault();
        return false;
    };

    const eventsToBlock = [
        'click', 'touchstart', 'touchend', 'mousedown', 'mouseup',
        'pointerdown', 'pointerup', 'mouseover', 'mouseout',
        'touchmove', 'contextmenu'
    ];

    const toggleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' || mutation.attributeName === 'style') {
                const isHidden = toggleContainer.classList.contains('hidden') ||
                    toggleContainer.classList.contains('fully-hidden') ||
                    toggleContainer.style.display === 'none';

                if (isHidden) {
                    toggleContainer.style.pointerEvents = 'none';
                    toggleContainer.style.visibility = 'hidden';
                    eventsToBlock.forEach(eventType => {
                        toggleContainer.addEventListener(eventType, blockAllEvents, true);
                    });
                } else {
                    toggleContainer.style.pointerEvents = '';
                    toggleContainer.style.visibility = '';
                    eventsToBlock.forEach(eventType => {
                        toggleContainer.removeEventListener(eventType, blockAllEvents, true);
                    });
                }
            }
        });
    });

    const searchObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' || mutation.attributeName === 'style') {
                const isHidden = searchContainer.classList.contains('hidden') ||
                    searchContainer.style.display === 'none';

                if (isHidden) {
                    searchContainer.style.pointerEvents = 'none';
                    searchContainer.style.visibility = 'hidden';
                    eventsToBlock.forEach(eventType => {
                        searchContainer.addEventListener(eventType, blockAllEvents, true);
                    });
                } else {
                    searchContainer.style.pointerEvents = '';
                    searchContainer.style.visibility = '';
                    eventsToBlock.forEach(eventType => {
                        searchContainer.removeEventListener(eventType, blockAllEvents, true);
                    });
                }
            }
        });
    });

    toggleObserver.observe(toggleContainer, {
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    searchObserver.observe(searchContainer, {
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    if (toggleContainer.classList.contains('hidden') ||
        toggleContainer.classList.contains('fully-hidden') ||
        toggleContainer.style.display === 'none') {
        toggleContainer.style.pointerEvents = 'none';
        toggleContainer.style.visibility = 'hidden';
    }

    if (searchContainer.classList.contains('hidden') ||
        searchContainer.style.display === 'none') {
        searchContainer.style.pointerEvents = 'none';
        searchContainer.style.visibility = 'hidden';
    }

    console.log('✅ إصلاح زر العين 👁️ نشط');
}

// ---------- تهيئة واجهة الخشب وربط الأحداث ----------
export function initWoodUI() {
    setupGroupChangeButton();
    setupGroupSelectionButtons();
    setupPreloadButton();
    setupResetButton();
    setupMoveToggleButton();
    setupSearchIcon();
    setupBackButtonInSVG(() => currentFolder, setCurrentFolder, updateWoodInterface);
    setupInteractionToggle();
    setupSearchInput(updateWoodInterface);
    setupEyeToggleSystem();
    setupInstallButton();

    // ✅ إضافة زر تبديل الاتجاه في أعلى اليمين (مقابل اسم السكشن)
    createOrientationToggleButtonInUpperLayer();
}