import { updateSocketPath } from './glass-socket.js';

// V-Amp 2.0 Card Expander Logic
// Zen Mode Expansion - Column Constrained + Persistent Button + Interactable
// v2.897: Optimized for stability (no layout shift) and snappiness (0.4s)

// Icons
const ICON_EXPAND = `<path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />`;
const ICON_COLLAPSE = `<path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M10 21l-7-7" />`; // Approximate inward or just use X
const ICON_CLOSE = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`;

export function initCardExpander() {
    const track = document.getElementById('tech-demo-card-track');
    const cards = document.querySelectorAll('.socket-card-container');

    if (!track || !cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Allow clicks on our expand button
            if (e.target.closest('a, button') && !e.target.closest('.expand-trigger')) return;

            if (card.classList.contains('is-expanded')) {
                collapseCard(card);
            } else {
                expandCard(card);
            }
        });
    });
}

/**
 * Synchronized Redraw (v2.897)
 * Loops updateSocketPath during the transition period (roughly 500ms)
 * to ensure Bezier curves stay attached to the changing dimensions.
 */
function startSyncRedraw(card, duration = 500) {
    const start = performance.now();
    const loop = (now) => {
        const elapsed = now - start;
        updateSocketPath(card);
        if (elapsed < duration) {
            requestAnimationFrame(loop);
        }
    };
    requestAnimationFrame(loop);
}

function expandCard(card) {
    if (window.innerWidth < 1024) return;

    const container = document.getElementById('tech-demo-right-column');
    if (!container) return;

    // 1. Measure BEFORE moving
    const startRect = card.getBoundingClientRect();

    // 2. Create Placeholder (v2.897: Added h-full and flex-shrink-0 for stability)
    const placeholder = document.createElement('div');
    placeholder.style.width = startRect.width + 'px';
    placeholder.style.height = startRect.height + 'px';
    placeholder.className = 'socket-card-placeholder flex-shrink-0 snap-start h-full';
    card.parentNode.insertBefore(placeholder, card);
    card._placeholder = placeholder;

    // 3. Move to Body (Escape Trap)
    document.body.appendChild(card);

    // 4. Set Initial Position (Fixed at Start)
    // v2.897: Applied will-change pre-transition for GPU prep
    card.style.setProperty('position', 'fixed', 'important');
    card.style.setProperty('top', startRect.top + 'px', 'important');
    card.style.setProperty('left', startRect.left + 'px', 'important');
    card.style.setProperty('width', startRect.width + 'px', 'important');
    card.style.setProperty('height', startRect.height + 'px', 'important');
    card.style.setProperty('will-change', 'top, left, width, height', 'important');
    card.style.zIndex = '9999';
    card.style.margin = '0';

    // Force Layout
    void card.offsetWidth;

    // 5. Calculate Target (Container CONTENT Box)
    const containerRect = container.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(container);

    const pLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const pRight = parseFloat(computedStyle.paddingRight) || 0;
    const pTop = parseFloat(computedStyle.paddingTop) || 0;
    const pBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const bLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const bTop = parseFloat(computedStyle.borderTopWidth) || 0;

    // Constrain to the padding box (visual content area)
    const targetLeft = containerRect.left + bLeft + pLeft;
    const targetTop = containerRect.top + bTop + pTop;
    const targetWidth = container.clientWidth - pLeft - pRight;
    const targetHeight = container.clientHeight - pTop - pBottom;

    // 6. Animate expansion
    card.classList.add('is-expanded');
    // v2.897: Reduced to 0.4s for increased snappiness
    card.style.transition = 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1)';

    // v2.897: Trigger rAF Redraw synchronized with style change frame
    requestAnimationFrame(() => {
        startSyncRedraw(card, 500);
        card.style.setProperty('top', targetTop + 'px', 'important');
        card.style.setProperty('left', targetLeft + 'px', 'important');
        card.style.setProperty('width', targetWidth + 'px', 'important');
        card.style.setProperty('height', targetHeight + 'px', 'important');
        card.style.removeProperty('border-radius');
    });

    // 7. Swap Icon & Ensure Visibility
    const btn = card.querySelector('.expand-trigger');
    if (btn) {
        btn.style.opacity = '1';
        btn.style.display = 'flex';
        btn.style.pointerEvents = 'auto';

        // Find SVG and swap path
        const svg = btn.querySelector('svg');
        if (svg) {
            if (!btn.dataset.originalIcon) {
                btn.dataset.originalIcon = svg.innerHTML;
            }
            svg.innerHTML = ICON_CLOSE;
        }
    }
}

function collapseCard(card) {
    const placeholder = card._placeholder;
    if (!placeholder) {
        card.classList.remove('is-expanded');
        return;
    }

    const endRect = placeholder.getBoundingClientRect();

    // v2.897: Ensure will-change is ready for collapse
    card.style.setProperty('will-change', 'top, left, width, height', 'important');

    // Animate Back
    card.style.setProperty('top', endRect.top + 'px', 'important');
    card.style.setProperty('left', endRect.left + 'px', 'important');
    card.style.setProperty('width', endRect.width + 'px', 'important');
    card.style.setProperty('height', endRect.height + 'px', 'important');
    card.classList.remove('is-expanded');

    // Trigger Synchronized SVG Redraw
    startSyncRedraw(card, 500);

    // Restore Icon
    const btn = card.querySelector('.expand-trigger');
    if (btn && btn.dataset.originalIcon) {
        const svg = btn.querySelector('svg');
        if (svg) svg.innerHTML = btn.dataset.originalIcon;
        btn.style.opacity = '';
        btn.style.display = '';
        btn.style.pointerEvents = '';
    }

    const cleanup = () => {
        if (card.classList.contains('is-expanded')) return;

        // Reset Styles
        card.style.cssText = '';

        // Return to DOM
        if (placeholder.parentNode) {
            placeholder.parentNode.insertBefore(card, placeholder);
            placeholder.remove();
        }
        card._placeholder = null;
        card.removeEventListener('transitionend', cleanup);
    };

    card.addEventListener('transitionend', cleanup, { once: true });
}
