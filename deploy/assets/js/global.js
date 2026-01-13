// global.js - Initialize Lenis and other global page setup
(function() {
  // Detect Aura editor or iframe environment
  const isEditor = window.location.hostname.includes('aura.build') || 
                   window.location.href.includes('aura.build') ||
                   window.location.search.includes('aura') ||
                   (document.referrer && document.referrer.includes('aura.build')) ||
                   window.location.href === 'about:srcdoc' ||
                   window.self !== window.top;

  if (isEditor) {
    console.log('[Ampere Global] Editor detected, skipping Lenis initialization');
    return;
  }

  // Initialize Lenis for smooth scrolling (Desktop only)
  // Mobile browsers have better native inertia scrolling; smooth scroll libs often cause "jitter" on touch.
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
  
  if (typeof Lenis !== "undefined" && !window.lenis && !isTouchDevice && window.innerWidth > 1024) {
    const lenis = new Lenis({ 
      lerp: 0.1, 
      smooth: true,
      smoothWheel: true,
      orientation: 'vertical',
      gestureOrientation: 'vertical'
    });
    window.lenis = lenis;
    
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
})();

/* 
 * Navigation Color Toggle Logic
 * Merged from nav-color-toggle.js
 */
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    // Select all potential theme sections
    const themeSections = document.querySelectorAll('[data-nav-theme]');

    function checkNavTheme() {
        // We trigger around the vertical middle of the nav bar (approx 40px down)
        const triggerPoint = 40; 
        
        let inverted = false;

        for (const section of themeSections) {
            const rect = section.getBoundingClientRect();
            
            // Logic: Is the "Trigger Point" (y=40px) inside this section's vertical bounds?
            if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
                if (section.dataset.navTheme === 'invert') {
                    inverted = true;
                }
                break; // First match
            }
        }

        if (inverted) {
            if (!nav.classList.contains('nav-inverted')) {
               nav.classList.add('nav-inverted');
            }
        } else {
            if (nav.classList.contains('nav-inverted')) {
               nav.classList.remove('nav-inverted');
            }
        }
    }

    window.addEventListener('scroll', checkNavTheme, { passive: true });
    window.addEventListener('resize', checkNavTheme, { passive: true });
    
    // Initial check
    setTimeout(checkNavTheme, 100); 
});
