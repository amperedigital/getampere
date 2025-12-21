(() => {
  const SELECTOR = "[data-hero-slider]";
  const LOG_PREFIX = "[HeroSlider]";

  const log = (...args) => console.log(LOG_PREFIX, ...args);

  const ready = (cb) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb, { once: true });
    } else {
      cb();
    }
  };

  const initSlider = (slider) => {
    if (!slider) return;

    const dataset = slider.dataset || {};
    const autoDelay = Number(dataset.autoDelay) || 5000;
    const autoDuration = Number(dataset.autoDuration) || 1800;
    const resumeDelay = Number(dataset.resumeDelay) || 5000;
    const retryDelay = Number(dataset.retryDelay) || 500;
    const momentumFriction = Math.min(
      Math.max(Number(dataset.momentumFriction) || 0.985, 0.8),
      0.999
    );
    const momentumStep = Number(dataset.momentumStep) || 12;

    const state = {
      pointerActive: false,
      lastX: 0,
      lastTime: 0,
      velocity: 0,
      isHover: false,
      autoTimer: null,
      resumeTimer: null,
      animFrame: null,
      momentumFrame: null
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const getStepDistance = () => {
      const children = slider.children;
      if (!children || children.length === 0) {
        return slider.clientWidth || 0;
      }
      let referenceWidth = children[0].getBoundingClientRect().width;
      let offsetDistance = 0;
      for (let i = 1; i < children.length; i += 1) {
        const delta =
          Math.abs(children[i].offsetLeft - children[0].offsetLeft) || 0;
        if (delta > 0) {
          offsetDistance = delta;
          break;
        }
      }
      return offsetDistance || referenceWidth || slider.clientWidth || 0;
    };

    const stopAuto = () => {
      if (state.autoTimer) {
        window.clearTimeout(state.autoTimer);
        state.autoTimer = null;
      }
      if (state.animFrame) {
        window.cancelAnimationFrame(state.animFrame);
        state.animFrame = null;
      }
    };

    const scheduleAuto = (delay = autoDelay) => {
      stopAuto();
      if (slider.scrollWidth <= slider.clientWidth + 4) {
        log("Auto disabled (insufficient overflow).");
        return;
      }
      state.autoTimer = window.setTimeout(runAuto, delay);
    };

    const pauseAuto = () => {
      stopAuto();
      if (state.resumeTimer) {
        window.clearTimeout(state.resumeTimer);
        state.resumeTimer = null;
      }
    };

    const animateScrollTo = (target) => {
      stopAuto();
      const start = slider.scrollLeft;
      const distance = target - start;
      const duration = autoDuration;
      let startTime = null;
      const ease = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (timestamp) => {
        if (startTime === null) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = clamp(elapsed / duration, 0, 1);
        slider.scrollLeft = start + distance * ease(progress);
        if (progress < 1) {
          state.animFrame = window.requestAnimationFrame(step);
        } else {
          scheduleAuto(autoDelay);
        }
      };

      state.animFrame = window.requestAnimationFrame(step);
    };

    const alignToNearestStep = () => {
      const stepDistance = getStepDistance();
      if (!stepDistance) return false;
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      const current = slider.scrollLeft;
      const target = clamp(
        Math.round(current / stepDistance) * stepDistance,
        0,
        maxScroll
      );
      if (Math.abs(target - current) < 1) {
        return false;
      }
      log("Align to nearest slide →", target);
      animateScrollTo(target);
      return true;
    };

    const resumeAutoDelayed = (delay = resumeDelay) => {
      if (state.resumeTimer) {
        window.clearTimeout(state.resumeTimer);
      }
      state.resumeTimer = window.setTimeout(() => {
        if (!state.pointerActive && !state.isHover) {
          const aligned = alignToNearestStep();
          if (!aligned) {
            scheduleAuto();
          }
        }
      }, delay);
    };

    const runAuto = () => {
      if (state.pointerActive || state.isHover) {
        log("Auto paused (interaction). Retrying in", retryDelay, "ms");
        scheduleAuto(retryDelay);
        return;
      }
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      const next = slider.scrollLeft + getStepDistance();
      const target = next >= maxScroll - 1 ? 0 : clamp(next, 0, maxScroll);
      log("Auto advance →", target);
      animateScrollTo(target);
    };

    const cancelMomentum = () => {
      if (state.momentumFrame) {
        window.cancelAnimationFrame(state.momentumFrame);
        state.momentumFrame = null;
      }
    };

    const startMomentum = () => {
      cancelMomentum();
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      if (!isFinite(state.velocity) || Math.abs(state.velocity) < 0.001) {
        resumeAutoDelayed();
        return;
      }
      let velocity = state.velocity * (1000 / 60) * momentumStep;

      const momentumStepFrame = () => {
        slider.scrollLeft = clamp(slider.scrollLeft - velocity, 0, maxScroll);
        velocity *= momentumFriction;
        if (Math.abs(velocity) > 0.3) {
          state.momentumFrame = window.requestAnimationFrame(momentumStepFrame);
        } else {
          cancelMomentum();
          resumeAutoDelayed();
        }
      };

      state.momentumFrame = window.requestAnimationFrame(momentumStepFrame);
    };

    const handlePointerDown = (event) => {
      if (!event.isPrimary) return;
      state.pointerActive = true;
      slider.classList.add("is-dragging");
      slider.setPointerCapture(event.pointerId);
      state.lastX = event.clientX;
      state.lastTime = event.timeStamp;
      state.velocity = 0;
      pauseAuto();
      cancelMomentum();
    };

    const handlePointerMove = (event) => {
      if (!state.pointerActive) return;
      event.preventDefault();
      const deltaX = event.clientX - state.lastX;
      slider.scrollLeft -= deltaX;
      const deltaTime = event.timeStamp - state.lastTime || 16;
      state.velocity = deltaX / deltaTime;
      state.lastX = event.clientX;
      state.lastTime = event.timeStamp;
    };

    const handlePointerUp = (event) => {
      if (!state.pointerActive) return;
      state.pointerActive = false;
      slider.classList.remove("is-dragging");
      slider.releasePointerCapture(event.pointerId);
      startMomentum();
    };

    const handlePointerCancel = (event) => {
      if (!state.pointerActive) return;
      state.pointerActive = false;
      slider.classList.remove("is-dragging");
      slider.releasePointerCapture(event.pointerId);
      resumeAutoDelayed();
    };

    const handleMouseEnter = () => {
      state.isHover = true;
      pauseAuto();
    };

    const handleMouseLeave = () => {
      state.isHover = false;
      resumeAutoDelayed();
    };

    slider.addEventListener("pointerdown", handlePointerDown);
    slider.addEventListener("pointermove", handlePointerMove);
    slider.addEventListener("pointerup", handlePointerUp);
    slider.addEventListener("pointercancel", handlePointerCancel);
    slider.addEventListener("mouseenter", handleMouseEnter);
    slider.addEventListener("mouseleave", handleMouseLeave);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pauseAuto();
      } else {
        resumeAutoDelayed(retryDelay);
      }
    });

    window.addEventListener(
      "blur",
      () => {
        pauseAuto();
      },
      { passive: true }
    );

    window.addEventListener(
      "focus",
      () => {
        resumeAutoDelayed(retryDelay);
      },
      { passive: true }
    );

    log("Initialized slider", slider.id ? `#${slider.id}` : slider);
    scheduleAuto(autoDelay);
  };

  ready(() => {
    const sliders = document.querySelectorAll(SELECTOR);
    if (!sliders.length) {
      log("No slider instances found.");
      return;
    }
    sliders.forEach(initSlider);
  });
})();
