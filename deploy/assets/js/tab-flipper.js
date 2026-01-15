/**
 * Tab Controlled Card Flipper v1.507
 * - FIXED: Tab Active State (Uses data-selected="true" for blue line).
 * - FIXED: SMIL/SVG Animation Triggers (Manual .beginElement()).
 * - FIXED: 3D Positioning & Opacity (Restored Z-Stacking).
 * - PHYSICS: Neverhack Sticky Stack (Incoming slides up, Active pushes back).
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Tab Flipper v1.507 (Fix All) Loaded');

    // --- 1. Styles ---
    const style = document.createElement('style');
    style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { perspective: 1500px; }
      
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        transform-style: preserve-3d;
        will-change: transform;
        transition: none !important; 
        display: block !important;
        visibility: visible !important;
        /* Ensure inputs are not hidden */
      }
    }
  `;
    document.head.appendChild(style);

    // --- 2. Helper: Trigger SVG Animations ---
    const triggerSVGAnimation = (card) => {
        // Find main trigger SMIL element
        const trigger = card.querySelector('#crm-anim-trigger');
        if (trigger && trigger.beginElement) {
            try {
                // Restart animation
                trigger.beginElement();
            } catch (e) { console.warn('SMIL trigger failed', e); }
        }
        
        // Also unhide elements that might be hidden by default
        const circles = card.querySelectorAll('.smil-hide');
        circles.forEach(c => c.style.visibility = 'visible');
    };

    // --- 3. Flipper Logic ---
    const initFlipper = (flipper) => {
        const triggers = flipper.querySelectorAll('[data-tab-trigger]');
        const cards = flipper.querySelectorAll('[data-tab-card]');
        const scrollTrack = flipper.querySelector('[data-scroll-track]');

        if (!triggers.length || !cards.length) return;

        // Cleanup HTML attributes that cause conflicts
        cards.forEach(c => {
            c.removeAttribute('data-observer');
            c.classList.remove('animate-on-scroll');
        });

        let activeIndex = 0;
        let lastScrollIndex = -1;

        // --- Physics Engine ---
        const updateCardState = (progress) => {
            const viewportH = window.innerHeight;

            cards.forEach((card, i) => {
                const diff = i - progress;
                
                let y = 0;
                let z = 0;
                let rotX = 0;
                let opacity = 1;
                let zIndex = 0;

                // --- LOGIC: NEVERHACK STYLE ---

                // 1. INCOMING CARD (Positive Diff)
                // Slides UP from bottom
                if (diff > 0) {
                    zIndex = 100 - i; // Ensure incoming is ON TOP of previous
                    
                    if (diff > 1.2) {
                        y = viewportH * 1.5;
                        opacity = 0; // Cutoff
                    } else {
                        // 0 diff = 0px
                        // 1 diff = 90% viewport
                        y = diff * (viewportH * 0.9);
                        rotX = -5 * diff; 
                    }
                } 
                
                // 2. ACTIVE / STACKED CARD (Negative or Zero Diff)
                // Pushes BACK into depth
                else {
                    zIndex = 100 - i; // Stack order
                    
                    const depth = Math.abs(diff);
                    
                    y = 0; // Pinned
                    z = -150 * depth; // Push back
                    
                    // Fade deep stack
                    if (depth > 1.5) {
                        opacity = Math.max(0, 1 - (depth - 1.5));
                    }
                }

                // Apply
                card.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg)`;
                card.style.zIndex = Math.round(zIndex);
                card.style.opacity = opacity;
            });
            
            // Sync Triggers & Animations
            const index = Math.round(progress);
             if (index !== activeIndex) {
                 activeIndex = index;
                 
                 // Update Tabs (Blue Line)
                 triggers.forEach((tr, i) => {
                     const isActive = i === index;
                     // Set BOTH aria-selected and data-selected for styling
                     tr.setAttribute('aria-selected', isActive);
                     if (isActive) {
                         tr.setAttribute('data-selected', 'true');
                     } else {
                         tr.removeAttribute('data-selected');
                     }
                 });

                 // Trigger SVG Animation for new active card
                 if (cards[index]) {
                     triggerSVGAnimation(cards[index]);
                 }
             }
        };

        // --- Scroll Handler ---
        if (scrollTrack) {
            const handleScroll = () => {
                if (window.innerWidth < 768) return;

                const rect = scrollTrack.getBoundingClientRect();
                const scrollableRange = rect.height - window.innerHeight;
                // Clamp 0..1
                const rawP = Math.max(0, Math.min(1, -rect.top / scrollableRange));
                const floatIndex = rawP * (triggers.length - 1);

                requestAnimationFrame(() => updateCardState(floatIndex));
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            
            // Initial call to set state
            handleScroll();
            
            // Force trigger first animation
            if(cards[0]) triggerSVGAnimation(cards[0]);
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
                    
                    window.scrollTo({ top: absoluteTop + (p * scrollableRange) + 10, behavior: 'smooth' });
                }
            });
        });

        // Cleanup
        const checkResponsive = () => {
            if (window.innerWidth < 768) {
                cards.forEach(c => {
                    c.style.transform = '';
                    c.style.opacity = '';
                    c.style.zIndex = '';
                });
            }
        };
        window.addEventListener('resize', checkResponsive);
    };

    document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
