// V-Amp 2.0 Card Expander Logic
// Manages the FLIP animation for expanding cards into "Zen Mode"

export function initCardExpander() {
    const track = document.getElementById('tech-demo-card-track');
    const cards = document.querySelectorAll('.socket-card-container');
    const container = document.getElementById('tech-demo-right-column'); // Interactive Grid Column

    if (!track || !cards.length || !container) {
        console.warn('Card Expander: Missing required elements.');
        return;
    }

    const expander = new CardExpander(track, cards, container);
    expander.init();
}

class CardExpander {
    constructor(track, cards, container) {
        this.track = track;
        this.cards = cards;
        this.container = container; 
        this.activeCard = null;
        this.isAnimating = false;
        
        // Bind context
        this.handleClick = this.handleClick.bind(this);
    }

    init() {
        this.cards.forEach(card => {
            // v2.402: Target the specific Expand Button (Bottom Right)
            // If checking specifically for 'expand-trigger', we only attach to IT.
            // If checking for card click, we attach to card but filter in handler.
            
            // Current Logic: Card Click expands, but we want to ignore if clicking ON the button?
            // Actually, the new requirement is usually "Click Card to Expand".
            // The button is just a visual cue.
            
            card.addEventListener('click', (e) => this.handleClick(e, card));
        });
    }

    handleClick(e, card) {
        // Prevent interaction during animation
        if (this.isAnimating) return;
        
        // Filter out interactions with specific inner elements if needed (like buttons inside)
        // For now, whole card is a trigger.

        // Toggle Expand
        const isExpanded = card.classList.contains('is-expanded');
        // If clicking layout triggers or close buttons, handle logic.
        
        // Find if we clicked a close button (which we usually inject or reuse the top-right button)
        // v2.402: Top Right button becomes Close button in Expanded Mode.
        const target = e.target;
        const btn = card.querySelector('.group\\/button-trigger'); // Top Right Button
        
        // If expanded, ONLY collapse if clicking the Top-Right button (which becomes 'Close')
        if (isExpanded) {
            // Check if click was inside the top-right button
            if (btn && (btn === target || btn.contains(target))) {
                 this.collapse(card, btn, this.container);
            }
            return;
        }

        // If NOT expanded, Expand on click (anywhere, or specifically the maximize button)
        // v2.402: Let's allow expanding by clicking anywhere on the card for ease of use
        if (this.activeCard && this.activeCard !== card) {
            this.collapse(this.activeCard, null, this.container);
        }
        this.expand(card, btn, this.container);
    }

