/**
 * Scroll-Driven Card Stack (Direct 1:1 Control) v1.539
 * - Mapped directly to scroll position.
 * - Restored Tab Click Navigation.
 * - Fixed Transparency/Stacking issues (Solid Cards).
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[ScrollFlipper] Initializing Direct-Drive Engine v1.539');

    const track = document.querySelector('[data-scroll-track-container]');
    const stickyContainer = document.querySelector('[data-sticky-cards]');
    const cards = Array.from(document.querySelectorAll('[data-tab-card]'));
    const triggers = Array.from(document.querySelectorAll('[data-tab-trigger]'));

    if (!track || !stickyContainer || !cards.length) {
        console.warn('[ScrollFlipper] Missing required elements. Aborting.');
        return;
    }

    // --- Configuration ---
    // Distance to scroll to flip one card
    const PIXELS_PER_CARD = window.innerHeight * 0.75; 
    const TRIGGER_OFFSET_FACTOR = 0.25; // 25% of viewport down is the "active" zone

    let currentActiveIndex = -1;

    // --- 1. Tab Click Navigation ---
    triggers.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Calculate target scroll position
            const currentRect = track.getBoundingClientRect();
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            const trackTopAbs = currentRect.top + currentScroll;
            
            // We want the scroll position where:
            // startOffset = index * PIXELS_PER_CARD
            // startOffset = -rect.top + (vh * offsetFactor)
            // => -rect.top = (index * PPC) - (vh * offsetFactor)
            // => rect.top = (vh * offsetFactor) - (index * PPC)
            // TargetScroll = trackTopAbs - TargetRectTop
            // TargetScroll = trackTopAbs - [ (vh * offsetFactor) - (index * PPC) ]
            
            const targetScroll = trackTopAbs - (window.innerHeight * TRIGGER_OFFSET_FACTOR) + (index * PIXELS_PER_CARD);

            if (window.lenis) {
                window.lenis.scrollTo(targetScroll, { duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
            } else {
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        });
    });

    // --- 2. State & Media Helper ---
    const updateMediaState = (index) => {
        // Clamp index
        index = Math.max(0, Math.min(index, cards.length - 1));
        
        if (currentActiveIndex === index) return;
        currentActiveIndex = index;

        // update tabs
        triggers.forEach((t, i) => {
            if (i === index) {
                t.dataset.selected = "true";
                t.setAttribute('aria-selected', 'true');
                t.classList.add('active'); // legacy support
            } else {
                delete t.dataset.selected;
                t.setAttribute('aria-selected', 'false');
                t.classList.remove('active');
            }
        });

        // update media playback
        cards.forEach((c, i) => {
            const container = c.querySelector('[data-smil-container]');
            
            if (i === index) {
                // Active: Play
                c.classList.add('active');
                if (window.triggerMedia && container) {
                    window.triggerMedia(container, true);
                }
                const v = c.querySelector('video');
                if (v) v.play().catch(()=>{});
            } else {
                // Inactive: Pause
                c.classList.remove('active');
                if (window.triggerMedia && container) {
                    window.triggerMedia(container, false);
                }
                const v = c.querySelector('video');
                if (v) v.pause();
            }
        });
    };

    // --- 3. Render Loop (Physics) ---
    const render = () => {
        const rect = track.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Calculate Scroll Progress
        // "Active" point is when the section is at TRIGGER_OFFSET_FACTOR of viewport
        const startOffset = -rect.top + (viewportHeight * TRIGGER_OFFSET_FACTOR); 
        
        let scrollProgress = startOffset / PIXELS_PER_CARD;
        
        // Determine Integer Active Index
        let activeIdx = Math.floor(scrollProgress);
        activeIdx = Math.max(0, Math.min(activeIdx, cards.length - 1));

        // Update Logic State
        updateMediaState(activeIdx);

        // Update Visuals (Transforms)
        cards.forEach((card, i) => {
            const delta = i - scrollProgress;
            
            let y = 0, z = 0, rotX = 0, opacity = 1, pointerEvents = 'none';

            if (delta > 0) {
                // --- COMING UP (Future) ---
                // Card is below and sliding up.
                // delta ranges from 0 (active) to N (far below).
                
                // We want the next card (delta=1) to be at roughly 100vh (offscreen).
                // But let's tighten it so we see it coming. 
                // Let's say at delta=1, it is 80% down.
                
                y = delta * (viewportHeight * 0.8);
                
                // Add some depth tilt
                // Tilt BACK as it enters (-30deg max)
                rotX = Math.max(-20, delta * -20);
                z = delta * -50; // Push back slightly
                
                // CRITIAL: Opacity must be 1 to prevent transparent overlap
                opacity = 1.0; 
                
            } else {
                // --- PAST (History) ---
                // Card is being covered by the newer one.
                // delta is negative. 
                // -0.5 means half covered.
                
                const d = Math.abs(delta);
                
                // Push back in Z to allow new card to slide over
                z = -d * 100; 
                
                // Move UP slightly for parallax effect (card leaves slower than it arrived)
                y = -d * 100; 
                
                // Fade out ONLY if deep in stack to save rendering/visual noise
                opacity = d > 1 ? (1 - (d-1)) : 1;
                opacity = Math.max(0, opacity);
            }

            if (i === activeIdx) pointerEvents = 'auto';

            card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg)`;
            card.style.opacity = opacity;
            card.style.zIndex = i * 10; // Simple stacking
            card.style.pointerEvents = pointerEvents;
            card.style.transition = 'none'; // Kill CSS transitions
        });
    };

    // --- 4. Init ---
    if (window.lenis) {
        window.lenis.on('scroll', render);
    } else {
        window.addEventListener('scroll', render);
    }
    
    // Initial Paint
    render();
    
    // Safety Force active 0 on load if at top
    setTimeout(() => {
        if (window.scrollY < 100) updateMediaState(0);
    }, 100);
});
