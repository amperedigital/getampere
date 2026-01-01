document.addEventListener("DOMContentLoaded", () => {
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
      const method = active ? lenisInstance.stop : lenisInstance.start;
      if (typeof method === "function") {
        method.call(lenisInstance);
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
    if (!modalId) {
      console.warn("[AmpModal] Missing modal identifier", modal);
      return;
    }

    modal.dataset.scriptInitialized = "true";

    const lockScroll = modal.hasAttribute("data-modal-lock-scroll");
    const transitionDuration =
      Number(modal.dataset.modalDuration || 320) || 320;

    let lastFocusedElement = null;
    let isClosing = false;
    let closeTimer = null;

    function showDialog() {
      if (modal.hasAttribute('open')) return;
      if (typeof modal.show === "function") {
        modal.show();
      } else {
        modal.setAttribute("open", "true");
      }
    }

    function hideDialog() {
      if (!modal.hasAttribute('open')) return;
      if (typeof modal.close === "function") {
        modal.close();
      } else {
        modal.removeAttribute("open");
      }
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

      window.dispatchEvent(new CustomEvent("amp-modal-close", { detail: { id: modalId, modal } }));
    }

    function openModal() {
      if (modal.hasAttribute('open')) return;
      isClosing = false;

      lastFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      showDialog();

      window.requestAnimationFrame(() => {
        modal.classList.add("amp-modal--visible");
      });

      modal
        .querySelectorAll("[data-modal-scroll]")
        .forEach((element) => (element.scrollTop = 0));

      if (lockScroll) {
        lenisHelpers.lock(true);
      } else {
        lenisHelpers.refresh();
      }

      window.dispatchEvent(new CustomEvent("amp-modal-open", { detail: { id: modalId, modal } }));
    }

    function closeModal() {
      if (!modal.hasAttribute('open') || isClosing) return;
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
});
