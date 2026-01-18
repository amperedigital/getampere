import * as THREE from 'three';

export class Ampere3DKey {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        console.log("Ampere3DKey v1.715 Loaded (Pitched Forward)"); // DEBUG VERSION

        // State
        this.progress = 0;
        
        // Mouse Interaction State
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        
        // Fidget Interaction State
        this.targetPress = 0;
        this.currentPress = 0;

        // Init
        this.initScene();
        this.initGeometry();
        this.initLights();
        this.animate();
        
        // Bind handlers
        this.resizeHandler = this.onResize.bind(this);
        this.mouseMoveHandler = this.onMouseMove.bind(this);
        this.mouseLeaveHandler = this.onMouseLeave.bind(this);
        this.mouseDownHandler = this.onMouseDown.bind(this);
        this.mouseUpHandler = this.onMouseUp.bind(this);

        window.addEventListener('resize', this.resizeHandler);
        
        // GLOBAL INTERACTION (Window-Scope)
        // User requested wide scoping ("a lot wider").
        // We track the mouse relative to the entire screen.
        // The effect's visibility is gated by 'this.progress' (scroll position) in animate().
        
        window.addEventListener('mousemove', this.mouseMoveHandler);
        
        // Touch Move Support (Mobile Fidget)
        // Use passive listener to ensure scrolling remains smooth
        window.addEventListener('touchmove', this.mouseMoveHandler, {passive: true});
        
        // Handle "leaving the window"
        // We attach to multiple targets to be robust against iframes/editors/fast movements
        document.body.addEventListener('mouseleave', this.mouseLeaveHandler);
        document.addEventListener('mouseleave', this.mouseLeaveHandler);
        window.addEventListener('mouseout', (e) => {
            if (!e.relatedTarget && !e.toElement) {
                this.mouseLeaveHandler();
            }
        });
        window.addEventListener('blur', this.mouseLeaveHandler);

        // Click Interaction (Focused on key)
        this.container.addEventListener('mousedown', this.mouseDownHandler);
        this.container.addEventListener('touchstart', this.mouseDownHandler, {passive: true});

