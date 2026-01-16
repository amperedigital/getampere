/**
 * Scroll-Driven Card Stack (Direct 1:1 Control) v1.540
 * - Uses requestAnimationFrame for guaranteed execution loop.
 * - Robust error handling.
 * - Ensures cards start "pushed down" immediately.
 */

(function() {
    console.log('[ScrollFlipper] Loading v1.540');

    let isRunning = false;
    let track, stickyContainer, cards, triggers;

    const init = () => {
        try {
            track = document.querySelector('[data-scroll-track-container]');
            stickyContainer = document.querySelector('[data-sticky-cards]');
            cards = Array.from(document.querySelectorAll('[data-tab-card]'));
            triggers = Array.from(document.querySelectorAll('[data-tab-trigger]'));

            if (!track || !stickyContainer || !cards.length) {
                console.warn('[ScrollFlipper] Missing elements:', { track, stickyContainer, cardsLen: cards?.length });
                return;
            }

            // Click Nav
            triggers.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!track) return;
                    const PIXELS_PER_CARD = window.innerHeight * 0.75;
                    const TRIGGER_OFFSET_FACTOR = 0.25;
                    
                    const rect = track.getBoundingClientRect();
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    const trackTopAbs = rect.top + scrollTop;
                    const target = trackTopAbs - (window.innerHeight * TRIGGER_OFFSET_FACTOR) + (index * PIXELS_PER_CARD);

                    if (window.lenis) {
                        window.lenis.scrollTo(target, { duration: 1.2 });
                    } else {
                        window.scrollTo({ top: target, behavior: 'smooth' });
                    }
                });
            });

            // Start Loop
            isRunning = true;
            tick();

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
                    if (window.triggerMedia && container) window.triggerMedia(container, true);
                    if (v) v.play().catch(()=>{});
                } else {
                    c.classList.remove('active');
                    if (window.triggerMedia && container) window.triggerMedia(container, false);
                    if (v) v.pause();
                }
            });
        } catch (err) {
            // ignore media errors
        }
    };

    const tick = () => {
        if (!isRunning) return;
        requestAnimationFrame(tick);
        render(); // Run every frame
    };

    const render = () => {
        if (!track || !cards.length) return;

        try {
            const viewportHeight = window.innerHeight;
            const PIXELS_PER_CARD = viewportHeight * 0.75;
            const TRIGGER_OFFSET_FACTOR = 0.25;

            const rect = track.getBoundingClientRect();
            
            // Calculate Logic
            const startOffset = -rect.top + (viewportHeight * TRIGGER_OFFSET_FACTOR);
            let scrollProgress = startOffset / PIXELS_PER_CARD;

            let activeIdx = Math.floor(scrollProgress);
            activeIdx = Math.max(0, Math.min(activeIdx, cards.length - 1));

            updateMediaState(activeIdx);

            cards.forEach((card, i) => {
                const delta = i - scrollProgress;
                
                let y = 0, z = 0, rotX = 0, opacity = 1, pointerEvents = 'none';

                if (delta > 0) {
                    // Coming Up (Below)
                    // Ensure delta=3 pushes well offscreen
                    y = delta * viewportHeight; 
                    
                    // Simple tilt
                    rotX = Math.max(-25, delta * -15);
                    z = delta * -50;
                    opacity = 1.0;
                } else {
                    // Past (Active/Above)
                    const d = Math.abs(delta);
                    y = -d * 100;
                    z = -d * 100;
                    opacity = 1.0; // Keep solid
                }

                if (i === activeIdx) pointerEvents = 'auto';

                // Safety Z-Index
                // Higher index MUST be on top to slide over
                card.style.zIndex = 10 + i; 
                
                card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg)`;
                card.style.opacity = opacity;
                card.style.pointerEvents = pointerEvents;
                card.style.transition = 'none';
            });
        } catch (e) {
            console.error('[ScrollFlipper] Render Error:', e);
            isRunning = false; // Stop loop if fatal
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
