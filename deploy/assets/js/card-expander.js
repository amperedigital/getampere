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
                    return;
                }
            }

            // NEW (v2.468): Allow clicking anywhere on the card to expand (Zen Mode)
            const card = e.target.closest('.socket-card-container');
            if (card && !card.classList.contains('is-expanded')) {
                 // Ignore interactive elements
                 if (['INPUT', 'BUTTON', 'A', 'LABEL'].includes(e.target.tagName)) return;
                 // Ignore if hitting the scrollbar (approx check?)
                 // Actually the click event target would be the content div. 
                 
                 this.expand(card, null, column);
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
                // Save original viewbox to support different icon sizes (32x32 original vs 24x24 close)
                if (iconContainer.hasAttribute('viewBox')) {
                    topRightBtn.setAttribute('data-original-viewbox', iconContainer.getAttribute('viewBox'));
                }
            }
        }

        // 1. Measure layout before moving
        // FLIP Animation: First, Last, Invert, Play
        const startRect = card.getBoundingClientRect();
        
        // Context: The card will become 'absolute' relative to 'container' (tech-demo-right-column).
        // Since container is relative, we strictly map offsets.
        const parentRect = container.getBoundingClientRect();
        
        // Calculate the initial "Grid Position" in pixels relative to the parent
        // FIX (v2.409): Add scrollTop/scrollLeft to account for scrolling.
        // Unscrolled: top 100 - parent 0 = 100.
        // Scrolled 200: top -100 - parent 0 = -100. Correct visual pos.
        // But absolute top: -100 puts it way above up.
        // Absolute with scrolling ancestor moves WITH the content.
        // So we need: top relative to CONTENT start.
        // = VisualDiff + ScrollTop.
        const startTop = (startRect.top - parentRect.top) + container.scrollTop;
        const startLeft = (startRect.left - parentRect.left) + container.scrollLeft;
        const startWidth = startRect.width;
        const startHeight = startRect.height;
        
        // Calculate the TARGET positions relative to content start.
        // Target: Top of content + 2rem.
        const targetTop = container.scrollTop + 32; // 2rem
        // Target Height: Viewport Height - 4rem (Top 2rem + Bottom 2rem).
        // Using parentRect.height (viewport height of container) is correct.
        const targetHeight = parentRect.height - 64; 
        
        // Target Layout (Dynamic Padding Awareness)
        // Fix v2.508: Calculate margins dynamically to match container padding exactly.
        const containerStyle = window.getComputedStyle(container);
        const padLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const padRight = parseFloat(containerStyle.paddingRight) || 0;

        // Target Left: Align exactly with the content box (padding-left)
        const targetLeft = padLeft; 
        // Target Width: Full width minus horizontal padding (Fill the content box)
        const targetWidth = parentRect.width - (padLeft + padRight);

        // 2. Insert Spacer
        this.spacer.className = card.className.replace('socket-card-container', 'card-spacer pointer-events-none opacity-0').replace('is-expanded', ''); 
        this.spacer.id = '';
        this.spacer.innerHTML = '';
        
        if (card.parentNode) {
            card.parentNode.insertBefore(this.spacer, card);
        }

        // 3. Promote Card
        // Apply Inline Styles to "Lock" the card to its starting grid position visually.
        card.style.position = 'absolute';
        card.style.top = `${startTop}px`;
        card.style.left = `${startLeft}px`;
        card.style.width = `${startWidth}px`; 
        card.style.height = `${startHeight}px`; 
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
            // BUT we override the CSS position properties (removed !important in v2.409 CSS)
            // to insure they match the scroll position.
            
            card.style.top = `${targetTop}px`;
            card.style.left = `${targetLeft}px`;
            card.style.width = `${targetWidth}px`;
            card.style.height = `${targetHeight}px`;
            
            // Reset right/bottom to allow width/height to win
            card.style.right = '';
            card.style.bottom = '';
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

        // Calculate Target relative to Content Start (Visual + Scroll)
        const targetTop = (targetRect.top - parentRect.top) + container.scrollTop;
        const targetLeft = (targetRect.left - parentRect.left) + container.scrollLeft;
        const targetWidth = targetRect.width;
        const targetHeight = targetRect.height;
        
        // Current Visual Start (which is already set via inline styles from expand, but might have changed if scrolled?)
        // If user scrolled while expanded, the card moved with it.
        // currentRect reflects new visual pos.
        // We need to set inline styles to current visual pos relative to content start.
        const currentTop = (currentRect.top - parentRect.top) + container.scrollTop;
        const currentLeft = (currentRect.left - parentRect.left) + container.scrollLeft;
        
        card.classList.remove('is-expanded');
        document.body.classList.remove('card-expanded-mode');
        container.classList.remove('has-active-card');
        
        // Lock to current visual state
        card.style.position = 'absolute';
        card.style.top = `${currentTop}px`;
        card.style.left = `${currentLeft}px`;
        card.style.width = `${currentRect.width}px`;
        card.style.height = `${currentRect.height}px`;
        card.style.zIndex = '50';
        
        // C. Reflow
        void card.offsetWidth;

        // D. Animate to Grid Slot
        requestAnimationFrame(() => {
            card.style.top = `${targetTop}px`;
            card.style.left = `${targetLeft}px`;
            card.style.width = `${targetWidth}px`;
            card.style.height = `${targetHeight}px`;
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

    updateIcon(btn, state) {
        if (!btn) return;
        const iconContainer = btn.querySelector('.z-30 svg'); // The icon SVG
        if (!iconContainer) return;

        if (state === 'close') {
            // Change to "X" (Close)
            // Use 24x24 viewBox for the standard X icon
             iconContainer.innerHTML = '<path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>';
             iconContainer.setAttribute('viewBox', '0 0 24 24');
        } else {
            // Restore original icon
            if (btn.hasAttribute('data-original-icon')) {
                iconContainer.innerHTML = btn.getAttribute('data-original-icon');
                // Restore original ViewBox if saved
                if (btn.hasAttribute('data-original-viewbox')) {
                    iconContainer.setAttribute('viewBox', btn.getAttribute('data-original-viewbox'));
                }
            }
        }
    }
}
