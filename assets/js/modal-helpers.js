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
          if (parent && rect && rect.height < 40) {
            // fallback height: try common chart height
            parent.style.minHeight = parent.style.minHeight || '420px';
            console.log('[modal-helpers] applied fallback minHeight to chart parent');
          }
          // Explicitly size the canvas to match parent (for HiDPI support)
          if (parent && rect) {
            const dpr = window.devicePixelRatio || 1;
            const w = Math.floor(rect.width);
            const h = Math.floor(Math.max(rect.height, 200));
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            const ctx = canvas.getContext('2d');
            if (ctx && typeof ctx.setTransform === 'function') ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
        } catch (err) {
          console.warn('[modal-helpers] error sizing canvas', err);
        }
        const ch = canvas.chart || canvas._chart || (window.Chart && Chart.getChart && Chart.getChart(canvas));
        if (ch && typeof ch.resize === 'function') {
          try { ch.resize(); } catch (err) { try { ch.update && ch.update(); } catch(e){} }
        } else if (ch && typeof ch.update === 'function') {
          try { ch.update(); } catch (err) { /* ignore */ }
        }
        // stronger fallback: multiple retries to handle layout timing
        [50, 200, 400].forEach((delay) => {
          window.setTimeout(() => {
            try {
              if (ch && typeof ch.resize === 'function') ch.resize();
              else if (ch && typeof ch.update === 'function') ch.update();
            } catch (err) {
              /* ignore */
            }
          }, delay);
        });
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
      if (trigger) {
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
        return;
      }

      // Delegated close handler: any element with data-modal-close should close the nearest modal
      const closer = ev.target.closest && ev.target.closest('[data-modal-close]');
      if (closer) {
        try { console.log('[modal-helpers] delegated close click'); } catch (err) {}
        const modalEl = closer.closest('[data-amp-modal]') || document.querySelector('[data-amp-modal]');
        let modalId = modalEl && (modalEl.id || modalEl.getAttribute('data-modal-target'));
        const modalSystem = window.ampere && window.ampere.modal;
        if (modalId && modalSystem && typeof modalSystem.close === 'function') {
          ev.preventDefault();
          const closed = modalSystem.close(modalId);
          try { console.log('[modal-helpers] modalSystem.close()', { modalId, closed }); } catch (err) {}
          return;
        }
        // Fallback: if no modalSystem, try to directly hide the modal element
        if (modalEl) {
          try {
            modalEl.style.opacity = '0';
            modalEl.style.transform = 'translateY(1rem) scale(0.98)';
            modalEl.style.pointerEvents = 'none';
            modalEl.setAttribute('aria-hidden', 'true');
          } catch (err) { console.warn('[modal-helpers] fallback close failed', err); }
        }
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
