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

        console.log("Icosahedron Scene Initialized - vDesignTwo.6 (Neuron Nodes)");

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

        const PHI_STEPS = 60; 
        const THETA_STEPS = 80; 
        
        const phiStepSize = Math.PI / PHI_STEPS;
        const thetaStepSize = (Math.PI * 2) / THETA_STEPS;
        
        const numBuses = 90; 
        
        for (let b = 0; b < numBuses; b++) {
            const startGridPhi = Math.floor(Math.random() * (PHI_STEPS - 4)) + 2; 
            const startGridTheta = Math.floor(Math.random() * THETA_STEPS);
            
            let gridPhi = startGridPhi;
            let gridTheta = startGridTheta;
            
            const lanes = 1 + Math.floor(Math.random() * 4); 
            const busSteps = 5 + Math.floor(Math.random() * 15); 
            
            let dir = Math.random() > 0.5 ? 'H' : 'V'; 
            
            let laneHeads = [];
            for (let l = 0; l < lanes; l++) {
                let lPhi = gridPhi;
                let lTheta = gridTheta;
                
                if (dir === 'H') {
                    lPhi += l; 
                } else {
                    lTheta += l; 
                }
                
                const phiVal = lPhi * phiStepSize;
                const thetaVal = lTheta * thetaStepSize;
                
                laneHeads.push({ phi: phiVal, theta: thetaVal, gridPhi: lPhi, gridTheta: lTheta });

                const pos = this.getPos(phiVal, thetaVal, surfaceRadius);
                const pad = new THREE.Mesh(padGeometry, padMaterial);
                pad.position.copy(pos);
                pad.lookAt(new THREE.Vector3(0,0,0));
                this.centralSphere.add(pad);
            }

            for (let s = 0; s < busSteps; s++) {
                let stepLen = 4 + Math.floor(Math.random() * 10); 
                
                let dPhi = 0;
                let dTheta = 0;
                
                if (dir === 'H') { 
                    let sign = Math.random() > 0.5 ? 1 : -1;
                    dTheta = stepLen * sign;
                } else { 
                    let sign = Math.random() > 0.5 ? 1 : -1;
                    dPhi = stepLen * sign;
                }
                
                for(let l = 0; l < lanes; l++) {
                    const head = laneHeads[l];
                    
                    let targetGridPhi = head.gridPhi + dPhi;
                    let targetGridTheta = head.gridTheta + dTheta; 
                    
                    targetGridPhi = Math.max(2, Math.min(PHI_STEPS-2, targetGridPhi));
                    
                    const targetPhi = targetGridPhi * phiStepSize;
                    const targetTheta = targetGridTheta * thetaStepSize;
                    
                    if (Math.abs(targetPhi - head.phi) < 0.001 && Math.abs(targetTheta - head.theta) < 0.001) continue;

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
                        color: 0x0a3a5e, 
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

                    head.phi = targetPhi;
                    head.theta = targetTheta;
                    head.gridPhi = targetGridPhi;
                    head.gridTheta = targetGridTheta;
                }
                
                dir = (dir === 'H') ? 'V' : 'H';
            }

            for(let l=0; l<lanes; l++) {
                 const head = laneHeads[l];
                 const pos = this.getPos(head.phi, head.theta, surfaceRadius);
                 const pad = new THREE.Mesh(padGeometry, padMaterial);
                 pad.position.copy(pos);
                 pad.lookAt(new THREE.Vector3(0,0,0));
                 this.centralSphere.add(pad);
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

        const numElectrons = 120; 
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
            color: 0xffffaa, // Yellow-white glow
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
                
                // NEURON STYLING: Start "White-ish" but inactive
                const nodeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xddeeff,      // Base pale white/blue
                    emissive: 0x000000,   // Starts dark (no glow)
                    emissiveIntensity: 0, 
                    roughness: 0.2,
                    metalness: 0.5
                });
                
                const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
                node.position.copy(vertex);
                
                const sprite = new THREE.Sprite(glowMaterial.clone());
                sprite.scale.set(0.6, 0.6, 0.6); 
                sprite.visible = false; 
                node.add(sprite); 

                // Neuron Firing State
                node.userData = {
                    sprite: sprite,
                    firingState: 0, // 0 = inactive, >0 = firing amplitude
                    fireCooldown: Math.random() * 300, 
                    baseScale: 1.0
                };

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
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)'); 
        gradient.addColorStop(0.4, 'rgba(255, 200, 50, 0.4)'); 
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
                    candidates.push({ node: node, dist: dist, z: tempV.z });
                }
            });

            let bestNode = null;
            let sphereActiveFactor = 0; 
            if (candidates.length > 0) {
                candidates.sort((a, b) => a.z - b.z); // Z sort? Actually closer z is smaller? In camera space z is negative?
                // Actually closest to camera in screen space is just low dist magnitude, 
                // but if we want front-facing, we check Z. 
                // Let's stick to user's "viewport" logic which was working.
                bestNode = candidates[0].node;
                sphereActiveFactor = Math.max(0, 1.0 - (candidates[0].dist / maxDist));
            }

            const activityLevel = sphereActiveFactor; 

            // Circuitry
            if (this.paths && this.electrons) {
                // ... (existing electron logic) ...
                if (this.circuitMeshes) {
                    const baseR = 0.04; const baseG = 0.23; const baseB = 0.37;
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
                        if (e.delay > 0) e.delay--;
                        else if (Math.random() < (0.01 + activityLevel * 0.1)) {
                             e.active = true;
                             e.pathIndex = Math.floor(Math.random() * this.paths.length);
                             e.t = 0; e.speed = 0.01 + Math.random() * 0.04 + (activityLevel * 0.03); e.mesh.visible = true;
                        }
                    }
                    if (e.active) {
                        const pathId = e.pathIndex;
                        if (this.circuitMeshes && this.circuitMeshes[pathId]) this.circuitMeshes[pathId].userData.intensity = 1.0;
                        e.t += e.speed;
                        if (e.t >= 1.0) { e.active = false; e.mesh.visible = false; e.delay = Math.random() * 30; }
                        else {
                            const path = this.paths[pathId];
                            if (path) {
                                const currentPhi = path.phiStart + (path.phiEnd - path.phiStart) * e.t;
                                const currentTheta = path.thetaStart + (path.thetaEnd - path.thetaStart) * e.t;
                                const pos = this.getPos(currentPhi, currentTheta, path.radius);
                                e.mesh.position.copy(pos);
                            }
                        }
                    }
                });
            }

            // --- NEURON NODE LOGIC ---
            const yellow = new THREE.Color(0xffffaa);
            const dark = new THREE.Color(0x000000);

            this.nodes.forEach(node => {
                const data = node.userData;

                // 1. Calculate random firing
                if (data.firingState <= 0) {
                    if (data.fireCooldown > 0) {
                        data.fireCooldown--;
                    } else {
                        // FIRE!
                        if (Math.random() < 0.02) {
                            data.firingState = 1.0; 
                            data.fireCooldown = 60 + Math.random() * 300; // Random interval
                        }
                    }
                } else {
                    // Decay firing
                    data.firingState *= 0.94; // Fast pulse check
                    if (data.firingState < 0.01) data.firingState = 0;
                }

                // 2. Base Viewport Highlight (Logic from before)
                let proximityIntensity = 0; 
                let proximityScale = 0;
                
                if (node === bestNode) {
                    node.getWorldPosition(tempV);
                    tempV.project(this.camera);
                    const dist = Math.sqrt(tempV.x * tempV.x + tempV.y * tempV.y);
                    const factor = 1 - (dist / maxDist);
                    proximityIntensity = Math.pow(factor, 2) * 2.0; 
                    proximityScale = factor * 0.4;
                }

                // 3. Combine Forces
                // The "Firing" overrides the "Passive Proximity" if it's stronger
                const combinedIntensity = Math.max(proximityIntensity, data.firingState * 3.0);
                
                // Color Logic: Mix Dark -> Yellow based on intensity
                // Emissive is additive.
                // If firing, we want bright yellow/white.
                
                node.material.emissive.lerpColors(dark, yellow, Math.min(1.0, combinedIntensity));
                node.material.emissiveIntensity = combinedIntensity;

                // Scale Logic
                const currentScale = node.scale.x;
                const targetScale = 1.0 + proximityScale + (data.firingState * 0.5);
                const newScale = currentScale + (targetScale - currentScale) * 0.1;
                node.scale.setScalar(newScale);

                // Sprite/Glow Logic
                const sprite = data.sprite;
                const glowOpacity = Math.max(proximityIntensity * 0.5, data.firingState);
                
                if (glowOpacity > 0.05) {
                    sprite.visible = true;
                    sprite.material.opacity = glowOpacity;
                    sprite.scale.setScalar(0.8 * newScale); 
                } else {
                    sprite.visible = false;
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}
