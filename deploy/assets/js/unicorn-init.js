// Unicorn Studio Initialization (Dynamic Loader v3.060)
console.log("[Unicorn Init] Starting dynamic load of v3.083...");

(function () {
    // 1. Define the library URL (Official CDN)
    var libUrl = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";

    // 2. Helper to initialize once loaded
    function initWhenReady() {
        if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
            var el = document.querySelector('[data-us-project]');
            if (!el) return; // Wait for DOM

            console.log("[Unicorn Init] Library loaded. Initializing...");

            try {
                UnicornStudio.init();
                window.UnicornStudio.isInitialized = true;
                console.log("[Unicorn Init] Success. v3.083 Initialized.");
            } catch (e) {
                console.error("[Unicorn Init] Error during init:", e);
            }
        }
    }

    // 3. Load the Script
    if (!window.UnicornStudio) {
        // Preset the object so global.js knows we are *trying* to load
        // checking execution order: global.js waits for isInitialized, so this is fine.

        var script = document.createElement("script");
        script.src = libUrl;
        script.onload = initWhenReady;
        script.onerror = function () { console.error("[Unicorn Init] Failed to load library info."); };
        document.head.appendChild(script);
    } else {
        // Already loaded? (Rare)
        initWhenReady();
    }
})();
