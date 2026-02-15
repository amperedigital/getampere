// Unicorn Studio Initialization (v3.121)
// Moved to external file to prevent HTML syntax errors during patching.

document.addEventListener("DOMContentLoaded", function () {
    console.log("🦄 [Unicorn Init] DOMContentLoaded fired.");

    var canvas = document.getElementById('unicorn-canvas-target');
    var container = document.getElementById('expertise-gradients');

    // 1. Ensure Canvas Exists & Fits
    if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Force critical styles
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '10'; // visible
        canvas.style.pointerEvents = 'none'; // click-through
    } else {
        console.error("🔥 [Unicorn Init] Canvas or Container missing!", { canvas, container });
        return;
    }

    // 2. Initialize Library
    if (window.UnicornStudio) {
        UnicornStudio.init({
            projectId: 'dpD006WOWWQALxqKpHFZ',
            canvas: canvas,
            debug: false
        }).then(function () {
            console.log("🦄 [Unicorn Init] Success!");
            window.UnicornStudio.isInitialized = true;
        }).catch(function (err) {
            console.error("🔥 [Unicorn Init] Failed:", err);
        });
    } else {
        console.error("🔥 [Unicorn Init] 'UnicornStudio' global not found.");
    }
});
