/**
 * Tab Controlled Card Flipper v1.510
 * - FIXED: Severe Z-Index logic (Explicitly set stacked cards).
 * - FIXED: Initial State (Forces Card 0 visible, others BELOW viewport).
 * - REVERT: Simplified opacity map to prevent "ghost" cards.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Tab Flipper v1.510 (Strict Stack) Loaded');

    // --- 1. Styles ---
    const style = document.createElement('style');
    style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { 
          perspective: 2000px;
          transform-style: preserve-3d;
      }
      
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        will-change: transform;
        transform-style: preserve-3d;
        transition: none !important;
        display: block !important;
        visibility: visible !important;
        backface-visibility: hidden;
        background-color: #0b0c15;
      }
    }
  `;
    document.head.appendChild(style);

    // --- 2. Helper: Animation ---
    const triggerSVGAnimation = (card) => {
        try {
            const anims = card.querySelectorAll('animate, animateTransform, animateMotion');
            anims.forEach(a => typeof a.beginElement === 'function' && a.beginElement());
            card.querySelectorAll('.smil-hide, .hidden').forEach(el => {
                el.style.visibility = 'visible';
                el.classList.remove('hidden');
            });
        } catch(e) {}
    };

    // --- 3. Flipper Logic ---
    const initFlipper = (flipper) => {
        const triggers = flipper.querySelectorAll('[data-tab-trigger]');
        const cards = flipper.querySelectorAll('[data-tab-card]');
        const scrollTrack = flipper.querySelector('[data-scroll-track]');

        if (!triggers.length || !cards.length) return;

        cards.forEach(c => {
            c.removeAttribute('data-observer'); 
            c.classList.remove('animate-on-scroll');
        });

        let activeIndex = 0;

        // --- Physics Engine ---
        const updateCardState = (progress) => {
            const viewportH = window.innerHeight;

            cards.forEach((card, i) => {
                const diff = i - progress;
                
                let y = 0;
                let z = 0;
                let scale = 1;
                let zIndex = 0;

                // --- STRICT Z-INDEX ---
                // Lower index = Bottom of stack (base)
                // Higher index = Top of stack (slides over)
                zIndex = 10 + i;

                // 1. INCOMING CARD (Positive Diff)
                // e.g. i=1, progress=0 -> diff=1. Should be BELOW viewport.
                if (diff > 0) {
                     y = viewportH * 1.5; // Default: Way off screen
                     
                     // If it's the "Next" card (0 < diff <= 1)
                     // We map it:
                     // diff=1 -> y=100vh
                     // diff=0 -> y=0vh
                     if (diff <= 1.0) {
                        y = diff * viewportH; 
                     }
                } 
                
                // 2. ACTIVE / PASSED CARD (Negative Diff)
                // e.g. i=0, progress=1 -> diff=-1. Should be pushed BACK.
                else {
                    const depth = Math.abs(diff);
                    y = 0;
                    z = -100 * depth; 
                    scale = Math.max(0.8, 1 - (depth * 0.05));
                }

                card.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) scale(${scale})`;
                card.style.zIndex = zIndex;
            });
            
            // Sync Triggers
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

        // --- INIT STATE ---
        // Force calculation at 0 IMMEDIATELY
        // This ensures Card 1,2,3 are pushed off screen (y=150vh) before paint
        updateCardState(0);

        if (scrollTrack) {
            const handleScroll = () => {
                if (window.innerWidth < 768) return;
                const rect = scrollTrack.getBoundingClientRect();
                const scrollableRange = rect.height - window.innerHeight;
                let rawP = -rect.top / scrollableRange;
                rawP = Math.max(0, Math.min(1, rawP));
                const floatIndex = rawP * (triggers.length - 1);
                requestAnimationFrame(() => updateCardState(floatIndex));
            };
            window.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        triggers.forEach((trigger, index) => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.innerWidth < 768) return;
                
                if (scrollTrack) {
                    const rect = scrollTrack.getBoundingClientRect();
                    const absoluteTop = window.scrollY + rect.top;
                    const scrollableRange = rect.height - window.innerHeight;
                    const p = index / (triggers.length - 1);
                    window.scrollTo({ top: absoluteTop + (p * scrollableRange) + 5, behavior: 'smooth' });
                }
            });
        });

        window.addEventListener('resize', () => {
             if (window.innerWidth < 768) {
                cards.forEach(c => {
                    c.style.transform = '';
                    c.style.zIndex = '';
                });
            }
        });
        
        // Trigger First Animation
        triggerSVGAnimation(cards[0]);
    };

    document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
