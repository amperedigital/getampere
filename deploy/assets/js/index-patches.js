// Collated inline scripts from index.html to modify Shotgun Rule compliance

// 1. Editor Hacks (Hide modal content on live site)
(function () {
  try {
    const hostname = window.location.hostname;
    const isLive = hostname.includes('workers.dev') ||
      hostname === 'getampere.ai' ||
      hostname.endsWith('.getampere.ai') ||
      hostname.includes('amperedigital.github.io');

    if (!isLive) return;

    var style = document.createElement('style');
    // Split selector to prevent static analysis tools from stripping it
    style.textContent = '[data-amp-modal-' + 'content] { display: none; }';
    document.head.appendChild(style);
  } catch (e) { }
})();

// 2. Unicorn Studio Init (Robust)
(function () {
  function initUnicorn() {
    if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
      // Check if container exists to avoid "WebGL context" errors
      if (document.querySelector('[data-us-project]')) {
        window.UnicornStudio.init();
        window.UnicornStudio.isInitialized = true;
      }
    }
  }

  if (!window.UnicornStudio) {
    window.UnicornStudio = { isInitialized: false };
    var i = document.createElement("script");
    i.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
    i.onload = function () {
      // Try init immediately if loaded
      initUnicorn();
    };
    (document.head || document.body).appendChild(i);
  }

  // Safety check on load to ensure it catches late renders
  window.addEventListener('load', initUnicorn);
  // Double check for DOM readiness
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initUnicorn, 100);
  } else {
    document.addEventListener('DOMContentLoaded', initUnicorn);
  }
})();

// 4. Mobile Menu Toggle
window.toggleMenu = function (trigger) {
  const menu = document.getElementById("mobile-menu");
  if (!menu) return;
  menu.classList.toggle("translate-x-full");
  const nowOpen = !menu.classList.contains("translate-x-full");
  const button =
    trigger?.classList?.contains("amp-hamburger") ?
      trigger :
      document.querySelector(".amp-hamburger[data-role='toggle']");
  if (button) {
    button.classList.toggle("is-open", nowOpen);
  }
};
// Sync v2.894
