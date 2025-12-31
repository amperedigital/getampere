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
    // Listen for modal open to resize charts
    window.addEventListener('amp-modal-open', (e) => {
      const modal = e && e.detail && e.detail.modal;
      if (!modal) return;
      try { console.log('[modal-helpers] amp-modal-open', modal.id || modal.getAttribute('data-modal-target') || '(no-id)'); } catch (err) {}
      try { document.documentElement.setAttribute('data-modal-debug', `open:${modal.id||modal.getAttribute('data-modal-target')||'no-id'}`); } catch (err) {}
      resizeChartsInModal(modal);
      // Ensure visible if component CSS not present: apply inline styles for visibility
      try {
        modal.style.transition = modal.style.transition || 'opacity 500ms ease-out, transform 500ms ease-out';
        modal.style.opacity = '1';
        modal.style.transform = 'translateY(0) scale(1)';
        modal.style.pointerEvents = 'auto';
        modal.removeAttribute('aria-hidden');
      } catch (err) {
        console.warn('[modal-helpers] failed to apply inline visible styles', err);
      }
    });

    // Diagnostic: delegated click handler for data-modal-trigger to help debug trigger failures
    document.addEventListener('click', (ev) => {
      const trigger = ev.target.closest && ev.target.closest('[data-modal-trigger]');
      if (!trigger) return;
      const modalId = trigger.getAttribute('data-modal-trigger');
      try { console.log('[modal-helpers] trigger click', { modalId }); } catch (err) {}
      try { document.documentElement.setAttribute('data-modal-debug', `trigger:${modalId}`); } catch (err) {}
      // If modal system exists, attempt to open the modal (prevents default navigation)
      const modalSystem = window.ampere && window.ampere.modal;
      if (modalSystem && typeof modalSystem.open === 'function') {
        ev.preventDefault();
        const opened = modalSystem.open(modalId);
        try { console.log('[modal-helpers] modalSystem.open()', { modalId, opened }); } catch (err) {}
      } else {
        try { console.warn('[modal-helpers] modal system unavailable', { modalSystem: !!modalSystem }); } catch (err) {}
      }
    });

    // Listen for modal close to hide inline styles
    window.addEventListener('amp-modal-close', (e) => {
      const modal = e && e.detail && e.detail.modal;
      if (!modal) return;
      try { console.log('[modal-helpers] amp-modal-close', modal.id || modal.getAttribute('data-modal-target') || '(no-id)'); } catch (err) {}
      try { document.documentElement.setAttribute('data-modal-debug', `close:${modal.id||modal.getAttribute('data-modal-target')||'no-id'}`); } catch (err) {}
      try {
        modal.style.opacity = '0';
        modal.style.transform = 'translateY(1rem) scale(0.98)';
        modal.style.pointerEvents = 'none';
        modal.setAttribute('aria-hidden', 'true');
      } catch (err) {
        console.warn('[modal-helpers] failed to apply inline hide styles', err);
      }
    });
  }
})();
