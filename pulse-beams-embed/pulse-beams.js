(function () {
  const defaultBeams = [
    {
      path: 'M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5',
      gradientConfig: {
        initial: { x1: '0%', x2: '0%', y1: '80%', y2: '100%' },
        animate: {
          x1: ['0%', '0%', '200%'],
          x2: ['0%', '0%', '180%'],
          y1: ['80%', '0%', '0%'],
          y2: ['100%', '20%', '20%']
        },
        transition: { duration: 4 }
      },
      connectionPoints: [
        { cx: 6.5, cy: 398.5, r: 6 },
        { cx: 269, cy: 220.5, r: 6 }
      ]
    },
    {
      path: 'M568 200H841C846.523 200 851 195.523 851 190V40',
      gradientConfig: {
        initial: { x1: '0%', x2: '0%', y1: '80%', y2: '100%' },
        animate: {
          x1: ['20%', '100%', '100%'],
          x2: ['0%', '90%', '90%'],
          y1: ['80%', '80%', '-20%'],
          y2: ['100%', '100%', '0%']
        },
        transition: { duration: 4 }
      },
      connectionPoints: [
        { cx: 851, cy: 34, r: 6.5 },
        { cx: 568, cy: 200, r: 6 }
      ]
    },
    {
      path: 'M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5',
      gradientConfig: {
        initial: { x1: '0%', x2: '0%', y1: '80%', y2: '100%' },
        animate: {
          x1: ['20%', '100%', '100%'],
          x2: ['0%', '90%', '90%'],
          y1: ['80%', '80%', '-20%'],
          y2: ['100%', '100%', '0%']
        },
        transition: { duration: 4 }
      },
      connectionPoints: [
        { cx: 142, cy: 427, r: 6.5 },
        { cx: 425.5, cy: 274, r: 6 }
      ]
    },
    {
      path: 'M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427',
      gradientConfig: {
        initial: { x1: '40%', x2: '50%', y1: '160%', y2: '180%' },
        animate: {
          x1: ['40%', '0%', '10%'],
          x2: ['50%', '0%', '10%'],
          y1: ['160%', '-40%', '-40%'],
          y2: ['180%', '-20%', '-20%']
        },
        transition: { duration: 4 }
      },
      connectionPoints: [
        { cx: 770, cy: 427, r: 6.5 },
        { cx: 493, cy: 274, r: 6 }
      ]
    },
    {
      path: 'M380 168V17C380 11.4772 384.477 7 390 7H414',
      gradientConfig: {
        initial: { x1: '-40%', x2: '-10%', y1: '0%', y2: '20%' },
        animate: {
          x1: ['40%', '0%', '0%'],
          x2: ['10%', '0%', '0%'],
          y1: ['0%', '0%', '180%'],
          y2: ['20%', '20%', '200%']
        },
        transition: { duration: 4 }
      },
      connectionPoints: [
        { cx: 420.5, cy: 6.5, r: 6 },
        { cx: 380, cy: 168, r: 6 }
      ]
    }
  ];

  const defaults = {
    width: 858,
    height: 434,
    buttonLabel: 'Demo AI',
    buttonHref: '',
    newTab: false,
    badgeText: 'Live Demo',
    baseColor: '#1e293b',
    accentColor: '#475569',
    gradientColors: {
      start: '#18CCFC',
      middle: '#6344F5',
      end: '#AE48FF'
    },
    beams: defaultBeams
  };

  let instanceCount = 0;

  function toValuesString(value) {
    if (Array.isArray(value)) {
      return value.join(';');
    }
    return value;
  }

  function buildGradient(beam, idx, idBase, colors) {
    const animation = beam.gradientConfig?.animate || {};
    const initial = beam.gradientConfig?.initial || {};
    const duration = (beam.gradientConfig?.transition?.duration || 4) + 's';
    const animateTags = Object.entries(animation)
      .map(([key, val]) =>
        `<animate attributeName="${key}" values="${toValuesString(val)}" dur="${duration}" repeatCount="indefinite"></animate>`
      )
      .join('');

    return `
      <linearGradient id="${idBase}-grad-${idx}" gradientUnits="userSpaceOnUse" x1="${initial.x1 || '0%'}" y1="${initial.y1 || '0%'}" x2="${initial.x2 || '0%'}" y2="${initial.y2 || '0%'}">
        <stop offset="0%" stop-color="${colors.start}" stop-opacity="0"></stop>
        <stop offset="20%" stop-color="${colors.start}" stop-opacity="1"></stop>
        <stop offset="50%" stop-color="${colors.middle}" stop-opacity="1"></stop>
        <stop offset="100%" stop-color="${colors.end}" stop-opacity="0"></stop>
        ${animateTags}
      </linearGradient>
    `;
  }

  function buildSvgMarkup(config, idBase) {
    const defs = config.beams
      .map((beam, idx) => buildGradient(beam, idx, idBase, config.gradientColors))
      .join('');

    const body = config.beams
      .map((beam, idx) => {
        const gradientId = `${idBase}-grad-${idx}`;
        const basePath = `<path d="${beam.path}" stroke="${config.baseColor}" stroke-width="1"></path>`;
        const accentPath = `<path d="${beam.path}" stroke="url(#${gradientId})" stroke-width="2" stroke-linecap="round"></path>`;
        const points = (beam.connectionPoints || [])
          .map((point) =>
            `<circle cx="${point.cx}" cy="${point.cy}" r="${point.r}" fill="${config.baseColor}" stroke="${config.accentColor}"></circle>`
          )
          .join('');
        return `${basePath}${accentPath}${points}`;
      })
      .join('');

    return `
      <svg width="${config.width}" height="${config.height}" viewBox="0 0 ${config.width} ${config.height}" fill="none" xmlns="http://www.w3.org/2000/svg" class="pulse-beams__svg">
        <defs>${defs}</defs>
        ${body}
      </svg>
    `;
  }

  function parseDatasetOptions(node) {
    const dataset = node.dataset || {};
    const gradientColors = {};
    if (dataset.gradientStart) gradientColors.start = dataset.gradientStart;
    if (dataset.gradientMiddle) gradientColors.middle = dataset.gradientMiddle;
    if (dataset.gradientEnd) gradientColors.end = dataset.gradientEnd;

    return {
      buttonLabel: dataset.buttonLabel,
      buttonHref: dataset.buttonHref,
      newTab: dataset.buttonNewTab === 'true',
      badgeText: dataset.badgeText,
      width: dataset.width ? Number(dataset.width) : undefined,
      height: dataset.height ? Number(dataset.height) : undefined,
      gradientColors: Object.keys(gradientColors).length ? gradientColors : undefined
    };
  }

  class PulseBeamsEmbed {
    constructor(node, options = {}) {
      if (!node) return;
      this.node = node;
      const datasetOptions = parseDatasetOptions(node);
      const mergedGradient = {
        ...defaults.gradientColors,
        ...(options.gradientColors || {}),
        ...(datasetOptions.gradientColors || {})
      };

      const merged = {
        ...defaults,
        ...options,
        ...Object.fromEntries(Object.entries(datasetOptions).filter(([, value]) => value !== undefined && value !== ''))
      };
      merged.gradientColors = mergedGradient;
      this.options = merged;
      this.render();
    }

    render() {
      const idBase = `pulse-beams-${++instanceCount}`;
      this.node.innerHTML = '';
      this.node.classList.add('pulse-beams');

      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'pulse-beams__canvas';
      canvasWrapper.innerHTML = buildSvgMarkup(this.options, idBase);

      const slot = document.createElement('div');
      slot.className = 'pulse-beams__slot';

      const stack = document.createElement('div');
      stack.className = 'pulse-beams__stack';

      if (this.options.badgeText) {
        const badge = document.createElement('span');
        badge.className = 'pulse-beams__badge';
        badge.textContent = this.options.badgeText;
        stack.appendChild(badge);
      }

      const button = document.createElement(this.options.buttonHref ? 'a' : 'button');
      button.className = 'pulse-beams__button';
      if (this.options.buttonHref) {
        button.href = this.options.buttonHref;
        if (this.options.newTab) {
          button.target = '_blank';
          button.rel = 'noreferrer noopener';
        }
        button.setAttribute('role', 'button');
      } else {
        button.type = 'button';
      }

      const inner = document.createElement('div');
      inner.className = 'pulse-beams__button-inner';
      const label = document.createElement('span');
      label.className = 'pulse-beams__button-label';
      label.textContent = this.options.buttonLabel;
      inner.appendChild(label);
      button.appendChild(inner);
      stack.appendChild(button);

      slot.appendChild(stack);
      this.node.appendChild(canvasWrapper);
      this.node.appendChild(slot);
    }
  }

  function autoInit() {
    document.querySelectorAll('[data-pulse-beams]').forEach((node) => {
      if (!node.__pulseBeamsInstance) {
        node.__pulseBeamsInstance = new PulseBeamsEmbed(node);
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.PulseBeamsEmbed = {
      mount(target, options) {
        if (typeof target === 'string') {
          document.querySelectorAll(target).forEach((node) => new PulseBeamsEmbed(node, options));
        } else if (target instanceof Element) {
          return new PulseBeamsEmbed(target, options);
        }
        return null;
      },
      defaults
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      autoInit();
    }
  }
})();
