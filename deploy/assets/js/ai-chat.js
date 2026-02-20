import { Conversation } from 'https://esm.sh/@elevenlabs/client@latest?bundle';

export class AmpereAIChat {
    constructor(containerId, agentId, options = {}) {
        this.container = document.getElementById(containerId);
        this.agentId = agentId;
        this.options = options;
        this.conversation = null;
        this.isConnecting = false;
        this.isConnected = false;
        this.voiceBuffer = null; // v3.190: Voice Print PCM ring buffer

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

                // v3.185: Show user message immediately (optimistic)
                this.addMessage(text, 'user');
                this.chatInput.value = '';

                // v3.185: Send text to ElevenLabs Conversation SDK
                if (this.conversation && typeof this.conversation.sendUserMessage === 'function') {
                    this.conversation.sendUserMessage(text);
                    console.log(`%c[AmpereAI] 💬 TEXT SENT: "${text}"`, "color: #60a5fa; font-weight: bold;");
                } else {
                    console.warn('[AmpereAI] Text send unavailable — no active session or SDK method missing.');
                    this.addMessage("⚠️ Voice session required. Text input needs an active connection.", 'system');
                }
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
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // v3.190: Voice Print — Initialize AudioWorklet for PCM ring buffer
            try {
                const audioCtx = new AudioContext({ sampleRate: 48000 });
                await audioCtx.audioWorklet.addModule('/assets/js/audio-worklet-processor.js');
                const workletNode = new AudioWorkletNode(audioCtx, 'voice-print-processor');
                const source = audioCtx.createMediaStreamSource(micStream);
                source.connect(workletNode);
                // Don't connect to destination — silent tap only
                this.voiceBuffer = {
                    node: workletNode,
                    context: audioCtx,
                    getSnapshot: (durationMs = 3000) => {
                        return new Promise((resolve) => {
                            const timeout = setTimeout(() => {
                                workletNode.port.removeEventListener('message', handler);
                                console.warn('[AmpereAI] Voice buffer snapshot timed out after 5s');
                                resolve({ status: 'timeout' });
                            }, 5000);
                            const handler = (event) => {
                                clearTimeout(timeout);
                                workletNode.port.removeEventListener('message', handler);
                                resolve(event.data);
                            };
                            workletNode.port.addEventListener('message', handler);
                            workletNode.port.start(); // Required when using addEventListener
                            workletNode.port.postMessage({ type: 'snapshot', durationMs });
                        });
                    }
                };
                console.log('%c[AmpereAI] 🎙️ VOICE BUFFER: AudioWorklet initialized (5s ring buffer)', 'color: #06b6d4; font-weight: bold;');
            } catch (vbErr) {
                console.warn('[AmpereAI] Voice buffer init failed (non-blocking):', vbErr);
                this.voiceBuffer = null;
            }

            // v2.611: Delay Audio Start to allow Visual Power-Up to complete
            // User request: "Emily shouldn't speak until the power ramp-up is complete."
            // We wait 1.8 seconds here (typical animation ramp up).

            // v2.860: Identity Push. Retrieve ID here to push into dynamic_variables.
            // This allows the Agent to know the ID immediately without "probing" callbacks.
            let visitorId = localStorage.getItem('ampere_visitor_id');

            // v2.879: Migration - Check Cookies if LocalStorage is empty
            if (!visitorId) {
                const cookieMatch = document.cookie.split('; ').find(row => row.startsWith('ampere_visitor_id='));
                if (cookieMatch) {
                    visitorId = cookieMatch.split('=')[1];
                    console.log(`%c[AmpereAI] 🍪 MIGRATED ID FROM COOKIE: ${visitorId}`, "color: #f59e0b; font-weight: bold;");
                    localStorage.setItem('ampere_visitor_id', visitorId);
                }
            }

            if (!visitorId) {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    visitorId = crypto.randomUUID();
                } else {
                    visitorId = 'v-' + Math.random().toString(36).substring(2, 15);
                }
                localStorage.setItem('ampere_visitor_id', visitorId);
            }

