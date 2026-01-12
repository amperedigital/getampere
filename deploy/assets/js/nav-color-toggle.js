/**
 * Navigation Color Toggle v2
 * Uses elementFromPoint to accurately detect the visual section undergoing the header.
 */

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;

    function checkNavTheme() {
        // Sample a point just below the nav bar (e.g., 100px down from top, center width)
        // This tells us what the user is "looking at" or what is behind the nav area.
        const x = window.innerWidth / 2;
        const y = 80; // approximate nav height

        // Get the element at that point
        const element = document.elementFromPoint(x, y);
        if (!element) return;

        // Find the closest section or container with a theme defined
        const section = element.closest('[data-nav-theme]');
        
        if (section && section.dataset.navTheme === 'invert') {
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
