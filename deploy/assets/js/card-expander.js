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
        // FLIP Animation: First, Last, Invert, Play
        const startRect = card.getBoundingClientRect();
        
        // Context: The card will become 'absolute' relative to 'container' (tech-demo-right-column).
        // Since container is relative, we strictly map offsets.
        const parentRect = container.getBoundingClientRect();
        
        // Calculate the initial "Grid Position" in pixels relative to the parent
        const startTop = startRect.top - parentRect.top;
        const startLeft = startRect.left - parentRect.left;
        const startWidth = startRect.width;
        const startHeight = startRect.height;
        
        // Calculate explicit 'bottom' and 'right' to allow transition to 'inset' based expansion
        const startBottom = parentRect.height - (startTop + startHeight);
        const startRight = parentRect.width - (startLeft + startWidth);

        // 2. Insert Spacer
        this.spacer.className = card.className.replace('socket-card-container', 'card-spacer pointer-events-none opacity-0').replace('is-expanded', ''); 
        this.spacer.id = '';
        this.spacer.innerHTML = '';
        
        if (card.parentNode) {
            card.parentNode.insertBefore(this.spacer, card);
        }

        // 3. Promote Card
        // Apply Inline Styles to "Lock" the card to its starting grid position visually.
        // We set explicitly everything to prevent "Jumping" to auto width.
        card.style.position = 'absolute';
        card.style.top = `${startTop}px`;
        card.style.left = `${startLeft}px`;
        card.style.right = `${startRight}px`;
        card.style.bottom = `${startBottom}px`;
        card.style.width = `${startWidth}px`; // Lock width
        card.style.height = `${startHeight}px`; // Lock height
        card.style.zIndex = '50';
        card.style.margin = '0'; 
        
        // Force Layout Recalculation (Reflow)
        void card.offsetWidth; 

        // 3b. Trigger Transformation
        requestAnimationFrame(() => {
            card.classList.add('is-expanded');
            document.body.classList.add('card-expanded-mode'); 
            container.classList.add('has-active-card');
            
            // Release the visual lock to allow CSS transition
            // We clear ALL the position properties so the CSS class rules take over.
            card.style.top = '';
            card.style.left = '';
            card.style.right = '';
            card.style.bottom = '';
            card.style.width = ''; 
            card.style.height = ''; 
        });

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

        // 1. REVERSE FLIP: Measure current state (Expanded)
        const currentRect = card.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();
        
        // Measure where we want to go (The Spacer)
        const targetRect = this.spacer.getBoundingClientRect();

        const targetTop = targetRect.top - parentRect.top;
        const targetLeft = targetRect.left - parentRect.left;
        const targetWidth = targetRect.width;
        const targetHeight = targetRect.height;
        const targetRight = parentRect.width - (targetLeft + targetWidth);
        const targetBottom = parentRect.height - (targetTop + targetHeight);

        // 2. Lock Current State (Absolute)
        // We apply inline styles matching the current Expanded state so removing the class doesn't jump.
        // Actually, we can just KEEP the class for a moment, apply the 'Target' styles inline, 
        // and rely on inline styles winning over the class?
        // No, the class uses !important often or has high specificity. 
        // Best to Remove Class, Apply Current Inline (Pre-flight), then Transition to Target Inline.
        
        // Alternative: Just animate the inline styles while keeping 'is-expanded' (if it doesn't force insets)?
        // .is-expanded forces `inset-x-6` etc. Inline styles usually override classes unless !important used.
        // Let's check if my CSS uses !important. src/input.css had !important on timing function...
        
        // Strategy:
        // A. Remove 'is-expanded' class (which puts it normally back in flow).
        // B. BUT immediately override with Inline Styles of "Current Position" (Full Screen).
        // C. Force Reflow.
        // D. Set Inline Styles to "Target Position" (Spacer).
        
        const currentTop = currentRect.top - parentRect.top;
        const currentLeft = currentRect.left - parentRect.left;
        const currentRight = parentRect.width - (currentLeft + currentRect.width);
        const currentBottom = parentRect.height - (currentTop + currentRect.height);

        // A & B: Lock to current expanded visual, but stripped of class constraints
        card.classList.remove('is-expanded');
        document.body.classList.remove('card-expanded-mode');
        container.classList.remove('has-active-card');
        
        card.style.position = 'absolute';
        card.style.top = `${currentTop}px`;
        card.style.left = `${currentLeft}px`;
        card.style.right = `${currentRight}px`;
        card.style.bottom = `${currentBottom}px`;
        card.style.zIndex = '50';
        
        // C. Reflow
        void card.offsetWidth;

        // D. Animate to Grid Slot
        requestAnimationFrame(() => {
            card.style.top = `${targetTop}px`;
            card.style.left = `${targetLeft}px`;
            card.style.right = `${targetRight}px`;
            card.style.bottom = `${targetBottom}px`;
            // We don't strictly *need* width/height if we use 4-point constraint, 
            // but setting them helps consistency.
        });

        // 3. Cleanup after transition
        // Duration: 0.6s (600ms)
        setTimeout(() => {
            // Remove Spacer
            if (this.spacer.parentNode) {
                this.spacer.parentNode.removeChild(this.spacer);
            }
            
            // Reset Card Styles to return to normal grid flow
            card.style.position = '';
            card.style.top = '';
            card.style.left = '';
            card.style.right = '';
            card.style.bottom = '';
            card.style.width = '';
            card.style.height = '';
            card.style.zIndex = '';
            card.style.margin = '';
            
            this.activeCard = null;
        }, 600); // Sync with CSS 0.6s

        // 4. Update TOP RIGHT Icon to "Original" (Socket Logo)
        const topRightBtn = card.querySelector('.group\\/button-trigger') || card.querySelector('.w-14.h-14.z-20');
        this.updateIcon(topRightBtn, 'expand');
        
        // 5. Restore Expand Triggers
        const triggers = card.querySelectorAll('.expand-trigger');
        triggers.forEach(t => {
            t.style.opacity = ''; // Restore CSS control
            t.style.pointerEvents = '';
        });
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
