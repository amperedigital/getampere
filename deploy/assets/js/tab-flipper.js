/**
 * Tab Controlled Card Flipper
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
            crmContainer.classList.add('manual-active');
            // Trigger animation if it's not already running (optional check, but beginElement is safe)
            if (animTrigger) {
                try { 
                    animTrigger.beginElement(); 
                } catch(e){ console.error('SMIL trigger failed', e); }
            }
        } else {
            crmContainer.classList.remove('manual-active');
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
                    if (animTrigger) {
                        try { animTrigger.beginElement(); } catch(e){}
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
