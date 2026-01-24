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
        // We assume anything with a Viewport < 1024 is the Tablet/Mobile realm.
        this.isMobile = (window.innerWidth < 1024);

        console.log("Tech Demo Scene Initialized - vDesignTwo.10 (Isolated Branch)");
        
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
            // Hit Area: > 265
            this.rotatorOuter = new HaloRotator(svg, '#halo-ring-outer', {
                hitMin: 265,
                hitMax: 800, // Extend to edge
                snapInterval: 60, // 6 items = 60 degrees
                // Tailwind Class Overrides (Blue Theme)
                markerClassInactive: 'fill-blue-500',
                markerClassActive: 'fill-emerald-500',
                textClassInactive: 'fill-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]',
                textClassActive: 'fill-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            });

            // Inner Ring (#halo-ring-inner): Purple/Slate, r=200-260 approx
            // Hit Area: < 265
            this.rotatorInner = new HaloRotator(svg, '#halo-ring-inner', {
                hitMin: 0,
                hitMax: 265,
                snapInterval: 60, // 6 items = 60 degrees
                // Tailwind Class Overrides (Slate Theme)
                markerClassInactive: 'fill-slate-400',
                markerClassActive: 'fill-emerald-500', 
                textClassInactive: 'fill-slate-400 drop-shadow-[0_0_10px_rgba(148,163,184,0.5)]',
                textClassActive: 'fill-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]'
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
                
                /* Mobile: Hide legacy bottom track. Use Header Controls. */
                /* v2.272: Updated breakpoint to 1023px to match Tailwind lg and include iPad Mini */
                @media (max-width: 1023px) {
                    #ampere-ui-track {
                        display: none !important;
                    }
                    #ampere-system-status {
                        display: none !important; 
                    }
                    #ampere-standby-warning {
                        bottom: 15% !important; /* Move warning up since track is gone */
                    }
                }

                .ampere-ui-label {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    font-family: monospace;
                    font-size: 12px;
                    letter-spacing: 1px;
                    color: #666;
                    z-index: 2;
                    font-weight: 600;
                    pointer-events: none;
                    transition: color 0.3s ease, text-shadow 0.3s ease;
                }

                /* Digital Dot for Labels */
                .ampere-ui-label::before {
                    content: '';
                    display: block;
                    width: 4px;
                    height: 4px;
                    background-color: currentColor; 
                    border-radius: 50%;
                    margin-right: 6px;
                    opacity: 0.8;
                    box-shadow: 0 0 5px currentColor;
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
                    /* Smoother easing (easeOutQuint) */
                    transition: left 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                    z-index: 1;
                    box-sizing: border-box;
                }
                
                #ampere-standby-warning {
                    position: absolute;
                    bottom: 45px; /* Between track and instructions */
                    left: 50%;
                    transform: translateX(-50%);
                    color: rgba(200, 220, 255, 0.9);
                    font-family: monospace;
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 1.5px;
                    /* text-transform: uppercase; Removed to allow lowercase 's' */
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.5s ease;
                    z-index: 999;
                    white-space: nowrap;
                    text-shadow: 0 0 10px rgba(100, 150, 255, 0.4);
                }
                
                /* Mobile Overrides - Updated to 1023px (v2.272) */
                @media (max-width: 1023px) {
                    #ampere-ui-track {
                        bottom: 40px; /* Pushed down for better spacing */
                        width: calc(100% - 48px); /* 24px margins */
                        max-width: 360px;
                    }
                    #ampere-standby-warning {
                        bottom: 15px; /* Adjust for lower track */
                    }
                    .ampere-ui-label {
                        font-size: 10px;
                        letter-spacing: 0px;
                    }
                }
                
                /* Desktop Override for Standby Warning Position */
                @media (min-width: 1024px) {
                    #ampere-ui-track {
                        bottom: 40px; /* Lowered further to 40px */
                    }
                    #ampere-standby-warning {
                         bottom: 100px; /* Tighter stack above track */
                         /* Opacity controlled by JS */
                    }
                }
                
                #ampere-system-status {
                    position: absolute;
                    bottom: 55px; /* Mobile: Slightly above track */
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    z-index: 998;
                    pointer-events: none;
                    transition: opacity 0.5s ease;
                    opacity: 0;
                }
                .ampere-dot-row {
                    display: flex;
                    gap: 4px;
                }
                .ampere-dot {
                    width: 3px;
                    height: 3px;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 255, 0.1);
                    transition: background-color 0.1s, box-shadow 0.1s;
                }
                .ampere-status-text {
                    font-family: monospace;
                    font-size: 10px;
                    letter-spacing: 2px;
                    color: #77ccff;
                    text-transform: uppercase;
                    text-shadow: 0 0 8px rgba(0, 200, 255, 0.5);
                    min-height: 12px;
                    text-align: center;
                    white-space: nowrap;
                }
                @media (max-width: 1023px) {
                    #ampere-system-status {
                         /* Mobile: Push higher to clear the track (Track@40px + 48px height + 12px gap) */
                         bottom: 100px; 
                    }
                }
                @media (min-width: 1024px) {
                    #ampere-system-status {
                        bottom: 100px; /* Tighter stack, aligned with warning level */
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
        
        // Fix: Append UI to the main card container (group/scene) if available, 
        // to keep controls outside the aspect-ratio restricted ring area.
        const uiRoot = this.container.closest('.group\\/scene') || this.container;
        // Make sure the root is positioned so absolute children work (it is usually relative or absolute already)
        if (window.getComputedStyle(uiRoot).position === 'static') {
            uiRoot.style.position = 'relative';
        }

        uiRoot.appendChild(container);

        // --- Multi-Function Display (Gauge + Status) ---
        const statusContainer = document.createElement('div');
        this.uiStatusContainer = statusContainer;
        statusContainer.id = 'ampere-system-status';
        
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
        
        uiRoot.appendChild(statusContainer);

        // --- Standby Warning UI ---
        const warning = document.createElement('div');
        this.standbyWarning = warning;
        warning.id = 'ampere-standby-warning';
        warning.innerText = 'STANDBY IN 30s';
        uiRoot.appendChild(warning);

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
            
            // Restore transition for the snap with smoother curve
            thumb.style.transition = 'left 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            this.setSystemState(state);
        };

        const onPointerDown = (e) => {
            this.lastInteractionTime = Date.now(); 

            // Direct Click on Label?
            if (e.target.classList && e.target.classList.contains('ampere-ui-label')) {
                const targetId = e.target.getAttribute('data-id');
                if (targetId) {
                     // Force smooth transition instead of drag-jump
                     thumb.style.transition = 'left 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
                     this.setSystemState(targetId);
                     return;
                }
            }

            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            
            const rect = container.getBoundingClientRect();
            const trackWidth = rect.width;
            const thumbW = (trackWidth - (padding * 2)) / 3;

            // Calculate Drag Offset
            if (e.target === thumb || thumb.contains(e.target)) {
                 const thumbRect = thumb.getBoundingClientRect();
                 dragOffset = clientX - thumbRect.left;
            } else {
                 // Clicking track background: Center thumb on pointer
                 dragOffset = thumbW / 2;
            }

            isDragging = true;
            
            // Initial Jump (Only if clicking track background, NOT labels)
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
        // Uses configured lerp speed
        this.lerpSpeed = this.config.lerpSpeed;

        this.systemState = newState;
        
        // Update Body Attribute for Global CSS Styling (Titles, etc.)
        document.body.setAttribute('data-system-state', newState);

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
            
            // Update Thumb Styling (Monotone Blue/Silver Theme)
            if (newState === 'ACTIVE') {
                 // Active Blue
                 this.uiThumb.style.background = 'linear-gradient(180deg, rgba(0, 110, 200, 0.9), rgba(0, 80, 160, 0.9))';
                 this.uiThumb.style.border = '1px solid rgba(100, 200, 255, 0.4)';
                 this.uiThumb.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
            } else if (newState === 'STANDBY') {
                 // Standby White/Silver
                 this.uiThumb.style.background = 'linear-gradient(180deg, rgba(140, 150, 160, 0.9), rgba(100, 110, 120, 0.9))';
                 this.uiThumb.style.border = '1px solid rgba(200, 220, 255, 0.4)';
                 this.uiThumb.style.boxShadow = '0 0 15px rgba(200, 220, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
            } else {
                 // Off Dark Blue/Grey
                 this.uiThumb.style.background = 'linear-gradient(180deg, rgba(50, 60, 70, 0.9), rgba(30, 40, 50, 0.9))';
                 this.uiThumb.style.border = '1px solid rgba(120, 140, 160, 0.3)';
                 this.uiThumb.style.boxShadow = '0 0 12px rgba(120, 140, 160, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
            }

            // Update Labels
            labels.forEach(l => {
                const id = l.getAttribute('data-id');
                if (id === newState) {
                    if (id === 'ACTIVE') {
                        l.style.color = '#77ccff'; // Bright Blue
                        l.style.textShadow = '0 0 12px rgba(0, 180, 255, 0.8)';
                    } else if (id === 'STANDBY') {
                         l.style.color = '#ddeeff'; // White/Blue
                         l.style.textShadow = '0 0 8px rgba(200, 220, 255, 0.6)';
                    } else {
                         l.style.color = '#aabbcc'; // Grey Blue
                         l.style.textShadow = '0 0 8px rgba(120, 140, 160, 0.5)';
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
        
        // Mobile Override: Zoom out for containment
        this.camera.position.z = this.isMobile ? this.config.cameraDistance * 1.6 : this.config.cameraDistance;
        
        // Store Initial Position for Auto-Recenter (v2.189 Fix)
        this.initialCameraPos = this.camera.position.clone();

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
        // v2.271: Increased size by 20% on mobile (0.72 -> 0.864)
        const radius = this.isMobile ? 0.864 : 0.72;
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

        // v2.271: Match surface radius to sphere size
        const sphereRadius = this.isMobile ? 0.864 : 0.72;
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
            // We assume anything with a Viewport < 1024 is the Tablet/Mobile realm.
            this.isMobile = (window.innerWidth < 1024);

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
            const ringToViewportRatio = 400 / 800; // Inner Ring (400px) in Box (800px)
            const fillPercentage = 0.95; // 95% of Inner Ring (User Request v2.239)
            
            let targetVisibleSize;

            if (this.camera.aspect >= 1.0) {
                // LANDSCAPE (Height Limited)
                // Ring is 50% of screen HEIGHT.
                // We want Object to be 90% of Ring.
                // Target Object Coverage = 0.45 of Screen Height.
                const targetCoverage = ringToViewportRatio * fillPercentage;
                targetVisibleSize = objectSize / targetCoverage;
            } else {
                // PORTRAIT (Width Limited)
                // Ring is 50% of screen WIDTH.
                // WebGL FOV is vertical, but Aspect determines visible width.
                // Visible Width = Visible Height * Aspect.
                // We want Object to be (0.45 * Width).
                // objectSize = (Visible Height * Aspect) * 0.45
                // Visible Height = objectSize / (Aspect * 0.45)
                const targetCoverage = ringToViewportRatio * fillPercentage;
                
                // Increase size for Mobile (custom boost)
                // If width is constrained, we can afford to let the object be visually larger relative to the "ring box"
                // because the ring box on mobile occupies nearly 100% of the screen width.
                // v2.254: Increased boost to 1.9 to fill the ring void.
                // v2.255: Increased boost to 2.4.
                // v2.256: Increased boost to 3.2 to fix "dropping size" issue.
                const mobileBoost = (this.isMobile) ? 3.2 : 1.0; 
                
                targetVisibleSize = objectSize / (this.camera.aspect * targetCoverage * mobileBoost);
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

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
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
                 const baseZ = this.config.cameraDistance; // Use Configured Distance (v2.189 Fix: Was hardcoded 5)
                 let targetCamPos = this.initialCameraPos ? this.initialCameraPos.clone() : new THREE.Vector3(0,0,baseZ);
    
                 if (this.isMobile) {
                     // Adjust Z based on aspect ratio to prevent side clipping
                     const aspect = this.width / this.height;
                     const targetZ = Math.max(baseZ, baseZ + (2.5 / Math.max(aspect, 0.4)) - 3.0); 
                     
                     targetCamPos.z = targetZ;
                 }
    
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
                                 dot.style.backgroundColor = '#00ccff';
                                 dot.style.boxShadow = '0 0 4px #00ccff';
                             } else {
                                 dot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                 dot.style.boxShadow = 'none';
                             }
                         });
                     }
                     
                     if (this.uiStatusText) {
                         const pct = Math.floor(this.simIntensity * 100);
                         
                         if (this.systemState === 'ACTIVE') {
                             if (this.simIntensity > 0.96) {
                                 this.uiStatusText.innerText = 'AI ONLINE | V - AMP 2.0';
                                 this.uiStatusText.style.textShadow = '0 0 8px rgba(0, 200, 255, 0.5)';
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
