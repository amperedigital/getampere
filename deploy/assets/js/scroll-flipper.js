/**
 * Scroll-Driven Card Stack v1.555 - Fix Track Height & Visibility
 * - FIX STICKY: Dynamic calculation of track height to match scroll logic.
 * - FIX VISIBILITY: Force "waiting" cards to be fully off-screen (viewport height).
 * - REINFORCE: Sticky/Overflow constraints.
 */

(function() {
    console.log('[ScrollFlipper v1.555] Loading Height Sync Mode...');

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

            // --- TRACK HEIGHT SYNC (CRITICAL FIX) ---
            // User reported stickiness ends too early ("scrolling away").
            // We must force the track height to match the JS animation timeline.
            const viewportHeight = window.innerHeight;
            const PIXELS_PER_CARD = viewportHeight * 2.0; // Same as render logic
            // timeline + 100vh buffer for the final resting state
            const requiredTrackHeight = (cards.length * PIXELS_PER_CARD) + viewportHeight;
            
            track.style.setProperty('height', `${requiredTrackHeight}px`, 'important');
            track.style.setProperty('position', 'relative', 'important');

            console.log(`[ScrollFlipper] Synced Track Height: ${requiredTrackHeight}px`);

            // --- STICKY CONTAINER ENFORCEMENT ---
            if (stickyContainer) {
                stickyContainer.style.setProperty('position', 'sticky', 'important');
                stickyContainer.style.setProperty('top', '100px', 'important');
                stickyContainer.style.setProperty('overflow', 'hidden', 'important'); 
                stickyContainer.style.setProperty('max-height', 'calc(100vh - 100px)', 'important');
                stickyContainer.style.setProperty('height', 'calc(100vh - 100px)', 'important'); // Explicit height
                stickyContainer.style.setProperty('z-index', '50', 'important');
            }

            // --- PARENT SETUP ---
            cardParent = cards[0].parentElement;
            if (cardParent) {
                cardParent.style.setProperty('position', 'relative', 'important');
                cardParent.style.setProperty('height', '650px', 'important'); 
                cardParent.style.setProperty('min-height', '650px', 'important');
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

            // Click Nav
            triggers.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!track) return;
                    // Recalculate context fresh on click
                    const vh = window.innerHeight;
                    const ppc = vh * 2.0; 
                    const rect = track.getBoundingClientRect();
                    const absoluteTrackTop = rect.top + window.scrollY;
                    const target = absoluteTrackTop + (index * ppc); // Simple mapping

                    if (window.lenis) window.lenis.scrollTo(target, { duration: 1.5 });
                    else window.scrollTo({ top: target, behavior: 'smooth' });
                });
            });

            if (!isRunning) {
                // Resize listener to keep height synced
                window.addEventListener('resize', () => {
                   const vh = window.innerHeight;
                   const ppc = vh * 2.0;
                   const h = (cards.length * ppc) + vh;
                   if (track) track.style.setProperty('height', `${h}px`, 'important');
                });

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
            const TRIGGER_OFFSET_FACTOR = 0.0; // 0 to align exactly with track top
            
            const rect = track.getBoundingClientRect();
            // How far have we scrolled into the track?
            // rect.top is positive when track starts below viewport top
            // rect.top is 0 when track starts at viewport top
            // we want 0 progress when rect.top = 0 (or some offset)
            
            // Adjust start point: slightly delayed so header clears? 
            // Stickiness starts at top:100px. 
            // So we want progress 0 when track.top is around 100px or 0.
            
            const dist = -rect.top; 
            // If track is at top of screen, dist is 0. 
            // If track has scrolled up 1000px, dist is 1000.
            
            let scrollProgress = dist / PIXELS_PER_CARD;

            let activeIdx = Math.floor(scrollProgress + 0.5); // Round to nearest for activation
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
                    const ENTRY_THRESHOLD = 0.6; 
                    
                    if (delta > ENTRY_THRESHOLD) {
                        // WAITING PHASE
                        // Force OFFSCREEN. 
                        // Using viewportHeight + 100 ensures it is physically below the fold
                        // regardless of parent height (unless parent is huge and visible).
                        // Since overflow:hidden is on parent, pushing it > parent height is simplest.
                        y = 2000; // Nuclear option: 2000px down.
                    } else {
                        // TRANSITION PHASE [0.6 -> 0]
                        // Map delta 0.6->0 to ratio 1->0
                        const ratio = delta / ENTRY_THRESHOLD;
                        y = ratio * 650; // Slide from bottom of stage (650) to top (0)
                        
                        // Angles
                        const angleRatio = Math.min(1, ratio);
                        rotX = angleRatio * -25;
                        rotZ = angleRatio * -2; 
                        rotY = angleRatio * 2;
                    }

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
                
                // Extra safety for the "visible but shouldn't be" case
                if (delta > 0.6) {
                     card.style.setProperty('opacity', '0', 'important'); // Hide completely while waiting
                } else {
                     card.style.setProperty('opacity', '1', 'important');
                }
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