        // Release anywhere (Stop Interaction)
        window.addEventListener('mouseup', this.mouseUpHandler);
        window.addEventListener('touchend', this.mouseUpHandler);
    }

    onMouseMove(event) {
        // Calculate mouse position relative to WINDOW (Screen Center)
        // -1 to 1 range
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        
        let clientX, clientY;

        if (event.touches && event.touches.length > 0) {
            // Touch Event
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // Mouse Event
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        const x = (clientX / winW) * 2 - 1;
        const y = -(clientY / winH) * 2 + 1; // Invert Y

        this.targetMouseX = x;
        this.targetMouseY = y;
    }

    onMouseLeave() {
        // Reset to center when mouse leaves window
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        if(this.renderer) this.renderer.domElement.style.cursor = 'grab';
    }

    onMouseDown() {
        this.targetPress = 1;
        if(this.renderer) this.renderer.domElement.style.cursor = 'grabbing';
    }

    onMouseUp() {
        this.targetPress = 0;
        
        // Mobile/Touch: When finger lifts, also reset the Tilt (X/Y)
        // because there is no "hover" state on mobile to return to.
        this.targetMouseX = 0;
        this.targetMouseY = 0;

        if(this.renderer) this.renderer.domElement.style.cursor = 'grab';
    }

    initScene() {
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 0, 10);

        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Ensure Canvas receives Pointer Events
        this.renderer.domElement.style.pointerEvents = 'auto'; // Force events
        this.renderer.domElement.style.cursor = 'grab'; // Indicate interaction
        // Visual: Hide until loaded
        this.renderer.domElement.style.opacity = '0';
        this.renderer.domElement.style.transition = 'opacity 0.5s ease-out';
        
        this.container.appendChild(this.renderer.domElement);
    }

    initGeometry() {
        // Define the shape (Rounded Square)
        const shape = new THREE.Shape();
        const size = 3.5;
        const radius = 0.25; // Tight corners
        const x = -size/2, y = -size/2;
        
        // Draw Rounded Rect path
        shape.moveTo(x, y + radius);
        shape.lineTo(x, y + size - radius);
        shape.quadraticCurveTo(x, y + size, x + radius, y + size);
        shape.lineTo(x + size - radius, y + size);
        shape.quadraticCurveTo(x + size, y + size, x + size, y + size - radius);
        shape.lineTo(x + size, y + radius);
        shape.quadraticCurveTo(x + size, y, x + size - radius, y);
        shape.lineTo(x + radius, y);
        shape.quadraticCurveTo(x, y, x, y + radius);

        const extrudeSettings = {
            steps: 2,
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.15,
            bevelSize: 0.15,
            bevelSegments: 32,
            curveSegments: 64
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        // UV Mapping
        const posAttribute = geometry.attributes.position;
        const uvAttribute = geometry.attributes.uv;
        const count = posAttribute.count;
        
        for (let i = 0; i < count; i++) {
            const px = posAttribute.getX(i);
            const py = posAttribute.getY(i);
            
            // Asymmetric UV Mapping for Bevels
            // X: -1.75 to 1.90
            // Y: -1.90 to 1.90
            const u = (px - (-1.75)) / (1.90 - (-1.75));
            const v = (py - (-1.90)) / (1.90 - (-1.90));
            
            uvAttribute.setXY(i, u, v);
        }

        // Texture Generation (White BG, Navy Logo, Full Bleed)
        // High Res + Anisotropy
        const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 424.1 423.6">
            <rect width="100%" height="100%" fill="#ffffff"/> 
            <path fill="#0f172a" d="M4.8,334c26.1,60.7,121.1,14.8,193.6-17.2L103.9,97.2C65.5,165.5-21.3,273.4,4.8,334Z"></path>
            <path fill="#0f172a" d="M424.1,423.3l-1-423.3h-210.7c-12.4,0-20.8,12.7-16,24.1l161.1,383.3c4.1,9.7,13.6,16,24.1,16h42.5Z"></path>
        </svg>
        `;
        
        const logoBase64 = "data:image/svg+xml;base64," + btoa(svgString);
        const textureLoader = new THREE.TextureLoader();
        const logoTexture = textureLoader.load(logoBase64, () => {
            // Reveal canvas only when texture is ready
            // Small timeout to ensure first frame render with texture
            setTimeout(() => {
                this.renderer.domElement.style.opacity = '1';
            }, 50);
        });
        
        // High Quality Filtering
        logoTexture.anisotropy = this.renderer.capabilities.maxAnisotropy;
        logoTexture.minFilter = THREE.LinearMipmapLinearFilter;
        logoTexture.magFilter = THREE.LinearFilter;
        logoTexture.generateMipmaps = true;
        
        logoTexture.colorSpace = THREE.SRGBColorSpace;

        // Materials
        const whiteMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1,
            clearcoat: 1.0, 
            clearcoatRoughness: 0.1
        });
        
        const logoMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: logoTexture,
            roughness: 0.2,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });

        const materials = [logoMaterial, whiteMaterial];
        this.mesh = new THREE.Mesh(geometry, materials);
        
        // Scale down significantly (Factor 0.70)
        console.log("Ampere3DKey: Applied scale 0.70");
        this.mesh.scale.set(0.70, 0.70, 0.70);

        // Initial Start State
        // Face down (-PI/2.1), slightly tilted
        this.mesh.rotation.x = -Math.PI / 2.1; 
        this.scene.add(this.mesh);
    }

    initLights() {
        // Ambient (Starts Dark)
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.scene.add(this.ambientLight);

        // Rim (Starts Bright)
        this.rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.rimLight.position.set(0, 5, -5);
        this.scene.add(this.rimLight);

        // Main (Starts Off)
        this.mainLight = new THREE.DirectionalLight(0xffffff, 0); 
        this.mainLight.position.set(2, 2, 10);
        this.scene.add(this.mainLight);

        // Specular Sweep (Starts Off)
        this.shinyLight = new THREE.PointLight(0xffffff, 0, 10);
        this.shinyLight.position.set(-5, 0, 5);
        this.scene.add(this.shinyLight);
    }

    /**
     * Updates the animation state based on scroll progress.
     * @param {number} progress - 0.0 to 1.0
     */
    setProgress(progress) {
        this.progress = Math.max(0, Math.min(1, progress));

        // 1. Rotation Reveal
        // Handled in animate() loop to combine with mouse interaction

        // 2. Lighting Reveal
        this.ambientLight.intensity = 0.05 + (this.progress * 0.85); // Dark -> Light
        this.mainLight.intensity = this.progress * 1.5;              // Off -> On
        this.rimLight.intensity = 2.0 - (this.progress * 1.5);       // Bright -> Dim

        // 3. Specular Sweep
        const lightX = -6 + (this.progress * 14); 
        this.shinyLight.position.set(lightX, 2, 4);
        this.shinyLight.intensity = Math.sin(this.progress * Math.PI) * 50; 
    }

    animate() {
        if (!this.renderer) return;

        requestAnimationFrame(this.animate.bind(this));
        
        const time = Date.now() * 0.001;

        if (this.mesh) {
             // Smoothly interpolate mouse values
             this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
             this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

             // Interpolate Press State (Springy)
             this.currentPress += (this.targetPress - this.currentPress) * 0.15;

             // Enhanced Floating Effect
             // 1. Vertical Bobbing (Deeper and slightly faster mechanism)
             this.mesh.position.y = Math.sin(time * 1.5) * 0.15;
             
             // 2. Push Effect (Z-depth)
             // Moves object away from camera when clicked (-3 units back)
             this.mesh.position.z = this.currentPress * -3.0;

             // 3. Rotational Logic
             // Base (Scroll) + Wobble (Time) + Interaction (Mouse) + Push (Click)

             // X Axis (Pitch - Flip)
             // "Pitch it forward" -> Tilt top toward camera (Less negative X)
             // -PI/2 is Flat (-1.57). 
             // We want it tilted forward to catch the main light (coming from front-top-right)
             // -1.2 is roughly ~68 degrees (tilted forward significantly)
             const startX = -1.2; 
             const endX = -0.2;
             const baseX = startX + (this.progress * (endX - startX));
             
             // Multiply Interaction by Progress (Only fidget when visible)
             const interactionWeight = Math.max(0, this.progress); 
             
             this.mesh.rotation.x = baseX - (this.mouseY * 0.8 * interactionWeight) - (this.currentPress * 0.5);
             
             // Y Axis (Turn) 
             // Standard scroll turn
             const startY = 0;
             const endY = -0.4;
             const baseY = startY + (this.progress * (endY - startY));
             
             const wobbleY = Math.cos(time * 0.7) * 0.05;
             this.mesh.rotation.y = baseY + wobbleY + (this.mouseX * 0.8 * interactionWeight);

             // Z Axis (Bank)
             // Positive Z = Counter-Clockwise (Right Up, Left Down)
             // Subtle angle to catch light without looking "broken"
             const startZ = 0.08;
             const endZ = 0.20; 
             const baseZ = startZ + (this.progress * (endZ - startZ));

             const wobbleZ = Math.sin(time * 1.1) * 0.015;
             this.mesh.rotation.z = baseZ + wobbleZ + (this.mouseX * 0.2 * interactionWeight);
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        if (!this.container) return;
        
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        if (this.camera) {
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        }
        
        if (this.renderer) {
            this.renderer.setSize(this.width, this.height);
        }
    }
    
    dispose() {
        window.removeEventListener('resize', this.resizeHandler);
        // Remove window listeners
        window.removeEventListener('mouseup', this.mouseUpHandler);
        window.removeEventListener('touchend', this.mouseUpHandler);
        
        if (this.container) {
            this.container.removeEventListener('mousemove', this.mouseMoveHandler);
            this.container.removeEventListener('mouseleave', this.mouseLeaveHandler);
            this.container.removeEventListener('mousedown', this.mouseDownHandler);
            this.container.removeEventListener('touchstart', this.mouseDownHandler);
        }

        // Basic three.js cleanup
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
        // Could expand to dispose geometries/materials if needed
    }
}// Release v1.593
// Release v1.594 - Multi-instance support
