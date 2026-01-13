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
    console.log("[Global] DOMContentLoaded - Initializing Nav Toggle...");

    const nav = document.querySelector('nav');
    if (!nav) {
        console.error("[Global] Nav element NOT found!");
        return;
    } else {
        console.log("[Global] Nav element found:", nav);
    }
    
    // Select all potential theme sections
    const themeSections = document.querySelectorAll('[data-nav-theme]');
    console.log(`[Global] Found ${themeSections.length} theme sections.`);
    themeSections.forEach((sec, i) => {
        console.log(`[Global] Section ${i}:`, sec.className.substring(0, 50) + "...", "Theme:", sec.dataset.navTheme);
    });

    function checkNavTheme() {
        // We trigger around the vertical middle of the nav bar (approx 40px down)
        const triggerPoint = 40; 
        
        let inverted = false;
        let activeSectionDebug = "None";

        for (const section of themeSections) {
            const rect = section.getBoundingClientRect();
            
            // Logic: Is the "Trigger Point" (y=40px) inside this section's vertical bounds?
            if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
                activeSectionDebug = section.className.substring(0, 30) + "...";
                if (section.dataset.navTheme === 'invert') {
                    inverted = true;
                }
                break; // First match
            }
        }

        // console.log(`[Global] Check: Active=${activeSectionDebug} Inverted=${inverted}`);

        if (inverted) {
            if (!nav.classList.contains('nav-inverted')) {
               console.log("[Global] SWITCHING TO INVERTED (Dark BG / White Text)");
               nav.classList.add('nav-inverted');
            }
        } else {
            if (nav.classList.contains('nav-inverted')) {
               console.log("[Global] SWITCHING TO DEFAULT (Transparent / White Text)");
               nav.classList.remove('nav-inverted');
            }
        }
    }

    // Add multiple listeners to ensure we catch the scroll event
    window.addEventListener('scroll', checkNavTheme, { passive: true });
    window.addEventListener('resize', checkNavTheme, { passive: true });
    document.addEventListener('scroll', checkNavTheme, { passive: true }); // Fallback
    
    // Using Lenis? Hook into that too if it exists
    if (window.lenis) {
        console.log("[Global] Hooking into Lenis scroll event");
        window.lenis.on('scroll', checkNavTheme);
    } else {
        console.log("[Global] Lenis not detected on window");
    }
    
    // Initial check
    setTimeout(() => {
        console.log("[Global] Initial Check Timeout Firing");
        checkNavTheme();
    }, 100); 
});