    expand(card, btn, container) {
        if (window.innerWidth < 768) return;

        const topResultBtn = card.querySelector('.group\\/button-trigger') || card.querySelector('.w-14.h-14.z-20');
        
        if (topResultBtn && !topResultBtn.hasAttribute('data-original-icon')) {
            const iconContainer = topResultBtn.querySelector('.z-30 svg');
            if (iconContainer) {
                topResultBtn.setAttribute('data-original-icon', iconContainer.innerHTML);
                if (iconContainer.hasAttribute('viewBox')) {
                    topResultBtn.setAttribute('data-original-viewbox', iconContainer.getAttribute('viewBox'));
                }
            }
        }

        const startRect = card.getBoundingClientRect();
        const startWidth = startRect.width;
        
        let safeGap = 16;
        const containerRect = container.getBoundingClientRect();
        const containerStyles = window.getComputedStyle(container);
        const isTrapped = containerStyles.transformStyle === 'preserve-3d' || containerStyles.transform !== 'none' || containerStyles.containerType !== 'normal';
        
        let targetTop, targetLeft, targetWidth, targetHeight, offsetTop, offsetLeft;

        // SCENARIO: DESKTOP (Unified In-Place Expansion)
        // Consolidated Logic: Use viewport-aware available height.
        
        if (window.innerWidth >= 1024) {
             safeGap = 0;

             // 1. Determine Coordinate Space Offset
             if (isTrapped) {
                 const isContainerScroll = (containerStyles.overflowY === 'auto' || containerStyles.overflowY === 'scroll') 
                                           && container.scrollHeight > container.clientHeight;
                 const scrollY = isContainerScroll ? container.scrollTop : window.scrollY;
                 
                 offsetTop = scrollY - containerRect.top;
                 offsetLeft = -containerRect.left;
             } else {
                 offsetTop = 0;
                 offsetLeft = 0;
             }

             // 2. Set Target Geometry (In-Place)
             targetWidth = startWidth;
             targetTop = startRect.top + offsetTop;
             targetLeft = startRect.left + offsetLeft;

             // 3. Dynamic Height Calculation
             // Calculate available vertical space from the card's top edge to the bottom of the viewport AND container.
             const visualTop = startRect.top; // Real screen Y
             
             // Respect both viewport and container boundaries
             const viewportBottom = window.innerHeight;
             const containerBottom = containerRect.bottom;
             const effectiveBottom = Math.min(viewportBottom, containerBottom);

             let availableHeight = effectiveBottom - visualTop - 16; // 16px bottom buffer
             
             // Ensure it doesn't look smaller than start (minimum expansion is the card's original size)
             if (availableHeight < startRect.height) availableHeight = startRect.height;

             targetHeight = availableHeight;
        }

        else if (isTrapped) {
             safeGap = 0;
             targetWidth = containerRect.width;
             const isContainerScroll = (containerStyles.overflowY === 'auto' || containerStyles.overflowY === 'scroll') 
                                       && container.scrollHeight > container.clientHeight;
             const scrollY = isContainerScroll ? container.scrollTop : window.scrollY;
             targetTop = scrollY;
             targetLeft = 0;
             targetHeight = window.innerHeight; 
             offsetTop = scrollY - containerRect.top;
             offsetLeft = -containerRect.left;
        }

        const startTop = startRect.top + offsetTop;
        const startLeft = startRect.left + offsetLeft;

        // 2. Lock Dimensions (Prepare for FLIP)
        card.style.position = 'absolute'; // Use absolute to stick to container
        card.style.top = `${startTop}px`;
        card.style.left = `${startLeft}px`;
        card.style.width = `${startWidth}px`;
        card.style.height = `${startRect.height}px`; // Use rect height, not startHeight var
        card.style.zIndex = '50';
        
        // Placeholder to prevent layout collapse
        const placeholder = document.createElement('div');
        placeholder.className = 'socket-card-placeholder flex-shrink-0 snap-start';
        placeholder.style.width = `${startWidth}px`;
        placeholder.style.height = `${startRect.height}px`; // Match original height
        placeholder.style.minWidth = window.getComputedStyle(card).minWidth; // Copy responsive props
        card.parentNode.insertBefore(placeholder, card);

        requestAnimationFrame(() => {
            card.classList.add('is-expanded');
            
            // Apply Target State
            card.style.top = `${targetTop}px`;
            card.style.left = `${targetLeft}px`;
            card.style.width = `${targetWidth}px`;
            card.style.height = `${targetHeight}px`;
            
            this.activeCard = card;
            this.placeholder = placeholder;
            this.isAnimating = true;

            // v2.402: Morph Top-Right Button to Close Icon
            // Need to change the SVG inside the button.
            // We kept the original icon in data attribute.
            if (topResultBtn) { // Renamed from btn to avoid loop mismatch
                const iconContainer = topResultBtn.querySelector('.z-30 svg');
                const expandTrigger = card.querySelector('.expand-trigger');
                
                // Opacity Transitions
                if (iconContainer) {
                    iconContainer.style.opacity = '0';
                    setTimeout(() => {
                         // X Icon
                         iconContainer.innerHTML = '<path fill="currentColor" d="M24 9.4L22.6 8L16 14.6L9.4 8L8 9.4l6.6 6.6l-6.6 6.6L9.4 24l6.6-6.6l6.6 6.6l1.4-1.4l-6.6-6.6L24 9.4z"/>';
                         if (topResultBtn.hasAttribute('data-original-viewbox')) { // Use standard 32x32 viewbox for X if needed, or keep original
                             iconContainer.setAttribute('viewBox', '0 0 32 32'); 
                         }
                         iconContainer.style.opacity = '1';
                    }, 200);
                }
                
                // Hide the corner expand trigger immediately
                if (expandTrigger) {
                    expandTrigger.style.opacity = '0';
                    expandTrigger.style.pointerEvents = 'none';
                }
            }
        });

        // Cleanup after transition
        const onTransitionEnd = () => {
            this.isAnimating = false;
            card.removeEventListener('transitionend', onTransitionEnd);
            
            // v2.671: Check for overflow AFTER expansion
            // If the content is taller than the card, we need to show scrollbar?
            // The card has overflow-hidden by default.
            // We should enable overflow-y auto if expanded.
            // card.style.overflowY = 'auto'; // Handled by CSS on .is-expanded usually, or we add here.
        };
        card.addEventListener('transitionend', onTransitionEnd);
    }

