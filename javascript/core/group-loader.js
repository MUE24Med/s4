async function finishLoading(groupLetter, sectionNum) {
    loadingProgress.completedSteps = loadingProgress.totalSteps;
    loadingProgress.currentPercentage = 100;
    updateLoadProgress();

    const { scan } = await import('../features/svg-processor.js');
    const { updateWoodInterface } = await import('../ui/wood-interface.js');

    updateDynamicSizes();
    scan();
    
    // تطبيق أولويات الطبقات (بدون نقل الصور أو كل المستطيلات)
    hideOverlappingGroupImages();
    bringSectionRectsToFront();   // ✅ فقط مستطيلات السكشن
    // ❌ لا نستدعي sendImagesToBack() ولا bringRectsToFront()
    
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