(function () {
  const initHeroPanel = () => {
    const panel = document.querySelector('[data-ai-panel]');
    if (!panel) return;

    const heroShowcase = document.getElementById('hero-showcase');
    const openButtons = document.querySelectorAll('[data-show-ai-panel]');
    const closeButtons = document.querySelectorAll('[data-hide-ai-panel]');

    const togglePanel = (open) => {
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      panel.classList.toggle('opacity-100', open);
      panel.classList.toggle('opacity-0', !open);
      panel.classList.toggle('translate-y-0', open);
      panel.classList.toggle('translate-y-4', !open);
      panel.classList.toggle('scale-100', open);
      panel.classList.toggle('scale-[0.98]', !open);
      panel.classList.toggle('pointer-events-auto', open);
      panel.classList.toggle('pointer-events-none', !open);
      heroShowcase?.classList.toggle('ai-panel-open', open);
      openButtons.forEach((btn) => btn.classList.toggle('hidden', open));
      closeButtons.forEach((btn) => btn.classList.toggle('hidden', !open));
    };

    openButtons.forEach((btn) =>
      btn.addEventListener('click', () => togglePanel(true))
    );
    closeButtons.forEach((btn) =>
      btn.addEventListener('click', () => togglePanel(false))
    );

    togglePanel(false);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroPanel, { once: true });
  } else {
    initHeroPanel();
  }
})();
