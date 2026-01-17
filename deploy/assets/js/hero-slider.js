(() => {
  const SELECTOR = "[data-hero-slider]";
  const LOG_PREFIX = "[HeroSlider]";
  const MOBILE_BREAKPOINT = 768; // px

  const log = (...args) => console.log(LOG_PREFIX, ...args);

  class HeroSlider {
    constructor(el) {
      this.slider = el;
      this.dataset = el.dataset || {};
      this.initialized = false;
      
      // Configuration
      this.config = {
        autoDelay: Number(this.dataset.autoDelay) || 5000,
        autoDuration: Number(this.dataset.autoDuration) || 1800,
        resumeDelay: Number(this.dataset.resumeDelay) || 5000,
        retryDelay: Number(this.dataset.retryDelay) || 500,
        momentumFriction: Math.min(Math.max(Number(this.dataset.momentumFriction) || 0.985, 0.8), 0.999),
        momentumStep: Number(this.dataset.momentumStep) || 12
      };

      // State
      this.state = {
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

      // Bindings
      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
      this.handlePointerCancel = this.handlePointerCancel.bind(this);
      this.handleMouseEnter = this.handleMouseEnter.bind(this);
      this.handleMouseLeave = this.handleMouseLeave.bind(this);
      this.handleVisibility = this.handleVisibility.bind(this);
      this.handleBlur = this.handleBlur.bind(this);
      this.handleFocus = this.handleFocus.bind(this);

      // Animation Step Bindings
      this.step = this.step.bind(this);
    }

    // --- Lifecycle ---

    init() {
      if (this.initialized) return;
      
      // Add Listeners
      this.slider.addEventListener("pointerdown", this.handlePointerDown);
      this.slider.addEventListener("pointermove", this.handlePointerMove);
      this.slider.addEventListener("pointerup", this.handlePointerUp);
      this.slider.addEventListener("pointercancel", this.handlePointerCancel);
      this.slider.addEventListener("mouseenter", this.handleMouseEnter);
      this.slider.addEventListener("mouseleave", this.handleMouseLeave);
      document.addEventListener("visibilitychange", this.handleVisibility);
      window.addEventListener("blur", this.handleBlur, { passive: true });
      window.addEventListener("focus", this.handleFocus, { passive: true });

      // Enforce touch-action for desktop dragging
      this.slider.style.touchAction = "pan-y";

      log("Initialized (Desktop Mode)", this.slider.id ? `#${this.slider.id}` : "");
      this.scheduleAuto(this.config.autoDelay);
      this.initialized = true;
    }

    destroy() {
      if (!this.initialized) return;

      // Clean up timers & frames
      this.stopAuto();
      this.cancelMomentum();
      if (this.state.resumeTimer) clearTimeout(this.state.resumeTimer);

      // Remove Listeners
      this.slider.removeEventListener("pointerdown", this.handlePointerDown);
      this.slider.removeEventListener("pointermove", this.handlePointerMove);
      this.slider.removeEventListener("pointerup", this.handlePointerUp);
      this.slider.removeEventListener("pointercancel", this.handlePointerCancel);
      this.slider.removeEventListener("mouseenter", this.handleMouseEnter);
      this.slider.removeEventListener("mouseleave", this.handleMouseLeave);
      document.removeEventListener("visibilitychange", this.handleVisibility);
      window.removeEventListener("blur", this.handleBlur);
      window.removeEventListener("focus", this.handleFocus);

      // Clean up styles/classes if any were stuck
      this.slider.classList.remove("is-dragging");
      this.slider.style.touchAction = "";

      log("Destroyed (Mobile Mode)", this.slider.id ? `#${this.slider.id}` : "");
      this.initialized = false;
    }

    // --- Helpers ---
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    getStepDistance() {
      const children = this.slider.children;
      if (!children || children.length === 0) {
        return this.slider.clientWidth || 0;
      }
      // Assuming cards are spaced evenly, find the diff between first and second
      let referenceWidth = children[0].getBoundingClientRect().width;
      let offsetDistance = 0;
      for (let i = 1; i < children.length; i += 1) {
        const delta = Math.abs(children[i].offsetLeft - children[0].offsetLeft) || 0;
        if (delta > 0) {
          offsetDistance = delta;
          break;
        }
      }
      return offsetDistance || referenceWidth || this.slider.clientWidth || 0;
    }

    getScrollPadding() {
      const style = window.getComputedStyle(this.slider);
      return parseInt(style.scrollPaddingLeft || "0", 10) || 0;
    }

    // --- Animation Logic ---

    stopAuto() {
      if (this.state.autoTimer) {
        window.clearTimeout(this.state.autoTimer);
        this.state.autoTimer = null;
      }
      if (this.state.animFrame) {
        window.cancelAnimationFrame(this.state.animFrame);
        this.state.animFrame = null;
      }
    }

    scheduleAuto(delay = this.config.autoDelay) {
      this.stopAuto();
      // Don't auto-scroll if content fits within container
      if (this.slider.scrollWidth <= this.slider.clientWidth + 4) {
        return;
      }
      this.state.autoTimer = window.setTimeout(() => this.runAuto(), delay);
    }

    pauseAuto() {
      this.stopAuto();
      if (this.state.resumeTimer) {
        window.clearTimeout(this.state.resumeTimer);
        this.state.resumeTimer = null;
      }
    }

    runAuto() {
      if (this.state.pointerActive || this.state.isHover) {
        // Retry later
        this.scheduleAuto(this.config.retryDelay);
        return;
      }
      const maxScroll = this.slider.scrollWidth - this.slider.clientWidth;
      
      const step = this.getStepDistance();
      const padding = this.getScrollPadding(); 
      const current = this.slider.scrollLeft;
      
      // Determine current index based on centerpoint or left edge?
      // Using left edge is safer for exact snap alignment
      const currentIndex = Math.round(current / step);
      const nextIndex = currentIndex + 1;
      
      // Target the exact start of the next card (ignoring padding offset to align with text)
      // If user wants scroll-padding to be effective, they would rely on CSS snap. 
      // JavaScript scrollLeft=0 puts element at edge.
      let target = (nextIndex * step);
      
      // Wrap around logic
      if (target >= maxScroll + 5) { // tolerance
        target = 0;
      } else {
        target = this.clamp(target, 0, maxScroll);
      }
      
      this.animateScrollTo(target);
    }

    animateScrollTo(target) {
      this.stopAuto();
      
      const start = this.slider.scrollLeft;
      const distance = target - start;
      const duration = this.config.autoDuration;
      let startTime = null;
      
      // Easing: easeInOutCubic/similar
      const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // define step function for RAF
      this.animationContext = { start, distance, duration, startTime, ease, target };
      this.state.animFrame = window.requestAnimationFrame(this.step);
    }

    step(timestamp) {
      const ctx = this.animationContext;
      if (!ctx) return;
      
      if (ctx.startTime === null) ctx.startTime = timestamp;
      const elapsed = timestamp - ctx.startTime;
      const progress = this.clamp(elapsed / ctx.duration, 0, 1);
      
      this.slider.scrollLeft = ctx.start + ctx.distance * ctx.ease(progress);

      if (progress < 1) {
        this.state.animFrame = window.requestAnimationFrame(this.step);
      } else {
        // Animation complete
        this.slider.scrollLeft = ctx.target; // Snap to exact
        this.scheduleAuto(this.config.autoDelay);
      }
    }

    alignToNearestStep() {
      const stepDistance = this.getStepDistance();
      if (!stepDistance) return false;

      const maxScroll = this.slider.scrollWidth - this.slider.clientWidth;
      const current = this.slider.scrollLeft;

      // Find nearest logical index
      const bestIndex = Math.round(current / stepDistance);
      let target = (bestIndex * stepDistance);
      
      target = this.clamp(target, 0, maxScroll);

      if (Math.abs(target - current) < 1) {
        return false;
      }
      this.animateScrollTo(target);
      return true;
    }

    resumeAutoDelayed(delay = this.config.resumeDelay) {
      if (this.state.resumeTimer) {
        window.clearTimeout(this.state.resumeTimer);
      }
      this.state.resumeTimer = window.setTimeout(() => {
        if (!this.state.pointerActive && !this.state.isHover) {
          const aligned = this.alignToNearestStep();
          if (!aligned) {
            this.scheduleAuto();
          }
        }
      }, delay);
    }

    // --- Momentum ---

    cancelMomentum() {
      if (this.state.momentumFrame) {
        window.cancelAnimationFrame(this.state.momentumFrame);
        this.state.momentumFrame = null;
      }
    }

    startMomentum() {
      this.cancelMomentum();
      const maxScroll = this.slider.scrollWidth - this.slider.clientWidth;
      
      if (!isFinite(this.state.velocity) || Math.abs(this.state.velocity) < 0.001) {
        this.resumeAutoDelayed();
        return;
      }

      // Convert px/ms to starting velocity per frame approx
      let velocity = this.state.velocity * (1000 / 60) * this.config.momentumStep;

      const loop = () => {
        this.slider.scrollLeft = this.clamp(this.slider.scrollLeft - velocity, 0, maxScroll);
        velocity *= this.config.momentumFriction;
        
        if (Math.abs(velocity) > 0.3) {
          this.state.momentumFrame = window.requestAnimationFrame(loop);
        } else {
          this.cancelMomentum();
          this.resumeAutoDelayed();
        }
      };

      this.state.momentumFrame = window.requestAnimationFrame(loop);
    }

    // --- Events ---

    handlePointerDown(event) {
      if (!event.isPrimary) return;
      this.state.pointerActive = true;
      this.slider.classList.add("is-dragging");
      this.slider.setPointerCapture(event.pointerId);
      this.state.lastX = event.clientX;
      this.state.lastTime = event.timeStamp;
      this.state.velocity = 0;
      this.pauseAuto();
      this.cancelMomentum();
    }

    handlePointerMove(event) {
      if (!this.state.pointerActive) return;
      event.preventDefault();
      const deltaX = event.clientX - this.state.lastX;
      this.slider.scrollLeft -= deltaX;
      const deltaTime = event.timeStamp - this.state.lastTime || 16;
      this.state.velocity = deltaX / deltaTime;
      this.state.lastX = event.clientX;
      this.state.lastTime = event.timeStamp;
    }

    handlePointerUp(event) {
      if (!this.state.pointerActive) return;
      this.state.pointerActive = false;
      this.slider.classList.remove("is-dragging");
      this.slider.releasePointerCapture(event.pointerId);
      this.startMomentum();
    }

    handlePointerCancel(event) {
      if (!this.state.pointerActive) return;
      this.state.pointerActive = false;
      this.slider.classList.remove("is-dragging");
      this.slider.releasePointerCapture(event.pointerId);
      this.resumeAutoDelayed();
    }

    handleMouseEnter() {
      this.state.isHover = true;
      this.pauseAuto();
    }

    handleMouseLeave() {
      this.state.isHover = false;
      this.resumeAutoDelayed();
    }

    handleVisibility() {
      if (document.hidden) {
        this.pauseAuto();
      } else {
        this.resumeAutoDelayed(this.config.retryDelay);
      }
    }

    handleBlur() {
      this.pauseAuto();
    }

    handleFocus() {
      this.resumeAutoDelayed(this.config.retryDelay);
    }
  }

  // --- Global Initialization ---

  const instances = [];

  const checkResponsive = () => {
    // If width < 768px, destroy (Mobile Guard)
    // Else init
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    instances.forEach(instance => {      // Update config with user overrides if needed
      // Force a shorter resume delay for snappier feel
      if (!instance.dataset.resumeDelay) {
        instance.config.resumeDelay = 2500;
      }
            if (isMobile) {
        instance.destroy();
      } else {
        instance.init();
      }
    });
  };

  const ready = (cb) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb, { once: true });
    } else {
      cb();
    }
  };

  ready(() => {
    const elements = document.querySelectorAll(SELECTOR);
    if (!elements.length) {
      log("No slider instances found.");
      return;
    }

    elements.forEach(el => {
      instances.push(new HeroSlider(el));
    });

    // Run initial check
    checkResponsive();

    // Resize Listener
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkResponsive, 250);
    });
  });

})();
