/**
 * Tab Controlled Card Flipper v1.502
 * - Parallax Physics Engine
 * - Inner content (Text/Video) moves at different rates for 3D depth.
 * - Uses translate3d(x,y,z) for true GPU composition.
 * - Replicates specific "floating" behavior from reference.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.502 (Parallax) Loaded');

  // --- 1. Styles ---
  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { perspective: 1500px; }
      
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        transform-style: preserve-3d;
        will-change: transform, opacity;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      }
      
      /* Inner Parallax Elements */
      [data-tab-card] .parallax-text,
      [data-tab-card] .parallax-media {
        will-change: transform;
        transform: translate3d(0,0,0);
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .is-scrolling [data-tab-card],
      .is-scrolling [data-tab-card] .parallax-text,
      .is-scrolling [data-tab-card] .parallax-media {
        transition: none !important;
      }

      [data-tab-card].active { z-index: 30; opacity: 1; }
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
    
    // Tag inner elements for Parallax if not already tagged
    cards.forEach(card => {
        // Text Column
        const textCol = card.querySelector('.flex.flex-col.justify-start');
        if (textCol) textCol.classList.add('parallax-text');
        
        // Media Column (The Screen/Window)
        // We target the inner 'screen' div to avoid disrupting layout
        const mediaCol = card.querySelector('.md\\:w-1\\/2 .relative.aspect-square');
        if (mediaCol) mediaCol.classList.add('parallax-media');
    });

    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let scrollTimeout;

    const updateCardState = (progress) => {
        cards.forEach((card, i) => {
            const diff = i - progress;
            
            // Physics Variables
            let y = 0;      // Card Y (px or %)
            let z = 0;      // Card Z (px)
            let rotX = 0;   // Card Rotate X
            let rotY = 0;   // Card Rotate Y (constant twist)
            let opacity = 1;
            let zIndex = 0;
            
            // Parallax Offsets
            let textY = 0;
            let mediaY = 0;

            // --- ALL COMPUTATIONS IN PX FOR PRECISION PARALLAX ---
            // We use window height to map % to px roughly, or just fixed large px values
            const STAGE_HEIGHT = 800; // Reference height for animation scale

            // 1. Gone (Deep Stack)
            if (diff < -3) {
                 opacity = 0;
                 y = -60; 
                 zIndex = 0;
            }
            // 2. Stack (Leaving)
            else if (diff <= 0) {
                const depth = Math.abs(diff);
                y = -20 * depth;
                z = -10 * depth; // Recede into background slightly
                rotX = 6; 
                rotY = 12;
                zIndex = 30 + (diff * 10);
            }
            // 3. Entering (Positive Diff)
            else {
                if (diff > 1.2) {
                    opacity = 0;
                    y = STAGE_HEIGHT * 1.2;
                } else {
                    opacity = 1;
                    const enterP = Math.max(0, Math.min(1, diff));
                    
                    // Card Y: 0 to 800px (approx 110%)
                    y = enterP * STAGE_HEIGHT;
                    
                    // Z-Axis Arc: 
                    // Incoming cards might pop OUT (positive Z) slightly?
                    // User example: translateZ(8.2px) at Y=171.
                    // Let's model a slight arc.
                    // Peak Z at diff=0.2 (just before locking)?
                    // specific fn: 10 * sin(PI * (1-enterP)) ? 
                    z = 8 * Math.sin(Math.PI * (1 - enterP)); 
                    
                    rotX = 6 + (enterP * -16); // 6 to -10
                    rotY = 12;
                    zIndex = 40;

                    // --- Parallax Calculation ---
                    // As card comes UP (y decreases), inner content should LAG (move UP slower).
                    // This means inner content starts with POSITIVE Y offset relative to card.
                    // Text: Slower (more lag)
                    // Media: Faster (less lag) or vice versa.
                    
                    // At diff=1 (Start):
                    // Card Y = 800.
                    // Text Y = 200. (Visual Y = 1000)
                    // Media Y = 100. (Visual Y = 900)
                    
                    // At diff=0 (End):
                    // Card Y = 0.
                    // Text Y = 0.
                    // Media Y = 0.
                    
                    textY = enterP * 250;  // Text lags behind 250px
                    mediaY = enterP * 120; // Media lags behind 120px
                }
            }

            // Apply Main Transform
            // We use translate3d for the z-axis and gpu boost
            card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
            card.style.opacity = opacity;
            card.style.zIndex = Math.round(zIndex);

            // Apply Parallax to inner elements
            const textEl = card.querySelector('.parallax-text');
            const mediaEl = card.querySelector('.parallax-media');
            
            if (textEl) textEl.style.transform = `translate3d(0, ${textY}px, 0)`;
            if (mediaEl) mediaEl.style.transform = `translate3d(0, ${mediaY}px, 0)`;

            // Active Class
            if (Math.abs(diff) < 0.01) card.classList.add('active');
            else card.classList.remove('active');
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
             if (!cardsContainer.classList.contains('is-scrolling')) {
                 cardsContainer.classList.add('is-scrolling');
             }
             
             clearTimeout(scrollTimeout);
             scrollTimeout = setTimeout(() => cardsContainer.classList.remove('is-scrolling'), 100);

             const rect = scrollTrack.getBoundingClientRect();
             const scrollableRange = rect.height - window.innerHeight;
             const rawP = Math.max(0, Math.min(1, -rect.top / scrollableRange));
             
             requestAnimationFrame(() => updateCardState(rawP * (triggers.length - 1)));
        };
        
        if (window.lenis) window.lenis.on('scroll', handleScroll);
        else window.addEventListener('scroll', handleScroll);
    }

    // --- Click Logic ---
    triggers.forEach((trigger, index) => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.innerWidth < 768) return;
            cardsContainer.classList.remove('is-scrolling');
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
                const t = c.querySelector('.parallax-text'); if(t) t.style.transform = '';
                const m = c.querySelector('.parallax-media'); if(m) m.style.transform = '';
            });
        } else if (scrollTrack) {
             const rect = scrollTrack.getBoundingClientRect();
             const scrollableRange = rect.height - window.innerHeight;
             const rawP = Math.max(0, Math.min(1, -rect.top / scrollableRange));
             updateCardState(rawP * (triggers.length - 1));
        }
    };
    window.addEventListener('resize', checkResponsive);
    checkResponsive();
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
