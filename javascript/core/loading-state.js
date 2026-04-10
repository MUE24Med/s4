// ============================================
// loading-state.js - الحالة المشتركة لعملية التحميل
// ============================================

export let imageUrlsToLoad = [];
export let loadingProgress = {
    totalSteps: 0,
    completedSteps: 0,
    currentPercentage: 0
};

export function resetLoadingState() {
    imageUrlsToLoad = [];
    loadingProgress.totalSteps = 0;
    loadingProgress.completedSteps = 0;
    loadingProgress.currentPercentage = 0;
}

export function addImageUrl(url) {
    if (!imageUrlsToLoad.includes(url)) {
        imageUrlsToLoad.push(url);
    }
}

export function clearImageUrls() {
    imageUrlsToLoad = [];
}