    collapse(card, btn, container) {
        if (!card) return;

        // 1. Measure Current (Expanded) State
        const currentRect = card.getBoundingClientRect();
        
        // 2. Calculate Target (Original) State
        // Use placeholder position
        const placeholder = this.placeholder;
        if (!placeholder) {
            // Fallback if phantom logic fails
            this.forceReset(card);
            return;
        }
        
        const endRect = placeholder.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const containerStyles = window.getComputedStyle(container);
        const isTrapped = containerStyles.transformStyle === 'preserve-3d' || containerStyles.transform !== 'none' || containerStyles.containerType !== 'normal';
        let offsetTop = 0, offsetLeft = 0;

        if (isTrapped) {
             const isContainerScroll = (containerStyles.overflowY === 'auto' || containerStyles.overflowY === 'scroll') 
                                       && container.scrollHeight > container.clientHeight;
             const scrollY = isContainerScroll ? container.scrollTop : window.scrollY;
             offsetTop = scrollY - containerRect.top;
             offsetLeft = -containerRect.left;
        }

        const targetTop = endRect.top + offsetTop;
        const targetLeft = endRect.left + offsetLeft;
        
        // 3. Animate Back
        requestAnimationFrame(() => {
            card.classList.remove('is-expanded');
            
            card.style.top = `${targetTop}px`;
            card.style.left = `${targetLeft}px`;
            card.style.width = `${endRect.width}px`;
            card.style.height = `${endRect.height}px`;
            
            this.isAnimating = true;

            // Restore Icon
            const topRightBtn = card.querySelector('.group\\/button-trigger') || card.querySelector('.w-14.h-14.z-20');
            const expandTrigger = card.querySelector('.expand-trigger');

            if (topRightBtn && topRightBtn.hasAttribute('data-original-icon')) {
                const iconContainer = topRightBtn.querySelector('.z-30 svg');
                if (iconContainer) {
                    iconContainer.style.opacity = '0';
                    setTimeout(() => {
                        iconContainer.innerHTML = topRightBtn.getAttribute('data-original-icon');
                        if (topRightBtn.hasAttribute('data-original-viewbox')) {
                            iconContainer.setAttribute('viewBox', topRightBtn.getAttribute('data-original-viewbox'));
                        }
                        iconContainer.style.opacity = '1';
                    }, 200);
                }
            }
            // Restore expand trigger visibility
            if (expandTrigger) {
                expandTrigger.style.opacity = ''; // Clear inline opacity
                expandTrigger.style.pointerEvents = '';
            }
        });

        const onCollapseEnd = () => {
            this.isAnimating = false;
            card.removeEventListener('transitionend', onCollapseEnd);
            
            // Clean up DOM
            card.style.position = '';
            card.style.top = '';
            card.style.left = '';
            card.style.width = '';
            card.style.height = '';
            card.style.zIndex = '';
            
            if (this.placeholder) {
                this.placeholder.remove();
                this.placeholder = null;
            }
            this.activeCard = null;
        };
        card.addEventListener('transitionend', onCollapseEnd);
    }

    forceReset(card) {
        card.classList.remove('is-expanded');
        card.style = '';
        if (this.placeholder) this.placeholder.remove();
        this.activeCard = null;
        this.isAnimating = false;
    }
}
