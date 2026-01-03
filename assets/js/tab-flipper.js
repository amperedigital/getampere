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
