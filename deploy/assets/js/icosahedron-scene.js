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
        this.isMobile = (this.width <= 600);

        console.log("Icosahedron Scene Initialized - vDesignTwo.10 (Random RGB & Subtle Halo)");
        
        this.systemState = 'ACTIVE'; // ACTIVE, STANDBY, OFF
        this.lightTargets = { ambient: 0.2, spot: 8.0, core: 0.4 }; // Target intensities
        this.standbyPulseTimer = 0;
        
        // Simulation Ramp Factor (0.0 to 1.0)
        // Controls intensity of electrons and flashes
        this.simIntensity = 0; 
        this.targetSimIntensity = 0;

        // Standby Mix Factor (0.0 to 1.0)
        // Controls intensity of the "Standby Pulse" 
        this.standbyMix = 0;
        this.targetStandbyMix = 0; // Default to 0, if starting in Standby, setSystemState will fix

        this.initScene();
        this.initLights();
        this.initGeometry();
        this.initControls();
        this.initUI(); // Add UI Controls
        this.handleResize();
        this.animate();
    }

    initUI() {
        // Inject Styles for Responsive UI
        if (!document.getElementById('ampere-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'ampere-ui-styles';
            style.textContent = `
                #ampere-ui-track {
                    position: absolute;
                    bottom: 85px;
                    left: 50%;
                    transform: translate(-50%, 0);
                    width: 320px;
                    height: 48px;
                    background: rgba(5, 6, 10, 0.85);
                    backdrop-filter: blur(12px);
                    border-radius: 999px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px;
                    z-index: 1000;
                    user-select: none; /* Prevent text selection */
                    -webkit-user-select: none;
                    touch-action: none; /* Prevent scrolling on the track */
                    cursor: pointer;
                    box-sizing: border-box;
                }
                .ampere-ui-label {
                    flex: 1;
                    text-align: center;
                    font-family: monospace;
                    font-size: 12px;
                    letter-spacing: 1px;
                    color: #666;
                    z-index: 2;
                    font-weight: 600;
                    pointer-events: none;
                    transition: color 0.3s ease, text-shadow 0.3s ease;
                }
                #ampere-ui-thumb {
                    position: absolute;
                    top: 6px;
                    left: 6px;
                    height: 36px; /* 48 - 12 */
                    background: linear-gradient(180deg, rgba(30, 40, 50, 0.9), rgba(20, 30, 40, 0.9));
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 999px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
                    transition: left 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                    z-index: 1;
                    box-sizing: border-box;
                }
                
                /* Mobile Overrides */
                @media (max-width: 600px) {
                    #ampere-ui-track {
                        bottom: 90px;
                        width: calc(100% - 48px); /* 24px margins */
                        max-width: 360px;
                    }
                    .ampere-ui-label {
                        font-size: 10px;
                        letter-spacing: 0px;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const padding = 6; 

        // Container (Track)
        const container = document.createElement('div');
        this.uiContainer = container;
        container.id = 'ampere-ui-track';
        
        // Thumb (The Draggable Pill)
        const thumb = document.createElement('div');
        this.uiThumb = thumb;
        thumb.id = 'ampere-ui-thumb';
        
        // In JS we set the initial width, but resizing handles the rest
        // We will update logic to read clientWidth.
        
        // Active Highlight in Thumb (Glow)
        const thumbGlow = document.createElement('div');
        thumbGlow.style.position = 'absolute';
        thumbGlow.style.inset = '0';
        thumbGlow.style.borderRadius = '999px';
        thumbGlow.style.background = 'radial-gradient(circle at center, rgba(0, 170, 255, 0.15), transparent 70%)';
        thumb.appendChild(thumbGlow);
        
        // Labels (Reordered: STANDBY | ON | OFF)
        const labelsData = [
            { id: 'STANDBY', label: 'STANDBY' },
            { id: 'ACTIVE', label: 'POWER UP' },
            { id: 'OFF', label: 'POWER DOWN' } // Shortened for mobile fit? Keep for now.
        ];
        
        this.statePositions = { 'STANDBY': 0, 'ACTIVE': 1, 'OFF': 2 };
        this.positionToState = ['STANDBY', 'ACTIVE', 'OFF'];

        labelsData.forEach((item, i) => {
            const label = document.createElement('div');
            label.className = 'ampere-ui-label';
            label.innerText = item.label;
            label.setAttribute('data-id', item.id);
            container.appendChild(label);
        });

        container.insertBefore(thumb, container.firstChild);
        this.container.appendChild(container);

        // --- Helper: Update Thumb Size ---
        const updateThumbSize = () => {
             const trackWidth = container.clientWidth;
             const thumbW = (trackWidth - (padding * 2)) / 3;
             thumb.style.width = thumbW + 'px';
             
             // Also force re-position based on current state
             if (this.systemState) this.setSystemState(this.systemState);
        };
        
        // Observer for Resize
        const resizeObserver = new ResizeObserver(() => {
             updateThumbSize();
        });
        resizeObserver.observe(container);

        // --- Interaction Logic (Drag & Throw) ---
        let isDragging = false;
        let dragOffset = 0;

        const setThumbPosition = (clientX) => {
            const rect = container.getBoundingClientRect();
            // Recalculate Widths dynamically
             const trackWidth = rect.width;
             const thumbW = (trackWidth - (padding * 2)) / 3;

            let relativeX = clientX - rect.left - dragOffset;
            
            // Constrain
            const maxLeft = trackWidth - thumbW - padding; 
            const minLeft = padding;
            relativeX = Math.max(minLeft, Math.min(relativeX, maxLeft)); 
            
            thumb.style.transition = 'none'; // Instant movement
            thumb.style.left = relativeX + 'px';
        };

        const snapToNearest = () => {
            const currentLeft = parseFloat(thumb.style.left);
            const distFromStart = currentLeft - padding;
            
            const rect = container.getBoundingClientRect();
            const trackWidth = rect.width;
            const thumbW = (trackWidth - (padding * 2)) / 3;

            // Simple rounding
            let index = Math.round(distFromStart / thumbW);
            index = Math.max(0, Math.min(index, 2));
            
            const state = this.positionToState[index];
            
            // Restore transition for the snap
            thumb.style.transition = 'left 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
            this.setSystemState(state);
        };

        const onPointerDown = (e) => {
            this.lastInteractionTime = Date.now(); // Fix: Reset standby timer on UI interaction
            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            
            const rect = container.getBoundingClientRect();
            const trackWidth = rect.width;
            const thumbW = (trackWidth - (padding * 2)) / 3;

            // Calculate Drag Offset
            if (e.target === thumb || thumb.contains(e.target)) {
                 const thumbRect = thumb.getBoundingClientRect();
                 dragOffset = clientX - thumbRect.left;
            } else {
                 // Clicking track: Center thumb on pointer
                 dragOffset = thumbW / 2;
            }

            isDragging = true;
            
            // Jump if clicking track
            if (e.target !== thumb && !thumb.contains(e.target)) {
                 setThumbPosition(clientX);
            }
            // Global listeners
            document.addEventListener('mousemove', onPointerMove);
            document.addEventListener('mouseup', onPointerUp);
            document.addEventListener('touchmove', onPointerMove, {passive: false});
            document.addEventListener('touchend', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            setThumbPosition(clientX);
        };

        const onPointerUp = () => {
            this.lastInteractionTime = Date.now();
            if (!isDragging) return;
            isDragging = false;
            snapToNearest();
            
            document.removeEventListener('mousemove', onPointerMove);
            document.removeEventListener('mouseup', onPointerUp);
            document.removeEventListener('touchmove', onPointerMove);
            document.removeEventListener('touchend', onPointerUp);
        };

        container.addEventListener('mousedown', onPointerDown);
        container.addEventListener('touchstart', onPointerDown, {passive: false});

        // Initialize UI state
        setTimeout(() => this.setSystemState('STANDBY'), 0);
    }

    setSystemState(newState) {
        // Determine transition speed based on target state
        // Constant slow speed (0.005) for smooth on AND off ramps
        this.lerpSpeed = 0.005;

        this.systemState = newState;

        // Update Toggle Switch UI
        if (this.uiThumb && this.uiContainer) {
            const labels = this.uiContainer.querySelectorAll('div[data-id]');
            const index = this.statePositions[newState];
            const width = 320; 
            const padding = 6;
            const thumbWidth = (width - (padding * 2)) / 3;
            
            // Calculate Position
            const targetLeft = padding + (index * thumbWidth);
            this.uiThumb.style.left = targetLeft + 'px';
            
            // Update Thumb Styling (Optional: Change color based on state?)
            if (newState === 'ACTIVE') {
                 this.uiThumb.style.background = 'linear-gradient(180deg, rgba(0, 80, 150, 0.9), rgba(0, 60, 120, 0.9))';
                 this.uiThumb.style.border = '1px solid rgba(0, 170, 255, 0.3)';
                 this.uiThumb.style.boxShadow = '0 0 15px rgba(0, 170, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            } else if (newState === 'STANDBY') {
                 this.uiThumb.style.background = 'linear-gradient(180deg, rgba(30, 40, 50, 0.9), rgba(20, 30, 40, 0.9))';
                 this.uiThumb.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                 this.uiThumb.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
            } else {
                 // OFF
                 this.uiThumb.style.background = 'linear-gradient(180deg, rgba(20, 20, 25, 0.9), rgba(10, 10, 15, 0.9))';
                 this.uiThumb.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                 this.uiThumb.style.boxShadow = 'none';
            }

            // Update Labels
            labels.forEach(l => {
                if (l.getAttribute('data-id') === newState) {
                    l.style.color = '#ffffff'; 
                    l.style.textShadow = '0 0 8px rgba(0, 170, 255, 0.6)';
                } else {
                    l.style.color = '#555'; // Dim others
                    l.style.textShadow = 'none';
                }
            });
        } 
        
        // Logic continues...
        if (newState === 'ACTIVE') {
            this.lightTargets = { ambient: 0.2, core: 0.4 };
            this.targetSimIntensity = 1.0; // Ramp up simulation
            this.targetStandbyMix = 0.0;   // Fade out Standby Pulse
        } else if (newState === 'STANDBY') {
            // Dim but visible (No Spot), core will pulse
            this.lightTargets = { ambient: 0.05, core: 0.2 };
            this.targetSimIntensity = 0.0; // Ramp down simulation (Chaos fades out)
            this.targetStandbyMix = 1.0;   // Fade in Standby Pulse
        } else {
            // OFF
            this.lightTargets = { ambient: 0, core: 0 };
            this.targetSimIntensity = 0.0; // Fade out Chaos
            this.targetStandbyMix = 0.0;   // Fade out Standby Pulse
        }
    }

    clearElectrons() {
        if (this.electrons) {
            this.electrons.forEach(e => {
                e.active = false;
                e.mesh.visible = false;
            });
        }
        if (this.circuitMeshes) {
            this.circuitMeshes.forEach(mesh => {
                 mesh.userData.intensity = 0;
                 mesh.material.opacity = 0.05;
                 mesh.material.color.setHex(0x041725);
            });
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

        // SpotLight Removed per user feedback ("Distracting dot")
    }

    initGeometry() {
        this.group = new THREE.Group();
        // 20-degree vertical tilt (X-axis) for the whole object per user request
        // Increased from 10 to 20 to reveal more of the "Top Crown".
        this.group.rotation.x = 20 * (Math.PI / 180); 
        this.scene.add(this.group);

        // OUTER SHELL GROUP (Lattice + Nodes)
        // Separate group to allow independent rotation from the central sphere
        this.outerShell = new THREE.Group();
        this.group.add(this.outerShell);

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
        this.outerShell.add(this.icosahedron); // Add to outer shell

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

                // Add to outer shell so it rotates with the lattice
                if (this.outerShell) {
                    this.outerShell.add(node);
                } else {
                    this.group.add(node);
                }
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
        this.controls.enablePan = false; // Disable Panning (Right Click / 2-Finger Drag) to keep object centered
        
        // FORCE CSS to allow touch handling
        this.renderer.domElement.style.touchAction = 'none';

        // --- Interaction Tracking (Auto-Recenter) ---
        this.lastInteractionTime = Date.now();
        this.initialCameraPos = this.camera.position.clone(); // {x:0, y:0, z:5} usually
        
        this.controls.addEventListener('start', () => {
             this.isInteracting = true;
             this.lastInteractionTime = Date.now();
        });
        this.controls.addEventListener('end', () => {
             this.isInteracting = false;
             this.lastInteractionTime = Date.now();
        });
        
        // Also update timestamp on wheel/touch zoom (handled outside controls)
        const updateInteraction = () => { this.lastInteractionTime = Date.now(); };

        // --- 1. Custom Mouse Wheel Zoom (Desktop) ---
        const handleZoom = (e) => {
            // Strictly disable wheel zoom on mobile
            if (this.isMobile) return; 

            updateInteraction();
            e.preventDefault();
            e.stopPropagation();

            if (e.deltaY === 0) return;

            const minD = 1.2;
            const maxD = 10.0; // Reduced from 60.0 to prevent disappearing
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

        // --- 2. Custom Pinch-to-Zoom & Tap Logic (Mobile) ---
        let initialPinchDist = 0;
        
        // Tap Variables
        let touchStartTime = 0;
        let lastTapTime = 0;
        let touchStartPos = {x:0, y:0};
        let tapTimeout = null;
        
        const handleTouchStart = (e) => {
            updateInteraction();
            // Prevent scroll initiations
            if (e.cancelable) e.preventDefault();
            
            // Tap Detection Init
            if (e.touches.length === 1) {
                touchStartTime = Date.now();
                touchStartPos.x = e.touches[0].pageX;
                touchStartPos.y = e.touches[0].pageY;
            } else {
                touchStartTime = 0; // Cancel tap if multiple fingers
            }

            // STRICTLY require exactly 2 touches for pinch
            if (e.touches.length === 2) {
                const dx = e.touches[0].pageX - e.touches[1].pageX;
                const dy = e.touches[0].pageY - e.touches[1].pageY;
                initialPinchDist = Math.sqrt(dx * dx + dy * dy);
            } else {
                 // Reset if not 2 fingers
                 initialPinchDist = 0;
            }
        };

        const handleTouchMove = (e) => {
            updateInteraction();
            // Prevent default page zooming/panning/scrolling for ALL touches on canvas
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();

            // STRICTLY require exactly 2 touches for pinch
            if (e.touches.length === 2) {
                const dx = e.touches[0].pageX - e.touches[1].pageX;
                const dy = e.touches[0].pageY - e.touches[1].pageY;
                const currentDist = Math.sqrt(dx * dx + dy * dy);
                
                if (initialPinchDist > 0) {
                    const delta = currentDist - initialPinchDist;
                    
                    // Sensitivity factor for touch
                    const touchZoomSpeed = 0.02; 

                    const minD = 1.2;
                    const maxD = 10.0; // Reduced to 10.0
                    
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

        const handleTouchEnd = (e) => {
             initialPinchDist = 0;
             
             // Tap Logic (Must be Single Finger Lift)
             if (e.changedTouches.length === 1 && touchStartTime > 0) {
                 const duration = Date.now() - touchStartTime;
                 const dx = e.changedTouches[0].pageX - touchStartPos.x;
                 const dy = e.changedTouches[0].pageY - touchStartPos.y;
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 
                 // Thresholds: Short duration (<250ms), minimal movement (<10px) (No Drag)
                 if (duration < 250 && dist < 10 && this.isMobile) {
                     const now = Date.now();
                     
                     if (now - lastTapTime < 300) {
                         // --- DOUBLE TAP: Power Down (OFF) ---
                         if (tapTimeout) clearTimeout(tapTimeout);
                         this.setSystemState('OFF');
                     } else {
                         // --- SINGLE TAP: Power Up (ACTIVE) ---
                         // Debounce to wait for potential double tap
                         tapTimeout = setTimeout(() => {
                             this.setSystemState('ACTIVE');
                         }, 300);
                     }
                     lastTapTime = now;
                 }
             }
             touchStartTime = 0;
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
            this.isMobile = (this.width <= 600);

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);

            // On Mobile Resize (Orientation Change), force check camera distance soon
            // We don't snap immediately to avoid jarring, auto-recenter handles it.
            
            if (this.fatLines) {
                 this.fatLines.forEach(mat => {
                     mat.resolution.set(this.width, this.height);
                 });
            }

            // --- VIEW OFFSET FIX (Centering) ---
            // On Mobile, shift the effective viewport DOWN slightly so the object appears HIGHER.
            // This is safer than moving the object pivot (swapping target)
            if (this.isMobile) {
                // Shift Down by 12% of height -> Object appears UP by 12%
                const offset = this.height * 0.12; 
                this.camera.setViewOffset(this.width, this.height, 0, offset, this.width, this.height);
            } else {
                this.camera.clearViewOffset();
            }
        });
        
        // Trigger once to set init state
        if (this.isMobile) {
             const offset = this.height * 0.12; 
             this.camera.setViewOffset(this.width, this.height, 0, offset, this.width, this.height);
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.controls.update();

        // --- Auto-Recenter Logic ---
        // If not interacting and idle for > 2.5 seconds
        if (!this.isInteracting && this.lastInteractionTime) {
            const now = Date.now();
            const timeSinceInteraction = now - this.lastInteractionTime;
            
            // 1. Camera Recenter (2.5s)
            if (timeSinceInteraction > 2500) {
                 const lerpSpeed = 0.03;
                 
                 // Determine Targets based on Device
                 let targetLookAt = new THREE.Vector3(0,0,0);
                 const baseZ = 5;
                 let targetCamPos = this.initialCameraPos ? this.initialCameraPos.clone() : new THREE.Vector3(0,0,baseZ);
    
                 if (this.isMobile) {
                     // Adjust Z based on aspect ratio to prevent side clipping
                     const aspect = this.width / this.height;
                     const targetZ = Math.max(baseZ, baseZ + (2.5 / Math.max(aspect, 0.4)) - 3.0); 
                     
                     targetCamPos.z = targetZ;
                 }
    
                 this.camera.position.lerp(targetCamPos, lerpSpeed);
                 this.controls.target.lerp(targetLookAt, lerpSpeed);
            }
            
            // 2. Auto-Standby Mode (10s)
            // If currently ACTIVE and idle for 10s, drift to STANDBY
            if (this.systemState === 'ACTIVE' && timeSinceInteraction > 10000) {
                 this.setSystemState('STANDBY');
            }
        }

        const lerpFactor = this.lerpSpeed || 0.05;
        
        // Pulse Timer (Global)
        this.standbyPulseTimer = (this.standbyPulseTimer || 0) + 0.015; 
        const pulse = (Math.sin(this.standbyPulseTimer) * 0.5 + 0.5); 

        // --- Light & State Logic ---
        if (this.lightTargets) {
            // 1. Synced State Updates
            // Update the drivers (simIntensity, standbyMix) first so lights follow exactly
            
            // Lerp Simulation Intensity
            if (this.targetSimIntensity !== undefined) {
                 this.simIntensity += (this.targetSimIntensity - this.simIntensity) * lerpFactor;
            } else {
                 this.simIntensity = (this.systemState === 'ACTIVE') ? 1.0 : 0.0;
            }

            // Lerp Standby Mix
            let targetDiff = (this.targetStandbyMix || 0) - this.standbyMix;
            
            // SEQUENTIAL TRANSITION LOGIC:
            // If targetting STANDBY (target=1.0) and currently ACTIVE (simIntensity > 0.1),
            // we FORCE the standbyMix target to 0.0 until the simulation has faded out.
            // This guarantees: Active -> Power Down (Fade Out) -> Standby (Fade In Breathing)
            if (this.targetStandbyMix > 0.5 && this.simIntensity > 0.05) {
                 // Hold Mix at 0 while fading out chaos
                 const holdTarget = 0.0;
                 targetDiff = holdTarget - this.standbyMix;
            }

            this.standbyMix += targetDiff * lerpFactor;

            // 2. Derive Lighting Directly (No Lag)
            // Ambient: Active(0.2) -> Standby(0.05) -> OFF(0.0)
            const activeAmbient = 0.2;
            const standbyAmbient = 0.05;
            this.ambientLight.intensity = (this.simIntensity * activeAmbient) + (this.standbyMix * standbyAmbient);

            // Core: Active(0.4) -> Standby(Pulse) -> OFF(0.0)
            const activeCore = 0.4;
            
            // Pulse: Standard mix logic now that we have sequential timing
            // We can remove the squared dampening since the timing is now handled by the state machine above.
            // Or keep it for extra smoothness. Let's keep it simple first.
            const standbyPulseVal = 0.05 + (pulse * 0.35); 
            
            const currentCore = (this.simIntensity * activeCore) + (this.standbyMix * standbyPulseVal);

            if (this.coreLight) {
                 this.coreLight.intensity = currentCore;
            }
        }

        // --- ROTATION LOGIC ---
        if (this.centralSphere) {
             // Target Speed: 0.5 Rev Per Second (Power-Up State)
             // Reduced from 1.0 per user request for a more "gentle curve".
             const baseSpeed = (Math.PI * 2) / 120; // 60fps * 2s = 120 frames per rev
             const currentSpeed = baseSpeed * this.simIntensity;
             
             // Rotation Axis: World Y (Vertical Spin)
             // The Sphere has rotation.x = 90deg (PI/2).
             // This maps local Z axis to World -Y axis (pointing down).
             // To spin like a top (around World Y), we rotate around Local Z.
             if (currentSpeed > 0.0001) {
                 this.centralSphere.rotateZ(currentSpeed);
                 
                 // --- OUTER SHELL ROTATION (Contra-Rotation + Biaxial) ---
                 // Rotate the lattice structure in the opposite direction
                 // Speed: 50% of the core speed for a parallax effect
                 if (this.outerShell) {
                     // 1. Primary Axis: Lateral Spin (Contra)
                     this.outerShell.rotateY(-currentSpeed * 0.50); 
                     
                     // 2. Secondary Axis: Tumble (Biaxial)
                     // Adding X-axis rotation creates a complex gyroscopic tumble ("Gimbal" feel)
                     this.outerShell.rotateX(currentSpeed * 0.20); 
                 }
             }
        }

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
                        let intensity = 0;
                        if (mesh.userData.intensity > 0.01) {
                            mesh.userData.intensity *= 0.92;
                            intensity = mesh.userData.intensity;
                            
                            const r = baseR + (0.0 - baseR) * intensity;   
                            const g = baseG + (0.6 - baseG) * intensity;   
                            const b = baseB + (1.0 - baseB) * intensity;   
                            mesh.material.color.setRGB(r, g, b);
                        } else if (mesh.userData.intensity > 0) {
                            mesh.userData.intensity = 0;
                            mesh.material.color.setRGB(baseR, baseG, baseB);
                        }
                        
                        // GLOBAL FADE for Lines based on simIntensity
                        // Base opacity 0.05 fades to 0
                        // Active opacity fades proportionally
                        const baseOpacity = 0.05 + (0.95 * intensity);
                        mesh.material.opacity = baseOpacity * this.simIntensity;
                        // Determine visibility to save draw calls if fully transparent
                        mesh.visible = (mesh.material.opacity > 0.001);
                    });
                }
                this.electrons.forEach(e => {
                    if (!e.active) {
                        if (e.delay > 0) e.delay--;
                        // Remove strict 'systemState === ACTIVE' check.
                        // Allow electrons to spawn as long as simIntensity is > 0.1.
                        // This allows activity to "wind down" gracefully during Power Down/Standby transitions.
                        else if (this.simIntensity > 0.1 && Math.random() < (0.01 + activityLevel * 0.1) * this.simIntensity) {
                             e.active = true;
                             e.pathIndex = Math.floor(Math.random() * this.paths.length);
                             e.t = 0; e.speed = 0.01 + Math.random() * 0.04 + (activityLevel * 0.03); 
                             e.mesh.visible = true;
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
                                // Fade electron trail based on SimIntensity
                                e.mesh.material.opacity = this.simIntensity; 
                            }
                        }
                    }
                });
            }

            // --- NEURAL ACTIVITY (Node Flashing) ---
            const dark = new THREE.Color(0x000000);

            // STANDBY PULSE CALCULATION (Global for all nodes)
            // Driven by this.standbyMix (0.0 to 1.0)
            let standbyIntensity = 0;
            if (this.standbyMix > 0.001) {
                // Low floor (0.05) to High (0.4) - Deep breathing
                // Re-use 'pulse' calculated at top of animate()
                standbyIntensity = 0.05 + (pulse * 0.35); 
                // We multiply by standbyMix so it fades in/out
                standbyIntensity *= this.standbyMix;
            }

            this.nodes.forEach(node => {
                const data = node.userData;

                // --- 1. CHAOS CALCULATION (Active Mode) --- 
                // Always calculate this state if simIntensity > 0 OR if we are fading out chaos
                // We run this update loop essentially always to keep state consistent, 
                // but we only apply visual intensity if simIntensity > 0.
                
                if (data.firingState <= 0) {
                    if (data.fireCooldown > 0) {
                        data.fireCooldown -= 1; 
                    } else {
                        // Only fire if simIntensity is high enough to trigger
                        // Using '1.0' as probability baseline.
                        if (Math.random() < 0.02 * this.simIntensity) {
                            data.firingState = 1.0; 
                            data.fireCooldown = 20 + Math.random() * 60; 
                        }
                    }
                } else {
                    data.firingState *= 0.92; 
                    if (data.firingState < 0.01) data.firingState = 0;
                }

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

                // Base Chaos Intensity
                let chaosIntensity = Math.max(proximityIntensity, data.firingState * 5.0);
                // Apply Global Fader
                chaosIntensity *= this.simIntensity;

                // --- 2. COMBINE WITH STANDBY ---
                
                let finalIntensity = chaosIntensity;
                
                // Additive Mixing or Max? 
                // If transitioning Active -> Standby:
                // Chaos is fading out (simIntensity 1->0)
                // Standby is fading in (standbyMix 0->1)
                // We simply add them. 
                
                finalIntensity += standbyIntensity;

                // Color Mixing
                // Chaos uses 'Base Color'. Standby uses 'Base Color @ 50% Saturation'.
                // If detailed transition needed, we'd lerp saturation.
                // For now, let's just stick to Base Color which is close enough.
                // Or if standby is dominant, use slightly desaturated?
                // Let's keep it simple: Use Base Color.
                
                // Apply Final Intensity
                node.material.emissive.lerpColors(dark, data.baseColor, Math.min(1.0, finalIntensity));
                node.material.emissiveIntensity = finalIntensity;

                // Update Halo Opacity 
                if (data.halo) {
                    data.halo.material.opacity = Math.min(0.4, finalIntensity * 0.4); 
                }

                // Scale Logic (Chaos causes bumps, Standby is flat)
                // Chaos scale:
                const chaosScaleDelta = (proximityScale + (data.firingState * 0.4)) * this.simIntensity;
                
                const currentScale = node.scale.x;
                const targetScale = 1.0 + chaosScaleDelta; 
                const newScale = currentScale + (targetScale - currentScale) * 0.4; 
                node.scale.setScalar(newScale);
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}
