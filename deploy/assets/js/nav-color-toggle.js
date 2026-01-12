/**
 * Navigation Color Toggle
 * Switches the nav theme between 'light' (default) and 'dark' (inverted)
 * based on the background color of the section currently under the nav.
 */

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Define "light" sections (where nav should be dark)
    // We look for sections with bg-white, bg-blue-50, etc.
    // If a section is "dark" (bg-black, bg-[#0a0b14]), nav should be "light" (white text).
    
    // Actually, let's reverse the logic based on the user request.
    // User wants: "Nav is white" (I assume white text on transparent bg, standard for dark pages)
    // "Change to dark when... white page" (Dark BG, White Text? Or White BG, Dark Text?)
    
    // RE-READING USER REQUEST: 
    // "The background nav is white, and there is a logo mark that is an SVG that is transparent completely"
    // "Because the background of the nav is white on white pages, you can't see the difference"
    // "I think we need a way to make the background of the whole nav go dark mode... when we scroll to a white page."
    
    // Interpretation:
    // Default (Dark Page): Nav is Transparent (looks like page bg), Logo has White parts.
    // Problem (White Page): Nav is White (or Transparent over White). Logo White parts are invisible.
    // Solution (White Page): Nav Background becomes DARK (#0a0b14). Logo White parts become visible against Dark Nav.
    
    // So:
    // Dark Section -> Nav Mode: Default (Transparent BG)
    // White Section -> Nav Mode: Inverted (Dark BG)
    
    const obsOptions = {
        root: null,
        rootMargin: '-10px 0px -90% 0px', // Trigger when section hits the top area
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target;
                if (section.dataset.navTheme === 'invert') {
                    nav.classList.add('nav-inverted');
                } else {
                    nav.classList.remove('nav-inverted');
                }
            }
        });
    }, obsOptions);

    // Observe all sections
    document.querySelectorAll('section, footer').forEach(section => {
        observer.observe(section);
    });
});
