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
        // v2.640: Updated to < 1024 to exclude iPad Pro Portrait (1024px) from Mobile Zoom logic.
        // v2.780: Updated to <= 1024 to INCLUDE 1024px (iPad Pro) in mobile logic per request.
        this.isMobile = (window.innerWidth <= 1024);

        console.log("Tech Demo Scene Initialized - v3.082 (Unified ID)");

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

        // v2.547: Capture Power Buttons for JS-Synced Breathing Animation
        // This ensures the button pulse matches the Neural Net "Breathing" exactly.
        this.uiPowerButtons = document.querySelectorAll('.power-toggle-btn');

        // v2.429: Active Card Sync State
        this.lastActiveCardIndex = -1;
        this.isCardPowerActive = false; // v2.431: Hysteresis State

        // --- Configuration (Data Attributes) ---
        this.config = {
            standbyTimeout: 120,    // Seconds before auto-standby (data-standby-timeout)
            standbyWarning: 30,     // Seconds for warning countdown (data-standby-warning)
            autoRecenter: 2.5,      // Seconds before camera recenter (data-auto-recenter)
            lerpSpeed: 0.05,       // v2.617: Increased Speed (was 0.015) for faster Power Up Sequence
            minVelocity: 0.01,      // v2.617: Increased Min Velocity (was 0.0025) to prevent stalling
            rotationRPM: 0.17,      // Revs per second (approx) (data-rotation-rpm)
            cameraDistance: 5.0,    // Z-Distance (Zoom) (data-camera-distance)
            sphereRadius: 1.037     // Central Orb Radius (data-sphere-radius). Default updated v2.733
        };
        this.parseConfig();

        // v2.615: Initialize Animation State Variables to prevent NaN/Frozen loops
        this.simIntensity = 0.0;
        this.targetSimIntensity = 0.0;
        this.standbyMix = 1.0;
        this.targetStandbyMix = 1.0;

        // v2.735: Voice Synthesis Sync
        this.voiceConnected = false; // Is the AI session active?
        this.voiceActive = false;    // Is the AI speaking?
        this.voiceLevel = 0.0;
        this.voiceColorThinking = new THREE.Color(0xf59e0b); // Amber (Thinking)
        this.voiceColorTalking = new THREE.Color(0x22d3ee);  // Electric Blue (Talking)
        this.currentCoreColor = new THREE.Color(0xf59e0b);
        this.targetCoreColor = new THREE.Color(0xf59e0b);
        // Pre-fill lightTargets to ensure update loop has data immediately
        this.lightTargets = { ambient: 0.05, core: 0.2 };

        // v2.753: Pulse Engine State (Debouncing & Refractory Period)
        this.pulseState = 'IDLE'; // IDLE, ACTIVE, COOLDOWN
        this.pulseTimer = 0;
        this.pulseVal = 0.0; // The actual value used by nodes
        this.pulseMinDuration = 8; // Frames (~130ms)
        this.pulseCooldown = 12; // Frames (~200ms) - Enforces spacing

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
    // Stub removed (Duplicate of actual method at line 1222)

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
        // SVG is a sibling of the container (#tech-demo-scene), but we added an ID v2.850 for robustness
        const svg = document.getElementById('halo-master-svg') || this.container.parentElement.querySelector('svg');
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
                enableInteraction: false, // v2.700: Wired to Backend Only
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
                enableInteraction: false, // v2.700: Wired to Backend Only
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

            // v2.826: Dramatic Power-Up Sequence
            // Start at Memory (Index 0), then rotate to Transfer (Index 4) to show capability
            setTimeout(() => {
                if (this.rotatorInner) this.rotatorInner.setActiveIndex(1, false); // Snap to Front Door
                if (this.rotatorOuter) {
                    this.rotatorOuter.setActiveIndex(0, false); // Snap to Memory initially

                    // Rotate to Neutral (Transfer/4) after short delay
                    setTimeout(() => {
                        this.rotatorOuter.setActiveIndex(4, true); // Animate to Transfer
                    }, 800);
                }
            }, 50);

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
        this.config.sphereRadius = getFloat('data-sphere-radius', 1.037);

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
                
                    /* Pill Mode Horizontal Layout */
                    .ampere-status-pill-mode {
                        display: flex;
                        flex-direction: row; 
                        align-items: center;
                        gap: 16px; 
                    }

                    .ampere-dot-row {
                        display: flex;
                        gap: 4px;
                        height: 12px;
                        align-items: center;
                    }
                    
                    .ampere-dot {
                        width: 6px;
                        height: 12px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 1px;
                        transition: all 0.1s ease;
                        border: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    
                    /* Vertical Text */
                    .ampere-status-text {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 10px;
                        font-weight: 700;
                        letter-spacing: 0.1em;
                        color: #10b981;
                        text-transform: uppercase;
                        min-height: 12px;
                        text-align: center;
                        white-space: nowrap;
                        margin-top: 8px; 
                    }
                    
                    /* Pill Text (Horizontal) */
                    .ampere-status-text.pill-text {
                        margin-top: 0;
                        order: -1; 
                    }
                    
                    #ampere-standby-warning {
                         font-family: 'JetBrains Mono', monospace;
                         font-size: 10px;
                         color: #f59e0b;
                         font-weight: bold;
                         display: none; 
                    }
                    #ampere-standby-warning.active {
                        display: block;
                    }
            `;
            document.head.appendChild(style);
        }

        const padding = 5;

        // --- TARGETING STRATEGY ---
        // Priority 1: Inject into Top-Right Pill (Desktop)
        const pillTarget = document.getElementById('status-injection-target');
        let uiRoot = pillTarget;
        let isPillMode = !!pillTarget;

        if (!uiRoot) {
            // Fallback: Use Controls Cluster (Mobile/Legacy)
            // --- CLUSTER CONTAINER (New v2.300) ---
            const cluster = document.createElement('div');
            cluster.id = 'ampere-controls-cluster';

            // Target the explicit controls cluster container 
            uiRoot = document.getElementById('tech-demo-controls-target');

            if (!uiRoot) {
                console.warn("TechDemoScene: #tech-demo-controls-target not found. Falling back to scene container.");
                uiRoot = this.container.closest('.group\\/scene') || this.container;
                if (window.getComputedStyle(uiRoot).position === 'static') {
                    uiRoot.style.position = 'relative';
                }
            }
            uiRoot.appendChild(cluster); // Append cluster to root
            uiRoot = cluster; // Root becomes the cluster
        } else {
            // Unhide content
            uiRoot.classList.remove('hidden');
            // Unhide parent pill if needed
            const pillParent = document.getElementById('live-demo-pill');
            if (pillParent) pillParent.classList.remove('hidden');
        }

        // --- Multi-Function Display (Status) ---
        const statusContainer = document.createElement('div');
        this.uiStatusContainer = statusContainer;

        if (isPillMode) {
            statusContainer.className = 'ampere-status-pill-mode flex items-center gap-3';
        } else {
            statusContainer.id = 'ampere-system-status';
        }

        // Dots Row
        const dotRow = document.createElement('div');
        dotRow.className = 'ampere-dot-row';
        this.uiDots = [];
        // v2.615: Adaptive Dot Count (20 for Desktop, 5 for Mobile) to restore "Power Up UV" fidelity on large screens.
        const isMobile = window.innerWidth <= 1024;
        const dotCount = isMobile ? 5 : 20;

        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'ampere-dot';
            dotRow.appendChild(dot);
            this.uiDots.push(dot);
        }

        const statusText = document.createElement('div');
        this.uiStatusText = statusText;
        statusText.className = 'ampere-status-text';
        if (isPillMode) statusText.classList.add('pill-text');
        statusText.innerText = 'INITIALIZING...';

        // --- Standby Warning UI ---
        const warning = document.createElement('div');
        this.standbyWarning = warning;
        warning.id = 'ampere-standby-warning';
        warning.innerText = '';

        // --- ASSEMBLY ---
        if (isPillMode) {
            // Horizontal Layout: Warning | Text | Dots
            // v2.613: Specific order for Pill: Text FIRST, then Dots (UV) to match Desktop "Status | Visualizer" flow
            statusContainer.appendChild(warning);
            statusContainer.appendChild(statusText);
            statusContainer.appendChild(dotRow);
        } else {
            // Vertical Layout (Cluster)
            statusContainer.appendChild(dotRow);
            statusContainer.appendChild(statusText);
            if (uiRoot.id === 'ampere-controls-cluster' || uiRoot === uiRoot) { // Fallback check
                // In cluster mode, warning is separate
                // But wait, uiRoot IS the cluster in fallback mode.
                uiRoot.appendChild(warning);
            }
        }

        if (isPillMode || uiRoot.id === 'ampere-controls-cluster') {
            uiRoot.appendChild(statusContainer);
        }

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


            // v2.638: Update Live Demo Pill Dot Color
            const liveDot = document.getElementById('live-demo-dot');
            if (liveDot) {
                // Reset
                liveDot.classList.remove('bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-slate-500');

                if (newState === 'ACTIVE') {
                    liveDot.classList.add('bg-emerald-400');
                } else if (newState === 'STANDBY') {
                    liveDot.classList.add('bg-amber-400');
                } else {
                    liveDot.classList.add('bg-slate-500');
                }
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

    // Public API for Tool Selection
    selectFunction(functionName) {
        // Map function names to Ring Indices
        // Outer Ring: 0=Memory, 2=Handoff, 4=Transfer, 6=OTP, 8=Identity, 10=Calendar
        // Inner Ring: 1=FrontDoor, 3=Guide, 5=Onboarding, 7=Tech, 9=Sales, 11=Booking

        const map = {
            'memory': { ring: 'outer', index: 0 },
            'handoff': { ring: 'outer', index: 2 },
            'transfer': { ring: 'outer', index: 4 },
            'otp': { ring: 'outer', index: 6 },
            'identity': { ring: 'outer', index: 8 },
            'calendar': { ring: 'outer', index: 10 },

            'front_door': { ring: 'inner', index: 1 },
            'guide': { ring: 'inner', index: 3 },
            'onboarding': { ring: 'inner', index: 5 },
            'tech': { ring: 'inner', index: 7 },
            'sales': { ring: 'inner', index: 9 },
            'booking': { ring: 'inner', index: 11 }
        };

        const target = map[functionName.toLowerCase()];
        if (target) {
            console.log(`Selecting Function: ${functionName} -> Ring ${target.ring} Index ${target.index}`);
            if (target.ring === 'outer' && this.rotatorOuter) {
                this.rotatorOuter.setActiveIndex(target.index);
            } else if (target.ring === 'inner' && this.rotatorInner) {
                this.rotatorInner.setActiveIndex(target.index);
            }
        }
    }

    // v2.735: Voice Sync Methods
    setVoiceConnected(isConnected) {
        console.log('[TechDemo] setVoiceConnected:', isConnected);
        this.voiceConnected = isConnected;

        if (isConnected) {
            // v2.805: Force System State to ACTIVE when voice connects
            // This stops the Standby Pulse loop ("visualization loop") immediately.
            if (this.systemState !== 'ACTIVE') {
                console.log('[TechDemo] Voice Connected -> Waking System to ACTIVE');
                this.setSystemState('ACTIVE');
            }
        } else {
            // Reset to default Active color (Amber) immediately
            this.targetCoreColor.setHex(0xf59e0b);
            this.voiceActive = false;
        }
    }

    setVoiceState(isActive) {
        console.log('[TechDemo] setVoiceState:', isActive);
        this.voiceActive = isActive;

        // v2.762: Processing State Reset
        // If we are setting a voice state (Speaking or Listening), we MUST clear the "Thinking" override.
        if (this.processingState) {
            this.setProcessingState(false);
        }

        if (isActive) {
            // Talking: Green (Emergency Override)
            this.targetCoreColor.copy(this.voiceColorTalking);
        } else {
            // Thinking/Idle: Blue
            this.targetCoreColor.copy(this.voiceColorThinking);
        }
    }

    // v2.762: Neural Acceleration State (Thinking)
    // "Thinking" is the gap between User Silence and Agent Speech.
    // Visuals: White Core, Hyper-Rotation, Electron Swarm.
    setProcessingState(isProcessing) {
        console.log('[TechDemo] setProcessingState:', isProcessing);
        this.processingState = isProcessing;

        if (isProcessing) {
            // override colors to White/Violet for "Hot Computation"
            this.targetCoreColor.setHex(0xffffff);
        } else {
            // revert to standard state logic (handled by setVoiceState/animate)
            if (this.voiceActive) {
                this.targetCoreColor.copy(this.voiceColorTalking);
            } else {
                this.targetCoreColor.copy(this.voiceColorThinking);
            }
        }
    }

    setVoiceLevel(level) {
        // level: 0.0 to 1.0 (from visualizer)
        // console.log('[TechDemo] Level:', level); // Too noisy
        this.voiceLevel = level;
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
        // v2.733: Now strictly controlled via config (Default 1.037/1.244)
        const radius = this.config.sphereRadius;
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            roughness: 0.15,
            metalness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            emissive: 0x000000,
            transparent: true,
            opacity: 1.0
        });

        this.centralSphere = new THREE.Mesh(geometry, material);

        // FIX: Rotate 90 degrees to hide the "eye" (pole) from direct camera view
        this.centralSphere.rotation.x = Math.PI / 2;

        this.group.add(this.centralSphere);

        this.initCircuitryPaths();

        this.coreLight = new THREE.PointLight(0xf59e0b, 0.4, 8);
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

        // v2.733: Match surface radius to Configured Sphere Radius
        // We use config.sphereRadius strictly to ensure pads sit exactly on the surface, regardless of platform override.
        const sphereRadius = this.config.sphereRadius;
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
                pad.lookAt(new THREE.Vector3(0, 0, 0));
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

                for (let l = 0; l < lanes; l++) {
                    const head = laneHeads[l];

                    let targetGridPhi = head.gridPhi + dPhi;
                    let targetGridTheta = head.gridTheta + dTheta;

                    targetGridPhi = Math.max(2, Math.min(PHI_STEPS - 2, targetGridPhi));

                    const targetPhi = targetGridPhi * phiStepSize;
                    const targetTheta = targetGridTheta * thetaStepSize;

                    if (Math.abs(targetPhi - head.phi) < 0.001 && Math.abs(targetTheta - head.theta) < 0.001) continue;

                    const segmentPoints = [];
                    const divisions = 8;

                    for (let k = 0; k <= divisions; k++) {
                        const t = k / divisions;
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

            for (let l = 0; l < lanes; l++) {
                const head = laneHeads[l];
                const pos = this.getPos(head.phi, head.theta, surfaceRadius);
                const pad = new THREE.Mesh(padGeometry, padMaterial);
                pad.position.copy(pos);
                pad.lookAt(new THREE.Vector3(0, 0, 0));
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
        for (let i = 0; i < numElectrons; i++) {
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

                // Amber/Gold Scheme (Thinking State)
                // Restrict hue to Amber range (approx 0.08 - 0.12)
                const hue = 0.08 + (Math.random() * 0.04);
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
        let touchStartPos = { x: 0, y: 0 };
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
                const dist = Math.sqrt(dx * dx + dy * dy);

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
            // v2.640: Updated to < 1024 to exclude iPad Pro Portrait (1024px) from Mobile Zoom logic.
            // v2.780: Updated to <= 1024 to INCLUDE 1024px (iPad Pro) in mobile logic per request.
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
            const tanHalfFOV = Math.tan((FOV * Math.PI / 180) / 2);
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

                // v2.557: Scroll Sync Logic
                // If on mobile/horizontal scroll view, scroll to the active card
                const track = document.getElementById('tech-demo-card-track');
                if (track && window.getComputedStyle(track).overflowX === 'auto') {
                    // Calculate offset: index * width of card ? 
                    // Or just use scrollIntoView behavior?
                    // scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }) is best
                    // v2.558: Changed to 'center' to prevent cut-off issues

                    // v2.638: Disabled Auto-Scroll on Mobile entirely per user request.
                    // It causes distracting jumping during power-up sequence.
                    // card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }

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
                let targetLookAt = new THREE.Vector3(0, 0, 0);

                // v2.346: Logic Update - TRUST handleResize() for Z-Position.
                // Removed manual "Mobile Z Recalculation" overlay which was causing expansion drift.
                // The handleResize() method updates this.initialCameraPos with the strict 85% containment Z.
                // We simply return to THAT position.
                let targetCamPos = this.initialCameraPos ? this.initialCameraPos.clone() : new THREE.Vector3(0, 0, this.config.cameraDistance);

                this.camera.position.lerp(targetCamPos, lerpSpeed);
                if (this.controls) this.controls.target.lerp(targetLookAt, lerpSpeed);
            }

            // 2. Auto-Standby Mode (Configured Timeout)
            // If currently ACTIVE and idle for X, drift to STANDBY

            const standbyTimeout = this.config.standbyTimeout * 1000;
            const warningDuration = this.config.standbyWarning * 1000;
            const warningStart = standbyTimeout - warningDuration;

            if (this.systemState === 'ACTIVE') {
                // v2.760: Voice Activity inhibits Standby
                // Prevent shutdown during active calls even if no touch interaction occurs
                if (this.voiceConnected) {
                    if (this.standbyWarning && this.standbyWarning.style.opacity !== '0') {
                        this.standbyWarning.style.opacity = '0';
                    }
                } else if (timeSinceInteraction > standbyTimeout) {
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
                // v2.618: ALWAYS show gauge in Pill Mode so it never vanishes (prevents empty gap/input confusion).
                // It will show "DISCONNECTED" + Dark Dots loop when OFF/STANDBY.
                let isPill = this.uiStatusContainer.classList.contains('ampere-status-pill-mode');

                let showGauge = !warningActive && (this.systemState === 'ACTIVE' || this.simIntensity > 0.02 || isPill);

                if (showGauge) {
                    this.uiStatusContainer.style.opacity = '1';

                    // Helper for updating Visuals
                    // v2.614: Dynamic Dot Count based on mode (5 for Pill, 20 for Desktop)
                    const totalDots = this.uiDots ? this.uiDots.length : 20;
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

                        // v2.617: Allow AI Chat to override status text
                        // Check if AmpereAI is active (Connecting/Connected)
                        const isAIActive = window.ampereAI && (window.ampereAI.isConnecting || window.ampereAI.isConnected);

                        if (this.systemState === 'ACTIVE') {
                            // Only update text if AI is NOT controlling it
                            // OR if we are just starting up ("INITIALIZING" phase) and AI hasn't connected yet.
                            // Actually, if AI is connecting, we want AI to win.

                            if (!isAIActive) {
                                if (this.simIntensity > 0.96) {
                                    this.uiStatusText.innerText = 'AI ONLINE | V - AMP 2.0';
                                    this.uiStatusText.style.textShadow = '0 0 8px rgba(16, 185, 129, 0.5)';
                                    // Ensure color is reset to default (Emerald) if it was changed
                                    if (this.uiStatusText.style.color !== '') {
                                        this.uiStatusText.style.color = '#10b981';
                                        this.uiStatusText.className = 'ampere-status-text pill-text'; // Reset classes
                                    }
                                } else {
                                    this.uiStatusText.innerText = `INITIALIZING ${pct}%`;
                                    this.uiStatusText.style.textShadow = 'none';
                                    this.uiStatusText.style.color = '#10b981';
                                }
                            }
                        } else {
                            // Powering Down / Standby Transition
                            // v2.619: Unified Off/Standby Look
                            // If STANDBY, show STANDBY. If OFF (sim < 0.05), show DISCONNECTED (or if specifically set).
                            if (isPill) {
                                if (this.systemState === 'STANDBY') {
                                    this.uiStatusText.innerText = 'STANDBY';
                                    this.uiStatusText.style.color = '#94a3b8'; // Slate 400 (Standby)
                                } else {
                                    this.uiStatusText.innerText = 'DISCONNECTED';
                                    this.uiStatusText.style.color = '#64748b'; // Slate 500 (Off)
                                }
                            } else {
                                this.uiStatusText.innerText = `POWER ${pct}%`;
                            }
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

        // v2.548: Drive UI Button Opacity from the Neural Net Pulse
        // Matches the "Breathing" frequency (approx 7s cycle) instead of fixed CSS time.
        if (this.uiPowerButtons) {
            const opacity = (this.systemState === 'STANDBY') ? (0.4 + (pulse * 0.6)) : '';
            this.uiPowerButtons.forEach(btn => {
                // Use '' to remove inline style and revert to CSS when not in Standby
                // Use .style.opacity directly for high-performance animation
                if (btn.style.opacity !== String(opacity)) {
                    btn.style.opacity = opacity;
                }
            });
        }

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
                // v2.806: Silence the Data Stream when listening (User Req: "Stop visualization loop")
                if (this.voiceConnected && !this.voiceActive && !this.processingState) {
                    this.simIntensity = 0.1; // Minimal hum, no swarm
                } else {
                    this.simIntensity = (this.systemState === 'ACTIVE') ? 1.0 : 0.0;
                }
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

            let currentCore = (this.simIntensity * activeCore) + (this.standbyMix * standbyPulseVal);

            // v2.735: Voice Sync Modulation
            if (this.voiceConnected) {
                if (this.voiceActive) {
                    // v2.748: Drop Noise Floor for High Contrast
                    // Instead of adding to activeCore (0.4), we reset baseline to near-zero (0.05)
                    // This creates the "dim then bright" flash effect requested.
                    currentCore = 0.05;

                    if (this.voiceLevel > 0) {
                        // Talking: Green Flash (Level 0..1)
                        // v2.749: Exponential Response (Gamma Correction). 
                        // Using power of 2.5 to compress low volumes and exaggerate peaks.
                        // This creates the "Pulse" / "Flash" effect vs just "On".
                        const nonlinearLevel = Math.pow(this.voiceLevel, 2.5);
                        currentCore += (nonlinearLevel * 2.0);
                    }
                } else if (this.systemState === 'ACTIVE') {
                    // Thinking/Active Idle (Only when Connected)
                    // v2.806: Removed Thinking Pulse per user request ("Stop visualization loop")
                    // currentCore remains steady amber/base.
                }
            }

            // v2.765: Compute Core Dimmer for Stealth Mode
            // When talking/thinking, we dim the lights to reduce distraction.
            // Using a persistent lerp value on the instance.
            if (this.coreDimmer === undefined) this.coreDimmer = 1.0;

            let targetDimmer = 1.0;
            let dimmerSpeed = 0.1;

            if (this.voiceConnected && (this.voiceActive || this.processingState)) {
                targetDimmer = 0.0;
                // v2.769: Instant Attack for Stealth Mode
                // If we are entering Stealth Mode (Talking/Thinking), snap to black much faster (0.5)
                // This prevents the "Transition" artifact user reported.
                dimmerSpeed = 0.5;
            }
            this.coreDimmer = THREE.MathUtils.lerp(this.coreDimmer, targetDimmer, dimmerSpeed);

            // Apply dimmer to calculated intensity
            currentCore *= this.coreDimmer;

            if (this.coreLight) {
                this.coreLight.intensity = currentCore;

                // v2.745: Color Sync Restored - Core follows Target Color (Thinking=Amber, Talking=Cyan)
                this.coreLight.color.lerp(this.targetCoreColor, 0.1);
            }
        }

        // --- ROTATION LOGIC ---
        if (this.centralSphere) {
            // Target Speed based on Config RPM
            const baseSpeed = (Math.PI * 2 * this.config.rotationRPM) / 60; // Rads per frame assuming 60fps
            let currentSpeed = baseSpeed * this.simIntensity;

            // v2.756: Freeze Rotation During Speech
            // User Request: "Pause the rotation during speech as a test" to better see emission changes.
            if (this.voiceConnected && this.voiceActive) {
                currentSpeed = 0;
            }

            // v2.759: Dynamic Lattice Expansion (Breathing Speaker Cone)
            // Logic: Speak = Expansion (0.85 -> 1.15 depending on volume), Silence = Contract (0.85)
            // This creates the "out-in" pumping effect synchronized with voice energy
            if (this.outerShell) {
                let targetScale = 1.0;
                if (this.voiceConnected) {
                    // v2.766: Mobile Contraction Tweak (0.90 vs 0.85)
                    // User Request: "Make it a little bit larger when it contracts on mobile"
                    const baseContraction = (this.isMobile) ? 0.93 : 0.85;

                    if (this.voiceActive) {
                        // Speaker Cone Effect: Map volume to scale
                        // Base: 0.85 (Contracted)
                        // Max: 1.15 (Expanded)
                        const volumeKick = Math.pow(this.voiceLevel || 0, 0.8); // Mild curve to keep it responsive
                        targetScale = baseContraction + (volumeKick * 0.3);
                    } else {
                        // Silence: Contract inwards
                        targetScale = baseContraction;
                    }
                }
                const currentScale = this.outerShell.scale.x;
                // Lerp Speed: 0.2 for snappy "Kick" response (was 0.1)
                const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.2);
                this.outerShell.scale.set(newScale, newScale, newScale);
            }

            // v2.765: Stealth Mode Mechanism (Matte Black Transition)
            // Instead of fading to transparency (which causes ghosting), we "Turn Off The Lights".
            // We transition the material to be fully matte and non-reflective, creating a "Black Hole" effect.
            if (this.centralSphere && this.centralSphere.material) {
                let targetRoughness = 0.15; // Default Glossy
                let targetClearcoat = 1.0;  // Default Glass
                let matSpeed = 0.1; // Default Smooth Transition

                // If Talking or Thinking -> Go Matte Black (Stealth)
                if (this.voiceConnected && (this.voiceActive || this.processingState)) {
                    targetRoughness = 1.0;
                    targetClearcoat = 0.0;
                    // v2.769: Instant Material Transition
                    // Snap to Matte Black instantly (0.5) to avoid visible glossy fade-out.
                    matSpeed = 0.5;
                }

                // Smooth Material Transition
                const currentRough = this.centralSphere.material.roughness;
                const currentClear = this.centralSphere.material.clearcoat;

                this.centralSphere.material.roughness = THREE.MathUtils.lerp(currentRough, targetRoughness, matSpeed);
                this.centralSphere.material.clearcoat = THREE.MathUtils.lerp(currentClear, targetClearcoat, matSpeed);

                // Reset v2.763 Transparency Logic (Ensure Solid)
                this.centralSphere.material.opacity = 1.0;
                this.centralSphere.material.depthWrite = true;
                this.centralSphere.material.visible = true;
            }

            // Rotation Axis: World Y (Vertical Spin)
            // The Sphere has rotation.x = 90deg (PI/2).
            // This maps local Z axis to World -Y axis (pointing down).
            // To spin like a top (around World Y), we rotate around Local Z.

            // v2.762: Processing Turbo-Spin
            // If processing, multiple speed by 4.0 for "Thinking" visual.
            // v2.764: Decoupled Core vs Shell rotation to reduce visual noise.
            // Only the CORE (Data) should spin fast. The Shell (Cage) should remain calm.
            let coreRotation = currentSpeed;
            let shellRotation = currentSpeed;

            if (this.processingState) {
                // v2.778: True Neutral Computation
                // User Request: "Let's take it to 1x"
                // Reset multiplier to 1.0 (Baseline)
                coreRotation *= 1.0;
                // Shell stays at 1.0x (or maybe slight boost 1.2x if needed, but keeping calm for now)
            }

            if (currentSpeed > 0.0001) {
                this.centralSphere.rotateZ(coreRotation);

                // --- OUTER SHELL ROTATION (Contra-Rotation + Biaxial) ---
                // Rotate the lattice structure in the opposite direction
                // Speed: 30% of the BASE speed (calculated from shellRotation)
                if (this.outerShell) {
                    // 1. Primary Axis: Lateral Spin (REVERSED vs Center + Slower)
                    this.outerShell.rotateY(shellRotation * 0.30);

                    // 2. Secondary Axis: Tumble (Biaxial)
                    this.outerShell.rotateX(shellRotation * 0.15);
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
                        // v2.766: Stealth Mode - Apply Core Dimmer to Circuit Lines
                        mesh.material.opacity = baseOpacity * this.simIntensity * (this.coreDimmer !== undefined ? this.coreDimmer : 1.0);
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
                        else {
                            // v2.761: Sync Electron Spawning with Voice Pulses
                            // Inject voiceLevel (via pulseVal) into the probability
                            const voiceBoost = (this.pulseVal || 0) * 0.5;
                            let spawnChance = (0.01 + (activityLevel * 0.1) + voiceBoost) * this.simIntensity;

                            // v2.762: Processing Swarm Override
                            if (this.processingState) {
                                // v2.777: Calm Computation - Reduced density from 0.8 -> 0.4
                                spawnChance = 0.4;
                            }

                            if (this.simIntensity > 0.1 && Math.random() < spawnChance) {
                                e.active = true;
                                e.pathIndex = Math.floor(Math.random() * this.paths.length);
                                e.t = 0;

                                // Accelerate electrons during speech bursts
                                let computedSpeed = 0.01 + Math.random() * 0.04 + (activityLevel * 0.03) + (voiceBoost * 0.05);

                                // v2.773: Deep Listening Slow Down
                                // If connected but just listening (not processing/speaking), slow data to a crawl.
                                if (this.voiceConnected && !this.voiceActive && !this.processingState) {
                                    computedSpeed *= 0.1; // 10% speed
                                }

                                // v2.776: "Gentle Light Show" (No Buzzing)
                                // User Request: "reduce this so it's just a gentle light show"
                                // Drastic reduction from 0.4 -> 0.15 to kill the "buzz".
                                if (this.voiceConnected && this.voiceActive) {
                                    computedSpeed *= 0.15;
                                }

                                // v2.762: Processing Speed Boost
                                if (this.processingState) {
                                    // v2.778: True Neutral Computation
                                    // User Request: "Let's take it to 1x"
                                    // Reset multiplier to 1.0 (Baseline)
                                    computedSpeed *= 1.0;
                                }

                                e.speed = computedSpeed;
                                e.mesh.visible = true;
                            }
                        }
                    }
                    if (e.active) {
                        const pathId = e.pathIndex;
                        // v2.773: Disable Line Flash (Dots Only)
                        // User Request: "Show them as dots rather than lines"
                        // if (this.circuitMeshes && this.circuitMeshes[pathId]) this.circuitMeshes[pathId].userData.intensity = 1.0;

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
                                // v2.766: Stealth Mode - Apply Core Dimmer to Electrons (Data Swarm)
                                e.mesh.material.opacity = this.simIntensity * (this.coreDimmer !== undefined ? this.coreDimmer : 1.0);
                            }
                        }
                    }
                });
            }

            // --- NEURAL ACTIVITY (Node Flashing) ---
            const dark = new THREE.Color(0x000000);

            // v2.755: Sustain Floor Implementation (Low Emission Pauses)
            // Goal: "Every word would flash. Pauses between the words would be a decayed low emission."

            if (this.voiceConnected && this.voiceActive) {
                // 1. Map Audio to Target (0.0 to 1.0)
                // Input Floor 0.05 to ignore noise. Gain 1.5x for punch.
                let rawInput = Math.max(0, (this.voiceLevel - 0.05) * 1.5);

                // 2. Apply Sustain Floor (The "Low Emission" between words)
                // When Agent is speaking, never drop below 0.2 intensity, even in silence gaps.
                let target = Math.max(0.2, Math.min(rawInput, 1.0));

                if (target > this.pulseVal) {
                    // Attack: Reduced to 0.06 (was 0.1) for super soft "gentle glow" swell
                    this.pulseVal = THREE.MathUtils.lerp(this.pulseVal, target, 0.06);
                } else {
                    // Decay: Tuned (0.04 -> 0.025 v2.774) to glide down to the 0.2 floor.
                    // Fast enough to show separation, slow enough to look "decayed" not cut.
                    this.pulseVal = THREE.MathUtils.lerp(this.pulseVal, target, 0.025);
                }
            } else {
                // Silence (Agent Done) -> Fade to Black
                this.pulseVal = THREE.MathUtils.lerp(this.pulseVal, 0.0, 0.05);
            }

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
                        // v2.770: Reduced Probability by 30% (0.02 -> 0.014) for calmer idle state
                        if (Math.random() < 0.014 * this.simIntensity) {
                            data.firingState = 1.0;
                            // v2.770: Slower Cadence (Increased Cooldown)
                            data.fireCooldown = 30 + Math.random() * 70;
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
                    // Reduced proximity flare (was * 2.0, then 1.0, now 0.7 for v2.770)
                    proximityIntensity = Math.pow(factor, 2) * 0.7;
                    proximityScale = factor * 0.4;
                }

                // Base Chaos Intensity (Reduced by 30% from 0.8 -> 0.56 for v2.770)
                let chaosIntensity = Math.max(proximityIntensity, data.firingState * 0.56);

                // v2.748: Suppress Background Chaos when Speaking
                // We want the voice pulses to emerge from "darkness", not a busy background.
                if (this.voiceActive) {
                    chaosIntensity *= 0.1;
                }

                // Apply Global Fader
                chaosIntensity *= this.simIntensity;

                // v2.766: Stealth Mode - Apply Core Dimmer to Node Intensity
                // REVERTED v2.767: Nodes are Outer Shell components, they must remain visible.
                // if (this.coreDimmer !== undefined) {
                //    chaosIntensity *= this.coreDimmer;
                // }

                // --- 2. COMBINE WITH STANDBY ---

                let finalIntensity = chaosIntensity;

                // Additive Mixing or Max? 
                // If transitioning Active -> Standby:
                // Chaos is fading out (simIntensity 1->0)
                // Standby is fading in (standbyMix 0->1)
                // We simply add them. 

                finalIntensity += standbyIntensity;

                // v2.742: Voice Sync High-Frequency Pulse (Pitch/Tone Emulation)
                let effectiveColor = data.baseColor;
                let voiceScaleImpact = 0;

                // If Voice is Active, blend towards Green with high-frequency "Digital Strobe"
                // v2.761: Analog Voice Sync
                // Replaced binary 0.5 threshold with analog mapping to prevent "random/out-of-sync" feeling.
                if (this.voiceActive && this.pulseVal > 0.15) {
                    // Map 0.15 -> 1.0 range to 0.0 -> 1.0 drive
                    const voiceDrive = Math.min(1.0, (this.pulseVal - 0.15) * 1.2);

                    // Only trigger if drive is meaningful
                    if (voiceDrive > 0.05) {
                        // Color Snap (Green) logic preserved
                        effectiveColor = this.voiceColorTalking;

                        // Intensity: Reduced by 50% (35.0 -> 17.5) for less "flashbang" (v2.768)
                        finalIntensity += (voiceDrive * 17.5);

                        // Physical Kick: Reduced by 50% (0.7 -> 0.35)
                        voiceScaleImpact = voiceDrive * 0.35;
                    }
                }

                // v2.766: Stealth Mode - Final Intensity Clamp
                // REVERTED v2.767: We do NOT clamp the Node Intensity for Stealth Mode.
                // The Nodes are on the OUTER SPHERE (Lattice) and form the "Speaker Cone" effect.
                // Only the CENTRAL CORE (Sphere + Circuits + Electrons) should go dark.
                // The Outer Nodes must remain active to visualize Voice Pulse.

                // if (this.coreDimmer !== undefined) {
                //    finalIntensity *= this.coreDimmer;
                // }

                // Apply Final Intensity
                node.material.emissive.lerpColors(dark, effectiveColor, Math.min(1.0, finalIntensity));
                node.material.emissiveIntensity = finalIntensity;

                // Update Halo Opacity 
                if (data.halo) {
                    // Capped halo opacity further to reduce glare
                    data.halo.material.opacity = Math.min(0.25, finalIntensity * 0.25);
                }

                // Scale Logic (Chaos causes bumps, Standby is flat)
                // Chaos scale + Voice Pulse
                let chaosScaleDelta = (proximityScale + (data.firingState * 0.4)) * this.simIntensity;

                // Add Voice Impact (Bass Kick)
                if (voiceScaleImpact > 0) {
                    chaosScaleDelta += voiceScaleImpact;
                }

                const currentScale = node.scale.x;
                const targetScale = 1.0 + chaosScaleDelta;
                const newScale = currentScale + (targetScale - currentScale) * 0.4;
                node.scale.setScalar(newScale);
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}
// Force update v2.746
// Sync v2.895

// Force update v2.979
