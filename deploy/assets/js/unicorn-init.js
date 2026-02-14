// Unicorn Studio Initialization (Restored from v2.130 backup)
// Extracted to external file to comply with "Shotgun Rule" (No Inline Scripts)

(function () {
    if (!window.UnicornStudio) {
        window.UnicornStudio = { isInitialized: false };
        var i = document.createElement("script");
        // Maintain the exact CDN version from the backup
        i.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
        i.onload = function () {
            if (!window.UnicornStudio.isInitialized) {
                UnicornStudio.init();
                window.UnicornStudio.isInitialized = true;
            }
        };
        (document.head || document.body).appendChild(i);
    }
})();

// Safety Check (Restored from backup index.html line 1980)
// Ensure initialization happens if the script loads before the main init block runs
if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
    window.UnicornStudio.init();
} else {
    window.addEventListener('load', () => {
        if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') window.UnicornStudio.init();
    });
}
