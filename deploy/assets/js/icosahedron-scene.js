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
        
        this.systemActive = true; // State for On/Off Toggle

        this.initScene();
        this.initLights();
        this.initGeometry();
        this.initControls();
        this.initUI(); // Add UI Controls
        this.handleResize();
        this.animate();
    }

    initUI() {
        // Create Toggle Button
        const btn = document.createElement('button');
        btn.innerText = "SYSTEM ACTIVE";
        btn.style.position = 'absolute';
        btn.style.bottom = '40px';
        btn.style.left = '50%';
        btn.style.transform = 'translateX(-50%)';
        btn.style.padding = '8px 16px';
        btn.style.background = 'rgba(5, 6, 15, 0.8)';
        btn.style.border = '1px solid #00aaff';
        btn.style.color = '#00aaff';
        btn.style.fontFamily = 'monospace';
        btn.style.fontSize = '12px';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '1000';
        btn.style.borderRadius = '4px';
        btn.style.transition = 'all 0.3s ease';
        btn.style.letterSpacing = '1px';

        btn.addEventListener('mouseover', () => {
            btn.style.background = 'rgba(0, 170, 255, 0.1)';
            btn.style.boxShadow = '0 0 10px rgba(0, 170, 255, 0.3)';
        });
        btn.addEventListener('mouseout', () => {
            btn.style.background = 'rgba(5, 6, 15, 0.8)';
            btn.style.boxShadow = 'none';
        });

        btn.addEventListener('click', () => {
             this.toggleSystem(btn);
        });

        this.container.appendChild(btn);
    }

    toggleSystem(btn) {
        this.systemActive = !this.systemActive;
        
        if (this.systemActive) {
            // TURN ON
            btn.innerText = "SYSTEM ACTIVE";
            btn.style.borderColor = '#00aaff';
            btn.style.color = '#00aaff';
            
            // Restore Lights
            this.ambientLight.intensity = 0.2;
            this.spotLight.intensity = 8;
            this.coreLight.intensity = 0.4;
            
        } else {
            // TURN OFF
            btn.innerText = "SYSTEM OFFLINE";
            btn.style.borderColor = '#333';
            btn.style.color = '#555';
            
            // Dim Lights
            this.ambientLight.intensity = 0;
            this.spotLight.intensity = 0;
            this.coreLight.intensity = 0;

            // Clear active electrons immediately
            if (this.electrons) {
                this.electrons.forEach(e => {
                    e.active = false;
                    e.mesh.visible = false;
                });
            }
            // Dim all traces
            if (this.circuitMeshes) {
                this.circuitMeshes.forEach(mesh => {
                     mesh.userData.intensity = 0;
                     mesh.material.opacity = 0.05;
                     mesh.material.color.setHex(0x041725);
                });
            }
        
        }
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
        this.ambientLight = new THREE.AmbientLight(0xaaccff, 0.2); 
        this.scene.add(this.ambientLight);

        this.spotLight = new THREE.SpotLight(0xe6f3ff, 8); 
        this.spotLight.position.set(-10, 10, 10);
        this.spotLight.angle = Math.PI / 3; 
        this.spotLight.penumbra = 1.0;
        this.spotLight.decay = 2;
        this.spotLight.distance = 50;
        this.scene.add(this.spotLight);
    }

    initGeometry() {
        this.group = new THREE.Group();
        this.scene.add(this.group);

        const radius = 1.5;
        const detail = 2; 
        const geometry = new THREE.IcosahedronGeometry(radius, detail);

        // 1. Lattice 
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: 0x88b0d1, 
            linewidth: 1,
            opacity: 0.1, // Reduced to 10%
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
        // Obsidian Black Glass Orb
        const geometry = new THREE.SphereGeometry(0.72, 64, 64);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            roughness: 0.15,
            metalness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            emissive: 0x000000
        });

        this.centralSphere = new THREE.Mesh(geometry, material);
        
        // FIX: Rotate 90 degrees to hide the "eye" (pole) from direct camera view
        this.centralSphere.rotation.x = Math.PI / 2; 

        this.group.add(this.centralSphere);
        
        this.initCircuitryPaths();

        this.coreLight = new THREE.PointLight(0x0088ff, 0.4, 8);
        this.centralSphere.add(this.coreLight);
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

        const surfaceRadius = 0.725; 
        const padGeometry = new THREE.CircleGeometry(0.0084, 8); 
        const padMaterial = new THREE.MeshBasicMaterial({ color: 0x0b5c85, side: THREE.DoubleSide }); 

        // REDUCED DENSITY (v1.951 settings)
        const PHI_STEPS = 45;   
        const THETA_STEPS = 60; 
        
        const phiStepSize = Math.PI / PHI_STEPS;
        const thetaStepSize = (Math.PI * 2) / THETA_STEPS;
        
        const numBuses = 65; 
        
        // Darker Base color (v1.955 settings)
        const baseColorHex = 0x041725;
        for (let b = 0; b < numBuses; b++) {
            const startGridPhi = Math.floor(Math.random() * (PHI_STEPS - 4)) + 2; 
            const startGridTheta = Math.floor(Math.random() * THETA_STEPS);
            
            let gridPhi = startGridPhi;
            let gridTheta = startGridTheta;
            
            const lanes = 1 + Math.floor(Math.random() * 3); 
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
                        color: baseColorHex, 
                        linewidth: 2.5, 
                        worldUnits: false,
                        dashed: false,
                        alphaToCoverage: true,
                        transparent: true,
                        opacity: 0.05
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
        
        // Electrons keep the standard blue glow
        const electronGlowMat = new THREE.SpriteMaterial({ 
            map: glowTexture, 
            color: 0x00aaff, // Manual blue tint since texture is now white
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
        this.controls.enableZoom = false; // Disable native zoom to prevent Desktop Scroll bugs
        this.controls.rotateSpeed = 0.5;
        this.controls.autoRotate = false;
        
        // Ensure Touch Actions are allowed by OrbitControls (even if we manually handle zoom)
        this.controls.enableRotate = true; 
        
        // FORCE CSS to allow touch handling
        this.renderer.domElement.style.touchAction = 'none';

        // --- 1. Custom Mouse Wheel Zoom (Desktop) ---
        const handleZoom = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.deltaY === 0) return;

            const minD = 1.2;
            const maxD = 60.0;
            const zoomFactor = 0.05; 

            const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
            const dist = dir.length();
            dir.normalize();

            let newDist = dist;
            if (e.deltaY > 0) newDist = Math.min(dist * (1 + zoomFactor), maxD);
            else newDist = Math.max(dist * (1 - zoomFactor), minD);

            this.camera.position.copy(this.controls.target).addScaledVector(dir, newDist);
        };
        this.renderer.domElement.addEventListener('wheel', handleZoom, { passive: false });

        // --- 2. Custom Pinch-to-Zoom (Mobile) ---
        let initialPinchDist = 0;
        
        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].pageX - e.touches[1].pageX;
                const dy = e.touches[0].pageY - e.touches[1].pageY;
                initialPinchDist = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2) {
                // Prevent default page zooming/panning
                e.preventDefault(); 
                e.stopPropagation();

                const dx = e.touches[0].pageX - e.touches[1].pageX;
                const dy = e.touches[0].pageY - e.touches[1].pageY;
                const currentDist = Math.sqrt(dx * dx + dy * dy);
                
                if (initialPinchDist > 0) {
                    const delta = currentDist - initialPinchDist;
                    
                    // Sensitivity factor for touch
                    const touchZoomSpeed = 0.02; 

                    const minD = 1.2;
                    const maxD = 60.0;
                    
                    const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
                    const dist = dir.length();
                    dir.normalize();

                    // Spread (Positive Delta) = Zoom In (Decrease Dist)
                    // Pinch (Negative Delta) = Zoom Out (Increase Dist)
                    // We invert the delta to match camera distance logic
                    let newDist = dist - (delta * touchZoomSpeed);
                    
                    // Clamp
                    newDist = Math.max(minD, Math.min(maxD, newDist));
                    
                    this.camera.position.copy(this.controls.target).addScaledVector(dir, newDist);

                    // Update initial for next frame to keep it smooth/relative
                    initialPinchDist = currentDist;
                }
            }
        };

        const handleTouchEnd = () => {
             initialPinchDist = 0;
        };

        // Add Touch Listeners (Non-Passive to allow preventDefault)
        this.renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        this.renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.renderer.domElement.addEventListener('touchend', handleTouchEnd, { passive: false });
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
                candidates.sort((a, b) => a.z - b.z);
                bestNode = candidates[0].node;
                sphereActiveFactor = Math.max(0, 1.0 - (candidates[0].dist / maxDist));
            }

            const activityLevel = sphereActiveFactor; 

            // Circuitry
            if (this.paths && this.electrons) {
                if (this.circuitMeshes) {
                    const baseR = 0.015; 
                    const baseG = 0.090; 
                    const baseB = 0.145;

                    this.circuitMeshes.forEach(mesh => {
                        if (mesh.userData.intensity > 0.01) {
                            mesh.userData.intensity *= 0.92;
                            const intensity = mesh.userData.intensity;
                            const r = baseR + (0.0 - baseR) * intensity;   
                            const g = baseG + (0.6 - baseG) * intensity;   
                            const b = baseB + (1.0 - baseB) * intensity;   
                            mesh.material.color.setRGB(r, g, b);
                            mesh.material.opacity = 0.05 + (0.95 * intensity);
                        } else if (mesh.userData.intensity > 0) {
                            mesh.userData.intensity = 0;
                            mesh.material.color.setRGB(baseR, baseG, baseB);
                            mesh.material.opacity = 0.05;
                        }
                    });
                }
                this.electrons.forEach(e => {
                    if (!e.active) {
                        if (e.delay > 0) e.delay--;
                        else if (this.systemActive && Math.random() < (0.01 + activityLevel * 0.1)) {
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

            // --- NEURAL ACTIVITY (Node Flashing) ---
            const dark = new THREE.Color(0x000000);

            this.nodes.forEach(node => {
                const data = node.userData;

                if (data.firingState <= 0) {
                    if (data.fireCooldown > 0) {
                        data.fireCooldown -= 1; // Slower cooldown (was 2)
                    } else {
                        // Reduced firing chance (was 0.06)
                        if (this.systemActive && Math.random() < 0.02) {
                            data.firingState = 1.0; 
                            data.fireCooldown = 20 + Math.random() * 60; // Longer cooldown
                        }
                    }
                } else {
                    // Slower decay for a "slower" flash (was 0.75)
                    data.firingState *= 0.92; 
                    if (data.firingState < 0.01) data.firingState = 0;
                }

                let proximityIntensity = 0; 
                let proximityScale = 0;
                
                if (this.systemActive && node === bestNode) {
                    node.getWorldPosition(tempV);
                    tempV.project(this.camera);
                    const dist = Math.sqrt(tempV.x * tempV.x + tempV.y * tempV.y);
                    const factor = 1 - (dist / maxDist);
                    proximityIntensity = Math.pow(factor, 2) * 2.0; 
                    proximityScale = factor * 0.4;
                }

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
