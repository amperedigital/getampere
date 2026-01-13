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
 * Generic Scroll & Sticky Feature Logic
 * Replaces hardcoded expertise section logic with data-driven attributes.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Mouse Spotlight Logic (Generic) ---
    const spotlights = document.querySelectorAll('[data-spotlight-container]');
    spotlights.forEach(container => {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            container.style.setProperty('--mouse-x', `${x}px`);
            container.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // --- 2. Scroll Scrub Logic (Bloom/Fade In-Out) ---
    class ScrollScrubber {
        constructor(el) {
            this.el = el;
            this.targets = el.querySelectorAll('[data-scrub-target]');
            this.targets.forEach(t => t.style.willChange = 'opacity, transform');
        }
        
        update() {
            const rect = this.el.getBoundingClientRect();
            const winH = window.innerHeight;
            
            const centerDist = (rect.top + rect.height/2) - (winH / 2);
            const bloomRange = winH * 0.7; 
            
            let bloom = 1 - (Math.abs(centerDist) / bloomRange);
            bloom = Math.max(0, Math.min(1, bloom));
            
            this.targets.forEach((target, i) => {
                let p = bloom - (i * 0.15); 
                p = Math.max(0, Math.min(1, p));
                
                // Smoother easing
                const eased = p * p * (3 - 2 * p);
                
                // Optimization: Round to 3 decimal places to avoid sub-pixel jitter
                const opacity = eased.toFixed(3);
                const transformY = ((1 - eased) * 25).toFixed(1);
                
                target.style.opacity = opacity;
                target.style.transform = `translate3d(0, ${transformY}px, 0)`; // 3d for hardware accel
                // Removed blur to improve performance and sharpness
                target.style.filter = ''; 
            });
        }
    }

    // --- 3. Sticky Slideshow Logic ---
    class StickySlideshow {
        constructor(el) {
            this.el = el;
            this.track = el.querySelector('[data-track]');
            this.slides = el.querySelectorAll('[data-slide]');
            this.spotlight = el.querySelector('[data-spotlight]');
            this.revealGroup = el.querySelectorAll('[data-reveal-group]');
            this.revealBgs = el.querySelectorAll('[data-reveal-bg]');
            this.dots = Array.from(el.querySelectorAll('[data-nav-dot]'));
            this.nums = Array.from(el.querySelectorAll('[data-nav-num]'));
            
            // Grid Elements (Optional: Specific animation toggles)
            this.grids = el.querySelectorAll('[data-grid-anim]');
            
            this.state = {
                inView: false,
                activeIndex: -1
            };
        }

        update() {
            if (!this.track) return;
            
            const rect = this.track.getBoundingClientRect();
            const winH = window.innerHeight;

            // A. Visibility / Entrance Animation
            // Trigger earlier (30% down)
            const currentlyInView = rect.top <= (winH * 0.3) && rect.bottom >= 0;
            
            if (currentlyInView !== this.state.inView) {
                this.state.inView = currentlyInView;
                this.toggleVisibility(currentlyInView);
            }

            // B. Scroll Progress
            const totalScrollable = rect.height - winH;
            // Progress 0.0 to 1.0 (clamped)
            let progress = -rect.top / totalScrollable;
            progress = Math.max(0, Math.min(1, progress));
            
            // C. Active Slide Calculation
            const slideCount = this.slides.length;
            let activeIndex = Math.floor(progress * slideCount);
            if (activeIndex >= slideCount) activeIndex = slideCount - 1;
            
            // Apply Slide Transitions
            this.slides.forEach((slide, index) => {
                // Determine checking state only to minimize DOM writes
                // But typically simple style updates are okay
                if (index === activeIndex) {
                    slide.style.opacity = '1';
                    slide.style.transform = 'translate3d(0, 0, 0) scale(1)';
                } else if (index < activeIndex) {
                    slide.style.opacity = '0';
                    slide.style.transform = 'translate3d(0, -30px, 0) scale(0.95)';
                } else {
                    slide.style.opacity = '0';
                    slide.style.transform = 'translate3d(0, 30px, 0) scale(0.95)';
                }
            });

            // D. Update Nav Dots
            this.updateNav(progress, slideCount, activeIndex);
        }

        toggleVisibility(show) {
            // Toggle Grids (Scale X/Y)
            this.grids.forEach(g => {
                const axis = g.dataset.gridAxis || 'x'; // 'x' or 'y'
                if (show) {
                    g.classList.remove(axis === 'y' ? 'scale-y-0' : 'scale-x-0');
                    g.classList.add(axis === 'y' ? 'scale-y-100' : 'scale-x-100');
                } else {
                    g.classList.remove(axis === 'y' ? 'scale-y-100' : 'scale-x-100');
                    g.classList.add(axis === 'y' ? 'scale-y-0' : 'scale-x-0');
                }
            });

            // Toggle Spotlight
            if (this.spotlight) {
                this.spotlight.classList.toggle('opacity-100', show);
                this.spotlight.classList.toggle('opacity-0', !show);
            }

            // Toggle generic reveal groups
            this.revealGroup.forEach(el => {
                if (show) {
                    el.classList.remove('opacity-0', 'translate-y-8');
                    el.classList.add('opacity-100', 'translate-y-0');
                } else {
                    el.classList.remove('opacity-100', 'translate-y-0');
                    el.classList.add('opacity-0', 'translate-y-8');
                }
            });

            // Toggle background reveal elements (Fades 20% <-> 100%, No Translate)
            this.revealBgs.forEach(el => {
                if (show) {
                    el.classList.remove('opacity-20');
                    el.classList.add('opacity-100');
                } else {
                    el.classList.remove('opacity-100');
                    el.classList.add('opacity-20');
                }
            });
        }

        updateNav(progress, count, activeIndex) {
            // Update Numbers
            this.nums.forEach((num, i) => {
                if (i === activeIndex) num.classList.add('text-white');
                else num.classList.remove('text-white');
            });

            // Update Dots (Fill based on segment progress)
            // Total range is 0 -> (count - 1)
            // If count is 3, segments are 0->1, 1->2. 
            // Total progress 0->1 maps to 0->(count-1).
            if (count <= 1) return;

            const totalSegments = count - 1;
            const mappedProgress = progress * totalSegments; // 0.0 -> 2.0

            this.dots.forEach((dot, i) => {
                // Dot 0 fills from 0.0->1.0
                // Dot 1 fills from 1.0->2.0
                let p = mappedProgress - i;
                p = Math.max(0, Math.min(1, p));
                dot.style.width = `${p * 100}%`;
            });
        }
    }

    // --- 4. Initialization ---
    const scrubbers = Array.from(document.querySelectorAll('[data-scroll-scrub]'))
                           .map(el => new ScrollScrubber(el));
                           
    const stickySlideshows = Array.from(document.querySelectorAll('[data-sticky-slideshow]'))
                                  .map(el => new StickySlideshow(el));

    let ticking = false;
    
    // Check if we have active components before attaching generic listener
    if (scrubbers.length > 0 || stickySlideshows.length > 0) {
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    scrubbers.forEach(s => s.update());
                    stickySlideshows.forEach(s => s.update());
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Initial Update
        scrubbers.forEach(s => s.update());
        stickySlideshows.forEach(s => s.update());
    }
});

