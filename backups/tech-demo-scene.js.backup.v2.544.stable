import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { HaloRotator } from './halo-rotator.js';

export class TechDemoScene {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        // v2.274: FIXED - isMobile should use WINDOW width to properly detect "splitscreen desktop" vs "true tablet"
        // If we use container width, a desktop split-screen < 1024 triggers mobile logic (backgrounds, zooms, etc).
        // Since the requirement is iPad Air (820px) = Mobile/Tablet Layout:
        // v2.334: Updated to <= 1024 to include iPad Pro Portrait (1024px) in the "Mobile Zoom" logic.
        this.isMobile = (window.innerWidth <= 1024);

        console.log("Tech Demo Scene Initialized - vDesignTwo.10 (Isolated Branch)");
        
        this.systemState = 'STANDBY'; // ACTIVE, STANDBY, OFF
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

        // v2.429: Active Card Sync State
        this.lastActiveCardIndex = -1;
        this.isCardPowerActive = false; // v2.431: Hysteresis State

        // --- Configuration (Data Attributes) ---
        this.config = {
            standbyTimeout: 120,    // Seconds before auto-standby (data-standby-timeout)
            standbyWarning: 30,     // Seconds for warning countdown (data-standby-warning)
            autoRecenter: 2.5,      // Seconds before camera recenter (data-auto-recenter)
            lerpSpeed: 0.015,       // Transition speed factor (data-lerp-speed)
            minVelocity: 0.0025,    // Min transition step per frame (data-min-velocity)
            rotationRPM: 0.17,      // Revs per second (approx) (data-rotation-rpm)
            cameraDistance: 5.0     // Z-Distance (Zoom) (data-camera-distance)
        };
        this.parseConfig();

