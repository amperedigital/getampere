const initModal = () => {
  console.log("[Modal] initModal() called, document.readyState:", document.readyState);
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

  const lenisInstance =
    typeof window !== "undefined" && window.lenis ? window.lenis : null;

  const lenisHelpers = {
    lock(active) {
      console.log("[Modal] lenisHelpers.lock(" + active + ") called, lenisInstance:", !!lenisInstance);
      if (!lenisInstance) {
        console.warn("[Modal] lenisInstance not available!");
        return;
      }
      if (active) {
        console.log("[Modal] Calling lenis.stop()");
        if (typeof lenisInstance.stop === "function") {
          lenisInstance.stop();
        }
      } else {
        console.log("[Modal] Calling lenis.start()");
        if (typeof lenisInstance.start === "function") {
          lenisInstance.start();
        }
        // Ensure scroll is responsive after unlock
        if (typeof lenisInstance.resize === "function") {
          lenisInstance.resize();
        }
      }
    },
    refresh() {
      if (lenisInstance && typeof lenisInstance.resize === "function") {
        lenisInstance.resize();
      }
    },
  };

  function setupModal(modal) {
    if (!modal || modal.dataset.scriptInitialized === "true") {
      console.log("[Modal] Skipping setupModal - already initialized or no modal");
      return;
    }

    const modalId = modal.getAttribute("data-modal-target") || modal.id;
    if (!modalId) {
      console.warn("[Modal] Missing modal identifier", modal);
      return;
    }

    console.log("[Modal] Setting up modal with id:", modalId);
    modal.dataset.scriptInitialized = "true";

    const lockScroll = modal.hasAttribute("data-modal-lock-scroll");
    console.log("[Modal] lockScroll attribute check:", lockScroll, "modal attributes:", Array.from(modal.attributes).map(a => a.name));
    const transitionDuration =
      Number(modal.dataset.modalDuration || 320) || 320;

    let lastFocusedElement = null;
    let isClosing = false;
    let closeTimer = null;

    function showDialog() {
      if (modal.open) return;
      if (typeof modal.show === "function") {
        modal.show();
      } else {
        modal.setAttribute("open", "true");
      }
      modal.removeAttribute("inert");
    }

    function hideDialog() {
      if (!modal.open) return;
      if (typeof modal.close === "function") {
        modal.close();
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
        console.log("[Modal] Unlocking scroll - removing overflow:hidden");
        lenisHelpers.lock(false);
        // Backup: remove CSS scroll lock
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        console.log("[Modal] After unlock - html overflow:", document.documentElement.style.overflow, "body overflow:", document.body.style.overflow);
      } else {
        lenisHelpers.refresh();
      }

      if (lastFocusedElement) {
        lastFocusedElement.focus({ preventScroll: true });
      }

      window.dispatchEvent(new CustomEvent("amp-modal-close", { detail: { id: modalId, modal } }));
    }

    function openModal() {
      console.log("[Modal] openModal called for:", modalId, "lockScroll:", lockScroll);
      // For divs, modal.open is undefined, so check for the visible class instead
      const isOpen = modal.classList.contains("amp-modal--visible") || modal.open;
      if (isOpen) {
        console.log("[Modal] Modal already open, skipping");
        return;
      }
      isClosing = false;

      lastFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      showDialog();

      window.requestAnimationFrame(() => {
        modal.classList.add("amp-modal--visible");
        console.log("[Modal] Added amp-modal--visible class, classList now:", modal.className);
        const computed = window.getComputedStyle(modal);
        console.log("[Modal] After adding class - computed display:", computed.display, "pointerEvents:", computed.pointerEvents);
      });

      modal
        .querySelectorAll("[data-modal-scroll]")
        .forEach((element) => (element.scrollTop = 0));

      if (lockScroll) {
        console.log("[Modal] Locking scroll - setting overflow:hidden on html and body");
        lenisHelpers.lock(true);
        // Backup: apply CSS scroll lock
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        console.log("[Modal] After lock - html overflow:", document.documentElement.style.overflow, "body overflow:", document.body.style.overflow);
      } else {
        console.log("[Modal] NOT locking scroll (lockScroll is false)");
        lenisHelpers.refresh();
      }

      window.dispatchEvent(new CustomEvent("amp-modal-open", { detail: { id: modalId, modal } }));
    }

    function closeModal() {
      console.log("[Modal] closeModal called for:", modalId, "isClosing:", isClosing, "has visible class:", modal.classList.contains("amp-modal--visible"));
      // For divs, modal.open is undefined, so check for the visible class instead
      const isOpen = modal.classList.contains("amp-modal--visible") || modal.open;
      if (!isOpen || isClosing) {
        console.log("[Modal] Close blocked - isOpen:", isOpen, "isClosing:", isClosing);
        return;
      }
      isClosing = true;

      modal.classList.remove("amp-modal--visible");

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
      if (event.target.closest("[data-modal-close]")) {
        event.preventDefault();
        closeModal();
      }
    });

    console.log("[Modal] Registered modal instance:", modalId);
    modalSystem.instances[modalId] = { open: openModal, close: closeModal, element: modal };
  }

  document.querySelectorAll("[data-amp-modal]").forEach(setupModal);
  console.log("[Modal] Finished setup. Available instances:", Object.keys(modalSystem.instances));

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-modal-trigger]");
    if (!trigger) return;

    const modalId = trigger.getAttribute("data-modal-trigger");
    if (!modalId) return;

    console.log("[Modal] Trigger clicked, attempting to open:", modalId, "Instances:", Object.keys(modalSystem.instances));
    event.preventDefault();
    const result = modalSystem.open(modalId);
    console.log("[Modal] Open result:", result);
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

// Initialize immediately if DOM is ready, or wait for DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModal);
} else {
  initModal();
}
