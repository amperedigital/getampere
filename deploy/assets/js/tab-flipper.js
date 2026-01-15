/**
 * Tab Controlled Card Flipper v1.508
 * - FIXED: Z-Index Inversion (Later cards now sit ON TOP: zIndex = 10 + i).
 * - FIXED: Tab Initialization (Forces active state on load).
 * - REFINED: Slide Physics (Cleaner calculation for incoming slides).
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Tab Flipper v1.508 (Z-Index Fix) Loaded');

    // --- 1. Styles ---
    const style = document.createElement('style');
    style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { 
          perspective: 1500px; 
          transform-style: preserve-3d;
      }
      
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        will-change: transform;
        transform-style: preserve-3d;
        transition: none !important; 
        display: block !important;
        visibility: visible !important;
        backface-visibility: hidden; /* Helps with rendering artifacts */
        background-color: #0b0c15; /* Ensure cards are opaque */
      }
    }
  `;
    document.head.appendChild(style);

    // --- 2. Helper: Trigger SVG Animations ---
    const triggerSVGAnimation = (card) => {
        const trigger = card.querySelector('#crm-anim-trigger');
        if (trigger && trigger.beginElement) {
            try { trigger.beginElement(); } catch (e) { console.warn('SMIL err', e); }
        }
        card.querySelectorAll('.smil-hide').forEach(c => c.style.visibility = 'visible');
    };

    // --- 3. Flipper Logic ---
    const initFlipper = (flipper) => {
        const triggers = flipper.querySelectorAll('[data-tab-trigger]');
        const cards = flipper.querySelectorAll('[data-tab-card]');
        const scrollTrack = flipper.querySelector('[data-scroll-track]');

        if (!triggers.length || !cards.length) return;

        // Cleanup attributes
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
                let opacity = 1;
                let zIndex = 0;

                // --- Z-INDEX LOGIC FIXED ---
                // Higher index = Higher Priority (Active card covers previous)
                zIndex = 10 + i; 

                // 1. INCOMING CARD (Positive Diff)
                // Card is below the viewport, sliding UP.
                if (diff > 0) {
                    // Start at 110% of viewport, end at 0
                    // Multiplier controls how fast it comes up relative to scroll
                    if (diff > 1.05) {
                        y = viewportH * 1.2; // Off screen
                        opacity = 0;
                    } else {
                        y = diff * (viewportH * 0.9); // Slide Phase
                        opacity = 1;
                    }
                } 
                
                // 2. ACTIVE / STACKED CARD (Negative Diff)
                // Card is active or passing above the viewport
                // We want it to stay pinned (y=0) but push back (z<0)
                else {
                    const depth = Math.abs(diff);
                    
                    y = 0; // Pinned to top
                    z = -100 * depth; // Push back into depth
                    scale = Math.max(0.8, 1 - (depth * 0.05)); // Slight scale down
                    
                    // Fade out if it gets too deep (handled by next card covering it mostly)
                    // But explicitly fade deep history
                    if (depth > 1) {
                        opacity = Math.max(0, 1 - (depth - 1)); 
                    }
                }

                // Apply Transforms
                // Use translate3d for GPU acceleration
                card.style.transform = `translate3d(0, ${y}px, ${z.toFixed(2)}px) scale(${scale})`;
                card.style.zIndex = zIndex;
                card.style.opacity = opacity;
            });
            
            // Sync Triggers
            const index = Math.round(progress);
            if (index !== activeIndex) {
                 activeIndex = index;
                 
                 // Update Tabs
                 triggers.forEach((tr, i) => {
                     const isActive = i === index;
                     tr.setAttribute('aria-selected', isActive);
                     if (isActive) {
                         tr.setAttribute('data-selected', 'true');
                     } else {
                         tr.removeAttribute('data-selected');
                     }
                 });

                 // Trigger Animation
                 if (cards[index]) triggerSVGAnimation(cards[index]);
            }
        };

        // --- Initialization ---
        // Force Active State Immediately (Before Scroll)
        triggers.forEach((tr, i) => {
            if (i === 0) {
                tr.setAttribute('aria-selected', 'true');
                tr.setAttribute('data-selected', 'true');
            } else {
                tr.setAttribute('aria-selected', 'false');
                tr.removeAttribute('data-selected');
            }
        });
        
        // --- Scroll Handler ---
        if (scrollTrack) {
            const handleScroll = () => {
                if (window.innerWidth < 768) return;

                const rect = scrollTrack.getBoundingClientRect();
                const scrollableRange = rect.height - window.innerHeight;
                
                // Calculate Progress 0..N
                let rawP = -rect.top / scrollableRange;
                rawP = Math.max(0, Math.min(1, rawP)); // Clamp 0-1
                const floatIndex = rawP * (triggers.length - 1);
                
                requestAnimationFrame(() => updateCardState(floatIndex));
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll(); // Initial position
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
                    
                    window.scrollTo({ top: absoluteTop + (p * scrollableRange) + 5, behavior: 'smooth' });
                }
            });
        });
        
        // --- Responsive Cleanup ---
        const checkResponsive = () => {
             if (window.innerWidth < 768) {
                cards.forEach(c => {
                    c.style.transform = '';
                    c.style.zIndex = '';
                    c.style.opacity = '';
                });
            }
        };
        window.addEventListener('resize', checkResponsive);
    };

    document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
