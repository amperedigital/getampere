/**
 * Tab Controlled Card Flipper v1.124
 * Balanced modular version: Restores stable "Perfected" build-up behavior.
 * Fixes: SMIL detailed views (text boxes) now correctly ONLY show on Hover or Mobile scroll.
 * Fixes: Explicit elements (.crm-animated-element) join reveal lifecycle, but tooltips are EXCLUDED for individual hover.
 * Fixes: Dynamic stack depth calculation for seamless modular support.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.124 Loaded');

  const style = document.createElement('style');
  style.textContent = `
    .force-visible {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    .force-smil-display {
      display: block !important;
      visibility: visible !important; 
      opacity: 1 !important; 
    }

    .manual-active .crm-ping-element {
      opacity: 1 !important;
      display: block !important;
      animation: crm-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite !important;
    }

    @keyframes crm-ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }

    .interaction-tag-label {
      opacity: 0.6;
      transition: opacity 0.3s ease;
    }
    .group:hover .interaction-tag-label,
    .active .interaction-tag-label {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

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

  // Generic SMIL Lifecycle Controller
  const updateSmilState = (container, isActive, isHovered) => {
    if (!container) return;
    
    const card = container.closest('[data-tab-card]');
    const cardInView = card?.classList.contains('in-view');
    const isRevealed = cardInView || window.innerWidth > 768;
    
    // Animation runs if ACTIVE or HOVERED
    const shouldRunAnim = (isActive || isHovered) && isRevealed;
    // Detail boxes (force-visible) ONLY show on HOVER or MOBILE-IN-VIEW
    const shouldShowDetails = (isHovered || (window.innerWidth <= 389 && cardInView)) && isRevealed;

    const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
    const motionElements = container.querySelectorAll("animateMotion");
    const explicitElements = container.querySelectorAll(".crm-animated-element, .crm-ping-element, [data-smil-anim-target], .smil-hide");
    
    const toggleTarget = (el) => {
        if (!el || el.classList.contains('always-hide-anim')) return;
        if (shouldShowDetails) {
            if (container.hasAttribute('data-smil-complex') || container.id?.includes('uc004') || container.id?.includes('uc003')) {
                if (!el.classList.contains('hidden')) el.classList.add('force-smil-display');
            } else {
                el.classList.add('force-visible');
            }
        } else {
            el.classList.remove('force-visible', 'force-smil-display');
        }
    };

    if (shouldRunAnim) {
        container.classList.add("manual-active");
        motionElements.forEach(motion => toggleTarget(motion.parentElement));
        explicitElements.forEach(el => toggleTarget(el));

        anims.forEach(anim => {
            try {
                const beginAttr = anim.getAttribute('begin');
                if (!beginAttr || !beginAttr.includes('anim-trigger')) anim.beginElement();
            } catch(e) {}
        });
    } else {
        container.classList.remove("manual-active");
        motionElements.forEach(motion => {
            if (motion.parentElement) motion.parentElement.classList.remove('force-visible', 'force-smil-display');
        });
        explicitElements.forEach(el => el.classList.remove('force-visible', 'force-smil-display'));
        anims.forEach(anim => { try { anim.endElement(); } catch(e) {} });
    }
  };

  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let isAnimating = false;
    let isAutoScrolling = false;

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

      cards.forEach((c, i) => {
        c.classList.remove('active', 'inactive-prev', 'inactive-next');
        const video = c.querySelector('video');
        
        if (i === index) {
          c.classList.add('active');
          c.setAttribute('data-stack-depth', '0');
          if (video) video.play().catch(() => {});
        } else if (i < index) {
          c.classList.add('inactive-prev');
          c.setAttribute('data-stack-depth', index - i);
          if (video) { video.pause(); video.currentTime = 0; }
        } else {
          c.classList.add('inactive-next');
          c.setAttribute('data-stack-depth', 'hidden');
          if (video) { video.pause(); video.currentTime = 0; }
        }
      });

      sync();
      if (!skipAnimation) setTimeout(() => { isAnimating = false; }, 500);
    };

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
            if (window.lenis) window.lenis.scrollTo(targetScroll, { onComplete: () => { isAutoScrolling = false; } });
            else { window.scrollTo({ top: targetScroll, behavior: 'smooth' }); setTimeout(() => { isAutoScrolling = false; }, 800); }
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
