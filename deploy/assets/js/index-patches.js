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

// 2. Unicorn Studio Init -> Moved to global.js v3.021

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