        this.initScene();
        this.initLights();
        this.initGeometry();
        // this.initControls(); // Interaction disabled for Tech Demo (Static View)
        this.initUI(); // Add UI Controls
        this.initGlobalInteraction(); // Global event listeners for standby timer
        this.initHaloRotator();
        this.handleResize();
        this.animate();
    }

    /* 
    initControls() {
        if (!this.camera || !this.renderer) return;
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false; // Disabled Zoom
        this.controls.enablePan = false;  // Disabled Pan
        this.controls.autoRotate = false; // Manual Rotation only
        this.controls.autoRotateSpeed = 4.0;
        
        // Limits
        this.controls.minDistance = 2.0;
        this.controls.maxDistance = 15.0;
    } 
    */
    
    // Stub for initControls to prevent errors if called
    initControls() {}

    initGlobalInteraction() {
        // Initialize timestamp
        this.lastInteractionTime = Date.now();
        
        const resetTimer = () => {
             this.lastInteractionTime = Date.now();
             
             // Optional: If in STANDBY, wake up on click? 
             // Current logic only enters standby if ACTIVE + timeout.
             // If already in STANDBY, user must manually click "Power Up" or we could auto-wake.
             // For now, ensuring the timer resets during ACTIVE state is the primary fix.
        };

        // Capture all relevant events on the document to ensure any interaction delays standby
        ['mousedown', 'mousemove', 'keydown', 'touchstart', 'touchmove', 'wheel', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });
    }

    initHaloRotator() {
        // Initialize the Ring Rotators
        // SVG is a sibling of the container (#tech-demo-scene), so we look at the parent
        const svg = this.container.parentElement.querySelector('svg');
        if (svg) {
            console.log('Initializing Halo Rotators (Dual Ring)...');
            
            // Catch Static Needle for Status Updates
            this.staticNeedle = svg.querySelector('#static-needle');

            // Outer Ring (#halo-ring-outer): Blue, r=270-330 approx
            // v2.435: Reset to Standard Visual Bounds (270-330) + Safety Gap (280+)
            this.rotatorOuter = new HaloRotator(svg, '#halo-ring-outer', {
                hitMin: 275, // Allow 5px intrusion into gap
                hitMax: 400, // Reduced from 450
                snapInterval: 60, // 6 items = 60 degrees
                // Tailwind Class Overrides (Blue Theme)
                markerClassInactive: 'fill-blue-500',
                markerClassActive: 'fill-emerald-500',
                // v2.543: Muted Inactive Text State (Slate-500/50, No Glow)
                textClassInactive: 'fill-slate-500/50 drop-shadow-none',
                textClassActive: 'fill-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]',
                // v2.434: Explicit Ring Classes for Hover
                ringClassIdle: 'stroke-blue-500/10',
                ringClassHover: 'stroke-blue-500/50'
            });

            // Inner Ring (#halo-ring-inner): Purple/Slate, r=200-260 approx
            // v2.435: Reset to Standard Visual Bounds (200-260) with 5px gap buffer
            this.rotatorInner = new HaloRotator(svg, '#halo-ring-inner', {
                hitMin: 180, // Allow 20px slop inside center
                hitMax: 265, // Allow 5px into gap
                snapInterval: 60, // 6 items = 60 degrees
                // Tailwind Class Overrides (Slate Theme)
                markerClassInactive: 'fill-slate-400',
                markerClassActive: 'fill-emerald-500', 
                // v2.543: Muted Inactive Text State (Slate-500/50, No Glow)
                textClassInactive: 'fill-slate-500/50 drop-shadow-none',
                textClassActive: 'fill-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]',
                // v2.434: Explicit Ring Classes for Hover
                ringClassIdle: 'stroke-slate-500/10',
                ringClassHover: 'stroke-slate-500/50'
            });

        } else {
            console.warn('HaloRotator: SVG not found relative to container');
        }
    }

    parseConfig() {
        if (!this.container) return;
        
        const getFloat = (attr, def) => {
            const val = this.container.getAttribute(attr);
            return val ? parseFloat(val) : def;
        };

        this.config.standbyTimeout = getFloat('data-standby-timeout', 120);
        this.config.standbyWarning = getFloat('data-standby-warning', 30);
        this.config.autoRecenter = getFloat('data-auto-recenter', 2.5);
        this.config.lerpSpeed = getFloat('data-lerp-speed', 0.015);
        this.config.minVelocity = getFloat('data-min-velocity', 0.0025);
        this.config.rotationRPM = getFloat('data-rotation-rpm', 0.17);
        this.config.cameraDistance = getFloat('data-camera-distance', 5.0);
        
        console.log("Icosahedron Config Loaded:", this.config);
    }

    initUI() {
        // Inject Styles for Responsive UI
        if (!document.getElementById('ampere-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'ampere-ui-styles';
            style.textContent = `
                /* 
                  New "Inline Stack" Layout (v2.300+):
                  Instead of absolute positioning scattered everywhere, we wrap the 
                  Track, Status, and Warning into a single #ampere-controls-cluster
                  that sits naturally in the flex flow BELOW the main ring scene.
                */

                #ampere-controls-cluster {
                    position: relative;
                    /* No absolute - we want it in the flow */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    z-index: 100;
                    margin-top: 2rem; /* Breathing room from ring */
                    width: 100%;
                    max-width: 400px;
                    pointer-events: none; /* Let clicks pass through gaps */
                }

                #ampere-ui-track {
                    position: relative; /* Static inside cluster */
                    top: auto;
                    left: auto;
                    bottom: auto;
                    right: auto;
                    transform: none;
                    
                    width: 320px;
                    height: 48px;
                    
                    /* Apple Glass Look 2026: "Muted Pebble" */
                    /* High opacity, dark, solid feel. Not a thin sheet of glass */
                    background-color: rgba(20, 20, 24, 0.85);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border-radius: 999px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(0,0,0,0.4);
                    
                    /* Deep, rich shadow */
                    box-shadow: 0 20px 40px -12px rgba(0,0,0,0.6); 
                    transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0; 
                    user-select: none;
                    -webkit-user-select: none;
                    touch-action: none;
                    cursor: pointer;
                    box-sizing: border-box;
                    pointer-events: auto;
                    isolation: isolate; /* Create stacking context for pseudo-children */
                }

                /* v2.525: Removed Complex Border Layer for Desktop Track */
                #ampere-ui-border-layer {
                    display: none;
                }
                
                /* v2.525: Removed #ampere-ui-border-layer logic entirely. */
                /* Restored track to simple css styling in style block above. */

                /* 
                #ampere-ui-track:hover {
                    transform: translateY(-2px);
                }
                */
                
                // --- JS Logic for State ---
                // ... (rest of logic)
                
                #ampere-system-status {
                    position: relative; /* Static inside cluster */
                    top: auto;
                    left: auto;
                    bottom: auto;
                    right: auto;
                    transform: none;
                    
                    /* v2.531: Restored Pill Status Container */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    
                    /* Pill Visuals (Matches Standby Warning) */
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);

                    transition: opacity 0.5s ease;
                    opacity: 0;
                    pointer-events: auto;
                    order: -1; /* Place ABOVE the track */
                }

                 #ampere-standby-warning {
                    position: relative; /* Static inside cluster */
                    top: auto;
                    left: auto;
                    bottom: auto;
                    transform: none;
                    
                    /* v2.529: Standby Warning Pill Style */
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 16px;
                    border-radius: 9999px;
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);

                    color: rgba(200, 220, 255, 0.9);
                    font-family: monospace;
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 1.5px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.5s ease;
                    white-space: nowrap;
                    text-shadow: 0 0 10px rgba(100, 150, 255, 0.4);
                    order: -2; /* Place ABOVE status */
                }
                
                /* Mobile: Hide legacy bottom track. Use Header Controls. */
                @media (max-width: 1023px) {
                    #ampere-controls-cluster {
                        display: none !important;
                    }
                }

                .ampere-ui-label {
                    flex: 1;
                    /* ... (rest unchanged) */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                    color: rgba(255,255,255,0.6);
                    z-index: 2;
                    font-weight: 600;
                    pointer-events: none;
                    transition: color 0.3s ease, text-shadow 0.3s ease;
                }

                #ampere-ui-thumb {
                    position: absolute;
                    top: 5px; /* (48px - 36px) / 2 = 6px -> -1px border = 5px */
                    left: 5px;
                    height: 36px;
                    background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)) padding-box,
                                linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.45) 100%) border-box;
                    border: 1px solid transparent; /* Required for border-box gradient */
                    border-radius: 999px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    /* Smoother easing (easeOutQuint) */
                    transition: left 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
                    z-index: 1;
                    box-sizing: border-box;
                }

                /* Hover Interaction: Lift and Glow when user interacts with the track */
                #ampere-ui-track:hover #ampere-ui-thumb {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 0 12px rgba(255,255,255,0.3);
                    transform: scale(1.02);
                    cursor: grab;
                }
                
                #ampere-ui-thumb:active {
                    cursor: grabbing;
                    transform: scale(0.98);
                }
                
                /* DEPRECATED MOBILE OVERRIDES (Now handled by display:none) */
                @media (max-width: 1023px) {
                    .ampere-ui-label {
                        font-size: 10px;
                        letter-spacing: 0px;
                    }
                }
                
.ampere-dot-row {
                        display: flex;
                        gap: 2px;
                        margin-bottom: 8px;
                        justify-content: center;
                    }
                    .ampere-dot {
                        width: 8px; /* Defined block width */
                        height: 12px; /* Taller rectangular blocks */
                        border-radius: 1px; /* Slight bevel */
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        box-shadow: inset 0 0 2px rgba(0,0,0,0.5); /* Inner depth for glass feel */
                        transition: all 0.15s ease-out;
                    }
                    .ampere-status-text {
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        font-size: 10px;
                        font-weight: 700;
                        letter-spacing: 0.1em;
                        color: #10b981;
                        text-transform: uppercase;
                        /* text-shadow: 0 0 8px rgba(0, 200, 255, 0.5); Removed for flatter glass look */
                        min-height: 12px;
                        text-align: center;
                        white-space: nowrap;
                    }
            `;
            document.head.appendChild(style);
        }

        const padding = 5; 
        
        // --- CLUSTER CONTAINER (New v2.300) ---
        const cluster = document.createElement('div');
        cluster.id = 'ampere-controls-cluster';
        
        // Target the explicit controls cluster container 
        let uiRoot = document.getElementById('tech-demo-controls-target');
        
        if (!uiRoot) {
             console.warn("TechDemoScene: #tech-demo-controls-target not found. Falling back to scene container.");
             uiRoot = this.container.closest('.group\\/scene') || this.container;
             if (window.getComputedStyle(uiRoot).position === 'static') {
                 uiRoot.style.position = 'relative';
             }
        }

        // --- Multi-Function Display (Status) ---
        // v2.528: Only Status Display retained (Power Meter). Slider removed.
        const statusContainer = document.createElement('div');
        this.uiStatusContainer = statusContainer;
        statusContainer.id = 'ampere-system-status';
        
        // Dots Row
        const dotRow = document.createElement('div');
        dotRow.className = 'ampere-dot-row';
        this.uiDots = [];
        for (let i = 0; i < 20; i++) {
             const dot = document.createElement('div');
             dot.className = 'ampere-dot';
             dotRow.appendChild(dot);
             this.uiDots.push(dot);
        }
        statusContainer.appendChild(dotRow);

        const statusText = document.createElement('div');
        this.uiStatusText = statusText;
        statusText.className = 'ampere-status-text';
        statusText.innerText = 'INITIALIZING...';
        statusContainer.appendChild(statusText);

        // --- Standby Warning UI ---
        const warning = document.createElement('div');
        this.standbyWarning = warning;
        warning.id = 'ampere-standby-warning';
        warning.innerText = '';
        
        // --- CLUSTER ASSEMBLY ---
        // Stack Order: Warning (Top) -> Status (Bottom)
        cluster.appendChild(warning);
        cluster.appendChild(statusContainer);
        
        uiRoot.appendChild(cluster);

        // Initialize UI state
        // We defer slightly to ensure DOM is ready
        setTimeout(() => this.setSystemState('STANDBY'), 0);
    }

    setSystemState(newState) {
        // v2.429: Force Card Sync Refresh
        this.lastActiveCardIndex = -1;

        // Determine transition speed based on target state
        // Uses configured lerp speed
        this.lerpSpeed = this.config.lerpSpeed;

        this.systemState = newState;
        
        // Update Body Attribute for Global CSS Styling (Titles, etc.)
        document.body.setAttribute('data-system-state', newState);

        // v2.532: Update Power Button Tooltip & ARIA
        const tooltip = document.getElementById('power-btn-tooltip');
        // Select Desktop Button specifically or all buttons
        const btns = document.querySelectorAll('.power-toggle-btn');
        
        if (tooltip) {
             if (newState === 'ACTIVE') tooltip.innerText = 'Turn Off';
             else if (newState === 'STANDBY') tooltip.innerText = 'Wake';
             else tooltip.innerText = 'Turn On';
        }
        
        btns.forEach(btn => {
             btn.setAttribute('aria-pressed', newState === 'ACTIVE');
             // Update aria-label dynamically too for screen readers
             const action = (newState === 'ACTIVE') ? 'Turn Off' : (newState === 'STANDBY' ? 'Wake' : 'Turn On');
             btn.setAttribute('aria-label', `Power Control: ${action}`);
        });

        // Update Agent Card Status (v2.428)
        // Active: Front Door Agent (Index 0) is Active, others are Standby.
        // Standby/Off: All agents are Standby.
        const cards = document.querySelectorAll('.socket-card-container');
        cards.forEach((card, index) => {
            if (newState === 'ACTIVE' && index === 0) {
                card.setAttribute('data-agent-status', 'active');
            } else {
                card.setAttribute('data-agent-status', 'standby');
            }
        });

        // Sync HaloRotator State (Both Rings)
        if (this.rotatorOuter) this.rotatorOuter.setPowerState(newState);
        if (this.rotatorInner) this.rotatorInner.setPowerState(newState);

        // Update Toggle Switch UI
        if (this.uiThumb && this.uiContainer) {
            const labels = this.uiContainer.querySelectorAll('div[data-id]');
            const index = this.statePositions[newState];
            const width = this.uiContainer.clientWidth || 320; 
            const padding = 6;
            const thumbWidth = (width - (padding * 2)) / 3;
            
            // Calculate Position
            const targetLeft = padding + (index * thumbWidth);
            this.uiThumb.style.left = targetLeft + 'px';
            
            // Update Thumb Styling (Muted Pebble Theme v2.512)
            // Logic: The thumb itself acts as a glass lens ("Pebble").
            // It does NOT have its own color. Color is transmitted via the "Glow" layer underneath.
            // This ensures the surface looks like glass/reflection only.
            
            // Core Glass Properties (Shared across states)
            // No gradient blur. Just raw glass transparency.
            this.uiThumb.style.background = 'rgba(255, 255, 255, 0.05)'; 
            this.uiThumb.style.border = 'none'; // Border is handled by glint layer ideally, but here we can use subtle box shadow ring
            // Sharp shadow + Inner Reflection Rim
            this.uiThumb.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.1)';
            
            if (newState === 'ACTIVE') {
                 // Active: No Thumb Glow
            } else if (newState === 'STANDBY') {
                 // Standby: No Thumb Glow
            } else {
                 // Off: No Glow
            }

            // Update Labels
            labels.forEach(l => {
                const id = l.getAttribute('data-id');
                if (id === newState) {
                    // Selected State Style
                    if (id === 'ACTIVE') {
                        l.style.color = '#10b981'; // Emerald 500
                        l.style.textShadow = 'none';
                    } else if (id === 'STANDBY') {
                         l.style.color = '#94a3b8'; // Slate 400
                         l.style.textShadow = 'none';
                    } else {
                         l.style.color = '#aabbcc'; // Grey Blue
                         l.style.textShadow = 'none';
                    }
                } else {
                    l.style.color = '#556677'; // Dim Blue-Grey
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
        
        // Mobile Override: Zoom IN for maximum visual fill (Matching 85% Clip Path)
        // v2.336: Split Layout Fit Logic. 
        // If aspect is < 0.5 (Narrow Column), we must Zoom OUT (factor 0.7) to prevent side clipping.
        // If aspect is > 0.5 (Full Width Mobile), we Zoom IN (factor 0.48) to fill the height.
        // v2.346: REMOVED Legacy Z-Positioning. Relies entirely on handleResize() for responsive Z.
        // previously: this.camera.position.z = this.isMobile ? this.config.cameraDistance * zoomFactor : this.config.cameraDistance;
        
        // Store Initial Position for Auto-Recenter (v2.189 Fix)
        // Initialize with temporary value, will be updated by handleResize logic immediately
        this.initialCameraPos = new THREE.Vector3(0, 0, 10); 

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height, false); // false = Do not update CSS style (prevent layout resizing loop)
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
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
        // v2.540: Increased scale to 120% (Desktop: 0.864, Mobile: 1.037)
        const radius = this.isMobile ? 1.037 : 0.864;
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
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

        // v2.540: Match surface radius to sphere size (120% scale)
        const sphereRadius = this.isMobile ? 1.037 : 0.864;
        const surfaceRadius = sphereRadius + 0.005; 
        
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

                // Monotone Blue/Cyan Scheme (No Christmas Vibe)
                // Restrict hue to Cyan-Blue range (approx 0.55 - 0.65)
                const hue = 0.55 + (Math.random() * 0.1); 
                const nodeColor = new THREE.Color().setHSL(hue, 0.9, 0.7);

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

            const minD = 2.0; // Increased min zoom to prevent crowding UI
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

                    const minD = 2.0; // Increased min zoom to prevent crowding UI
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
        const onResize = (source) => {
            if (!this.container) return;
            
            const prevWidth = this.width;
            const prevHeight = this.height;

            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            // v2.274: FIXED - isMobile should use WINDOW width to properly detect "splitscreen desktop" vs "true tablet"
            // If we use container width, a desktop split-screen < 1024 triggers mobile logic (backgrounds, zooms, etc).
            // Since the requirement is iPad Air (820px) = Mobile/Tablet Layout:
            // v2.334: Updated to <= 1024 to include iPad Pro Portrait (1024px) in the "Mobile Zoom" logic.
            this.isMobile = (window.innerWidth <= 1024);

            // console.log(`[TechDemoScene] Resize triggered by: ${source || 'Unknown'}`);
            // console.log(`[TechDemoScene] Window: ${window.innerWidth}x${window.innerHeight}`);
            // console.log(`[TechDemoScene] Container: ${this.width}x${this.height} (Was: ${prevWidth}x${prevHeight})`);

            this.camera.aspect = this.width / this.height;

            // --- DYNAMIC ZOOM CALCULATION (v2.238) ---
            // Requirement: The Neural Net must maintain a VISUAL size that is ~95% of the Inner Ring's diameter.
            // 
            // CONSTANTS:
            // - Inner Ring Radius (SVG): 200px (Stroke @ 230px, Width 60px -> Inner Edge 200px)
            // - SVG ViewBox Size: 800x800
            // - Icosahedron Radius (ThreeJS): 1.5 units
            //
            // LOGIC:
            // 1. Calculate the 'Visible Height/Width' of the 3D scene at Z=0.
            //    Vertical FOV (radians) = fov * PI / 180
            //    Visible Height = 2 * Distance * tan(FOV / 2)
            //
            // 2. We want the 3D Icosahedron (Height ~3.0 units) to equate to fraction 'F' of the Ring (Height 400px in 800px box).
            //    Ratio = (3.0 units) / (Visible Height units) == (400px Ring) / (800px Box)
            // 
            // 3. However, the SVG scales with the container (object-fit: contain). 
            //    The WebGL canvas fills the same container.
            //    Therefore, we only need to lock the ratio of [3D Object Size] to [WebGL Viewport Size].
            //
            //    Target Fraction: Ring Inner Diameter (400px) / ViewBox (800px) = 0.5
            //    Desired Net Size: 95% of Ring = 0.5 * 0.95 = 0.475 of Viewport Height.
            //
            //    So: 3.0 units (Object Height) should cover 47.5% of the Vertical Viewport.
            //    Visible Height = 3.0 / 0.475 = 6.315 units.
            //
            // 4. Solve for Distance:
            //    Distance = Visible Height / (2 * tan(FOV / 2))
            //    FOV = 45 deg. tan(22.5) ~= 0.4142
            //    Distance = 6.315 / (2 * 0.4142) ~= 7.62
            //
            // 5. ASPET RATIO CORRECTION (Crucial):
            //    - If Aspect < 1 (Portrait), the WebGL viewport is Height-Dominant (Tall).
            //    - The SVG uses `contain`, so the Ring shrinks to fit the WIDTH.
            //    - The Ring's size becomes relative to WIDTH, not Height.
            //    - We must switch the calculation to match the WIDTH fraction.
            
            const FOV = 45; 
            const tanHalfFOV = Math.tan( (FOV * Math.PI / 180) / 2 );
            const objectSize = 3.0; // Radius 1.5 * 2
            // v2.341: Unified Containment Logic based on Layout State
            // Rule: If Rings are Hidden (Mobile/Portrait Tablet), constrain to 95% of Dashed Ring.
            //       If Rings are Visible (Desktop/Landscape), constrain to 95% of Inner Ring.
            
            // Check CSS Media Query Matches directly to stay in sync with HTML Styles
            // Matches: (max-width: 1024px) AND (orientation: portrait) OR (max-width: 768px)
            const isRingHiddenLayout = window.matchMedia("(max-width: 1024px) and (orientation: portrait), (max-width: 768px)").matches;
            
            const dashedRingRatio = 720 / 800; // 0.9
            const innerRingRatio = 400 / 800; // 0.5
            
            const referenceRatio = (isRingHiddenLayout) ? dashedRingRatio : innerRingRatio;
            
            // User Rule: "Neuronet must be within 95% width [of the container]"
            // v2.345: Reduced to 85% for Mobile/iPad to prevent visual expansion beyond the Dashed Ring.
            // 95% was visually touching the edge due to perspective. 85% provides a safe buffer.
            const fillPercentage = (isRingHiddenLayout) ? 0.85 : 0.95; 
            
            let targetVisibleSize;

            if (this.camera.aspect >= 1.0 && !isRingHiddenLayout) {
                // LANDSCAPE DESKTOP (Height Limited, Rings Visible)
                const targetCoverage = referenceRatio * fillPercentage;
                targetVisibleSize = objectSize / targetCoverage;
            } else {
                // PORTRAIT or MOBILE (Width Limited OR Rings Hidden)
                // Use the reference ratio (Dashed or Inner)
                const targetCoverage = referenceRatio * fillPercentage;
                
                targetVisibleSize = objectSize / (this.camera.aspect * targetCoverage);
            }

            // Calculate Required Distance
            // D = Size / (2 * tan(FOV/2))
            this.camera.position.z = targetVisibleSize / (2 * tanHalfFOV);
            console.log(`[TechDemoScene] Aspect: ${this.camera.aspect.toFixed(3)}, TargetSize: ${targetVisibleSize.toFixed(3)}, Calculated Z: ${this.camera.position.z.toFixed(3)}`);
            
            // --- SYNC AUTO-RECENTER TARGET (v2.241 Fix) ---
            // Update the stored "Initial Position" so that the Auto-Recenter logic (idle timer)
            // returns to this newly calculated Responsive Z, rather than the stale Config Z.
            if (this.initialCameraPos) {
                this.initialCameraPos.z = this.camera.position.z;
            } else {
                this.initialCameraPos = this.camera.position.clone();
            }
            
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height, false);

            if (this.fatLines) {
                 this.fatLines.forEach(mat => {
                     mat.resolution.set(this.width, this.height);
                 });
            }

            // --- STRICT CENTERING (v2.183) ---
            this.camera.clearViewOffset();
        };

        // Replace window.resize with ResizeObserver (v2.239)
        // This handles container layout shifts that don't trigger window resize (e.g. flexbox adjustments)
        this.resizeObserver = new ResizeObserver((entries) => {
            /*
            for (let entry of entries) {
                 // Log entry dimensions vs clientWidth
                 console.log(`[ResizeObserver] Entry ContentRect: ${entry.contentRect.width.toFixed(2)}x${entry.contentRect.height.toFixed(2)}`);
            }
            */
            onResize('ResizeObserver');
        });
        this.resizeObserver.observe(this.container);
        
        // Trigger once to set init state
        onResize('Init');
    }

    // v2.429: Sync Active Agent Card with Halo Ring Rotation
    syncCardsToRing() {
        if (!this.rotatorInner) return;

        // 1. Calculate Active Index based on Rotation
        // Ring steps are 60 degrees. Positive rotation (CW) -> Negative Step Logic
        const interval = 60; // 360 / 6
        const numSlots = 6;
        
        // Normalize rotation
        let angle = this.rotatorInner.rotation;
        
        // Convert to step index using Math.round for "Nearest Neighbor" snapping
        let step = Math.round(angle / interval);
        
        // Wrap to 0-5
        const mod = (n, m) => ((n % m) + m) % m;
        // Step 1 (-60deg) -> Index 1. So we use -step.
        const activeIndex = mod(-step, numSlots);

        // 2. Logic Check
        // v2.431: Hysteresis Logic for Power Up/Down
        // Power Up: Wait until 95% intensity (Sync with "AI ONLINE" text)
        // Power Down: Stay on until 10% intensity (Sync with Meter Draining)
        const sim = this.simIntensity;
        if (this.isCardPowerActive) {
            // Falling Edge
            if (sim < 0.1) this.isCardPowerActive = false;
        } else {
            // Rising Edge
            if (sim > 0.95) this.isCardPowerActive = true;
        }

        // If System is OFF/STANDBY or Initializing, strictly enforce Standby on all cards.
        if (!this.isCardPowerActive) {
            if (this.lastActiveCardIndex !== -2) {
                // Apply "All Standby" once
                const cards = document.querySelectorAll('.socket-card-container');
                cards.forEach(card => card.setAttribute('data-agent-status', 'standby'));
                this.lastActiveCardIndex = -2; // Sentinel for "All Standby Applied"
            }
            return;
        }

        // If System READY, check if Index Changed
        if (activeIndex === this.lastActiveCardIndex) return;

        // 3. Apply Active State
        this.lastActiveCardIndex = activeIndex;
        const cards = document.querySelectorAll('.socket-card-container');
        
        // Safety check: ensure we have corresponding card
        if (activeIndex >= cards.length) return;

        cards.forEach((card, index) => {
            if (index === activeIndex) {
                card.setAttribute('data-agent-status', 'active');
            } else {
                card.setAttribute('data-agent-status', 'standby');
            }
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update Card Sync
        this.syncCardsToRing();
        
        if (this.controls) this.controls.update();

        // --- Static Needle Logic (Alignment Lock) ---
        if (this.staticNeedle && this.rotatorOuter && this.rotatorInner) {
            // Check if both rings are stable ("Aligned")
            const outerStable = !this.rotatorOuter.isDragging && Math.abs(this.rotatorOuter.velocity) < 0.005;
            const innerStable = !this.rotatorInner.isDragging && Math.abs(this.rotatorInner.velocity) < 0.005;
            
            const isLocked = outerStable && innerStable;
            
            // Toggle Classes (Blue <-> Emerald)
            // Initial: fill-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]
            // Locked:  fill-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]
            
            if (isLocked) {
                if (this.staticNeedle.classList.contains('fill-blue-400')) {
                    this.staticNeedle.classList.replace('fill-blue-400', 'fill-emerald-400');
                    // Note: Tailwind arbitrary value replacement can be tricky if exact string doesn't match.
                    // We remove/add to be safe.
                    this.staticNeedle.classList.remove('drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]');
                    this.staticNeedle.classList.add('drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]');
                }
            } else {
                 if (this.staticNeedle.classList.contains('fill-emerald-400')) {
                    this.staticNeedle.classList.replace('fill-emerald-400', 'fill-blue-400');
                    this.staticNeedle.classList.remove('drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]');
                    this.staticNeedle.classList.add('drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]');
                }
            }
        }

        // --- Auto-Recenter Logic ---
        // If not interacting and idle for > X seconds
        if (!this.isInteracting && this.lastInteractionTime) {
            const now = Date.now();
            const timeSinceInteraction = now - this.lastInteractionTime;
            
            // 1. Camera Recenter
            if (timeSinceInteraction > (this.config.autoRecenter * 1000)) {
                 const lerpSpeed = 0.03;
                 
                 // Determine Targets based on Device
                 let targetLookAt = new THREE.Vector3(0,0,0);
                 
                 // v2.346: Logic Update - TRUST handleResize() for Z-Position.
                 // Removed manual "Mobile Z Recalculation" overlay which was causing expansion drift.
                 // The handleResize() method updates this.initialCameraPos with the strict 85% containment Z.
                 // We simply return to THAT position.
                 let targetCamPos = this.initialCameraPos ? this.initialCameraPos.clone() : new THREE.Vector3(0,0, this.config.cameraDistance);

                 this.camera.position.lerp(targetCamPos, lerpSpeed);
                 if (this.controls) this.controls.target.lerp(targetLookAt, lerpSpeed);
            }
            
            // 2. Auto-Standby Mode (Configured Timeout)
            // If currently ACTIVE and idle for X, drift to STANDBY
            
            const standbyTimeout = this.config.standbyTimeout * 1000;
            const warningDuration = this.config.standbyWarning * 1000;
            const warningStart = standbyTimeout - warningDuration; 

            if (this.systemState === 'ACTIVE') {
                 if (timeSinceInteraction > standbyTimeout) {
                     this.setSystemState('STANDBY');
                     if (this.standbyWarning) this.standbyWarning.style.opacity = '0';
                 } else if (timeSinceInteraction > warningStart) {
                     // Show Warning Countdown
                     const remaining = Math.ceil((standbyTimeout - timeSinceInteraction) / 1000);
                     if (this.standbyWarning) {
                         // Only force opacity if not already 1 to avoid thrashing
                         if (this.standbyWarning.style.opacity !== '1') {
                            this.standbyWarning.style.opacity = '1';
                         }
                         const msg = `STANDBY IN ${remaining}s`;
                         if (this.standbyWarning.innerText !== msg) {
                             this.standbyWarning.innerText = msg;
                         }
                     }
                 } else {
                     // Clear Warning
                     if (this.standbyWarning && this.standbyWarning.style.opacity !== '0') {
                        this.standbyWarning.style.opacity = '0';
                     }
                 }
            } else {
                 // Not Active (OFF or already STANDBY) - Hide Warning
                 if (this.standbyWarning && this.standbyWarning.style.opacity !== '0') {
                    this.standbyWarning.style.opacity = '0';
                 }
            }
            
            // --- STATUS GAUGE LOGIC (Global State) ---
            if (this.uiStatusContainer) {
                 // 1. Is standby warning covering us?
                 let warningActive = (this.standbyWarning && this.standbyWarning.style.opacity === '1');
                 
                 // 2. Are we active OR fading out?
                 // Show gauge if Active, OR if simIntensity > 0 (during shutdown/standby fade)
                 let showGauge = !warningActive && (this.systemState === 'ACTIVE' || this.simIntensity > 0.02);
                 
                 if (showGauge) {
                     this.uiStatusContainer.style.opacity = '1';
                     
                     // Helper for updating Visuals
                     const totalDots = 20;
                     const activeCount = Math.floor(this.simIntensity * totalDots);
                     
                     if (this.uiDots) {
                         this.uiDots.forEach((dot, i) => {
                             if (i < activeCount) {
                                 // Active: Illuminated Glass Block (Emerald)
                                 // Inner glow (inset) + Outer glow (box-shadow)
                                 dot.style.background = '#10b981'; 
                                 dot.style.border = '1px solid #6ee7b7'; // Lighter border
                                 // Complex shadow for "lit glass" effect
                                 dot.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.5), inset 0 1px 3px rgba(255,255,255,0.4)';
                             } else {
                                 // Inactive: Dark Glass
                                 dot.style.background = 'rgba(255, 255, 255, 0.03)';
                                 dot.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                                 dot.style.boxShadow = 'inset 0 0 2px rgba(0,0,0,0.5)';
                             }
                         });
                     }
                     
                     if (this.uiStatusText) {
                         const pct = Math.floor(this.simIntensity * 100);
                         
                         if (this.systemState === 'ACTIVE') {
                             if (this.simIntensity > 0.96) {
                                 this.uiStatusText.innerText = 'AI ONLINE | V - AMP 2.0';
                                 this.uiStatusText.style.textShadow = '0 0 8px rgba(16, 185, 129, 0.5)';
                             } else {
                                 this.uiStatusText.innerText = `INITIALIZING ${pct}%`;
                                 this.uiStatusText.style.textShadow = 'none';
                             }
                         } else {
                             // Powering Down / Standby Transition
                             this.uiStatusText.innerText = `POWER ${pct}%`;
                             this.uiStatusText.style.textShadow = 'none';
                         }
                     }
                 } else {
                     this.uiStatusContainer.style.opacity = '0';
                 }
            }
        }

        const lerpFactor = this.lerpSpeed || this.config.lerpSpeed;
        
        // Pulse Timer (Global)
        this.standbyPulseTimer = (this.standbyPulseTimer || 0) + 0.015; 
        const pulse = (Math.sin(this.standbyPulseTimer) * 0.5 + 0.5); 

        // --- Light & State Logic ---
        if (this.lightTargets) {
            // 1. Synced State Updates
            // Update the drivers (simIntensity, standbyMix) first so lights follow exactly
            
            // Lerp Simulation Intensity
            if (this.targetSimIntensity !== undefined) {
                 const diff = this.targetSimIntensity - this.simIntensity;
                 
                 // Snap if very close
                 if (Math.abs(diff) < 0.005) {
                     this.simIntensity = this.targetSimIntensity;
                 } else {
                     let step = diff * lerpFactor;
                     
                     // Minimum Velocity Enforcement
                     // Prevents "stalling" or "losing steam" at the tail of the curve (80%+)
                     const minStep = this.config.minVelocity;
                     if (Math.abs(step) < minStep) {
                         step = (diff > 0) ? minStep : -minStep;
                     }
                     
                     this.simIntensity += step;
                     
                     // Clamp to prevent overshoot due to minStep
                     if ((step > 0 && this.simIntensity > this.targetSimIntensity) ||
                         (step < 0 && this.simIntensity < this.targetSimIntensity)) {
                         this.simIntensity = this.targetSimIntensity;
                     }
                 }
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
             // Target Speed based on Config RPM
             const baseSpeed = (Math.PI * 2 * this.config.rotationRPM) / 60; // Rads per frame assuming 60fps
             const currentSpeed = baseSpeed * this.simIntensity;
             
             // Rotation Axis: World Y (Vertical Spin)
             // The Sphere has rotation.x = 90deg (PI/2).
             // This maps local Z axis to World -Y axis (pointing down).
             // To spin like a top (around World Y), we rotate around Local Z.
             if (currentSpeed > 0.0001) {
                 this.centralSphere.rotateZ(currentSpeed);
                 
                 // --- OUTER SHELL ROTATION (Contra-Rotation + Biaxial) ---
                 // Rotate the lattice structure in the opposite direction
                 // Speed: 30% of the core speed (v2.116)
                 if (this.outerShell) {
                     // 1. Primary Axis: Lateral Spin (REVERSED vs Center + Slower)
                     // Center rotates around local Z (World Y).
                     // We want outer shell to rotate the OTHER way.
                     // Center uses positive rotation. So we use negative? 
                     // Wait, previous code was -0.5. 
                     // User asked to "Reverse the outer sphere's axial rotation".
                     // So we change sign from - to +.
                     this.outerShell.rotateY(currentSpeed * 0.30); 
                     
                     // 2. Secondary Axis: Tumble (Biaxial)
                     // Adding X-axis rotation creates a complex gyroscopic tumble ("Gimbal" feel)
                     this.outerShell.rotateX(currentSpeed * 0.15); 
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
                    // Reduced proximity flare (was * 2.0)
                    proximityIntensity = Math.pow(factor, 2) * 1.0; 
                    proximityScale = factor * 0.4;
                }

                // Base Chaos Intensity (Significantly reduced firing multiplier to 0.8)
                let chaosIntensity = Math.max(proximityIntensity, data.firingState * 0.8);
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
                    // Capped halo opacity further to reduce glare
                    data.halo.material.opacity = Math.min(0.25, finalIntensity * 0.25); 
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
