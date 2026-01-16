/**
 * Scroll-Driven Card Stack v1.550 - NUCLEAR CSS OVERRIDE
 * - Overrides ALL Tailwind/CSS classes with !important inline styles.
 * - Forces correct stacking (Cards 0..3).
 * - Forces visibility and position.
 * - Cleans conflicting classes on init.
 */

(function() {
    console.log('[ScrollFlipper v1.550] Loading Nuclear Mode...');

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

            // --- CSS CLEANUP & PARENT SETUP ---
            cardParent = cards[0].parentElement;
            if (cardParent) {
                cardParent.style.setProperty('position', 'relative', 'important');
                cardParent.style.setProperty('min-height', '800px', 'important');
                // Ensure no flex/grid weirdness on parent
                cardParent.style.setProperty('display', 'block', 'important'); 
            }

            cards.forEach(c => {
                // Remove conflicting Tailwind logic classes if possible
                c.classList.remove('inactive-prev', 'inactive-next', 'md:opacity-0');
                
                // FORCE RESET
                c.style.cssText = `
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    transform-origin: center !important;
                    will-change: transform !important;
                    transition: none !important;
                `;
            });
            // ----------------------------------

            console.log(`[ScrollFlipper] Ready. ${cards.length} cards. Forced Styles Applied.`);

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
                // Keep .active for internal animations
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
            
            // Stack Height Calculation
            let stackHeight = 800; 
            if (cardParent && cardParent.offsetHeight > 100) {
                stackHeight = cardParent.offsetHeight;
            } else {
                stackHeight = viewportHeight; // Fallback
            }

            const rect = track.getBoundingClientRect();
            const startOffset = -rect.top + (viewportHeight * TRIGGER_OFFSET_FACTOR);
            let scrollProgress = startOffset / PIXELS_PER_CARD;

            let activeIdx = Math.floor(scrollProgress);
            const safeIdx = Math.max(0, Math.min(activeIdx, cards.length - 1));

            updateMediaState(safeIdx);

            cards.forEach((card, i) => {
                const delta = i - scrollProgress;
                
                let y = 0;
                
                // Z-INDEX: Card 0 = 10, Card 1 = 11, Card 3 = 13.
                // Higher index MUST cover lower index.
                const zIndex = 10 + i;

                if (delta > 0) {
                    // FUTURE (Below):
                    y = delta * stackHeight;
                } else {
                    // PAST (Top):
                    y = delta * 50; 
                }

                // NUCLEAR APPLICATION
                // We use setProperty with 'important' to guarantee override
                card.style.setProperty('z-index', zIndex.toString(), 'important');
                card.style.setProperty('transform', `translate3d(0, ${y}px, 0)`, 'important');
                card.style.setProperty('opacity', '1', 'important'); 
                card.style.setProperty('visibility', 'visible', 'important');
                card.style.setProperty('display', 'block', 'important'); // Ensure not hidden

                // Event Pointer Safety
                if (i === safeIdx) card.style.setProperty('pointer-events', 'auto', 'important');
                else card.style.setProperty('pointer-events', 'none', 'important');
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
