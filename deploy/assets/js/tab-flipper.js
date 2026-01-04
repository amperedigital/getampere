/**/**/**



























































































































































































});  });    }      }, 500);        isAnimating = false;      setTimeout(() => {      // Reset animation lock after transition (approx 500ms)      if (controlsUc004) updateUc004State();      if (controlsUc003) updateUc003State();      if (controlsCrm) updateCrmState();      isUc004TabActive = (index === 3);      isUc003TabActive = (index === 2);      isCrmTabActive = (index === 0);      // Update States for 3D Cards      });        }          }            c.classList.add('inactive-next');          } else {            c.classList.add('inactive-prev');          if (i < index) {          // Determine direction for exit animation          }            video.currentTime = 0;            video.pause();          if (video) {          const video = c.querySelector('video');          // Pause video if present        } else {          if (video) video.play().catch(() => {});          const video = c.querySelector('video');          // Play video if present          c.classList.add('active');        if (i === index) {                c.classList.remove('active', 'inactive-prev', 'inactive-next');        // Reset classes      cards.forEach((c, i) => {      // Update Cards      });        }          t.classList.remove('active');          t.setAttribute('data-selected', 'false');          t.setAttribute('aria-selected', 'false');        } else {          t.classList.add('active');          t.setAttribute('data-selected', 'true');          t.setAttribute('aria-selected', 'true');        if (i === index) {      triggers.forEach((t, i) => {      // Update Triggers      activeIndex = index;      isAnimating = true;    function setActive(index) {    });      });        setActive(index);        if (index === activeIndex || isAnimating) return;        e.preventDefault();      trigger.addEventListener('click', (e) => {    triggers.forEach((trigger, index) => {    // Event Listeners    setActive(0);    // Initialize    // so they handle hover natively. We only need JS to force them when the tab is active.    // The SMIL animations have `begin="container.mouseenter"` in the SVG,     // However, for SMIL, we might want them to run on hover too if not active?    // but the CSS :hover on the container might be enough for the 3D part.    // The original code also had hover listeners to trigger state updates,     // even if not hovered, or resets them when inactive.    // The JS here ensures the SMIL animations run when the tab is active,     // Note: The CSS handles hover effects for the 3D transform.     // Bind Hover Events    }        }            });                try { anim.endElement(); } catch(e) {}            anims.forEach(anim => {            const anims = uc004Container.querySelectorAll("animate, animateTransform, animateMotion");            uc004Container.classList.remove('manual-active');        } else {            });                try { anim.beginElement(); } catch(e) {}            anims.forEach(anim => {            const anims = uc004Container.querySelectorAll("animate, animateTransform, animateMotion");            uc004Container.classList.add("manual-active");        if (isUc004TabActive) {        if (!controlsUc004 || !uc004Container) return;    function updateUc004State() {    let isUc004TabActive = false;    const controlsUc004 = uc004Container && flipper.contains(uc004Container);    const uc004Container = document.getElementById('uc004-card-container');    // --- UC_004 Card State Logic (Index 3) ---    }        }            });                try { anim.endElement(); } catch(e) {}            anims.forEach(anim => {            const anims = uc003Container.querySelectorAll("animate, animateTransform, animateMotion");            uc003Container.classList.remove('manual-active');        } else {            });                try { anim.beginElement(); } catch(e) {}            anims.forEach(anim => {            const anims = uc003Container.querySelectorAll("animate, animateTransform, animateMotion");            uc003Container.classList.add("manual-active");        if (isUc003TabActive) {        if (!controlsUc003 || !uc003Container) return;    function updateUc003State() {    let isUc003TabActive = false;    const controlsUc003 = uc003Container && flipper.contains(uc003Container);    const uc003Container = document.getElementById('uc003-card-container');    // --- UC_003 Card State Logic (Index 2) ---    }        }            });                try { anim.endElement(); } catch(e) {}            anims.forEach(anim => {            const anims = crmContainer.querySelectorAll("animate, animateTransform, animateMotion");            crmContainer.classList.remove('manual-active');        } else {            });                try { anim.beginElement(); } catch(e) {}            anims.forEach(anim => {            const anims = crmContainer.querySelectorAll("animate, animateTransform, animateMotion");            crmContainer.classList.add("manual-active");        if (isCrmTabActive) {                // Actually, for the 3D card, we want the animation to run if the tab is active.        // here we force active state for SMIL when tab is selected)        // Active if tab is active OR hovered (but hover logic handled by CSS mostly,                 if (!controlsCrm || !crmContainer) return;    function updateCrmState() {        let isCrmTabActive = false;    const controlsCrm = crmContainer && flipper.contains(crmContainer);    const crmContainer = document.getElementById('crm-card-container');    // --- CRM Card State Logic (Index 0) ---        let isAnimating = false;    let activeIndex = 0;    // State    if (!triggers.length || !cards.length) return;        const cards = flipper.querySelectorAll('[data-tab-card]');    const triggers = flipper.querySelectorAll('[data-tab-trigger]');  flippers.forEach(flipper => {  const flippers = document.querySelectorAll('[data-tab-flipper]');  });    });      el.appendChild(span);      span.style.transitionDelay = `${i * 30}ms`;      span.classList.add('char');      span.textContent = char;      const span = document.createElement('span');    [...text].forEach((char, i) => {    el.innerHTML = '';    const text = el.textContent;  flipTexts.forEach(el => {  const flipTexts = document.querySelectorAll('.hover-flip-text');  // Initialize Text Flip Effectdocument.addEventListener('DOMContentLoaded', () => { */ * Supports 3D transitions via CSS classes managed by this script. * Handles the switching of active states between navigation tabs and corresponding content cards. * Tab Controlled Card Flipper


































































































































































































































});  });    }      }, 500);        isAnimating = false;      setTimeout(() => {      // Reset animation lock after transition (approx 500ms)      });        }          }            c.classList.add('inactive-next');          } else {            c.classList.add('inactive-prev');          if (i < index) {          // Determine direction for exit animation          }            video.currentTime = 0;            video.pause();          if (video) {          const video = c.querySelector('video');          // Pause video if present        } else {          }             updateUc003State();             isUc003TabActive = false;          } else if (controlsUc003) {             updateUc003State();             isUc003TabActive = true;          if (index === 2 && controlsUc003) {          // Update UC003 State based on Tab 2          }             updateCrmState();             isTabActive = false;          } else if (controlsCrm) {             updateCrmState();             isTabActive = true;          if (index === 0 && controlsCrm) {          // Update CRM State based on Tab 0          if (video) video.play().catch(() => {});          const video = c.querySelector('video');          // Play video if present          c.classList.add('active');        if (i === index) {                c.classList.remove('active', 'inactive-prev', 'inactive-next');        // Reset classes      cards.forEach((c, i) => {      // Update Cards      });        }          t.classList.remove('active');          t.setAttribute('data-selected', 'false');          t.setAttribute('aria-selected', 'false');        } else {          t.classList.add('active');          t.setAttribute('data-selected', 'true');          t.setAttribute('aria-selected', 'true');        if (i === index) {      triggers.forEach((t, i) => {      // Update Triggers      activeIndex = index;      isAnimating = true;    function setActive(index) {    });      });        setActive(index);        if (index === activeIndex || isAnimating) return;        e.preventDefault();      trigger.addEventListener('click', (e) => {    triggers.forEach((trigger, index) => {    // Event Listeners    setActive(0);    // Initialize    }        });            updateUc003State();            isUc003Hovered = false;        uc003Container.addEventListener('mouseleave', () => {        });            updateUc003State();            isUc003Hovered = true;        uc003Container.addEventListener('mouseenter', () => {    if (controlsUc003 && uc003Container) {    // Bind Hover Events for UC003 Card    }        observer.observe(crmContainer);        }, { threshold: 0.3 });            });                }                    }                    // Just trigger animation, state is handled by tab logic                if (entry.isIntersecting && activeIndex === 0) {            entries.forEach(entry => {        const observer = new IntersectionObserver((entries) => {        // Initial Intersection Observer to trigger animation on scroll                });            updateCrmState();            isHovered = false;        crmContainer.addEventListener('mouseleave', () => {        });            updateCrmState();            isHovered = true;        crmContainer.addEventListener('mouseenter', () => {    if (controlsCrm && crmContainer) {    // Bind Hover Events for CRM Card    }        }            });                }                    console.log("SMIL not supported or error", e);                } catch(e) {                    anim.endElement();                try {            anims.forEach(anim => {            const anims = uc003Container.querySelectorAll("animate, animateTransform, animateMotion");            uc003Container.classList.remove('manual-active');        } else {            });                }                    console.log("SMIL not supported or error", e);                } catch(e) {                    anim.beginElement();                try {            anims.forEach(anim => {            const anims = uc003Container.querySelectorAll("animate, animateTransform, animateMotion");            uc003Container.classList.add("manual-active");        if (shouldBeActive) {                const shouldBeActive = isUc003TabActive;                }            return;        if (!controlsUc003 || !uc003Container) {    function updateUc003State() {    // Unified function to handle UC003 card state    }        }            });                }                    console.log("SMIL not supported or error", e);                } catch(e) {                    anim.endElement();                try {            anims.forEach(anim => {            const anims = crmContainer.querySelectorAll("animate, animateTransform, animateMotion");            crmContainer.classList.remove('manual-active');        } else {            });                }                    console.log("SMIL not supported or error", e);                } catch(e) {                    anim.beginElement();                try {            anims.forEach(anim => {            const anims = crmContainer.querySelectorAll("animate, animateTransform, animateMotion");            crmContainer.classList.add("manual-active");        if (shouldBeActive) {                const shouldBeActive = isTabActive;                }            return;        if (!controlsCrm || !crmContainer) {    function updateCrmState() {    // Unified function to handle CRM card state    let isUc003Hovered = false;    let isUc003TabActive = false;        let isHovered = false;    let isTabActive = false;        const controlsUc003 = uc003Container && flipper.contains(uc003Container);    const uc003Container = document.getElementById('uc003-card-container');    // UC003 Card State Logic        const controlsCrm = crmContainer && flipper.contains(crmContainer);    const crmCard3d = document.getElementById('crm-3d-card');    const crmContainer = document.getElementById('crm-card-container');    const animTrigger = document.getElementById('crm-anim-trigger');    // CRM Card State Logic        let isAnimating = false;    let activeIndex = 0;    // State    if (!triggers.length || !cards.length) return;        const cards = flipper.querySelectorAll('[data-tab-card]');    const triggers = flipper.querySelectorAll('[data-tab-trigger]');  flippers.forEach(flipper => {  const flippers = document.querySelectorAll('[data-tab-flipper]');  });    });      el.appendChild(span);      span.style.transitionDelay = `${i * 30}ms`;      span.classList.add('char');      span.textContent = char;      const span = document.createElement('span');    [...text].forEach((char, i) => {    el.innerHTML = '';    const text = el.textContent;  flipTexts.forEach(el => {  const flipTexts = document.querySelectorAll('.hover-flip-text');  // Initialize Text Flip Effectdocument.addEventListener('DOMContentLoaded', () => { */ * Supports 3D transitions via CSS classes managed by this script. * Handles the switching of active states between navigation tabs and corresponding content cards. * Tab Controlled Card Flipper * Tab Controlled Card Flipper
 * Handles the switching of active states between navigation tabs and corresponding content cards.
 * Supports 3D transitions via CSS classes managed by this script.
 */

document.addEventListener('DOMContentLoaded', () => {
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
    
    // CRM Card State Logic
    const animTrigger = document.getElementById('crm-anim-trigger');
    const crmContainer = document.getElementById('crm-card-container');
    const crmCard3d = document.getElementById('crm-3d-card');
    const controlsCrm = crmContainer && flipper.contains(crmContainer);
    
    let isTabActive = false;
    let isHovered = false;

    // Unified function to handle CRM card state
    function updateCrmState() {
        if (!controlsCrm || !crmContainer) {
            console.log('CRM State Update Skipped: Missing controls or container');
            return;
        }
        
        const shouldBeActive = isTabActive;
        console.log(`CRM State Update: Active=${shouldBeActive} (Tab=${isTabActive}, Hover=${isHovered})`);
        
        if (shouldBeActive) {
            crmContainer.classList.add("manual-active");
            const anims = crmContainer.querySelectorAll("animate, animateTransform");
            anims.forEach(anim => {
                try {
                    anim.beginElement();
                } catch(e) {
                    console.log("SMIL not supported or error", e);
                }
            });
        } else {
            crmContainer.classList.remove('manual-active');
            const anims = crmContainer.querySelectorAll("animate, animateTransform");
            anims.forEach(anim => {
                try {
                    anim.endElement();
                } catch(e) {
                    console.log("SMIL not supported or error", e);
                }
            });
        }
    }

    // Bind Hover Events for CRM Card
    if (controlsCrm && crmContainer) {
        crmContainer.addEventListener('mouseenter', () => {
            console.log('CRM Hover Enter');
            isHovered = true;
            updateCrmState();
        });
        crmContainer.addEventListener('mouseleave', () => {
            console.log('CRM Hover Leave');
            isHovered = false;
            updateCrmState();
        });
        
        // Initial Intersection Observer to trigger animation on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && activeIndex === 0) {
                    // Just trigger animation, state is handled by tab logic
                    }
                }
            });
        }, { threshold: 0.3 });
        observer.observe(crmContainer);
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

          // Update CRM State based on Tab 0
          if (index === 0 && controlsCrm) {
             isTabActive = true;
             updateCrmState();
          } else if (controlsCrm) {
             isTabActive = false;
             updateCrmState();
          }
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

      // Reset animation lock after transition (approx 500ms)
      setTimeout(() => {
        isAnimating = false;
      }, 500);
    }
  });
});
