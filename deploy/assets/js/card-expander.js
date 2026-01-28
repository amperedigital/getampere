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
        // v2.571: Run Height Equalizer immediately and on resize
        this.equalizeHeights();
        window.addEventListener('resize', () => this.equalizeHeights());
        // Run slightly later to account for asset loading/font rendering
        setTimeout(() => this.equalizeHeights(), 500); 
        setTimeout(() => this.equalizeHeights(), 2000);

        // Delegate click events on the right column
        const column = document.getElementById('tech-demo-right-column');
        
        // v2.570: Listen for global "Close All Cards" event (e.g. from Controller)
        window.addEventListener('ampere:close-cards', () => {
             if (this.activeCard) {
                 this.collapse(this.activeCard, null, column || document.body);
             }
        });

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
        
        // Context: The card will become 'FIXED'.
        // Since container is relative, we strictly map offsets.
        const parentRect = container.getBoundingClientRect();
        
        // Calculate the initial "Grid Position" in pixels relative to the parent
        // v2.566: Updated to use FIXED positioning (Viewport Coords) to match target state.
        // This prevents the "drop" effect on mobile when scrollTop was included on absolute elements.
        const startTop = startRect.top;
        const startLeft = startRect.left;
        const startWidth = startRect.width;
        const startHeight = startRect.height;
        
        // v2.567: Universal "Zen Mode" Target Calculation
        // Ignoring parent container position/dimensions and filling the Viewport directly.
        // This ensures the card is always centered and maximized on screen, preventing "drop" issues.
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        
        // Target Gap/Padding (1rem = 16px usually, but let's be dynamic or fixed safe area)
        const safeGap = 16; 
        
        const targetTop = safeGap;
        const targetLeft = safeGap;
        const targetWidth = viewportW - (safeGap * 2);
        const targetHeight = viewportH - (safeGap * 2);

        // 2. Insert Spacer
        this.spacer.className = card.className.replace('socket-card-container', 'card-spacer pointer-events-none opacity-0').replace('is-expanded', ''); 
        this.spacer.id = '';
        this.spacer.innerHTML = '';
        
        if (card.parentNode) {
            card.parentNode.insertBefore(this.spacer, card);
        }

        // v2.572: Mobile Optimization - Instant Expansion
        // Skip FLIP animation on mobile to avoid translation artifacts.
        if (window.innerWidth <= 768) {
             card.style.transition = 'none'; // Ensure no transition
             
             // Set Final State Immediately
             card.style.position = 'fixed';
             card.style.top = `${targetTop}px`;
             card.style.left = `${targetLeft}px`;
             card.style.width = `${targetWidth}px`; 
             card.style.height = `${targetHeight}px`; 
             card.style.zIndex = '9999';
             card.style.margin = '0';
             
             card.classList.add('is-expanded');
             document.body.classList.add('card-expanded-mode'); 
             container.classList.add('has-active-card');
             
             this.activeCard = card;
             this.updateIcon(topRightBtn, 'close');
             
             if(btn) {
                 btn.style.opacity = '0';
                 btn.style.pointerEvents = 'none';
             }
             return;
        }

        // 3. Promote Card
        // Apply Inline Styles to "Lock" the card to its starting grid position visually.
        card.style.position = 'fixed';
        card.style.top = `${startTop}px`;
        card.style.left = `${startLeft}px`;
        card.style.width = `${startWidth}px`; 
        card.style.height = `${startHeight}px`; 
        card.style.zIndex = '9999';
        card.style.margin = '0'; 
        
        // Force Layout Recalculation (Reflow)
        void card.offsetWidth; 

        // 3b. Trigger Transformation
        requestAnimationFrame(() => {
            card.classList.add('is-expanded');
            document.body.classList.add('card-expanded-mode'); 
            container.classList.add('has-active-card');
            
            // v2.566: Use Fixed Coords
            
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
        // const parentRect = container.getBoundingClientRect(); // No longer needed for Fixed Position
        
        // Measure where we want to go (The Spacer)
        const targetRect = this.spacer.getBoundingClientRect();

        // v2.565: Use FIXED positioning for the return animation to avoid clipping by parent containers
        // (like the mobile scroll track) which happens when using 'absolute'.
        const targetTop = targetRect.top;
        const targetLeft = targetRect.left;
        const targetWidth = targetRect.width;
        const targetHeight = targetRect.height;
        
        // Current Visual Start (Fixed Viewport Coords)
        const currentTop = currentRect.top;
        const currentLeft = currentRect.left;
        
        card.classList.remove('is-expanded');
        document.body.classList.remove('card-expanded-mode');
        container.classList.remove('has-active-card');
        
        // MOBILE OPTIMIZATION: Skip animation on mobile to avoid "jerkiness" or artifacts (v2.568)
        const isMobile = window.innerWidth <= 768; // Standard tablet/mobile breakpoint
        
        if (isMobile) {
            // v2.570: Force transition disable to prevent base-class animations from firing during reset
            card.style.transition = 'none !important';
            void card.offsetWidth; // Force Reflow

            // IMMEDIATE CLEANUP (No Animation)
             if (this.spacer.parentNode) {
                this.spacer.parentNode.removeChild(this.spacer);
            }
            // Reset styles immediately
            card.style.position = '';
            card.style.top = '';
            card.style.left = '';
            card.style.right = '';
            card.style.bottom = '';
            card.style.width = '';
            card.style.height = '';
            card.style.zIndex = '';
            card.style.margin = '';
            // keep transition disabled for this frame
            card.style.transition = 'none';
            
            this.activeCard = null;
            
            // Icon Updates
            const topRightBtn = card.querySelector('.group\\/button-trigger') || card.querySelector('.w-14.h-14.z-20');
            this.updateIcon(topRightBtn, 'expand');
            
            const triggers = card.querySelectorAll('.expand-trigger');
            triggers.forEach(t => {
                t.style.opacity = '';
                t.style.pointerEvents = '';
            });
            
            return;
        }

        // Lock to current visual state using FIXED position
        card.style.position = 'fixed'; // Keep it fixed!
        card.style.top = `${currentTop}px`;
        card.style.left = `${currentLeft}px`;
        card.style.width = `${currentRect.width}px`;
        card.style.height = `${currentRect.height}px`;
        card.style.zIndex = '9999'; // Stay on top during anim
        
        // C. Reflow
        void card.offsetWidth;

        // D. Animate to Grid Slot (Fixed Coords)
        requestAnimationFrame(() => {
            // v2.564: Use transition class to ensure smooth movement even if CSS is tricky
            card.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
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
            card.style.transition = ''; // clear inline transition
            
            this.activeCard = null;
        }, 500); // Sync with CSS 0.5s

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

    // v2.571: Uniform Card Height Enforcement
    equalizeHeights() {
        const cards = document.querySelectorAll('.socket-card-container');
        if (!cards.length) return;

        // Reset first to measure natural height
        cards.forEach(card => card.style.minHeight = '');

        let maxHeight = 0;
        cards.forEach(card => {
            const height = card.scrollHeight;
            if (height > maxHeight) maxHeight = height;
        });

        if (maxHeight > 0) {
             cards.forEach(card => {
                card.style.minHeight = `${maxHeight}px`;
            });
        }
    }
}

