/**
 * Navigation Color Toggle v4
 * Uses BoundingClientRect intersection to detect the current section under the nav.
 * This is more robust than elementFromPoint as it doesn't rely on z-indexes or pointer-events.
 */

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    // Only query for sections that actually clearly define a theme
    // We update this list on check in case of dynamic content, or just once if static.
    // For performance, caching is better, but let's query once per load.
    const themeSections = document.querySelectorAll('[data-nav-theme]');

    function checkNavTheme() {
        const navHeight = nav.offsetHeight || 80; // Fallback to 80px if 0
        const triggerPoint = navHeight / 2; // Vertical center of the header

        let inverted = false;

        // Iterate through all tracked sections to see which one is currently under the header
        for (const section of themeSections) {
            const rect = section.getBoundingClientRect();
            
            // Check if the section covers the trigger point
            // rect.top is distance from viewport top. If negative, it's scrolled up.
            // rect.bottom is distance from viewport top to bottom of element.
            if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
                if (section.dataset.navTheme === 'invert') {
                    inverted = true;
                }
                break; // Found the top-most section occupying this space match
            }
        }

        if (inverted) {
            nav.classList.add('nav-inverted');
        } else {
            nav.classList.remove('nav-inverted');
        }
    }

    window.addEventListener('scroll', checkNavTheme, { passive: true });
    window.addEventListener('resize', checkNavTheme, { passive: true });
    
    // Initial check
    checkNavTheme();
});
