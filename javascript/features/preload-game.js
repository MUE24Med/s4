// ============================================
// preload-game.js - نقطة الدخول لنظام التحميل واللعبة
// الإصدار المُحسّن - يستورد الوحدات الجديدة
// ============================================

import { initPreload } from './preload.js';
import { initializeMiniGame } from './mini-game.js';
import { loadLiveLeaderboard, refreshPersonalRecordUI } from './leaderboard-ui.js';
import { PersonalRecord } from './leaderboard-core.js';
import { getPlayerName, getDeviceId } from '../core/utils.js';

// دالة مساعدة لتحديث عرض الرمز في شاشة البريلود
function updatePreloadVisitorCode() {
    const codeEl = document.getElementById('visitorCodeDisplay');
    if (codeEl) {
        const code = localStorage.getItem('visitor_id') || '0000';
        codeEl.textContent = code;
    }
}

// ✅ FIX: جلب Top5 من السيرفر فور فتح الصفحة في كل زيارة
async function initLiveLeaderboardOnLoad() {
    const deviceId = getDeviceId();
    const liveList = document.getElementById('liveLeaderboardList');
    const liveStatus = document.getElementById('liveLeaderboardStatus');
    if (liveList) {
        await loadLiveLeaderboard(liveList, deviceId, liveStatus);
    }
}

export function initPreloadSystem() {
    const preloadDone = localStorage.getItem('preload_done');
    const preloadScreen = document.getElementById('preload-screen');

    if (!preloadDone && preloadScreen) {
        console.log('🔄 أول زيارة - تفعيل شاشة Preload مع اللعبة المصغرة');

        // عرض الرمز المميز في شاشة البريلود
        updatePreloadVisitorCode();

        // ✅ نبدأ اللعبة أولاً قبل التحميل
        initializeMiniGame();

        // ✅ FIX: جلب Top5 من السيرفر فور الفتح بدون انتظار نهاية اللعبة
        initLiveLeaderboardOnLoad();

        // ثم نبدأ التحميل بدون callback
        initPreload();
    } else {
        console.log('✅ زيارة سابقة - تخطي Preload');
        if (preloadScreen) {
            preloadScreen.classList.add('hidden');
        }

        const deviceId = getDeviceId();
        const liveList = document.getElementById('liveLeaderboardList');
        const liveStatus = document.getElementById('liveLeaderboardStatus');

        // ✅ FIX: تحديث القائمة الحية في الزيارات السابقة أيضاً فور الفتح
        if (liveList) {
            loadLiveLeaderboard(liveList, deviceId, liveStatus);
        }

        refreshPersonalRecordUI('personalRecordValue');

        // رفع الرقم القياسي المحلي إلى السحابة عند بدء التشغيل (إذا كان جديداً)
        const playerName = getPlayerName();
        PersonalRecord.syncToCloud(playerName, deviceId).catch(console.warn);
    }
}
