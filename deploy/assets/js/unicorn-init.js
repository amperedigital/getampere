// Unicorn Studio Initialization (Extracted from inline script for compliance)
(function () {
    if (!window.UnicornStudio) {
        window.UnicornStudio = { isInitialized: false };
        var i = document.createElement("script");
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
