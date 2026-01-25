// Ampere Glass Socket Generator (v1.0)
// Generates the path for the "Socket" cutout on cards.

export function updateSocketPath(container, options = {}) {
    if (!container) return;
    
    // Find the svg path in this container (look for class logic or ID reference if generic)
    // The current implementation in HTML looks for:
    // const path = container.querySelector('.socket-path');
    
    const path = container.querySelector('.socket-path');
    if (!path) return;

    const w = container.clientWidth || 300;
    const h = container.clientHeight || 150;
    
    // Configuration (Standardized)
    // These match the values in tech-demo.html
    const c_cp1_x = 10;
    const c_cp1_y = 0;
    const c_cp2_x = 24.14; 
    const c_cp2_y = 14.14; 
    const c_end_x = 24.14; 
    const c_end_y = 38.28; 

    // Short vertical line
    const l_short = 2.0;

    // Corner Radius
    const r = 32; // 2rem

    const socketW = 95.36; // Constant width of the socket shape logic

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
