// داخل finishLoading() - تأكد من أن هذا هو الكود المستخدم
async function finishLoading(groupLetter, sectionNum) {
    loadingProgress.completedSteps = loadingProgress.totalSteps;
    loadingProgress.currentPercentage = 100;
    updateLoadProgress();

    const { scan } = await import('../features/svg-processor.js');
    const { updateWoodInterface } = await import('../ui/wood-interface.js');

    updateDynamicSizes();
    scan();
    
    // فقط إخفاء الصور المتداخلة (مع الحفاظ على وجودها)
    hideOverlappingGroupImages();
    // لا نستدعي bringSectionRectsToFront أبداً
    
    updateSectionName(groupLetter, sectionNum);
    updateWoodInterface();
    goToWood();

    const mainSvg = document.getElementById('main-svg');
    if (mainSvg) {
        mainSvg.style.opacity = '1';
        mainSvg.style.visibility = 'visible';
        mainSvg.classList.add('loaded');
    }
    hideLoadingScreen();
    console.log('🎉 اكتمل التحميل');
}