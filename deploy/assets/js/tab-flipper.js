/**/**



























































































































































































































































});  });    }      }, 500);        isAnimating = false;      setTimeout(() => {      // Reset animation lock after transition (approx 500ms)      updateUc004State();      isUc004Active = (index === 3);      // Tab 3: ERP (UC_004)      updateUc003State();      isUc003Active = (index === 2);      // Tab 2: Scheduling (UC_003)      updateCrmState();      isCrmActive = (index === 0);      // Tab 0: CRM      // Update SMIL States based on active tab index      });        }          }            c.classList.add('inactive-next');          } else {            c.classList.add('inactive-prev');          if (i < index) {          // Determine direction for exit animation          }            video.currentTime = 0;            video.pause();          if (video) {          const video = c.querySelector('video');          // Pause video if present        } else {          if (video) video.play().catch(() => {});          const video = c.querySelector('video');          // Play video if present          c.classList.add('active');        if (i === index) {                c.classList.remove('active', 'inactive-prev', 'inactive-next');        // Reset classes      cards.forEach((c, i) => {      // Update Cards      });        }          t.classList.remove('active');          t.setAttribute('data-selected', 'false');          t.setAttribute('aria-selected', 'false');        } else {          t.classList.add('active');          t.setAttribute('data-selected', 'true');          t.setAttribute('aria-selected', 'true');        if (i === index) {      triggers.forEach((t, i) => {      // Update Triggers      console.log(`Setting active tab: ${index}`);      activeIndex = index;      isAnimating = true;    function setActive(index) {    });      });        setActive(index);        if (index === activeIndex || isAnimating) return;        e.preventDefault();      trigger.addEventListener('click', (e) => {    triggers.forEach((trigger, index) => {    // Event Listeners    setActive(0);    // Initialize    }        uc004Container.addEventListener('mouseleave', () => { isUc004Hovered = false; updateUc004State(); });        uc004Container.addEventListener('mouseenter', () => { isUc004Hovered = true; updateUc004State(); });    if (controlsUc004) {    }        uc003Container.addEventListener('mouseleave', () => { isUc003Hovered = false; updateUc003State(); });        uc003Container.addEventListener('mouseenter', () => { isUc003Hovered = true; updateUc003State(); });    if (controlsUc003) {    }        observer.observe(crmContainer);        }, { threshold: 0.3 });            });                }                    updateCrmState();                if (entry.isIntersecting && activeIndex === 0) {            entries.forEach(entry => {        const observer = new IntersectionObserver((entries) => {        // Intersection Observer for CRM (first tab)                crmContainer.addEventListener('mouseleave', () => { isCrmHovered = false; updateCrmState(); });        crmContainer.addEventListener('mouseenter', () => { isCrmHovered = true; updateCrmState(); });    if (controlsCrm) {    // Bind Hover Events    }        if (controlsUc004) updateSmilState(uc004Container, isUc004Active, isUc004Hovered, 'UC004');    function updateUc004State() {    }        if (controlsUc003) updateSmilState(uc003Container, isUc003Active, isUc003Hovered, 'UC003');    function updateUc003State() {    }        if (controlsCrm) updateSmilState(crmContainer, isCrmActive, isCrmHovered, 'CRM');    function updateCrmState() {    // Update functions for each card    }        }            });                }                    // ignore                } catch(e) {                    anim.endElement();                try {            anims.forEach(anim => {            // Stop Animations            });                }                    motion.parentElement.classList.remove('force-visible');                if (motion.parentElement) {            motionElements.forEach(motion => {            // Remove forced visibility                        container.classList.remove("manual-active");        } else {            });                }                    console.warn(`SMIL begin error in ${name}:`, e);                } catch(e) {                    }                        anim.beginElement();                    else {                    // If it's independent (e.g. center pulse with no begin or begin="0s"), begin it                    }                        // Do nothing, the trigger will start it                    else if (isDependent) {                    // If it's dependent, DO NOT manually begin (let the trigger handle it)                    }                        anim.beginElement();                    if (isTrigger) {                    // If it's the master trigger, always begin                    const isTrigger = anim.id && anim.id.includes('anim-trigger');                    const isDependent = beginAttr && beginAttr.includes('anim-trigger');                    const beginAttr = anim.getAttribute('begin');                    // Check if this animation depends on a trigger                try {            anims.forEach(anim => {            // Trigger Animations            });                }                    motion.parentElement.classList.add('force-visible');                if (motion.parentElement) {            motionElements.forEach(motion => {            // Force visibility on elements with motion animations                        container.classList.add("manual-active");        if (shouldRun) {                const motionElements = container.querySelectorAll("animateMotion");        // Select elements that should be visible during animation (parents of animateMotion)        const anims = container.querySelectorAll("animate, animateTransform, animateMotion");        // Select all animation elements                const shouldRun = isActive || isHovered;                if (!container) return;    function updateSmilState(container, isActive, isHovered, name) {    // Helper to update SMIL animation state    let isUc004Hovered = false;    let isUc003Hovered = false;    let isCrmHovered = false;        let isUc004Active = false;    let isUc003Active = false;    let isCrmActive = false;    // State flags for each card    const controlsUc004 = uc004Container && flipper.contains(uc004Container);    const controlsUc003 = uc003Container && flipper.contains(uc003Container);    const controlsCrm = crmContainer && flipper.contains(crmContainer);    // Check which cards are controlled by this flipper    const uc004Container = document.getElementById('uc004-card-container');    const uc003Container = document.getElementById('uc003-card-container');    const crmContainer = document.getElementById('crm-card-container');    // Card Containers        let isAnimating = false;    let activeIndex = 0;    // State    if (!triggers.length || !cards.length) return;        const cards = flipper.querySelectorAll('[data-tab-card]');    const triggers = flipper.querySelectorAll('[data-tab-trigger]');  flippers.forEach(flipper => {  const flippers = document.querySelectorAll('[data-tab-flipper]');  });    });      el.appendChild(span);      span.style.transitionDelay = `${i * 30}ms`;      span.classList.add('char');      span.textContent = char;      const span = document.createElement('span');    [...text].forEach((char, i) => {    el.innerHTML = '';    const text = el.textContent;  flipTexts.forEach(el => {  const flipTexts = document.querySelectorAll('.hover-flip-text');  // Initialize Text Flip Effect  document.head.appendChild(style);  `;    }      animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite !important;      opacity: 1 !important;    .manual-active .crm-ping-element {    }      opacity: 1 !important;      visibility: visible !important;      display: block !important;    .manual-active .force-visible {  style.textContent = `  const style = document.createElement('style');  // Inject styles for forced visibility of animated elements  console.log('Tab Flipper v2.2 Loaded');document.addEventListener('DOMContentLoaded', () => { */ * Handles the switching of active states between navigation tabs and corresponding content cards. * Supports 3D transitions via CSS classes managed by this script. * Manages SMIL animations for 3D cards based on active tab state. * Tab Controlled Card Flipper v2.2 * Tab Controlled Card Flipper v2.1
 * Manages SMIL animations for 3D cards based on active tab state.
 * Supports 3D transitions via CSS classes managed by this script.
 * Handles the switching of active states between navigation tabs and corresponding content cards.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v2.1 Loaded');

  // Inject styles for forced visibility of animated elements
  const style = document.createElement('style');
  style.textContent = `
    .manual-active .force-visible {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);

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
        
        const shouldRun = isActive || isHovered;
        
        // Select all animation elements
        const anims = container.querySelectorAll("animate, animateTransform, animateMotion");
        // Select elements that should be visible during animation (parents of animateMotion)
        const motionElements = container.querySelectorAll("animateMotion");
        
        if (shouldRun) {
            container.classList.add("manual-active");
            
            // Force visibility on elements with motion animations
            motionElements.forEach(motion => {
                if (motion.parentElement) {
                    motion.parentElement.classList.add('force-visible');
                }
            });

            // Trigger Animations
            anims.forEach(anim => {
                try {
                    // Check if this animation depends on a trigger
                    const beginAttr = anim.getAttribute('begin');
                    const isDependent = beginAttr && beginAttr.includes('anim-trigger');
                    const isTrigger = anim.id && anim.id.includes('anim-trigger');

                    // If it's the master trigger, always begin
                    if (isTrigger) {
                        anim.beginElement();
                    }
                    // If it's dependent, DO NOT manually begin (let the trigger handle it)
                    else if (isDependent) {
                        // Do nothing, the trigger will start it
                    }
                    // If it's independent (e.g. center pulse with no begin or begin="0s"), begin it
                    else {
                        anim.beginElement();
                    }
                } catch(e) {
                    console.warn(`SMIL begin error in ${name}:`, e);
                }
            });

        } else {
            container.classList.remove("manual-active");
            
            // Remove forced visibility
            motionElements.forEach(motion => {
                if (motion.parentElement) {
                    motion.parentElement.classList.remove('force-visible');
                }
            });

            // Stop Animations
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
