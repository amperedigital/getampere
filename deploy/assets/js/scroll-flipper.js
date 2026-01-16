/**
 * Scroll-Driven Card Stack (Direct 1:1 Control) v1.546
 * - FIX: Fallback for cardStackHeight (prevents y=0 collapse).
 * - FIX: Ensure Cards are absolutely stacked correctly.
 * - Logic: Deck Stack (Next Card Slides Over).
 */

(function() {
    console.log('[ScrollFlipper] Loading v1.546');

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

            // identify parent
            cardParent = cards[0].parentElement;
            if (cardParent) {
                cardParent.style.position = 'relative'; 
                // Force min-height if it collapsed
                if (cardParent.offsetHeight < 100) {
                     cardParent.style.minHeight = '650px';
                }
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
            
            // ROBUST HEIGHT CALCULATION
            let stackHeight = 650; // Default fallback
            if (cardParent && cardParent.offsetHeight > 0) stackHeight = cardParent.offsetHeight;
            else stackHeight = viewportHeight * 0.8;

            const rect = track.getBoundingClientRect();
            
            const startOffset = -rect.top + (viewportHeight * TRIGGER_OFFSET_FACTOR);
            let scrollProgress = startOffset / PIXELS_PER_CARD;

            let activeIdx = Math.floor(scrollProgress);
            // Allow negative index logic if needed, but for active state clamping:
            const safeIdx = Math.max(0, Math.min(activeIdx, cards.length - 1));

            updateMediaState(safeIdx);

            cards.forEach((card, i) => {
                const delta = i - scrollProgress;
                
                let y = 0, z = 0, rotX = 0, opacity = 1, pointerEvents = 'none';
                let isOffscreen = false;

                if (delta > 0) {
                    // --- FUTURE (Coming Up) ---
                    // y should be positive (downwards)
                    y = delta * stackHeight; 
                    
                    rotX = Math.max(-20, delta * -20);
                    z = delta * -50;
                    opacity = 1.0; 
                    
                    // CULLING
                    if (y > stackHeight * 1.5) isOffscreen = true;

                } else {
                    // --- PAST (Within Stack) ---
                    const d = Math.abs(delta);
                    
                    y = 0; 
                    z = -d * 100;
                    opacity = Math.max(0, 1 - (d * 1.2)); 
                }

                if (i === safeIdx) pointerEvents = 'auto';

                // Style Enforcement
                card.style.position = 'absolute';
                card.style.top = '0';
                card.style.left = '0';
                card.style.width = '100%';
                card.style.height = '100%';
                
                // Z-Index: Higher index covers lower index
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
                card.style.transition = 'none'; // Absolutely kill transitions
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
