export class HaloRotator {
    constructor(svgElement) {
        this.svg = svgElement;
        this.dialGroup = this.svg.querySelector('#halo-rotary-dial');
        
        if (!this.dialGroup) {
            console.error('HaloRotator: #halo-rotary-dial not found');
            return;
        }

        // State
        this.rotation = 0;
        this.targetRotation = 0;
        this.isDragging = false;
        this.lastPointerY = 0;
        this.velocity = 0;
        this.snapInterval = 30; // Degrees per slot
        
        // Cache Elements
        this.dots = Array.from(this.dialGroup.querySelectorAll('circle[data-index]'));
        this.texts = Array.from(this.dialGroup.querySelectorAll('text[data-index]'));
        
        // Bindings
        this.update = this.update.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleWheel = this.handleWheel.bind(this);

        // Init
        this.attachListeners();
        this.rafId = requestAnimationFrame(this.update);
        
        // Initial Highlight
        this.updateHighlights(0);
    }

    attachListeners() {
        // We attach to the SVG mainly, but for drag we might want window for release
        this.svg.addEventListener('pointerdown', this.handlePointerDown);
        window.addEventListener('pointermove', this.handlePointerMove);
        window.addEventListener('pointerup', this.handlePointerUp);
        this.svg.addEventListener('wheel', this.handleWheel, { passive: false });
    }

    handlePointerDown(e) {
        // Only trigger if clicking on/near the ring? 
        // For now, entire SVG area works to be friendly
        this.isDragging = true;
        this.lastPointerY = e.clientY;
        this.velocity = 0;
        this.svg.classList.add('cursor-grabbing');
    }

    handlePointerMove(e) {
        if (!this.isDragging) return;
        
        const deltaY = e.clientY - this.lastPointerY;
        this.lastPointerY = e.clientY;
        
        // Drag Sensitivity: Pixel to Degree
        // Pulling DOWN (positive delta) should rotate CLOCKWISE? 
        // Standard UI: Pulling down usually rotates top towards bottom (CW).
        const sensitivity = 0.5;
        this.targetRotation += deltaY * sensitivity;
        
        // Instant update for responsiveness, but physics loop handles smoothing
    }

    handlePointerUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.svg.classList.remove('cursor-grabbing');
            
            // Snap Logic on Release
            this.snapToGrid();
        }
    }

    handleWheel(e) {
        e.preventDefault();
        // Wheel Down (positive) -> Rotate CW (positive angle)
        const sensitivity = 0.2;
        this.targetRotation += e.deltaY * sensitivity;
        
        // Debounce snapping
        clearTimeout(this.snapTimeout);
        this.snapTimeout = setTimeout(() => this.snapToGrid(), 100);
    }

    snapToGrid() {
        // Find nearest multiple of 30
        const remainder = this.targetRotation % this.snapInterval;
        let snapTarget = this.targetRotation - remainder;
        
        // Round to closest
        if (Math.abs(remainder) > this.snapInterval / 2) {
            snapTarget += (remainder > 0 ? this.snapInterval : -this.snapInterval);
        }
        
        this.targetRotation = snapTarget;
    }

    update() {
        // Physics Interpolation
        // wrapper for lerp
        const lerp = (start, end, factor) => start + (end - start) * factor;
        
        if (!this.isDragging) {
            // Apply spring/ease to target
            this.rotation = lerp(this.rotation, this.targetRotation, 0.1);
        } else {
            // During drag, direct follow with slight lag for weight
            this.rotation = lerp(this.rotation, this.targetRotation, 0.5);
        }

        // Apply Transform
        this.dialGroup.setAttribute('transform', `rotate(${this.rotation})`);

        // Check active state
        // Only update highlights when close to a slot to avoid flashing?
        // Or update continuously? Continuously gives better feedback.
        this.updateHighlights(this.rotation);

        this.rafId = requestAnimationFrame(this.update);
    }

    updateHighlights(angle) {
        // Calculate Top Index (12 o'clock)
        // angle = -90 (Index 0 at 3oc) moves to 12oc?
        // Wait, standard position: Index 0 is at -90 deg (12oc).
        // So at Rotation 0, Index 0 is at 12oc.
        // At Rotation 30 (CW), Index 11 (at -120 originally?) NO.
        // HTML: Index 0 at -90. Index 11 at 240 (-120).
        // If I rotate +30 deg (CW):
        // Index 0 moves to -60 (1oc).
        // Index 11 moves to -90 (12oc).
        // So +Rotation means LOWER index? No, +30 makes Index 11 active.
        // Index = (0 - round(rotation/30)) % 12?
        // Rot=30 -> -1 -> 11. Correct.
        // Rot=-30 -> 1. Correct.
        
        let normalizedStep = Math.round(angle / 30);
        // JS Modulo operator allows negatives, need proper floored mod
        const mod = (n, m) => ((n % m) + m) % m;
        
        const activeTopIndex = mod(-normalizedStep, 12);
        // const activeBottomIndex = mod(activeTopIndex + 6, 12); // Removed per user request

        // Update Dots
        this.dots.forEach(dot => {
            const idx = parseInt(dot.getAttribute('data-index'));
            const isActive = (idx === activeTopIndex); // Only Top is active
            
            if (isActive) {
                dot.classList.remove('fill-blue-500');
                dot.classList.add('fill-emerald-500');
            } else {
                dot.classList.remove('fill-emerald-500');
                dot.classList.add('fill-blue-500');
            }
        });

        // Update Text
        this.texts.forEach(text => {
            const idx = parseInt(text.getAttribute('data-index'));
            const isActive = (idx === activeTopIndex); // Only Top is active
            
            if (isActive) {
                text.classList.remove('ring-text-blue');
                text.classList.add('ring-text-green');
            } else {
                text.classList.remove('ring-text-green');
                text.classList.add('ring-text-blue');
            }
        });
    }

    destroy() {
        window.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('pointerup', this.handlePointerUp);
        // ... remove others
        cancelAnimationFrame(this.rafId);
    }
}
