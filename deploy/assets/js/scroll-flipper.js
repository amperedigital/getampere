/**
 * Scroll-Driven Card Stack v1.565 - Performance Optimization
 * - OPTIMIZATION: Content Culling (Opacity 0 for covered card content).
 * - OPTIMIZATION: Mobile Guard (Disabled on <768px).
 * - OPTIMIZATION: Transform dirty checking (0 DOM writes when idle).
 * - OPTIMIZATION: "Dirty checking" to only write DOM when values change.
 * - OPTIMIZATION: Static properties moved out of render loop.
 */

(function() {
    console.log('[ScrollFlipper v3.137-test] Loading High-Performance Mode...');

    let isRunning = false;
    let track, stickyContainer, cards, triggers, cardParent;
    let attempts = 0;
    const MAX_ATTEMPTS = 30;

    // Cache for performance
    const metrics = {
        viewportHeight: 0,
        pixelsPerCard: 0,
        trackTopAbsolute: 0
    };

    // Card State Cache (to avoid querying DOM or rewriting unchanged styles)
    let cardCache = [];

    const init = () => {
        try {
            track = document.querySelector('[data-scroll-track-container]');
            stickyContainer = document.querySelector('[data-sticky-cards]');
            cards = Array.from(document.querySelectorAll('[data-tab-card]'));
            triggers = Array.from(document.querySelectorAll('[data-tab-trigger]'));

            if (!track || !stickyContainer || !cards.length) {
                if (attempts < MAX_ATTEMPTS) {
                    attempts++;
                    setTimeout(init, 100);
                    return;
                }
                return;
            }

            // --- 1. PRE-CALCULATE STATIC PROPS & CACHE ELEMENTS ---
            // Only apply static 3D styles on Desktop
            const isDesktop = window.innerWidth >= 768;
            
            cardCache = cards.map((card, i) => {
                const zIndex = 10 + i;
                
                if (isDesktop) {
                    // Set static styles ONCE for Desktop 3D mode
                    card.style.setProperty('z-index', zIndex.toString(), 'important');
                    card.style.setProperty('display', 'block', 'important');
                    card.style.setProperty('transform-origin', 'center top', 'important');
                    card.style.setProperty('will-change', 'transform, opacity', 'important');
                    // Background removed to allow rounded corners of inner container to show
                    card.style.removeProperty('background-color');
                    card.style.setProperty('transition', 'none', 'important');
                } else {
                    // Mobile: Ensure cleanup of any previous inline styles if resized from desktop
                    card.style.removeProperty('z-index');
                    card.style.removeProperty('display');
                    card.style.removeProperty('transform-origin');
                    card.style.removeProperty('will-change');
                    card.style.removeProperty('background-color');
                    card.style.removeProperty('transition');
                    card.style.removeProperty('transform');
                    card.style.removeProperty('opacity');
                }

                // Return cache object
                return {
                    el: card,
                    // Cache the inner content wrapper (direct child with z-10 usually, or the second child)
                    // Based on HTML: card > outer-div > [bg, content-div]
                    // We want the content div.
                    content: card.querySelector('.z-10.relative'),  // Simplified selector
                    smil: card.querySelector('[data-smil-container]'),
                    video: card.querySelector('video'),
                    // State tracking to prevent redundant writes
                    lastOpacity: -1,
                    lastContentOpacity: -1, // New optimization state
                    lastEvents: '',
                    lastVisibility: '',
                    lastTransform: '' // Optimization: Track transform string
                };
            });

            // --- 2. STICKY & LAYOUT SETUP ---
            if (stickyContainer) {
                if (isDesktop) {
                    stickyContainer.style.setProperty('position', 'sticky', 'important');
                    stickyContainer.style.setProperty('top', '140px', 'important');
                    stickyContainer.style.setProperty('overflow', 'hidden', 'important'); 
                    stickyContainer.style.setProperty('height', 'calc(100vh - 140px)', 'important'); 
                    stickyContainer.style.setProperty('max-height', 'calc(100vh - 140px)', 'important');
                } else {
                    stickyContainer.style.removeProperty('position');
                    stickyContainer.style.removeProperty('top');
                    stickyContainer.style.removeProperty('overflow');
                    stickyContainer.style.removeProperty('height');
                    stickyContainer.style.removeProperty('max-height');
                }
            }

            cardParent = cards[0].parentElement;
            if (cardParent) {
                if (isDesktop) {
                    cardParent.style.setProperty('position', 'relative', 'important');
                    cardParent.style.setProperty('height', '650px', 'important'); 
                    cardParent.style.setProperty('perspective', '1000px', 'important');
                    cardParent.style.setProperty('perspective-origin', '50% 20%', 'important'); 
                } else {
                    cardParent.style.removeProperty('position');
                    cardParent.style.removeProperty('height');
                    cardParent.style.removeProperty('perspective');
                    cardParent.style.removeProperty('perspective-origin');
                }
            }

            // --- 3. METRIC CALCULATION ---
            updateMetrics();
            window.addEventListener('resize', () => {
                // simple reload on resize across breakpoint to reset styles cleanly
                const newDesktop = window.innerWidth >= 768;
                if (newDesktop !== isDesktop) {
                    location.reload(); 
                    return;
                }
                updateMetrics();
            });

            // --- 4. NAVIGATION ---
            triggers.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Refined scroll target calc
                    const target = metrics.trackTopAbsolute + (index * metrics.pixelsPerCard);
                    if (window.lenis) window.lenis.scrollTo(target, { duration: 1.5 });
                    else window.scrollTo({ top: target, behavior: 'smooth' });
                });
            });

            // --- 5. VISIBILITY OPTIMIZATION (Wake on Scroll) ---
            // Only run the RAF loop when the section is actually in or near the viewport.
            // This prevents "Inspector Calculation" noise when at the top of the page.
            const observer = new IntersectionObserver((entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    if (!isRunning) {
                        isRunning = true;
                        tick(); // Wake up
                    }
                } else {
                    isRunning = false; // Go to sleep (stops RAF)
                }
            }, { rootMargin: '200px 0px 200px 0px' }); // Pre-load slightly before entry
            
            observer.observe(track);

        } catch (e) {
            console.error('[ScrollFlipper] Init Error:', e);
        }
    };

    const updateMetrics = () => {
        if (!track || !cards.length) return;
        
        // On mobile, we DO NOT force track height. 
        // We let the natural stacked content dictate height.
        if (window.innerWidth < 768) {
            track.style.removeProperty('height');
            return;
        }
        
        metrics.viewportHeight = window.innerHeight;
        metrics.pixelsPerCard = metrics.viewportHeight * 2.0;

        // Sync Track Height
        const requiredHeight = (cards.length * metrics.pixelsPerCard) + metrics.viewportHeight;
        track.style.setProperty('height', `${requiredHeight}px`, 'important');

        // Cache absolute position. 
        // Note: resizing might shift layout, so we grab rect + scrollY
        const rect = track.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        metrics.trackTopAbsolute = rect.top + scrollTop;
    };

    let currentActiveIndex = -1;

    const updateMediaState = (index) => {
        // Retry logic for global.js
        const mediaReady = typeof window.triggerMedia === 'function';
        if (currentActiveIndex === index && mediaReady) return;
        if (mediaReady) currentActiveIndex = index;

        // Update Triggers (DOM write)
        triggers.forEach((t, i) => {
            if (i === index) {
                if (t.dataset.selected !== "true") {
                    t.dataset.selected = "true";
                    t.setAttribute('aria-selected', 'true');
                    t.classList.add('active'); 
                }
            } else {
                if (t.dataset.selected) {
                    delete t.dataset.selected;
                    t.setAttribute('aria-selected', 'false');
                    t.classList.remove('active');
                }
            }
        });

        // Update Media (using Cache)
        cardCache.forEach((cache, i) => {
            if (i === index) {
                cache.el.classList.add('active');
                if (mediaReady && cache.smil) window.triggerMedia(cache.smil, true);
                if (cache.video) cache.video.play().catch(()=>{});
            } else {
                cache.el.classList.remove('active');
                if (mediaReady && cache.smil) window.triggerMedia(cache.smil, false);
                if (cache.video) cache.video.pause();
            }
        });
    };

    const tick = () => {
        if (!isRunning) return;
        requestAnimationFrame(tick);
        if (window.innerWidth >= 768) render(); 
    };

    const render = () => {
        if (!track) return;

        // FAST READ: No layout thrashing (getBoundingClientRect removed from loop)
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const dist = scrollTop - metrics.trackTopAbsolute; 
        
        // Note: dist is acts like (-rect.top). 
        // If scrollTop == trackTop, dist = 0.
        // If scrollTop > trackTop (scrolled down), dist > 0.
        
        let scrollProgress = dist / metrics.pixelsPerCard;

        let activeIdx = Math.floor(scrollProgress + 0.1); 
        const safeIdx = Math.max(0, Math.min(activeIdx, cards.length - 1));

        updateMediaState(safeIdx);

        // BATCH WRITE
        for (let i = 0; i < cardCache.length; i++) {
            const cache = cardCache[i];
            const delta = i - scrollProgress;
            
            let y = 0, rotX = 0, rotY = 0, rotZ = 0, scale = 1;

            // Logic matching v1.557
            if (delta > 0) {
                const ENTRY_THRESHOLD = 0.6; 
                if (delta > ENTRY_THRESHOLD) {
                    y = 2000; 
                } else {
                    const ratio = delta / ENTRY_THRESHOLD;
                    y = ratio * 650; 
                    const angleRatio = Math.min(1, ratio);
                    rotX = angleRatio * -25;
                    rotZ = angleRatio * -2; 
                    rotY = angleRatio * 2;
                }
            } else {
                y = delta * 50; 
                scale = Math.max(0.9, 1 - (Math.abs(delta) * 0.05));
                rotX = 0; rotZ = 0; rotY = 0;
            }

            // Always write transform (it animates constantly)
            const transformString = `translate3d(0, ${y}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`;
            
            if (cache.lastTransform !== transformString) {
                cache.el.style.setProperty('transform', transformString, 'important');
                cache.lastTransform = transformString;
            }
            
            // SMART UPDATES: Opacity (Whole Card - Exit)
            const targetOpacity = (delta > 0.6) ? '0' : '1';
            if (cache.lastOpacity !== targetOpacity) {
                cache.el.style.setProperty('opacity', targetOpacity, 'important');
                cache.lastOpacity = targetOpacity;
            }

            // SMART UPDATES: Content Opacity (Optimization: Hide content of covered cards)
            // If delta <= -0.9 (card is mostly covered by the next card), hide content.
            // EXCEPTION: The last card should never have its content culled, as nothing covers it.
            if (cache.content) {
                const isLastCard = (i === cardCache.length - 1);
                const contentOpacity = (delta <= -0.9 && !isLastCard) ? '0' : '1';
                
                if (cache.lastContentOpacity !== contentOpacity) {
                    cache.content.style.setProperty('opacity', contentOpacity, 'important');
                    cache.content.style.setProperty('transition', 'opacity 0.3s ease', 'important'); 
                    cache.lastContentOpacity = contentOpacity;
                    // Helper for debugging
                    cache.content.dataset.culled = (contentOpacity === '0') ? 'true' : 'false';
                }
            }

            // SMART UPDATES: Pointer Events
            const targetEvents = (i === safeIdx) ? 'auto' : 'none';
            if (cache.lastEvents !== targetEvents) {
                cache.el.style.setProperty('pointer-events', targetEvents, 'important');
                cache.lastEvents = targetEvents;
            }

            // SMART UPDATES: Visibility
            // We can just keep it visible as we control opacity/pos, but let's stick to 'visible'
            if (cache.lastVisibility !== 'visible') {
                cache.el.style.setProperty('visibility', 'visible', 'important');
                cache.lastVisibility = 'visible';
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
// Sync v2.894

// Force update v2.979
