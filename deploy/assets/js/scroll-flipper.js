/**
 * Scroll-Driven Card Stack (Direct 1:1 Control) v1.545
 * - Fixes: Layout context (Tab Overlap). Corrects stacking logic.
 * - Logic: "Deck" Style.
 *   - Active/Past Card: Pins at Top, Pushes back Z, Fades Out.
 *   - Future Card: Slides UP from bottom, Solid Opacity.
 */

(function() {
    console.log('[ScrollFlipper] Loading v1.545');

    let isRunning = false;
    let track, stickyContainer, cards, triggers, cardParent;

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

            // Identify Parent to confine absolute positioning
            cardParent = cards[0].parentElement;
            if (cardParent) {
                // Enforce relative context so cards stack INSIDE this box, not the page
                cardParent.style.position = 'relative';
                // Remove grid/flex that might fight with absolute
                // (It's okay if it stays grid, absolute children ignore it mostly)
                
                // Ensure parent has height
                // The HTML usually has h-[650px]
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

            // Force sticky context
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
            // Visual height of the container to slide past
             const cardStackHeight = cardParent ? cardParent.offsetHeight : viewportHeight;

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
                    // --- FUTURE (Below) ---
                    // Moves from Bottom -> Top
                    // 100vh down when delta=1. 0 when delta=0.
                    y = delta * cardStackHeight; 
                    
                    // Simple tilt for entry
                    rotX = Math.max(-20, delta * -20);
                    
                    // Solid Opacity (User Request: "Card shown is on top")
                    opacity = 1.0; 
                    
                    // CULLING
                    if (y > cardStackHeight * 1.5) isOffscreen = true;

                } else {
                    // --- PAST (Active/Above) ---
                    // Stays Pinned at 0 (or slight parallax up)
                    // Pushes back into Z
                    // Fades Out
                    
                    const d = Math.abs(delta);
                    
                    // Parallax: Move up 20% speed
                    y = 0; // -d * (cardStackHeight * 0.1); 
                    
                    // Push back
                    // Reference says -46px. Let's do roughly -100px per step
                    z = -d * 100;
                    
                    // Fade Out
                    // "Slowly being reduced"
                    // 1.0 -> 0.0
                    opacity = Math.max(0, 1 - (d * 1.2)); // Fade slightly faster than scroll to prevent mess
                }

                if (i === activeIdx) pointerEvents = 'auto';

                // Style Enforcement
                card.style.position = 'absolute';
                card.style.top = '0';
                card.style.left = '0';
                card.style.width = '100%';
                card.style.height = '100%';
                
                // Z-Index hierarchy
                // 0 is bottom, 1 is above it, 2 is above that.
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
