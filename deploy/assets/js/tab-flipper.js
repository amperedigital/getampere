/**
 * Tab Controlled Card Flipper v1.305
 * Unified "Observer-First" Approach
 * - Desktop: Uses Tab Click/Scroll logic (Active State).
 * - Mobile: Uses pure IntersectionObserver (In-View State).
 * - Logic: "If it's in view, show it. If it's in view, play media."
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.305 (Observer First) Loaded');

  // --- 1. CSS Injection (Mobile Layout & Utilities) ---
  const style = document.createElement('style');
  style.textContent = `
    /* Utility: Force Visibility for SMIL */
    .manual-active .force-visible {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .manual-active .force-smil-display {
      display: block !important;
      visibility: visible !important; 
      opacity: 1 !important; 
      transition: none !important;
    }
    
    /* Animation Helpers */
    .manual-active .crm-ping-element {
      opacity: 1 !important;
      display: block !important;
      animation: crm-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite !important;
    }
    @keyframes crm-ping { 
      75%, 100% { transform: scale(2); opacity: 0; } 
    }

    /* Stack Logic (Desktop Only) */
    [data-tab-card].stack-0 { --stack-y: 0px !important; z-index: 30 !important; opacity: 1 !important; }
    [data-tab-card].stack-1 { --stack-y: -20px !important; z-index: 20 !important; opacity: 1 !important; }
    [data-tab-card].stack-2 { --stack-y: -40px !important; z-index: 10 !important; opacity: 1 !important; }
    [data-tab-card].stack-3 { --stack-y: -60px !important; z-index: 5 !important; opacity: 1 !important; }

    /* --- MOBILE VIEWPORT LOGIC (<768px) --- */
    @media (max-width: 767px) {
        
        /* 1. Parent Section / Container Safety */
        /* Ensure the section and grid expand to fit content */
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
            gap: 4rem !important; /* Generous gap */
            padding-bottom: 4rem !important; /* Bottom buffer */
        }

        /* 3. Card Base Styles */
        /* Reset positioning to static flow */
        [data-tab-card] {
            display: block !important;
            position: relative !important;
            inset: auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 450px;
            
            /* Reset Grid/Transform junk */
            grid-column: auto !important;
            grid-row: auto !important;
            transform: none !important;
            --stack-y: 0px !important;
            
            margin-bottom: 0 !important; /* Handled by container gap */
        }

        /* 4. Visibility Logic (Driven by .in-view) */
        /* Default State (Hidden/Pre-reveal) */
        .mobile-reveal[data-tab-card] {
            opacity: 0;
            filter: blur(10px);
            transition: opacity 0.8s ease, filter 0.8s ease;
            will-change: opacity, filter;
        }
        
        /* Visible State (Added by Observer) */
        .mobile-reveal[data-tab-card].in-view {
            opacity: 1 !important;
            filter: blur(0) !important;
            visibility: visible !important;
        }
    }
  `;
  document.head.appendChild(style);

  // --- 2. Text Interaction Engine (Keep as is) ---
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

  // --- 3. HELPER: SMIL / Media Controller ---
  // Triggers animations within a container
  function triggerMedia(container, shouldPlay) {
      if (!container) return;
      
      const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
      const behavior = container.dataset.smilBehavior;
      const motionElements = container.querySelectorAll("animateMotion");
      const videos = container.querySelectorAll('video');

      if (shouldPlay) {
          // A. SMIL Animations
          container.classList.add("manual-active");
          
          // Force visibility for motion paths
          motionElements.forEach(motion => {
            if (motion.parentElement && !motion.parentElement.classList.contains('always-hide-anim')) {
                const cls = (behavior === 'force-display') ? 'force-smil-display' : 'force-visible';
                if (!motion.parentElement.classList.contains('hidden') || behavior !== 'force-display') {
                    motion.parentElement.classList.add(cls);
                }
            }
          });

          // Begin Elements
          anims.forEach(anim => {
              try {
                  const beginAttr = anim.getAttribute('begin');
                  const isDependent = beginAttr && beginAttr.includes('anim-trigger');
                  const isTrigger = anim.id && anim.id.includes('anim-trigger');
                  if (isTrigger || !isDependent) {
                      anim.beginElement(); 
                  }
              } catch(e) {}
          });

          // B. Video Playback
          if (container.closest('[data-tab-card]')) {
             // If container is inside card, logic handled nicely usually, but explicit check here:
          }
          videos.forEach(v => {
              if (v.paused) v.play().catch(() => {});
          });

      } else {
          // Stop/Pause
          container.classList.remove("manual-active");
          motionElements.forEach(motion => {
             if (motion.parentElement) motion.parentElement.classList.remove('force-visible', 'force-smil-display');
          });
          // anims.forEach(anim => { try { anim.endElement(); } catch(e) {} }); // Optional: don't force end, let loop
          videos.forEach(v => v.pause());
      }
  }


  // --- 4. Main Flipper Logic ---
  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    const smilContainers = flipper.querySelectorAll('[data-smil-container]');
    
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let isAnimating = false;
    let isAutoScrolling = false;

    // --- MOBILE: Intersection Observer Strategy ---
    const observer = new IntersectionObserver((entries) => {
        // Only run on mobile or if simplified logic desired
        if (window.innerWidth >= 768) return; 

        entries.forEach(entry => {
            const card = entry.target;
            const container = card.querySelector('[data-smil-container]');
            
            if (entry.isIntersecting) {
                // 1. Reveal (Visual)
                card.classList.add('in-view');
                
                // 2. Play Media (SMIL & Video)
                if (container) triggerMedia(container, true);
                const video = card.querySelector('video');
                if (video) video.play().catch(()=>{});

            } else {
                // 1. Hide (Optional - allows re-reveal)
                // card.classList.remove('in-view'); // Uncomment to re-animate fade on every scroll
                
                // 2. Pause Media
                if (container) triggerMedia(container, false);
                const video = card.querySelector('video');
                if (video) video.pause();
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    cards.forEach(card => observer.observe(card));

    // --- DESKTOP: Tab/Stack Logic ---
    const setActive = (index, skipAnimation = false) => {
        // GUARD: Strictly disable tab logic on mobile
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
  
        // 2. Scroll Tab into view (if list is long)
        const activeTrigger = triggers[index];
        const triggerContainer = activeTrigger.parentElement;
        if (triggerContainer && triggerContainer.classList.contains('overflow-x-auto')) {
             // ... scroll logic ...
             const containerRect = triggerContainer.getBoundingClientRect();
             const triggerRect = activeTrigger.getBoundingClientRect();
             const scrollLeft = triggerContainer.scrollLeft + (triggerRect.left - containerRect.left) - (containerRect.width/2) + (triggerRect.width/2);
             triggerContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
  
        // 3. Update Cards (Stacking)
        cards.forEach((c, i) => {
          c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
          const container = c.querySelector('[data-smil-container]');
          
          if (i === index) {
            c.classList.add('active', 'stack-0');
            // Play Media
            if (container) triggerMedia(container, true);
            const video = c.querySelector('video');
            if (video && (c.dataset.autoPlay !== 'false')) video.play().catch(()=>{});
            
          } else if (i < index) {
            c.classList.add('inactive-prev');
            const depth = index - i;
            if (depth <= 3) c.classList.add(`stack-${depth}`);
            // Stop Media
            if (container) triggerMedia(container, false);
            const video = c.querySelector('video');
            if (video) video.pause();
            
          } else {
            c.classList.add('inactive-next');
            // Stop Media
            if (container) triggerMedia(container, false);
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
            // ... simple mapped progress ...
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

    // --- RESPONSIVE SWITCHER ---
    const checkResponsive = () => {
        const isMobile = window.innerWidth < 768;
        const tabContainer = flipper.querySelector('.max-md\\:hidden');
        if (tabContainer) tabContainer.style.display = isMobile ? 'none' : '';

        if (isMobile) {
            // Reset Desktop Classes
            cards.forEach(c => {
                c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
            });
            // (Observer handles the rest)
        } else {
            // Restore Desktop State
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
