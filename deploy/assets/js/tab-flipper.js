/**
 * Tab Controlled Card Flipper v1.302 (Updated for v1.471)
 * Modular Refactor: Uses data attributes for SMIL/Video control.
 * Removed hardcoded IDs.
 * Fixed: Mobile responsiveness 
 *  - Disables logic < 768px
 *  - Hides tabs
 *  - Forces cards to display: block!important and position: relative!important so they stack vertically on mobile.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.302 (Modular) Loaded');

  // Inject styles for interaction utilities AND MOBILE OVERRIDES
  const style = document.createElement('style');
  style.textContent = `
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

    .manual-active .crm-ping-element {
      opacity: 1 !important;
      display: block !important;
      animation: crm-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite !important;
    }

    [data-smil-behavior="force-display"]:not(.manual-active) animateMotion,
    [data-smil-behavior="force-display"]:not(.manual-active) circle {
    }

    .smil-hide {
        visibility: hidden;
        opacity: 1;
        transition: none !important;
    }
    
    @keyframes crm-ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    .interaction-tag-label {
      opacity: 0.6;
      transition: opacity 0.3s ease;
    }
    .group:hover .interaction-tag-label,
    .active .interaction-tag-label {
      opacity: 1;
    }

    /* Improved Stack CSS Overrides */
    [data-tab-card].stack-0 { --stack-y: 0px !important; z-index: 30 !important; opacity: 1 !important; }
    [data-tab-card].stack-1 { --stack-y: -20px !important; z-index: 20 !important; opacity: 1 !important; }
    [data-tab-card].stack-2 { --stack-y: -40px !important; z-index: 10 !important; opacity: 1 !important; }
    [data-tab-card].stack-3 { --stack-y: -60px !important; z-index: 5 !important; opacity: 1 !important; }

    /* --- CRITICAL MOBILE OVERRIDES (v1.471) --- */
    @media (max-width: 767px) {
        /* Force Cards to be visible static blocks */
        [data-tab-card],
        .mobile-reveal[data-tab-card] {
            display: block !important;
            position: relative !important;
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            filter: none !important; /* Override blur form mobile-reveal */
            pointer-events: auto !important;
            grid-column: auto !important; /* Break grid overlap if used */
            grid-row: auto !important;
            height: auto !important;
            margin-bottom: 3rem !important; /* Space between cards */
        }
        
        /* Force container to allow stacking */
        .group\/cards {
            display: flex !important;
            flex-direction: column !important;
            gap: 3rem !important;
            height: auto !important;
            perspective: none !important;
        }
    }
  `;
  document.head.appendChild(style);

  // --- Text Interaction Engine ---
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

  // Re-usable Tab Flipper Logic
  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let isAnimating = false;
    let isAutoScrolling = false; 

    // Dynamic SMIL Container Discovery & State (kept for desktop mainly)
    const smilContainers = flipper.querySelectorAll('[data-smil-container]');
    const smilStates = new Map();

    function updateSmilState(container) {
        if (!container) return;
        
        const cardParent = container.closest('[data-tab-card]');
        if (!cardParent) return;
        
        const state = smilStates.get(container) || { hovered: false };
        const isHovered = state.hovered;
        const isActive = cardParent.classList.contains('active');
        const cardInView = cardParent.classList.contains('in-view');
        
        // On mobile, card is always 'active' effectively. 
        // We rely on 'in-view' class from intersection observer (mobile-reveal).
        const isMobile = window.innerWidth < 768;
        const isRevealed = cardInView || !isMobile; // On mobile, wait for scroll reveal? Or just check if in view.
        
        // Simplified Logic: 
        // Desktop: Run if active OR hovered
        // Mobile: Run if in viewport (via manual-active class or external observer).
        
        const shouldRun = isActive || isHovered || (isMobile && cardInView);

        const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
        const motionElements = container.querySelectorAll("animateMotion");
        const behavior = container.dataset.smilBehavior;

        if (shouldRun) {
            container.classList.add("manual-active");
            motionElements.forEach(motion => {
                if (motion.parentElement) {
                    if (motion.parentElement.classList.contains('always-hide-anim')) return;
                    
                    if (behavior === 'force-display') {
                        if (motion.parentElement.classList.contains('hidden')) return;
                        motion.parentElement.classList.add('force-smil-display');
                    } else {
                        motion.parentElement.classList.add('force-visible');
                    }
                }
            });

            anims.forEach(anim => {
                try {
                    const beginAttr = anim.getAttribute('begin');
                    const isDependent = beginAttr && beginAttr.includes('anim-trigger');
                    const isTrigger = anim.id && anim.id.includes('anim-trigger');

                    if (isTrigger) {
                        anim.beginElement();
                    } else if (!isDependent) {
                        anim.beginElement();
                    }
                } catch(e) {}
            });
        } else {
            container.classList.remove("manual-active");
            motionElements.forEach(motion => {
                if (motion.parentElement) {
                    motion.parentElement.classList.remove('force-visible', 'force-smil-display');
                }
            });
            anims.forEach(anim => { try { anim.endElement(); } catch(e) {} });
        }
    }

    // Initialize SMIL Containers
    smilContainers.forEach(container => {
        smilStates.set(container, { hovered: false });

        container.addEventListener('mouseenter', () => { 
            const s = smilStates.get(container);
            s.hovered = true;
            updateSmilState(container); 
        });
        container.addEventListener('mouseleave', () => { 
            const s = smilStates.get(container);
            s.hovered = false;
            updateSmilState(container); 
        });
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { 
                if (entry.isIntersecting) {
                     updateSmilState(container);
                }
            });
        }, { threshold: 0.3 });
        observer.observe(container);
    });

    const setActive = (index, skipAnimation = false) => {
      // GUARD: Strictly disable tab logic on mobile
      if (window.innerWidth < 768) return;

      if (index === activeIndex && !skipAnimation) return;
      activeIndex = index;
      if (!skipAnimation) isAnimating = true;
      
      triggers.forEach((t, i) => {
        const isActive = (i === index);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        t.setAttribute('data-selected', isActive ? 'true' : 'false');
        t.classList.toggle('active', isActive);
      });

      const activeTrigger = triggers[index];
      const triggerContainer = activeTrigger.parentElement;
      if (triggerContainer && triggerContainer.classList.contains('overflow-x-auto')) {
          const containerRect = triggerContainer.getBoundingClientRect();
          const triggerRect = activeTrigger.getBoundingClientRect();
          const scrollLeft = triggerContainer.scrollLeft + (triggerRect.left - containerRect.left) - (containerRect.width / 2) + (triggerRect.width / 2);
          triggerContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }

      cards.forEach((c, i) => {
        c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
        if (i === index) {
          c.classList.add('active', 'stack-0');
          const video = c.querySelector('video');
          if (video && (c.dataset.autoPlay !== 'false')) video.play().catch(() => {});
        } else if (i < index) {
          c.classList.add('inactive-prev');
          const depth = index - i;
          if (depth <= 3) c.classList.add(`stack-${depth}`);
          const video = c.querySelector('video');
          if (video) { video.pause(); video.currentTime = 0; }
        } else {
          c.classList.add('inactive-next');
          const video = c.querySelector('video');
          if (video) { video.pause(); video.currentTime = 0; }
        }
      });

      // Update all SMIL containers since active state changed
      smilContainers.forEach(container => updateSmilState(container));

      if (!skipAnimation) {
          setTimeout(() => { isAnimating = false; }, 500);
      }
    };

    if (scrollTrack) {
        const handleScroll = () => {
            if (isAutoScrolling || window.innerWidth < 768) return;
            const rect = scrollTrack.getBoundingClientRect();
            const relativeScroll = -rect.top;
            const scrollableRange = rect.height - window.innerHeight;
            let progress = Math.max(0, Math.min(1, relativeScroll / scrollableRange));
            const index = Math.min(triggers.length - 1, Math.floor(progress * triggers.length));
            if (index !== activeIndex) setActive(index, true);
        };
        if (window.lenis) window.lenis.on('scroll', handleScroll);
        else window.addEventListener('scroll', handleScroll);
    }

    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.innerWidth < 768) return; 

        if (index === activeIndex) return;
        if (scrollTrack && window.innerWidth >= 768) {
            isAutoScrolling = true;
            const rect = scrollTrack.getBoundingClientRect();
            const sectionTop = window.scrollY + rect.top;
            const scrollableRange = rect.height - window.innerHeight;
            const targetProgress = (index + 0.5) / triggers.length;
            const targetScroll = sectionTop + (targetProgress * scrollableRange);
            if (window.lenis) window.lenis.scrollTo(targetScroll, { onComplete: () => { isAutoScrolling = false; } });
            else { window.scrollTo({ top: targetScroll, behavior: 'smooth' }); setTimeout(() => { isAutoScrolling = false; }, 800); }
        }
        setActive(index);
      });
    });

    // Mobile Responsive Check
    const checkResponsive = () => {
        const isMobile = window.innerWidth < 768;
        
        // 1. Force Hide/Show Tabs Container
        const tabContainer = flipper.querySelector('.max-md\\:hidden');
        if (tabContainer) {
            tabContainer.style.display = isMobile ? 'none' : '';
        }

        // 2. Control Cards State
        if (isMobile) {
            cards.forEach(c => {
                 c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
            });
        } else {
            setActive(activeIndex, true);
        }
    };

    window.addEventListener('resize', checkResponsive);
    checkResponsive(); // Run immediate check
    
    // Only initialize active state if NOT mobile
    if (window.innerWidth >= 768) {
        setActive(0, true);
    }

    const revealObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('in-view')) {
                const card = mutation.target;
                const container = card.querySelector('[data-smil-container]');
                if (container) updateSmilState(container);
            }
        });
    });
    cards.forEach(card => revealObserver.observe(card, { attributes: true }));
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
