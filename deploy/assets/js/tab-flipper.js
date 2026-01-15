/**
 * Tab Controlled Card Flipper v1.506
 * - REFERENCE: Matches "Neverhack" Sticky Stack Physics.
 * - MECHANISM: Incoming cards slide UP from bottom (100vh+) to 0px.
 * - STACKING: Active cards stay pinned (0px) but push slightly back (-Z) as next card arrives.
 * - CONFLICT: 'data-observer' removed from HTML, but this script ensures cleanup just in case.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Tab Flipper v1.506 (Sticky Stack) Loaded');

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
      }
    }
  `;
    document.head.appendChild(style);

    // --- 2. Flipper Logic ---
    const initFlipper = (flipper) => {
        const triggers = flipper.querySelectorAll('[data-tab-trigger]');
        const cards = flipper.querySelectorAll('[data-tab-card]');
        const scrollTrack = flipper.querySelector('[data-scroll-track]');

        // Ensure clean slate
        cards.forEach(c => {
            c.removeAttribute('data-observer');
            c.classList.remove('animate-on-scroll');
            c.style.cssText = '';
        });

        if (!triggers.length || !cards.length) return;

        let activeIndex = 0;

        // --- Physics Engine ---
        const updateCardState = (progress) => {
            // Viewport calc for entrance
            const viewportH = window.innerHeight;

            cards.forEach((card, i) => {
                const diff = i - progress;
                // diff = 0  => Active (Top of stack)
                // diff = 1  => Next (1 unit below)
                // diff = -1 => Previous (1 unit behind)

                let y = 0;
                let z = 0;
                let rotX = 0;
                let opacity = 1;
                let zIndex = 0;

                // --- LOGIC: NEVERHACK STYLE ---
                
                // 1. INCOMING CARD (Positive Diff)
                // Example: diff = 0.5 (Halfway entering)
                // It should be at 50% height.
                if (diff > 0) {
                    zIndex = 50 - i; // Higher index = lower z-index usually, unless entering? 
                                     // Actually, incoming is ON TOP.
                    zIndex = 100 - i;
                    
                    // Entrance: Slide from bottom.
                    // 1.0 diff = 100% height (or more)
                    // 0.0 diff = 0% height
                    
                    // We map diff linear to Y offset.
                    // Clamp at 1.5 to stop deep drawing.
                    if (diff > 1.5) {
                        y = viewportH * 2;
                        opacity = 0; 
                    } else {
                        y = diff * (viewportH * 0.85); // 85% H slide
                        
                        // Subtle rotation while entering?
                        // Reference had: rotateX(-5deg) -> 0deg
                        rotX = -5 * diff; 
                    }
                } 
                
                // 2. ACTIVE / STACKED CARD (Negative or Zero Diff)
                // It stays at Y=0 nominally, but pushes back in Z.
                else {
                    zIndex = 100 - i; // Lower in stack
                    
                    // Depth logic
                    // diff goes 0 -> -1 -> -2
                    const depth = Math.abs(diff);
                    
                    // Stick to top (Y=0)
                    y = 0;
                    
                    // Push back Z
                    // -200px per unit depth?
                    z = -150 * depth;
                    
                    // Fade deep stack
                    if (depth > 2) {
                        opacity = 1 - (depth - 2); // Fade out after 2
                        if(opacity < 0) opacity = 0;
                    }
                    
                    // Optional: Slight scale down?
                    // scale = 1 - (0.05 * depth)
                }

                // Apply
                card.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg)`;
                card.style.zIndex = Math.round(zIndex);
                card.style.opacity = opacity;

                if (Math.abs(diff) < 0.5 && i !== activeIndex) {
                    // Update triggers if needed
                }
            });
            
            // Sync UI
            const index = Math.round(progress);
             if (index !== activeIndex && triggers[index]) {
                 activeIndex = index;
                 triggers.forEach(tr => tr.setAttribute('aria-selected', 'false'));
                 triggers[index].setAttribute('aria-selected', 'true');
             }
        };

        // --- Scroll Handler ---
        if (scrollTrack) {
            const handleScroll = () => {
                if (window.innerWidth < 768) return;

                const rect = scrollTrack.getBoundingClientRect();
                const scrollableRange = rect.height - window.innerHeight;
                // Raw Progress 
                const rawP = Math.max(0, Math.min(1, -rect.top / scrollableRange));
                const floatIndex = rawP * (triggers.length - 1);

                requestAnimationFrame(() => updateCardState(floatIndex));
            };

            window.addEventListener('scroll', handleScroll, {
                passive: true
            });
            handleScroll();
        }

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
