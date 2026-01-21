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

        console.log("Icosahedron Scene Initialized - vDesignTwo.10 (Random RGB & Subtle Halo)");

        this.lightsActive = true; 

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
        // Boosted Ambient for visibility
        const ambientLight = new THREE.AmbientLight(0xaaccff, 0.5); 
        this.scene.add(ambientLight);

        // Main Key Light
        const spotLight = new THREE.SpotLight(0xe6f3ff, 12); 
        spotLight.position.set(-10, 10, 10);
        spotLight.angle = Math.PI / 3; 
        spotLight.penumbra = 1.0;
        spotLight.decay = 2;
        spotLight.distance = 50;
        this.scene.add(spotLight);

        // Rim Light (Blue) for definition on the dark side
        const rimLight = new THREE.SpotLight(0x0088ff, 10);
        rimLight.position.set(10, 0, 5);
        rimLight.lookAt(0, 0, 0);
        rimLight.penumbra = 1;
        this.scene.add(rimLight);
    }

    initGeometry() {
        this.group = new THREE.Group();
        this.group.rotation.x = Math.PI / 2; 
        this.scene.add(this.group);

        const radius = 1.5;
        const detail = 2; 
        const geometry = new THREE.IcosahedronGeometry(radius, detail);

        // 1. Lattice 
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: 0x4e6578, 
            linewidth: 1,
            opacity: 0.6,
            transparent: true
        });

        this.icosahedron = new THREE.LineSegments(wireframeGeometry, material);
        this.group.add(this.icosahedron);

        // 2. Nodes
        this.addNodes(geometry);

        // 3. Central Sphere
        this.addCentralSphere();
    }

    addCentralSphere() {
        const geometry = new THREE.SphereGeometry(0.864, 64, 64);
        // Metal Material Fix: Much lighter base color and adjusted light response
        const material = new THREE.MeshStandardMaterial({
            color: 0x8899aa,     // Light Steel / Silver
            metalness: 0.6,      // 60% Metal
            roughness: 0.25,     // Polished but diffusing slightly
            emissive: 0x001122,  // Slight blue emission to prevent crushed blacks
            emissiveIntensity: 0.2
        });

        this.centralSphere = new THREE.Mesh(geometry, material);
        this.group.add(this.centralSphere);
        
        this.initCircuitryPaths();

        // 20% Light Intensity as requested
        const coreLight = new THREE.PointLight(0x0088ff, 0.2, 8);
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
        this.routes = []; 
        this.pads = []; 

        const surfaceRadius = 0.87; 
        const padGeometry = new THREE.CircleGeometry(0.0126, 8); 
        const padMaterial = new THREE.MeshBasicMaterial({ color: 0x0b5c85, side: THREE.DoubleSide }); 

        // v1.982: High Density for Wrapping
        const PHI_STEPS = 90;   
        const THETA_STEPS = 120; 
        
        const phiStepSize = Math.PI / PHI_STEPS;
        const thetaStepSize = (Math.PI * 2) / THETA_STEPS;
        
        // v1.983: "Chips & Traces" Design
        const gridMap = new Set(); 
        const chipPorts = []; // Start points for traces
        
        // Helper: Place a "Chip" (Grid of pads)
        const createChip = (cPhi, cTheta, w, h) => {
             // Center valid?
             if(cPhi - h < 2 || cPhi + h > PHI_STEPS - 2) return;
             
             // Check collisions
             for(let i = 0; i < w; i++) {
                 for(let j = 0; j < h; j++) {
                     let p = cPhi + j;
                     let t = (cTheta + i + THETA_STEPS * 10) % THETA_STEPS;
                     if(gridMap.has(`${p},${t}`)) return;
                 }
             }

             // Place Chip
             for(let i = 0; i < w; i++) {
                 for(let j = 0; j < h; j++) {
                     let p = cPhi + j;
                     let t = (cTheta + i + THETA_STEPS * 10) % THETA_STEPS;
                     gridMap.add(`${p},${t}`);
                     
                     // Visual Pad
                     const phi = p * phiStepSize;
                     const theta = t * thetaStepSize;
                     const pos = this.getPos(phi, theta, surfaceRadius);
                     const pad = new THREE.Mesh(padGeometry, padMaterial.clone());
                     pad.material.transparent = true; // Fix Material transparency
                     pad.material.opacity = 0.55; // Darker traces request (0.5+ base)
                     pad.position.copy(pos);
                     pad.lookAt(new THREE.Vector3(0,0,0));
                     this.centralSphere.add(pad);
                     this.pads.push({ mesh: pad, intensity: 0 });

                     // Add to ports if edge
                     if(i===0 || i===w-1 || j===0 || j===h-1) {
                         chipPorts.push({ gridPhi: p, gridTheta: t });
                     }
                 }
             }
        };

        // 1. Scatter Chips
        const numChips = 40;
        for(let c=0; c<numChips; c++) {
            let cp = Math.floor(Math.random() * (PHI_STEPS - 10)) + 5;
            let ct = Math.floor(Math.random() * THETA_STEPS);
            let w = 3 + Math.floor(Math.random() * 3); // 3-5 width
            let h = 3 + Math.floor(Math.random() * 3); // 3-5 height
            createChip(cp, ct, w, h);
        }

        // 2. Route Traces from Ports
        // Shuffle ports
        chipPorts.sort(() => Math.random() - 0.5);

        let busesCreated = 0;
        const numBusesTarget = 150; 
        const baseColorHex = 0x03121d;
        
        // We iterate through available ports to start traces
        // If we run out of ports, we stop or pick random points (fallback disabled for clean look)
        
        let portIndex = 0;
        
        while (busesCreated < numBusesTarget && portIndex < chipPorts.length) {
            const startPort = chipPorts[portIndex++];
            
            // Check if still valid (maybe used by another trace coming in?)
            // Actually gridMap check handles this if we move 1 step.
            
            let gridPhi = startPort.gridPhi;
            let gridTheta = startPort.gridTheta;
            
            // Try to step OUT of the chip
            // Check neighbors. If neighbor is empty, that's our direction.
            let dir = null;
            const neighbors = [
                { dPhi: 1, dTheta: 0, d: 'H' }, // Down
                { dPhi: -1, dTheta: 0, d: 'H' }, // Up
                { dPhi: 0, dTheta: 1, d: 'V' }, // Right
                { dPhi: 0, dTheta: -1, d: 'V' } // Left
            ];
            
            // Find valid exit
            for(let n of neighbors) {
                let checkPhi = gridPhi + n.dPhi;
                let checkTheta = (gridTheta + n.dTheta + THETA_STEPS * 10) % THETA_STEPS;
                if(!gridMap.has(`${checkPhi},${checkTheta}`)) {
                    dir = n.d; // We found an empty spot
                    // Determine initial direction logic for the walker
                    break;
                }
            }
            
            if(!dir) continue; // Trapped port

            // Start Logic
            const lanes = 1; // Single lanes from chips look better
            const busSteps = 80 + Math.floor(Math.random() * 120); // Long paths
            
            let laneHeads = [];
            let laneRoutes = [];
            let laneLastPads = [];
            
            // Buffers
            let currentBusMeshes = [];
            let currentBusPads = [];
            let currentBusPaths = [];
            let currentBusFatLines = [];
            let currentBusGridPoints = [];

            // Setup Start Head (The Port itself is already occupied, we start FROM it)
            // Actually, we need to create the first segment FROM the port.
            // So Head = Port.
            
            const startPhiVal = gridPhi * phiStepSize;
            const startThetaVal = gridTheta * thetaStepSize;
            
            laneHeads.push({ 
                phi: startPhiVal, 
                theta: startThetaVal, 
                gridPhi: gridPhi, 
                gridTheta: gridTheta 
            });
            laneRoutes.push([]);
            
            // Find the pad mesh corresponding to this port? simpler to just make a new invisible start node
            // purely for linkage. 
            // Or reuse the chip pad. But accessing it is hard.
            // Let's just create a dummy "startPad" object.
            const dummyPad = { intensity: 0 }; 
            laneLastPads.push(dummyPad);

            let successful = false;

            for (let s = 0; s < busSteps; s++) {
                let stepLen = 2 + Math.floor(Math.random() * 4); 
                
                let possibleMoves = [];

                 if (dir === 'H') {
                    possibleMoves.push({ dPhi: 0, dTheta: stepLen, newDir: 'V' }); 
                    possibleMoves.push({ dPhi: 0, dTheta: -stepLen, newDir: 'V' }); 
                } else {
                    possibleMoves.push({ dPhi: stepLen, dTheta: 0, newDir: 'H' }); 
                    possibleMoves.push({ dPhi: -stepLen, dTheta: 0, newDir: 'H' }); 
                }
                
                // Bias inertia
                possibleMoves.sort(() => Math.random() - 0.5);

                let bestMove = null;
                let bestNextHead = null;

                for (let m = 0; m < possibleMoves.length; m++) {
                    const move = possibleMoves[m];
                    const dPhi = move.dPhi;
                    const dTheta = move.dTheta;
                    
                    const head = laneHeads[0];
                    let targetGridPhi = head.gridPhi + dPhi;
                    let targetGridTheta = head.gridTheta + dTheta; 
                    
                    // Clamp Phi
                    targetGridPhi = Math.max(2, Math.min(PHI_STEPS-2, targetGridPhi));
                    // Wrap Theta (Fix v1.983)
                    targetGridTheta = (targetGridTheta + THETA_STEPS * 10) % THETA_STEPS;

                    // Range Check (Trace Line)
                    // We must verify every point along the line for collision, not just destination
                    let collision = false;
                    const steps = Math.max(Math.abs(dPhi), Math.abs(dTheta));
                    const incPhi = dPhi / steps;
                    const incTheta = dTheta / steps;
                    
                    for(let k=1; k<=steps; k++) {
                        let cp = Math.round(head.gridPhi + incPhi * k);
                        let ct = Math.round(head.gridTheta + incTheta * k);
                        ct = (ct + THETA_STEPS * 10) % THETA_STEPS;
                        if(gridMap.has(`${cp},${ct}`)) {
                            collision = true; 
                            break;
                        }
                    }

                    if (!collision) {
                        bestMove = move;
                        bestNextHead = { gridPhi: targetGridPhi, gridTheta: targetGridTheta };
                        break;
                    }
                }

                if (!bestMove) break; // Stuck

                // Execute
                const next = bestNextHead;
                const head = laneHeads[0];
                
                // Mark Grid
                // Only mark the endpoints? No, mark the whole line to prevent crossing
                // Recalculate steps to mark
                const steps = Math.max(Math.abs(bestMove.dPhi), Math.abs(bestMove.dTheta));
                const incPhi = bestMove.dPhi / steps;
                const incTheta = bestMove.dTheta / steps;
                for(let k=1; k<=steps; k++) {
                    let cp = Math.round(head.gridPhi + incPhi * k);
                    let ct = Math.round(head.gridTheta + incTheta * k);
                    ct = (ct + THETA_STEPS * 10) % THETA_STEPS;
                    gridMap.add(`${cp},${ct}`);
                    currentBusGridPoints.push(`${cp},${ct}`);
                }

                // Geometry
                const targetPhi = next.gridPhi * phiStepSize;
                const targetTheta = next.gridTheta * thetaStepSize;
                
                // Interpolate 3D Points for Curve
                const segmentPoints = [];
                const divisions = 8; 
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
                    color: baseColorHex, 
                    linewidth: 2.5, 
                    worldUnits: false,
                    dashed: false,
                    alphaToCoverage: false,
                    transparent: true,
                    opacity: 0.5, 
                    depthWrite: false, 
                    depthTest: true
                });
                mat.resolution.set(this.width, this.height);

                const line = new Line2(geometry, mat);
                line.computeLineDistances();
                line.userData = { intensity: 0 }; 

                this.centralSphere.add(line);
                currentBusMeshes.push(line);
                currentBusFatLines.push(mat);

                // End Pad
                const padPos = this.getPos(targetPhi, targetTheta, surfaceRadius);
                const pad = new THREE.Mesh(padGeometry, padMaterial.clone()); 
                pad.material.opacity = 0.5; 
                pad.material.transparent = true;
                pad.position.copy(padPos);
                pad.lookAt(new THREE.Vector3(0,0,0));
                this.centralSphere.add(pad);
                
                const endPadObj = { mesh: pad, intensity: 0 };
                currentBusPads.push(endPadObj);

                const pathObj = {
                     phiStart: head.phi, thetaStart: head.theta,
                     phiEnd: targetPhi, thetaEnd: targetTheta,
                     radius: surfaceRadius,
                     mesh: line,
                     startPad: laneLastPads[0], 
                     endPad: endPadObj          
                };

                currentBusPaths.push(pathObj);
                laneRoutes[0].push(pathObj); 

                head.phi = targetPhi;
                head.theta = targetTheta;
                head.gridPhi = next.gridPhi;
                head.gridTheta = next.gridTheta;
                
                laneLastPads[0] = endPadObj;
                dir = bestMove.newDir;
            }

            // Min Length Filter
            if (laneRoutes[0].length < 20) { // Slightly lower min since we want connections
                // Backtrack
                currentBusMeshes.forEach(m => {
                    this.centralSphere.remove(m);
                    m.geometry.dispose();
                    m.material.dispose();
                });
                currentBusPads.forEach(p => {
                    this.centralSphere.remove(p.mesh);
                    p.mesh.geometry.dispose();
                    p.mesh.material.dispose();
                });
                currentBusGridPoints.forEach(key => gridMap.delete(key));
            } else {
                busesCreated++;
                this.circuitMeshes.push(...currentBusMeshes);
                this.pads.push(...currentBusPads);
                this.fatLines.push(...currentBusFatLines);
                this.paths.push(...currentBusPaths);
                this.routes.push(laneRoutes[0]);
            }
        }

        const electronGeometry = new THREE.SphereGeometry(0.009, 8, 8); 
        const electronMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); 
        
        const glowTexture = this.createGlowTexture();
        const electronGlowMat = new THREE.SpriteMaterial({ 
            map: glowTexture, 
            color: 0x00aaff, 
            transparent: true, 
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const numElectrons = 100; 
        for(let i=0; i<numElectrons; i++) {
            const electron = new THREE.Mesh(electronGeometry, electronMaterial);
            const sprite = new THREE.Sprite(electronGlowMat);
            sprite.scale.set(0.06, 0.06, 0.06);
            electron.add(sprite);

            electron.visible = false; 
            this.centralSphere.add(electron);
            
            this.electrons.push({
                mesh: electron,
                routeIndex: Math.floor(Math.random() * this.routes.length), 
                segmentIndex: 0,
                t: 0, 
                speed: 0,
                active: false,
                delay: Math.random() * 60 
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
        
        const uniquePoints = [];
        const threshold = 0.001;

        const glowTexture = this.createGlowTexture(); // Reuse white glow

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

                // Random RGB Color for this node
                // Use HSL for vibrant colors (Saturation ~0.9, Lightness ~0.6)
                const hue = Math.random();
                const nodeColor = new THREE.Color().setHSL(hue, 0.9, 0.6);

                // Nodes are small bulbs
                const nodeGeometry = new THREE.SphereGeometry(0.015, 8, 8); 
                
                const nodeMaterial = new THREE.MeshStandardMaterial({ 
                    color: nodeColor.clone().multiplyScalar(0.2), // Darker base so it can light up
                    emissive: 0x000000,   
                    emissiveIntensity: 0, 
                    roughness: 0.2,
                    metalness: 0.5
                });
                
                const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
                node.position.copy(vertex);
                
                // --- Subtle RGB Halo ---
                const spriteMat = new THREE.SpriteMaterial({ 
                    map: glowTexture, 
                    color: nodeColor,    // Tint halo with node color
                    transparent: true, 
                    opacity: 0,          // Controlled by animation
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const sprite = new THREE.Sprite(spriteMat);
                // Tiny halo: 0.12 scale is about 4x node diameter
                sprite.scale.set(0.12, 0.12, 0.12); 
                node.add(sprite);

                // LED Firing State
                node.userData = {
                    firingState: 0, 
                    fireCooldown: Math.random() * 100, 
                    baseScale: 1.0,
                    baseColor: nodeColor, // Store assigned color
                    halo: sprite          // Reference to halo
                };

                this.group.add(node);
                this.nodes.push(node);
            }
        }
    }

    createGlowTexture() {
        // Changed to Neutral White for tinting
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)'); 
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

    toggleLights() {
        this.lightsActive = !this.lightsActive;
        return this.lightsActive;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.controls.update();

        // Lazy Init Active Sets (Performance Optimization v1.983)
        if (!this.activeMeshes) this.activeMeshes = new Set();
        if (!this.activePads) this.activePads = new Set();

        if (this.nodes) {
            const tempV = new THREE.Vector3();
            const maxDist = 0.35; 

            const candidates = [];

            this.nodes.forEach(node => {
                node.getWorldPosition(tempV);
                tempV.project(this.camera);
                const dist = Math.sqrt(tempV.x * tempV.x + tempV.y * tempV.y);
                if (dist < maxDist) {
                    candidates.push({ node: node, dist: dist, z: tempV.z });
                }
            });

            let bestNode = null;
            let sphereActiveFactor = 0; 
            if (candidates.length > 0) {
                candidates.sort((a, b) => a.z - b.z);
                bestNode = candidates[0].node;
                sphereActiveFactor = Math.max(0, 1.0 - (candidates[0].dist / maxDist));
            }

            const activityLevel = this.lightsActive ? sphereActiveFactor : 0; 

            // Circuitry Animation
            if (this.paths && this.electrons) {
                if (this.circuitMeshes) {
                    const baseR = 0.012; 
                    const baseG = 0.072; 
                    const baseB = 0.116;

                    // OPTIMIZED: Only iterate active meshes
                    this.activeMeshes.forEach(mesh => {
                        if (this.lightsActive) {
                            mesh.userData.intensity *= 0.88; // Slightly slower decay (0.82->0.88) for smoother trails
                        } else {
                            mesh.userData.intensity = 0; 
                        }

                        const intensity = mesh.userData.intensity;
                        
                        if (intensity > 0.01) {
                            const r = baseR + (0.0 - baseR) * intensity;   
                            const g = baseG + (0.6 - baseG) * intensity;   
                            const b = baseB + (1.0 - baseB) * intensity;   
                            mesh.material.color.setRGB(r, g, b);
                            mesh.material.opacity = 0.5 + (0.5 * intensity);
                        } else {
                            // Reset and Remove
                            mesh.userData.intensity = 0;
                            mesh.material.color.setRGB(baseR, baseG, baseB);
                            mesh.material.opacity = 0.5; 
                            this.activeMeshes.delete(mesh);
                        }
                    });

                    // Optimized Pads
                    this.activePads.forEach(data => {
                        if (this.lightsActive) {
                            data.intensity *= 0.88;
                        } else {
                            data.intensity = 0;
                        }

                        if (data.intensity > 0.01) {
                            if (data.mesh) {
                                data.mesh.material.opacity = 0.5 + (0.5 * data.intensity);
                            }
                        } else {
                            data.intensity = 0;
                            if (data.mesh) {
                                data.mesh.material.opacity = 0.5;
                            }
                            this.activePads.delete(data);
                        }
                    });
                }
                
                this.electrons.forEach(e => {
                    if (!this.lightsActive) {
                         e.active = false; 
                         e.mesh.visible = false;
                    } else {
                        if (!e.active) {
                            if (e.delay > 0) e.delay--;
                            // Higher firing rate for busy look
                            else if (Math.random() < (0.01 + activityLevel * 0.05)) {
                                 e.active = true;
                                 e.routeIndex = Math.floor(Math.random() * this.routes.length);
                                 e.segmentIndex = 0;
                                 e.t = 0; 
                                 // FASTER SPEED (Double previous)
                                 e.speed = 0.05 + Math.random() * 0.04 + (activityLevel * 0.03); 
                                 e.mesh.visible = true;
                            }
                        }
                        if (e.active) {
                            const currentRoute = this.routes[e.routeIndex];
                            
                            if (currentRoute && currentRoute[e.segmentIndex]) {
                                // Sync Illumination
                                const currentSegment = currentRoute[e.segmentIndex];
                                if (currentSegment.mesh) {
                                    currentSegment.mesh.userData.intensity = 1.0;
                                    this.activeMeshes.add(currentSegment.mesh);
                                }

                                // Linked Pads Illumination
                                if (currentSegment.startPad) {
                                    currentSegment.startPad.intensity = 1.0;
                                    this.activePads.add(currentSegment.startPad);
                                }
                                if (currentSegment.endPad) {
                                    currentSegment.endPad.intensity = 1.0;
                                    this.activePads.add(currentSegment.endPad);
                                }

                                e.t += e.speed;
                                
                                if (e.t >= 1.0) { 
                                    // Move to next segment using remaining t
                                    // e.t -= 1.0; // Smooth transition? 
                                    // Simpler: Just reset t=0, small overlap loss is fine for speed
                                    e.segmentIndex++;
                                    e.t = 0;
                                    
                                    // If end of chain, reset
                                    if (e.segmentIndex >= currentRoute.length) {
                                        e.active = false; 
                                        e.mesh.visible = false; 
                                        e.delay = Math.random() * 20; 
                                    }
                                } else {
                                    const path = currentRoute[e.segmentIndex];
                                    const currentPhi = path.phiStart + (path.phiEnd - path.phiStart) * e.t;
                                    const currentTheta = path.thetaStart + (path.thetaEnd - path.thetaStart) * e.t;
                                    const pos = this.getPos(currentPhi, currentTheta, path.radius);
                                    e.mesh.position.copy(pos);
                                }
                            } else {
                                e.active = false;
                                e.mesh.visible = false;
                            }
                        }
                    }
                });
            }

            // --- LED NODE LOGIC (Random RGB Colors) ---
            const dark = new THREE.Color(0x000000);

            this.nodes.forEach(node => {
                const data = node.userData;

                if (!this.lightsActive) {
                    data.firingState = 0; 
                } else if (data.firingState <= 0) {
                    if (data.fireCooldown > 0) {
                        data.fireCooldown -= 2; 
                    } else {
                        // Reduced firing chance (0.02 -> 0.005) and much longer cooldown
                        if (Math.random() < 0.005) {
                            data.firingState = 1.0; 
                            data.fireCooldown = 60 + Math.random() * 120; 
                        }
                    }
                } else {
                    data.firingState *= 0.85; // Slower fade out (was 0.75)
                    if (data.firingState < 0.01) data.firingState = 0;
                }

                let proximityIntensity = 0; 
                let proximityScale = 0;
                
                if (this.lightsActive && node === bestNode) {
                    node.getWorldPosition(tempV);
                    tempV.project(this.camera);
                    const dist = Math.sqrt(tempV.x * tempV.x + tempV.y * tempV.y);
                    const factor = 1 - (dist / maxDist);
                    proximityIntensity = Math.pow(factor, 2) * 2.0; 
                    proximityScale = factor * 0.4;
                }
                
                // If lights inactive, both are 0
                const combinedIntensity = Math.max(proximityIntensity, data.firingState * 5.0);
                
                // Use the stored RANDOM color for this node
                node.material.emissive.lerpColors(dark, data.baseColor, Math.min(1.0, combinedIntensity));
                node.material.emissiveIntensity = combinedIntensity;

                // Update Halo Opacity - Subtle "Tiny" Effect
                if (data.halo) {
                    // Only visible when lit, max opacity 0.4 for subtlety
                    data.halo.material.opacity = Math.min(0.4, combinedIntensity * 0.4); 
                }

                const currentScale = node.scale.x;
                const targetScale = 1.0 + proximityScale + (data.firingState * 0.4); 
                const newScale = currentScale + (targetScale - currentScale) * 0.4; 
                node.scale.setScalar(newScale);
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}
