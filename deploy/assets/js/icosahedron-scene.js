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

        console.log("Icosahedron Scene Initialized - vDesignTwo.5 (Dense PCB Grid)");

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

        // 1b. Mesh Texture Approach (Subtle background grid)
        const canvas = document.createElement('canvas');
        canvas.width = 128; 
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0,0,128,128);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)'; 
        ctx.lineWidth = 2; 
        ctx.strokeRect(0,0,128,128);
        
        // Add some techy details to the texture
        ctx.fillStyle = 'rgba(100, 200, 255, 0.05)';
        ctx.fillRect(10, 50, 40, 10);
        ctx.fillRect(80, 20, 10, 60);

        const meshTexture = new THREE.CanvasTexture(canvas);
        meshTexture.wrapS = THREE.RepeatWrapping;
        meshTexture.wrapT = THREE.RepeatWrapping;
        meshTexture.repeat.set(8, 4); 
        
        const meshMaterial = new THREE.MeshBasicMaterial({
            map: meshTexture,
            color: 0x051525,      
            transparent: true,
            opacity: 0.8,         
            side: THREE.DoubleSide,
            depthWrite: false,    
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
            color: 0x020a12,     
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
        this.pads = []; 

        const surfaceRadius = 0.605; 
        const padGeometry = new THREE.CircleGeometry(0.007, 8); 
        const padMaterial = new THREE.MeshBasicMaterial({ color: 0x0b5c85, side: THREE.DoubleSide }); 

        // --- GRID BASED GENERATION ---
        
        // We define a conceptual grid to snap coordinates to.
        // This ensures parallelism and "lanes".
        const PHI_STEPS = 60; // Latitude bands
        const THETA_STEPS = 80; // Longitude bands
        
        const phiStepSize = Math.PI / PHI_STEPS;
        const thetaStepSize = (Math.PI * 2) / THETA_STEPS;
        
        // Bus configuration
        const numBuses = 90; // Very dense
        
        for (let b = 0; b < numBuses; b++) {
            
            // Pick a random grid start point
            const startGridPhi = Math.floor(Math.random() * (PHI_STEPS - 4)) + 2; // Avoid poles
            const startGridTheta = Math.floor(Math.random() * THETA_STEPS);
            
            let gridPhi = startGridPhi;
            let gridTheta = startGridTheta;
            
            const lanes = 1 + Math.floor(Math.random() * 4); // 1-4 parallel lanes
            const busSteps = 5 + Math.floor(Math.random() * 15); // Long paths
            
            // Valid direction?
            let dir = Math.random() > 0.5 ? 'H' : 'V'; // Horizontal or Vertical
            
            // LANE OFFSET CALCULATION
            // We want lanes to be TIGHTLY packed, effectively 1 grid unit apart.
            
            let laneHeads = [];
            for (let l = 0; l < lanes; l++) {
                // Where is this lane relative to the bus center/origin?
                // If moving Horizontally, lanes stack Vertically (Phi change)
                // If moving Vertically, lanes stack Horizontally (Theta change)
                
                let lPhi = gridPhi;
                let lTheta = gridTheta;
                
                if (dir === 'H') {
                    lPhi += l; // Stack in Phi
                } else {
                    lTheta += l; // Stack in Theta
                }
                
                const phiVal = lPhi * phiStepSize;
                const thetaVal = lTheta * thetaStepSize;
                
                laneHeads.push({ phi: phiVal, theta: thetaVal, gridPhi: lPhi, gridTheta: lTheta });

                // Start Pad
                const pos = this.getPos(phiVal, thetaVal, surfaceRadius);
                const pad = new THREE.Mesh(padGeometry, padMaterial);
                pad.position.copy(pos);
                pad.lookAt(new THREE.Vector3(0,0,0));
                this.centralSphere.add(pad);
            }

            for (let s = 0; s < busSteps; s++) {
                // Determine length of this segment in GRID UNITS
                let stepLen = 4 + Math.floor(Math.random() * 10); 
                
                // Movement
                let dPhi = 0;
                let dTheta = 0;
                
                if (dir === 'H') { // Moving along Theta
                    let sign = Math.random() > 0.5 ? 1 : -1;
                    dTheta = stepLen * sign;
                } else { // Moving along Phi
                    let sign = Math.random() > 0.5 ? 1 : -1;
                    dPhi = stepLen * sign;
                }
                
                // Check bounds (basic)
                // If we go too close to poles with Phi, clamp or reverse? 
                // For simplicity, let's just calc targets and render arcs.

                for(let l = 0; l < lanes; l++) {
                    const head = laneHeads[l];
                    
                    // Calc discrete target
                    let targetGridPhi = head.gridPhi + dPhi;
                    let targetGridTheta = head.gridTheta + dTheta; // Wrap around handles naturally in trig
                    
                    // Clamp Phi to avoid crossing poles weirdly
                    targetGridPhi = Math.max(2, Math.min(PHI_STEPS-2, targetGridPhi));
                    
                    const targetPhi = targetGridPhi * phiStepSize;
                    const targetTheta = targetGridTheta * thetaStepSize;
                    
                    // Verify we actually moved
                    if (Math.abs(targetPhi - head.phi) < 0.001 && Math.abs(targetTheta - head.theta) < 0.001) continue;

                    // Geometry generation (Arc)
                    const segmentPoints = [];
                    const divisions = 8; // Smooth arcs
                    
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
                        color: 0x0a3a5e, // Darker PCB blueish
                        linewidth: 2.5, 
                        worldUnits: false,
                        dashed: false,
                        alphaToCoverage: true,
                        transparent: true,
                        opacity: 0.9
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
                    head.gridPhi = targetGridPhi;
                    head.gridTheta = targetGridTheta;
                }
                
                // FLIP direction for next segment (orthogonal turns)
                dir = (dir === 'H') ? 'V' : 'H';
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

        const numElectrons = 120; // More activity for denser board
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
                    const baseG = 0.23; // Brighter default state
                    const baseB = 0.37; 
                    
                    this.circuitMeshes.forEach(mesh => {
                        if (mesh.userData.intensity > 0.01) {
                            mesh.userData.intensity *= 0.92;
                            
                            const intensity = mesh.userData.intensity;
                            const r = baseR + (0.0 - baseR) * intensity;   
                            const g = baseG + (0.6 - baseG) * intensity;   
                            const b = baseB + (1.0 - baseB) * intensity;   
                            
                            mesh.material.color.setRGB(r, g, b);
                            mesh.material.opacity = 0.9 + (0.1 * intensity);

                        } else if (mesh.userData.intensity > 0) {
                            mesh.userData.intensity = 0;
                            mesh.material.color.setRGB(baseR, baseG, baseB);
                            mesh.material.opacity = 0.9;
                        }
                    });
                }

                this.electrons.forEach(e => {
                    if (!e.active) {
                        if (e.delay > 0) {
                            e.delay--;
                        } else {
                             if (Math.random() < (0.01 + activityLevel * 0.1)) {
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
