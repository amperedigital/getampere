// V-Amp 2.0 Card Expander Logic
// Zen Mode Expansion - Constrained to Column (Escape Trap Strategy)

export function initCardExpander() {
    const track = document.getElementById('tech-demo-card-track');
    const cards = document.querySelectorAll('.socket-card-container');
    
    if (!track || !cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
             // Ignore button clicks
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
    if (window.innerWidth < 1024) return;
    
    // Target Container: The Right Column
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

    // 3. Move to Body to ESCAPE the column's transform trap
    // This allows us to use position: fixed relative to the screen, but we will
    // strictly size/position it to match the column.
    document.body.appendChild(card);

    // 4. Set Initial Position (Fixed at Start)
    card.style.position = 'fixed';
    card.style.top = startRect.top + 'px';
    card.style.left = startRect.left + 'px';
    card.style.width = startRect.width + 'px';
    card.style.height = startRect.height + 'px';
    card.style.zIndex = '9999';
    card.style.margin = '0';
    
    // Force Layout
    void card.offsetWidth;

    // 5. Calculate Target (The Visual Bounds of the Right Column)
    // We want to fill the column, but exist on the Body layer.
    const targetRect = container.getBoundingClientRect();

    // 6. Animate to Fill Column
    card.classList.add('is-expanded');
    card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    
    requestAnimationFrame(() => {
        card.style.top = targetRect.top + 'px';
        card.style.left = targetRect.left + 'px';
        card.style.width = targetRect.width + 'px';
        card.style.height = targetRect.height + 'px';
        
        // Optional: Reset border radius to 0 to look like a full pane, 
        // or keep standard if preference differs. 
        // Zen mode usually implies full fill.
        card.style.borderRadius = '0';
    });

    const btn = card.querySelector('.group\\/button-trigger');
    if(btn) btn.style.opacity = '0';
}

function collapseCard(card) {
    const placeholder = card._placeholder;
    if(!placeholder) {
        card.classList.remove('is-expanded');
        return;
    }
    
    // 1. Measure where to go back to (Placeholder acts as beacon)
    const endRect = placeholder.getBoundingClientRect();
    
    // 2. Animate
    card.style.top = endRect.top + 'px';
    card.style.left = endRect.left + 'px';
    card.style.width = endRect.width + 'px';
    card.style.height = endRect.height + 'px';
    card.style.borderRadius = ''; 
    card.classList.remove('is-expanded');

    // 3. Cleanup
    const cleanup = () => {
        if(card.classList.contains('is-expanded')) return;

        card.style.position = '';
        card.style.top = '';
        card.style.left = '';
        card.style.width = '';
        card.style.height = '';
        card.style.zIndex = '';
        card.style.margin = '';
        card.style.transition = '';
        card.style.borderRadius = '';
        
        // Return to original DOM position
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
