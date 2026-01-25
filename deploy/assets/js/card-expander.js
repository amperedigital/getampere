// Ampere Card Expander (v1.0.0)
// Features: Lift-and-Fill Expansion, Zero Layout Shift, Close via Trigger
// Dependencies: global.js (for event delegation if needed), but works standalone.

export class CardExpander {
    constructor() {
        this.activeCard = null;
        this.spacer = document.createElement('div');
        this.spacer.className = 'card-spacer hidden pointer-events-none'; // Hidden by default
        this.init();
    }

    init() {
        // Delegate click events on the right column
        const column = document.getElementById('tech-demo-right-column');
        if (!column) return;

        column.addEventListener('click', (e) => {
            // Check for explicit expand trigger first
            const expandTrigger = e.target.closest('.expand-trigger');
            if (expandTrigger) {
                 const card = expandTrigger.closest('.socket-card-container');
                 if (card) this.toggleCard(card, expandTrigger, column);
                 return;
            }

            // Fallback: Check top-right button (Close action only? or both?)
            // If card is expanded, top-right button acts as close.
            const btn = e.target.closest('.group\\/button-trigger') || e.target.closest('.w-14.h-14.z-20');
            if (btn) {
                const card = btn.closest('.socket-card-container');
                // Only act if expanded (Close functionality), OR if we revert to allowing top-right expand too.
                // User said "Close button where icon button is... Expand button separate".
                // So top-right should primarily be for closing/status.
                if (card && card.classList.contains('is-expanded')) {
                    this.collapse(card, btn, column);
                }
            }
        });
    }

    toggleCard(card, btn, container) {
        const isExpanded = card.classList.contains('is-expanded');

        if (isExpanded) {
            this.collapse(card, btn, container);
        } else {
            if (this.activeCard && this.activeCard !== card) {
                this.collapse(this.activeCard, null, container);
            }
            this.expand(card, btn, container);
        }
    }

    expand(card, btn, container) {
        // v2.402: Logic to handle separate Expand Button (Bottom Right) vs Close Button (Top Right)
        // If 'btn' is the expand trigger, we don't need to save its icon, because we don't change IT.
        // We change the Top-Right button to become a Close button.
        
        const topRightBtn = card.querySelector('.group\\/button-trigger') || card.querySelector('.w-14.h-14.z-20');
        
        // Save original icon of the TOP RIGHT button
        if (topRightBtn && !topRightBtn.hasAttribute('data-original-icon')) {
            const iconContainer = topRightBtn.querySelector('.z-30 svg');
            if (iconContainer) {
                topRightBtn.setAttribute('data-original-icon', iconContainer.innerHTML);
            }
        }

        // 1. Measure layout before moving
        this.spacer.className = card.className.replace('socket-card-container', 'card-spacer pointer-events-none opacity-0').replace('is-expanded', ''); 
        this.spacer.id = '';
        this.spacer.innerHTML = '';
        
        if (card.parentNode) {
            card.parentNode.insertBefore(this.spacer, card);
        }

        // 3. Promote Card
        card.classList.add('is-expanded');
        document.body.classList.add('card-expanded-mode'); 
        container.classList.add('has-active-card');

        // Store reference
        this.activeCard = card;

        // 4. Update TOP RIGHT Icon to "Close"
        this.updateIcon(topRightBtn, 'close');
        
        // 5. Hide the Expand Trigger while expanded (opacity 0)
        if(btn) btn.style.opacity = '0';
        if(btn) btn.style.pointerEvents = 'none';
    }

    collapse(card, btn, container) {
        if (!card) return;

        // 1. Demote Card
        card.classList.remove('is-expanded');
        document.body.classList.remove('card-expanded-mode');
        container.classList.remove('has-active-card');

        // 2. Remove Spacer
        if (this.spacer.parentNode) {
            this.spacer.parentNode.removeChild(this.spacer);
        }

        this.activeCard = null;

        // 3. Update TOP RIGHT Icon to "Original" (Socket Logo)
        const topRightBtn = card.querySelector('.group\\/button-trigger') || card.querySelector('.w-14.h-14.z-20');
        this.updateIcon(topRightBtn, 'expand');
        
        // 3b. Restore Expand Triggers
        const triggers = card.querySelectorAll('.expand-trigger');
        triggers.forEach(t => {
            t.style.opacity = ''; // Restore CSS control
            t.style.pointerEvents = '';
        });
    }

    updateIcon(btn, state) {
        if (!btn) return;
        const iconContainer = btn.querySelector('.z-30 svg'); // The icon SVG
        if (!iconContainer) return;

        if (state === 'close') {
            // Change to "X" or "Minimize"
            // Simple X path
             iconContainer.innerHTML = '<path fill="currentColor" d="M24 9.4L22.6 8L16 14.6L9.4 8L8 9.4l6.6 6.6L8 22.6L9.4 24l6.6-6.6l6.6 6.6l1.4-1.4l-6.6-6.6L24 9.4z"/>';
        } else {
            // Restore "Expand/Arrows" path
            // Original: M26 22... (Socket Icon)
            // Wait, the original icon is the Ampere Socket logo thing?
            // "M26 22a3.86 3.86..."
            // We should ideally restore the original HTML.
            // Simplest way: The HTML in tech-demo.html has the SVG inline.
            // We can just swap the innerHTML based on a stored "original" state or hardcode.
            // Given I cannot read the specific icon for each card easily without caching, 
            // I will assume for now we want a generic "Expand" icon vs "Close".
            // OR, the original icon WAS the content icon (e.g. Chat Bubble, Document).
            // User request: "Button stays the same, curves stay the same".
            // AND "Just the area of the card is expanded."
            // This might mean the user wants the button to be the TRIGGER, but maybe the icon shouldn't change?
            // "Button stays the same" -> Visual style stays.
            // But function changes. A toggle needs state indication.
            // I'll swap it to an X to be safe, but keep the style.
            
            // Hardcode the original "Socket" icon for now as a fallback or read data-attribute?
            // Better: Store the original path in a data attribute on first expand.
            if (!btn.hasAttribute('data-original-icon')) {
                 // Too late to save if we already overwrote it.
                 // We should save it in 'expand'.
            } else {
                iconContainer.innerHTML = btn.getAttribute('data-original-icon');
            }
        }
    }
}
