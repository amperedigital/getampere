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
            // Find if click hit a trigger button
            // Trigger is the top-right button div: .absolute.top-0.right-0.w-14.h-14
            // We'll look for a specific data attribute or the class structure
            
            // Check if user clicked the "Close" button on an active card
            // Or the "Expand" button on an inactive card.
            
            // Heuristic: The icon container is the button
            const btn = e.target.closest('.group\\/button-trigger') || e.target.closest('.w-14.h-14.z-20');
            
            if (btn) {
                const card = btn.closest('.socket-card-container');
                if (card) {
                    this.toggleCard(card, btn, column);
                }
            }
        });
    }

    toggleCard(card, btn, container) {
        const isExpanded = card.classList.contains('is-expanded');

        if (isExpanded) {
            this.collapse(card, btn, container);
        } else {
            // Check if another card is already expanded
            if (this.activeCard && this.activeCard !== card) {
                // Collapse the other one first? Or just swap?
                // For safety, collapse it.
                // Re-find the button for the active card is tricky if we don't store it.
                // But we can just call collapse on activeCard.
                // We'll need a reference to its button to flip icon, but visual state is enough.
                this.collapse(this.activeCard, null, container);
            }
            this.expand(card, btn, container);
        }
    }

    expand(card, btn, container) {
        // Save original icon if needed
        if (btn && !btn.hasAttribute('data-original-icon')) {
            const iconContainer = btn.querySelector('.z-30 svg');
            if (iconContainer) {
                btn.setAttribute('data-original-icon', iconContainer.innerHTML);
            }
        }

        // 1. Measure layout before moving
        // We need to insert the spacer exactly where the card is
        // The spacer needs to match the card's CURRENT grid dimensions
        // Grid auto-layout makes this tricky if we don't know the explicit size.
        // But since we are expanding TO absolute, the spacer just needs to hold the slot.
        // A simple div in the DOM flow at the same position works if the card is static.
        
        // 2. Insert Spacer
        // Copy relevant grid classes if any? Or just being in the DOM is enough for grid flow?
        // The card has `relative group h-full socket-card-container`.
        // The spacer should mimic `h-full`.
        this.spacer.className = card.className.replace('socket-card-container', 'card-spacer pointer-events-none opacity-0').replace('is-expanded', ''); // Ensure no expand class
        // Remove ID if any
        this.spacer.id = '';
        // Clear content
        this.spacer.innerHTML = '';
        
        // Insert spacer before the card
        if (card.parentNode) {
            card.parentNode.insertBefore(this.spacer, card);
        }

        // 3. Promote Card
        card.classList.add('is-expanded');
        document.body.classList.add('card-expanded-mode'); // Optional global state
        container.classList.add('has-active-card');

        // Store reference
        this.activeCard = card;

        // 4. Update Icon to "Compress/Close"
        this.updateIcon(btn, 'close');
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

        // 3. Update Icon to "Expand"
        // If btn is null (auto-collapse), find it
        if (!btn) {
           btn = card.querySelector('.w-14.h-14.z-20');
        }
        this.updateIcon(btn, 'expand');
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
