// V-Amp 2.0 Card Expander Logic
// Zen Mode Expansion - Column Constrained + Persistent Button

export function initCardExpander() {
    const track = document.getElementById('tech-demo-card-track');
    const cards = document.querySelectorAll('.socket-card-container');
    
    if (!track || !cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
             // Ignore button clicks IF they are actual functional buttons (like "View Project")
             // BUT, the expand button (corner bracket) is often the trigger itself or part of the card.
             // If the user wants the button to be the closer, we usually attach logic there.
             // For now, keeping generic card click toggling.
             if(e.target.closest('a, button:not(.group\\/button-trigger)')) return;
             
             if(card.classList.contains('is-expanded')) {
                 collapseCard(card);
             } else {
                 expandCard(card);
             }
        });
    });
}

function expandCard(card) {
    if (window.innerWidth < 1024) return;
    
    const container = document.getElementById('tech-demo-right-column');
    
    // 1. Measure BEFORE moving
    const startRect = card.getBoundingClientRect();
    
    // 2. Create Placeholder
    const placeholder = document.createElement('div');
    placeholder.style.width = startRect.width + 'px';
    placeholder.style.height = startRect.height + 'px';
    placeholder.className = 'socket-card-placeholder flex-shrink-0 snap-start';
    card.parentNode.insertBefore(placeholder, card);
    card._placeholder = placeholder;

    // 3. Move to Body (Escape Trap)
    document.body.appendChild(card);

    // 4. Set Initial Position (Fixed at Start)
    // Use !important to guarantee overrides
    card.style.setProperty('position', 'fixed', 'important');
    card.style.setProperty('top', startRect.top + 'px', 'important');
    card.style.setProperty('left', startRect.left + 'px', 'important');
    card.style.setProperty('width', startRect.width + 'px', 'important');
    card.style.setProperty('height', startRect.height + 'px', 'important');
    card.style.zIndex = '9999';
    card.style.margin = '0';
    
    // Force Layout
    void card.offsetWidth;

    // 5. Calculate Target (Container CLIENT Box)
    const containerRect = container.getBoundingClientRect();
    
    // Precision Alignment to the Visual Content Box of the Right Column
    const targetLeft = containerRect.left + (container.clientLeft || 0);
    const targetTop = containerRect.top + (container.clientTop || 0);
    const targetWidth = container.clientWidth; // Excludes scrollbar
    const targetHeight = container.clientHeight; // Excludes scrollbar

    // 6. Animate
    card.classList.add('is-expanded');
    card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    
    requestAnimationFrame(() => {
        // Enforce Target Coordinates
        card.style.setProperty('top', targetTop + 'px', 'important');
        card.style.setProperty('left', targetLeft + 'px', 'important');
        card.style.setProperty('width', targetWidth + 'px', 'important');
        card.style.setProperty('height', targetHeight + 'px', 'important');
        
        // Remove forced radius override, let CSS handle it
        card.style.removeProperty('border-radius'); 
    });

    // 7. Ensure Button is VISIBLE (User Request)
    // We explicitly ensure it is not hidden
    const btn = card.querySelector('.group\\/button-trigger');
    if(btn) {
        btn.style.opacity = '1';
        btn.style.display = 'flex'; // Or whatever flex layout it had
        btn.style.pointerEvents = 'auto';
    }
}

function collapseCard(card) {
    const placeholder = card._placeholder;
    if(!placeholder) {
        card.classList.remove('is-expanded');
        return;
    }
    
    const endRect = placeholder.getBoundingClientRect();
    
    // Animate Back
    card.style.setProperty('top', endRect.top + 'px', 'important');
    card.style.setProperty('left', endRect.left + 'px', 'important');
    card.style.setProperty('width', endRect.width + 'px', 'important');
    card.style.setProperty('height', endRect.height + 'px', 'important');
    card.classList.remove('is-expanded');

    const cleanup = () => {
        if(card.classList.contains('is-expanded')) return;

        // Reset Styles
        card.style.cssText = ''; 
        
        // Return to DOM
        if(placeholder.parentNode) {
            placeholder.parentNode.insertBefore(card, placeholder);
            placeholder.remove();
        }
        card._placeholder = null;
        
        card.removeEventListener('transitionend', cleanup);
    };
    
    card.addEventListener('transitionend', cleanup, { once: true });
}
