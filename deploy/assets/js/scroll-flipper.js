/**
 * Scroll-Driven Card Stack v1.549 - DEBUG VERSION
 * - Adds console logs to debug position/stacking.
 * - Removes 'isOffscreen' optimization to ensure visibility.
 * - Enforces stackHeight fallback aggressively.
 */

(function() {
    console.log('[DEBUG v1.549] Script Loaded.');

    let isRunning = false;
    let track, stickyContainer, cards, triggers, cardParent;
    let attempts = 0;
    const MAX_ATTEMPTS = 30;

    // --- DEBUG ---
    let frameMod = 0;
    // -------------

    const init = () => {
        try {
            console.log('[DEBUG v1.549] init() called');
            track = document.querySelector('[data-scroll-track-container]');
            stickyContainer = document.querySelector('[data-sticky-cards]');
            cards = Array.from(document.querySelectorAll('[data-tab-card]'));
            triggers = Array.from(document.querySelectorAll('[data-tab-trigger]'));

            if (!track || !stickyContainer || !cards.length) {
                if (attempts < MAX_ATTEMPTS) {
                    attempts++;
                    console.warn(`[DEBUG] Attempt ${attempts}: Elements not found. Retrying...`);
                    setTimeout(init, 100);
                    return;
                }
                console.error('[DEBUG] FAILED to find elements after 30 attempts.');
                return;
            }

            // Setup Parent for height safety
            cardParent = cards[0].parentElement;
            if (cardParent) {
                cardParent.style.position = 'relative'; 
                cardParent.style.minHeight = '800px'; 
                console.log('[DEBUG] Parent Height enforced to min 800px');
            }

            console.log(`[DEBUG] Ready. Found ${cards.length} cards. Track found.`);

            // Click Nav
            triggers.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!track) return;
                    const viewportHeight = window.innerHeight;
                    const PIXELS_PER_CARD = viewportHeight * 0.75;
                    const TRIGGER_OFFSET_FACTOR = 0.25;
                    const rect = track.getBoundingClientRect();
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    const currentTop = rect.top + scrollTop;
                    const target = currentTop - (viewportHeight * TRIGGER_OFFSET_FACTOR) + (index * PIXELS_PER_CARD);

                    if (window.lenis) window.lenis.scrollTo(target, { duration: 1.2 });
                    else window.scrollTo({ top: target, behavior: 'smooth' });
                });
            });

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
        if (currentActiveIndex === index) return;
        currentActiveIndex = index;

        // Visual Active Class
        triggers.forEach((t, i) => {
            if (i === index) t.classList.add('active'); 
            else t.classList.remove('active');
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
    };

    const tick = () => {
        if (!isRunning) return;
        requestAnimationFrame(tick);
        render(); 
    };

    const render = () => {
        if (!track || !cards.length) return;

        try {
            frameMod++;
            const viewportHeight = window.innerHeight || 800;
            const PIXELS_PER_CARD = viewportHeight * 0.75;
            const TRIGGER_OFFSET_FACTOR = 0.25;
            
            // Log dimensions every 120 frames (~2 sec)
            const shouldLog = (frameMod % 120 === 0);

            // Determine Stack Height
            let stackHeight = 800; 
            if (cardParent && cardParent.offsetHeight > 100) {
                stackHeight = cardParent.offsetHeight;
            } else {
                 // Aggressive fallback
                 stackHeight = viewportHeight;
            }

            const rect = track.getBoundingClientRect();
            // rect.top is distance from viewport top to track top.
            // As we scroll down, rect.top becomes negative.
            // startOffset grows positive.
            const startOffset = -rect.top + (viewportHeight * TRIGGER_OFFSET_FACTOR);
            let scrollProgress = startOffset / PIXELS_PER_CARD;

            let activeIdx = Math.floor(scrollProgress);
            const safeIdx = Math.max(0, Math.min(activeIdx, cards.length - 1));

            updateMediaState(safeIdx);

            if (shouldLog) {
                console.log(`[DEBUG] ScrollProg: ${scrollProgress.toFixed(2)}, Active: ${safeIdx}, StackH: ${stackHeight}, TrackTop: ${rect.top.toFixed(0)}`);
            }

            cards.forEach((card, i) => {
                const delta = i - scrollProgress;
                
                let y = 0;
                
                // Z-Index: Card 1 (index 0) = 10. Card 2 (index 1) = 11.
                // Higher index covers lower.
                card.style.zIndex = 10 + i; 

                if (delta > 0) {
                    // FUTURE: Below viewport
                    y = delta * stackHeight;
                } else {
                    // PAST: Slide up slowly
                    y = delta * 50; 
                }

                // Force Styles
                card.style.position = 'absolute';
                card.style.top = '0';
                card.style.left = '0';
                card.style.width = '100%';
                card.style.height = '100%';
                card.style.willChange = 'transform';
                card.style.transition = 'none';

                // Apply without optimizations to verify visibility
                card.style.visibility = 'visible';
                card.style.opacity = '1';
                card.style.transform = `translate3d(0, ${y}px, 0)`;

                if (shouldLog && i < 3) {
                     console.log(`   Card ${i}: delta=${delta.toFixed(2)} y=${y.toFixed(0)} z=${card.style.zIndex}`);
                }

                if (i === safeIdx) card.style.pointerEvents = 'auto';
                else card.style.pointerEvents = 'none';
            });
        } catch (e) {
            console.error('[ScrollFlipper] Error in render:', e);
            isRunning = false; 
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
