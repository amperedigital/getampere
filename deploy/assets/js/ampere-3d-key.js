import * as THREE from 'three';

export class Ampere3DKey {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        // State
        this.progress = 0;
        
        // Init
        this.initScene();
        this.initGeometry();
        this.initLights();
        this.animate();
        
        // Bind resize
        this.resizeHandler = this.onResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);
    }

    initScene() {
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 0, 10);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
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
        const logoTexture = textureLoader.load(logoBase64);
        
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
        const startX = -Math.PI / 2.1; 
        const endX = -0.2;
        this.mesh.rotation.x = startX + (this.progress * (endX - startX));
        
        this.mesh.rotation.y = this.progress * -0.4;
        this.mesh.rotation.z = this.progress * -0.1;

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
        // Idle Float
        if (this.mesh) {
            this.mesh.position.y = Math.sin(time) * 0.05;
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
        // Basic three.js cleanup
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
        // Could expand to dispose geometries/materials if needed
    }
}// Release v1.593
