// modal-helpers.js
// Externalized helpers for modal behavior (was inline in index.html)
/* global Chart */
(function () {
  function resizeChartsInModal(modal) {
    try {
      const canvases = modal.querySelectorAll('canvas');
      canvases.forEach((canvas) => {
        const ch = canvas.chart || canvas._chart || (window.Chart && Chart.getChart && Chart.getChart(canvas));
        if (ch && typeof ch.resize === 'function') {
          ch.resize();
        } else if (ch && typeof ch.update === 'function') {
          ch.update();
        }
        // fallback delayed resize for tricky layouts
        window.setTimeout(() => {
          if (ch && typeof ch.resize === 'function') ch.resize();
          else if (ch && typeof ch.update === 'function') ch.update();
        }, 120);
      });
    } catch (err) {
      console.warn('modal-helpers: resize error', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('amp-modal-open', (e) => {
      const modal = e && e.detail && e.detail.modal;
      if (!modal) return;
      resizeChartsInModal(modal);
    });
  }
})();
