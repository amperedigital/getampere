// modal-helpers.js
// Externalized helpers for modal behavior (was inline in index.html)
/* global Chart */
(function () {
  function resizeChartsInModal(modal) {
    try {
      const canvases = modal.querySelectorAll('canvas');
      canvases.forEach((canvas) => {
        // Ensure parent has an explicit height; if not, set a sensible fallback so Chart.js can size
        try {
          const parent = canvas.parentElement;
          const rect = parent ? parent.getBoundingClientRect() : null;

                if (typeof ResizeObserver !== 'undefined') {
                  const ro = new ResizeObserver((entries) => {
                    entries.forEach((entry) => {
                      try {
                        const target = entry.target;
                        const modal = (target && target.matches && target.matches('[data-amp-modal]'))
                          ? target
                          : (target && target.closest && target.closest('[data-amp-modal]'));
                        if (modal) {
                          resizeChartsInModal(modal);
                        }
                      } catch (err) {
                        /* ignore individual errors */
                      }
                    });
                  });
                  // Observe existing modals
                  try { document.querySelectorAll('[data-amp-modal]').forEach(m => { try { ro.observe(m); } catch(e){} }); } catch (err) {}
                  // Also observe future opens to ensure observation (defensive)
                  window.addEventListener('amp-modal-open', (e) => {
                    const modal = e && e.detail && e.detail.modal;
                    if (modal) {
                      try { ro.observe(modal); } catch (err) { /* ignore */ }
                    }
                  });
                }
              } catch (err) {
                console.warn('[modal-helpers] ResizeObserver init failed', err);
              }
            }
          })();
