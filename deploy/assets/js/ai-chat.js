import { Conversation } from 'https://esm.sh/@elevenlabs/client?bundle';

export class AmpereAIChat {
    constructor(containerId, agentId) {
        this.container = document.getElementById(containerId);
        this.agentId = agentId;
        this.conversation = null;
        this.isConnecting = false;
        this.isConnected = false;

        // UI References
        this.startBtn = null;
        this.endBtn = null;
        this.statusText = null;
        this.statusDot = null;
        this.visualizer = null;

        if (this.container) {
            this.init();
        } else {
            console.warn(`AmpereAIChat: Container #${containerId} not found.`);
        }
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        // Generate the Glass UI
        this.container.innerHTML = `
            <div class="w-full rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 flex flex-col gap-4 relative overflow-hidden group">
                <!-- Background Gradient Glow -->
                <div class="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                
                <!-- Header -->
                <div class="flex items-center justify-between z-10">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <div id="ai-status-dot" class="w-2.5 h-2.5 rounded-full bg-slate-500 transition-colors duration-300"></div>
                            <div id="ai-status-ping" class="absolute inset-0 rounded-full bg-slate-500 opacity-75 animate-ping hidden"></div>
                        </div>
                        <span id="ai-status-text" class="text-xs font-mono uppercase tracking-widest text-slate-400">Disconnected</span>
                    </div>
                    
                    <!-- Audio Visualizer (CSS Bars) -->
                    <div id="ai-visualizer" class="flex items-center gap-1 h-4 opacity-50">
                        <div class="w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                        <div class="w-1 h-3 bg-white/80 rounded-full animate-pulse delay-75"></div>
                        <div class="w-1 h-2 bg-white/80 rounded-full animate-pulse delay-150"></div>
                        <div class="w-1 h-3 bg-white/80 rounded-full animate-pulse delay-100"></div>
                        <div class="w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                    </div>
                </div>

                <!-- Main Action Area -->
                <div class="flex items-center justify-center py-4 z-10 transition-all duration-300" id="ai-action-area">
                    <button id="ai-start-btn" class="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group/btn">
                        <svg class="w-5 h-5 text-blue-400 group-hover/btn:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span class="text-sm font-medium text-slate-200">Start Conversation</span>
                    </button>
                    
                    <button id="ai-end-btn" class="hidden flex items-center gap-3 px-6 py-3 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all duration-300 text-red-400">
                         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span class="text-sm font-medium">End Call</span>
                    </button>
                </div>

                <!-- Transcript / Messages (Hidden by default, expands) -->
                <div id="ai-messages" class="hidden w-full max-h-32 overflow-y-auto space-y-2 pr-2 text-sm text-slate-300 font-light scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent border-t border-white/5 pt-4 mt-2">
                    <p class="italic text-slate-500 text-xs">Conversation started...</p>
                </div>
            </div>
        `;

        this.startBtn = this.container.querySelector('#ai-start-btn');
        this.endBtn = this.container.querySelector('#ai-end-btn');
        this.statusText = this.container.querySelector('#ai-status-text');
        this.statusDot = this.container.querySelector('#ai-status-dot');
        this.statusPing = this.container.querySelector('#ai-status-ping');
        this.visualizer = this.container.querySelector('#ai-visualizer');
        this.messages = this.container.querySelector('#ai-messages');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startSession());
        this.endBtn.addEventListener('click', () => this.endSession());
    }

    async startSession() {
        if (this.isConnecting || this.isConnected) return;

        this.setConnectingState();

        try {
            // Request Mic
            await navigator.mediaDevices.getUserMedia({ audio: true });

            this.conversation = await Conversation.startSession({
                agentId: this.agentId,
                onConnect: () => this.handleConnect(),
                onDisconnect: () => this.handleDisconnect(),
                onError: (err) => this.handleError(err),
                onModeChange: (mode) => this.handleModeChange(mode) 
                // Note: mode is object { mode: 'speaking' | 'listening' }
            });

        } catch (error) {
            console.error('AmpereAIChat: Connection failed', error);
            this.handleError(error);
        }
    }

    async endSession() {
        if (this.conversation) {
            await this.conversation.endSession();
            this.conversation = null;
        }
    }

    // --- State Handlers ---

    setConnectingState() {
        this.isConnecting = true;
        this.statusText.innerText = "Connecting...";
        this.statusDot.className = "w-2.5 h-2.5 rounded-full bg-yellow-400 transition-colors duration-300";
        this.statusPing.classList.remove('hidden');
        this.statusPing.className = "absolute inset-0 rounded-full bg-yellow-400 opacity-75 animate-ping";
        
        this.startBtn.disabled = true;
        this.startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    handleConnect() {
        this.isConnecting = false;
        this.isConnected = true;
        
        // Update Status
        this.statusText.innerText = "Online";
        this.statusText.classList.add('text-blue-400');
        this.statusDot.className = "w-2.5 h-2.5 rounded-full bg-blue-400 transition-colors duration-300";
        this.statusPing.className = "absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping";
        
        // Swap Buttons
        this.startBtn.classList.add('hidden');
        this.startBtn.disabled = false;
        this.startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        
        this.endBtn.classList.remove('hidden');

        // Show Messages Area
        this.messages.classList.remove('hidden');
        this.messages.innerHTML = '<p class="italic text-slate-500 text-xs">Secure connection established.</p>';
    }

    handleDisconnect() {
        this.isConnected = false;
        this.isConnecting = false;

        // Reset Status
        this.statusText.innerText = "Disconnected";
        this.statusText.classList.remove('text-blue-400');
        this.statusDot.className = "w-2.5 h-2.5 rounded-full bg-slate-500 transition-colors duration-300";
        this.statusPing.classList.add('hidden');

        // Swap Buttons
        this.endBtn.classList.add('hidden');
        this.startBtn.classList.remove('hidden');

        this.updateVisualizer(false);
    }

    handleError(err) {
        this.isConnecting = false;
        this.isConnected = false;
        
        this.statusText.innerText = "Error";
        this.statusDot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
        this.statusPing.classList.add('hidden');

        this.startBtn.classList.remove('hidden');
        this.startBtn.disabled = false;
        this.startBtn.classList.remove('opacity-50');
        this.endBtn.classList.add('hidden');

        this.messages.innerHTML += `<p class="text-red-400 text-xs mt-1">Error: ${err.message || 'Connection failed'}</p>`;
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
