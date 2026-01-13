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

/*
 * Expertise Section Logic (Sticky Slider & Intro Scrub)
 * Moved from index.html
 */
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('expertise-scroll-track');
    const slides = document.querySelectorAll('.expertise-slide');
    const progressFill = document.getElementById('nav-progress-fill');
    const section = document.getElementById('expertise-section');
    const spotlight = document.getElementById('expertise-spotlight');
    const gridV = document.getElementById('grid-line-v');
    const gridH = document.getElementById('grid-line-h');
    const gridHBottom = document.getElementById('grid-line-h-bottom');
    const gridHTop = document.getElementById('grid-line-h-top');

    // Intro Elements
    const introSection = document.getElementById('solid-expertise-intro');
    const introTexts = document.querySelectorAll('.scroll-reveal-text');

    // 1. Mouse Spotlight
    if (section && spotlight) {
        section.addEventListener('mousemove', (e) => {
            const rect = section.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            section.style.setProperty('--mouse-x', `${x}px`);
            section.style.setProperty('--mouse-y', `${y}px`);
            spotlight.style.opacity = '1';
        });
        section.addEventListener('mouseleave', () => {
            spotlight.style.opacity = '0';
        });
    }

    // 2. Scroll Animation
    let ticking = false;
    let gridInView = false; // State tracking for grid animation

    function updateSlider() {
        // A. Handle Intro Scroll Scrub
        if (introSection && introTexts.length) {
             const rect = introSection.getBoundingClientRect();
             const winH = window.innerHeight;
             
             // Distance of element center from viewport center
             const centerDist = (rect.top + rect.height/2) - (winH / 2);
             const bloomRange = winH * 0.6; // Distance over which it fades in/out
             
             // 1.0 = Center, 0.0 = Edges
             let bloom = 1 - (Math.abs(centerDist) / bloomRange);
             bloom = Math.max(0, Math.min(1, bloom));
             
             // Apply scrub to texts
             introTexts.forEach((el, i) => {
                // Add slight lag for 2nd line
                let p = bloom - (i * 0.15); 
                p = Math.max(0, Math.min(1, p));
                
                // Easing for smoother feel
                const eased = p * p * (3 - 2 * p); 
                
                el.style.opacity = eased.toFixed(3);
                el.style.transform = `translateY(${(1 - eased) * 40}px)`;
                el.style.filter = `blur(${(1 - eased) * 10}px)`;
             });
        }

        // B. Handle Sticky Slider (only if track exists)
        if (track) {
            const rect = track.getBoundingClientRect();
            
            // Grid Animation: Trigger when section enters view (and reset when leaving)
            // Uses state tracking to prevent constant DOM updates/style invalidation
            const currentlyInView = rect.top <= window.innerHeight && rect.bottom >= 0;
            
            if (currentlyInView !== gridInView) {
                gridInView = currentlyInView;
                
                if (gridInView) {
                     // REVEAL: Expand from center
                     if (gridV) { gridV.classList.remove('scale-y-0'); gridV.classList.add('scale-y-100'); }
                     if (gridH) { gridH.classList.remove('scale-x-0'); gridH.classList.add('scale-x-100'); }
                } else {
                     // HIDE: Shrink to center
                     if (gridV) { gridV.classList.remove('scale-y-100'); gridV.classList.add('scale-y-0'); }
                     if (gridH) { gridH.classList.remove('scale-x-100'); gridH.classList.add('scale-x-0'); }
                }
            }

            const viewportHeight = window.innerHeight;
            
            // Current progress through the stickiness
            const totalScrollable = rect.height - viewportHeight;
            let progress = -rect.top / totalScrollable;
            progress = Math.max(0, Math.min(1, progress));

            // Determine active slide
            const slideCount = 3;
            let activeIndex = Math.floor(progress * slideCount);
            if (activeIndex >= slideCount) activeIndex = slideCount - 1;

            // Update Slides
            slides.forEach((slide, index) => {
                if (index === activeIndex) {
                    slide.style.opacity = '1';
                    slide.style.transform = 'translateY(0) scale(1)';
                } else if (index < activeIndex) {
                     // Previous slides go up
                     slide.style.opacity = '0';
                     slide.style.transform = 'translateY(-30px) scale(0.95)';
                } else {
                     // Next slides stay down
                     slide.style.opacity = '0';
                     slide.style.transform = 'translateY(30px) scale(0.95)';
                }
            });

            // Update Progress Bar
            // Map 0 -> 1 progress to 0 -> 200% transform (since width is 1/3)
            // const translateVal = progress * 200; 
            // if(progressFill) progressFill.style.transform = `translateX(${translateVal}%)`;

            // Update Numbers & Progress Dots
            const num0 = document.getElementById('nav-num-0');
            const num1 = document.getElementById('nav-num-1');
            const num2 = document.getElementById('nav-num-2');
            const dots1 = document.getElementById('nav-dots-1');
            const dots2 = document.getElementById('nav-dots-2');
            
            if(num0) num0.classList.remove('text-white');
            if(num1) num1.classList.remove('text-white');
            if(num2) num2.classList.remove('text-white');

            if (activeIndex === 0 && num0) num0.classList.add('text-white');
            if (activeIndex === 1 && num1) num1.classList.add('text-white');
            if (activeIndex === 2 && num2) num2.classList.add('text-white');

            // Calculate granular progress (0.0 -> 2.0 total range for 3 slides)
            // progress is 0->1. mapped to slides.
            // visual progress needs to fill dots between 01-02 and 02-03.
            // There are 2 sets of dots.
            // progress 0.0 -> 0.5 : Fill dots1 (0% -> 100%)
            // progress 0.5 -> 1.0 : Fill dots2 (0% -> 100%)
            
            let p = progress * 2; // Range 0 -> 2
            
            // Dots 1
            if (dots1) {
                let d1 = Math.max(0, Math.min(1, p)); // 0 to 1
                dots1.style.width = `${d1 * 100}%`;
            }

            // Dots 2
            if (dots2) {
                let d2 = Math.max(0, Math.min(1, p - 1)); // 0 to 1 (starting after p=1)
                dots2.style.width = `${d2 * 100}%`;
            }
        }

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateSlider);
            ticking = true;
        }
    });
    updateSlider(); // Initial run
});

