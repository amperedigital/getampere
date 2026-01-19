// Distortion Grid Effect
// Standalone Script (Global)

(function() {

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
            gridSpacing: 7,
            dotRadius: 0.95,
            mouseRadius: 400,
            strength: 0.8,
            idleColor: '255, 255, 255',
            hoverColor: '200, 230, 255',
            idleAlpha: 0.12,
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

        this.config = {
            gridSpacing: spacing,
            dotRadius: radius,
            mouseRadius: mouseRad,
            strength: strength,
            // Colors separated
            idleR: idleRGB.r, idleG: idleRGB.g, idleB: idleRGB.b,
            hoverR: hoverRGB.r, hoverG: hoverRGB.g, hoverB: hoverRGB.b,
            // Alphas
            idleAlpha: parseFloat(d.idleAlpha || defaults.idleAlpha),
            hoverAlpha: parseFloat(d.hoverAlpha || defaults.hoverAlpha)
        };

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
        // Start animate initially to render first frame
        this.animate();
    }

    init() {
        this.time = 0; 
        this.resize();
    }

    bindEvents() {
        // Resize observer
        this.resizeObserver = new ResizeObserver(() => {
            this.resize();
            // Force re-render if static
            if (!this.isAnimating) {
                // One-shot render for resize
                this.isAnimating = true;
                this.animate();
            }
        });
        this.resizeObserver.observe(this.parent);

        // Mouse Move
        this.parent.addEventListener('mousemove', (e) => {
            const rect = this.parent.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            
            // Wake Up
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.animate();
            }
        });

        // Mouse Leave
        this.parent.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });
    }

    resize() {
        this.width = this.parent.offsetWidth;
        this.height = this.parent.offsetHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.createDots();
    }

    createDots() {
        const cols = Math.ceil(this.width / this.config.gridSpacing) + 1;
        const rows = Math.ceil(this.height / this.config.gridSpacing) + 1;
        this.numDots = cols * rows;

        // Optimization: Typed Arrays (Float32Array)
        this.dotsX = new Float32Array(this.numDots);
        this.dotsY = new Float32Array(this.numDots);

        let index = 0;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.dotsX[index] = i * this.config.gridSpacing;
                this.dotsY[index] = j * this.config.gridSpacing;
                index++;
            }
        }
    }

    animate() {
        // GLOBAL PAUSE (IntersectionObserver)
        if (this.forcePause) {
            this.isAnimating = false;
            return;
        }

        // SLEEP CONDITION:
        // If mouse is gone AND visual activity matches idle state (approx 0)
        // We stop the loop to save CPU.
        if (this.mouse.x === -1000 && this.activityLevel <= 0.001) {
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
        for (let i = 0; i < this.numDots; i++) {
            const baseX = this.dotsX[i];
            const baseY = this.dotsY[i];

            let drawX = baseX;
            let drawY = baseY;
            let currentRadius = this.config.dotRadius;
            
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

                const autoWaveX = noiseX * (this.config.gridSpacing * 0.4); 
                const autoWaveY = noiseY * (this.config.gridSpacing * 0.4);
                
                // Scale by activity
                drawX += autoWaveX * this.activityLevel;
                drawY += autoWaveY * this.activityLevel;
            }

            // Base Visibility Logic
            let r = this.config.idleR;
            let g = this.config.idleG;
            let b = this.config.idleB;
            let a = this.config.idleAlpha;

            if (isHovered) {
                r = this.config.hoverR;
                g = this.config.hoverG;
                b = this.config.hoverB;
                // HOVER state alpha
                a = this.config.hoverAlpha; 

                // Optimize: Simple bounding box check before expensive Sqrt
                const dx = this.mouse.x - baseX;
                const dy = this.mouse.y - baseY;
                
                if (Math.abs(dx) < this.config.mouseRadius && Math.abs(dy) < this.config.mouseRadius) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Physics Interaction (Localized to Mouse)
                    if (dist < this.config.mouseRadius) {
                        // 1. Envelope (0 to 1 scaling factor based on distance)
                        const rawForce = (this.config.mouseRadius - dist) / this.config.mouseRadius; 
                        const envelope = (1 - Math.cos(rawForce * Math.PI)) / 2; 

                        // 2. Wave Physics (Mouse Driven)
                        const phaseX = this.mouse.x * 0.02; 
                        const phaseY = this.mouse.y * 0.02;
                        
                        const waveX = Math.sin((baseY * 0.04) + phaseX) * this.config.gridSpacing * this.config.strength;
                        const waveY = Math.cos((baseX * 0.04) + phaseY) * this.config.gridSpacing * this.config.strength;

                        drawX += waveX * envelope * 0.5;
                        drawY += waveY * envelope * 0.5;
                        
                        // 3. Zoom
                        currentRadius = this.config.dotRadius + (envelope * this.config.dotRadius * 0.6);
                        
                        // 4. Light Boost 
                        a += (envelope * 0.3); 
                    }
                }
            } else {
                 // IDLE
                 a = this.config.idleAlpha;
            }
            
            const color = `rgba(${r},${g},${b},${a})`;
            this.drawDot(drawX, drawY, currentRadius, color);
        }

        requestAnimationFrame(this.animate.bind(this));
    }

    drawDot(x, y, r, c) {
        this.ctx.fillStyle = c;
        const size = r * 2;
        // Rounded Square ("Digital Pixel" look)
        const cornerRadius = size * 0.4;
        
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x - r, y - r, size, size, cornerRadius);
        } else {
            this.ctx.rect(x - r, y - r, size, size);
        }
        this.ctx.fill();
    }

    // --- External Control Methods ---
    pause() {
        this.forcePause = true;
    }

    resume() {
        if (this.forcePause) {
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
