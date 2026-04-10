// ============================================
// loading-ui.js - التحكم في شاشة التحميل والمصابيح
// ============================================

import { loadingProgress } from './loading-state.js';

export function showLoadingScreen(groupLetter) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;

    const splashImage = document.getElementById('splash-image');
    if (splashImage) {
        splashImage.style.display = 'none';
        let textElement = document.getElementById('group-text-display');
        if (!textElement) {
            textElement = document.createElement('div');
            textElement.id = 'group-text-display';
            textElement.style.cssText = `
                font-size: 120px;
                font-weight: bold;
                color: #ffca28;
                text-shadow: 
                    0 0 30px rgba(255,202,40,0.8),
                    0 0 60px rgba(255,202,40,0.5),
                    0 0 90px rgba(255,202,40,0.3);
                font-family: 'Arial Black', sans-serif;
                letter-spacing: 15px;
                animation: pulse 2s ease-in-out infinite;
                text-align: center;
                margin: 20px 0;
            `;
            splashImage.parentNode.insertBefore(textElement, splashImage);
        }
        textElement.textContent = `Group ${groupLetter}`;
        textElement.style.display = 'block';
    }

    loadingProgress.totalSteps = 0;
    loadingProgress.completedSteps = 0;
    loadingProgress.currentPercentage = 0;
    document.querySelectorAll('.light-bulb').forEach(bulb => bulb.classList.remove('on'));
    loadingOverlay.classList.add('active');
    console.log(`🔦 شاشة التحميل نشطة: Group ${groupLetter}`);

    import('../ui/wood-interface.js').then(({ updateWelcomeMessages }) => {
        updateWelcomeMessages();
    });
}

export function hideLoadingScreen() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;
    loadingOverlay.classList.remove('active');
    const splashImage = document.getElementById('splash-image');
    if (splashImage) splashImage.style.display = '';
    const textElement = document.getElementById('group-text-display');
    if (textElement) textElement.style.display = 'none';
    console.log('✅ تم إخفاء شاشة التحميل');
}

export function updateLoadProgress() {
    if (loadingProgress.totalSteps === 0) return;
    const progress = (loadingProgress.completedSteps / loadingProgress.totalSteps) * 100;
    loadingProgress.currentPercentage = Math.min(100, Math.round(progress));
    const pct = loadingProgress.currentPercentage;
    if (pct >= 20) document.getElementById('bulb-4')?.classList.add('on');
    if (pct >= 40) document.getElementById('bulb-3')?.classList.add('on');
    if (pct >= 60) document.getElementById('bulb-2')?.classList.add('on');
    if (pct >= 80) document.getElementById('bulb-1')?.classList.add('on');
}