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
                
                <!-- Internal Header (Visualizer Only?) -->
                <!-- If status is external, we might just show visualizer here or nothing -->
                <div class="flex items-center justify-between z-10 border-b border-white/5 pb-2">
                    <span class="text-xs font-mono uppercase text-slate-500 tracking-widest">Transcript</span>
                    
                    <!-- Audio Visualizer (CSS Bars) -->
                    <div id="ai-visualizer" class="flex items-center gap-1 h-4 opacity-50">
                        <div class="w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                        <div class="w-1 h-3 bg-white/80 rounded-full animate-pulse delay-75"></div>
                        <div class="w-1 h-2 bg-white/80 rounded-full animate-pulse delay-150"></div>
                        <div class="w-1 h-3 bg-white/80 rounded-full animate-pulse delay-100"></div>
                        <div class="w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                    </div>
                </div>

                <!-- Transcript / Messages -->
                <!-- Always visible inside this window -->
                <div id="ai-messages" class="w-full max-h-64 overflow-y-auto space-y-2 pr-2 text-sm text-slate-300 font-light scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <p class="italic text-slate-500 text-xs">Ready to chat.</p>
                </div>
            </div>
        `;

        if (!this.startBtn) {
             // Fallback: If no external start button, throw error or handle legacy
             console.error("AmpereAIChat: No Start Button defined.");
        }
        
        this.visualizer = this.container.querySelector('#ai-visualizer');
        this.messages = this.container.querySelector('#ai-messages');
    }

    bindEvents() {
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.startSession());
        if (this.endBtn) this.endBtn.addEventListener('click', () => this.endSession());
        
        // Text Chat Toggle (Opens Window)
        if (this.textChatBtn) {
            this.textChatBtn.addEventListener('click', () => {
                this.container.classList.toggle('hidden');
            });
        }
    }

    async startSession() {
        if (this.isConnecting || this.isConnected) return;

        this.setConnectingState();
        
        // Auto-open chat window on voice start? Maybe prefer hidden unless asked.
        this.container.classList.remove('hidden'); 

        try {
            // Request Mic
            await navigator.mediaDevices.getUserMedia({ audio: true });

            this.conversation = await Conversation.startSession({
                agentId: this.agentId,
                onConnect: () => this.handleConnect(),
                onDisconnect: () => this.handleDisconnect(),
                onError: (err) => this.handleError(err),
                onModeChange: (mode) => this.handleModeChange(mode) 
            });

        } catch (error) {
            console.error('AmpereAIChat: Connection failed', error);
            this.handleError(error);
        }
    }
    
    // --- UI Update Helpers ---
    updateStatusUI(state, message) {
        if (!this.statusTarget) return;
        
        // We inject into the Pill (Text | Dots)
        // If state is 'connecting' or 'connected', we assume the Pill is in 'Pill Mode' (flex row)
        
        // Remove existing content in target
        this.statusTarget.innerHTML = '';
        
        const statusText = document.createElement('span');
        statusText.className = "text-[10px] font-mono font-bold tracking-widest uppercase whitespace-nowrap";
        statusText.innerText = message;
        
        const dot = document.createElement('div');
        dot.className = "w-2 h-2 rounded-full transition-colors duration-300";
        
        if (state === 'connecting') {
            statusText.className += " text-yellow-400";
            dot.className += " bg-yellow-400 animate-ping";
        } else if (state === 'connected') {
            statusText.className += " text-blue-400";
            dot.className += " bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]";
        } else if (state === 'disconnected') {
            statusText.className += " text-slate-500";
            dot.className += " bg-slate-600";
        } else if (state === 'error') {
            statusText.className += " text-red-500";
            dot.className += " bg-red-500";
        }
        
        // Order: Text | Dot (Pill style)
        this.statusTarget.appendChild(statusText);
        this.statusTarget.appendChild(dot);
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
        
        this.updateStatusUI('connected', 'Secure Connection');
        
        // Swap Buttons
        if (this.startBtn) this.startBtn.classList.add('hidden');
        if (this.endBtn) this.endBtn.classList.remove('hidden');

        // Show Messages Area
        this.container.classList.remove('hidden');
        if (this.messages) this.messages.innerHTML = '<p class="italic text-slate-500 text-xs">Secure connection established.</p>';
    }

    handleDisconnect() {
        this.isConnected = false;
        this.isConnecting = false;

        this.updateStatusUI('disconnected', 'Disconnected');

        // Swap Buttons
        if (this.startBtn) {
            this.startBtn.classList.remove('hidden');
            this.startBtn.disabled = false;
            this.startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        if (this.endBtn) this.endBtn.classList.add('hidden');

        this.updateVisualizer(false);
    }

    handleError(err) {
        this.isConnecting = false;
        this.isConnected = false;
        
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
        this.statusText.innerText = isSpeaking ? "Agent Speaking" : "Listening...";
        this.updateVisualizer(isSpeaking);
        
        // Optional: Log state change
        // this.addMessage(isSpeaking ? "Agent is speaking..." : "User is speaking...");
    }

    // --- Helpers ---

    updateVisualizer(isActive) {
        // Simple CSS toggle for the bars
        const bars = this.visualizer.querySelectorAll('div');
        if (isActive) {
            this.visualizer.classList.remove('opacity-50');
            bars.forEach(bar => {
                // Randomize animation duration for organic feel
                bar.style.animationDuration = `${0.3 + Math.random() * 0.4}s`; 
                bar.classList.add('animate-pulse');
            });
        } else {
            this.visualizer.classList.add('opacity-50');
            // Slow down or pause
            bars.forEach(bar => {
                bar.style.animationDuration = '1.5s';
            });
        }
    }
}
