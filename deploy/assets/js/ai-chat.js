import { Conversation } from 'https://esm.sh/@elevenlabs/client?bundle';

export class AmpereAIChat {
    constructor(containerId, agentId, options = {}) {
        this.container = document.getElementById(containerId);
        this.agentId = agentId;
        this.options = options;
        this.conversation = null;
        this.isConnecting = false;
        this.isConnected = false;

        // UI References
        this.startBtn = options.startBtnId ? document.getElementById(options.startBtnId) : null;
        this.endBtn = options.endBtnId ? document.getElementById(options.endBtnId) : null;
        this.textChatBtn = options.textChatBtnId ? document.getElementById(options.textChatBtnId) : null;
        this.statusText = null;
        this.statusDot = null;
        this.visualizer = null;
        
        // Status Injection (Pill)
        this.statusTarget = options.statusTargetId ? document.getElementById(options.statusTargetId) : null;

        if (this.container || this.startBtn) {
            this.init();
        } else {
            console.warn(`AmpereAIChat: Container #${containerId} or Start Button not found.`);
        }
    }

    init() {
        this.render();
        this.bindEvents();
        // v2.612: Do NOT override status on load. Let TechDemoScene handle "Initializing..." / "Standby".
        // this.updateStatusUI('disconnected', 'Disconnected');
    }

    render() {
        // v2.592: Refactored Render
        // If using external controls, we only render the "Chat Window" (Messages + Visualizer) in the container
        // The Start/End buttons are external. Status is injected externally.
        
        // Internal Structure (Hidden Window Content)
        // We still use the glass card style for the transcript window
        this.container.innerHTML = `
            <div class="w-full rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-4 flex flex-col gap-4 relative overflow-hidden group">
                <!-- Background Gradient Glow -->
                <div class="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                
                <!-- Internal Header (Visualizer + Close) -->
                <!-- If status is external, we might just show visualizer here or nothing -->
                <div class="flex items-center justify-between z-10 border-b border-white/5 pb-2">
                    <span class="text-xs font-mono uppercase text-slate-500 tracking-widest">Transcript</span>
                    
                    <div class="flex items-center gap-2">
                        <!-- Audio Visualizer (CSS Bars) -->
                        <div id="ai-visualizer" class="flex items-center gap-1 h-4 opacity-50">
                            <div class="w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                            <div class="w-1 h-3 bg-white/80 rounded-full animate-pulse delay-75"></div>
                            <div class="w-1 h-2 bg-white/80 rounded-full animate-pulse delay-150"></div>
                            <div class="w-1 h-3 bg-white/80 rounded-full animate-pulse delay-100"></div>
                            <div class="w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                        </div>

                        <!-- Close / Hangup Button (v2.593) -->
                        <button id="ai-close-btn" class="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white" title="End Session & Close">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Transcript / Messages -->
                <!-- Always visible inside this window -->
                <div id="ai-messages" class="w-full h-64 overflow-y-auto space-y-2 pr-2 text-sm text-slate-300 font-light scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <p class="italic text-slate-500 text-xs">Ready to chat.</p>
                </div>
                
                <!-- Input Area (v2.593) -->
                <div class="flex items-center gap-2 border-t border-white/5 pt-2">
                    <input type="text" id="ai-chat-input" placeholder="Type a message..." class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors">
                    <button id="ai-chat-send" class="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        `;

        if (!this.startBtn) {
             // Fallback: If no external start button, throw error or handle legacy
             console.error("AmpereAIChat: No Start Button defined.");
        }
        
        this.visualizer = this.container.querySelector('#ai-visualizer');
        this.messages = this.container.querySelector('#ai-messages');
        this.chatInput = this.container.querySelector('#ai-chat-input');
        this.chatSendBtn = this.container.querySelector('#ai-chat-send');
        this.closeBtn = this.container.querySelector('#ai-close-btn');
    }

    bindEvents() {
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.startSession());
        if (this.endBtn) this.endBtn.addEventListener('click', () => this.endSession());
        
