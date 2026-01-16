/**
 * Scroll-Driven Card Stack v1.557 - Fix Initial Activation
 * - ENHANCEMENT: Ensures SMIL/Media triggers retry until global.js loads.
 * - PREVIOUS: Timing Fix (90%), Stickiness, Visibility retained.
 */

(function() {
    console.log('[ScrollFlipper v1.557] Loading Retry-Enabled Mode...');

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

            // --- TRACK HEIGHT SYNC ---
            const viewportHeight = window.innerHeight;
            const PIXELS_PER_CARD = viewportHeight * 2.0; 
            const requiredTrackHeight = (cards.length * PIXELS_PER_CARD) + viewportHeight;
            
            track.style.setProperty('height', `${requiredTrackHeight}px`, 'important');
            track.style.setProperty('position', 'relative', 'important');

            // --- STICKY CONTAINER ENFORCEMENT ---
            if (stickyContainer) {
                stickyContainer.style.setProperty('position', 'sticky', 'important');
                stickyContainer.style.setProperty('top', '100px', 'important');
                stickyContainer.style.setProperty('overflow', 'hidden', 'important'); 
                stickyContainer.style.setProperty('max-height', 'calc(100vh - 100px)', 'important');
                stickyContainer.style.setProperty('height', 'calc(100vh - 100px)', 'important'); 
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
                    const vh = window.innerHeight;
                    const ppc = vh * 2.0; 
                    const rect = track.getBoundingClientRect();
                    const absoluteTrackTop = rect.top + window.scrollY;
                    const target = absoluteTrackTop + (index * ppc); 

                    if (window.lenis) window.lenis.scrollTo(target, { duration: 1.5 });
                    else window.scrollTo({ top: target, behavior: 'smooth' });
                });
            });

            if (!isRunning) {
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
        // RETRY LOGIC: If global.js hasn't loaded 'triggerMedia' yet, 
        // we must NOT lock in the state (currentActiveIndex), 
        // so that we keep retrying every frame until it is available.
        const mediaReady = typeof window.triggerMedia === 'function';

        if (currentActiveIndex === index && mediaReady) return;
        
        // Only lock state if we are actually capable of triggering media
        if (mediaReady) {
            currentActiveIndex = index;
        }

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
                if (mediaReady && container) window.triggerMedia(container, true);
                if (v) v.play().catch(()=>{});
            } else {
                c.classList.remove('active');
                if (mediaReady && container) window.triggerMedia(container, false);
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
            const rect = track.getBoundingClientRect();
            const dist = -rect.top; 
            
            let scrollProgress = dist / PIXELS_PER_CARD;

            let activeIdx = Math.floor(scrollProgress + 0.1); 
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
                        y = 2000; // Nuclear safe zone
                    } else {
                        // TRANSITION PHASE [0.6 -> 0]
                        const ratio = delta / ENTRY_THRESHOLD;
                        y = ratio * 650; 
                        
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
                
                if (delta > 0.6) {
                     card.style.setProperty('opacity', '0', 'important');
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
