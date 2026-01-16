/**
 * Scroll-Driven Card Stack v1.548
 * - LOGIC: Deck Stack (Ascending Z-Index).
 * - PHYSIC: Future cards start at bottom and slide UP to cover previous cards.
 * - VISUAL: No fading. 100% Solid overlap.
 */

(function() {
    console.log('[ScrollFlipper] Loading v1.548 (Solid Deck Stack)');

    let isRunning = false;
    let track, stickyContainer, cards, triggers, cardParent;
    let attempts = 0;
    const MAX_ATTEMPTS = 30;

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

            // Setup Parent for height safety
            cardParent = cards[0].parentElement;
            if (cardParent) {
                cardParent.style.position = 'relative'; 
                cardParent.style.minHeight = '700px'; // Prevent collapse
            }

            console.log(`[ScrollFlipper] Ready. ${cards.length} cards.`);

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
            
            // Height of the "Active Area" 
            // We use this to determine how far down the upcoming cards start.
            let stackHeight = 700; 
            if (cardParent && cardParent.offsetHeight > 100) {
                stackHeight = cardParent.offsetHeight;
            } else {
                stackHeight = viewportHeight * 0.8;
            }

            const rect = track.getBoundingClientRect();
            const startOffset = -rect.top + (viewportHeight * TRIGGER_OFFSET_FACTOR);
            let scrollProgress = startOffset / PIXELS_PER_CARD;

            let activeIdx = Math.floor(scrollProgress);
            const safeIdx = Math.max(0, Math.min(activeIdx, cards.length - 1));

            updateMediaState(safeIdx);

            cards.forEach((card, i) => {
                // delta > 0: This card is in the future (further down the list)
                // delta < 0: This card is in the past (scrolled by)
                const delta = i - scrollProgress;
                
                let y = 0;
                let opacity = 1;
                
                // Z-Index: 
                // To COVER the previous card, the later card must be higher.
                // Card 0: z=10. Card 1: z=11.
                // This ensures Card 1 physically renders ON TOP of Card 0.
                card.style.zIndex = 10 + i; 

                if (delta > 0) {
                    // FUTURE CARDS:
                    // They start physically lower down (y > 0).
                    // As delta approaches 0, y approaches 0 (sliding UP).
                    y = delta * stackHeight;
                } else {
                    // PAST CARDS:
                    // They stay pinned at y=0 to allow the next card to slide over them.
                    // We can add a tiny bit of parallax (negative y) so they don't look completely dead.
                    // But user asked for "Covering", so we keep them mostly still.
                    y = delta * 50; // Very slight upward movement as it gets covered
                }

                // If y > stackHeight, it's way off screen.
                // If y < -stackHeight, it's way above.
                let isOffscreen = (y > stackHeight * 1.5) || (y < -stackHeight);

                // Force Styles
                card.style.position = 'absolute';
                card.style.top = '0';
                card.style.left = '0';
                card.style.width = '100%';
                card.style.height = '100%';
                card.style.willChange = 'transform';
                card.style.transition = 'none'; // Physics controlled

                if (isOffscreen) {
                     card.style.visibility = 'hidden';
                } else {
                     card.style.visibility = 'visible';
                     card.style.transform = `translate3d(0, ${y}px, 0)`;
                }
                
                card.style.opacity = 1; // SOLID. No fade.

                if (i === safeIdx) card.style.pointerEvents = 'auto';
                else card.style.pointerEvents = 'none';
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
