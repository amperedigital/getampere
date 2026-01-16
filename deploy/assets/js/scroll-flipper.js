/**
 * Scroll-Driven Card Stack (Direct 1:1 Control)
 * - Mapped directly to scroll position (Pixel-by-Pixel control).
 * - Handles 3D transforms continuously.
 * - Updates Tab State based on progress.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[ScrollFlipper] Initializing Direct-Drive Engine');

    const track = document.querySelector('[data-scroll-track-container]');
    const stickyContainer = document.querySelector('[data-sticky-cards]');
    const cards = Array.from(document.querySelectorAll('[data-tab-card]'));
    const triggers = Array.from(document.querySelectorAll('[data-tab-trigger]'));

    if (!track || !stickyContainer || !cards.length) {
        console.warn('[ScrollFlipper] Missing required elements. Aborting.');
        return;
    }

    // Logic Configuration
    // Total scroll distance required to flip through one card completely
    const PIXELS_PER_CARD = window.innerHeight * 0.75; 
    
    // Config for the animation curves
    const MAX_ROT_X = -30; // degrees (tipped back)
    const MAX_ROT_Y = 10;  // degrees
    const Z_DEPTH = -200;  // moves back in space
    const Y_OFFSET = 1000; // starts way below

    let currentActiveIndex = -1;

    // --- Media Trigger Helper (Using Global) ---
    const updateMediaState = (index) => {
        if (currentActiveIndex === index) return;
        currentActiveIndex = index;

        // update tabs
        triggers.forEach((t, i) => {
            if (i === index) {
                t.dataset.selected = "true";
                t.setAttribute('aria-selected', 'true');
            } else {
                delete t.dataset.selected;
                t.setAttribute('aria-selected', 'false');
            }
        });

        // update media playback
        cards.forEach((c, i) => {
            const container = c.querySelector('[data-smil-container]');
            
            if (i === index) {
                // Active Card -> Trigger Media Play
                c.classList.add('active');
                if (window.triggerMedia && container) {
                    window.triggerMedia(container, true);
                }
                const v = c.querySelector('video');
                if (v) v.play().catch(()=>{});
            } else {
                // Inactive -> Pause/Reset
                c.classList.remove('active');
                if (window.triggerMedia && container) {
                    window.triggerMedia(container, false);
                }
                const v = c.querySelector('video');
                if (v) v.pause();
            }
        });
    };

    // --- Main Render Loop ---
    const render = () => {
        const rect = track.getBoundingClientRect();
        const stickyRect = stickyContainer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Calculate how far we've scrolled into the track
        // We start "flipping" when the sticky container locks (top: ~120px)
        // Adjust offset based on your header height
        const startOffset = -rect.top + (viewportHeight * 0.2); 

        // Current "Card Index" (Float) based on pixels scrolled
        // e.g. 0.5 means halfway through flipping Card 0 to Card 1
        let scrollProgress = startOffset / PIXELS_PER_CARD;

        // Clamp logic
        const maxIndex = cards.length - 1;
        
        // Determine primary active card (integer)
        let activeIdx = Math.floor(scrollProgress);
        activeIdx = Math.max(0, Math.min(activeIdx, maxIndex));

        // Update Global State (Media/Tabs) if changed
        updateMediaState(activeIdx);

        // Apply Transforms to EVERY card 
        cards.forEach((card, i) => {
            // How "far" is this card from being the active one?
            // delta < 0 : Card is already passed (scrolled up/away)
            // delta = 0 : Card is exactly active
            // delta > 0 : Card is coming up (in the stack below)
            const delta = i - scrollProgress;

            // --- 3D Calculation Engine ---
            
            // 1. Initial State (Sitting in stack below)
            let y = 0;
            let z = 0;
            let rotX = 0;
            let rotY = 0;
            let opacity = 1;
            let pointerEvents = 'none';

            if (delta > 0) {
                // COMING UP (The Stack)
                // They stack downwards.
                // delta=1 means it's the "Next" card. delta=2 is the one after.
                
                // Parallax gap between stacked cards
                // We compress the gap as they get closer (0.1 is close, 1.0 is far)
                const stackOffset = Math.min(delta, 3); // cap visualization to 3 cards deep
                
                // Position in stack
                y = stackOffset * 60; // 60px visible gap per card
                z = -stackOffset * 50; // Push back in Z space
                rotX = MAX_ROT_X; // Tilted back ready to flip up
                rotY = MAX_ROT_Y; 
                opacity = 1 - (stackOffset * 0.1); // Slight fade for depth

                // The continuous "Entry" movement:
                // As delta goes from 1.0 -> 0.0, the card lifts UP and FLATTENS.
                // We interpolate these values.
                
                // If delta is 0.5 (halfway entering):
                // It should be halfway between stack position and active position.
                
                // WAIT! The user wants the card to "flip over, covering pixel by pixel".
                // This implies the card coming in from the BOTTOM over the top of the previous one?
                // Or the previous card leaving UPWARDS revealing the new one?
                
                // Based on "Flipping over each other, covering each other":
                // Standard "Deck" behavior:
                // Active Card stays pinned.
                // NEXT card slides UP over it.
                
                // Let's implement "Cards slide UP into place" logic.
                
                // Position calculation:
                // A card at delta=1 (next) should be fully visible below.
                // A card at delta=0 (active) should be at y=0.
                
                // We map delta (0 to 1) to Y translation (0 to WindowHeight)
                // Actually, let's look at the sample transform provided earlier:
                // translate3d(0px, 1039px, 50px) ...
                
                // Improved Logic:
                const entryProgress = Math.min(Math.max(delta, 0), 2); // Work on range 0-2
                
                // Z-Index fix: Lower index cards are BEHIND higher index cards? 
                // Usually Card 0 is top, Card 1 slides OVER it? Or Card 0 slides AWAY?
                // "Covering each other" => Higher index covers lower index.
                // So Card 1 is ON TOP of Card 0.
                // Wait. The image shows Card 0 "Cyber" BEHIND Card 1 "Test".
                // So Card 1 came from bottom and covered Card 0.
                
                // Correct Logic:
                // All cards start at y = ViewportHeight (offscreen bottom)
                // As scroll progresses, card moves to y = 0.
                
                // delta = 0 -> y = 0
                // delta = 1 -> y = 800px (approx)
                
                const percent = Math.min(delta, 1.5); // allow visible trail
                y = percent * 800; // Linear movement up based on scroll
                z = percent * 50;  // Slight Z depth change
                rotX = percent * -10; // Start titled, flatten to 0
                
            } else {
                // PAST (Leaving / Active)
                // delta is negative (e.g., -0.5)
                // Card 0 is at delta -0.5 when Card 1 is at delta 0.5 (halfway covering it).
                
                // The card created a "BASE" for the next one to slide over.
                // It creates a "Stack" effect by staying put but pushing back slightly.
                
                const passed = Math.abs(delta);
                // Push back slightly to show depth under the new card
                z = -passed * 100; 
                opacity = 1 - (passed * 0.5); // Darken/fade as it gets covered
                y = -passed * 50; // Slight upward movement to feel dynamic
            }
            
            // Interaction Check (Only the top "active" card is interactive)
            // We give a small buffer (0.1) around 0
            if (activeIdx === i) pointerEvents = 'auto';

            // Apply Style
            card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg)`;
            card.style.opacity = opacity;
            card.style.zIndex = i * 10; // Higher index = Higher z-index (stacking on top)
            card.style.pointerEvents = pointerEvents;
            
            // We explicitly disable the CSS transition we had before
            card.style.transition = 'none'; 
        });
    };

    // Hook scroll
    if (window.lenis) {
        window.lenis.on('scroll', render);
    } else {
        window.addEventListener('scroll', render);
    }
    
    // Initial Paint
    render();
});
