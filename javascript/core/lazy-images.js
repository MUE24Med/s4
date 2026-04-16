// lazy-images.js
export function initLazySVGImages() {
  if (!window.IntersectionObserver) {
    // Fallback للمتصفحات القديمة: حمّل الصور فوراً
    document.querySelectorAll('#main-svg image[data-src]').forEach(img => {
      const src = img.getAttribute('data-src');
      if (src && !img.getAttribute('src')) {
        img.setAttribute('src', src);
        img.removeAttribute('data-src');
      }
    });
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        if (src) {
          img.setAttribute('src', src);
          img.removeAttribute('data-src');
          console.log(`✅ Lazy loaded: ${src}`);
        }
        obs.unobserve(img);
      }
    });
  }, {
    rootMargin: '200px', // يبدأ التحميل قبل دخول الصورة بـ 200px
    threshold: 0.01
  });

  const images = document.querySelectorAll('#main-svg image[data-src]');
  images.forEach(img => observer.observe(img));
}