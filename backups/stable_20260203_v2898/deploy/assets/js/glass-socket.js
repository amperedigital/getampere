// Ampere Glass Socket Generator (v1.5 Fixed)
// Generates the path for the "Socket" cutout on cards.
// v2.321: Restored original Bezier geometry values from tech-demo.html (v15.2)
// v2.896: Added synchronization hooks for card expansion.

export function updateSocketPath(container, options = {}) {
    if (!container) return;

    // Find the svg path in this container
    const path = container.querySelector('.socket-path');
    if (!path) return;

    // NEW: Find bg to sync clip-path (v2.483)
    const bg = container.querySelector('.socket-background');

    const w = container.clientWidth || 300;
    const h = container.clientHeight || 150;

    // Original Geometry Constants (Scale Factor 0.5)
    const S = 0.5;

    // Bezier Control Points
    const c_cp1_x = 33.11 * S; const c_cp1_y = 0 * S;
    const c_cp2_x = 59.94 * S; const c_cp2_y = 26.84 * S;
    const c_end_x = 59.94 * S; const c_end_y = 59.94 * S;

    // Short vertical/horizontal line segments
    const l_short = 10.9 * S; // ~5.45px

    // Top Right Width Calculation
    // Total Width = (CurveX * 3) + LineX = 95.36 (scaled)
    const socketW = 95.36;

    // Corner Radius
    const r = 32; // 2rem

    // Construct d string (Clockwise)
    let d = `M ${r} 0`;
    d += ` L ${w - socketW} 0`;
    d += ` c ${c_cp1_x} ${c_cp1_y}, ${c_cp2_x} ${c_cp2_y}, ${c_end_x} ${c_end_y}`;
    d += ` l 0 ${l_short}`;
    d += ` c ${c_cp1_y} ${c_cp1_x}, ${c_cp2_y} ${c_cp2_x}, ${c_end_y} ${c_end_x}`;
    d += ` l ${l_short} 0`;
    d += ` c ${c_cp1_x} ${c_cp1_y}, ${c_cp2_x} ${c_cp2_y}, ${c_end_x} ${c_end_y}`;
    d += ` L ${w} ${h - r}`;
    d += ` a ${r} ${r} 0 0 1 -${r} ${r}`;
    d += ` L ${r} ${h}`;
    d += ` a ${r} ${r} 0 0 1 -${r} -${r}`;
    d += ` L 0 ${r}`;
    d += ` a ${r} ${r} 0 0 1 ${r} -${r}`;
    d += ' Z';

    path.setAttribute('d', d);

    // Sync Background Shape
    if (bg) {
        bg.style.clipPath = `path('${d}')`;
    }
}

// Auto-initializer for all elements matching a selector
export function initAllSockets(selector = '.ampere-card-socket') {
    const containers = document.querySelectorAll(selector);

    // Create one shared ResizeObserver
    const ro = new ResizeObserver(entries => {
        for (let entry of entries) {
            // v2.896: If it's expanded, we let card-expander.js handle the rAF updates
            // to avoid jitter between the observer and the transition.
            if (entry.target.classList.contains('is-expanded')) continue;

            updateSocketPath(entry.target);
        }
    });

    containers.forEach(c => {
        updateSocketPath(c);
        ro.observe(c);
    });

    // Return observer if needed to disconnect later
    return ro;
}

