/**
 * Distortion Grid Field
 * 
 * Draws a grid of dots on a canvas.
 * Distorts their position based on mouse proximity.
 */

export class DistortionGrid {
    constructor(canvasElement) {
        console.log("DistortionGrid initialized");
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration
        this.config = {
            gridSpacing: 40, 
            dotRadius: 2.0,    // Increased for visibility
            dotColor: '#475569', // Slate-600 (Lighter than background)
            activeColor: '#38bdf8', // Sky-400 (Bright Cyan Highlight)
            mouseRadius: 250, 
            strength: 0.8,    
            ease: 0.1         
        };

        this.mouse = { x: -1000, y: -1000 };
        this.dots = [];
        
        this.init();
        this.bindEvents();
        this.animate();
    }

    init() {
        this.resize();
        this.createDots();
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createDots();
        });

        window.addEventListener('mousemove', (e) => {
            // Get mouse pos relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    createDots() {
        this.dots = [];
        const cols = Math.ceil(this.width / this.config.gridSpacing) + 1;
        const rows = Math.ceil(this.height / this.config.gridSpacing) + 1;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.dots.push({
                    baseX: i * this.config.gridSpacing,
                    baseY: j * this.config.gridSpacing,
                    x: i * this.config.gridSpacing,
                    y: j * this.config.gridSpacing
                });
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.dots.forEach(dot => {
            // Calculate distance to mouse
            const dx = this.mouse.x - dot.baseX;
            const dy = this.mouse.y - dot.baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let drawX = dot.baseX;
            let drawY = dot.baseY;
            let radius = this.config.dotRadius;
            let color = this.config.dotColor;

            // Simple Distortion Logic
            // If mouse is close (within active radius)
            if (dist < this.config.mouseRadius) {
                // Calculate "Force" (0 to 1, higher when closer)
                const force = (this.config.mouseRadius - dist) / this.config.mouseRadius;
                
                // Displacement Vector (Push Away)
                // Math.atan2 helps finding direction, but simple vector math is faster
                // We push 'away' from mouse.
                const angle = Math.atan2(dy, dx);
                
                // MAGNIFY EFFECT (Push Away)
                // To do 'Black Hole' (Pull In), change '+' to '-'
                const moveDist = force * this.config.gridSpacing * 2.5 * this.config.strength; 
                
                drawX += Math.cos(angle) * moveDist;
                drawY += Math.sin(angle) * moveDist;

                // Optional: Make dots larger or brighter when active
                radius = this.config.dotRadius + (force * 1.5);
                // Simple color interpolation could go here, but for now we swap active
                if(force > 0.2) color = this.config.activeColor;
            }

            // Draw Dot
            this.ctx.beginPath();
            this.ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.closePath();
        });

        requestAnimationFrame(this.animate.bind(this));
    }
}
