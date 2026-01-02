const initModal = () => {
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
      if (!lenisInstance) return;
      if (active) {
        if (typeof lenisInstance.stop === "function") {
          lenisInstance.stop();
        }
      } else {
        if (typeof lenisInstance.start === "function") {
          lenisInstance.start();
        }
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
        lenisHelpers.lock(false);
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
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
      const isOpen = modal.classList.contains("amp-modal--visible") || modal.open;
      if (isOpen) return;
      
      isClosing = false;

      lastFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      showDialog();
      modal.classList.add("amp-modal--visible");

      modal.querySelectorAll("[data-modal-scroll]").forEach((element) => (element.scrollTop = 0));

      if (lockScroll) {
        lenisHelpers.lock(true);
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
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
      const isOpen = modal.classList.contains("amp-modal--visible") || modal.open;
      if (!isOpen || isClosing) return;
      
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
      // Close on close button click
      if (event.target.closest("[data-modal-close]")) {
        event.preventDefault();
        closeModal();
        return;
      }

      // Close on backdrop click (clicking on the modal container itself, not content)
      if (event.target === modal) {
        event.preventDefault();
        closeModal();
        return;
      }
    });

    modalSystem.instances[modalId] = { open: openModal, close: closeModal, element: modal };
  }

  document.querySelectorAll("[data-amp-modal]").forEach(setupModal);

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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModal);
} else {
  initModal();
}
