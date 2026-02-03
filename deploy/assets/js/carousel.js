(function() {
    // Wait for DOM
    document.addEventListener('DOMContentLoaded', () => {
        const cards = [
            document.getElementById('card-left'),
            document.getElementById('card-center'),
            document.getElementById('card-right')
        ];

        // Guard clause if elements missing
        if (cards.some(c => !c)) return;

        // Current logical positions in the array: [Left, Center, Right]
        // This array holds the DOM elements in their current visual slots
        let state = [...cards];

        window.rotateCarousel = function(direction) {
            if (direction === 'next') {
                // Next: Right item moves to Center. Center moves to Left. Left moves to Right (wrap).
                // Array shift involves:
                // [L, C, R]
                // We want new state where C is occupying L's slot? No.
                // We want the element that was at R (2) to appear at C (1).
                // We want the element that was at C (1) to appear at L (0).
                // We want the element that was at L (0) to appear at R (2).
                // So index 2 -> 1, 1 -> 0, 0 -> 2.
                // This is a "Left Shift" of the items relative to the slots.
                // shift(): removes first element (0). Array becomes [1, 2].
                // push(): adds to end. Array becomes [1, 2, 0].
                // Now index 0 is old-1 (C). index 1 is old-2 (R).
                // Wait, if index 1 is central slot, then old-2 (R) is now Center. Correct.
                
                const first = state.shift();
                state.push(first);
            } else {
                // Prev: Left item moves to Center.
                // [L, C, R]
                // We want L (0) to be at C (1).
                // We want C (1) to be at R (2).
                // We want R (2) to be at L (0).
                // pop(): removes last (2). Array becomes [0, 1].
                // unshift(): adds to front. Array becomes [2, 0, 1].
                // New index 1 is old-0 (L). Correct.
                
                const last = state.pop();
                state.unshift(last);
            }
            updateView();
        };

        function updateView() {
            state.forEach((el, index) => {
                const img = el.querySelector('img');
                
                // Reset common classes
                el.classList.remove(
                    // Center styles
                    'z-20', 'scale-100', 'translate-x-0', 
                    // Side styles
                    'z-10', 'scale-90', '-translate-x-[60%]', 'translate-x-[60%]', 'opacity-40', 'cursor-pointer'
                );
                
                // Reset Image styles
                if(img) img.classList.remove('opacity-90', 'opacity-60', 'mix-blend-luminosity');

                if (index === 0) { 
                    // --- LEFT SLOT ---
                    el.classList.add('z-10', 'scale-90', '-translate-x-[60%]', 'opacity-40', 'cursor-pointer');
                    
                    // Update onclick to rotate away from this side
                    el.onclick = () => window.rotateCarousel('prev');
                    
                    if(img) img.classList.add('opacity-60', 'mix-blend-luminosity');
                    
                } else if (index === 1) { 
                    // --- CENTER SLOT ---
                    el.classList.add('z-20', 'scale-100', 'translate-x-0');
                    
                    // Remove click handler for center
                    el.onclick = null;
                    
                    if(img) img.classList.add('opacity-90');
                    
                } else { 
                    // --- RIGHT SLOT ---
                    el.classList.add('z-10', 'scale-90', 'translate-x-[60%]', 'opacity-40', 'cursor-pointer');
                    
                    el.onclick = () => window.rotateCarousel('next');
                    
                    if(img) img.classList.add('opacity-60', 'mix-blend-luminosity');
                }
            });
        }
    });
})();
// Sync v2.894
