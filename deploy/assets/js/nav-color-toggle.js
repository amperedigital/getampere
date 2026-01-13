/**
 * Navigation Color Toggle v5 (Debug)
 */

document.addEventListener('DOMContentLoaded', () => {
    // console.log("Nav Toggle Script Loaded v5");
    const nav = document.querySelector('nav');
    if (!nav) {
        // console.error("Nav element not found");
        return;
    }
    
    // Select all potential theme sections
    const themeSections = document.querySelectorAll('[data-nav-theme]');
    // console.log(`Found ${themeSections.length} sections with data-nav-theme`);

    function checkNavTheme() {
        // We trigger around the vertical middle of the nav bar (approx 40px down)
        // Adjust this if you want it to trigger when the section hits the TOP of the viewport (0)
        // or when the section is fully under the nav.
        const triggerPoint = 40; 
        
        let inverted = false;
        let activeSection = null;

        for (const section of themeSections) {
            const rect = section.getBoundingClientRect();
            
            // Logic: Is the "Trigger Point" (y=40px) inside this section's vertical bounds?
            // rect.top <= 40  Mean the section top has scrolled up past the trigger point
            // rect.bottom >= 40 Means the section bottom is still below the trigger point
            if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
                activeSection = section;
                if (section.dataset.navTheme === 'invert') {
                    inverted = true;
                }
                break; // First match (top-most visual layer assuming standard flow)
            }
        }

        // console.log(`Active Section: ${activeSection ? activeSection.className : 'None'}, Inverted: ${inverted}`);

        if (inverted) {
            if (!nav.classList.contains('nav-inverted')) {
               // console.log("Adding nav-inverted class");
               nav.classList.add('nav-inverted');
            }
        } else {
            if (nav.classList.contains('nav-inverted')) {
               // console.log("Removing nav-inverted class");
               nav.classList.remove('nav-inverted');
            }
        }
    }

    window.addEventListener('scroll', checkNavTheme, { passive: true });
    window.addEventListener('resize', checkNavTheme, { passive: true });
    
    // Initial check
    setTimeout(checkNavTheme, 100); // Small delay to ensure layout
});
