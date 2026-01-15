/**
 * Tab Controlled Card Flipper v1.476
 * Global Integration Update
 * - Uses window.globalObserver via HTML attributes (data-observer/animate-on-scroll).
 * - Removed forced CSS injection.
 * - Relies on Tailwind for mobile layout.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.476 (Global Observer Integration) Loaded');

  // --- 1. Text Interaction Engine ---
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

  // --- 2. Main Flipper Logic ---
  const initFlipper = (flipper) => {
    const triggers = flipper.querySelectorAll('[data-tab-trigger]');
    const cards = flipper.querySelectorAll('[data-tab-card]');
    const scrollTrack = flipper.querySelector('[data-scroll-track]');
    
    if (!triggers.length || !cards.length) return;

    let activeIndex = 0;
    let isAnimating = false;
    let isAutoScrolling = false;

    // --- Helper: Safe Media Trigger ---
    const safeTriggerMedia = (container, play) => {
        if (window.triggerMedia) {
            window.triggerMedia(container, play);
        } else {
            // Fallback for video if global not ready
            const v = container.querySelector('video');
            if (v && play) v.play().catch(()=>{});
            if (v && !play) v.pause();
        }
    };

    // --- DESKTOP: Tab/Stack Logic ---
    const setActive = (index, skipAnimation = false) => {
        // Desktop only logic
        if (window.innerWidth < 768) return;
  
        if (index === activeIndex && !skipAnimation) return;
        activeIndex = index;
        if (!skipAnimation) isAnimating = true;
        
        // 1. Update Triggers
        triggers.forEach((t, i) => {
          const isActive = (i === index);
          t.setAttribute('aria-selected', isActive);
          t.classList.toggle('active', isActive); t.dataset.selected = isActive;
        });
  
        // 2. Scroll Tab (if needed)
        const activeTrigger = triggers[index];
        const triggerContainer = activeTrigger.parentElement;
        if (triggerContainer && triggerContainer.classList.contains('overflow-x-auto')) {
             const containerRect = triggerContainer.getBoundingClientRect();
             const triggerRect = activeTrigger.getBoundingClientRect();
             const scrollLeft = triggerContainer.scrollLeft + (triggerRect.left - containerRect.left) - (containerRect.width/2) + (triggerRect.width/2);
             triggerContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
  
        // 3. Update Cards
        cards.forEach((c, i) => {
          c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
          const container = c.querySelector('[data-smil-container]');
          
          if (i === index) {
            c.classList.add('active', 'stack-0');
            // Desktop: Play media for active card
            if (container) safeTriggerMedia(container, true);
            const video = c.querySelector('video');
            if (video && (c.dataset.autoPlay !== 'false')) video.play().catch(()=>{});
            
          } else if (i < index) {
            c.classList.add('inactive-prev');
            const depth = index - i;
            if (depth <= 3) c.classList.add(`stack-${depth}`);
            // Desktop: Pause inactive media
            if (container) safeTriggerMedia(container, false);
            const video = c.querySelector('video');
            if (video) video.pause();
            
          } else {
            c.classList.add('inactive-next');
            // Desktop: Pause inactive media
            if (container) safeTriggerMedia(container, false);
            const video = c.querySelector('video');
            if (video) video.pause();
          }
        });
  
        if (!skipAnimation) setTimeout(() => { isAnimating = false; }, 500);
    };

    // Scroll Track Logic (Desktop)
    if (scrollTrack) {
        const handleScroll = () => {
            if (isAutoScrolling || window.innerWidth < 768) return;
            const rect = scrollTrack.getBoundingClientRect();
            const scrollableRange = rect.height - window.innerHeight;
            let progress = Math.max(0, Math.min(1, -rect.top / scrollableRange));
            const index = Math.min(triggers.length - 1, Math.floor(progress * triggers.length));
            if (index !== activeIndex) setActive(index, true);
        };
        if (window.lenis) window.lenis.on('scroll', handleScroll);
        else window.addEventListener('scroll', handleScroll);
    }

    // Click Logic (Desktop)
    triggers.forEach((trigger, index) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.innerWidth < 768) return; 
          setActive(index);
        });
    });

    // --- RESPONSIVE CHECK ---
    const checkResponsive = () => {
        const isMobile = window.innerWidth < 768;
        const tabContainer = flipper.querySelector('.max-md\\:hidden');
        if (tabContainer) tabContainer.style.display = isMobile ? 'none' : '';

        if (isMobile) {
            // Mobile: Cleanup Desktop classes to let Tailwind and Index.html handle layout
            cards.forEach(c => {
                c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
            });
            // We NO LONGER manually observe here. 
            // The HTML should have [data-observer] or .animate-on-scroll to be picked up by global.js
        } else {
            // Desktop: Restore State
            setActive(activeIndex, true);
        }
    };

    window.addEventListener('resize', checkResponsive);
    checkResponsive();
    
    // Initial Desktop Set
    if (window.innerWidth >= 768) setActive(0, true);
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
