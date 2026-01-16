/**
 * Scroll-Driven Card Stack v1.552 - Delayed Entry & Extended Scroll
 * - DELAYED ENTRY: Next card stays fully offscreen for 40% of the scroll section.
 * - EXTENDED SCROLL: Increased PIXELS_PER_CARD to allow for reading time before transition.
 * - PHYSICS: 'Flip' animation synced to the delayed entry.
 */

(function() {
    console.log('[ScrollFlipper v1.552] Loading Delayed Entry Mode...');

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
                cardParent.style.setProperty('display', 'block', 'important');
                // 3D STAGE
                cardParent.style.setProperty('perspective', '1000px', 'important');
                cardParent.style.setProperty('perspective-origin', '50% 20%', 'important'); 
            }

            cards.forEach(c => {
                c.classList.remove('inactive-prev', 'inactive-next', 'md:opacity-0');
                
                // FORCE RESET with preserve-3d
                c.style.cssText = `
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    transform-origin: center top !important; 
                    transform-style: preserve-3d !important;
                    will-change: transform !important;
                    transition: none !important;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5) !important; /* Shadow UPWARDS to cast on prevented card */
                    background-color: #000 !important; 
                `;
            });
            // ----------------------------------

            console.log(`[ScrollFlipper] Ready. ${cards.length} cards.`);

            // Click Nav (Modified for new height)
            triggers.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!track) return;
                    const viewportHeight = window.innerHeight;
                    
                    // MUST MATCH RENDER LOGIC
                    const PIXELS_PER_CARD = viewportHeight * 2.0; 
                    
                    const TRIGGER_OFFSET_FACTOR = 0.1; // Start a bit earlier
                    const rect = track.getBoundingClientRect();
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    const currentTop = rect.top + scrollTop;
                    const target = currentTop - (viewportHeight * TRIGGER_OFFSET_FACTOR) + (index * PIXELS_PER_CARD);

                    if (window.lenis) window.lenis.scrollTo(target, { duration: 1.5 });
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
            
            // --- PACING CONFIG ---
            const PIXELS_PER_CARD = viewportHeight * 2.0; // Slower scroll (more reading time)
            
            // Start detection slightly earlier so index doesn't flip too late
            const TRIGGER_OFFSET_FACTOR = 0.1; 
            
            let stackHeight = 800; 
            if (cardParent && cardParent.offsetHeight > 100) {
                stackHeight = cardParent.offsetHeight;
            } else {
                stackHeight = viewportHeight; 
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
                let rotX = 0;
                let scale = 1;
                const zIndex = 10 + i;

                if (delta > 0) {
                    // FUTURE (Coming Up)
                    
                    // --- DELAYED ENTRY LOGIC ---
                    // "The card on top needs to be flat for a bit longer"
                    // We map delta [1.0 -> 0.0] to Movement [1.0 -> 0.0]
                    // But we want it to stay at 1.0 (Offscreen) until delta hits threshold.
                    
                    const ENTRY_THRESHOLD = 0.6; // Waiting until 40% of scroll is passed
                    
                    // If delta is 0.8, ratio is 0.8/0.6 = 1.33 -> Clamped to 1.
                    // If delta is 0.3, ratio is 0.3/0.6 = 0.5.
                    const ratio = Math.min(1, delta / ENTRY_THRESHOLD);
                    
                    y = ratio * stackHeight;
                    rotX = ratio * -25; // Tilt back while waiting/moving

                } else {
                    // PAST (Underneath)
                    y = delta * 50; 
                    scale = Math.max(0.9, 1 - (Math.abs(delta) * 0.05));
                    rotX = 0;
                }

                // Apply Styles
                card.style.setProperty('z-index', zIndex.toString(), 'important');
                card.style.setProperty(
                    'transform', 
                    `translate3d(0, ${y}px, 0) rotateX(${rotX}deg) scale(${scale})`, 
                    'important'
                );
                card.style.setProperty('opacity', '1', 'important'); 
                card.style.setProperty('visibility', 'visible', 'important');
                card.style.setProperty('display', 'block', 'important');

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
