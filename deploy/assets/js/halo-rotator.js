export class HaloRotator {
    constructor(svgElement, selector = '#halo-rotary-dial', options = {}) {
        this.svg = svgElement;
        this.dialGroup = this.svg.querySelector(selector);
        
        if (!this.dialGroup) {
            console.warn(`HaloRotator: Group ${selector} not found`);
            return;
        }

        // Configuration
        this.hitMin = options.hitMin || 0;
        this.hitMax = options.hitMax || 9999;
        this.snapInterval = options.snapInterval || 30; // Degrees per slot (360/12=30, 360/6=60)
        
        // Visual Style Configuration (Defaults to Legacy Blue/Green)
        this.markerClassActive = options.markerClassActive || 'fill-emerald-500';
        this.markerClassInactive = options.markerClassInactive || 'fill-blue-500';
        this.textClassActive = options.textClassActive || 'ring-text-green';
        this.textClassInactive = options.textClassInactive || 'ring-text-blue';

        // State
        this.rotation = 0;
        this.targetRotation = 0;
        this.isDragging = false;
        this.lastPointerY = 0;
        this.velocity = 0;
        
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
        // Check for existing loop? No, each instance needs its own update loop for its layout.
        this.rafId = requestAnimationFrame(this.update);
        
        // Initial Highlights
        this.isActive = false; 
        this.updateHighlights(0);
    }

    setPowerState(state) {
        this.isActive = (state === 'ACTIVE');
        
        // Toggle Dimmed Visuals logic handled by CSS classes on the SVG root
        if (this.svg) {
            if (state !== 'ACTIVE') {
                this.svg.classList.add('halo-dimmed');
            } else {
                this.svg.classList.remove('halo-dimmed');
            }
        }
        
        if (this.isActive) {
            // this.svg.style.pointerEvents = 'auto'; // SVG is shared, don't toggle this or it kills both
        } else {
            // this.svg.style.pointerEvents = 'none';
        }
    }

    attachListeners() {
        // We attach to the SVG mainly, but for drag we might want window for release
        this.svg.addEventListener('pointerdown', this.handlePointerDown);
        window.addEventListener('pointermove', this.handlePointerMove);
        window.addEventListener('pointerup', this.handlePointerUp);
        this.svg.addEventListener('wheel', this.handleWheel, { passive: false });
    }

    handlePointerDown(e) {
        if (!this.isActive) return;

        // Hit Test using Radius from Center (400, 400 SVG coords)
        const rect = this.svg.getBoundingClientRect();
        // Assume SVG viewbox 0 0 800 800 is mapped to rect
        // We need coordinates in 800x800 space
        const scale = 800 / rect.width;
        const x = (e.clientX - rect.left) * scale;
        const y = (e.clientY - rect.top) * scale;
        
        // Center is 400,400
        const dx = x - 400;
        const dy = y - 400;
        const radius = Math.sqrt(dx*dx + dy*dy);

        // Check bounds
        if (radius < this.hitMin || radius > this.hitMax) {
            return; // Not this ring
        }

        this.isDragging = true;
        this.lastPointerY = e.clientY;
        this.velocity = 0;
        document.body.style.cursor = 'grabbing';
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
            document.body.style.cursor = '';
            
            // Snap Logic on Release
            this.snapToGrid();
        }
    }

    handleWheel(e) {
        if (!this.isActive) return;
        
        // Hit test for wheel too? Strictness vs Usability.
        // Let's check radius to allow independent scrolling
        const rect = this.svg.getBoundingClientRect();
        const scale = 800 / rect.width;
        const x = (e.clientX - rect.left) * scale;
        const y = (e.clientY - rect.top) * scale;
        const dx = x - 400; const dy = y - 400;
        const radius = Math.sqrt(dx*dx + dy*dy);
        
        if (radius < this.hitMin || radius > this.hitMax) return;

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
        // Calculate Active Slot based on Rotation and Snap Interval
        // Logic: 
        // - Initial State (Angle 0) -> Slot 0 is Top (-90deg).
        // - Positive Step (CW Rotation) -> Previous Slot (-1 / N) becomes Top.
        
        const numSlots = Math.round(360 / this.snapInterval); // e.g. 12 or 6
        let step = Math.round(angle / this.snapInterval);
        
        const mod = (n, m) => ((n % m) + m) % m;
        const activeIndex = mod(-step, numSlots);

        const updateClasses = (el, removeStr, addStr) => {
            if (removeStr) removeStr.split(' ').filter(c => c).forEach(c => el.classList.remove(c));
            if (addStr) addStr.split(' ').filter(c => c).forEach(c => el.classList.add(c));
        };

        // Update Dots
        // Assumes this.dots matches current DOM order (CW from Top/Start)
        this.dots.forEach((dot, index) => {
            const isActive = (index === activeIndex); 
            
            if (isActive) {
                updateClasses(dot, this.markerClassInactive, this.markerClassActive);
            } else {
                updateClasses(dot, this.markerClassActive, this.markerClassInactive);
            }
        });

        // Update Text
        this.texts.forEach((text, index) => {
            const isActive = (index === activeIndex);
            
            if (isActive) {
                updateClasses(text, this.textClassInactive, this.textClassActive);
            } else {
                updateClasses(text, this.textClassActive, this.textClassInactive);
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
