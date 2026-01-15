/**
 * Tab Controlled Card Flipper v1.501
 * - Scroll-Driven Physics Engine (Refined)
 * - Uses % for entrance animations to support all screen heights.
 * - Uses px for stack compression.
 * - Seamless physics crossover at Y=0.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.501 (Percentage Physics) Loaded');

  // --- 1. Styles for Physics ---
  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 768px) {
      .group\\/cards { perspective: 1500px; }
      [data-tab-card] {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        transform-style: preserve-3d;
        will-change: transform, opacity;
        transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease;
      }
      .is-scrolling [data-tab-card] { transition: none !important; }
      [data-tab-card].active { z-index: 30; opacity: 1; }
      [data-tab-card].hidden-stack { opacity: 0; pointer-events: none; }
    }
  `;
  document.head.appendChild(style);

  // --- 2. Text Interaction Engine ---
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

  // --- 3. Main Flipper Logic ---
  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    const cardsContainer = flipper.querySelector('.group\\/cards');
    
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let scrollTimeout;

    const updateCardState = (progress) => {
        cards.forEach((card, i) => {
            const diff = i - progress;
            let transform = '';
            let opacity = 1;
            let zIndex = 0;
            
            // --- Logic Zones ---
            // 1. Deep Stack (Gone)
            if (diff < -3) {
                 opacity = 0;
                 transform = `translateY(-60px) scale(0.9)`;
                 zIndex = 0;
            }
            // 2. Active / Leaving Stack (Negative Diff)
            else if (diff <= 0) {
                const depth = Math.abs(diff);
                // Stack compresses by 20px per card
                transform = `translateY(${-20 * depth}px) rotateY(12deg) rotateX(6deg) scale(1)`;
                opacity = 1;
                zIndex = 30 + (diff * 10); // Decreasing Z-Index
            }
            // 3. Incoming / Waiting (Positive Diff)
            else {
                if (diff > 1.2) {
                    // Far future cards are hidden
                    opacity = 0;
                    transform = `translateY(120%) rotateY(12deg) rotateX(-10deg)`;
                } else {
                    opacity = 1;
                    // Entrance Progress (0 to 1)
                    // 1.0 = Bottom (110%), 0.0 = Top (0%)
                    const enterProgress = Math.max(0, Math.min(1, diff));
                    
                    // Use Percentage for robust off-screen positioning
                    const yVal = enterProgress * 110; 
                    
                    const rotX = 6 + (enterProgress * -16); // 6 to -10
                    transform = `translateY(${yVal}%) rotateY(12deg) rotateX(${rotX}deg)`;
                    zIndex = 40;
                }
            }
            
            card.style.transform = transform;
            card.style.opacity = opacity;
            card.style.zIndex = Math.round(zIndex);
            
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
            cards.forEach(c => { c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = ''; });
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
