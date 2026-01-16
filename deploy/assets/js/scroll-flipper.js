/**
 * Scroll-Driven Card Stack (Direct 1:1 Control) v1.542
 * - Added explicit initialization retry loop.
 * - Forces card visibility/stacking immediately on load.
 * - Debug border on track to confirm script execution.
 */

(function() {
    console.log('[ScrollFlipper] Loading v1.542');

    let isRunning = false;
    let track, stickyContainer, cards, triggers;

    // Retry initialization for up to 2 seconds if elements aren't found immediately
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    const init = () => {
        try {
            track = document.querySelector('[data-scroll-track-container]');
            stickyContainer = document.querySelector('[data-sticky-cards]');
            cards = Array.from(document.querySelectorAll('[data-tab-card]'));
            triggers = Array.from(document.querySelectorAll('[data-tab-trigger]'));

            if (!track || !stickyContainer || !cards.length) {
                if (attempts < MAX_ATTEMPTS) {
                    attempts++;
                    console.log(`[ScrollFlipper] Retry init ${attempts}/${MAX_ATTEMPTS}`);
                    setTimeout(init, 200);
                    return;
                }
                console.warn('[ScrollFlipper] Missing elements after retries.');
                return;
            }

            console.log(`[ScrollFlipper] Init success. ${cards.length} cards found.`);
            
            // Visual Debug confirmation (Internal use - can remove later)
            // track.style.border = "4px solid red"; 

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

            // Forces initial layout state
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
                    if (typeof window.triggerMedia === 'function' && container) {
                         window.triggerMedia(container, true);
                    }
                    if (v) v.play().catch(()=>{});
                } else {
                    c.classList.remove('active');
                    if (typeof window.triggerMedia === 'function' && container) {
                        window.triggerMedia(container, false);
                    }
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
        render(); 
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
                    // If delta >= 0.1, we start pushing it down.
                    // Card 3 (when 0 is active) -> delta=3 -> y=3vh -> Offscreen
                    y = delta * viewportHeight; 
                    
                    rotX = Math.max(-25, delta * -15);
                    z = delta * -50;
                    opacity = 1.0;
                } else {
                    // Past (Active/Above)
                    const d = Math.abs(delta);
                    // Push UP and BACK
                    y = -d * 100;
                    z = -d * 100;
                    opacity = 1.0; 
                }

                if (i === activeIdx) pointerEvents = 'auto';

                // Explicitly set styles to override any CSS
                card.style.position = 'absolute'; // Ensure they stack
                card.style.top = '0';
                card.style.left = '0';
                card.style.width = '100%';
                
                // Z-index: Higher index = Higher stacking context
                card.style.zIndex = 10 + i; 
                
                card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg)`;
                card.style.opacity = opacity;
                card.style.pointerEvents = pointerEvents;
                card.style.transition = 'none';
            });
        } catch (e) {
            console.error('[ScrollFlipper] Render Error:', e);
            isRunning = false; 
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
