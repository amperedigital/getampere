// global.js - Initialize Lenis and other global page setup
(function() {
  // Initialize Lenis for smooth scrolling (if available)
  if (typeof Lenis !== "undefined" && !window.lenis) {
    const lenis = new Lenis({ lerp: 0.1, smooth: true });
    window.lenis = lenis;
    
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
})();
