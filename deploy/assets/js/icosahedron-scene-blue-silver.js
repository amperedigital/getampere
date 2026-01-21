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
        // Ambient Light (Cool Blue)
        const ambientLight = new THREE.AmbientLight(0xaaccff, 0.2); 
        this.scene.add(ambientLight);

        // Single Main Soft Spotlight (Cool White)
        const spotLight = new THREE.SpotLight(0xe6f3ff, 8); // Brighter spot for contrast

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

        // 1. Lattice (Wireframe) - Silver Blue
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: 0x88b0d1, // Silver Blue
            linewidth: 1,
            opacity: 1,
            transparent: false
        });

        this.icosahedron = new THREE.LineSegments(wireframeGeometry, material);
        this.group.add(this.icosahedron);

        // 1b. Mesh Texture Approach (Fine Grid)
        // Using a highly repeated grid texture to simulate a fine mesh screen
        const canvas = document.createElement('canvas');
        canvas.width = 64; 
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Transparent BG
        ctx.clearRect(0, 0, 64, 64);
        
        // Very thin, sharp mesh lines
        ctx.strokeStyle = '#ffffff'; 
        ctx.lineWidth = 1; // Thinnest possible line
        ctx.beginPath();
        
        // Draw cross-hatch
        // Horizontal
        ctx.moveTo(0, 32); ctx.lineTo(64, 32);
        // Vertical
        ctx.moveTo(32, 0); ctx.lineTo(32, 64);
        ctx.stroke();

        const meshTexture = new THREE.CanvasTexture(canvas);
        meshTexture.wrapS = THREE.RepeatWrapping;
        meshTexture.wrapT = THREE.RepeatWrapping;
        // High repeat to create density (make it look like a screen, not big bars)
        meshTexture.repeat.set(30, 30); 
        meshTexture.anisotropy = 16;
        
        const meshMaterial = new THREE.MeshBasicMaterial({
            map: meshTexture,
            color: 0x88b0d1,      // Silver Blue to match wireframe
            transparent: true,
            opacity: 0.5,         // Increased from 0.15 for better visibility
            side: THREE.DoubleSide,
            depthWrite: false,    // No occlusion
            blending: THREE.AdditiveBlending
        });

        // Use same geometry (detail: 0) so it's perfectly flat against the faces
        const meshShell = new THREE.Mesh(geometry, meshMaterial);
        meshShell.scale.setScalar(0.99); // Just barely inside the wires
        this.group.add(meshShell);

        // 2. Nodes (Vertices)
        this.addNodes(geometry);

        // 3. Central Sphere
        this.addCentralSphere();
    }

    addCentralSphere() {
        // Create a perfectly round sphere in the center
        // Radius reduced by 25% (0.8 -> 0.6)
        const geometry = new THREE.SphereGeometry(0.6, 64, 64);
        
        // Material: Dark Blue Metal
        // Switched to MeshLambertMaterial to completely remove specular highlights (White Ring)
        const material = new THREE.MeshLambertMaterial({
            color: 0x051a24,     // Dark Blue Metal
            emissive: 0x000000,
        });

        this.centralSphere = new THREE.Mesh(geometry, material);
        this.group.add(this.centralSphere);
        
        // Add Procedural "Path" Circuitry
        this.initCircuitryPaths();

        // Add an internal light to make the glass "active" - Blue
        const coreLight = new THREE.PointLight(0x0088ff, 0.4, 8); // Electric Blue core light
        this.centralSphere.add(coreLight);
    }

    initCircuitryPaths() {
        this.circuitCurves = [];
        this.circuitMeshes = []; // Store meshes to animate color
        this.electrons = [];
        
        const sphereRadius = 0.6;
        const surfaceRadius = sphereRadius + 0.005; 
        
        // 1. Materials
        // Trace Material: VertexColors = true to allow individual animation
        const traceMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,  // Important: allow per-vertex color
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending // Glowier look
        });

        // Chip Materials (Motherboard Elements)
        // Various sizes for random "components"
        const chipGeoSmall = new THREE.BoxGeometry(0.04, 0.04, 0.015);
        const chipGeoWide = new THREE.BoxGeometry(0.08, 0.03, 0.015);
        const chipGeoLong = new THREE.BoxGeometry(0.02, 0.08, 0.015);
        
        const chipMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x050505, // Dark silicon/plastic
            roughness: 0.4,
            metalness: 0.8,
            clearcoat: 1.0,
            emissive: 0x000000
        });
        const padMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff }); // Cyan/Blue contacts

        // Helper: Spherical to Cartesian
        const getPos = (phi, theta, r) => {
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            return new THREE.Vector3(x, y, z);
        };

        // 2. PCB Logic - "Manhattan Sphere"
        // Cleanup: Increased count to 90 to close "huge gaps", traces kept sparse for separation
        let numChips = 90; 
        
        for(let i=0; i<numChips; i++) {
            // A. Place Motherboard Component (Chip)
            let phi, theta;

            // Force coverage at poles for first 16 chips
            if (i < 8) {
                // North Pole area - Tighter cluster
                phi = Math.random() * 0.35; 
                theta = Math.random() * Math.PI * 2;
            } else if (i < 16) {
                // South Pole area - Tighter cluster
                phi = Math.PI - (Math.random() * 0.35);
                theta = Math.random() * Math.PI * 2;
            } else {
                // Random Sphere distribution
                phi = Math.acos(2 * Math.random() - 1);
                theta = Math.random() * Math.PI * 2;
            }
            
            // Chips Removed (v1.910) - Pure Circuitry traces only
            // b. Route Parallel Traces from this Cluster Origin
            // Reduced trace count for separation (Circuit vs Mesh)
            const tracesPerChip = 3 + Math.floor(Math.random() * 4); // 3-6 traces (was 5-10)
            
            for (let t=0; t<tracesPerChip; t++) {
                // Determine Start Point (near chip)
                let currentPhi = phi + (Math.random() * 0.08 - 0.04);
                let currentTheta = theta + (Math.random() * 0.08 - 0.04);

                // Longer, more distinct paths
                const numSegs = 6 + Math.floor(Math.random() * 8); 
                
                // Trace Path Generation
                for(let s=0; s<numSegs; s++) {
                    const isVertical = s % 2 === 0; // Alternate Vertical/Horizontal
                    
                    const len = 0.15 + Math.random() * 0.2; // Slightly longer segments
                    
                    let startP = getPos(currentPhi, currentTheta, surfaceRadius);
                    let endP, midP;
                    
                    if (isVertical) {
                        const dir = Math.random() > 0.5 ? 1 : -1;
                        let nextPhi = currentPhi + (len * dir);
                        // Relaxed clamping to allow Pole coverage
                        nextPhi = Math.max(0.01, Math.min(Math.PI - 0.01, nextPhi));

                        endP = getPos(nextPhi, currentTheta, surfaceRadius);
                        midP = startP.clone().add(endP).multiplyScalar(0.5).normalize().multiplyScalar(surfaceRadius);
                        currentPhi = nextPhi;
                    } else {
                        const dir = Math.random() > 0.5 ? 1 : -1;
                        let nextTheta = currentTheta + (len * dir);

                        endP = getPos(currentPhi, nextTheta, surfaceRadius);
                        midP = startP.clone().add(endP).multiplyScalar(0.5).normalize().multiplyScalar(surfaceRadius);
                        currentTheta = nextTheta;
                    }
                    
                    // Build Geometry
                    const curve = new THREE.QuadraticBezierCurve3(startP, midP, endP);
                    this.circuitCurves.push(curve);

                    // Draw Trace with Color Attribute
                    const points = curve.getPoints(8);
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    
                    // Initialize Vertex Colors (Dark Blue Trace default)
                    const colors = [];
                    const baseColor = new THREE.Color(0x0a2a47); // Dark Blue
                    for(let k=0; k<=8; k++) { // 8 segments = 9 points
                        colors.push(baseColor.r, baseColor.g, baseColor.b);
                    }
                    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

                    const trace = new THREE.Line(geometry, traceMaterial);
                    // Store intensity data for animation
                    trace.userData = { intensity: 0 }; 
                    
                    this.centralSphere.add(trace);
                    this.circuitMeshes.push(trace);
                }
            }
        }

        // 2. Initialize Electrons (The "Glow")
        // We use a small geometry + Sprite for "Glowing Dot" effect
        const electronGeometry = new THREE.BoxGeometry(0.012, 0.012, 0.012); 
        const electronMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan
        
        // Create Glow Sprite for Electrons
        const glowTexture = this.createGlowTexture();
        const electronGlowMat = new THREE.SpriteMaterial({ 
            map: glowTexture, 
            color: 0x0088ff, // Electric Blue
            transparent: true, 
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const numElectrons = 150; // High density pulses (150 active)
        for(let i=0; i<numElectrons; i++) {
            const electron = new THREE.Mesh(electronGeometry, electronMaterial);
            
            // Attach Glow Sprite
            const sprite = new THREE.Sprite(electronGlowMat);
            sprite.scale.set(0.06, 0.06, 0.06); // Halo size
            electron.add(sprite);

            electron.visible = false; 
            this.centralSphere.add(electron);
            
            this.electrons.push({
                mesh: electron,
                curveIndex: Math.floor(Math.random() * this.circuitCurves.length), 
                t: Math.random(), 
                speed: 0,
                active: false,
                delay: Math.random() * 100 
            });
        }
    }

    randomSpherePoint(radius) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        return new THREE.Vector3(x, y, z);
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
            color: 0x00ccff, // Cyan tint
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

                // Create Node: Visible Base State (Blue Steel)
                const nodeGeometry = new THREE.SphereGeometry(0.015, 8, 8); // Slightly larger base size
                const nodeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x446688, // Blue Steel
                    emissive: 0x0044aa, // Deep Blue Glow
                    emissiveIntensity: 0.2, // Faint glow
                    roughness: 0.3,
                    metalness: 0.8
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
        
        // Radial Gradient: Blue/White center -> Transparent edge
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(200, 240, 255, 1)'); // Blue-White center
        gradient.addColorStop(0.4, 'rgba(0, 120, 255, 0.4)'); // Electric Blue mid
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
            let sphereActiveFactor = 0; // 0 to 1

            if (candidates.length > 0) {
                // Sort by Z (ascending) to find front-most
                candidates.sort((a, b) => a.z - b.z);
                
                // The front-most candidate in the hot zone is the winner
                bestNode = candidates[0].node;
                
                // Calculate Activity Factor for Global Effects (0.0 to 1.0)
                sphereActiveFactor = Math.max(0, 1.0 - (candidates[0].dist / maxDist));
            }

            // Central Sphere Electrification & Path Animation
            if (this.circuitCurves && this.electrons) {
                // How "active" is the system?
                const activityLevel = sphereActiveFactor; // 0 to 1 based on interaction

                // 1. Decay Trace Intensity (Fade out)
                if (this.circuitMeshes) {
                    const baseR = 0.04; // Dark Blue R
                    const baseG = 0.16; // Dark Blue G
                    const baseB = 0.28; // Dark Blue B
                    
                    this.circuitMeshes.forEach(mesh => {
                        if (mesh.userData.intensity > 0.01) {
                            mesh.userData.intensity *= 0.92; // Fast decay
                            
                            // Apply Color
                            const intensity = mesh.userData.intensity;
                            const r = baseR + (0.6 - baseR) * intensity; // -> 0.6 (Cyan R)
                            const g = baseG + (0.9 - baseG) * intensity; // -> 0.9 (Cyan G)
                            const b = baseB + (1.0 - baseB) * intensity; // -> 1.0 (Cyan B)
                            
                            const colors = mesh.geometry.attributes.color;
                            for (let i = 0; i < colors.count; i++) {
                                colors.setXYZ(i, r, g, b);
                            }
                            colors.needsUpdate = true;
                        } else if (mesh.userData.intensity > 0) {
                            // Reset to exact base if near zero
                            mesh.userData.intensity = 0;
                            const colors = mesh.geometry.attributes.color;
                            for (let i = 0; i < colors.count; i++) {
                                colors.setXYZ(i, baseR, baseG, baseB);
                            }
                            colors.needsUpdate = true;
                        }
                    });
                }

                this.electrons.forEach(e => {
                    // 1. Activate logic
                    if (!e.active) {
                        if (e.delay > 0) {
                            e.delay--;
                        } else {
                             // Probability to spawn based on activity
                             // Always some low background activity (0.01)
                             // High activity when scanning (up to 0.5)
                             if (Math.random() < (0.01 + activityLevel * 0.2)) {
                                 e.active = true;
                                 e.curveIndex = Math.floor(Math.random() * this.circuitCurves.length);
                                 e.t = 0;
                                 e.speed = 0.01 + Math.random() * 0.02 + (activityLevel * 0.03); // Faster when active
                                 e.mesh.visible = true;
                             }
                        }
                    }

                    // 2. Update Position
                    if (e.active) {
                        // Illuminate the trace we are on
                        if (this.circuitMeshes && this.circuitMeshes[e.curveIndex]) {
                            this.circuitMeshes[e.curveIndex].userData.intensity = 1.0;
                        }

                        e.t += e.speed;
                        if (e.t >= 1.0) {
                            // Reset
                            e.active = false;
                            e.mesh.visible = false;
                            e.delay = Math.random() * 20;
                        } else {
                            // Move along curve
                            const curve = this.circuitCurves[e.curveIndex];
                            if (curve) {
                                const pos = curve.getPoint(e.t);
                                e.mesh.position.copy(pos);
                                
                                // Orient Beam along path tangent
                                const tangent = curve.getTangent(e.t).normalize();
                                e.mesh.lookAt(pos.clone().add(tangent));
                            }
                        }
                    }
                });
            }

            // 3. Apply States
            this.nodes.forEach(node => {
                let targetIntensity = 0.2; // Base intensity (not 0)
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
                    targetIntensity = 0.2 + Math.pow(factor, 2) * 5.0; 
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
