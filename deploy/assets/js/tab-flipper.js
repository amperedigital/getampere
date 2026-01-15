/**
 * Tab Controlled Card Flipper v1.475
 * Global Integration Update
 * - Uses window.globalObserver for Mobile visibility & media.
 * - Uses window.triggerMedia for Desktop tab switching.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.475 (Global Observer Integration) Loaded');

  // --- 1. CSS Injection (Mobile Layout & Utilities) ---
  const style = document.createElement('style');
  style.textContent = `
    /* Stack Logic (Desktop Only) */
    [data-tab-card].stack-0 { --stack-y: 0px !important; z-index: 30 !important; opacity: 1 !important; }
    [data-tab-card].stack-1 { --stack-y: -20px !important; z-index: 20 !important; opacity: 1 !important; }
    [data-tab-card].stack-2 { --stack-y: -40px !important; z-index: 10 !important; opacity: 1 !important; }
    [data-tab-card].stack-3 { --stack-y: -60px !important; z-index: 5 !important; opacity: 1 !important; }

    /* --- MOBILE VIEWPORT LOGIC (<768px) --- */
    @media (max-width: 767px) {
        /* 1. Parent Section / Container Safety */
        [data-tab-flipper], 
        .group\/cards {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
        }

        /* 2. Flex Stack Layout */
        .group\/cards {
            display: flex !important;
            flex-direction: column !important;
            gap: 4rem !important; 
            padding-bottom: 4rem !important; 
        }

        /* 3. Card Base Styles */
        [data-tab-card] {
            display: block !important;
            position: relative !important;
            inset: auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 450px;
            grid-column: auto !important;
            grid-row: auto !important;
            transform: none !important;
            --stack-y: 0px !important;
            margin-bottom: 0 !important; 
        }

        /* 4. Visibility Logic (Driven by .in-view via Global Observer) */
        .mobile-reveal[data-tab-card] {
            opacity: 0;
            filter: blur(10px);
            transition: opacity 0.8s ease, filter 0.8s ease;
            will-change: opacity, filter;
        }
        
        .mobile-reveal[data-tab-card].in-view {
            opacity: 1 !important;
            filter: blur(0) !important;
            visibility: visible !important;
        }
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
    
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let isAnimating = false;
    let isAutoScrolling = false;

    // --- Helper: Safe Media Trigger ---
    const safeTriggerMedia = (container, play) => {
        if (window.triggerMedia) {
            window.triggerMedia(container, play);
        } else {
            // Fallback for video if global not ready (unlikely)
            const v = container.querySelector('video');
            if (v && play) v.play().catch(()=>{});
            if (v && !play) v.pause();
        }
    };

    // --- DESKTOP: Tab/Stack Logic ---
    const setActive = (index, skipAnimation = false) => {
        if (window.innerWidth < 768) return;
  
        if (index === activeIndex && !skipAnimation) return;
        activeIndex = index;
        if (!skipAnimation) isAnimating = true;
        
        // 1. Update Triggers
        triggers.forEach((t, i) => {
          const isActive = (i === index);
          t.setAttribute('aria-selected', isActive);
          t.classList.toggle('active', isActive);
        });
  
        // 2. Scroll Tab (if needed)
        const activeTrigger = triggers[index];
        const triggerContainer = activeTrigger.parentElement;
        if (triggerContainer && triggerContainer.classList.contains('overflow-x-auto')) {
             const containerRect = triggerContainer.getBoundingClientRect();
             const triggerRect = activeTrigger.getBoundingClientRect();
             const scrollLeft = triggerContainer.scrollLeft + (triggerRect.left - containerRect.left) - (containerRect.width/2) + (triggerRect.width/2);
             triggerContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
  
        // 3. Update Cards
        cards.forEach((c, i) => {
          c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
          const container = c.querySelector('[data-smil-container]');
          
          if (i === index) {
            c.classList.add('active', 'stack-0');
            if (container) safeTriggerMedia(container, true);
            const video = c.querySelector('video');
            if (video && (c.dataset.autoPlay !== 'false')) video.play().catch(()=>{});
            
          } else if (i < index) {
            c.classList.add('inactive-prev');
            const depth = index - i;
            if (depth <= 3) c.classList.add(`stack-${depth}`);
            if (container) safeTriggerMedia(container, false);
            const video = c.querySelector('video');
            if (video) video.pause();
            
          } else {
            c.classList.add('inactive-next');
            if (container) safeTriggerMedia(container, false);
            const video = c.querySelector('video');
            if (video) video.pause();
          }
        });
  
        if (!skipAnimation) setTimeout(() => { isAnimating = false; }, 500);
    };

    // Scroll Track Logic (Desktop)
    if (scrollTrack) {
        const handleScroll = () => {
            if (isAutoScrolling || window.innerWidth < 768) return;
            const rect = scrollTrack.getBoundingClientRect();
            const scrollableRange = rect.height - window.innerHeight;
            let progress = Math.max(0, Math.min(1, -rect.top / scrollableRange));
            const index = Math.min(triggers.length - 1, Math.floor(progress * triggers.length));
            if (index !== activeIndex) setActive(index, true);
        };
        if (window.lenis) window.lenis.on('scroll', handleScroll);
        else window.addEventListener('scroll', handleScroll);
    }

    // Click Logic (Desktop)
    triggers.forEach((trigger, index) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.innerWidth < 768) return; 
          setActive(index);
        });
    });

    // --- RESPONSIVE SWITCH & GLOBAL OBSERVER REGISTRATION ---
    const checkResponsive = () => {
        const isMobile = window.innerWidth < 768;
        const tabContainer = flipper.querySelector('.max-md\\:hidden');
        if (tabContainer) tabContainer.style.display = isMobile ? 'none' : '';

        if (isMobile) {
            // 1. Mobile: Reset Desktop Classes
            cards.forEach(c => {
                c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
            });

            // 2. Mobile: Register with Global Observer
            // We ensure elements are observed efficiently
            if (window.globalObserver) {
                cards.forEach(c => window.globalObserver.observe(c));
            } else {
                console.warn("Global Observer not found, retrying...");
                setTimeout(() => {
                    if (window.globalObserver) cards.forEach(c => window.globalObserver.observe(c));
                }, 500);
            }

        } else {
            // 1. Desktop: Unobserve from Global to prevent conflicts
            if (window.globalObserver) {
                cards.forEach(c => {
                    window.globalObserver.unobserve(c);
                    c.classList.remove('in-view'); // Clean up mobile class
                });
            }

            // 2. Desktop: Restore State
            setActive(activeIndex, true);
        }
    };

    window.addEventListener('resize', checkResponsive);
    checkResponsive();
    
    // Initial Desktop Set
    if (window.innerWidth >= 768) setActive(0, true);
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
