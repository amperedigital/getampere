// modal-helpers.js
// Externalized helpers for modal behavior (was inline in index.html)
/* global Chart */
(function () {
  function resizeChartsInModal(modal) {
    try {
      const canvases = modal.querySelectorAll('canvas');
      canvases.forEach((canvas) => {
        // Chart.js will handle sizing based on CSS container constraints
        // Just trigger chart resize/update to re-render
        const ch = canvas.chart || canvas._chart || (window.Chart && Chart.getChart && Chart.getChart(canvas));
        if (ch && typeof ch.resize === 'function') {
          try { ch.resize(); } catch (err) { try { ch.update && ch.update(); } catch(e){} }
        } else if (ch && typeof ch.update === 'function') {
          try { ch.update(); } catch (err) { /* ignore */ }
        }
        // retry with delay to handle async initialization
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
      try {
        const backdrop = modal.querySelector && modal.querySelector('.amp-modal-backdrop');
        const csModal = window.getComputedStyle(modal);
        const csBackdrop = backdrop ? window.getComputedStyle(backdrop) : null;
        // Chart resizing handled below
      } catch (err) { /* ignore */ }
      resizeChartsInModal(modal);
      // enable backdrop pointer events so it captures clicks while modal is open
      try {
        const backdrop = modal.querySelector && modal.querySelector('.amp-modal-backdrop');
        if (backdrop) backdrop.style.pointerEvents = 'auto';
      } catch (err) { /* ignore */ }
      // NOTE: removed automatic inline visibility styles here. Visibility
      // should be handled via CSS. JS will only perform canvas sizing and
      // backdrop pointer-events. If needed, add `data-modal-inline-styles`
      // attribute to opt-in for legacy behavior.
      // Force panel sizing/positioning based on breakpoints to avoid CSS conflicts
      try {
        // find the panel element (the first child that's not the backdrop)
        let panel = null;
        for (let i = 0; i < modal.children.length; i++) {
          const ch = modal.children[i];
          if (ch.classList && ch.classList.contains('amp-modal-backdrop')) continue;
          // choose the first non-backdrop div
          if (ch.tagName && ch.tagName.toLowerCase() === 'div') { panel = ch; break; }
        }
        if (panel) {
          // Intentionally DO NOT apply layout inline styles here. The modal
          // layout and responsiveness must be driven by CSS (component
          // styles) to avoid conflicting with Tailwind or page-level
          // utilities. We'll keep a defensive canvas sizing pass below,
          // but leave overall panel sizing to CSS.
          try {
            const canvases = panel.querySelectorAll('canvas');
            canvases.forEach((canvas) => {
              // Only perform HiDPI canvas sizing (no layout styles)
              try {
                const parent = canvas.parentElement || panel;
                const rect = parent ? parent.getBoundingClientRect() : null;
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
              } catch (err) { /* ignore */ }
            });
          } catch (err) { /* ignore */ }
        }
      } catch (err) { console.warn('[modal-helpers] panel sizing failed', err); }
    });

    // Diagnostic: delegated click handler for data-modal-trigger to help debug trigger failures
    document.addEventListener('click', (ev) => {
      const trigger = ev.target.closest && ev.target.closest('[data-modal-trigger]');
      if (trigger) {
        const modalId = trigger.getAttribute('data-modal-trigger');
        // If modal system exists, attempt to open the modal (prevents default navigation)
        const modalSystem = window.ampere && window.ampere.modal;
        if (modalSystem && typeof modalSystem.open === 'function') {
          ev.preventDefault();
          const opened = modalSystem.open(modalId);
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

    // Listen for modal open to setup backdrop click handler
    window.addEventListener('amp-modal-open', (e) => {
      const modal = e && e.detail && e.detail.modal;
      if (!modal) return;
      
      // Setup backdrop click handler (clicks outside the content area)
      const backdropClickHandler = (event) => {
        const backdrop = modal.querySelector && modal.querySelector('.amp-modal-backdrop');
        // Close if clicking directly on the backdrop or on the modal container (outside content)
        if (event.target === backdrop || event.target === modal) {
          event.preventDefault();
          const modalSystem = window.ampere && window.ampere.modal;
          const modalId = modal.id || modal.getAttribute('data-modal-target');
          if (modalId && modalSystem && typeof modalSystem.close === 'function') {
            modalSystem.close(modalId);
          }
        }
      };
      
      // Store handler on modal for cleanup
      modal._backdropClickHandler = backdropClickHandler;
      modal.addEventListener('click', backdropClickHandler);
    });
    
    // Listen for modal close events to cleanup backdrop handler
    window.addEventListener('amp-modal-close', (e) => {
      const modal = e && e.detail && e.detail.modal;
      if (!modal) return;
      
      // Remove backdrop click handler
      if (modal._backdropClickHandler) {
        modal.removeEventListener('click', modal._backdropClickHandler);
        modal._backdropClickHandler = null;
      }
      
      // Modal visibility is handled by CSS classes (amp-modal--visible).
      // No inline styles applied here - let modal.js manage the styling via CSS classes.
    });
  }
})();
