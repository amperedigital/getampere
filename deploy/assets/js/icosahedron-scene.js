import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

export class IcosahedronScene {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        console.log("Icosahedron Scene Initialized - vDesignTwo.4 (PCB Terminals)");

        this.initScene();
        this.initLights();
        this.initGeometry();
        this.initControls();
        this.handleResize();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05060f); 

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0xaaccff, 0.2); 
        this.scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xe6f3ff, 8); 
        spotLight.position.set(-10, 10, 10);
        spotLight.angle = Math.PI / 3; 
        spotLight.penumbra = 1.0;
        spotLight.decay = 2;
        spotLight.distance = 50;
        this.scene.add(spotLight);
    }

    initGeometry() {
        this.group = new THREE.Group();
        this.scene.add(this.group);

        const radius = 1.5;
        const detail = 1; 
        const geometry = new THREE.IcosahedronGeometry(radius, detail);

        // 1. Lattice 
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: 0x88b0d1, 
            linewidth: 1,
            opacity: 1,
            transparent: false
        });

        this.icosahedron = new THREE.LineSegments(wireframeGeometry, material);
        this.group.add(this.icosahedron);

        // 1b. Mesh Texture Approach
        const canvas = document.createElement('canvas');
        canvas.width = 64; 
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, 64, 64);
        ctx.strokeStyle = '#ffffff'; 
        ctx.lineWidth = 1; 
        ctx.beginPath();
        
        ctx.moveTo(0, 32); ctx.lineTo(64, 32);
        ctx.moveTo(32, 0); ctx.lineTo(32, 64);
        ctx.stroke();

        const meshTexture = new THREE.CanvasTexture(canvas);
        meshTexture.wrapS = THREE.RepeatWrapping;
        meshTexture.wrapT = THREE.RepeatWrapping;
        meshTexture.repeat.set(15, 15); 
        meshTexture.anisotropy = 16;
        
        const meshMaterial = new THREE.MeshBasicMaterial({
            map: meshTexture,
            color: 0x88b0d1,      
            transparent: true,
            opacity: 0.5,         
            side: THREE.DoubleSide,
            depthWrite: false,    
            blending: THREE.AdditiveBlending
        });

        const meshShell = new THREE.Mesh(geometry, meshMaterial);
        meshShell.scale.setScalar(0.99); 
        this.group.add(meshShell);

        // 2. Nodes
        this.addNodes(geometry);

        // 3. Central Sphere
        this.addCentralSphere();
    }

    addCentralSphere() {
        const geometry = new THREE.SphereGeometry(0.6, 64, 64);
        
        const material = new THREE.MeshLambertMaterial({
            color: 0x051a24,     
            emissive: 0x000000,
        });

        this.centralSphere = new THREE.Mesh(geometry, material);
        this.group.add(this.centralSphere);
        
        this.initCircuitryPaths();

        const coreLight = new THREE.PointLight(0x0088ff, 0.4, 8);
        this.centralSphere.add(coreLight);
    }

    getPos(phi, theta, r) {
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    initCircuitryPaths() {
        this.circuitMeshes = []; 
        this.electrons = [];
        this.fatLines = []; 
        this.paths = []; 
        this.pads = []; // Store terminal pads

        const surfaceRadius = 0.605; 
        
        // Use a merged geometry approach for static pads to save draw calls?
        // Actually, let's stick to simple meshes for now, but optimize if needed.
        // We'll use a single geometry/material for all pads.
        const padGeometry = new THREE.CircleGeometry(0.006, 8); // Flat pads like PCB vias
        const padMaterial = new THREE.MeshBasicMaterial({ color: 0x0a4a6e, side: THREE.DoubleSide }); 

        // --- BUS GENERATION PARAMETERS ---
        const numBuses = 35; // Increased slightly for better coverage
        const spacing = 0.018; // Tighter parallel lines
        
        for (let b = 0; b < numBuses; b++) {
            let currentPhi = Math.PI * 0.15 + Math.random() * (Math.PI * 0.7); 
            let currentTheta = Math.random() * Math.PI * 2;
            
            const lanes = 2 + Math.floor(Math.random() * 3); 
            const steps = 2 + Math.floor(Math.random() * 5); // Longer paths
            
            let isVertical = Math.random() > 0.5;

            // Track start points of lanes to place pads
            // We need to place pads at the very START of a bus and the very END of a bus
            // But segments are drawn step-by-step.
            
            // Let's store the current "head" position of each lane
            let laneHeads = [];
            for(let l=0; l<lanes; l++) {
                 // Calculate initial lane positions
                 const laneOffset = (l - (lanes-1)/2) * spacing;
                 let startPhi = currentPhi;
                 let startTheta = currentTheta;
                 
                 // Initial adjustment based on PERPENDICULAR to travel direction?
                 // If we start vertical, offset is Theta.
                 if (isVertical) {
                     startTheta += laneOffset;
                 } else {
                     startPhi += laneOffset;
                 }
                 
                 laneHeads.push({ phi: startPhi, theta: startTheta });
                 
                 // Place START PAD
                 const pos = this.getPos(startPhi, startTheta, surfaceRadius);
                 const pad = new THREE.Mesh(padGeometry, padMaterial);
                 pad.position.copy(pos);
                 pad.lookAt(new THREE.Vector3(0,0,0)); // Look at center (flat on surface)
                 this.centralSphere.add(pad);
            }

            for (let s = 0; s < steps; s++) {
                const length = 0.15 + Math.random() * 0.35; 
                const dir = Math.random() > 0.5 ? 1 : -1;

                // Move the "cursor" (center of bus)
                let endPhi = currentPhi;
                let endTheta = currentTheta;

                if (isVertical) {
                     endPhi += (length * dir);
                     endPhi = Math.max(0.1, Math.min(Math.PI - 0.1, endPhi));
                } else {
                     endTheta += (length * dir);
                }

                // Draw segments for each lane connecting prevHead to newHead
                for(let l=0; l<lanes; l++) {
                    const head = laneHeads[l];
                    
                    // Destination calculation is tricky because we turn. 
                    // But in Manhattan steps, we move straight.
                    // The offset is constant relative to the center line.
                    
                    let targetPhi = endPhi;
                    let targetTheta = endTheta;
                    
                    const laneOffset = (l - (lanes-1)/2) * spacing;
                    
                    if (isVertical) {
                        targetTheta += laneOffset;
                    } else {
                        targetPhi += laneOffset;
                    }

                    // Geometry generation (Arc)
                    const segmentPoints = [];
                    const divisions = 6;
                    
                    for(let k=0; k<=divisions; k++) {
                        const t = k/divisions;
                        const tmpPhi = head.phi + (targetPhi - head.phi) * t;
                        const tmpTheta = head.theta + (targetTheta - head.theta) * t;
                        const vec = this.getPos(tmpPhi, tmpTheta, surfaceRadius);
                        segmentPoints.push(vec.x, vec.y, vec.z);
                    }

                    const geometry = new LineGeometry();
                    geometry.setPositions(segmentPoints);

                    const mat = new LineMaterial({
                        color: 0x0a2a47,
                        linewidth: 2.5, 
                        worldUnits: false,
                        dashed: false,
                        alphaToCoverage: true,
                        transparent: true,
                        opacity: 0.8
                    });
                    
                    mat.resolution.set(this.width, this.height);

                    const line = new Line2(geometry, mat);
                    line.computeLineDistances();
                    line.userData = { intensity: 0 }; 

                    this.centralSphere.add(line);
                    this.circuitMeshes.push(line);
                    this.fatLines.push(mat);

                    this.paths.push({
                         phiStart: head.phi, thetaStart: head.theta,
                         phiEnd: targetPhi, thetaEnd: targetTheta,
                         radius: surfaceRadius,
                         mesh: line 
                    });

                    // Update head
                    head.phi = targetPhi;
                    head.theta = targetTheta;
                }

                currentPhi = endPhi;
                currentTheta = endTheta;
                isVertical = !isVertical;
            }

            // Place END PADS
            for(let l=0; l<lanes; l++) {
                 const head = laneHeads[l];
                 const pos = this.getPos(head.phi, head.theta, surfaceRadius);
                 const pad = new THREE.Mesh(padGeometry, padMaterial);
                 pad.position.copy(pos);
                 pad.lookAt(new THREE.Vector3(0,0,0));
                 this.centralSphere.add(pad);
            }
        }

        // 2. Initialize Electrons
        const electronGeometry = new THREE.SphereGeometry(0.008, 8, 8); 
        const electronMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); 
        
        const glowTexture = this.createGlowTexture();
        const electronGlowMat = new THREE.SpriteMaterial({ 
            map: glowTexture, 
            color: 0x0088ff,
            transparent: true, 
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const numElectrons = 80; 
        for(let i=0; i<numElectrons; i++) {
            const electron = new THREE.Mesh(electronGeometry, electronMaterial);
            
            const sprite = new THREE.Sprite(electronGlowMat);
            sprite.scale.set(0.06, 0.06, 0.06);
            electron.add(sprite);

            electron.visible = false; 
            this.centralSphere.add(electron);
            
            this.electrons.push({
                mesh: electron,
                pathIndex: Math.floor(Math.random() * this.paths.length), 
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
        return this.getPos(phi, theta, radius);
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
            
            if (this.fatLines) {
                 this.fatLines.forEach(mat => {
                     mat.resolution.set(this.width, this.height);
                 });
            }
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

            // Circuitry Animation
            if (this.paths && this.electrons) {
                const activityLevel = sphereActiveFactor; 

                // Decay Mesh Intensity
                if (this.circuitMeshes) {
                    const baseR = 0.04; 
                    const baseG = 0.16; 
                    const baseB = 0.28; 
                    
                    this.circuitMeshes.forEach(mesh => {
                        if (mesh.userData.intensity > 0.01) {
                            mesh.userData.intensity *= 0.92;
                            
                            const intensity = mesh.userData.intensity;
                            const r = baseR + (0.0 - baseR) * intensity;   
                            const g = baseG + (0.6 - baseG) * intensity;   
                            const b = baseB + (1.0 - baseB) * intensity;   
                            
                            mesh.material.color.setRGB(r, g, b);
                            mesh.material.opacity = 0.8 + (0.2 * intensity);

                        } else if (mesh.userData.intensity > 0) {
                            mesh.userData.intensity = 0;
                            mesh.material.color.setRGB(baseR, baseG, baseB);
                            mesh.material.opacity = 0.8;
                        }
                    });
                }

                this.electrons.forEach(e => {
                    if (!e.active) {
                        if (e.delay > 0) {
                            e.delay--;
                        } else {
                             if (Math.random() < (0.02 + activityLevel * 0.1)) {
                                 e.active = true;
                                 e.pathIndex = Math.floor(Math.random() * this.paths.length);
                                 e.t = 0;
                                 e.speed = 0.01 + Math.random() * 0.04 + (activityLevel * 0.03); 
                                 e.mesh.visible = true;
                             }
                        }
                    }

                    if (e.active) {
                        const pathId = e.pathIndex;
                        if (this.circuitMeshes && this.circuitMeshes[pathId]) {
                            this.circuitMeshes[pathId].userData.intensity = 1.0;
                        }

                        e.t += e.speed;
                        if (e.t >= 1.0) {
                            e.active = false;
                            e.mesh.visible = false;
                            e.delay = Math.random() * 30;
                        } else {
                            const path = this.paths[pathId];
                            if (path) {
                                // Interpolate position on the sphere arc
                                const currentPhi = path.phiStart + (path.phiEnd - path.phiStart) * e.t;
                                const currentTheta = path.thetaStart + (path.thetaEnd - path.thetaStart) * e.t;
                                const pos = this.getPos(currentPhi, currentTheta, path.radius);
                                
                                e.mesh.position.copy(pos);
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
