// global.js - Initialize Lenis and other global page setup
(function() {
  console.log('[Ampere Global] v1.532 Loaded');
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
            
            // Modified to create a "plateau" of visibility (User Request: Opacity 1 at 50% view)
            // Allow bloom to exceed 1.0 so that staggered items can still reach full opacity
            const bloomRange = winH * 0.75; 
            
            let bloom = 1.5 - (Math.abs(centerDist) / bloomRange);
            // Note: bloom is NOT clamped to 1.0 here, allowing it to drive the stagger logic below
             
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
            this.glassPanels = el.querySelectorAll('[data-grid-glass]');
            
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

            // Toggle Glass Panels (Scale 0 <-> 1)
            this.glassPanels.forEach(el => {
                if (show) {
                    el.classList.remove('scale-0');
                    el.classList.add('scale-100');
                } else {
                    el.classList.remove('scale-100');
                    el.classList.add('scale-0');
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

    // --- 4. ScrollSpy Logic (Table of Contents) ---
    class ScrollSpy {
        constructor(navEl) {
            this.nav = navEl;
            this.links = Array.from(navEl.querySelectorAll('[data-spy-link]'));
            this.indicator = navEl.querySelector('[data-scrollspy-indicator]');
            this.targets = [];
            
            // Map links to target elements
            this.links.forEach((link) => {
                const href = link.getAttribute('href');
                const target = document.querySelector(href);
                if (target) {
                    this.targets.push({ link, target });
                    
                    // Add Click Listener for Smooth Scroll
                    link.addEventListener('click', (e) => {
                         e.preventDefault();
                         if (window.lenis) {
                             // Use Lenis for smooth scroll if available. 
                             // Respect CSS scroll-margin-top for offset
                             const style = window.getComputedStyle(target);
                             const scrollMt = parseFloat(style.scrollMarginTop) || 0;
                             window.lenis.scrollTo(target, { offset: -scrollMt }); 
                         } else {
                             // Fallback for mobile/no-lenis
                             target.scrollIntoView({ behavior: 'smooth' });
                         }
                    });
                }
            });
        }

        update() {
            if (this.targets.length === 0) return;

            const winH = window.innerHeight;
            // Active zone line: 30% down the screen
            const offset = winH * 0.3; 

            // Find the current active section
            // We want the last section that has its top "passed" the offset line
            let activeIndex = -1;

            for (let i = 0; i < this.targets.length; i++) {
                const rect = this.targets[i].target.getBoundingClientRect();
                
                // If the section top is above the offset line, it is "active" or "passed"
                if (rect.top <= offset) {
                    activeIndex = i;
                }
            }
            
            // If nothing has passed the line (at top of page), default to first
            if (activeIndex === -1 && this.targets.length > 0) activeIndex = 0;

            this.setActive(activeIndex);
        }

        setActive(index) {
            this.targets.forEach((item, i) => {
                const isActive = (i === index);
                
                // Toggle Text Styles
                if (isActive) {
                    item.link.classList.remove('text-zinc-500');
                    item.link.classList.add('text-white');
                } else {
                    item.link.classList.add('text-zinc-500');
                    item.link.classList.remove('text-white');
                }
            });

            // Move Indicator
            if (this.indicator && this.targets[index]) {
                const activeLink = this.targets[index].link;
                
                // Calculate position relative to the container (this.nav)
                // Note: The indicator is absolute positioned inside a relative container.
                // We assume the activeLink is inside that same container context.
                const navRect = this.nav.getBoundingClientRect(); // This might be the `sticky top-32` div
                const linkRect = activeLink.getBoundingClientRect();
                
                // To support nested structures properly, we look at the relative offset
                // However, our HTML has the indicator inside a specific `relative` div that wraps the links.
                // Let's refine: The indicator is inside the `div class="relative pl-4..."`.
                // We should probably pass the parent wrapper to the class or calculate relative to the link's offsetParent.
                
                // Simpler: Just rely on offsetTop since they are siblings or close enough.
                const relativeTop = activeLink.offsetTop;
                const height = activeLink.offsetHeight;

                this.indicator.style.transform = `translateY(${relativeTop}px)`;
                this.indicator.style.height = `${height}px`;
            }
        }
    }
    
    // --- 4. Simple Scroll Reveal Section (New v1.462) ---
    // Reuses the exact same animation logic as StickySlideshow but for standard static sections
    class ScrollRevealSection {
        constructor(el) {
            this.el = el;
            this.grids = el.querySelectorAll('[data-grid-anim]');
            this.revealGroup = el.querySelectorAll('[data-reveal-group]');
            this.state = { inView: false };
        }

        update() {
            const rect = this.el.getBoundingClientRect();
            const winH = window.innerHeight;
            
            // Trigger animation when the top of the section reaches the visual "hot zone" (50% of viewport)
            // This ensures the animation happens while the user is actively looking at the section,
            // rather than triggering too early at the bottom edge.
            const topThreshold = winH * 0.5; 
            const bottomThreshold = 0; 

            // Element top is above the middle of the screen AND Element bottom is still visible
            const currentlyInView = (rect.top <= topThreshold) && (rect.bottom >= bottomThreshold);

            if (currentlyInView !== this.state.inView) {
                this.state.inView = currentlyInView;
                this.toggleVisibility(currentlyInView);
            }
        }

        toggleVisibility(show) {
            // Toggle Grid Lines (Scale 0 <-> 100)
            this.grids.forEach(g => {
                const axis = g.dataset.gridAxis || 'x'; // 'x' or 'y'
                
                // Support optional delay attribute (data-anim-delay="ms")
                if (g.dataset.animDelay) {
                    g.style.transitionDelay = show ? `${g.dataset.animDelay}ms` : '0ms';
                }

                if (show) {
                    g.classList.remove(axis === 'y' ? 'scale-y-0' : 'scale-x-0');
                    g.classList.add(axis === 'y' ? 'scale-y-100' : 'scale-x-100');
                } else {
                    g.classList.remove(axis === 'y' ? 'scale-y-100' : 'scale-x-100');
                    g.classList.add(axis === 'y' ? 'scale-y-0' : 'scale-x-0');
                }
            });

            // Toggle Reveal Groups (Opacity/Translate)
            this.revealGroup.forEach(el => {
                if (show) {
                    el.classList.remove('opacity-0', 'translate-y-8');
                    el.classList.add('opacity-100', 'translate-y-0');
                } else {
                    el.classList.remove('opacity-100', 'translate-y-0');
                    el.classList.add('opacity-0', 'translate-y-8');
                }
            });
        }
    }

    // --- 5. Initialization ---
    const scrubbers = Array.from(document.querySelectorAll('[data-scroll-scrub]'))
                           .map(el => new ScrollScrubber(el));
                           
    const stickySlideshows = Array.from(document.querySelectorAll('[data-sticky-slideshow]'))
                                  .map(el => new StickySlideshow(el));

    const scrollSpies = Array.from(document.querySelectorAll('[data-scrollspy-nav]'))
                             .map(el => new ScrollSpy(el));
                             
    const simpleReveals = Array.from(document.querySelectorAll('[data-scroll-reveal-section]'))
                               .map(el => new ScrollRevealSection(el));

    let ticking = false;
    
    // Check if we have active components before attaching generic listener
    if (scrubbers.length > 0 || stickySlideshows.length > 0 || scrollSpies.length > 0 || simpleReveals.length > 0) {
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    scrubbers.forEach(s => s.update());
                    stickySlideshows.forEach(s => s.update());
                    scrollSpies.forEach(s => s.update());
                    simpleReveals.forEach(s => s.update());
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Initial Update
        scrubbers.forEach(s => s.update());
        stickySlideshows.forEach(s => s.update());
        scrollSpies.forEach(s => s.update());
        simpleReveals.forEach(s => s.update());
    }

    // --- 6. Generic Animate-On-Scroll & Media Trigger Observer ---
    // Handles elements marked with .animate-on-scroll or [data-observer]
    // Triggers: .in-view class, SMIL animations, and Video playback
    
    // Helper: Trigger Media (SMIL/Video) - Exposed Globally
    window.triggerMedia = function(container, shouldPlay) {
        if (!container) return;
        
        const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
        const behavior = container.dataset.smilBehavior;
        const motionElements = container.querySelectorAll("animateMotion");
        const videos = container.querySelectorAll('video');
  
        if (shouldPlay) {
            // A. SMIL Animations
            container.classList.add("manual-active");
            
            // Force visibility for motion paths
            motionElements.forEach(motion => {
              if (motion.parentElement && !motion.parentElement.classList.contains('always-hide-anim')) {
                  const cls = (behavior === 'force-display') ? 'force-smil-display' : 'force-visible';
                  if ((behavior === 'force-display') || !motion.parentElement.classList.contains('hidden')) {
                      motion.parentElement.classList.add(cls);
                  }
              }
            });
  
            // Begin Elements
            anims.forEach(anim => {
                try {
                    const beginAttr = anim.getAttribute('begin');
                    const isDependent = beginAttr && beginAttr.includes('anim-trigger');
                    const isTrigger = anim.id && anim.id.includes('anim-trigger');
                    if (isTrigger || !isDependent) {
                        anim.beginElement(); 
                    }
                } catch(e) {}
            });
  
            // B. Video Playback
            videos.forEach(v => {
                const playPromise = v.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
            });
  
        } else {
            // Stop/Pause
            container.classList.remove("manual-active");
            motionElements.forEach(motion => {
               if (motion.parentElement) motion.parentElement.classList.remove('force-visible', 'force-smil-display');
            });
            videos.forEach(v => v.pause());
        }
    };

    // Consolidated Observer Logic
    const animatedElements = document.querySelectorAll('.animate-on-scroll, [data-observer], .fade-up-element, .mobile-reveal, [data-tab-card]');

    // Define observer options
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px', // Trigger slightly before bottom
        threshold: 0.15 
    };

    // Create Global Observer
    window.globalObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const target = entry.target;
            // Check if target IS a smil container, or contains one
            const smilContainer = target.hasAttribute('data-smil-container') ? target : target.querySelector('[data-smil-container]');
            // Check for direct video children if not in smil container
            const directVideo = target.querySelector('video');

            if (entry.isIntersecting) {
                target.classList.add('in-view');
                target.setAttribute('data-in-view', 'true');
                
                if (smilContainer) window.triggerMedia(smilContainer, true);
                if (directVideo && !smilContainer) directVideo.play().catch(()=>{});

            } else {
                // target.classList.remove('in-view'); 
                target.setAttribute('data-in-view', 'false');

                if (smilContainer) window.triggerMedia(smilContainer, false);
                if (directVideo && !smilContainer) directVideo.pause();
            }
        });
    }, observerOptions);

    // Initial Observation
    if (animatedElements.length > 0) {
        console.log(`[Global] Found ${animatedElements.length} observable elements.`);
        animatedElements.forEach(el => window.globalObserver.observe(el));
    }

    // Global data-scrollto handler for smooth anchor scroll (Lenis or fallback)
    document.body.addEventListener('click', function(e) {
      const el = e.target.closest('[data-scrollto]');
      if (el) {
        const targetSel = el.getAttribute('data-scrollto');
        if (targetSel) {
          const target = document.querySelector(targetSel);
          if (target) {
            e.preventDefault();
            if (window.lenis) {
              window.lenis.scrollTo(target, {
                offset: -96,
                duration: 1.2, 
                easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t))
              });
            } else {
              // Fallback: Custom smooth scroll with easing for mobile
              const targetY = target.getBoundingClientRect().top + window.pageYOffset - 96;
              const startY = window.pageYOffset;
              const distance = targetY - startY;
              const duration = 1000;
              let startTime = null;

              function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                
                // Easing: easeOutQuart
                const ease = 1 - Math.pow(1 - progress, 4);
                
                window.scrollTo(0, startY + (distance * ease));
                
                if (timeElapsed < duration) {
                  requestAnimationFrame(animation);
                }
              }
              requestAnimationFrame(animation);
            }
          }
        }
      }
    });
});

