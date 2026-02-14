// Dynamically inject styles to hide modal content on live site
// This allows visual editors (which often don't run inline JS) to see the content
(function () {
    try {
        // Only hide modal content on known live environments
        // This ensures it remains visible in all editors, previews, and local dev
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
