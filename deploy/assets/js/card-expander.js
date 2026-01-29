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
            card.addEventListener('click', (e) => this.handleClick(e, card));
        });
    }

    handleClick(e, card) {
        if (this.isAnimating) return;
        
        const isExpanded = card.classList.contains('is-expanded');
        const target = e.target;
        const btn = card.querySelector('.group\\/button-trigger'); // Top Right Button
        
        if (isExpanded) {
            // Close if clicking the Close Button (originally Top Right)
            if (btn && (btn === target || btn.contains(target))) {
                 this.collapse(card, btn, this.container);
            }
            // Allow clicking invalid areas to stay expanded?
            // Usually clicking the 'dimmed' area closes it, but we are full screen now.
            return;
        }

        if (this.activeCard && this.activeCard !== card) {
            this.collapse(this.activeCard, null, this.container);
        }
        this.expand(card, btn, this.container);
    }

    expand(card, btn, container) {
        if (window.innerWidth < 768) return;

        // 1. Icon Morph Logic
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

        // 2. Geometry Calculation - FIXED POSITION STRATEGY
        // Using position: fixed escapes all container clipping and scroll offsets.
        
        const startRect = card.getBoundingClientRect(); // Current position in viewport
        const containerRect = container.getBoundingClientRect(); // Target position in viewport

        // Calculate Target
        // We want to fill the container's visual area exactly.
        const targetTop = containerRect.top;
        const targetLeft = containerRect.left;
        const targetWidth = containerRect.width;
        const targetHeight = containerRect.height;

        // 3. Apply Initial State (Fixed at Start Position)
        // We must use 'fixed' immediately to ensure smooth transition to 'fixed' target
        
        // Prepare Placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'socket-card-placeholder flex-shrink-0 snap-start';
        // Match original dimensions exactly
        placeholder.style.width = `${startRect.width}px`;
        placeholder.style.height = `${startRect.height}px`;
        placeholder.style.minWidth = window.getComputedStyle(card).minWidth;
        // Insert placeholder
        card.parentNode.insertBefore(placeholder, card);

        // Lock Card to Fixed Start
        card.style.position = 'fixed';
        card.style.top = `${startRect.top}px`;
        card.style.left = `${startRect.left}px`;
        card.style.width = `${startRect.width}px`;
        card.style.height = `${startRect.height}px`;
        card.style.zIndex = '9999'; // Highest priority
        card.style.margin = '0'; // Reset margings just in case

        // Force Reflow
        void card.offsetWidth;

        // 4. Animate to Target
        requestAnimationFrame(() => {
            card.classList.add('is-expanded');
            
            card.style.top = `${targetTop}px`;
            card.style.left = `${targetLeft}px`;
            card.style.width = `${targetWidth}px`;
            card.style.height = `${targetHeight}px`;
            
            this.activeCard = card;
            this.placeholder = placeholder;
            this.isAnimating = true;

            // Icon Transitions
            if (topResultBtn) {
                const iconContainer = topResultBtn.querySelector('.z-30 svg');
                const expandTrigger = card.querySelector('.expand-trigger');
                
                if (iconContainer) {
                    iconContainer.style.opacity = '0';
                    setTimeout(() => {
                         iconContainer.innerHTML = '<path fill="currentColor" d="M24 9.4L22.6 8L16 14.6L9.4 8L8 9.4l6.6 6.6l-6.6 6.6L9.4 24l6.6-6.6l6.6 6.6l1.4-1.4l-6.6-6.6L24 9.4z"/>';
                         if (topResultBtn.hasAttribute('data-original-viewbox')) {
                             iconContainer.setAttribute('viewBox', '0 0 32 32'); 
                         }
                         iconContainer.style.opacity = '1';
                    }, 200);
                }
                
                if (expandTrigger) {
                    expandTrigger.style.opacity = '0';
                    expandTrigger.style.pointerEvents = 'none';
                }
            }
        });

        const onTransitionEnd = () => {
            this.isAnimating = false;
            card.removeEventListener('transitionend', onTransitionEnd);
            // Optionally Lock scrolling of the underlying container?
            // container.style.overflow = 'hidden';
            // But we might want content inside the card to scroll.
            // Ensure card has overflow-y: auto in CSS when expanded.
        };
        card.addEventListener('transitionend', onTransitionEnd);
    }

    collapse(card, btn, container) {
        if (!card) return;

        // 1. Calculate Targets
        const placeholder = this.placeholder;
        if (!placeholder) {
            this.forceReset(card);
            return;
        }
        
        // Target is the placeholder's current position in the viewport
        const endRect = placeholder.getBoundingClientRect();
        
        // 2. Animate Back (Stay Fixed)
        requestAnimationFrame(() => {
            card.classList.remove('is-expanded');
            
            card.style.top = `${endRect.top}px`;
            card.style.left = `${endRect.left}px`;
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
            if (expandTrigger) {
                expandTrigger.style.opacity = '';
                expandTrigger.style.pointerEvents = '';
            }
        });

        const onCollapseEnd = () => {
            this.isAnimating = false;
            card.removeEventListener('transitionend', onCollapseEnd);
            
            // Clean up: Revert to static/relative flow
            card.style.position = '';
            card.style.top = '';
            card.style.left = '';
            card.style.width = '';
            card.style.height = '';
            card.style.zIndex = '';
            card.style.margin = '';
            
            // Restore container scroll
            // container.style.overflow = '';
            
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
