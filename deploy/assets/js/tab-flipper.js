/**
 * Tab Controlled Card Flipper v1.504
 * - STABILITY FIX (Emergency)
 * - Removed Parallax (Source of layout breakage).
 * - Restored Card Integrity.
 * - Retained Direct Scroll Physics (1:1 Movement).
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.504 (Stable Physics) Loaded');

  // --- 1. Styles ---
  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { perspective: 1500px; }
      
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        transform-style: preserve-3d;
        will-change: transform;
        transition: none !important; /* Direct control */
      }

      /* Active State - Visuals only */
      [data-tab-card].active { z-index: 30; }
    }
  `;
  document.head.appendChild(style);

  // --- 2. Text Support ---
  const initializeFlipText = (el) => {
    if (el.dataset.initialized) return;
    const text = el.textContent;
    const delay = parseInt(el.dataset.flipDelay || 30);
    el.innerHTML = '';
    Array.from(text).forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.classList.add('char');
      span.style.transitionDelay = `${i * delay}ms`;
      el.appendChild(span);
    });
    el.dataset.initialized = 'true';
  };
  document.querySelectorAll('.hover-flip-text').forEach(initializeFlipText);

  // --- 3. Flipper Logic ---
  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    const cardsContainer = flipper.querySelector('.group\\/cards');
    
    // Cleanup any lingering transforms from previous versions
    cards.forEach(card => {
        const t = card.querySelector('.parallax-text'); if(t) t.style = '';
        const m = card.querySelector('.parallax-media'); if(m) m.style = '';
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
            
            // 1. GONE (Deep Stack)
            if (diff < -3) {
                 y = -100; 
                 zIndex = 0;
                 opacity = 0; // Hide deep stack for performance/glitches
            }
            // 2. STACK (Leaving)
            else if (diff <= 0) {
                const depth = Math.abs(diff);
                y = -40 * depth; // Compress stack (40px per card)
                z = -40 * depth;
                rotX = 6; 
                rotY = 12;
                zIndex = 30 + (diff * 10);
                opacity = 1;
            }
            // 3. ENTERING (Incoming)
            else {
                // Linear connection to scroll
                const enterP = diff; 
                
                if (enterP > 1.2) {
                    y = viewportH * 1.5;
                    opacity = 0; // Clip
                } else {
                    // Map 0->1 linear slide
                    // 1.0 = Bottom (100% + buffer)
                    // 0.0 = Active (0px)
                    y = enterP * (viewportH * 0.9); // 90% of screen height slide
                    
                    rotX = 6 + (enterP * -16);
                    rotY = 12;
                    zIndex = 40;
                    opacity = 1;
                }
            }

            // Apply
            card.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
            card.style.zIndex = Math.round(zIndex);
            card.style.opacity = opacity;
        });
        
        // Trigger Sync
        const index = Math.round(progress);
        if (index !== activeIndex) {
             activeIndex = index;
             triggers.forEach((t, i) => {
                 const isActive = i === index;
                 t.classList.toggle('active', isActive);
                 t.setAttribute('aria-selected', isActive);
             });
        }
    };
    
    // --- Scroll Handler ---
    if (scrollTrack) {
        const handleScroll = () => {
             if (window.innerWidth < 768) return;

             const rect = scrollTrack.getBoundingClientRect();
             const scrollableRange = rect.height - window.innerHeight;
             // Raw Progress 0..1
             const rawP = Math.max(0, Math.min(1, -rect.top / scrollableRange));
             
             // Map to Index Float
             const floatIndex = rawP * (triggers.length - 1);
             
             requestAnimationFrame(() => updateCardState(floatIndex));
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        // Initial Draw
        handleScroll();
    }

    // --- Click Logic ---
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

    // --- Responsive ---
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
