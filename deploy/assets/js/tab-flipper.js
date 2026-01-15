/**
 * Tab Controlled Card Flipper v1.509
 * - FIXED: Card Indexing/Visibility. Forced Card 1 to top at start.
 * - FIXED: Physics - Removed opacity cutoffs to prevent flashing.
 * - FIXED: SMIL - Robust class-based searching for restart.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Tab Flipper v1.509 (Physics Clean) Loaded');

    // --- 1. Styles ---
    const style = document.createElement('style');
    style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { 
          perspective: 2000px; /* Matched to HTML */
          transform-style: preserve-3d;
      }
      
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        will-change: transform;
        transform-style: preserve-3d;
        transition: none !important; /* JS Physics only */
        display: block !important;
        visibility: visible !important;
        backface-visibility: hidden;
        background-color: #0b0c15; /* Opaque */
        z-index: 0; /* Default */
      }
    }
  `;
    document.head.appendChild(style);

    // --- 2. Helper: Trigger SVG Animations ---
    const triggerSVGAnimation = (card) => {
        // Find the main duration-controlling animation or restart all children
        // The user's HTML uses ID='crm-anim-trigger' (and others likely). 
        // IDs might be duplicated across cards if they are copy-pasted, which breaks querySelectorAll('#id').
        // We use tag selectors scoped to the card.
        
        try {
            const anims = card.querySelectorAll('animate, animateTransform, animateMotion');
            anims.forEach(anim => {
                if (typeof anim.beginElement === 'function') {
                    // Force restart
                    anim.beginElement();
                }
            });
            // Also unhide elements waiting for animation
            card.querySelectorAll('.smil-hide, .hidden').forEach(el => {
                el.style.visibility = 'visible';
                el.classList.remove('hidden');
            });
        } catch(e) { console.warn('SMIL Restart Error', e); }
    };

    // --- 3. Flipper Logic ---
    const initFlipper = (flipper) => {
        const triggers = flipper.querySelectorAll('[data-tab-trigger]');
        const cards = flipper.querySelectorAll('[data-tab-card]');
        const scrollTrack = flipper.querySelector('[data-scroll-track]');

        if (!triggers.length || !cards.length) return;

        // Cleanup
        cards.forEach(c => {
            c.removeAttribute('data-observer'); 
            c.classList.remove('animate-on-scroll');
        });

        let activeIndex = 0;

        // --- Core Physics Engine ---
        const updateCardState = (progress) => {
            const viewportH = window.innerHeight;

            cards.forEach((card, i) => {
                const diff = i - progress;
                
                let y = 0;
                let z = 0;
                let scale = 1;
                let zIndex = 0;

                // --- LOGIC: NEVERHACK STACK ---
                // Lower index cards are "base". Higher index cards slide UP over them.
                // So Card 1 is ON TOP of Card 0. Card 2 is ON TOP of Card 1.
                // Z-index must increase with i.
                zIndex = 10 + i;

                // 1. INCOMING CARD (Positive Diff)
                // It is further down the scroll list. 
                // diff=0.1 means it's ALMOST active (should be nearly at top).
                // diff=1 means it is the NEXT card (should be at bottom of screen).
                if (diff > 0) {
                     // Map diff 0 -> y=0
                     // Map diff 1 -> y=100% viewport (just peeking or fully transition)
                     
                     // We want it to just disappear off bottom at diff=1
                     y = diff * viewportH; 
                     
                     // If it's way below, clamp visuals? No, let it translate naturally.
                     // But prevent floating point errors or insane render layers
                } 
                
                // 2. ACTIVE / STACKED CARD (Negative or Zero Diff)
                // It is currently active or passed.
                // It stays pinned at 0, but pushes back into Z space.
                else {
                    const depth = Math.abs(diff);
                    y = 0;
                    z = -50 * depth; // Push back slightly
                    scale = Math.max(0.9, 1 - (depth * 0.05)); // Subtle scale down
                }

                // Apply
                card.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) scale(${scale})`;
                card.style.zIndex = zIndex;
                
                // Opacity: Always 1 unless extremely deep/high to save render
                card.style.opacity = '1';
            });
            
            // Sync UI
            const index = Math.round(progress);
            if (index !== activeIndex) {
                 activeIndex = index;
                 triggers.forEach((tr, i) => {
                     const isActive = i === index;
                     tr.setAttribute('aria-selected', isActive);
                     isActive ? tr.setAttribute('data-selected', 'true') : tr.removeAttribute('data-selected');
                 });
                 if (cards[index]) triggerSVGAnimation(cards[index]);
            }
        };

        // --- Initialization ---
        // Force state calculation immediately for progress=0
        updateCardState(0);
        
        // --- Scroll Handler ---
        if (scrollTrack) {
            const handleScroll = () => {
                if (window.innerWidth < 768) return;

                const rect = scrollTrack.getBoundingClientRect();
                const scrollableRange = rect.height - window.innerHeight;
                
                // Clamp 0..1
                let rawP = -rect.top / scrollableRange;
                rawP = Math.max(0, Math.min(1, rawP)); 
                
                const floatIndex = rawP * (triggers.length - 1);
                requestAnimationFrame(() => updateCardState(floatIndex));
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        // --- Click Handler ---
        triggers.forEach((trigger, index) => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.innerWidth < 768) return;
                
                if (scrollTrack) {
                    const rect = scrollTrack.getBoundingClientRect();
                    const absoluteTop = window.scrollY + rect.top;
                    const scrollableRange = rect.height - window.innerHeight;
                    const p = index / (triggers.length - 1);
                    // Add small offset to ensure it snaps into range
                    window.scrollTo({ top: absoluteTop + (p * scrollableRange) + 1, behavior: 'smooth' });
                }
            });
        });

        // Cleanup
        window.addEventListener('resize', () => {
             if (window.innerWidth < 768) {
                cards.forEach(c => {
                    c.style.transform = '';
                    c.style.zIndex = '';
                    c.style.opacity = '';
                });
            }
        });
        
        // Initial Trigger of 0
        triggerSVGAnimation(cards[0]);
    };

    document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
