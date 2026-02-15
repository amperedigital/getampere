console.log('[Tech Demo] v3.159-test Unified Release');
import { TechDemoScene } from './tech-demo-scene.js';
import { initCardExpander } from './card-expander.js';
import { initAllSockets } from './glass-socket.js';
import { AmpereAIChat } from './ai-chat.js';
import { SystemLink } from './system-link.js';

/* =========================================
   Tech Demo Main Controller
   Refactored from inline scripts for cleanliness and modularity
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    // 0. Initialize Scene (Before Viz so it can reference it)
    const container = document.getElementById('tech-demo-scene');

    // v2.265: Mobile Config Override
    // Reduce camera distance to make Neural Net appear larger on mobile
    if (window.innerWidth < 1024 && container) {
        container.setAttribute('data-camera-distance', '4.5');
    }

    if (container) {
        console.log('Initializing Tech Demo Scene...');
        window.demoScene = new TechDemoScene(container);
        // Map legacy var just in case
        window.techDemoScene = window.demoScene;
    }

    // 1. Initialize Card Expander (Zen Mode)
    initCardExpander();

    // 1b. Initialize System Link (Backend Socket + Memory UI)
    window.systemLink = new SystemLink();

    // 2. Initialize Shared Glass Socket Effects
    initAllSockets('.socket-card-container');

    // 3. Initialize Ampere AI Chat
    window.ampereAI = new AmpereAIChat('ampere-ai-chat-container', 'agent_4501ka281xkpe6e8jzbspgy9qh4d', {
        startBtnId: 'btn-start-voice',
        endBtnId: 'btn-end-voice',
        // textChatBtnId: Removed. Manually handled below for multiple context-aware buttons.
        statusTargetId: 'status-injection-target',
        onStart: () => {
            // Ensure Visuals Power Up
            if (window.demoScene && window.demoScene.systemState !== 'ACTIVE') {
                window.demoScene.setSystemState('ACTIVE');
            }
        },
        onEnd: () => {
            // Ensure Visuals Power Down to STANDBY
            if (window.demoScene && window.demoScene.systemState === 'ACTIVE') {
                window.demoScene.setSystemState('STANDBY');
                // v2.906: Reset rotator to Transfer (Neutral)
                window.demoScene.selectFunction("transfer");
                // Also ensure window closes on power down
                const chatContainer = document.getElementById('ampere-ai-chat-container');
                if (chatContainer) chatContainer.classList.add('hidden');
            }
        }
    });

    // 4. Initialize Mobile UI Logic
    if (container) {
        // Initialize Scene with a slight delay to ensure layout stability
        setTimeout(async () => {
            // Scene already initialized at top level

            // v2.264: Mobile Slider Logic
            const sliderOuter = document.getElementById('mobile-ring-slider-outer');
            const sliderInner = document.getElementById('mobile-ring-slider-inner');
            const labelOuter = document.getElementById('label-slider-outer');
            const labelInner = document.getElementById('label-slider-inner');

            const outerTitles = [
                "MEMORY FUNCTION",     // Index 0
                "HUMAN HANDOFF",       // Index 2 (Step 1)
                "AGENT TRANSFER",      // Index 4
                "OTP AUTHORIZATION",   // Index 6
                "IDENTITY & HANDOFF",  // Index 8
                "CALENDAR BOOKING"     // Index 10
            ];

            const innerTitles = [
                "FRONT DOOR AGENT",    // Index 1
                "DEMO GUIDE",          // Index 3 (Step 1)
                "ONBOARDING",          // Index 5
                "TECH SPECIALIST",     // Index 7
                "SALES ADVISOR",       // Index 9
                "BOOKING AGENT"        // Index 11
            ];

            const updateRing = (type, slider, label, titles) => {
                const step = parseInt(slider.value); // 0 to 5
                const title = titles[step];

                // Update Label
                if (label) label.innerText = title;

                // Calculate Rotation
                const targetDeg = step * -60;

                const rotator = (type === 'outer') ? window.demoScene.rotatorOuter : window.demoScene.rotatorInner;
                if (rotator) {
                    rotator.targetRotation = targetDeg;
                    rotator.isDragging = false;
                }

                // v2.561: Scroll Sync with buttery easing (Inner Ring ONLY)
                if (type === 'inner') {
                    // v2.570: Auto-close any open Zen Mode card when controller is used
                    window.dispatchEvent(new CustomEvent('ampere:close-cards'));

                    const track = document.getElementById('tech-demo-card-track');
                    if (track) {
                        const cards = track.querySelectorAll('.socket-card-container');
                        if (cards[step]) {
                            // center the card in the viewport with smooth behavior
                            cards[step].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                        }
                    }
                }
            };

            if (sliderOuter) {
                sliderOuter.addEventListener('input', (e) => updateRing('outer', e.target, labelOuter, outerTitles));
            }
            if (sliderInner) {
                sliderInner.addEventListener('input', (e) => updateRing('inner', e.target, labelInner, innerTitles));
            }

            // Power Toggle Helper
            window.toggleMobilePower = () => {
                if (!window.demoScene) return;
                const current = window.demoScene.systemState;
                const next = (current === 'ACTIVE') ? 'STANDBY' : 'ACTIVE';

                // 1. Trigger Visuals
                window.demoScene.setSystemState(next);

                // 2. Trigger AI (if available)
                if (window.ampereAI) {
                    if (next === 'ACTIVE') {
                        if (!window.ampereAI.isConnected && !window.ampereAI.isConnecting) {
                            window.ampereAI.startSession();
                        }
                    } else {
                        window.ampereAI.endSession();
                    }
                }
            };

            // Mobile UI State Observer
            const obs = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.type === 'attributes' && m.attributeName === 'data-system-state') {
                        const state = document.body.getAttribute('data-system-state');
                        updateMobileDisplay(state);

                        // v2.596: Global State Enforcement for AI
                        if (state !== 'ACTIVE') {
                            const chatContainer = document.getElementById('ampere-ai-chat-container');

                            if (chatContainer) chatContainer.classList.add('hidden');

                            if (window.ampereAI && (window.ampereAI.isConnected || window.ampereAI.isConnecting)) {
                                window.ampereAI.endSession();
                            }
                        }
                    }
                }
            });
            obs.observe(document.body, { attributes: true });

            // v2.269: Observe Standby Warning Changes
            const observerWarning = new MutationObserver((mutations) => {
                const warningEl = document.getElementById('ampere-standby-warning');
                const mobileTimer = document.getElementById('mobile-standby-timer');
                if (warningEl && mobileTimer) {
                    const text = warningEl.innerText;
                    const opacity = window.getComputedStyle(warningEl).opacity;

                    if (opacity > 0 && text.includes('STANDBY IN')) {
                        mobileTimer.classList.remove('hidden');
                        const match = text.match(/\d+s/);
                        if (match) mobileTimer.innerText = "STBY IN " + match[0].toUpperCase();
                    } else {
                        mobileTimer.classList.add('hidden');
                    }
                }
            });

            // Wait for warning element to be created by JS
            setTimeout(() => {
                const warningEl = document.getElementById('ampere-standby-warning');
                if (warningEl) {
                    warningEl.classList.add('lg:block', 'hidden'); // Force hide on mobile via classes
                    observerWarning.observe(warningEl, { childList: true, characterData: true, subtree: true, attributes: true });
                }
            }, 1000);

        }, 50);

        function updateMobileDisplay(state) {
            const btns = document.querySelectorAll('.power-toggle-btn');

            // Toggle Opacity of Slider Containers
            const inputsToToggle = document.querySelectorAll('#mobile-sliders-container input[type="range"]');
            inputsToToggle.forEach(input => {
                const parent = input.closest('.flex-col');
                if (parent) {
                    if (state === 'ACTIVE') {
                        parent.classList.remove('opacity-40', 'pointer-events-none', 'grayscale');
                        input.disabled = false;
                    } else {
                        parent.classList.add('opacity-40', 'pointer-events-none', 'grayscale');
                        input.disabled = true;
                    }
                }
            });

            // Toggle Transcript Buttons
            const transcriptBtns = document.querySelectorAll('.transcript-toggle-btn');
            transcriptBtns.forEach(btn => {
                if (state === 'ACTIVE') {
                    btn.classList.remove('opacity-0', 'pointer-events-none');
                } else {
                    btn.classList.add('opacity-0', 'pointer-events-none');
                }
            });
        }
    }

    // 5. Transcript Toggle Listeners (Manual Wiring)
    document.querySelectorAll('.transcript-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const container = document.getElementById('ampere-ai-chat-container');
            if (container) {
                container.classList.toggle('hidden');
                const input = container.querySelector('input');
                if (!container.classList.contains('hidden') && input) input.focus();
            }
        });
    });
});
// Force update v2.889
// Force update v2.890
// Force update v2.978
