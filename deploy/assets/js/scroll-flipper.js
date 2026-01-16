/**
 * Scroll-Driven Card Stack (Direct 1:1 Control) v1.544
 * - Features: Sticky Scroll, Fade-Out on Exit, Solid Entry.
 * - Fixes: "Top Card" Flash (Culling), Z-Index layering.
 */

(function() {
    console.log('[ScrollFlipper] Loading v1.544');

    let isRunning = false;
    let track, stickyContainer, cards, triggers;

    let attempts = 0;
    const MAX_ATTEMPTS = 20;

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
                console.warn('[ScrollFlipper] Failed to find elements.');
                return;
            }

            console.log(`[ScrollFlipper] Ready. ${cards.length} cards.`);

            // Click Nav
            triggers.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!track) return;
                    const PIXELS_PER_CARD = window.innerHeight * 0.75;
                    const TRIGGER_OFFSET_FACTOR = 0.25;
                    const rect = track.getBoundingClientRect();
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    const target = (rect.top + scrollTop) - (window.innerHeight * TRIGGER_OFFSET_FACTOR) + (index * PIXELS_PER_CARD);

                    if (window.lenis) window.lenis.scrollTo(target, { duration: 1.2 });
                    else window.scrollTo({ top: target, behavior: 'smooth' });
                });
            });

            // Force container context
            if (stickyContainer) stickyContainer.style.position = 'sticky'; 

            if (!isRunning) {
                isRunning = true;
                tick();
            }

        } catch (e) {
            console.error('[ScrollFlipper] Init Error:', e);
        }
    };

    let currentActiveIndex = -1;

    const updateMediaState = (index) => {
        try {
            if (currentActiveIndex === index) return;
            currentActiveIndex = index;

            triggers.forEach((t, i) => {
                if (i === index) {
                    t.dataset.selected = "true";
                    t.setAttribute('aria-selected', 'true');
                    t.classList.add('active'); 
                } else {
                    delete t.dataset.selected;
                    t.setAttribute('aria-selected', 'false');
                    t.classList.remove('active');
                }
            });

            cards.forEach((c, i) => {
                const container = c.querySelector('[data-smil-container]');
                const v = c.querySelector('video');
                
                if (i === index) {
                    c.classList.add('active');
                    if (typeof window.triggerMedia === 'function' && container) window.triggerMedia(container, true);
                    if (v) v.play().catch(()=>{});
                } else {
                    c.classList.remove('active');
                    if (typeof window.triggerMedia === 'function' && container) window.triggerMedia(container, false);
                    if (v) v.pause();
                }
            });
        } catch (err) {}
    };

    const tick = () => {
        if (!isRunning) return;
        requestAnimationFrame(tick);
        render(); 
    };

    const render = () => {
        if (!track || !cards.length) return;

        try {
            const viewportHeight = window.innerHeight || 800;
            const PIXELS_PER_CARD = viewportHeight * 0.75;
            const TRIGGER_OFFSET_FACTOR = 0.25;

            const rect = track.getBoundingClientRect();
            
            // Logic
            const startOffset = -rect.top + (viewportHeight * TRIGGER_OFFSET_FACTOR);
            let scrollProgress = startOffset / PIXELS_PER_CARD;

            let activeIdx = Math.floor(scrollProgress);
            activeIdx = Math.max(0, Math.min(activeIdx, cards.length - 1));

            updateMediaState(activeIdx);

            cards.forEach((card, i) => {
                const delta = i - scrollProgress;
                
                let y = 0, z = 0, rotX = 0, opacity = 1, pointerEvents = 'none';
                let isOffscreen = false;

                if (delta > 0) {
                    // --- FUTURE (Coming Up) ---
                    // Position: Below viewport, sliding up.
                    // Opacity: Solid (1.0) so it covers the card behind it.
                    
                    y = delta * viewportHeight; 
                    
                    // Tilt back slightly as it enters
                    rotX = Math.max(-25, delta * -15);
                    z = delta * -50;
                    opacity = 1.0; 
                    
                    // CULLING: Hide if significantly offscreen to prevent "Stacking on top" bugs on load
                    if (y > viewportHeight * 1.5) isOffscreen = true;

                } else {
                    // --- PAST (Being Covered) ---
                    // Position: Stays roughly put, moves up slightly (parallax).
                    // Opacity: FADES OUT as it gets covered.
                    
                    const d = Math.abs(delta);
                    
                    // Move up slightly slower than the incoming card (Parallax)
                    y = -d * 100; 
                    z = -d * 100;
                    
                    // Fade Out: 1.0 -> 0.0 as delta goes 0 -> 1
                    opacity = Math.max(0, 1 - d);
                }

                if (i === activeIdx) pointerEvents = 'auto';

                // Render
                card.style.position = 'absolute';
                card.style.top = '0';
                card.style.left = '0';
                card.style.width = '100%';
                card.style.height = '100%';
                
                // Z-Index: Higher index is ALWAYS on top.
                card.style.zIndex = 10 + i; 
                
                if (isOffscreen) {
                     card.style.visibility = 'hidden';
                } else {
                     card.style.visibility = 'visible';
                     card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg)`;
                }
                
                card.style.opacity = opacity;
                card.style.pointerEvents = pointerEvents;
                card.style.willChange = 'transform, opacity';
                card.style.transition = 'none';
            });
        } catch (e) {
            console.error(e);
            isRunning = false; 
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
