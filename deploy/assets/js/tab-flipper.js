/**
 * Tab Controlled Card Flipper v1.170
 * Restored reliable 3D context for desktop.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inject styles for interaction utilities
  const style = document.createElement('style');
  style.textContent = `
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

  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let isAutoScrolling = false;
    
    const crmContainer = document.getElementById('crm-card-container');
    const uc003Container = document.getElementById('uc003-card-container');
    const uc004Container = document.getElementById('uc004-card-container');

    const controlsCrm = crmContainer && flipper.contains(crmContainer);
    const controlsUc003 = uc003Container && flipper.contains(uc003Container);
    const controlsUc004 = uc004Container && flipper.contains(uc004Container);

    let isCrmActive = false, isUc003Active = false, isUc004Active = false;
    let isCrmHovered = false, isUc003Hovered = false, isUc004Hovered = false;

    function updateSmilState(container, isActive, isHovered) {
        if (!container) return;
        const shouldRun = isActive || isHovered;
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

                    if (isTrigger) anim.beginElement();
                    else if (!isDependent) anim.beginElement();
                } catch(e) {}
            });
        } else {
            container.classList.remove("manual-active");
            motionElements.forEach(motion => {
                if (motion.parentElement) motion.parentElement.classList.remove('force-visible', 'force-smil-display');
            });
            anims.forEach(anim => { try { anim.endElement(); } catch(e) {} });
        }
    }

    const updateCrmState = () => controlsCrm && updateSmilState(crmContainer, isCrmActive, isCrmHovered);
    const updateUc003State = () => controlsUc003 && updateSmilState(uc003Container, isUc003Active, isUc003Hovered);
    const updateUc004State = () => controlsUc004 && updateSmilState(uc004Container, isUc004Active, isUc004Hovered);

    // Observer for mobile stack only
    const mobileObserver = new IntersectionObserver((entries) => {
        if (window.innerWidth > 380) return; // Matches the fallback threshold
        entries.forEach(entry => {
            const isVisible = entry.isIntersecting;
            if (entry.target === crmContainer) { isCrmActive = isVisible; updateCrmState(); }
            if (entry.target === uc003Container) { isUc003Active = isVisible; updateUc003State(); }
            if (entry.target === uc004Container) { isUc004Active = isVisible; updateUc004State(); }
        });
    }, { threshold: 0.1 });

    if (controlsCrm) {
        crmContainer.addEventListener('mouseenter', () => { isCrmHovered = true; updateCrmState(); });
        crmContainer.addEventListener('mouseleave', () => { isCrmHovered = false; updateCrmState(); });
        mobileObserver.observe(crmContainer);
    }
    if (controlsUc003) {
        uc003Container.addEventListener('mouseenter', () => { isUc003Hovered = true; updateUc003State(); });
        uc003Container.addEventListener('mouseleave', () => { isUc003Hovered = false; updateUc003State(); });
        mobileObserver.observe(uc003Container);
    }
    if (controlsUc004) {
        uc004Container.addEventListener('mouseenter', () => { isUc004Hovered = true; updateUc004State(); });
        uc004Container.addEventListener('mouseleave', () => { isUc004Hovered = false; updateUc004State(); });
        mobileObserver.observe(uc004Container);
    }

    const setActive = (index, skipAnimation = false) => {
      if (index === activeIndex && !skipAnimation) return;
      activeIndex = index;
      
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
        c.classList.remove('active', 'inactive-prev', 'inactive-next');
        if (i === index) {
          c.classList.add('active');
          const video = c.querySelector('video');
          if (video) video.play().catch(() => {});
        } else {
          const video = c.querySelector('video');
          if (video) { video.pause(); video.currentTime = 0; }
          c.classList.add(i < index ? 'inactive-prev' : 'inactive-next');
        }
      });

      if (window.innerWidth > 380) {
          isCrmActive = (index === 0);
          isUc003Active = (index === 2);
          isUc004Active = (index === 3);
          updateCrmState();
          updateUc003State();
          updateUc004State();
      }
    };

    if (scrollTrack) {
        const handleScroll = () => {
            if (isAutoScrolling || window.innerWidth <= 380) return;

            const rect = scrollTrack.getBoundingClientRect();
            const stickyOffset = window.innerWidth < 768 ? 80 : 96;
            
            const scrollDistance = -rect.top + stickyOffset;
            const scrollableRange = rect.height - window.innerHeight;
            
            let progress = scrollDistance / scrollableRange;
            progress = Math.max(0, Math.min(1, progress));
            
            const numTabs = triggers.length;
            const index = Math.min(numTabs - 1, Math.floor(progress * numTabs));
            
            if (index !== activeIndex) setActive(index, true);
        };

        if (window.lenis) window.lenis.on('scroll', handleScroll);
        else window.addEventListener('scroll', handleScroll);
    }

    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (index === activeIndex) return;

        if (scrollTrack && window.innerWidth > 380) {
            isAutoScrolling = true;
            const rect = scrollTrack.getBoundingClientRect();
            const sectionOffset = window.scrollY + rect.top;
            const stickyOffset = window.innerWidth < 768 ? 80 : 96;
            const scrollableRange = rect.height - window.innerHeight;
            
            const targetProgress = (index + 0.5) / triggers.length;
            const targetScroll = sectionOffset + (targetProgress * scrollableRange) - stickyOffset;

            if (window.lenis) {
                window.lenis.scrollTo(targetScroll, {
                    onComplete: () => { isAutoScrolling = false; }
                });
            } else {
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                setTimeout(() => { isAutoScrolling = false; }, 800);
            }
        }
        
        setActive(index);
      });
    });

    setActive(0, true);
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