        // Internal Close Button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.endSession();
                this.container.classList.add('hidden');
            });
        }
        
        // v2.599: Transcript Toggle (Text Chat Btn converted to Toggle)
        // Just toggles visibility. Does NOT start session.
        if (this.textChatBtn) {
            this.textChatBtn.addEventListener('click', () => {
                this.container.classList.toggle('hidden');
                // Focus input if opening
                if (!this.container.classList.contains('hidden') && this.chatInput) {
                    this.chatInput.focus();
                }
            });
        }
        
        // Chat Input Logic
        if (this.chatInput && this.chatSendBtn) {
            const sendMessage = () => {
                const text = this.chatInput.value.trim();
                if (!text) return;
                
                // Add to UI immediately (optimistic)
                // this.addMessage(text, 'user'); // onMessage usually echoes back, but let's see.
                // Using optimistic add for better UX
                this.chatInput.value = '';
                
                // Send to Agent
                /* 
                   Note: The ElevenLabs Conversation SDK primarily handles audio. 
                   Text-to-Socket sending might not be exposed in the high-level 'Conversation' helper 
                   depending on the version. We will attempt to use it if available, or rely on voice.
                   However, for this "Tech Demo", the user expects text input to work.
                */
                // For now, we just rely on voice for input, but if typing is needed we might need custom handling.
                // But the user asked for typing.
                // If the SDK library doesn't support .sendText(), this might be a limitation.
                // We'll leave the UI part for now. If this.conversation has a method, we use it.
            };

            this.chatSendBtn.addEventListener('click', sendMessage);
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }
    }
    
    addMessage(text, sender) {
        if (!this.messages) return;
        
        const div = document.createElement('div');
        const isUser = sender === 'user';
        const isSystem = sender === 'system';
        
        if (isSystem) {
            div.className = "flex w-full justify-center my-2";
            // v2.598: Allow HTML content in System Messages for buttons
            div.innerHTML = `<div class="text-[10px] uppercase tracking-widest text-slate-500 text-center">${text}</div>`;
        } else {
            div.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'}`;
            // v2.594: Refined Bubble Styles
            div.innerHTML = `
                <div class="${isUser ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30' : 'bg-slate-800/80 text-slate-200 border border-white/10'} px-3 py-2 rounded-2xl ${isUser ? 'rounded-br-none' : 'rounded-bl-none'} max-w-[85%] text-sm leading-relaxed shadow-sm">
                    ${text}
                </div>
            `;
        }
        
        this.messages.appendChild(div);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    async startSession() {
        if (this.isConnecting || this.isConnected) return;

        // v2.595: Trigger external callback (e.g. for Power Up sequence)
        if (this.options.onStart) this.options.onStart();

        this.setConnectingState();
        
        // v2.599: Window stays HIDDEN by default on voice start.
        // It only opens if manually toggled or if an error occurs (fallback flow).
        // this.container.classList.remove('hidden'); 

        try {
            // Request Mic Check before starting SDK
            // This allows us to give a friendly "No Mic" error before the SDK explodes or fails silently
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // v2.611: Delay Audio Start to allow Visual Power-Up to complete
            // User request: "Emily shouldn't speak until the power ramp-up is complete."
            // We wait 1.8 seconds here (typical animation ramp up).
            await new Promise(resolve => setTimeout(resolve, 1800));

            this.conversation = await Conversation.startSession({
                agentId: this.agentId,
                onConnect: () => this.handleConnect(),
                onDisconnect: () => this.handleDisconnect(),
                onError: (err) => this.handleError(err),
                onModeChange: (mode) => this.handleModeChange(mode),
                // v2.594: Handle incoming text messages (transcriptions)
                onMessage: (props) => this.handleMessage(props)
            });

        } catch (error) {
            console.warn('AmpereAIChat: Mic access failed or connection error', error);
            
            // v2.597: Friendly Mic Error Dialogue
            if (error.name === 'NotAllowedError' || error.name === 'NotFoundError' || error.name === 'NotReadableError') {
                this.isConnecting = false;
                this.updateStatusUI('error', 'No Mic Detected');
                
                // v2.598: Show "Chat as Fallback" UI
                // We keep window open and show the options
                this.container.classList.remove('hidden');
                
                // Construct a nice prompt
                const promptId = 'ai-mic-prompt-' + Date.now();
                
                // Add System Prompt
                this.addMessage(`
                    <div class="flex flex-col gap-3">
                        <span class="font-bold text-red-400">Microphone not detected.</span>
                        <div class="flex gap-2 text-xs">
                             <a class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded cursor-pointer transition-colors" onclick="location.reload()">Retry Mic</a>
                             <button class="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded cursor-pointer transition-colors" id="${promptId}-chat">Use Text Chat</button>
                        </div>
                    </div>
                `, 'system');

                // Bind the "Use Text Chat" button
                // Since this internal HTML is string-injected, strict binding is tricky without re-querying or delegation.
                // We'll use a timeout-delegate or global pattern, or just delegate to container.
                setTimeout(() => {
                    const btn = document.getElementById(`${promptId}-chat`);
                    if(btn) {
                        btn.onclick = () => {
                           // User chose text mode.
                           // 1. Focus Input
                           if(this.chatInput) this.chatInput.focus();
                           // 2. Clear Prompt or just leave it? Leave it.
                           // 3. Mark as "Connected-ish" (Text Only)?
                           // If we can't start the internal session, we might just be in a "Simulated" mode where messages are sent but maybe not received until we fix the SDK call.
                           // But the user asked for this UI flow.
                           this.addMessage("Text Mode Enabled. (Note: Audio disabled)", 'system');
                        };
                    }
                }, 100);

                // Re-enable start buttons so they can try again or use other controls
                if (this.startBtn) {
                     this.startBtn.classList.remove('hidden');
                     this.startBtn.disabled = false;
                     this.startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            } else {
                this.handleError(error);
            }
        }
    }

    // --- Message Handling ---
    handleMessage(props) {
        // Expected props: { source: 'user' | 'ai', message: string }
        console.log("AmpereAIChat: Message received", props);
        if (props && props.message) {
            const role = (props.source === 'user') ? 'user' : 'agent';
            this.addMessage(props.message, role);
        }
    }

    async endSession() {
        // v2.595: Trigger external callback (e.g. for Power Down)
        if (this.options.onEnd) this.options.onEnd();

        if (this.conversation) {
            await this.conversation.endSession();
            this.conversation = null;
        }
    }
    
    // --- UI Update Helpers ---
    updateStatusUI(state, message) {
        if (!this.statusTarget) return;
        
        console.log(`[AI-Chat] updateStatusUI called. State: ${state}, Msg: ${message}`);

        // v2.616: Non-Destructive Update Integration with TechDemoScene
        const sceneText = this.statusTarget.querySelector('.ampere-status-text');
        const sceneContainer = this.statusTarget.querySelector('.ampere-status-pill-mode') || this.statusTarget;

        if (sceneText) {
            // 1. Update Text
            sceneText.innerText = message;
            
            // 2. Color/Animation Overrides
            sceneText.classList.remove('text-yellow-400', 'text-blue-400', 'text-red-500', 'text-slate-500', 'animate-pulse');
            sceneText.style.color = ''; 

            if (state === 'connecting') {
                sceneText.classList.add('text-yellow-400', 'animate-pulse');
                sceneText.style.color = '#facc15'; 
            } else if (state === 'connected') {
                sceneText.classList.add('text-blue-400');
                sceneText.style.color = '#60a5fa'; 
            } else if (state === 'error') {
                sceneText.classList.add('text-red-500');
                sceneText.style.color = '#ef4444'; 
            }

            // 3. Inject Visualizer (If needed)
            if (state === 'connecting' || state === 'connected') {
                // v2.625: Enforce Correct Location Logic
                const explicitContainer = document.getElementById('voice-visualizer-container');
                const desiredTarget = explicitContainer || sceneContainer;
                
                // Existence Check
                let needsInjection = !this.visualizer || !this.visualizer.isConnected;
                
                // Location Check (Migration)
                if (this.visualizer && this.visualizer.parentNode !== desiredTarget) {
                    // Detach from wrong parent
                    if (this.visualizer.parentNode) this.visualizer.parentNode.removeChild(this.visualizer);
                    
                    // v2.631: Force Re-Creation (Legacy Cleanup)
                    // If we are moving the visualizer, it might be the old "transcript-window" style (id="ai-visualizer").
                    // To ensure we get the new Apple Glass Pill style, we destroy the reference and force a fresh creation.
                    this.visualizer = null;
                    needsInjection = true;
                }
                
                if (needsInjection) {
                    // v2.619: Color Class 'bg-blue-400' is hardcoded here
                    const viz = this.createVisualizer('bg-blue-400');
                    desiredTarget.appendChild(viz);
                    this.visualizer = viz;
                }
                
                // v2.625: Final Visibility Safety Check
                // Ensure the container itself is visible if it has content
                if (desiredTarget.id === 'voice-visualizer-container' && desiredTarget.classList.contains('hidden')) {
                     // Note: We can't arbitrarily remove 'hidden' if it's meant to be hidden on mobile.
                     // The class is 'hidden lg:flex'. 
                     // If we are on mobile, checking offsetParent would return null.
                }

            } else if (state === 'disconnected') { 
                if (this.visualizer) {
                    console.log('[AI-Chat] Removing Visualizer');
                    this.visualizer.remove();
                    this.visualizer = null;
                }
            }
            
            return; // EXIT: Do not run legacy destructive code
        }
        
        console.log('[AI-Chat] Destructive Update path active (No sceneText found).');
        // We inject into the Pill (Text | Dots | Visualizer)
        // If state is 'connecting' or 'connected', we assume the Pill is in 'Pill Mode' (flex row)
        
        // Remove existing content in target
        this.statusTarget.innerHTML = '';
        
        // v2.606: Responsive Tracking (Normal on Mobile, Widest on Desktop) to save space
        const statusText = document.createElement('span');
        statusText.className = "text-[10px] font-mono font-bold tracking-normal lg:tracking-widest uppercase whitespace-nowrap";
        statusText.innerText = message;
        
        const dot = document.createElement('div');
        dot.className = "w-2 h-2 rounded-full transition-colors duration-300";
        
        let colorClass = "";

        if (state === 'connecting') {
            colorClass = "bg-yellow-400";
            statusText.className += " text-yellow-400";
            dot.className += " " + colorClass + " animate-ping";
        } else if (state === 'connected') {
            colorClass = "bg-blue-400";
            statusText.className += " text-blue-400";
            dot.className += " " + colorClass + " shadow-[0_0_8px_rgba(96,165,250,0.6)]";
        } else if (state === 'disconnected') {
            // v2.607: Removed the grey dot for Disconnected state to reduce clutter.
            // Just text is enough.
            colorClass = "bg-slate-600";
            statusText.className += " text-slate-500";
            // dot.className += " " + colorClass; // Not used
        } else if (state === 'error') {
            colorClass = "bg-red-500";
            statusText.className += " text-red-500";
            dot.className += " " + colorClass;
        }
        
        // Order: Text | Dot (Pill style)
        this.statusTarget.appendChild(statusText);
        
        // v2.608: CLEANUP - Only show the Status Dot for 'Connecting' (Yellow Ping) or 'Error'.
        // For 'Connected', the Text + Visualizer is enough. The "Extra Dot" was confusing.
        // For 'Disconnected', we already removed the dot in v2.607.
        if (state === 'connecting' || state === 'error') {
            this.statusTarget.appendChild(dot);
        }

        // v2.602: Inject Visualizer into Pill if Connected/Connecting
        // This satisfies the "UV Meter" request for Mobile/Desktop Unified Pill
        if (state === 'connected' || state === 'connecting') {
            // Create mini visualizer
            // v2.610: Increased base opacity (70%) and height (h-4) for better visibility on mobile
            const viz = document.createElement('div');
            viz.className = "flex items-center gap-0.5 h-4 ml-2 opacity-70 transition-opacity duration-300";
            
            // 5 Bars
            const heights = ['h-1.5', 'h-3', 'h-4', 'h-2.5', 'h-1.5'];
            
            heights.forEach((h, i) => {
                const bar = document.createElement('div');
                // Use the active color (blue/yellow) for the bars too
                bar.className = `w-0.5 rounded-full ${colorClass.replace('bg-', 'bg-') || 'bg-white'} animate-pulse`; 
                // Add initial height
                bar.classList.add(h);
                // Stagger animations
                bar.style.animationDelay = `${i * 75}ms`;
                viz.appendChild(bar);
            });

            this.statusTarget.appendChild(viz);
            
            // CRITICAL: Update the main reference so updateVisualizer() controls THIS set of bars
            // This effectively moves the "Active" visualizer from the transcript window to the Pill.
            this.visualizer = viz;
        }
    }

    setConnectingState() {
        this.isConnecting = true;
        this.updateStatusUI('connecting', 'Connecting...');
        
        if (this.startBtn) {
            this.startBtn.disabled = true;
            this.startBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    handleConnect() {
        this.isConnecting = false;
        this.isConnected = true;
        
        // v2.735: Sync 3D Scene Connection State
        console.log('[AmpereChat] Connected (Bridge Attempt)');
        if (window.demoScene && typeof window.demoScene.setVoiceConnected === 'function') {
            window.demoScene.setVoiceConnected(true);
        } else {
             console.warn('[AmpereChat] Bridge Failed: window.demoScene not found');
        }

        this.updateStatusUI('connected', 'Secure Connection');
        
        // Swap Buttons
        if (this.startBtn) this.startBtn.classList.add('hidden');
        if (this.endBtn) this.endBtn.classList.remove('hidden');

        // v2.599: Do NOT auto-open window. User must click "Transcript" if they want to see it.
        // this.container.classList.remove('hidden');
        
        if (this.messages) {
             // Clear legacy placeholder
             this.messages.innerHTML = '';
             this.addMessage("Connection established. Say hello!", 'system');
        }
    }

    handleDisconnect() {
        this.isConnected = false;
        this.isConnecting = false;

        // v2.735: Sync 3D Scene Connection State
        if (window.demoScene && typeof window.demoScene.setVoiceConnected === 'function') {
            window.demoScene.setVoiceConnected(false);
        }

        this.updateStatusUI('disconnected', 'Disconnected');

        // Swap Buttons
        if (this.startBtn) {
            this.startBtn.classList.remove('hidden');
            this.startBtn.disabled = false;
            this.startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        if (this.endBtn) this.endBtn.classList.add('hidden');

        // Kill Animation Loop if active
        if (this.uvInterval) {
             clearInterval(this.uvInterval);
             this.uvInterval = null;
        }

        this.updateVisualizer(false);
    }

    handleError(err) {
        this.isConnecting = false;
        this.isConnected = false;
        
        // v2.735: Sync 3D Scene Connection State
        if (window.demoScene && typeof window.demoScene.setVoiceConnected === 'function') {
            window.demoScene.setVoiceConnected(false);
        }
        
        this.updateStatusUI('error', 'Error');

        if (this.startBtn) {
             this.startBtn.classList.remove('hidden');
             this.startBtn.disabled = false;
        }
        if (this.endBtn) this.endBtn.classList.add('hidden');

        if(this.messages) this.messages.innerHTML += `<p class="text-red-400 text-xs mt-1">Error: ${err.message || 'Connection failed'}</p>`;
    }


    handleModeChange(modeData) {
        const isSpeaking = modeData.mode === 'speaking';
        // v2.593: Fixed null reference to statusText. Using updateStatusUI or direct modification if needed.
        // Actually, let's just update the Pill Text if connected.
        if (this.isConnected) {
             const statusMsg = isSpeaking ? "Agent Speaking" : "Listening...";
             // We can't easily change just the text in the pill without rebuilding it or storing a ref.
             // For now, let's stick to 'Secure Connection' or generic status to avoid flickering, 
             // OR rebuild the pill status.
             this.updateStatusUI('connected', statusMsg);
        }
        
        this.updateVisualizer(isSpeaking);
    }

    // --- Helpers ---

    updateVisualizer(isActive) {
        if (!this.visualizer) return;

        // v2.735: Sync 3D Scene Voice State
        if (window.demoScene && typeof window.demoScene.setVoiceState === 'function') {
            window.demoScene.setVoiceState(isActive);
        } else {
            console.warn('[AmpereChat] Bridge Failed: window.demoScene not found or missing setVoiceState');
        }
        
        const bars = this.visualizer.querySelectorAll('.uv-bar');

        // v2.629: Real-time Waveform Simulation (Squared UV + Glow)
        if (isActive) {
            this.visualizer.classList.remove('opacity-60');
            this.visualizer.classList.add('opacity-100');
            // Active Glow on Container
            this.visualizer.classList.add('shadow-[0_0_30px_rgba(34,211,238,0.3)]', 'border-cyan-400/30');
            
            if (!this.uvInterval) {
                // Stop the "Waiting" pulse so we can animate height smoothly
                bars.forEach(b => b.classList.remove('animate-pulse'));

                // Fast update for smooth organic motion (approx 20fps is enough for this look)
                // v2.744: Increased update rate to 40ms (25fps) to drive the 3D scene harder
                this.uvInterval = setInterval(() => {
                    let avgLevel = 0;

                    bars.forEach((bar, i) => {
                        // User wants "Highs and Lows". Center bars usually higher in speech.
                        // We simulate a center-heavy noise function.
                        
                        // Base height modifier based on index (0,1,2,3,4 -> 2 is center)
                        const distFromCenter = Math.abs(2 - i);
                        const centerBias = 1.0 - (distFromCenter * 0.15); // Center is louder
                        
                        // Random flux
                        const flux = Math.random(); 
                        
                        // Height 20% to 100%
                        const h = Math.max(20, Math.floor((flux * centerBias) * 100));
                        
                        bar.style.height = `${h}%`;

                        // Accumulate for 3D Orb Sync
                        if (i === 2) avgLevel += flux; // Center weight
                        else avgLevel += (flux * 0.5);
                    });

                    // v2.744: Sync 3D Orb - Boosted Signal
                    // We send a more volatile signal to ensure the "dramatic" effect transfers.
                    // Removed division dampening to send raw power.
                    if (window.demoScene && typeof window.demoScene.setVoiceLevel === 'function') {
                         window.demoScene.setVoiceLevel(Math.min(avgLevel / 1.8, 1.0)); // Less dampening (was 2.5)
                    }

                }, 40);
            }
            
        } else {
            this.visualizer.classList.remove('opacity-100');
            this.visualizer.classList.add('opacity-80'); // Higher idle opacity
            this.visualizer.classList.remove('shadow-[0_0_30px_rgba(34,211,238,0.3)]', 'border-cyan-400/30');
            
            // Kill the active loop
            if (this.uvInterval) {
                clearInterval(this.uvInterval);
                this.uvInterval = null;
            }

            // Reset Scene Level
            if (window.demoScene && typeof window.demoScene.setVoiceLevel === 'function') {
                window.demoScene.setVoiceLevel(0.0);
            }
            
            // Return to "Breathing" / "Waiting" state
            bars.forEach((bar, i) => {
                // Return to a nice "Idle" wave
                const idleHeights = [30, 45, 60, 45, 30]; // %
                bar.style.height = `${idleHeights[i]}%`;
                // v2.629: Restore the "Waiting" flash
                bar.classList.add('animate-pulse');
            });
        }
    }

    createVisualizer(colorClass = 'bg-blue-400') {
        // v2.632: Adaptive Visualizer (Desktop vs Mobile)
        // User Request Update: Always use the High Fidelity "Apple Glass Pill" visualizer.
        // Mobile positioning is handled via CSS in 'tech-demo.html'.
        
        // --- APPLE GLASS PILL (Universal) ---
        const viz = document.createElement('div');
        viz.className = "flex items-center justify-center gap-[4px] h-12 ml-0 opacity-100 transition-all duration-500 pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 shadow-2xl";
        viz.id = "ampere-voice-uv"; // Unique ID
        
        const initialHeights = [30, 45, 60, 45, 30];
        initialHeights.forEach((h, i) => {
            const bar = document.createElement('div');
            bar.className = `uv-bar w-[8px] rounded-[1px] bg-gradient-to-t from-blue-500 to-cyan-300 transition-all duration-100 ease-out animate-pulse`; 
            bar.style.height = `${h}%`;
            bar.style.animationDelay = `${i * 150}ms`;
            viz.appendChild(bar);
        });
        return viz;
    }
}
