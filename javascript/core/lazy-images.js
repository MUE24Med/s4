// lazy-images.js
export function initLazySVGImages() {
  if (!window.IntersectionObserver) {
    // Fallback للمتصفحات القديمة: حمّل الصور فوراً
    document.querySelectorAll('#main-svg image[data-src]').forEach(img => {
      const src = img.getAttribute('data-src');
      if (src && !img.getAttribute('href')) {
        img.setAttribute('href', src);
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
        if (src && !img.getAttribute('href')) {
          img.setAttribute('href', src);
          img.removeAttribute('data-src');
          console.log(`✅ Lazy loaded: ${src}`);
        }
        obs.unobserve(img);
      }
    });
  }, {
    rootMargin: '300px', // يبدأ التحميل قبل دخول الصورة بـ 300px
    threshold: 0.01
  });

  // طبق على كل الصور التي تحمل data-src داخل SVG
  const images = document.querySelectorAll('#main-svg image[data-src]');
  images.forEach(img => observer.observe(img));
}