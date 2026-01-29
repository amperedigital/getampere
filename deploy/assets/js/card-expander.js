// V-Amp 2.0 Card Expander Logic
// Zen Mode Expansion - DOM Reparenting Strategy to escape CSS Transforms

export function initCardExpander() {
    const track = document.getElementById('tech-demo-card-track');
    const cards = document.querySelectorAll('.socket-card-container');
    
    if (!track || !cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
             // Ignore button clicks or link clicks
             if(e.target.closest('button, a')) return;
             
             if(card.classList.contains('is-expanded')) {
                 collapseCard(card);
             } else {
                 expandCard(card);
             }
        });
    });
}

function expandCard(card) {
    if (window.innerWidth < 1024) return; // Desktop/Zen Mode only
    
    // 1. Measure BEFORE moving
    const startRect = card.getBoundingClientRect();
    
    // 2. Create Placeholder to hold the space
    const placeholder = document.createElement('div');
    placeholder.style.width = startRect.width + 'px';
    placeholder.style.height = startRect.height + 'px';
    placeholder.className = 'socket-card-placeholder flex-shrink-0 snap-start';
    
    // Insert placeholder before the card
    card.parentNode.insertBefore(placeholder, card);
    
    // Save reference for collapse
    card._placeholder = placeholder;

    // 3. Move Card to Body to escape 'transform-style: preserve-3d' of the container
    // This ensures position: fixed is actually relative to the Viewport
    document.body.appendChild(card);

    // 4. Set Initial Position (Fixed at original location)
    card.style.position = 'fixed';
    card.style.top = startRect.top + 'px';
    card.style.left = startRect.left + 'px';
    card.style.width = startRect.width + 'px';
    card.style.height = startRect.height + 'px';
    card.style.zIndex = '9999';
    card.style.margin = '0';
    
    // Force Layout/Repaint
    void card.offsetWidth;

    // 5. Animate to Full Screen
    card.classList.add('is-expanded');
    // Using a specific transition for that "snap" feel
    card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    
    requestAnimationFrame(() => {
        card.style.top = '0';
        card.style.left = '0';
        card.style.width = '100vw'; // Use vw/vh to be sure
        card.style.height = '100vh';
        card.style.borderRadius = '0'; 
    });

    // Hide the icon button if needed
    const btn = card.querySelector('.group\\/button-trigger');
    if(btn) btn.style.opacity = '0';
}

function collapseCard(card) {
    const placeholder = card._placeholder;
    if(!placeholder) {
        // Fallback if something went wrong
        card.classList.remove('is-expanded');
        return;
    }
    
    // 1. Measure where it needs to go back to
    const endRect = placeholder.getBoundingClientRect();
    
    // 2. Animate back
    card.style.top = endRect.top + 'px';
    card.style.left = endRect.left + 'px';
    card.style.width = endRect.width + 'px';
    card.style.height = endRect.height + 'px';
    card.style.borderRadius = ''; // Reset to default (CSS defined)
    card.classList.remove('is-expanded');

    // 3. Cleanup after animation
    const cleanup = () => {
        // If user cancelled/re-expanded mid-transition (edge case)
        if(card.classList.contains('is-expanded')) return;

        // Reset inline styles
        card.style.position = '';
        card.style.top = '';
        card.style.left = '';
        card.style.width = '';
        card.style.height = '';
        card.style.zIndex = '';
        card.style.margin = '';
        card.style.transition = '';
        card.style.borderRadius = '';

        // Move back to DOM
        if(placeholder.parentNode) {
            placeholder.parentNode.insertBefore(card, placeholder);
            placeholder.remove();
        }
        
        card._placeholder = null;
        
        const btn = card.querySelector('.group\\/button-trigger');
        if(btn) btn.style.opacity = '';
        
        card.removeEventListener('transitionend', cleanup);
    };
    
    card.addEventListener('transitionend', cleanup, { once: true });
}
