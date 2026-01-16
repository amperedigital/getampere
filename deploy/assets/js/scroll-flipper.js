/**
 * Scroll-Driven Card Stack (Direct 1:1 Control) v1.543
 * - Added Visibility Culling: Cards pushed offscreen are hidden.
 * - Adds 'will-change' optimization.
 * - Forces container relative positioning.
 */

(function() {
    console.log('[ScrollFlipper] Loading v1.543');

    let isRunning = false;
    let track, stickyContainer, cards, triggers;

    let attempts = 0;
    const MAX_ATTEMPTS = 15;

    const init = () => {
        try {
            track = document.querySelector('[data-scroll-track-container]');
            stickyContainer = document.querySelector('[data-sticky-cards]');
            cards = Array.from(document.querySelectorAll('[data-tab-card]'));
            triggers = Array.from(document.querySelectorAll('[data-tab-trigger]'));

            if (!track || !stickyContainer || !cards.length) {
                if (attempts < MAX_ATTEMPTS) {
                    attempts++;
                    setTimeout(init, 200);
                    return;
                }
                console.warn('[ScrollFlipper] Failed to find elements.');
                return;
            }

            console.log(`[ScrollFlipper] Ready. ${cards.length} cards.`);

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

            // Force container parent to be a positioning context
            if (stickyContainer) stickyContainer.style.position = 'sticky'; // Reinforced

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
            const viewportHeight = window.innerHeight;
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
                    // Future (Below)
                    y = delta * viewportHeight; 
                    rotX = Math.max(-25, delta * -15);
                    z = delta * -50;
                    opacity = 1.0;
                    
                    // CULLING: If card is more than 1.1 screens down, hide it
                    // This explicitly prevents it from rendering on top if transform fails
                    // or just saves GPU if it works. 
                    if (y > viewportHeight * 1.1) isOffscreen = true;

                } else {
                    // Past (Above/Active)
                    const d = Math.abs(delta);
                    y = -d * 100;
                    z = -d * 100;
                    opacity = 1.0; 
                }

                if (i === activeIdx) pointerEvents = 'auto';

                // Core Style Enforcement
                card.style.position = 'absolute';
                card.style.top = '0';
                card.style.left = '0';
                card.style.width = '100%';
                card.style.height = '100%'; // Ensure height
                card.style.willChange = 'transform';
                card.style.zIndex = 10 + i; 
                
                if (isOffscreen) {
                    card.style.visibility = 'hidden';
                } else {
                    card.style.visibility = 'visible';
                    card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg)`;
                }
                
                card.style.opacity = opacity;
                card.style.pointerEvents = pointerEvents;
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
