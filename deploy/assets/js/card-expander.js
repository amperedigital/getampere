// V-Amp 2.0 Card Expander Logic
// Zen Mode Expansion - STRICT Column Constraint (v2.700)

export function initCardExpander() {
    const track = document.getElementById('tech-demo-card-track');
    const cards = document.querySelectorAll('.socket-card-container');
    
    if (!track || !cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
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
    // Use !important to override any CSS interference
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
    const targetRect = container.getBoundingClientRect();
    
    // Precision Alignment:
    // Left = Container Left + Container Border Left
    // Width = Container Client Width (excludes scrollbar/border)
    // Top = Container Top + Container Border Top
    // Height = Container Client Height
    
    const targetLeft = targetRect.left + (container.clientLeft || 0);
    const targetTop = targetRect.top + (container.clientTop || 0);
    const targetWidth = container.clientWidth;
    const targetHeight = container.clientHeight;

    // 6. Animate
    card.classList.add('is-expanded');
    card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    
    requestAnimationFrame(() => {
        card.style.setProperty('top', targetTop + 'px', 'important');
        card.style.setProperty('left', targetLeft + 'px', 'important');
        card.style.setProperty('width', targetWidth + 'px', 'important');
        card.style.setProperty('height', targetHeight + 'px', 'important');
        card.style.removeProperty('border-radius'); // Allow CSS to control
    });

    // 7. Icon Hiding
    requestAnimationFrame(() => {
        const btn = card.querySelector('.group\\/button-trigger');
        if(btn) {
            btn.style.setProperty('display', 'none', 'important');
        }
    });
}

function collapseCard(card) {
    const placeholder = card._placeholder;
    if(!placeholder) {
        card.classList.remove('is-expanded');
        return;
    }
    
    const endRect = placeholder.getBoundingClientRect();
    
    // Restore Button
    const btn = card.querySelector('.group\\/button-trigger');
    if(btn) {
        btn.style.setProperty('display', '', '');
        btn.style.opacity = '';
    }

    // Animate
    card.style.setProperty('top', endRect.top + 'px', 'important');
    card.style.setProperty('left', endRect.left + 'px', 'important');
    card.style.setProperty('width', endRect.width + 'px', 'important');
    card.style.setProperty('height', endRect.height + 'px', 'important');
    card.classList.remove('is-expanded');

    const cleanup = () => {
        if(card.classList.contains('is-expanded')) return;

        // Clear all inline styles to return to CSS control
        card.style.cssText = ''; 
        
        if(placeholder.parentNode) {
            placeholder.parentNode.insertBefore(card, placeholder);
            placeholder.remove();
        }
        card._placeholder = null;
        
        card.removeEventListener('transitionend', cleanup);
    };
    
    card.addEventListener('transitionend', cleanup, { once: true });
}