            // v2.871: Pre-calculate Time Greeting (Client Side) for consistency
            const currentHour = new Date().getHours();
            let timeGreeting = "Hello";
            if (currentHour < 12) timeGreeting = "Good morning";
            else if (currentHour < 17) timeGreeting = "Good afternoon";
            else timeGreeting = "Good evening";

            // v3.166: Pre-fetch personalized greeting from backend.
            // The ElevenLabs init webhook only fires for phone/SIP calls, not web SDK.
            // We call /greeting/web during the animation delay (runs in parallel, no extra latency).
            const fallbackGreeting = `${timeGreeting}, this is Emily with Ampere AI. How can I help you today?`;
            let personalizedGreeting = fallbackGreeting;
            let situationalBriefing = "";
            let visitorStatus = "new";
            let userName = "";
            let knownPhone = "";
            let knownEmail = "";
            let hasVoiceprint = "false";

            const greetingFetch = fetch("https://memory-api.tight-butterfly-7b71.workers.dev/greeting/web", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visitor_id: visitorId, time_greeting: timeGreeting })
            }).then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    if (data.dynamic_greeting) {
                        personalizedGreeting = data.dynamic_greeting;
                        console.log(`%c[AmpereAI] 🎯 PERSONALIZED GREETING: "${data.dynamic_greeting}" (status: ${data.visitor_status}${data.name ? ', name: ' + data.name : ''})`, "color: #10b981; font-weight: bold;");
                    }
                    if (data.situational_briefing) {
                        situationalBriefing = data.situational_briefing;
                        console.log(`%c[AmpereAI] 📋 SITUATIONAL BRIEFING LOADED (${data.situational_briefing.length} chars)`, "color: #8b5cf6; font-weight: bold;");
                    }
                    if (data.visitor_status) {
                        visitorStatus = data.visitor_status;
                    }
                    if (data.name) {
                        userName = data.name;
                        console.log(`%c[AmpereAI] 👤 USER NAME RESOLVED: ${data.name}`, "color: #f472b6; font-weight: bold;");
                    }
                    if (data.known_phone) {
                        knownPhone = data.known_phone;
                    }
                    if (data.known_email) {
                        knownEmail = data.known_email;
                        console.log(`%c[AmpereAI] 📧 KNOWN EMAIL: ${data.known_email}`, "color: #06b6d4; font-weight: bold;");
                    }
                    if (data.has_voiceprint !== undefined) {
                        hasVoiceprint = data.has_voiceprint ? "true" : "false";
                    }
                    console.log(`%c[AmpereAI] 🎙️ VOICEPRINT STATUS: ${hasVoiceprint}`, "color: #8b5cf6; font-weight: bold;");
                }
            }).catch((err) => {
                console.log(`%c[AmpereAI] ⚠️ Greeting fetch failed, using fallback`, "color: #f59e0b;", err);
            });

            // Run animation delay and greeting fetch in parallel
            await Promise.all([
                new Promise(resolve => setTimeout(resolve, 1800)),
                greetingFetch
            ]);

            // Build identity preview with all known contact info
            let identityPreview = "";
            if (userName || knownPhone || knownEmail) {
                const parts = [];
                if (userName) parts.push(`Name: ${userName}`);
                if (knownPhone) parts.push(`Phone: ${knownPhone}`);
                if (knownEmail) parts.push(`Email: ${knownEmail}`);
                identityPreview = `Web Visitor — ${parts.join(", ")}`;
            }

            console.log("%c[AmpereAI] 🚀 PUSHING CONTEXT:", "color: #a855f7; font-weight: bold;", {
                visitor_id: visitorId,
                user_time_greeting: timeGreeting,
                dynamic_greeting: personalizedGreeting,
                situational_briefing: situationalBriefing ? '(loaded)' : '(empty)',
                visitor_status: visitorStatus,
                user_name: userName || '(none)',
                known_phone: knownPhone || '(none)',
                known_email: knownEmail || '(none)',
                verified_identity_preview: identityPreview || '(none)',
                has_voiceprint: hasVoiceprint
            });

            this.conversation = await Conversation.startSession({
                agentId: this.agentId,
                dynamicVariables: {
                    visitor_id: visitorId,
                    user_time_greeting: timeGreeting,
                    dynamic_greeting: personalizedGreeting,
                    situational_briefing: situationalBriefing,
                    visitor_status: visitorStatus,
                    user_name: userName,
                    known_phone: knownPhone,
                    known_email: knownEmail,
                    verified_identity_preview: identityPreview,
                    has_voiceprint: hasVoiceprint
                },
                onConnect: () => this.handleConnect(),
                onDisconnect: () => this.handleDisconnect(),
                onError: (err) => this.handleError(err),
                onModeChange: (mode) => this.handleModeChange(mode),
                // v2.594: Handle incoming text messages (transcriptions)
                onMessage: (props) => this.handleMessage(props),
                // v2.991: Tool Callbacks for UI Feedback (User Request)
                onToolCall: (toolCall) => {
                    console.log(`%c[AmpereAI] 🛠️ SERVER TOOL CALLED: ${toolCall.name}`, "color: #f472b6; font-weight: bold;", toolCall);

                    // v3.172: Trigger processing state (halo ring) for ALL server tool calls
                    if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
                        window.demoScene.setProcessingState(true);
                    }

                    // Direct UI Manipulation (Robust Fallback if WebSocket fails)
                    if (window.demoScene) {
                        if (toolCall.name.includes('memory')) {
                            window.demoScene.selectFunction("memory");
                            if (window.systemLink) {
                                if (toolCall.name.includes('query') || toolCall.name.includes('search')) window.systemLink.triggerExtract("QUERYING...");
                                else window.systemLink.triggerInsert("MEM_WRITE");
                            }
                        } else if (toolCall.name.includes('identity')) {
                            window.demoScene.selectFunction("identity");
                            if (window.systemLink) window.systemLink.triggerOtpTx();
                        } else if (toolCall.name.includes('handoff') || toolCall.name.includes('transfer')) {
                            window.demoScene.selectFunction("transfer");
                            // v3.185: Inner ring rotation — map handoff_reason to target agent
                            const reason = (toolCall.parameters?.handoff_reason || '').toLowerCase();
                            const AGENT_REASON_MAP = [
                                { keywords: ['demo', 'walk-through', 'walkthrough', 'feature'], agent: 'guide', card: 1 },
                                { keywords: ['onboarding', 'setup', 'getting started', 'new user'], agent: 'onboarding', card: 2 },
                                { keywords: ['technical', 'twilio', 'integration', 'api', 'support'], agent: 'tech', card: 3 },
                                { keywords: ['pricing', 'sales', 'plan', 'quote', 'revenue'], agent: 'sales', card: 4 },
                                { keywords: ['booking', 'calendar', 'schedule', 'appointment'], agent: 'booking', card: 5 },
                            ];
                            const match = AGENT_REASON_MAP.find(m => m.keywords.some(k => reason.includes(k)));
                            if (match) {
                                console.log(`[AmpereAI] Handoff → ${match.agent} (reason: "${reason}")`);
                                setTimeout(() => window.demoScene.selectFunction(match.agent), 600);
                                if (window.activateAgentCard) window.activateAgentCard(match.card);
                            }
                            if (window.systemLink) window.systemLink.log("AGENT_HANDOFF → " + (match?.agent || reason).toUpperCase(), "system");
                        }
                    }
                },
                // v2.800: Client Tool for Web Visitor ID (Cookies)
                clientTools: {
                    get_web_visitor_id: async (parameters) => {
                        console.log("%c[AmpereAI] 🔍 IDENTITY CHECK: Tool 'get_web_visitor_id' CALLED.", "color: #0ea5e9; font-weight: bold;");

                        // v2.850: Trigger Visualization "Thinking" State during tool execution
                        if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
                            window.demoScene.setProcessingState(true);
                        }

                        let id = localStorage.getItem('ampere_visitor_id');
                        if (!id) {
                            console.log("%c[AmpereAI] 👤 NEW VISITOR: Generating UUID...", "color: #f59e0b;");
                            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                                id = crypto.randomUUID();
                            } else {
                                id = 'v-' + Math.random().toString(36).substring(2, 15);
                            }
                            localStorage.setItem('ampere_visitor_id', id);
                            console.log(`%c[AmpereAI] ✅ ID ASSIGNED: ${id}`, "color: #10b981; font-weight: bold;");
                        } else {
                            console.log(`%c[AmpereAI] ✅ ID FOUND: ${id} (Returning to Agent)`, "color: #10b981; font-weight: bold;");
                        }

                        // Short delay to ensure the flash is visible if the check is instant
                        await new Promise(r => setTimeout(r, 800));

                        if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
                            window.demoScene.setProcessingState(false);
                        }

                        return id; // Return string directly
                    },

                    // v3.190: Voice Print — Enroll speaker voiceprint
                    voice_enroll: async (parameters) => {
                        console.log('%c[AmpereAI] 🎙️ VOICE ENROLL: Capturing audio...', 'color: #8b5cf6; font-weight: bold;', parameters);

                        if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
                            window.demoScene.setProcessingState(true);
                        }

                        try {
                            if (!this.voiceBuffer) {
                                console.warn('[AmpereAI] Voice buffer not available');
                                return JSON.stringify({ status: 'error', reason: 'voice_buffer_unavailable' });
                            }

                            const snapshot = await this.voiceBuffer.getSnapshot(3000);
                            if (snapshot.status !== 'ok') {
                                return JSON.stringify({ status: 'error', reason: snapshot.status });
                            }

                            // Convert Float32 PCM to 16-bit WAV and base64-encode
                            const wavBase64 = this._pcmToWavBase64(snapshot.samples, snapshot.sampleRate);

                            const res = await fetch('https://memory-api.tight-butterfly-7b71.workers.dev/voice/enroll', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    user_id: parameters.user_id,
                                    display_name: parameters.display_name || '',
                                    audio: wavBase64,
                                    sampleRate: snapshot.sampleRate
                                })
                            });

                            const result = await res.json();
                            console.log('%c[AmpereAI] ✅ VOICE ENROLL RESULT:', 'color: #10b981; font-weight: bold;', result);
                            return JSON.stringify(result);
                        } catch (err) {
                            console.error('[AmpereAI] Voice enroll error:', err);
                            return JSON.stringify({ status: 'error', reason: err.message });
                        } finally {
                            if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
                                window.demoScene.setProcessingState(false);
                            }
                        }
                    },

                    // v3.190: Voice Print — Verify speaker voiceprint
                    voice_verify: async (parameters) => {
                        console.log('%c[AmpereAI] 🔐 VOICE VERIFY: Capturing audio...', 'color: #f59e0b; font-weight: bold;', parameters);

                        if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
                            window.demoScene.setProcessingState(true);
                        }

                        try {
                            if (!this.voiceBuffer) {
                                console.warn('[AmpereAI] Voice buffer not available');
                                return JSON.stringify({ verified: false, reason: 'voice_buffer_unavailable' });
                            }

                            const snapshot = await this.voiceBuffer.getSnapshot(3000);
                            if (snapshot.status !== 'ok') {
                                return JSON.stringify({ verified: false, reason: snapshot.status });
                            }

                            const wavBase64 = this._pcmToWavBase64(snapshot.samples, snapshot.sampleRate);

                            const res = await fetch('https://memory-api.tight-butterfly-7b71.workers.dev/voice/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    user_id: parameters.user_id,
                                    audio: wavBase64,
                                    sampleRate: snapshot.sampleRate
                                })
                            });

                            const result = await res.json();
                            console.log('%c[AmpereAI] 🔐 VOICE VERIFY RESULT:', 'color: #f59e0b; font-weight: bold;', result);
                            return JSON.stringify(result);
                        } catch (err) {
                            console.error('[AmpereAI] Voice verify error:', err);
                            return JSON.stringify({ verified: false, reason: err.message });
                        } finally {
                            if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
                                window.demoScene.setProcessingState(false);
                            }
                        }
                    },
                }
            });

            // v3.200: Container warmup — call the container DIRECTLY (bypasses service binding timeout)
            const CONTAINER_URL = 'https://voice-print-service.tight-butterfly-7b71.workers.dev';
            const containerWarmup = fetch(`${CONTAINER_URL}/health`)
                .then(r => r.json())
                .then(data => {
                    console.log(`%c[AmpereAI] 🎙️ CONTAINER WARMUP: ${data.status}`, 'color: #06b6d4; font-weight: bold;', data);
                    return data;
                })
                .catch(err => {
                    console.warn('[AmpereAI] CONTAINER WARMUP failed:', err);
                    return { status: 'error' };
                });

            // v3.197: Automatic voice enroll/verify — fires 10s after session start, bypasses LLM
            setTimeout(async () => {
                try {
                    console.log('%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Timer fired, waiting for container warmup...', 'color: #8b5cf6;');

                    // Wait for container warmup (should have completed during 10s wait)
                    const warmupResult = await containerWarmup;
                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Container status: ${warmupResult.status}`, 'color: #8b5cf6;');

                    if (!this.voiceBuffer) {
                        console.log('%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: No voice buffer, skipping', 'color: #6b7280;');
                        return;
                    }

                    const userId = visitorId;
                    const isEnroll = hasVoiceprint === "false";
                    const action = isEnroll ? 'enroll' : 'verify';

                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Starting ${action} for ${userId}`, 'color: #8b5cf6; font-weight: bold;');
                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Step 1 — Capturing snapshot...`, 'color: #8b5cf6;');

                    const snapshot = await this.voiceBuffer.getSnapshot(3000);
                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Step 2 — Snapshot status: ${snapshot.status}, samples: ${snapshot.samples?.length || 0}`, 'color: #8b5cf6;');

                    if (snapshot.status !== 'ok') {
                        console.warn(`[AmpereAI] AUTO-VOICEPRINT: Snapshot failed: ${snapshot.status}`);
                        return;
                    }

                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Step 3 — Converting to WAV...`, 'color: #8b5cf6;');
                    const wavBase64 = this._pcmToWavBase64(snapshot.samples, snapshot.sampleRate);
                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Step 4 — WAV size: ${wavBase64.length} chars`, 'color: #8b5cf6;');

                    // v3.200: Call container DIRECTLY for embedding (bypasses service binding timeout)
                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Step 5 — Calling container /embed directly...`, 'color: #8b5cf6;');
                    const embedRes = await fetch(`${CONTAINER_URL}/embed`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ audio: wavBase64, sampleRate: snapshot.sampleRate, format: 'wav' })
                    });

                    if (!embedRes.ok) {
                        const errText = await embedRes.text();
                        console.error(`[AmpereAI] AUTO-VOICEPRINT: Container /embed failed: HTTP ${embedRes.status}`, errText);
                        return;
                    }

                    const embedData = await embedRes.json();
                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Step 6 — Embedding received: ${embedData.dimension}-dim, ${embedData.audioDuration}s audio`, 'color: #8b5cf6; font-weight: bold;');

                    // Step 7: Send embedding (NOT audio) to memory-api for storage/verification
                    const endpoint = isEnroll
                        ? 'https://memory-api.tight-butterfly-7b71.workers.dev/voice/enroll'
                        : 'https://memory-api.tight-butterfly-7b71.workers.dev/voice/verify';

                    const body = isEnroll
                        ? { user_id: userId, display_name: userName || '', embedding: embedData.embedding, dimension: embedData.dimension, audioDuration: embedData.audioDuration }
                        : { user_id: userId, embedding: embedData.embedding, dimension: embedData.dimension };

                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Step 7 — Posting ${action} to memory-api (embedding only, no audio)...`, 'color: #8b5cf6;');
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });

                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Step 8 — Response status: ${res.status}`, 'color: #8b5cf6;');
                    const result = await res.json();
                    console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT ${action.toUpperCase()} RESULT:`, 'color: #10b981; font-weight: bold;', result);
                } catch (err) {
                    console.error('[AmpereAI] AUTO-VOICEPRINT error:', err);
                }
            }, 10000); // 10 seconds after session starts

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
                    if (btn) {
                        btn.onclick = () => {
                            // User chose text mode.
                            // 1. Focus Input
                            if (this.chatInput) this.chatInput.focus();
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
            // v2.807: Filter out internal JSON artifacts (Tool Call Leaks)
            // If the message is purely a JSON object (starts with { and ends with }), suppress it.
            const cleanMsg = props.message.trim();
            if (cleanMsg.startsWith('{') && cleanMsg.endsWith('}')) {
                console.warn("[AmpereAI] Suppressed Leaked Tool JSON:", cleanMsg);
                return;
            }

            // v2.827: Strict suppression for Visitor ID tool leaks even if malformed/embedded
            if (cleanMsg.includes('visitor_id') && cleanMsg.includes('{')) {
                console.warn("[AmpereAI] Suppressed Leaked VISITOR_ID JSON:", cleanMsg);
                return;
            }

            // v2.828: Strict suppression for Session ID tool leaks
            if (cleanMsg.includes('session_id') && cleanMsg.includes('{')) {
                console.warn("[AmpereAI] Suppressed Leaked SESSION_ID JSON:", cleanMsg);
                return;
            }

            const role = (props.source === 'user') ? 'user' : 'agent';
            this.addMessage(props.message, role);

            // v2.762: Trigger "Thinking" State on User Input Finalization
            if (role === 'user') {
                if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
                    window.demoScene.setProcessingState(true);
                }
                // Update Status Pill
                this.updateStatusUI('connected', 'Computing...');
            }
        }
    }

    async endSession() {
        // v2.595: Trigger external callback (e.g. for Power Down)
        if (this.options.onEnd) this.options.onEnd();

        // v3.190: Clean up voice buffer AudioWorklet
        if (this.voiceBuffer) {
            try {
                this.voiceBuffer.node.disconnect();
                await this.voiceBuffer.context.close();
            } catch (e) { /* ignore cleanup errors */ }
            this.voiceBuffer = null;
        }

        if (this.conversation) {
            await this.conversation.endSession();
            this.conversation = null;
        }
    }

    // v3.190: Convert Float32 PCM samples to 16-bit WAV base64
    _pcmToWavBase64(samples, sampleRate) {
        const numChannels = 1;
        const bitsPerSample = 16;
        const bytesPerSample = bitsPerSample / 8;
        const dataLength = samples.length * bytesPerSample;
        const headerLength = 44;
        const buffer = new ArrayBuffer(headerLength + dataLength);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset, str) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true);  // PCM format
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
        view.setUint16(32, numChannels * bytesPerSample, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        // PCM data — clamp and convert Float32 to Int16
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(headerLength + i * 2, s * 0x7FFF, true);
        }

        // Base64 encode
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
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
        } else {
            // v2.747: Auto-Injection of Status Text if missing (Fixes "Display Missing" bug)
            console.log('[AI-Chat] Status Text element missing. Injecting...');
            const span = document.createElement('span');
            span.className = 'ampere-status-text text-[10px] uppercase text-slate-500 tracking-widest font-mono transition-colors duration-300';
            span.innerText = message;

            // Apply initial state
            if (state === 'connecting') {
                span.classList.add('text-yellow-400', 'animate-pulse');
                span.style.color = '#facc15';
            } else if (state === 'connected') {
                span.classList.add('text-blue-400');
                span.style.color = '#60a5fa';
            }

            this.statusTarget.appendChild(span);
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

        // v3.172: Transition status to "Standby" after brief disconnect flash
        // Gives user a clear "session ended" signal before settling into hibernation state.
        setTimeout(() => {
            if (!this.isConnected && !this.isConnecting) {
                this.updateStatusUI('disconnected', 'Standby');
            }
        }, 2000);

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

        if (this.messages) this.messages.innerHTML += `<p class="text-red-400 text-xs mt-1">Error: ${err.message || 'Connection failed'}</p>`;
    }


    handleModeChange(modeData) {
        const isSpeaking = modeData.mode === 'speaking';

        // v2.762: Reset Thinking State Override
        // If the mode changes (either to Speaking OR Listening), we exit the "Thinking" state.
        if (window.demoScene && typeof window.demoScene.setProcessingState === 'function') {
            window.demoScene.setProcessingState(false);
        }

        // v2.593: Fixed null reference to statusText. Using updateStatusUI or direct modification if needed.
        // Actually, let's just update the Pill Text if connected.
        if (this.isConnected) {
            const statusMsg = isSpeaking ? "Agent Speaking" : "Listening...";
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
// Sync v2.894
// Sync v2.895
