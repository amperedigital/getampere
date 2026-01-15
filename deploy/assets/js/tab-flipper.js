/**
 * Tab Controlled Card Flipper v1.503
 * - TRUE SCROLL CONTROL (Raw Physics)
 * - Transitions disabled during scroll for pixel-perfect tracking.
 * - Deep off-screen starting point to prevent "pop-in".
 * - No opacity toggling (always 1).
 * - Continuous Parallax.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.503 (Raw Physics) Loaded');

  // --- 1. Styles ---
  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { perspective: 1500px; }
      
      /* Base Card - force GPU */
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        transform-style: preserve-3d;
        will-change: transform;
        /* Default: No transition for instant response */
        transition: none !important; 
      }
      
      /* Only use transition during a "snap" event (click) */
      .snap-anim [data-tab-card],
      .snap-anim [data-tab-card] .parallax-text,
      .snap-anim [data-tab-card] .parallax-media {
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      
      [data-tab-card] .parallax-text,
      [data-tab-card] .parallax-media {
        will-change: transform;
        transform: translate3d(0,0,0);
        transition: none !important;
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
    
    // Tag inner elements
    cards.forEach(card => {
        const textCol = card.querySelector('.flex.flex-col.justify-start');
        if (textCol) textCol.classList.add('parallax-text');
        const mediaCol = card.querySelector('.md\\:w-1\\/2 .relative.aspect-square');
        if (mediaCol) mediaCol.classList.add('parallax-media');
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
            
            // Parallax
            let textY = 0;
            let mediaY = 0;

            // 1. GONE (Deep Stack) - Push way back/up
            if (diff < -3) {
                 y = -100; 
                 zIndex = 0;
            }
            // 2. STACK (Leaving)
            else if (diff <= 0) {
                const depth = Math.abs(diff);
                y = -30 * depth; // Compress stack
                z = -40 * depth;
                rotX = 6; 
                rotY = 12;
                zIndex = 30 + (diff * 10);
            }
            // 3. ENTERING (Incoming)
            else {
                // Enter Progress: 1.0 (Start, far below) -> 0.0 (Active)
                const enterP = diff; // Linear map logic
                
                // Position Formula: Start massively off-screen
                // 1.5 * Viewport ensures it's fully gone before entering
                // Clamp slightly to avoid chaos with huge scrollbars
                y = enterP * (viewportH * 1.2);
                
                // Z-Arc
                // translateZ peaks at 8px when near 0
                z = 12 * Math.sin(Math.PI * Math.max(0, 1 - enterP)); 
                
                rotX = 6 + (enterP * -16);
                rotY = 12;
                zIndex = 40; // On top

                // Parallax
                textY = enterP * 250;
                mediaY = enterP * 120;
            }

            // Apply
            card.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
            card.style.zIndex = Math.round(zIndex);
            // Force Opacity 1
            card.style.opacity = '1';

            // Inner Parallax
            const textEl = card.querySelector('.parallax-text');
            const mediaEl = card.querySelector('.parallax-media');
            if (textEl) textEl.style.transform = `translate3d(0, ${textY.toFixed(2)}px, 0)`;
            if (mediaEl) mediaEl.style.transform = `translate3d(0, ${mediaY.toFixed(2)}px, 0)`;

            // Active Class (State Only)
            if (Math.abs(diff) < 0.05) card.classList.add('active');
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
        // We use a persistent loop or event? Event is better for sync.
        const handleScroll = () => {
             if (window.innerWidth < 768) return;
             
             // Ensure snap animation is OFF during user scroll
             cardsContainer.classList.remove('snap-anim');

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
            
            // Enable CSS Transition for the Scroll Travel
            // Actually, we are just scrolling the window.
            // If we scroll the window, the handleScroll fires each frame.
            // If users wants "smoothness", the smooth scroll behavior does it.
            // But if we want "Snap", we can cheat.
            // Let's stick to native smooth scrolling which drives the physics engine naturally.
            
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
        }
    };
    window.addEventListener('resize', checkResponsive);
    checkResponsive();
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
