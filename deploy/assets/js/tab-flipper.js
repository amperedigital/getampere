/**
 * Tab Controlled Card Flipper v1.232-MODULAR
 * Decoupled media engine for generic card content.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.232-MODULAR Loaded');

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
      visibility: visible !important; 
      opacity: 1 !important; 
      transition: none !important;
    }

    .manual-active .crm-ping-element {
      opacity: 1 !important;
      display: block !important;
      animation: crm-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite !important;
    }

    /* Target any container that is NOT active and hide its inner circles/media */
    [data-card-media]:not(.manual-active) circle {
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

    /* Improved Stack CSS Overrides */
    [data-tab-card].stack-0 { --stack-y: 0px !important; z-index: 30 !important; opacity: 1 !important; }
    [data-tab-card].stack-1 { --stack-y: -20px !important; z-index: 20 !important; opacity: 1 !important; }
    [data-tab-card].stack-2 { --stack-y: -40px !important; z-index: 10 !important; opacity: 1 !important; }
    [data-tab-card].stack-3 { --stack-y: -60px !important; z-index: 5 !important; opacity: 1 !important; }
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

  // Re-usable Tab Flipper Logic
  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let isAnimating = false;
    let isAutoScrolling = false; 

    // Generic state tracking for each card
    const cardStates = Array.from(cards).map((card, index) => {
        const mediaContainer = card.querySelector('[data-card-media]');
        return {
            el: card,
            mediaContainer: mediaContainer,
            mediaType: mediaContainer ? mediaContainer.dataset.mediaType : 'none',
            mediaStrategy: mediaContainer ? mediaContainer.dataset.mediaStrategy : 'visibility',
            isActive: index === 0,
            isHovered: false,
            isRevealed: false
        };
    });

    function applyMediaAction(state) {
        const { mediaContainer, mediaType, mediaStrategy, isActive, isHovered, isRevealed } = state;
        if (!mediaContainer) return;
        
        // Logical condition for running animations/media
        const cardInView = state.el.classList.contains('in-view');
        const effectiveRevealed = cardInView || window.innerWidth > 768;
        const shouldRun = (isActive || isHovered || (window.innerWidth < 768 && cardInView)) && effectiveRevealed;

        if (shouldRun) {
            mediaContainer.classList.add("manual-active");
            
            if (mediaType === 'smil') {
                const anims = mediaContainer.querySelectorAll("animate, animateTransform, animateMotion");
                const motionElements = mediaContainer.querySelectorAll("animateMotion");
                
                motionElements.forEach(motion => {
                    if (motion.parentElement) {
                        if (motion.parentElement.classList.contains('always-hide-anim')) return;
                        // Use the data-driven strategy instead of hardcoded IDs
                        const strategyClass = mediaStrategy === 'display' ? 'force-smil-display' : 'force-visible';
                        motion.parentElement.classList.add(strategyClass);
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
            } else if (mediaType === 'video') {
                const video = mediaContainer.querySelector('video');
                if (video) video.play().catch(() => {});
            }
        } else {
            mediaContainer.classList.remove("manual-active");
            
            if (mediaType === 'smil') {
                const anims = mediaContainer.querySelectorAll("animate, animateTransform, animateMotion");
                mediaContainer.querySelectorAll("animateMotion").forEach(motion => {
                    if (motion.parentElement) {
                        motion.parentElement.classList.remove('force-visible', 'force-smil-display');
                    }
                });
                anims.forEach(anim => { try { anim.endElement(); } catch(e) {} });
            } else if (mediaType === 'video') {
                const video = mediaContainer.querySelector('video');
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        }
    }

    // Initialize Card Listeners
    cardStates.forEach((state, index) => {
        if (!state.mediaContainer) return;

        // Hover listeners
        state.el.addEventListener('mouseenter', () => { 
            state.isHovered = true; 
            applyMediaAction(state); 
        });
        state.el.addEventListener('mouseleave', () => { 
            state.isHovered = false; 
            applyMediaAction(state); 
        });

        // Reveal observer for triggering on mobile/scroll entry
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    state.isRevealed = true;
                    applyMediaAction(state);
                }
            });
        }, { threshold: 0.3 });
        observer.observe(state.el);
    });

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

      const activeTrigger = triggers[index];
      const triggerContainer = activeTrigger.parentElement;
      if (triggerContainer && triggerContainer.classList.contains('overflow-x-auto')) {
          const containerRect = triggerContainer.getBoundingClientRect();
          const triggerRect = activeTrigger.getBoundingClientRect();
          const scrollLeft = triggerContainer.scrollLeft + (triggerRect.left - containerRect.left) - (containerRect.width / 2) + (triggerRect.width / 2);
          triggerContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }

      cards.forEach((c, i) => {
        const state = cardStates[i];
        c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
        
        if (i === index) {
          c.classList.add('active', 'stack-0');
          state.isActive = true;
        } else if (i < index) {
          c.classList.add('inactive-prev');
          const depth = index - i;
          if (depth <= 3) c.classList.add(\`stack-\${depth}\`);
          state.isActive = false;
        } else {
          c.classList.add('inactive-next');
          state.isActive = false;
        }
        
        // Update media state for this card
        applyMediaAction(state);
      });

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

    setActive(0, true);

    const revealObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('in-view')) {
                const index = Array.from(cards).indexOf(mutation.target);
                if (index !== -1) applyMediaAction(cardStates[index]);
            }
        });
    });
    cards.forEach(card => revealObserver.observe(card, { attributes: true }));
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
