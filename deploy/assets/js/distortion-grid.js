// Distortion Grid Effect
// Standalone Script (Global)
// Version: v1.777-smart-density

(function() {
console.log('[DistortionGrid] v1.777 Loaded'); // Smart Density

class DistortionGrid {
    constructor(parentElement, index) {
        this.parent = parentElement;
        this.index = index;
        
        // Expose instance for Global Observer
        this.parent._distortionInstance = this;
        this.forcePause = false; // Controlled by IntersectionObserver
        
        // --- Configuration & Data Attribute Parsing ---
        // 1. Defaults
        const defaults = {
            gridSpacing: 8, // Target spacing (Tight)
            maxDots: 8000,  // Performance Cap (prevents lag on huge screens)
            dotRadius: 0.95,
            mouseRadius: 400,
            strength: 0.8,
            idleColor: '255, 255, 255',
            hoverColor: '200, 230, 255',
            idleAlpha: 0.10, 
            hoverAlpha: 0.25
        };

        // 2. Fallback Variants (preserves original demo logic if no data-attrs)
        // Useful for testing or when dynamic colors aren't provided
        const variants = [
            { r: 200, g: 230, b: 255 }, // Blue-ish
            { r: 180, g: 240, b: 255 }, // Cyan-ish
            { r: 200, g: 210, b: 255 }, // Indigo-ish
            { r: 220, g: 200, b: 255 }, // Violet-ish
            { r: 200, g: 255, b: 240 }, // Teal-ish
            { r: 255, g: 255, b: 255 }  // White
        ];
        // Use variants if specific colors aren't provided via data attributes
        const variant = variants[index % variants.length];
        
        // 3. Parse Dataset
        const d = this.parent.dataset;
        
        // Helper to parse "255, 255, 255" string to object
        const parseRGB = (str) => {
            if (!str) return null;
            const parts = str.split(',').map(n => parseInt(n.trim()));
            return { r: parts[0], g: parts[1], b: parts[2] };
        };

        // Determine final values
        const spacing = parseFloat(d.gridSpacing || defaults.gridSpacing);
        // Ensure minimum spacing to prevent extreme density
        const safeSpacing = Math.max(spacing, 4); 
        
        const radius = parseFloat(d.dotRadius || defaults.dotRadius);
        const mouseRad = parseFloat(d.mouseRadius || defaults.mouseRadius);
        const strength = parseFloat(d.strength || (variant.strength ?? defaults.strength)); 
        
        // Colors resolution
        // Default to provided variant if data attribute is missing
        let hoverRGB = variant; 
        const hoverData = parseRGB(d.hoverColor);
        if (hoverData) hoverRGB = hoverData;
        
        let idleRGB = parseRGB(defaults.idleColor);
        const idleData = parseRGB(d.idleColor);
        if (idleData) idleRGB = idleData;

        // Parse Alphas safely allowing 0
        const parseAlpha = (val, def) => {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? def : parsed;
        };

        this.config = {
            targetSpacing: safeSpacing, // User desired spacing (Target)
            maxDots: defaults.maxDots,
            dotRadius: radius,
            mouseRadius: mouseRad,
            strength: strength,
            // Colors separated
            idleR: idleRGB.r, idleG: idleRGB.g, idleB: idleRGB.b,
            hoverR: hoverRGB.r, hoverG: hoverRGB.g, hoverB: hoverRGB.b,
            // Alphas
            idleAlpha: parseAlpha(d.idleAlpha, defaults.idleAlpha),
            hoverAlpha: parseAlpha(d.hoverAlpha, defaults.hoverAlpha)
        };
        
        // Dynamic Variable
        this.computedSpacing = this.config.targetSpacing;

        // Setup Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'distortion-canvas-local';
        
        // Ensure the canvas is behind content but visible
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Click-through
        this.canvas.style.zIndex = '0'; 
        
        // Ensure parent can hold absolute children
        const parentStyle = window.getComputedStyle(this.parent);
        if (parentStyle.position === 'static') {
            this.parent.style.position = 'relative'; 
        }

        this.parent.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.time = 0; 
        this.mouse = { x: -1000, y: -1000 };
        this.dotsX = null;
        this.dotsY = null;
        this.numDots = 0;
        this.activityLevel = 0;
        this.isAnimating = false;
        
        this.init();
        this.bindEvents();
        
        // Initial render (one frame)
        this.animate();
    }

    init() {
        this.time = 0; 
        this.resize();
    }

    bindEvents() {
        // Resize observer
        this.resizeObserver = new ResizeObserver(() => {
            if (this.width !== this.parent.offsetWidth || this.height !== this.parent.offsetHeight) {
                this.resize();
                // Force re-render if static
                if (!this.isAnimating && !this.forcePause) {
                    this.isAnimating = true;
                    this.animate();
                }
            }
        });
        this.resizeObserver.observe(this.parent);

        // Global Mouse Handler to fix occlusion issues
        this.mouseHandler = (e) => {
            // Only calc if we are allowed to animate (in view)
            if (this.forcePause) return;

            const rect = this.parent.getBoundingClientRect();
           
            // Check if mouse is within bounds (with buffer)
            const buffer = 50; 
            
            if (
                e.clientX >= rect.left - buffer && 
                e.clientX <= rect.right + buffer &&
                e.clientY >= rect.top - buffer && 
                e.clientY <= rect.bottom + buffer
            ) {
                 this.mouse.x = e.clientX - rect.left;
                 this.mouse.y = e.clientY - rect.top;
                 
                 // Wake Up
                 if (!this.isAnimating) {
                     console.log('[DistortionGrid] Waking up loop (Interaction)');
                     this.isAnimating = true;
                     this.animate();
                 }
            } else {
                 this.mouse.x = -1000;
                 this.mouse.y = -1000;
            }
        };

        window.addEventListener('mousemove', this.mouseHandler, { passive: true });
    }

    resize() {
        this.width = this.parent.offsetWidth;
        this.height = this.parent.offsetHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Smart Spacing Calculation
        const target = this.config.targetSpacing;
        const area = this.width * this.height;
        const maxDots = this.config.maxDots;
        
        // Check theoretical count with target spacing
        const theoreticalDots = area / (target * target);
        
        if (theoreticalDots > maxDots) {
             // Reverse calc: Sqrt(Area / MaxDots)
             this.computedSpacing = Math.sqrt(area / maxDots);
             // console.log(`[DistortionGrid] Scaling Back. Area: ${area}, TargetDots: ${Math.round(theoreticalDots)}, NewSpacing: ${this.computedSpacing.toFixed(2)}`);
        } else {
             this.computedSpacing = target;
        }

        this.createDots();
    }

    createDots() {
        // Use computedSpacing instead of config.gridSpacing
        const s = this.computedSpacing;
        
        const cols = Math.ceil(this.width / s) + 1;
        const rows = Math.ceil(this.height / s) + 1;
        this.numDots = cols * rows;

        // Optimization: Typed Arrays (Float32Array)
        this.dotsX = new Float32Array(this.numDots);
        this.dotsY = new Float32Array(this.numDots);

        let index = 0;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.dotsX[index] = i * s;
                this.dotsY[index] = j * s;
                index++;
            }
        }
    }

    animate() {
        // GLOBAL PAUSE (IntersectionObserver)
        if (this.forcePause) {
            if (this.isAnimating) console.log('[DistortionGrid] Paused by Observer');
            this.isAnimating = false;
            return;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Smooth activity transition
        if (typeof this.activityLevel === 'undefined') this.activityLevel = 0;
        
        const isHovered = this.mouse.x !== -1000;
        
        // Target is 1 when hovered, 0 when idle
        const targetLevel = isHovered ? 1 : 0;
        this.activityLevel += (targetLevel - this.activityLevel) * 0.05; 
        
        // Only increment animation time if there's visual motion
        if (this.activityLevel > 0.001) {
            this.time += 0.015;
        }
        
        // RENDER LOOP
        // Using local vars decreases lookups in loop
        const n = this.numDots;
        const width = this.width;
        const height = this.height;
        const dotsX = this.dotsX;
        const dotsY = this.dotsY;
        const spacing = this.computedSpacing; // Use dynamic spacing
        const strength = this.config.strength;
        const mouseRadius = this.config.mouseRadius;
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        
        const idleR = this.config.idleR;
        const idleG = this.config.idleG;
        const idleB = this.config.idleB;
        const idleAlpha = this.config.idleAlpha;
        
        const dotRadius = this.config.dotRadius;

        for (let i = 0; i < n; i++) {
            const baseX = dotsX[i];
            const baseY = dotsY[i];

            let drawX = baseX;
            let drawY = baseY;
            let currentRadius = dotRadius;
            let a = idleAlpha;

            // 0. Automatic Ambient Movement (Organic / Random feel)
            // Optimization: Only calc heavy trig if activityLevel is visible
            if (this.activityLevel > 0.001) {
                const t = this.time;
                
                // X-Axis Noise
                const noiseX = Math.sin((baseY * 0.03) + t) 
                             + Math.sin((baseY * 0.1) + (t * 1.5)) * 0.5 
                             + Math.cos((baseX * 0.05) + (t * 0.8)) * 0.3;

                // Y-Axis Noise
                const noiseY = Math.cos((baseX * 0.03) + t) 
                             + Math.cos((baseX * 0.1) + (t * 1.5)) * 0.5
                             + Math.sin((baseY * 0.05) + (t * 0.8)) * 0.3;

                const autoWaveX = noiseX * (spacing * 0.4); 
                const autoWaveY = noiseY * (spacing * 0.4);
                
                // Scale by activity
                drawX += autoWaveX * this.activityLevel;
                drawY += autoWaveY * this.activityLevel;
            }

            if (isHovered) {
                // Optimize: Simple bounding box check before expensive Sqrt
                const dx = mouseX - baseX;
                const dy = mouseY - baseY;
                
                if (Math.abs(dx) < mouseRadius && Math.abs(dy) < mouseRadius) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Physics Interaction (Localized to Mouse)
                    if (dist < mouseRadius) {
                        // 1. Envelope (0 to 1 scaling factor based on distance)
                        const rawForce = (mouseRadius - dist) / mouseRadius; 
                        const envelope = (1 - Math.cos(rawForce * Math.PI)) / 2; 

                        // 2. Wave Physics (Mouse Driven)
                        const phaseX = mouseX * 0.02; 
                        const phaseY = mouseY * 0.02;
                        
                        const waveX = Math.sin((baseY * 0.04) + phaseX) * spacing * strength;
                        const waveY = Math.cos((baseX * 0.04) + phaseY) * spacing * strength;

                        drawX += waveX * envelope * 0.5;
                        drawY += waveY * envelope * 0.5;
                        
                        // 3. Zoom
                        currentRadius = dotRadius + (envelope * dotRadius * 0.6);
                        
                        // 4. Light Boost 
                        // Modified Flashlight: Soft boost
                        a += (envelope * 0.25); 
                    }
                }
            }
            
            // Safety cap alpha
            if (a > 0.8) a = 0.8;
            
            const color = `rgba(${idleR},${idleG},${idleB},${a})`;
            
            // Draw
            this.ctx.fillStyle = color;
            const size = currentRadius * 2;
            const cornerRadius = size * 0.4;
            this.ctx.beginPath();
             // Optimization: Skipping check for roundRect each iter if we know target browser
             // But for safety keeping it simple
            if (this.ctx.roundRect) {
                this.ctx.roundRect(drawX - currentRadius, drawY - currentRadius, size, size, cornerRadius);
            } else {
                this.ctx.rect(drawX - currentRadius, drawY - currentRadius, size, size);
            }
            this.ctx.fill();
        }

        // SLEEP CONDITION:
        // If mouse is gone AND visual activity matches idle state (approx 0)
        // We stop the loop to save CPU, but leave the canvas painted (frozen idle state).
        if (this.mouse.x === -1000 && this.activityLevel <= 0.001) {
            if (this.isAnimating) console.log('[DistortionGrid] Sleeping (Idle)');
            this.isAnimating = false;
            return; 
        }

        requestAnimationFrame(this.animate.bind(this));
    }

    // --- External Control Methods ---
    pause() {
        this.forcePause = true;
    }

    resume() {
        if (this.forcePause) {
            console.log('[DistortionGrid] Resumed by Observer');
            this.forcePause = false;
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.animate();
            }
        }
    }

    // Static Initialization Helper
    static initAll(selector = '[data-object="grid"]') {
         const elements = document.querySelectorAll(selector);
         elements.forEach((el, index) => {
             // Check if already initialized
             if (!el.dataset.distortionInitialized) {
                 new DistortionGrid(el, index);
                 el.dataset.distortionInitialized = "true";
             }
         });
    }
}

// Expose to window
window.DistortionGrid = DistortionGrid;

})(); // End IIFE
