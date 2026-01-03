const initModal = () => {
  // Modal system - handles modal open/close with scroll locking
  const namespace = (window.ampere ??= {});
  const modalSystem = (namespace.modal ??= {
    instances: {},
    open(id) {
      const instance = this.instances[id];
      if (!instance) return false;
      instance.open();
      return true;
    },
    close(id) {
      const instance = this.instances[id];
      if (!instance) return false;
      instance.close();
      return true;
    },
    closeAll() {
      Object.values(this.instances).forEach((instance) => instance.close());
    },
  });

  const reduceMotion =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const lenisHelpers = {
    get instance() {
      return window.lenis;
    },
    lock(active) {
      const lenis = this.instance;
      if (active) {
        // Stop Lenis
        if (lenis && typeof lenis.stop === "function") {
          lenis.stop();
        }
        // Lock body scroll natively
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        // Unlock body scroll
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        
        // Resume Lenis
        if (lenis && typeof lenis.start === "function") {
          lenis.start();
        }
        if (lenis && typeof lenis.resize === "function") {
          lenis.resize();
        }
      }
    },
    refresh() {
      const lenis = this.instance;
      if (lenis && typeof lenis.resize === "function") {
        lenis.resize();
      }
    },
  };

  function setupModal(modal) {
    if (!modal || modal.dataset.scriptInitialized === "true") return;

    const modalId = modal.getAttribute("data-modal-target") || modal.id;
    if (!modalId) return;

    modal.dataset.scriptInitialized = "true";

    const lockScroll = modal.hasAttribute("data-modal-lock-scroll");
    const transitionDuration = Number(modal.dataset.modalDuration || 320) || 320;

    let lastFocusedElement = null;
    let isClosing = false;
    let closeTimer = null;
    let escapeHandler = null;

    function showDialog() {
      if (modal.tagName === 'DIALOG' && typeof modal.show === "function") {
        if (!modal.open) modal.show();
      } else {
        modal.setAttribute("open", "");
      }
      modal.removeAttribute("inert");
    }

    function hideDialog() {
      if (modal.tagName === 'DIALOG' && typeof modal.close === "function") {
        if (modal.open) modal.close();
      } else {
        modal.removeAttribute("open");
      }
      modal.setAttribute("inert", "");
    }

    function finalizeClose() {
      hideDialog();
      modal.classList.remove("amp-modal--visible");
      isClosing = false;
      closeTimer = null;

      if (lockScroll) {
        lenisHelpers.lock(false);
      } else {
        lenisHelpers.refresh();
      }

      if (lastFocusedElement) {
        lastFocusedElement.focus({ preventScroll: true });
      }

      if (escapeHandler) {
        document.removeEventListener("keydown", escapeHandler);
      }

      window.dispatchEvent(new CustomEvent("amp-modal-close", { detail: { id: modalId, modal } }));
    }

    function openModal() {
      // Clear any pending close timer to prevent race conditions
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }

      const isVisible = modal.classList.contains("amp-modal--visible");
      const isDialogOpen = modal.tagName === 'DIALOG' ? modal.open : modal.hasAttribute("open");
      
      // If fully open and not currently closing, ignore
      if (isVisible && isDialogOpen && !isClosing) return;
      
      isClosing = false;

      lastFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      // 1. Prepare to show: ensure layout, remove inert, set open attribute
      showDialog();
      modal.classList.add("amp-modal--visible");
      modal.setAttribute("aria-hidden", "false");
      
      // 2. Force reflow to ensure browser acknowledges the open state before animating
      // Using double RAF for maximum safety across browsers
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 3. Animate in: use inline styles to force visibility (robust against missing classes)
          modal.style.opacity = '1';
          modal.style.transform = 'translateY(0) scale(1)';
          modal.style.pointerEvents = 'auto';
          
          // Also remove the hiding classes
          modal.classList.remove("opacity-0", "translate-y-4", "scale-[0.98]", "pointer-events-none");
        });
      });

      modal.querySelectorAll("[data-modal-scroll]").forEach((element) => (element.scrollTop = 0));

      if (lockScroll) {
        lenisHelpers.lock(true);
      } else {
        lenisHelpers.refresh();
      }

      // Setup escape key handler for this modal
      if (!escapeHandler) {
        escapeHandler = (event) => {
          if (event.key === "Escape" && modal.classList.contains("amp-modal--visible")) {
            event.preventDefault();
            closeModal();
          }
        };
      }
      document.addEventListener("keydown", escapeHandler);

      window.dispatchEvent(new CustomEvent("amp-modal-open", { detail: { id: modalId, modal } }));
    }

    function closeModal() {
      const isVisible = modal.classList.contains("amp-modal--visible");
      const isDialogOpen = modal.tagName === 'DIALOG' ? modal.open : modal.hasAttribute("open");
      
      if ((!isVisible && !isDialogOpen) || isClosing) return;
      
      isClosing = true;
      modal.setAttribute("aria-hidden", "true");
      
      // Transition out: clear inline styles and add hiding classes
      modal.style.opacity = '';
      modal.style.transform = '';
      modal.style.pointerEvents = '';
      
      modal.classList.remove("opacity-100", "translate-y-0", "scale-100", "pointer-events-auto");
      modal.classList.add("opacity-0", "translate-y-4", "scale-[0.98]", "pointer-events-none");

      if (closeTimer) {
        window.clearTimeout(closeTimer);
      }

      if (reduceMotion) {
        finalizeClose();
      } else {
        closeTimer = window.setTimeout(finalizeClose, transitionDuration);
      }
    }

    modal.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeModal();
    });

    modal.addEventListener("click", (event) => {
      // Close on close button click
      if (event.target.closest("[data-modal-close]")) {
        event.preventDefault();
        closeModal();
        return;
      }
    });

    modalSystem.instances[modalId] = { open: openModal, close: closeModal, element: modal };
  }

  // Auto-wrap content marked with data-amp-modal-content
  function wrapModalContent(contentEl) {
    if (contentEl.dataset.modalWrapped === "true") return;
    if (!document.body) return; // Safety check
    
    // Note: We removed the Aura editor check here because:
    // 1. In Design Mode, scripts likely don't run, so this code doesn't execute (safe).
    // 2. In Preview Mode, scripts DO run, and we WANT the modal to wrap/function.
    // 3. The visibility in Design Mode is handled by the 'isLive' check in index.html.
    
    /* 
    const isEditor = window.location.hostname.endsWith('aura.build') || ...
    if (isEditor) return; 
    */

    
    const modalId = contentEl.id;
    if (!modalId) {
      console.warn("Modal content missing ID", contentEl);
      return;
    }

    // Create the outer modal shell
    const modalShell = document.createElement("div");
    modalShell.id = modalId; // Transfer ID to the shell
    modalShell.className = "fixed inset-0 z-[99999] flex w-screen h-screen items-start md:items-center justify-center px-4 sm:px-6 md:px-0 py-6 md:py-8 pt-24 md:pt-0 transition-all duration-500 ease-out opacity-0 translate-y-4 scale-[0.98] pointer-events-none";
    modalShell.setAttribute("data-amp-modal", "");
    modalShell.setAttribute("data-modal-lock-scroll", "");
    modalShell.setAttribute("data-modal-duration", "500"); // Match CSS duration
    modalShell.setAttribute("inert", "");
    
    // Create backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "fixed inset-0 bg-black/70 shadow-[0_0_80px_rgba(0,0,0,0.65)] pointer-events-none amp-modal-backdrop z-40";
    modalShell.appendChild(backdrop);

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "md:rounded-3xl overflow-visible w-full sm:w-11/12 md:w-[90vw] lg:w-[75vw] xl:w-[100vw] sm:max-w-3xl md:max-w-[1200px] h-full mt-[7rem] pointer-events-auto rounded-none mx-auto pb-8 relative z-[9998]";
    
    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("data-modal-close", "");
    closeBtn.className = "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] w-10 h-10 rounded-full bg-white/15 border border-white/30 text-white backdrop-blur flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";
    closeBtn.innerHTML = `<span class="sr-only">Close overlay</span><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18 6 6 18M6 6l12 12"></path></svg>`;
    wrapper.appendChild(closeBtn);

    // Move content into wrapper
    // Rename content ID to avoid duplicate IDs since shell now has the main ID
    contentEl.id = `${modalId}-content`;
    contentEl.removeAttribute("data-amp-modal-content"); // Prevent re-wrapping
    contentEl.dataset.modalWrapped = "true";
    
    // Ensure content is visible (in case it was hidden by CSS)
    contentEl.style.display = "block";
    // Also remove hidden class if it was there (legacy support)
    contentEl.classList.remove("hidden");
    
    wrapper.appendChild(contentEl);
    modalShell.appendChild(wrapper);
    
    // Append to body
    document.body.appendChild(modalShell);
  }

  // Always scan for elements (idempotent)
  document.querySelectorAll("[data-amp-modal-content]").forEach(wrapModalContent);
  document.querySelectorAll("[data-amp-modal]").forEach(setupModal);

  // Only setup global listeners once
  if (window.__ampModalInitialized) return;
  window.__ampModalInitialized = true;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-modal-trigger]");
    if (!trigger) return;

    const modalId = trigger.getAttribute("data-modal-trigger");
    if (!modalId) return;

    event.preventDefault();
    modalSystem.open(modalId);
  });

  const params = new URLSearchParams(window.location.search);
  const autoloadModal = params.get("modal-id");
  if (autoloadModal) {
    if (modalSystem.open(autoloadModal)) {
      params.delete("modal-id");
      const next =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "") +
        window.location.hash;
      history.replaceState({}, "", next);
    }
  }
};

// Run immediately if possible, and also on DOMContentLoaded to be safe
initModal();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModal);
}