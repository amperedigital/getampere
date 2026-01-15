/**
 * Tab Controlled Card Flipper v1.505
 * - CONFLICT RESOLUTION: Explicitly removes 'data-observer' to prevent global.js interference.
 * - FORCEFUL OVERRIDE: Uses !important for all transform/opacity properties to beat Tailwind.
 * - 1:1 Scroll Physics maintained.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.505 (Conflict Free) Loaded');

  // --- 1. Styles ---
  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { perspective: 1500px; }
      
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        transform-style: preserve-3d;
        will-change: transform;
        /* KILL ALL TRANSITIONS to stop fighting */
        transition: none !important; 
        
        /* Stop Tailwind from hiding inputs */
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
    
    // --- CRITICAL FIX: Detach from global observer ---
    cards.forEach(c => {
        c.removeAttribute('data-observer'); // Stop global.js from fading it
        c.classList.remove('animate-on-scroll');
        
        // Reset styles
        c.style.cssText = ''; 
    });

    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    
    // --- Physics Engine ---
    const updateCardState = (progress) => {
        const viewportH = window.innerHeight;
        
        cards.forEach((card, i) => {
            const diff = i - progress;
            
            let y = 0;
            let z = 0;
            let rotX = 0;
            let rotY = 0;
            let zIndex = 0;
            let opacity = 1;
            
            // 1. GONE (Deep Stack) - Push way back
            if (diff < -3) {
                 y = -100; 
                 zIndex = 0;
                 opacity = 0; 
            }
            // 2. STACK (Leaving)
            else if (diff <= 0) {
                const depth = Math.abs(diff);
                y = -40 * depth; 
                z = -40 * depth;
                rotX = 6; 
                rotY = 12;
                zIndex = 30 + (diff * 10);
                opacity = 1;
            }
            // 3. ENTERING (Incoming)
            else {
                const enterP = diff; 
                
                if (enterP > 1.2) {
                    y = viewportH * 1.5;
                    opacity = 0; 
                } else {
                    y = enterP * (viewportH * 0.9);
                    rotX = 6 + (enterP * -16);
                    rotY = 12;
                    zIndex = 40;
                    opacity = 1;
                }
            }

            // Apply FORCEFULLY
            card.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
            card.style.zIndex = Math.round(zIndex);
            card.style.opacity = opacity; // This is now 0 or 1.
            
            // Highlight Triggers
            if (Math.abs(diff) < 0.5) {
                 const t = triggers[i];
                 if(t) {
                     triggers.forEach(tr => tr.setAttribute('aria-selected', 'false'));
                     t.setAttribute('aria-selected', 'true');
                 }
            }
        });
    };
    
    // --- Scroll Handler ---
    if (scrollTrack) {
        const handleScroll = () => {
             if (window.innerWidth < 768) return;

             const rect = scrollTrack.getBoundingClientRect();
             const scrollableRange = rect.height - window.innerHeight;
             const rawP = Math.max(0, Math.min(1, -rect.top / scrollableRange));
             const floatIndex = rawP * (triggers.length - 1);
             
             requestAnimationFrame(() => updateCardState(floatIndex));
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }
    
    // Cleanup for Mobile
    const checkResponsive = () => {
        if (window.innerWidth < 768) {
            cards.forEach(c => { 
                c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = ''; 
            });
        }
    };
    window.addEventListener('resize', checkResponsive);
    checkResponsive();
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
