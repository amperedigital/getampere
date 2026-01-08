/**
 * Tab Controlled Card Flipper v1.118
 * Modular Refactor: Support dynamic cards and auto-detected SMIL animations.
 * Added: data-smil-anim detection for per-card animation lifecycles.
 * Updated: Unified card state management with data-stack-depth modular engine.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.118 Loaded');

  // Inject styles for interaction utilities
  const style = document.createElement('style');
  style.textContent = \`
    .manual-active .force-visible {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    .manual-active .force-smil-display {
      display: block !important;
      visibility: hidden; 
      opacity: 1; 
      transition: none !important;
    }

    .manual-active .crm-ping-element {
      opacity: 1 !important;
      display: block !important;
      animation: crm-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite !important;
    }

    [data-smil-anim]:not(.manual-active) .uc004-anim-container circle,
    #uc004-card-container:not(.manual-active) #uc004-anim-container circle {
        opacity: 0 !important;
        visibility: hidden !important;
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

    /* Interaction Utility Classes */
    .interaction-tag-label {
      opacity: 0.6;
      transition: opacity 0.3s ease;
    }
    .group:hover .interaction-tag-label,
    .active .interaction-tag-label {
      opacity: 1;
    }
  \`;
  document.head.appendChild(style);

  // --- Text Interaction Engine ---
  const initializeFlipText = (el) => {
    if (el.dataset.initialized) return;
    const text = el.textContent;
    const delay = parseInt(el.dataset.flipDelay || 30);
    
    el.innerHTML = '';
    Array.from(text).forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\\u00A0' : char;
      span.classList.add('char');
      span.style.transitionDelay = \`\${i * delay}ms\`;
      el.appendChild(span);
    });
    el.dataset.initialized = 'true';
  };

  document.querySelectorAll('.hover-flip-text').forEach(initializeFlipText);

  // Generic SMIL Lifecycle Controller
  const updateSmilState = (container, isActive, isHovered) => {
    if (!container) return;
    
    const cardInView = container.closest('[data-tab-card]')?.classList.contains('in-view');
    const isRevealed = cardInView || window.innerWidth > 768;
    
    // Auto-run if active OR hovered OR (mobile stack mode and in view)
    const shouldRun = (isActive || isHovered || (window.innerWidth <= 389 && cardInView)) && isRevealed;

    const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
    const motionElements = container.querySelectorAll("animateMotion");
    
    if (shouldRun) {
        container.classList.add("manual-active");
        motionElements.forEach(motion => {
            if (motion.parentElement) {
                if (motion.parentElement.classList.contains('always-hide-anim')) return;
                // Specific overrides for complex transparency-based SVGs
                if (container.hasAttribute('data-smil-complex') || container.id?.includes('uc004') || container.id?.includes('uc003')) {
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
                if (isTrigger || !isDependent) anim.beginElement();
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
  };

  // Re-usable Tab Flipper Logic
  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let isAnimating = false;
    let isAutoScrolling = false;

    // Map each card to its specific interaction state
    const cardStates = Array.from(cards).map((card, idx) => {
        const smilContainer = card.querySelector('[data-smil-anim]') || 
                              card.querySelector('#crm-card-container') || 
                              card.querySelector('#uc003-card-container') || 
                              card.querySelector('#uc004-card-container');
        
        let state = {
            element: card,
            smilContainer: smilContainer,
            isHovered: false,
            isActive: false
        };

        if (smilContainer) {
            smilContainer.addEventListener('mouseenter', () => { state.isHovered = true; sync(); });
            smilContainer.addEventListener('mouseleave', () => { state.isHovered = false; sync(); });
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => { 
                  if (entry.isIntersecting) sync(); 
                });
            }, { threshold: 0.1 });
            observer.observe(card);
        }

        return state;
    });

    const sync = () => {
        cardStates.forEach((state, i) => {
            state.isActive = (i === activeIndex);
            if (state.smilContainer) {
                updateSmilState(state.smilContainer, state.isActive, state.isHovered);
            }
        });
    };

    const setActive = (index, skipAnimation = false) => {
      if (index === activeIndex && !skipAnimation) return;
      
      activeIndex = index;
      if (!skipAnimation) isAnimating = true;
      
      triggers.forEach((t, i) => {
        const isActive = (i === index);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        t.setAttribute('data-selected', isActive ? 'true' : 'false');
        t.classList.toggle('active', isActive);
      });

      // Auto-scroll tab container (Mobile)
      const activeTrigger = triggers[index];
      const triggerContainer = activeTrigger.parentElement;
      if (triggerContainer?.classList.contains('overflow-x-auto')) {
          const containerRect = triggerContainer.getBoundingClientRect();
          const triggerRect = activeTrigger.getBoundingClientRect();
          const scrollLeft = triggerContainer.scrollLeft + (triggerRect.left - containerRect.left) - (containerRect.width / 2) + (triggerRect.width / 2);
          triggerContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }

      cards.forEach((c, i) => {
        // Modular Depth Engine: Calculate visual stack position relative to active card
        // (i - index + total) % total ensures that cards cycle through the stack slots.
        const depth = (i - index + cards.length) % cards.length;
        c.setAttribute('data-stack-depth', depth);

        c.classList.remove('active', 'inactive-prev', 'inactive-next');
        const video = c.querySelector('video');
        if (i === index) {
          c.classList.add('active');
          if (video) video.play().catch(() => {});
        } else {
          if (video) { video.pause(); video.currentTime = 0; }
          c.classList.add(i < index ? 'inactive-prev' : 'inactive-next');
        }
      });

      sync();

      if (!skipAnimation) {
          setTimeout(() => { isAnimating = false; }, 500);
      }
    };

    // Scroll Sync logic
    if (scrollTrack) {
        const handleScroll = () => {
            if (isAutoScrolling || window.innerWidth <= 389) return;
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
        if (index === activeIndex) return;

        if (scrollTrack && window.innerWidth > 389) {
            isAutoScrolling = true;
            const rect = scrollTrack.getBoundingClientRect();
            const sectionTop = window.scrollY + rect.top;
            const scrollableRange = rect.height - window.innerHeight;
            const targetProgress = (index + 0.5) / triggers.length;
            const targetScroll = sectionTop + (targetProgress * scrollableRange);

            if (window.lenis) {
                window.lenis.scrollTo(targetScroll, { onComplete: () => { isAutoScrolling = false; } });
            } else {
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                setTimeout(() => { isAutoScrolling = false; }, 800);
            }
        }
        setActive(index);
      });
    });

    setActive(0, true);

    const revealObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('in-view')) sync();
        });
    });
    cards.forEach(card => revealObserver.observe(card, { attributes: true }));
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
