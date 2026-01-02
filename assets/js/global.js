// global.js - Initialize Lenis and other global page setup
(function() {
  // Initialize Lenis for smooth scrolling (if available)
  if (typeof Lenis !== "undefined" && !window.lenis) {
    console.log("[Global] Initializing Lenis");
    const lenis = new Lenis({ lerp: 0.1, smooth: true });
    window.lenis = lenis;
    console.log("[Global] Lenis initialized, window.lenis:", !!window.lenis);
    
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } else {
    console.log("[Global] Lenis not available or already initialized");
  }
})();
