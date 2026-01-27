// Ampere Glass Socket Generator (v1.5 Fixed)
// Generates the path for the "Socket" cutout on cards.
// v2.321: Restored original Bezier geometry values from tech-demo.html (v15.2)

export function updateSocketPath(container, options = {}) {
    if (!container) return;
    
    // Find the svg path in this container (look for class logic or ID reference if generic)
    // The current implementation in HTML looks for:
    // const path = container.querySelector('.socket-path');
    
    const path = container.querySelector('.socket-path');
    if (!path) return;

    // NEW: Find bg to sync clip-path (v2.483)
    const bg = container.querySelector('.socket-background');

    const w = container.clientWidth || 300;
    const h = container.clientHeight || 150;
    
    // Original Geometry Constants (Scale Factor 0.5)
    // Source: tech-demo.html (v15.2)
    const S = 0.5;
    
    // Bezier Control Points
    const c_cp1_x = 33.11 * S; const c_cp1_y = 0 * S;
    const c_cp2_x = 59.94 * S; const c_cp2_y = 26.84 * S;
    const c_end_x = 59.94 * S; const c_end_y = 59.94 * S;
    
    // Short vertical/horizontal line segments
    const l_short = 10.9 * S; // ~5.45px

    // Top Right Width Calculation
    // Total Width = (CurveX * 3) + LineX
    // 59.94*3 + 10.9 = 179.82 + 10.9 = 190.72
    // Scaled by 0.5 = 95.36
    const socketW = 95.36; 

    // Corner Radius
    const r = 32; // 2rem

    // Construct d string (Clockwise)
    // Start Top-Left (actually after top-left corner)
    let d = `M ${r} 0`;
    
    // Line to start of socket
    d += ` L ${w - socketW} 0`;
    
    // 1. Curve Down/Right (First Step - Top) - H->V Convex
    d += ` c ${c_cp1_x} ${c_cp1_y}, ${c_cp2_x} ${c_cp2_y}, ${c_end_x} ${c_end_y}`;
    
    // 2. Line Down (Vertical)
    d += ` l 0 ${l_short}`;
    
    // 3. Curve Down/Right (Middle Step) - V->H Concave/Inverted
    // INVERTED: Swap X and Y coordinates relative to step start
    d += ` c ${c_cp1_y} ${c_cp1_x}, ${c_cp2_y} ${c_cp2_x}, ${c_end_y} ${c_end_x}`;
    
    // 4. Line Right (Horizontal)
    d += ` l ${l_short} 0`;
    
    // 5. Curve Down/Right (Bottom Step) - H->V Convex
    d += ` c ${c_cp1_x} ${c_cp1_y}, ${c_cp2_x} ${c_cp2_y}, ${c_end_x} ${c_end_y}`;
    
    // Now we are at (w, socketH).
    // Line Down to Bottom-Right Corner start
    d += ` L ${w} ${h - r}`;
    
    // Bottom-Right Corner
    d += ` a ${r} ${r} 0 0 1 -${r} ${r}`; // Sweep 1 for clockwise
    
    // Bottom Edge
    d += ` L ${r} ${h}`;
    
    // Bottom-Left Corner
    d += ` a ${r} ${r} 0 0 1 -${r} -${r}`;
    
    // Left Edge
    d += ` L 0 ${r}`;
    
    // Top-Left Corner
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
