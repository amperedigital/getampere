// Distortion Grid Effect
// Standalone Script (Global)
// Version: v1.790

(function() {
console.log('[DistortionGrid] v1.863 Loaded'); 

class DistortionGrid {
    constructor(parentElement, index) {
        this.parent = parentElement;
        this.index = index;
        
        // Expose instance for Global Observer
        this.parent._distortionInstance = this;
        this.forcePause = false; // Controlled by IntersectionObserver
        
        // --- Configuration & Data Attribute Parsing ---
        // 1. Defaults
        // Updated v1.792: Matching the balanced look defined in HTML
        const defaults = {
            gridSpacing: 12, // User preferred spacing
            maxDots: 8000,   // Performance Cap
            dotRadius: 1.2,  // Proportional radius (Ratio ~0.1)
            mouseRadius: 400,
            strength: 0.6,   // Subtle strength
            idleColor: '255, 255, 255',
            hoverColor: '200, 230, 255',
            idleAlpha: 0.10, 
            hoverAlpha: 0.25,
            waveType: 'balloon' // Defaults to "Tight Balloon"
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
            hoverAlpha: parseAlpha(d.hoverAlpha, defaults.hoverAlpha),
            // Wave type
            waveType: d.waveType || defaults.waveType
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

        // Remove fallback CSS (SVG) if JS successfully initialized
        this.parent.classList.remove('distortion-grid-fallback');

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
                // Force re-render if static (and not mobile)
                if (!this.isAnimating && !this.forcePause && window.innerWidth >= 768) {
                    this.isAnimating = true;
                    this.animate();
                }
            }
        });
        this.resizeObserver.observe(this.parent);

        // Global Mouse Handler to fix occlusion issues
        this.mouseHandler = (e) => {
            // Absolute Mobile Guard: Do no math on small screens
            if (window.innerWidth < 768) return;

            // Only calc if we are allowed to animate (in view)
            if (this.forcePause) return;

            // Optimization: Throttle GBCR checks? 
            // Currently running every frame. 
            // TODO: Move GBCR to a cached property updated on Scroll/Refresh intersection?
            // For now, checks are necessary for accurate coordinate mapping relative to viewport.
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

        window.addEventListener('pointermove', this.mouseHandler, { passive: true });
    }

    resize() {
        // Mobile Guard: strictly disable functionality & apply fallback
        if (window.innerWidth < 768) {
             // Fallback: Static SVG Background (Dots)
             // Simple grid pattern: 12x12px cell (tighter), 1.5px radius dot at top-left (2,2)
             const svg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTInIGhlaWdodD0nMTInIHZpZXdCb3g9JzAgMCAxMiAxMicgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48Y2lyY2xlIGN4PScyJyBjeT0nMicgcj0nMS41JyBmaWxsPScjZmZmZmZmJyBmaWxsLW9wYWNpdHk9JzAuMTUnIC8+PC9zdmc+";
             
             if (this.parent) {
                 this.parent.style.backgroundImage = `url("${svg}")`;
                 this.parent.style.backgroundRepeat = 'repeat';
                 this.parent.style.backgroundSize = '12px 12px';
             }

             this.width = 0;
             this.height = 0;
             if (this.canvas) {
                 this.canvas.width = 0;
                 this.canvas.height = 0;
             }
             this.isAnimating = false;
             return;
        }

        // On Desktop: Remove fallback if present (e.g. window resize crossover) - match base64 logic
        if (this.parent.style.backgroundImage && this.parent.style.backgroundImage.includes('data:image/svg')) {
             this.parent.style.backgroundImage = '';
        }

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
        
        // Maintain visual density ratio (Dot Size scales with Spacing)
        // Ratio based on config defaults: 0.95 (radius) / 8 (spacing) = ~0.11875
        const densityRatio = this.config.dotRadius / this.config.targetSpacing;
        this.computedRadius = this.computedSpacing * densityRatio;

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
        if (this.forcePause || window.innerWidth < 768) { // Explicit Mobile Guard
            if (this.isAnimating) console.log('[DistortionGrid] Paused by Observer/Mobile');
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
        
        // Timer Logic:
        // - Interaction (and Planar): Only runs if there's visual motion (activity > 0)
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
        
        // Use computed Dynamic Radius for visual consistency
        const dotRadius = this.computedRadius || this.config.dotRadius;

        for (let i = 0; i < n; i++) {
            const baseX = dotsX[i];
            const baseY = dotsY[i];

            let drawX = baseX;
            let drawY = baseY;
            let currentRadius = dotRadius;
            let a = idleAlpha;
            
            // --- 0a. PLANAR WAVE (Deep Ocean Swell) ---
            // Only calc Planar if active
            if (this.config.waveType === 'planar' && this.activityLevel > 0.001) {
                const t = this.time;
                // Wave 1: Giant Diagonal Swell (Low Freq, High Amp)
                const w1 = (baseX * 0.0015) + (baseY * 0.0025) + (t * 0.3);
                
                // Wave 2: Secondary Rolling Swell (Interference pattern)
                const w2 = (baseX * 0.004) - (baseY * 0.002) + (t * 0.5);

                // Combined Displacement (Dramatic but organic)
                const offsetX = Math.cos(w1) * (spacing * 1.8) + Math.sin(w2) * (spacing * 0.4);
                const offsetY = Math.sin(w1) * (spacing * 1.8) + Math.cos(w2) * (spacing * 0.4);

                // Modulate amplitude by activityLevel (Fade in/out on hover)
                drawX += offsetX * this.activityLevel;
                drawY += offsetY * this.activityLevel;
            }

            // --- 0b. AMBIENT NOISE (Standard Mode Only) ---
            // If Planar or Balloon is active, we skip this to keep the effect clean.
            // Check for ANY balloon variant (balloon, lens, balloon-void, balloon-heavy)
            const isBalloon = this.config.waveType && (
                this.config.waveType.startsWith('balloon') || 
                this.config.waveType === 'lens'
            );
            
            if (this.config.waveType !== 'planar' && !isBalloon && this.activityLevel > 0.001) {
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

                        // 2. Wave/Physics Selection
                        // "balloon" is now the "tight" lens version (v1.786).
                        // "balloon-void" preserves the v1.785 high-repulsion version (The "Gap" version).
                        if (this.config.waveType === 'balloon' || this.config.waveType === 'lens') {
                            // --- TIGHT BALLOON (LENS) ---
                            // v1.789: Slight boost to visibility (Mag + Spotlight)
                            
                            // 1. Repulsion: Low to keep it tight
                            const repulsionStrength = spacing * 0.1; 
                            const pushFactor = envelope * repulsionStrength;
                            
                            if (dist > 0.1) {
                                drawX -= (dx / dist) * pushFactor;
                                drawY -= (dy / dist) * pushFactor;
                            }
                            
                            // 2. Magnification: Boosted slightly from 0.8 -> 1.2
                            const magFactor = 1.2; 
                            currentRadius = dotRadius + (envelope * dotRadius * magFactor);
                            
                            // 3. Flashlight: Re-enabled (Subtle)
                            a += (envelope * 0.15); 
                            
                        } else if (this.config.waveType === 'balloon-void' || this.config.waveType === 'balloon-heavy') {
                            // --- BALLOON VOID (High Repulsion) ---
                            // Preserved from v1.785

                            
                            const repulsionStrength = spacing * 2.0; 
                            const pushFactor = envelope * repulsionStrength;
                            
                            if (dist > 0.1) {
                                drawX -= (dx / dist) * pushFactor;
                                drawY -= (dy / dist) * pushFactor;
                            }
                            
                            const magFactor = 1.25; 
                            currentRadius = dotRadius + (envelope * dotRadius * magFactor);
                            a += (envelope * 0.35);

                        } else {
                            // --- STANDARD & PLANAR INTERACTIONS ---
                            
                            // Wave Physics (Mouse Driven)
                            // In Planar Mode, we DISABLE the local swirl to let the Global Wave be the hero.
                            if (this.config.waveType !== 'planar') {
                                const phaseX = mouseX * 0.02; 
                                const phaseY = mouseY * 0.02;
                                
                                const waveX = Math.sin((baseY * 0.04) + phaseX) * spacing * strength;
                                const waveY = Math.cos((baseX * 0.04) + phaseY) * spacing * strength;
    
                                drawX += waveX * envelope * 0.5;
                                drawY += waveY * envelope * 0.5;
                            }
                            
                            // Zoom
                            // In Planar mode, reduce zoom slightly to keep it clean
                            const zoomFactor = (this.config.waveType === 'planar') ? 0.3 : 0.6;
                            currentRadius = dotRadius + (envelope * dotRadius * zoomFactor);
                            
                            // Light Boost 
                            // Modified Flashlight: Soft boost
                            a += (envelope * 0.25); 
                        }
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
    static initAll(selector = '[data-object="distortion-grid"]') {
         // Mobile Performance Guard:
         // Do not initialize canvas on devices smaller than 768px.
         // This leaves the CSS background/SVG fallback visible with 0 JS cost.
         if (window.innerWidth < 768) {
             console.log('[DistortionGrid] Mobile detected (<768px). Skipping initialization.');
             return;
         }

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