/*
 * Ampere 3D Key Global Manager
 * Auto-initializes 3D keys when [data-ampere-key-3d] is present.
 */
(function() {
    // Capture script URL immediately while this script is executing
    const scriptUrl = document.currentScript ? document.currentScript.src : null;
    
    document.addEventListener('DOMContentLoaded', () => {
        const keyContainers = document.querySelectorAll('[data-ampere-key-3d]');
        
        if (keyContainers.length > 0 && scriptUrl) {
            console.log("[Global] Found 3D Key containers, loading component...");
            
            // Resolve sibling URL (replaces 'global.js' with 'ampere-3d-key.js')
            // Works for CDN paths: .../v1.XYZ/deploy/assets/js/global.js -> .../ampere-3d-key.js
            // Uses a flexible regex to handle potential .min suffix
            let componentUrl = scriptUrl.replace(/\/global.*?\.js$/, '/ampere-3d-key.js');
            
            // LOCAL DEV FALLBACK
            // If the scriptUrl is not found (sometimes happens with bundled environments) or we are local
            if (!componentUrl || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                 componentUrl = './assets/js/ampere-3d-key.js';
            }

            import(componentUrl)
                .then(({ Ampere3DKey }) => {
                    const initKeys = () => {
                         keyContainers.forEach(container => {
                            // Avoid double initialization
                            if (container.dataset.keyInitialized) return;
                            container.dataset.keyInitialized = "true";

                            const instance = new Ampere3DKey(container);
                            
                            // Hook into Lenis if available
                            if (window.lenis) {
                                window.lenis.on('scroll', () => {
                                    const rect = container.getBoundingClientRect();
                                    const vh = window.innerHeight;
                                    // Default Logic: 85% -> 35% viewport reveal
                                    const start = vh * 0.85;
                                    const end = vh * 0.35;
                                    
                                    let p = (start - rect.top) / (start - end);
                                    p = Math.min(Math.max(p, 0), 1); // Clamp 0-1
                                    
                                    instance.setProgress(p);
                                });
                            } else {
                                // Fallback for no-lenis (native scroll)
                                window.addEventListener('scroll', () => {
                                    const rect = container.getBoundingClientRect();
                                    const vh = window.innerHeight;
                                    const start = vh * 0.85;
                                    const end = vh * 0.35;
                                    
                                    let p = (start - rect.top) / (start - end);
                                    p = Math.min(Math.max(p, 0), 1);
                                    
                                    instance.setProgress(p);
                                }, { passive: true });
                            }
                         });
                    };
                    
                    initKeys();
                })
                .catch(err => {
                    console.error("[Global] Failed to load Ampere3DKey:", err);
                });
        }
    });
})();

