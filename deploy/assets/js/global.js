// global.js - Initialize Lenis and other global page setup
(function () {
    console.log('[Ampere Global] v3.034 Loaded');
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

    if (typeof Lenis !== "undefined" && !window.lenis && !isTouchDevice && window.innerWidth > 768) {
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

// --- Initialize Distortion Grid (Lazy Load) ---
// --- Initialize Distortion Grid (Lazy Load) ---
// DISABLED FOR DEBUGGING (Unicorn Studio WebGL Conflict)
/*
(function () {
    function checkAndLoad() {
        const selector = '[data-object="distortion-grid"]';
        if (document.querySelector(selector)) {
            if (window.DistortionGrid) {
                window.DistortionGrid.initAll(selector);
            } else if (!document.querySelector('script[src*="distortion-grid.js"]')) {
                const script = document.createElement('script');
                script.src = 'assets/js/distortion-grid.js?v=' + Date.now();
                script.onload = () => {
                    if (window.DistortionGrid) window.DistortionGrid.initAll(selector);
                };
                document.body.appendChild(script);
            }
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndLoad);
    } else {
        checkAndLoad();
    }
})();
*/

// --- Initialize Unicorn Studio (Hybrid Strategy) ---
// 1. Hero: Auto-init via UnicornStudio.init() to create WebGL context.
// 2. Expertise: Lazy-load via addScene() reusing the existing context.
(function () {
    const initUnicorn = () => {
        if (window.UnicornStudio) {
            console.log("[Global] Unicorn Studio Loaded. Initializing Hero...");
            window.UnicornStudio.init(); // Handles [data-us-project] elements (Hero)

            // Now setup Lazy Loader for [data-us-lazy] elements (Expertise)
            const lazyTargets = document.querySelectorAll('[data-us-lazy]');

            if (lazyTargets.length > 0) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const target = entry.target;

                            // Prevent duplicate init
                            if (target.getAttribute('data-us-initialized') === 'true') return;

                            const projectId = target.getAttribute('data-us-lazy');
                            const rect = target.getBoundingClientRect();
                            console.log(`[Global] Lazy Detecting Expertise: ${projectId} Dims: ${rect.width}x${rect.height}`);

                            if (rect.width > 0 && rect.height > 0) {
                                console.log(`[Global] Adding Lazy Scene: ${projectId}`);

                                window.UnicornStudio.addScene({
                                    element: target,
                                    projectId: projectId,
                                    scale: 1,
                                    dpi: 1,
                                    fps: 60,
                                    production: true,
                                    lazyLoad: false
                                }).then(scene => {
                                    console.log(`[Global] Lazy Scene Initialized:`, scene);
                                    target.setAttribute('data-us-initialized', 'true');
                                    scene.paused = false;
                                }).catch(err => {
                                    console.error(`[Global] Lazy Scene Failed:`, err);
                                });

                                // Stop observing once initialized
                                observer.unobserve(target);
                            }
                        }
                    });
                }, { threshold: 0.1 });

                lazyTargets.forEach(el => observer.observe(el));
            }

        } else {
            console.log("[Global] Waiting for Unicorn...");
            setTimeout(initUnicorn, 100);
        }
    };

    if (document.readyState === 'complete') {
        initUnicorn();
    } else {
        window.addEventListener('load', initUnicorn);
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
        // Mobile Optimization: Disable heavy scroll logic for nav bar
        if (window.innerWidth < 768) return;

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
            if (window.innerWidth < 768) return;
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
            // Mobile Optimization: Force visibility and abort (keep simple fade, no bloom)
            // The jitter risk > benefit of subtle bloom on mobile
            if (window.innerWidth < 768) {
                this.targets.forEach(t => {
                    if (t.style.opacity !== '1') {
                        t.style.opacity = '1';
                        t.style.transform = 'translate3d(0, 0, 0)';
                    }
                });
                return;
            }

            const rect = this.el.getBoundingClientRect();
            const winH = window.innerHeight;

            const centerDist = (rect.top + rect.height / 2) - (winH / 2);

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
                activeIndex: -1,
                isOnScreen: true // Optimistic default
            };

            // Optimization: Stop layout thrashing when element is not even visible.
            // Using a broad margin to ensure we catch it before it enters screen.
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        this.state.isOnScreen = entry.isIntersecting;
                    });
                }, { rootMargin: '200px' });
                this.observer.observe(el);
            }

            // Performance: Pre-calculate absolute geometry to avoid repaint on scroll
            this.calculateCache = this.calculateCache.bind(this);
            // Debounce resize slightly or just RAF
            window.addEventListener('resize', () => {
                this.calculateCache();
            });
            // Init cache after layout settles
            setTimeout(this.calculateCache, 100);
        }

        calculateCache() {
            if (!this.track) return;
            // Force a read to get current dimensions
            const rect = this.track.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;

            this.cache = {
                // Absolute top position of the track
                top: rect.top + scrollTop,
                height: rect.height,
                winH: window.innerHeight
            };
        }

        update() {
            // Optimization: Skip expensive calc if off-screen
            if (!this.state.isOnScreen) return;

            // Ensure cache exists
            if (!this.cache || !this.cache.top) this.calculateCache();

            // Read ONLY scroll position (cheap)
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const { top, height, winH } = this.cache;

            // Calculate relative position from cached absolute values
            const rectTop = top - scrollY;
            const rectBottom = rectTop + height;

            // A. Visibility / Entrance Animation
            // Trigger earlier (30% down)
            const currentlyInView = rectTop <= (winH * 0.3) && rectBottom >= 0;

            if (currentlyInView !== this.state.inView) {
                this.state.inView = currentlyInView;
                this.toggleVisibility(currentlyInView);
            }

            // B. Scroll Progress
            const totalScrollable = height - winH;
            // Progress 0.0 to 1.0 (clamped)
            let progress = -rectTop / totalScrollable;
            progress = Math.max(0, Math.min(1, progress));

            // C. Active Slide Calculation
            const slideCount = this.slides.length;
            let activeIndex = Math.floor(progress * slideCount);
            if (activeIndex >= slideCount) activeIndex = slideCount - 1;

            // Optimization: Only update slide styles if index changed
            // This prevents massive layout thrashing on every scroll pixel
            if (this.state.activeIndex !== activeIndex) {
                this.state.activeIndex = activeIndex;

                // Apply Slide Transitions
                this.slides.forEach((slide, index) => {
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
            }

            // D. Update Nav Dots
            // This needs to run every frame for smooth bar filling, but it's cheap (width change)
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
                    el.classList.remove('opacity-0', 'translate-y-8', 'lg:opacity-0', 'lg:translate-y-8');
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
            this.activeIndex = -1;

            // Recalculate on resize (ensures indicator position updates if window width changes)
            window.addEventListener('resize', () => {
                this.activeIndex = -1;
                this.update();
            }, { passive: true });

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
                            // Mobile Fallback: Use native scroll (Instant/Smooth via CSS)
                            // Custom JS easing fights with touch interactions, causing "stuck" scroll.
                            // We'll rely on CSS 'scroll-behavior: smooth' or just instant jump and let browser handle it.

                            const style = window.getComputedStyle(target);
                            const scrollMt = parseFloat(style.scrollMarginTop);
                            const offset = (isNaN(scrollMt) || scrollMt < 20) ? 160 : scrollMt;

                            const targetY = target.getBoundingClientRect().top + window.pageYOffset - offset;

                            // Cleanest fix: Native scrollTo with 'auto' (instant) behavior for mobile.
                            // 'smooth' can sometimes cause scroll-jacking or locking on older iOS/Android versions.

                            window.scrollTo({
                                top: targetY,
                                behavior: 'auto'
                            });

                            // Note: If 'smooth' behavior is missing in CSS reset or conflicting,
                            // it will jump instantly, which is better than locking.
                            // (Old JS animation loop removed)
                        }
                    });
                }
            });
        }

        update() {
            if (this.targets.length === 0) return;

            // Mobile limit removed to allow horizontal indexer

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

            if (activeIndex !== this.activeIndex) {
                this.activeIndex = activeIndex;
                this.setActive(activeIndex);
            }
        }

        setActive(index) {
            this.targets.forEach((item, i) => {
                const isActive = (i === index);

                // Toggle Text Styles
                if (isActive) {
                    item.link.classList.remove('text-zinc-500');
                    item.link.classList.add('text-white');
                    item.link.setAttribute('data-active', 'true');

                    // Support for Mobile Border-Bottom Indicator
                    if (item.link.classList.contains('border-b-2')) {
                        item.link.classList.remove('border-transparent');
                        item.link.classList.add('border-blue-500');
                    }

                    // Mobile Horizontal Scroll Auto-Center (Safer implementation)
                    // Use container scrollTo instead of scrollIntoView to avoid hijacking global window scroll
                    if (window.innerWidth < 1024 && this.nav.scrollWidth > this.nav.clientWidth) {
                        try {
                            const nav = this.nav;
                            const linkRect = item.link.getBoundingClientRect();
                            const navRect = nav.getBoundingClientRect();

                            // Calculate center position relative to the container
                            // We need the link's offset relative to the container's current scroll position
                            const linkCenter = item.link.offsetLeft + (item.link.offsetWidth / 2);
                            const navCenter = nav.offsetWidth / 2;

                            nav.scrollTo({
                                left: linkCenter - navCenter,
                                behavior: 'smooth'
                            });
                        } catch (e) { console.warn(e); }
                    }

                } else {
                    item.link.classList.add('text-zinc-500');
                    item.link.classList.remove('text-white');
                    item.link.removeAttribute('data-active');

                    // Support for Mobile Border-Bottom Indicator
                    if (item.link.classList.contains('border-b-2')) {
                        item.link.classList.add('border-transparent');
                        item.link.classList.remove('border-blue-500');
                    }
                }
            });

            // Move Indicator
            if (this.indicator && this.targets[index]) {
                const activeLink = this.targets[index].link;

                // Determine layout orientation
                // If flex-row, we treat as horizontal.
                const navStyle = window.getComputedStyle(this.nav);
                const isHorizontal = navStyle.display === 'flex' && navStyle.flexDirection === 'row';

                if (isHorizontal) {
                    // Mobile / Horizontal Mode
                    const relativeLeft = activeLink.offsetLeft;
                    const width = activeLink.offsetWidth;

                    // Reset vertical props just in case
                    this.indicator.style.transform = `translateX(${relativeLeft}px)`;
                    this.indicator.style.width = `${width}px`;
                    this.indicator.style.height = ''; // Let CSS control height or keep existing
                } else {
                    // Desktop / Vertical Mode
                    const relativeTop = activeLink.offsetTop;
                    const height = activeLink.offsetHeight;

                    this.indicator.style.transform = `translateY(${relativeTop}px)`;
                    this.indicator.style.height = `${height}px`;
                    this.indicator.style.width = ''; // Reset width
                }
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
    window.triggerMedia = function (container, shouldPlay) {
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
                } catch (e) { }
            });

            // B. Video Playback
            videos.forEach(v => {
                const playPromise = v.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => { });
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
    const animatedElements = document.querySelectorAll('.animate-on-scroll, [data-observer], .fade-up-element, .mobile-reveal, [data-tab-card], [data-object="grid"], [data-object="distortion-grid"], [data-us-project]');

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
            // Check for DistortionGrid instance
            const distGrid = target._distortionInstance;
            // Check for Ampere3DKey instance
            const keyInstance = target._key3dInstance;
            // Check for Unicorn Studio Project
            const isUnicornProject = target.hasAttribute('data-us-project');

            if (entry.isIntersecting) {
                target.classList.add('in-view');
                target.setAttribute('data-in-view', 'true');

                if (smilContainer) window.triggerMedia(smilContainer, true);
                if (directVideo && !smilContainer) directVideo.play().catch(() => { });
                if (distGrid) distGrid.resume();
                if (keyInstance) keyInstance.resume();

                // Unicorn Logic moved to top-level initUnicorn() function (Hybrid Strategy)

            } else {
                // target.classList.remove('in-view');
                target.setAttribute('data-in-view', 'false');

                if (smilContainer) window.triggerMedia(smilContainer, false);
                if (directVideo && !smilContainer) directVideo.pause();
                if (distGrid) distGrid.pause();
                if (keyInstance) keyInstance.pause();

                if (isUnicornProject && window.UnicornStudio && window.UnicornStudio.scenes) {
                    const scene = window.UnicornStudio.scenes.find(s => s.element === target);
                    if (scene) {
                        console.log(`[Global] Pausing Unicorn Scene (${scene.id})`);
                        scene.paused = true;
                    }
                }
            }
        });
    }, observerOptions);

    // Initial Observation
    if (animatedElements.length > 0) {
        console.log(`[Global] Found ${animatedElements.length} observable elements.`);
        animatedElements.forEach(el => window.globalObserver.observe(el));
    }

    // Global data-scrollto handler for smooth anchor scroll (Lenis or fallback)
    document.body.addEventListener('click', function (e) {
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

/**
 * v2.976 - Intelligence Loop Refresh
 */
/*
 * Ampere 3D Key Global Manager
 * Auto-initializes 3D keys when [data-ampere-key-3d] is present.
 */
// DISABLED FOR DEBUGGING (Unicorn Studio WebGL Conflict)
/*
(function () {
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

            // Appending a cache buster timestamp to ensure latest version is loaded
            // (Updates when global.js updates)
            const cacheBuster = new Date().getTime();

            // LOCAL DEV FALLBACK
            if (!componentUrl || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                componentUrl = './assets/js/ampere-3d-key.js';
            }

            // Append query string
            componentUrl += `?v=${cacheBuster}`;

            import(componentUrl)
                .then(({ Ampere3DKey }) => {
                    const initKeys = () => {
                        keyContainers.forEach(container => {
                            // Avoid double initialization
                            if (container.dataset.keyInitialized) return;
                            container.dataset.keyInitialized = "true";

                            const instance = new Ampere3DKey(container);

                            // Register with Global Observer
                            container._key3dInstance = instance;
                            if (window.globalObserver) {
                                window.globalObserver.observe(container);
                            }

                            // Hook into Lenis if available
                            if (window.lenis) {
                                window.lenis.on('scroll', () => {
                                    // Optimization: Skip calculation if off-screen (managed by Global Observer)
                                    if (instance.isVisible === false) return;

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
                                    if (instance.isVisible === false) return;

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

// ... (End of previous file content)

/*
 * FAQ Accordion Animation (WAAPI) - Refined v2
 * Provides smooth open/close transitions for <details> elements.
 * Handles rapid clicking, prevents layout flashing, and uses custom easing.
 */
document.addEventListener('DOMContentLoaded', () => {
    const details = document.querySelectorAll('#faq-section details');

    details.forEach(detail => {
        const summary = detail.querySelector('summary');
        const content = detail.querySelector('summary + div');
        const chevron = summary ? summary.querySelector('.faq-chevron') : null; // Get the arrow
        let currentAnimation = null; // Store active animation to cancel on interrupt

        if (!summary || !content) return;

        // Ensure content is prepared for height animation
        content.style.overflow = 'hidden';
        content.style.display = 'block'; // Ensure it behaves as a block for height calc

        summary.addEventListener('click', (e) => {
            e.preventDefault();

            // Calculate height of the content content
            // We need to temporarily ensure it's visible to measure 'scrollHeight'
            // If it's closed, we momentarily open it but keep height locked if possible, 
            // or rely on the logic below.

            if (detail.open) {
                // --- CLOSING ---
                if (currentAnimation) currentAnimation.cancel();

                // Immediately rotate arrow back
                if (chevron) chevron.classList.remove('rotate-180');

                // 1. Measure current state
                const startHeight = content.offsetHeight;
                const style = window.getComputedStyle(content);
                const startPadBottom = style.paddingBottom;
                const startPadTop = style.paddingTop;

                // Lock dimensions
                content.style.height = startHeight + 'px';
                content.style.overflow = 'hidden';

                // 2. Play Animation
                currentAnimation = content.animate([
                    { height: startHeight + 'px', opacity: 1, paddingBottom: startPadBottom, paddingTop: startPadTop },
                    { height: '0px', opacity: 0, paddingBottom: '0px', paddingTop: '0px' }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
                });

                // 3. Cleanup on finish
                currentAnimation.onfinish = () => {
                    detail.removeAttribute('open');
                    content.style.height = '';
                    content.style.overflow = '';
                    currentAnimation = null;
                };

            } else {
                // --- OPENING ---

                // Auto-close other items (Accordion behavior)
                details.forEach(otherDetail => {
                    if (otherDetail !== detail && otherDetail.open) {
                        const otherSummary = otherDetail.querySelector('summary');
                        // Trigger the click logic for the other item so it animates closed
                        if (otherSummary) otherSummary.click();
                    }
                });

                if (currentAnimation) currentAnimation.cancel();

                // Immediately rotate arrow down
                if (chevron) chevron.classList.add('rotate-180');

                // 1. Open the element
                detail.setAttribute('open', '');
                content.style.overflow = 'hidden'; // Lock overflow

                // 2. Measure the natural height & styles
                const style = window.getComputedStyle(content);
                const targetPadBottom = style.paddingBottom;
                const targetPadTop = style.paddingTop;
                const endHeight = content.scrollHeight;

                // 3. Play Animation
                currentAnimation = content.animate([
                    { height: '0px', opacity: 0, paddingBottom: '0px', paddingTop: '0px' },
                    { height: endHeight + 'px', opacity: 1, paddingBottom: targetPadBottom, paddingTop: targetPadTop }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
                });

                currentAnimation.onfinish = () => {
                    content.style.height = '';
                    content.style.opacity = '';
                    content.style.overflow = ''; // Release overflow
                    currentAnimation = null;
                };
            }
        });
    });
});

// --- ROI Calculator Logic ---
(function () {
    const slider = document.getElementById('roi-calls');
    const displayCalls = document.getElementById('roi-calls-display');
    const displaySavings = document.getElementById('roi-savings');
    const displayHours = document.getElementById('roi-hours');

    if (!slider || !displayCalls || !displaySavings || !displayHours) return;

    function updateROI() {
        const calls = parseInt(slider.value, 10);

        // Assumptions:
        // - Average call handling time (including interruption context switching): 3 minutes
        // - Average hourly cost of employee (salary + benefits + overhead): $30/hr
        // - Cost per call = (3/60) * 30 = $1.50
        // - Revenue recovery factor (missed calls recovered): +$1.00 per call (conservative avg)
        // - Total Value per Call = $2.50

        const savings = Math.floor(calls * 2.5);
        const hours = Math.floor(calls * (3 / 60));

        displayCalls.textContent = calls.toLocaleString();
        displaySavings.textContent = '$' + savings.toLocaleString();
        displayHours.textContent = hours + 'h';

        // Update slider track background size for "fill" effect (Webkit)
        const min = parseInt(slider.min) || 0;
        const max = parseInt(slider.max) || 2500;
        const percentage = ((calls - min) / (max - min)) * 100;
        slider.style.backgroundSize = percentage + '% 100%';
    }

    // Initial update
    updateROI();

    // Event listener
    slider.addEventListener('input', updateROI);
})();

// Sync v2.894

// Force update v2.979

// --- Migrated from index-patches.js (v3.022) ---

// 1. Editor Hacks (Hide modal content on live site)
(function () {
    try {
        const hostname = window.location.hostname;
        const isLive = hostname.includes('workers.dev') ||
            hostname === 'getampere.ai' ||
            hostname.endsWith('.getampere.ai') ||
            hostname.includes('amperedigital.github.io');

        if (!isLive) return;

        var style = document.createElement('style');
        style.textContent = '[data-amp-modal-' + 'content] { display: none; }';
        document.head.appendChild(style);
    } catch (e) { }
})();

// 2. Mobile Menu Toggle
window.toggleMenu = function (trigger) {
    const menu = document.getElementById("mobile-menu");
    if (!menu) return;
    menu.classList.toggle("translate-x-full");
    const nowOpen = !menu.classList.contains("translate-x-full");
    const button =
        trigger?.classList?.contains("amp-hamburger") ?
            trigger :
            document.querySelector(".amp-hamburger[data-role='toggle']");
    if (button) {
        button.classList.toggle("is-open", nowOpen);
    }
};
