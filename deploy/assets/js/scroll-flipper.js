/**
 * Scroll-Driven Card Stack v1.554 - Sticky Fix & Visibility Clip
 * - FORCE STICKY: Explicitly sets top/max-height to ensure sticking.
 * - FORCE CLIP: Sets overflow:hidden on container to hide future cards.
 * - ANGLED PHYSICS: Maintains v1.553 down-left tilt.
 */

(function() {
    console.log('[ScrollFlipper v1.554] Loading Sticky Fix Mode...');

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

            // --- STICKY CONTAINER ENFORCEMENT ---
            // Fixes "Stickiness is gone" and "UC_004 visible"
            if (stickyContainer) {
                stickyContainer.style.setProperty('position', 'sticky', 'important');
                stickyContainer.style.setProperty('top', '100px', 'important'); // Safe offset
                // overflow: hidden is CRITICAL to hide the "waiting" cards below
                stickyContainer.style.setProperty('overflow', 'hidden', 'important'); 
                // Ensure it doesn't grow taller than viewport
                stickyContainer.style.setProperty('max-height', 'calc(100vh - 100px)', 'important');
            }

            // --- PARENT SETUP ---
            cardParent = cards[0].parentElement;
            if (cardParent) {
                cardParent.style.setProperty('position', 'relative', 'important');
                cardParent.style.setProperty('height', '650px', 'important'); // Fixed stage height
                cardParent.style.setProperty('min-height', '650px', 'important');
                cardParent.style.setProperty('display', 'block', 'important');
                
                // 3D STAGE
                cardParent.style.setProperty('perspective', '1000px', 'important');
                cardParent.style.setProperty('perspective-origin', '50% 20%', 'important'); 
            }

            cards.forEach(c => {
                c.classList.remove('inactive-prev', 'inactive-next', 'md:opacity-0');
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
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5) !important;
                    background-color: #000 !important; 
                `;
            });

            console.log(`[ScrollFlipper] Ready. ${cards.length} cards.`);

            // Click Nav
            triggers.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!track) return;
                    const viewportHeight = window.innerHeight;
                    const PIXELS_PER_CARD = viewportHeight * 2.0; 
                    const TRIGGER_OFFSET_FACTOR = 0.1;
                    const rect = track.getBoundingClientRect();
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    const currentTop = rect.top + scrollTop;
                    const target = currentTop - (viewportHeight * TRIGGER_OFFSET_FACTOR) + (index * PIXELS_PER_CARD);

                    if (window.lenis) window.lenis.scrollTo(target, { duration: 1.5 });
                    else window.scrollTo({ top: target, behavior: 'smooth' });
                });
            });

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
            const PIXELS_PER_CARD = viewportHeight * 2.0;
            const TRIGGER_OFFSET_FACTOR = 0.1; 
            
            // Fixed Stage Height to ensure y pushes offscreen relative to container
            let stackHeight = 650; 
            if (cardParent && cardParent.offsetHeight > 100) stackHeight = cardParent.offsetHeight;

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
                let rotY = 0;
                let rotZ = 0;
                let scale = 1;
                const zIndex = 10 + i;

                if (delta > 0) {
                    // FUTURE (Coming Up)
                    const ENTRY_THRESHOLD = 0.6; // 40% wait time
                    // Map [0.6 -> 0] to [1.0 -> 0.0]
                    // If delta > 0.6, result is > 1 (clamped to 1.1 to push further offscreen)
                    
                    let ratio = 0;
                    if (delta > ENTRY_THRESHOLD) {
                        // Fully wait pattern
                        ratio = 1.2; // Push 120% down
                    } else {
                        // Transition pattern [0.6 -> 0]
                        ratio = delta / ENTRY_THRESHOLD;
                    }
                    
                    y = ratio * stackHeight;
                    
                    // Angles match ratio 0->1
                    const angleRatio = Math.min(1, ratio);
                    rotX = angleRatio * -25;
                    rotZ = angleRatio * -2; 
                    rotY = angleRatio * 2;

                } else {
                    // PAST (Underneath)
                    y = delta * 50; 
                    scale = Math.max(0.9, 1 - (Math.abs(delta) * 0.05));
                    rotX = 0;
                    rotZ = 0;
                    rotY = 0;
                }

                card.style.setProperty('z-index', zIndex.toString(), 'important');
                card.style.setProperty(
                    'transform', 
                    `translate3d(0, ${y}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`, 
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
