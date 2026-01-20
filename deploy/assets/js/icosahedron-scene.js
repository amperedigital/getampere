import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class IcosahedronScene {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        console.log("Icosahedron Scene Initialized");

        this.initScene();
        this.initLights();
        this.initGeometry();
        this.initControls();
        this.handleResize();
        this.animate();
    }

    initScene() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05060f); // Dark background matching project theme

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.z = 5;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }

    initLights() {
        // Ambient Light (Soft but warm base)
        const ambientLight = new THREE.AmbientLight(0xffccaa, 1.0); 
        this.scene.add(ambientLight);

        // Single Main Soft Spotlight (Top Left) - Wide & Diffused
        const spotLight = new THREE.SpotLight(0xffebd6, 5); // Warm white
        spotLight.position.set(-10, 10, 10);
        spotLight.angle = Math.PI / 3; // Wide angle (60 deg)
        spotLight.penumbra = 1.0; // Max softness/diffusion
        spotLight.decay = 2;
        spotLight.distance = 50;
        this.scene.add(spotLight);
        
        // Removed specific Rim/Fill lights to focus on single diffused source
    }

    initGeometry() {
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Icosahedron: 12 vertices, 20 faces, 30 edges
        const radius = 1.5;
        const detail = 0; // 0 = standard icosahedron
        const geometry = new THREE.IcosahedronGeometry(radius, detail);

        // 1. Lattice (Wireframe)
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: 0xb87333, // Copper wire
            linewidth: 1,
            opacity: 1,
            transparent: false
        });

        this.icosahedron = new THREE.LineSegments(wireframeGeometry, material);
        this.group.add(this.icosahedron);

        // 2. Nodes (Vertices)
        this.addNodes(geometry);

        // 3. Central Sphere
        this.addCentralSphere();
    }

    addCentralSphere() {
        // Create a perfectly round sphere in the center
        // Radius reduced by 25% (0.8 -> 0.6)
        const geometry = new THREE.SphereGeometry(0.6, 64, 64);
        
        // Material: Real Copper (Browny-Red)
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xb87333,     // Real Copper (brown/red base)
            emissive: 0x5a2010,  // Dark reddish-brown internal glow
            emissiveIntensity: 1.0, // Significantly reduced (was 3.0) to reveal surface color
            roughness: 0.35,     // Frosted metal
            metalness: 0.6,      // Higher metalness for copper definition
            transmission: 0.4,   // Denser material
            thickness: 1.5,
            clearcoat: 1.0,      
            clearcoatRoughness: 0.3, 
            ior: 1.5,
            attenuationColor: new THREE.Color(0x8a4020), // Deep copper absorption
            attenuationDistance: 1.5
        });

        this.centralSphere = new THREE.Mesh(geometry, material);
        this.group.add(this.centralSphere);

        // Add an internal light to make the glass "active" - Lower intensity
        const coreLight = new THREE.PointLight(0xff8855, 1.5, 8);
        this.centralSphere.add(coreLight);
    }

    addNodes(geometry) {
        const positionAttribute = geometry.getAttribute('position');
        const vertex = new THREE.Vector3();
        
        // Storage for animation
        this.nodes = [];
        
        // Glow Texture (Shared)
        const glowTexture = this.createGlowTexture();
        const glowMaterial = new THREE.SpriteMaterial({ 
            map: glowTexture, 
            color: 0xffaa55, // Copper/Amber tint
            transparent: true, 
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Deduplicate vertices efficiently
        const uniquePoints = [];
        const threshold = 0.001;

        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            
            let isUnique = true;
            for (const p of uniquePoints) {
                if (p.distanceTo(vertex) < threshold) {
                    isUnique = false;
                    break;
                }
            }
            
            if (isUnique) {
                uniquePoints.push(vertex.clone());

                // Create Node: 3D Sphere with Physical Material for shading/glow
                // Base: Copper, Reduced Size (50%)
                const nodeGeometry = new THREE.SphereGeometry(0.03, 32, 32); 
                const nodeMaterial = new THREE.MeshPhysicalMaterial({ 
                    color: 0xb87333,    // Copper base
                    emissive: 0xff8855, // Amber heat
                    emissiveIntensity: 0,
                    roughness: 0.3,     // Metallic rough
                    metalness: 0.8,     // Metallic
                    transmission: 0,    // Solid metal
                    clearcoat: 1.0,     // Shiny coat
                });
                
                const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
                node.position.copy(vertex);
                
                // Add Glow Sprite (Halo)
                const sprite = new THREE.Sprite(glowMaterial.clone());
                sprite.scale.set(0.6, 0.6, 0.6); // Start size
                sprite.visible = false; // Hidden by default
                node.add(sprite); // Attach to node
                node.userData.sprite = sprite; // Reference for animation

                this.group.add(node);
                this.nodes.push(node);
            }
        }
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Radial Gradient: Amber/White center -> Transparent edge
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 220, 180, 1)'); // Hot White/Amber center
        gradient.addColorStop(0.4, 'rgba(255, 100, 50, 0.4)'); // Copper Orange mid
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fade out

        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.autoRotate = false; // User controls rotation
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (!this.container) return;
            
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls for damping
        this.controls.update();

        // Calculate Node Glow based on viewport center proximity
        if (this.nodes) {
            const tempV = new THREE.Vector3();
            // Threshold for "center radius"
            const maxDist = 0.35; 

            // 1. Identify "Active" Candidates (Near Center)
            const candidates = [];

            this.nodes.forEach(node => {
                // Get world position
                node.getWorldPosition(tempV);
                
                // Project to Screen Coordinates (NDC: -1 to 1)
                tempV.project(this.camera);

                // Calculate radial distance from center (0,0) in X/Y plane only
                const dist = Math.sqrt(tempV.x * tempV.x + tempV.y * tempV.y);
                
                // Check if in "hot zone"
                if (dist < maxDist) {
                    candidates.push({
                        node: node,
                        dist: dist,
                        z: tempV.z // Depth (NDC)
                    });
                }
            });

            // 2. Select the ONE best candidate (closest to camera = smallest Z in NDC)
            let bestNode = null;
            if (candidates.length > 0) {
                // Sort by Z (ascending) to find front-most
                candidates.sort((a, b) => a.z - b.z);
                
                // The front-most candidate in the hot zone is the winner
                // Note: We might want to stricter 'dist' check for the winner?
                // For now, if it's in the zone and in front, it wins.
                bestNode = candidates[0].node;
            }

            // 3. Apply States
            this.nodes.forEach(node => {
                let targetIntensity = 0;
                let targetScale = 1.0;
                let targetGlowOpacity = 0;

                // Is this the chosen one?
                if (node === bestNode) {
                    // Recalculate dist for intensity ramp
                    node.getWorldPosition(tempV);
                    tempV.project(this.camera);
                    const dist = Math.sqrt(tempV.x * tempV.x + tempV.y * tempV.y);

                    const factor = 1 - (dist / maxDist);
                    // Power curve for bright snap
                    targetIntensity = Math.pow(factor, 2) * 5.0; 
                    targetScale = 1 + (factor * 0.4);
                    targetGlowOpacity = Math.pow(factor, 3);
                }

                // Apply
                const sprite = node.userData.sprite;
                
                // Lerp for smoothness (cleaner transition)
                node.material.emissiveIntensity += (targetIntensity - node.material.emissiveIntensity) * 0.1;
                
                const currentScale = node.scale.x;
                const newScale = currentScale + (targetScale - currentScale) * 0.1;
                node.scale.setScalar(newScale);

                // Halo
                if (targetGlowOpacity > 0.05) {
                    sprite.visible = true;
                    // Flash opacity
                    sprite.material.opacity = targetGlowOpacity;
                    // Stable size (No flicker)
                    sprite.scale.setScalar(0.8 * newScale); 
                } else {
                    sprite.visible = false;
                    sprite.material.opacity = 0;
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}
