const activeHovers = new Set();

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
        this.enableInteraction = (options.enableInteraction !== undefined) ? options.enableInteraction : true;
        
        // Visual Style Configuration (Defaults to Legacy Blue/Green)
        this.markerClassActive = options.markerClassActive || 'fill-emerald-500';
        this.markerClassInactive = options.markerClassInactive || 'fill-blue-500';
        this.textClassActive = options.textClassActive || 'ring-text-green';
        this.textClassInactive = options.textClassInactive || 'ring-text-blue';
        
        // Hover Classes (v2.434)
        this.ringClassIdle = options.ringClassIdle || '';
        this.ringClassHover = options.ringClassHover || '';

        // State
        this.rotation = 0;
        this.targetRotation = 0;
        this.isDragging = false;
        this.lastPointerY = 0;
        this.velocity = 0;
        
        // Cache Elements
        this.trackCircle = this.dialGroup.querySelector('circle[stroke-width="60"]');
        this.dots = Array.from(this.dialGroup.querySelectorAll('circle[data-index]'));
        this.texts = Array.from(this.dialGroup.querySelectorAll('text[data-index]'));
        
        // Bindings
        this.update = this.update.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleHover = this.handleHover.bind(this); // v2.432

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
        if (this.enableInteraction) {
            this.svg.addEventListener('pointerdown', this.handlePointerDown);
            window.addEventListener('pointermove', this.handlePointerMove);
            window.addEventListener('pointerup', this.handlePointerUp);
            this.svg.addEventListener('wheel', this.handleWheel, { passive: false });
        }
        
        // Hover listeners for visual feedback (e.g. highlighting rings) can remain 
        // OR should we disable them too? Visual feedback is nice even if not draggable.
        // But for "passive" mode, maybe strict non-interactive?
        // Let's keep hover for tooltips/visuals unless requested otherwise.
        this.svg.addEventListener('pointermove', this.handleHover); // v2.432 Hover Feedback
        this.svg.addEventListener('pointerleave', this.handleHover); // v2.432 Clear on leave
    }

    getSVGCoordinates(clientX, clientY) {
        // Use robust SVG matrix transformation (v2.435)
        // This handles CSS scaling, padding, and aspect ratio positioning correctly
        if (this.svg.createSVGPoint) {
            let point = this.svg.createSVGPoint();
            point.x = clientX;
            point.y = clientY;
            
            // Transform screen pixel to SVG user unit
            // NOTE: We must use the matrix of the SVG element itself
            const matrix = this.svg.getScreenCTM();
            if (matrix) {
                return point.matrixTransform(matrix.inverse());
            }
        }
        
        // Fallback for very old environments (unlikely)
        const rect = this.svg.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (800 / rect.width),
            y: (clientY - rect.top) * (800 / rect.width)
        };
    }

    handleHover(e) {
        if (!this.isActive) return;
        if (this.isDragging) return;

        let isHit = false;

        if (e.type !== 'pointerleave') {
            const svgPt = this.getSVGCoordinates(e.clientX, e.clientY);
            
            const dx = svgPt.x - 400;
            const dy = svgPt.y - 400;
            const radius = Math.sqrt(dx*dx + dy*dy);

            if (radius >= this.hitMin && radius <= this.hitMax) {
                isHit = true;
            }
        }

        if (isHit) {
            activeHovers.add(this);
            this.setHoverState(true);
        } else {
            activeHovers.delete(this);
            this.setHoverState(false);
        }
        
        if (activeHovers.size > 0) {
            this.svg.style.cursor = 'grab';
        } else {
            this.svg.style.cursor = '';
        }
    }

    setHoverState(isHovered) {
        if (!this.trackCircle) return;
        if (!this.ringClassIdle || !this.ringClassHover) return;
        
        // Visual Feedback: Class Swap
        // This is robust against Tailwind opacity implementation details
        if (isHovered) {
            this.trackCircle.classList.remove(this.ringClassIdle);
            this.trackCircle.classList.add(this.ringClassHover);
        } else {
            this.trackCircle.classList.remove(this.ringClassHover);
            this.trackCircle.classList.add(this.ringClassIdle);
        }
    }

    handlePointerDown(e) {
        if (!this.isActive) return;

        // Mobile Guard: REMOVED v2.252 per user request ("Should be touch draggable")
        // if (window.innerWidth <= 1024) return;

        // Hit Test using Robust CTM (v2.435)
        const svgPt = this.getSVGCoordinates(e.clientX, e.clientY);
        
        // Center is 400,400
        const dx = svgPt.x - 400;
        const dy = svgPt.y - 400;
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

        // Mobile/Tablet Guard: Allow native page scrolling.
        // If screen width is small, assume user wants to scroll the page, not the ring.
        if (window.innerWidth <= 1024) return;
        
        // CTM Hit Test for Wheel
        const svgPt = this.getSVGCoordinates(e.clientX, e.clientY);
        const dx = svgPt.x - 400; 
        const dy = svgPt.y - 400;
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

    // Public API to set active slot immediately (or animated)
    setActiveIndex(index, animate = true) {
        // The index corresponds to the `data-index` attribute logic.
        // However, the rotation logic is "how many steps to rotate the ring to put that index at the top".
        // Current logic: Rotation 0 puts Index 0/1 at top.
        // Rotation +Steps puts PREVIOUS (Counter-Clockwise) items at top?
        // Let's deduce from updateHighlights comments:
        // "Positive Step (CW Rotation) -> Previous Slot (-1 / N) becomes Top."
        // So, if we want Index N to be at Top, we need to rotate:
        // Angle = -Index * StepSize?
        
        // Let's check updateHighlights logic to be sure.
        // mod(0 - step, numSlots) => activeIndex.
        // If step is +1, activeIndex is -1 => 11. 
        // So yes, Angle = -Index * snapInterval would make Index N the active one (assuming Index increases CW).
        
        // Wait, the markers are placed at specific rotations:
        // data-index="0" is at -90 (12oc) rotated inside the group.
        // If we rotate the GROUP, we move that marker.
        // If we want data-index="2" (at -30 or 2oc initially) to be at 12oc (-90 visual):
        // We need to rotate the group -60 degrees (CCW).
        
        // Let's verify existing markers:
        // Index 0: -90 (12oc)
        // Index 2: -30 (2oc) -> +60 deg from 12oc
        // Index 4: +30 (4oc) -> +120 deg from 12oc
        
        // To bring Index 2 to 12oc, we must rotate the GROUP by -60 degrees.
        // To bring Index 4 to 12oc, we must rotate the GROUP by -120 degrees.
        // Formula: targetRotation = -(IndexInSteps * SnapAngle)
        
        // OUTER RING (Indices 0, 2, 4...): Steps are index/2? No, indices are 0,2,4,6,8,10.
        // There are 6 items. 360/6 = 60 deg interval.
        // Item 2 is "1 step" away?
        // Let's check `updateHighlights` again.
        
        const targetAngle = -(index * (this.snapInterval / (this.snapInterval === 60 ? 2 : 1)));
        // Actually, let's keep it simple.
        // For Outer Ring (step=60): Indices are 0, 2, 4 etc. Real step count is Index/2.
        // For Inner Ring (step=60): Indices are 1, 3, 5 etc. Real step count is (Index-1)/2?
        // Actually, let's use the updateHighlights reverse logic.
        
        // Simpler approach: Just sweep angles until updateHighlights matches the index? No, inefficient.
        
        // Assuming the alignment in HTML:
        // Outer 0 is at 12oc.
        // Outer 2 is at 2oc (60 deg CW).
        // To make it active, rotate -60.
        // So: Angle = -(Index/2) * 60.
        
        // Inner 1 is at 12oc.
        // Inner 3 is at 2oc.
        // To make it active, rotate -60.
        // So: Angle = -((Index-1)/2) * 60.
        
        // Abstracted: 
        // We assume index maps to physical position angle X. 
        // We want to rotate group by -X.
        // Index 0/1 = 0 deg offset.
        // Index 2/3 = 60 deg offset.
        
        let slotOffset = 0;
        if (this.snapInterval === 60) {
            // Dual Ring Setup
             // Inner ring indices are odd (1,3,5), Outer are even (0,2,4)
             // Normalize to 0..5
             const normalizedStep = Math.floor(index / 2);
             slotOffset = normalizedStep * 60;
        } else {
             // Single Ring (12 items)
             slotOffset = index * 30;
        }

        this.targetRotation = -slotOffset;

        if (!animate) {
            this.rotation = this.targetRotation;
            this.updateHighlights(this.rotation);
        }
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
