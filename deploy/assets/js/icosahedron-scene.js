import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class IcosahedronScene {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        console.log("Icosahedron Scene Initialized - vDesignTwo.1");

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
    }

    initGeometry() {
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Low-density Polygon Sphere (Icosahedron Detail 1: 42 vertices, 80 faces)
        const radius = 1.5;
        const detail = 1; // 1 = "Sphere with dimples" / Low-poly sphere
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
        // Adjusted density for smaller faces (Detail 1 faces are 1/4 size of Detail 0)
        meshTexture.repeat.set(15, 15); 
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

        // Use same geometry (detail: 1) so it's perfectly flat against the faces
        const meshShell = new THREE.Mesh(geometry, meshMaterial);
        meshShell.scale.setScalar(0.99); // Just barely inside the wires
        this.group.add(meshShell);

        // 2. Nodes (Vertices)
        this.addNodes(geometry);

        // 3. Central Sphere
        this.addCentralSphere();
    }

    addCentralSphere() {
        const geometry = new THREE.SphereGeometry(0.6, 64, 64);
        
        // Material: Dark Blue Metal
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
        // Tube Material for thicker traces
        const traceMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a2a47, // Dark Base Color
            emissive: 0x0a2a47, 
            roughness: 0.4,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8,
        });

        const getPos = (phi, theta, r) => {
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            return new THREE.Vector3(x, y, z);
        };

        // 2. PCB Logic - Higher Density
        let numChips = 150; // Increased from 90 to 150 for density
        
        for(let i=0; i<numChips; i++) {
            let phi, theta;

            if (i < 12) {
                // North Pole
                phi = Math.random() * 0.35; 
                theta = Math.random() * Math.PI * 2;
            } else if (i < 24) {
                // South Pole
                phi = Math.PI - (Math.random() * 0.35);
                theta = Math.random() * Math.PI * 2;
            } else {
                phi = Math.acos(2 * Math.random() - 1);
                theta = Math.random() * Math.PI * 2;
            }
            
            // Increased traces per cluster
            const tracesPerChip = 4 + Math.floor(Math.random() * 3); 
            
            for (let t=0; t<tracesPerChip; t++) {
                let currentPhi = phi + (Math.random() * 0.08 - 0.04);
                let currentTheta = theta + (Math.random() * 0.08 - 0.04);

                const numSegs = 5 + Math.floor(Math.random() * 6); 
                
                // Trace Path Generation
                for(let s=0; s<numSegs; s++) {
                    const isVertical = s % 2 === 0;
                    
                    const len = 0.12 + Math.random() * 0.18; 
                    
                    let startP = getPos(currentPhi, currentTheta, surfaceRadius);
                    let endP, midP;
                    
                    if (isVertical) {
                        const dir = Math.random() > 0.5 ? 1 : -1;
                        let nextPhi = currentPhi + (len * dir);
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
                    
                    // Build Geometry - Tube for Width
                    const curve = new THREE.QuadraticBezierCurve3(startP, midP, endP);
                    this.circuitCurves.push(curve);

                    // TubeGeometry for physical width
                    // path, tubularSegments, radius (width), radialSegments, closed
                    const tubeGeo = new THREE.TubeGeometry(curve, 4, 0.003, 4, false); // Radius 0.003 gives thickness
                    
                    // Material clone for individual animation (or use instance colors if perf needed, but cloning material is easier for now with < 1000 objects)
                    const mat = traceMaterial.clone(); 
                    const trace = new THREE.Mesh(tubeGeo, mat);
                    
                    // Store intensity data
                    trace.userData = { intensity: 0 }; 
                    
                    this.centralSphere.add(trace);
                    this.circuitMeshes.push(trace);
                }
            }
        }

        // 2. Initialize Electrons
        const electronGeometry = new THREE.SphereGeometry(0.008, 8, 8); 
        const electronMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan
        
        const glowTexture = this.createGlowTexture();
        const electronGlowMat = new THREE.SpriteMaterial({ 
            map: glowTexture, 
            color: 0x0088ff,
            transparent: true, 
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const numElectrons = 150; 
        for(let i=0; i<numElectrons; i++) {
            const electron = new THREE.Mesh(electronGeometry, electronMaterial);
            
            const sprite = new THREE.Sprite(electronGlowMat);
            sprite.scale.set(0.06, 0.06, 0.06);
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
        
        this.nodes = [];
        
        const glowTexture = this.createGlowTexture();
        const glowMaterial = new THREE.SpriteMaterial({ 
            map: glowTexture, 
            color: 0x00ccff, 
            transparent: true, 
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

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

                const nodeGeometry = new THREE.SphereGeometry(0.015, 8, 8); 
                const nodeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x446688,
                    emissive: 0x0044aa, 
                    emissiveIntensity: 0.2, 
                    roughness: 0.3,
                    metalness: 0.8
                });
                
                const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
                node.position.copy(vertex);
                
                const sprite = new THREE.Sprite(glowMaterial.clone());
                sprite.scale.set(0.6, 0.6, 0.6); 
                sprite.visible = false; 
                node.add(sprite); 
                node.userData.sprite = sprite; 

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
        
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(200, 240, 255, 1)'); 
        gradient.addColorStop(0.4, 'rgba(0, 120, 255, 0.4)'); 
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 

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
        this.controls.autoRotate = false; 
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
        
        this.controls.update();

        if (this.nodes) {
            const tempV = new THREE.Vector3();
            const maxDist = 0.35; 

            const candidates = [];

            this.nodes.forEach(node => {
                node.getWorldPosition(tempV);
                tempV.project(this.camera);

                const dist = Math.sqrt(tempV.x * tempV.x + tempV.y * tempV.y);
                
                if (dist < maxDist) {
                    candidates.push({
                        node: node,
                        dist: dist,
                        z: tempV.z 
                    });
                }
            });

            let bestNode = null;
            let sphereActiveFactor = 0; 

            if (candidates.length > 0) {
                candidates.sort((a, b) => a.z - b.z);
                bestNode = candidates[0].node;
                sphereActiveFactor = Math.max(0, 1.0 - (candidates[0].dist / maxDist));
            }

            if (this.circuitCurves && this.electrons) {
                const activityLevel = sphereActiveFactor; 

                // Decay Mesh Intensity
                if (this.circuitMeshes) {
                    const baseR = 0.04; 
                    const baseG = 0.16; 
                    const baseB = 0.28; 
                    
                    this.circuitMeshes.forEach(mesh => {
                        if (mesh.userData.intensity > 0.01) {
                            mesh.userData.intensity *= 0.92;
                            
                            // Emissive approach for MeshStandardMaterial
                            const intensity = mesh.userData.intensity;
                            const r = baseR + (0.0 - baseR) * intensity;   // -> 0 (Cyan R base)
                            const g = baseG + (0.5 - baseG) * intensity;   // -> 0.5 (Cyan G mid)
                            const b = baseB + (1.0 - baseB) * intensity;   // -> 1.0 (Cyan B max)
                            
                            // Update Emissive Color
                            mesh.material.emissive.setRGB(r, g, b);
                            // Also bump brightness via color slightly
                            mesh.material.color.setRGB(r*0.5, g*0.5, b*0.5);

                        } else if (mesh.userData.intensity > 0) {
                            mesh.userData.intensity = 0;
                            mesh.material.emissive.setRGB(baseR, baseG, baseB);
                        }
                    });
                }

                this.electrons.forEach(e => {
                    if (!e.active) {
                        if (e.delay > 0) {
                            e.delay--;
                        } else {
                             if (Math.random() < (0.01 + activityLevel * 0.2)) {
                                 e.active = true;
                                 e.curveIndex = Math.floor(Math.random() * this.circuitCurves.length);
                                 e.t = 0;
                                 e.speed = 0.01 + Math.random() * 0.02 + (activityLevel * 0.03); 
                                 e.mesh.visible = true;
                             }
                        }
                    }

                    if (e.active) {
                        if (this.circuitMeshes && this.circuitMeshes[e.curveIndex]) {
                            this.circuitMeshes[e.curveIndex].userData.intensity = 1.0;
                        }

                        e.t += e.speed;
                        if (e.t >= 1.0) {
                            e.active = false;
                            e.mesh.visible = false;
                            e.delay = Math.random() * 20;
                        } else {
                            const curve = this.circuitCurves[e.curveIndex];
                            if (curve) {
                                const pos = curve.getPoint(e.t);
                                e.mesh.position.copy(pos);
                                
                                const tangent = curve.getTangent(e.t).normalize();
                                e.mesh.lookAt(pos.clone().add(tangent));
                            }
                        }
                    }
                });
            }

            this.nodes.forEach(node => {
                let targetIntensity = 0.2; 
                let targetScale = 1.0;
                let targetGlowOpacity = 0;

                if (node === bestNode) {
                    node.getWorldPosition(tempV);
                    tempV.project(this.camera);
                    const dist = Math.sqrt(tempV.x * tempV.x + tempV.y * tempV.y);

                    const factor = 1 - (dist / maxDist);
                    targetIntensity = 0.2 + Math.pow(factor, 2) * 5.0; 
                    targetScale = 1 + (factor * 0.4);
                    targetGlowOpacity = Math.pow(factor, 3);
                }

                const sprite = node.userData.sprite;
                
                node.material.emissiveIntensity += (targetIntensity - node.material.emissiveIntensity) * 0.1;
                
                const currentScale = node.scale.x;
                const newScale = currentScale + (targetScale - currentScale) * 0.1;
                node.scale.setScalar(newScale);

                if (targetGlowOpacity > 0.05) {
                    sprite.visible = true;
                    sprite.material.opacity = targetGlowOpacity;
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
