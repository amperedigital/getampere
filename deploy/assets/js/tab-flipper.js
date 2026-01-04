/**
 * Tab Controlled Card Flipper v2.1
 * Manages SMIL animations for 3D cards based on active tab state.
 * Supports 3D transitions via CSS classes managed by this script.
 * Handles the switching of active states between navigation tabs and corresponding content cards.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v2.1 Loaded');

  // Initialize Text Flip Effect
  const flipTexts = document.querySelectorAll('.hover-flip-text');
  flipTexts.forEach(el => {
    const text = el.textContent;
    el.innerHTML = '';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.classList.add('char');
      span.style.transitionDelay = `${i * 30}ms`;
      el.appendChild(span);
    });
  });

  const flippers = document.querySelectorAll('[data-tab-flipper]');

  flippers.forEach(flipper => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    
    if (!triggers.length || !cards.length) return;

    // State
    let activeIndex = 0;
    let isAnimating = false;
    
    // Card Containers
    const crmContainer = document.getElementById('crm-card-container');
    const uc003Container = document.getElementById('uc003-card-container');
    const uc004Container = document.getElementById('uc004-card-container');

    // Check which cards are controlled by this flipper
    const controlsCrm = crmContainer && flipper.contains(crmContainer);
    const controlsUc003 = uc003Container && flipper.contains(uc003Container);
    const controlsUc004 = uc004Container && flipper.contains(uc004Container);

    // State flags for each card
    let isCrmActive = false;
    let isUc003Active = false;
    let isUc004Active = false;
    
    let isCrmHovered = false;
    let isUc003Hovered = false;
    let isUc004Hovered = false;

    // Helper to update SMIL animation state
    function updateSmilState(container, isActive, isHovered, name) {
        if (!container) return;
        
        const shouldRun = isActive || isHovered; // Run if tab is active OR hovered
        
        if (shouldRun) {
            container.classList.add("manual-active");
            const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
            anims.forEach(anim => {
                try {
                    anim.beginElement(); 
                } catch(e) {
                    console.warn(`SMIL error in ${name}:`, e);
                }
            });
        } else {
            container.classList.remove("manual-active");
            const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
            anims.forEach(anim => {
                try {
                    anim.endElement();
                } catch(e) {
                    // ignore
                }
            });
        }
    }

    // Update functions for each card
    function updateCrmState() {
        if (controlsCrm) updateSmilState(crmContainer, isCrmActive, isCrmHovered, 'CRM');
    }
    function updateUc003State() {
        if (controlsUc003) updateSmilState(uc003Container, isUc003Active, isUc003Hovered, 'UC003');
    }
    function updateUc004State() {
        if (controlsUc004) updateSmilState(uc004Container, isUc004Active, isUc004Hovered, 'UC004');
    }

    // Bind Hover Events
    if (controlsCrm) {
        crmContainer.addEventListener('mouseenter', () => { isCrmHovered = true; updateCrmState(); });
        crmContainer.addEventListener('mouseleave', () => { isCrmHovered = false; updateCrmState(); });
        
        // Intersection Observer for CRM (first tab)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && activeIndex === 0) {
                    updateCrmState();
                }
            });
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

    // Initialize
    setActive(0);

    // Event Listeners
    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (index === activeIndex || isAnimating) return;
        setActive(index);
      });
    });

    function setActive(index) {
      isAnimating = true;
      activeIndex = index;
      console.log(`Setting active tab: ${index}`);

      // Update Triggers
      triggers.forEach((t, i) => {
        if (i === index) {
          t.setAttribute('aria-selected', 'true');
          t.setAttribute('data-selected', 'true');
          t.classList.add('active');
        } else {
          t.setAttribute('aria-selected', 'false');
          t.setAttribute('data-selected', 'false');
          t.classList.remove('active');
        }
      });

      // Update Cards
      cards.forEach((c, i) => {
        // Reset classes
        c.classList.remove('active', 'inactive-prev', 'inactive-next');
        
        if (i === index) {
          c.classList.add('active');
          // Play video if present
          const video = c.querySelector('video');
          if (video) video.play().catch(() => {});
        } else {
          // Pause video if present
          const video = c.querySelector('video');
          if (video) {
            video.pause();
            video.currentTime = 0;
          }

          // Determine direction for exit animation
          if (i < index) {
            c.classList.add('inactive-prev');
          } else {
            c.classList.add('inactive-next');
          }
        }
      });

      // Update SMIL States based on active tab index
      // Tab 0: CRM
      isCrmActive = (index === 0);
      updateCrmState();

      // Tab 2: Scheduling (UC_003)
      isUc003Active = (index === 2);
      updateUc003State();

      // Tab 3: ERP (UC_004)
      isUc004Active = (index === 3);
      updateUc004State();

      // Reset animation lock after transition (approx 500ms)
      setTimeout(() => {
        isAnimating = false;
      }, 500);
    }
  });
});
