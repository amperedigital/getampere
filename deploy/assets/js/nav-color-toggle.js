/**
 * Navigation Color Toggle v3
 * Uses elementsFromPoint to "pierce" through the fixed nav and detect the underlying section.
 */

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;

    function checkNavTheme() {
        // Sample a point in the vertical center of the nav header
        const x = window.innerWidth / 2;
        // 40px is rough center of h-20 (80px) nav header
        const y = 40; 

        // Get all elements at that point (z-order: top to bottom)
        // This allows us to see "through" the nav bar if it is the top element.
        const elements = document.elementsFromPoint(x, y);
        
        let foundSection = null;

        for (const el of elements) {
            // Find the closest ancestor of this element that has a nav theme
            const section = el.closest('[data-nav-theme]');
            if (section) {
                foundSection = section;
                break; // Found the top-most thematic section
            }
        }

        if (foundSection && foundSection.dataset.navTheme === 'invert') {
            nav.classList.add('nav-inverted');
        } else {
            nav.classList.remove('nav-inverted');
        }
    }

    // Check on scroll and resize
    window.addEventListener('scroll', checkNavTheme, { passive: true });
    window.addEventListener('resize', checkNavTheme, { passive: true });
    
    // Initial check
    checkNavTheme();
});
