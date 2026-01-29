// V-Amp 2.0 Card Expander Logic
// Zen Mode Expansion - Contained within Column (Corrected Offset Logic & Button Fix)

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

    // 3. Move to Body to ESCAPE transforms
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

    // 5. Calculate Target (Visual Bounds of Right Column)
    // We EXCLUDE the scrollbar width to prevent "under-scrollbar" rendering if possible
    const targetRect = container.getBoundingClientRect();
    
    // Check if vertical scrollbar is visible
    const hasScrollbar = container.scrollHeight > container.clientHeight;
    // Basic approximate scrollbar width safety (typically 6px in this design logic)
    // But getBoundingClientRect includes borders/scrollbars.
    // If we want to align EXACTLY to the content box:
    // We should compute clientWidth (which excludes scrollbar) 
    // and derive the width from that.
    
    const computedWidth = container.clientWidth; // Excludes scrollbar
    // The left offset must match the container's visual left + border-left (if any)
    const computedLeft = targetRect.left + container.clientLeft; 
    
    // 6. Animate
    card.classList.add('is-expanded');
    card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    
    requestAnimationFrame(() => {
        card.style.top = targetRect.top + 'px';
        card.style.left = computedLeft + 'px';
        card.style.width = computedWidth + 'px'; // Confined to content width
        card.style.height = targetRect.height + 'px';
        // card.style.borderRadius = '0'; // Removing this to keep corners rounded (Feedback imply)
        card.style.borderRadius = ''; // Let CSS dictate (usually 2rem)
    });

    // 7. Icon Hiding (Specific fix for .group\/button-trigger)
    // Use requestAnimationFrame to ensure we catch it after reparenting
    requestAnimationFrame(() => {
        const btn = card.querySelector('.group\\/button-trigger');
        if(btn) {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none'; // Ensure it's not clickable
            btn.style.display = 'none'; // Force hide to be sure
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
    
    // Restore Button Visibility Immediately on collapse start
    const btn = card.querySelector('.group\\/button-trigger');
    if(btn) {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
        btn.style.display = '';
    }

    // Animate
    card.style.top = endRect.top + 'px';
    card.style.left = endRect.left + 'px';
    card.style.width = endRect.width + 'px';
    card.style.height = endRect.height + 'px';
    card.classList.remove('is-expanded');

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
        
        if(placeholder.parentNode) {
            placeholder.parentNode.insertBefore(card, placeholder);
            placeholder.remove();
        }
        card._placeholder = null;
        
        card.removeEventListener('transitionend', cleanup);
    };
    
    card.addEventListener('transitionend', cleanup, { once: true });
}
