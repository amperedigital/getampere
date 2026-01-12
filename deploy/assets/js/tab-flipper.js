/**
 * Tab Controlled Card Flipper v1.116-REPAIR
 * Fixed in current session for v1.215 Release
 * Added: Pinned Scroll Sync logic + Mobile Tab Scroll Sync.
 * Updated stickyOffset for top margin alignment.
 * Added: Mobile Reveal Animation Sync.
 * Fix: visibility: visible for active SMIL elements (Auto-start fix).
 * Fix: Improved stacking logic to ensure consistent 4-card depth.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.116-REPAIR-STACKED Loaded');

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
      span.textContent = char === ' ' ? '\u00A0' : char;
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
    
    const crmContainer = document.getElementById('crm-card-container');
    const uc003Container = document.getElementById('uc003-card-container');
    const uc004Container = document.getElementById('uc004-card-container');

    const controlsCrm = crmContainer && flipper.contains(crmContainer);
    const controlsUc003 = uc003Container && flipper.contains(uc003Container);
    const controlsUc004 = uc004Container && flipper.contains(uc004Container);

    let isCrmActive = false, isUc003Active = false, isUc004Active = false;
    let isCrmHovered = false, isUc003Hovered = false, isUc004Hovered = false;

    function updateSmilState(container, isActive, isHovered, name) {
        if (!container) return;
        
        const cardParent = container.closest('[data-tab-card]');
        if (!cardParent) return;
        
        const cardInView = cardParent.classList.contains('in-view');
        const isRevealed = cardInView || window.innerWidth > 768;
        const shouldRun = (isActive || isHovered || (window.innerWidth < 768 && cardInView)) && isRevealed;

        const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
        const motionElements = container.querySelectorAll("animateMotion");
        
        if (shouldRun) {
            container.classList.add("manual-active");
            motionElements.forEach(motion => {
                if (motion.parentElement) {
                    if (motion.parentElement.classList.contains('always-hide-anim')) return;
                    if (container.id === 'uc004-card-container' || container.id === 'uc003-card-container') {
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

    const updateCrmState = () => controlsCrm && updateSmilState(crmContainer, isCrmActive, isCrmHovered, 'CRM');
    const updateUc003State = () => controlsUc003 && updateSmilState(uc003Container, isUc003Active, isUc003Hovered, 'UC003');
    const updateUc004State = () => controlsUc004 && updateSmilState(uc004Container, isUc004Active, isUc004Hovered, 'UC004');
                                                                                                                          
    if (controlsCrm) {
        crmContainer.addEventListener('mouseenter', () => { isCrmHovered = true; updateCrmState(); });
        crmContainer.addEventListener('mouseleave', () => { isCrmHovered = false; updateCrmState(); });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting && (activeIndex === 0 || window.innerWidth < 768)) updateCrmState(); });
        }, { threshold: 0.3 });
        observer.observe(crmContainer);
    }

    if (controlsUc003) {
        uc003Container.addEventListener('mouseenter', () => { isUc003Hovered = true; updateUc003State(); });
        uc003Container.addEventListener('mouseleave', () => { isUc003Hovered = false; updateUc003State(); });
    }

    if (controlsUc004) {
        uc004Container.addEventListener('mouseenter', () => { isUc004Hovered = true; updateUc004State(); });
        uc004Container.addEventListener('mouseleave', () => { isUc004Hovered = false; updateUc004State(); });
    }

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
        c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
        if (i === index) {
          c.classList.add('active', 'stack-0');
          const video = c.querySelector('video');
          if (video) video.play().catch(() => {});
        } else if (i < index) {
          c.classList.add('inactive-prev');
          const depth = index - i;
          if (depth <= 3) c.classList.add(\`stack-\${depth}\`);
          const video = c.querySelector('video');
          if (video) { video.pause(); video.currentTime = 0; }
        } else {
          c.classList.add('inactive-next');
          const depth = i - index;
          if (depth <= 3) c.classList.add(\`stack-\${depth}\`);
          const video = c.querySelector('video');
          if (video) { video.pause(); video.currentTime = 0; }
        }
      });

      isCrmActive = (index === 0);
      isUc003Active = (index === 2);
      isUc004Active = (index === 3);
      
      updateCrmState();
      updateUc003State();
      updateUc004State();

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
                updateCrmState();
                updateUc003State();
                updateUc004State();
            }
        });
    });
    cards.forEach(card => revealObserver.observe(card, { attributes: true }));
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
