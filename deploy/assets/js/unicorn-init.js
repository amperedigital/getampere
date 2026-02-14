// Unicorn Studio Initialization
console.log("[Unicorn Init Script] Loaded and running...");
(function () {
    // Helper to init
    function tryInit() {
        if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
            // Check if element exists
            var el = document.querySelector('[data-us-project]');
            if (!el) {
                console.warn("[Unicorn Init] Container not found yet.");
                return;
            }

            // Check dimensions (WebGL requires non-zero size)
            var rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.warn("[Unicorn Init] Container has 0 dimensions (" + rect.width + "x" + rect.height + "). Waiting...");
                // Retry in 100ms
                setTimeout(tryInit, 100);
                return;
            }

            console.log("[Unicorn Init] Element found (" + el.getAttribute('data-us-project') + ") with dimensions " + rect.width + "x" + rect.height + ". Initializing...");

            // Add slight delay to ensure layout is ready (WebGL context needs dimensions)
            setTimeout(function () {
                try {
                    UnicornStudio.init();
                    window.UnicornStudio.isInitialized = true;
                    console.log("[Unicorn Init] Success.");
                } catch (e) {
                    console.error("[Unicorn Init] Error during init:", e);
                }
            }, 100);
        }
    }

    // 1. Try Immediately
    if (window.UnicornStudio) {
        tryInit();
        return;
    }

    // 2. Wait for Load (if script is async/defer or below this one)
    console.log("[Unicorn Init] Library not found yet, waiting...");
    window.addEventListener('load', tryInit);
    document.addEventListener('DOMContentLoaded', tryInit);

    // 3. Fallback Poll
    var checks = 0;
    var interval = setInterval(function () {
        if (window.UnicornStudio) {
            clearInterval(interval);
            tryInit();
        }
        checks++;
        if (checks > 20) clearInterval(interval); // Stop after 2s
    }, 100);
})();
