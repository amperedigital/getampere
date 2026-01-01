// modal-helpers.js
// Externalized helpers for modal behavior (was inline in index.html)
/* global Chart */
(function () {
  'use strict';

  function resizeChartsInModal(modal) {
    if (!modal) return;
    try {
      const canvases = modal.querySelectorAll('canvas');
      canvases.forEach((canvas) => {
        try {
          const parent = canvas.parentElement || modal;
          const rect = parent.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const w = Math.max(1, Math.floor(rect.width));
          const h = Math.max(1, Math.floor(Math.max(rect.height, 200)));
          canvas.style.width = w + 'px';
          canvas.style.height = h + 'px';
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
          const ctx = canvas.getContext && canvas.getContext('2d');
          if (ctx && typeof ctx.setTransform === 'function') ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        } catch (err) {
          // non-fatal per-canvas error
        }

        const ch = canvas.chart || canvas._chart || (window.Chart && Chart.getChart && Chart.getChart(canvas));
        if (ch && typeof ch.resize === 'function') {
          try { ch.resize(); } catch (e) { try { ch.update && ch.update(); } catch (e) {} }
        } else if (ch && typeof ch.update === 'function') {
          try { ch.update(); } catch (e) {}
        }

        [50, 200, 400].forEach((delay) => {
          window.setTimeout(() => {
            try {
              if (ch && typeof ch.resize === 'function') ch.resize();
              else if (ch && typeof ch.update === 'function') ch.update();
            } catch (e) {}
          }, delay);
        });
      });
    } catch (err) {
      console.warn('[modal-helpers] resizeChartsInModal error', err);
    }
  }

  if (typeof window === 'undefined') return;

  window.addEventListener('amp-modal-open', (e) => {
    const modal = e && e.detail && e.detail.modal;
    if (!modal) return;
    try { resizeChartsInModal(modal); } catch (err) { /* ignore */ }
    try {
      const backdrop = modal.querySelector && modal.querySelector('.amp-modal-backdrop');
      if (backdrop) backdrop.style.pointerEvents = 'auto';
    } catch (err) {}
  });

  document.addEventListener('click', (ev) => {
    const trigger = ev.target && ev.target.closest && ev.target.closest('[data-modal-trigger]');
    if (trigger) {
      const modalId = trigger.getAttribute('data-modal-trigger');
      const modalSystem = window.ampere && window.ampere.modal;
      if (modalSystem && typeof modalSystem.open === 'function') {
        ev.preventDefault();
        modalSystem.open(modalId);
      }
      return;
    }

    const closer = ev.target && ev.target.closest && ev.target.closest('[data-modal-close]');
    if (closer) {
      const modalEl = closer.closest && closer.closest('[data-amp-modal]') || document.querySelector('[data-amp-modal]');
      const modalSystem = window.ampere && window.ampere.modal;
      const modalId = modalEl && (modalEl.id || modalEl.getAttribute && modalEl.getAttribute('data-modal-target'));
      if (modalId && modalSystem && typeof modalSystem.close === 'function') {
        ev.preventDefault();
        modalSystem.close(modalId);
      } else if (modalEl) {
        try {
          modalEl.style.opacity = '0';
          modalEl.style.pointerEvents = 'none';
          modalEl.setAttribute('aria-hidden', 'true');
        } catch (err) {}
      }
    }
  });

  window.addEventListener('amp-modal-close', (e) => {
    const modal = e && e.detail && e.detail.modal;
    if (!modal) return;
    try {
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      modal.setAttribute('aria-hidden', 'true');
      const backdrop = modal.querySelector && modal.querySelector('.amp-modal-backdrop');
      if (backdrop) backdrop.style.pointerEvents = 'none';
    } catch (err) {}
  });

  try {
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          try {
            const modal = entry.target && (entry.target.matches('[data-amp-modal]') ? entry.target : entry.target.closest && entry.target.closest('[data-amp-modal]'));
            if (modal) resizeChartsInModal(modal);
          } catch (err) {}
        });
      });
      document.querySelectorAll('[data-amp-modal]').forEach((m) => { try { ro.observe(m); } catch (e) {} });
      window.addEventListener('amp-modal-open', (e) => { try { if (e && e.detail && e.detail.modal) ro.observe(e.detail.modal); } catch (e) {} });
    }
  } catch (err) {
    console.warn('[modal-helpers] ResizeObserver init failed', err);
  }

})();
