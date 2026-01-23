/**
 * Tab Controlled Card Flipper v1.490
 * - Mobile: Uses window.globalObserver via HTML attributes.
 * - Desktop: Restored Active Indicator (data-selected).
 * - General: Fixes UC001 Auto-start media trigger.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Flipper v1.490 Loaded');

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
        // Use global trigger if available (handles SMIL/Video)
        if (window.triggerMedia) {
            window.triggerMedia(container, play);
        } else {
            // Fallback for simple video
            const v = container.querySelector('video');
            if (v && play) v.play().catch(()=>{});
            if (v && !play) v.pause();
        }
    };

    // --- DESKTOP: Tab/Stack Logic ---
    const setActive = (index, skipAnimation = false) => {
        // Desktop only logic execution
        if (window.innerWidth < 768) return;
  
        // Only return if same index AND not a forced update (skipAnimation usually implies initial setup/scroll)
        // We removed the eager return here to force media triggers on initial load
        if (index === activeIndex && !skipAnimation) return;
        
        activeIndex = index;
        if (!skipAnimation) isAnimating = true;
        
        // 1. Update Triggers (Fixing Indicator)
        triggers.forEach((t, i) => {
          const isActive = (i === index);
          // UI requires data-selected="true" for tailwind group-data pattern
          if (isActive) {
            t.dataset.selected = "true";
            t.setAttribute('aria-selected', 'true');
            t.classList.add('active');
          } else {
            delete t.dataset.selected;
            t.setAttribute('aria-selected', 'false');
            t.classList.remove('active');
          }
        });
  
        // 2. Scroll Tab Bar (UX)
        const activeTrigger = triggers[index];
        const triggerContainer = activeTrigger.parentElement;
        if (triggerContainer && triggerContainer.classList.contains('overflow-x-auto')) {
             const containerRect = triggerContainer.getBoundingClientRect();
             const triggerRect = activeTrigger.getBoundingClientRect();
             const scrollLeft = triggerContainer.scrollLeft + (triggerRect.left - containerRect.left) - (containerRect.width/2) + (triggerRect.width/2);
             triggerContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
  
        // 3. Update Cards (3D Stack + Media)
        cards.forEach((c, i) => {
          // Reset Classes
          c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
          const container = c.querySelector('[data-smil-container]');
          
          if (i === index) {
            // Check Active
            c.classList.add('active', 'stack-0');
            
            // Play Media (Fixes UC001 Auto-start)
            if (container) safeTriggerMedia(container, true);
            const video = c.querySelector('video');
            if (video && (c.dataset.autoPlay !== 'false')) video.play().catch(()=>{});
            
          } else if (i < index) {
            // Previous (Stack)
            c.classList.add('inactive-prev');
            const depth = index - i;
            if (depth <= 3) c.classList.add(`stack-${depth}`);
            
            // Pause Media
            if (container) safeTriggerMedia(container, false);
            const video = c.querySelector('video');
            if (video) video.pause();
            
          } else {
            // Next (Hidden)
            c.classList.add('inactive-next');
            
            // Pause Media
            if (container) safeTriggerMedia(container, false);
            const video = c.querySelector('video');
            if (video) video.pause();
          }
        });
  
        if (!skipAnimation) setTimeout(() => { isAnimating = false; }, 500);
    };

    // Scroll Track Logic (Desktop scrollytelling)
    if (scrollTrack) {
        const handleScroll = () => {
            if (isAutoScrolling || window.innerWidth < 768) return;
            const rect = scrollTrack.getBoundingClientRect();
            // Calculate scroll progress within the track
            const scrollableRange = rect.height - window.innerHeight;
            let progress = Math.max(0, Math.min(1, -rect.top / scrollableRange));
            
            // Map progress to card index
            const index = Math.min(triggers.length - 1, Math.floor(progress * triggers.length));
            if (index !== activeIndex) setActive(index, true);
        };
        // Attach to Lenis or Native Scroll
        if (window.lenis) window.lenis.on('scroll', handleScroll);
        else window.addEventListener('scroll', handleScroll);
    }

    // Click Logic (Desktop tab switching)
    triggers.forEach((trigger, index) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.innerWidth < 768) return; 
          setActive(index);
        });
    });

    // --- 3. Responsive Manager (Mobile Refactor) ---
    const checkResponsive = () => {
        const isMobile = window.innerWidth < 768;
        
        // Hide/Show Tab Bar
        const tabContainer = flipper.querySelector('.max-md\\:hidden');
        if (tabContainer) tabContainer.style.display = isMobile ? 'none' : '';

        if (isMobile) {
            // Mobile: Complete Cleanup of Desktop Stack Classes
            // This allows the HTML (Tailwind) layout to take over completely
            cards.forEach(c => {
                c.classList.remove('active', 'inactive-prev', 'inactive-next', 'stack-0', 'stack-1', 'stack-2', 'stack-3');
            });
            // Note: We rely on global.js to handle IntersectionObserver (data-observer) for mobile fade-ins
        } else {
            // Desktop: Force restore state
            setActive(activeIndex, true);
        }
    };

    window.addEventListener('resize', checkResponsive);
    // Initial Run
    checkResponsive();
    
    // Force Initial Desktop State (Fixes initial missing media play)
    if (window.innerWidth >= 768) setActive(0, true);
  };

  document.querySelectorAll('[data-tab-flipper]').forEach(initFlipper);
});
