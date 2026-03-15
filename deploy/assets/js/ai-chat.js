// v3.534: Voice Pipe Client — replaces ElevenLabs ConvAI SDK with our VoiceSessionDO WebSocket pipe.
// Transport: WebSocket (PCM 16kHz → Scribe STT → T1/T2/T3 LLM → EL TTS → MP3 binary back)
// Voiceprint, greeting, identity seeding, systemLink all preserved.
console.log('[AmpereAI] v3.560 Voice Pipe Client Loaded');

// ─── Console log pipe (unchanged) ───────────────────────────────────────────
(function () {
    const PIPE_URL = 'https://memory-api.tight-butterfly-7b71.workers.dev/debug/console';
    const FLUSH_MS = 2000;
    const MAX_BUFFER = 20;
    const CAPTURE_PREFIXES = ['[AmpereChat]', '[AmpereVoice]', '[SystemLink]', '[Ampere Global]', '[AUTO-VOICEPRINT]', '[VoiceBuffer]', '[Tech Demo]', '[TechDemo]', '[AmpereAI]', '[AI-Chat]'];
    let _buffer = [];
    let _flushing = false;

    function shouldCapture(level, args) {
        if (level !== 'log') return true;
        const first = args[0];
        if (typeof first !== 'string') return false;
        if (first.includes('/debug/console')) return false;
        return CAPTURE_PREFIXES.some(p => first.includes(p));
    }

    function pipeEntry(level, args) {
        const msg = args.map(a => {
            if (typeof a === 'string') return a;
            try { return JSON.stringify(a); } catch { return String(a); }
        }).join(' ');
        _buffer.push({ level, message: msg, timestamp: new Date().toISOString().slice(11, 23) });
        if (_buffer.length >= MAX_BUFFER && !_flushing) flush();
    }

    function flush() {
        if (!_buffer.length || _flushing) return;
        _flushing = true;
        const batch = _buffer.splice(0, MAX_BUFFER);
        fetch(PIPE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: batch }),
            keepalive: true
        }).catch(() => { }).finally(() => { _flushing = false; });
    }

    ['log', 'warn', 'error'].forEach(level => {
        const orig = console[level].bind(console);
        console[level] = function (...args) {
            orig(...args);
            if (shouldCapture(level, args)) pipeEntry(level, args);
        };
    });

    setInterval(flush, FLUSH_MS);
    window.addEventListener('beforeunload', flush);
})();

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE     = 'https://memory-api.tight-butterfly-7b71.workers.dev';
const WS_BASE      = 'wss://memory-api.tight-butterfly-7b71.workers.dev';
const WORKSPACE_ID = 'ampere-emily';

// PCM streaming: 20ms frames at 16kHz = 320 samples = 640 bytes
const PCM_FRAME_SAMPLES  = 320;
const PCM_SAMPLE_RATE    = 16000;

export class AmpereAIChat {
    constructor(containerId, _agentId, options = {}) {
        // agentId param kept for API compat but no longer used (no EL SDK)
        this.container  = document.getElementById(containerId);
        this.options    = options;
        this.isConnecting  = false;
        this.isConnected   = false;
        this.visitorId     = null;
        this.convId        = null;

        // WebSocket to VoiceSessionDO
        this.ws = null;

        // Audio I/O
        this.micStream      = null;   // MediaStream from getUserMedia
        this.micCtx         = null;   // AudioContext for mic capture
        this.micWorklet     = null;   // AudioWorkletNode (streaming)
        this.playCtx        = null;   // AudioContext for TTS playback
        this.playQueue      = [];     // MP3 chunk queue
        this.isPlaying      = false;
        this.mp3Buffer      = [];     // accumulate MP3 binary chunks

        // Pending greeting — set when /greeting/web fetch resolves, consumed in _handleSessionInit
        this.pendingGreeting = null;

        // Voiceprint ring buffer (unchanged from v3.529)
        this.voiceBuffer    = null;

        // UI refs
        this.startBtn   = options.startBtnId   ? document.getElementById(options.startBtnId)   : null;
        this.endBtn     = options.endBtnId     ? document.getElementById(options.endBtnId)     : null;
        this.textChatBtn = options.textChatBtnId ? document.getElementById(options.textChatBtnId) : null;
        this.statusTarget = options.statusTargetId ? document.getElementById(options.statusTargetId) : null;
        this.statusText   = null;
        this.visualizer   = null;
        this.uvInterval   = null;

        this.messages = null;
        this.chatInput = null;
        this.chatSendBtn = null;
        this.closeBtn  = null;

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
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="w-full rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-4 flex flex-col gap-4 relative overflow-hidden group">
                <div class="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                <div class="flex items-center justify-between z-10 border-b border-white/5 pb-2">
                    <span class="text-xs font-mono uppercase text-slate-500 tracking-widest">Transcript</span>
                    <div class="flex items-center gap-2">
                        <div id="ai-visualizer" class="flex items-center gap-1 h-4 opacity-50">
                            <div class="w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                            <div class="w-1 h-3 bg-white/80 rounded-full animate-pulse delay-75"></div>
                            <div class="w-1 h-2 bg-white/80 rounded-full animate-pulse delay-150"></div>
                            <div class="w-1 h-3 bg-white/80 rounded-full animate-pulse delay-100"></div>
                            <div class="w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                        </div>
                        <button id="ai-close-btn" class="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white" title="Hide Chat Panel">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div id="ai-messages" class="w-full h-64 overflow-y-auto space-y-2 pr-2 text-sm text-slate-300 font-light scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <p class="italic text-slate-500 text-xs">Ready to chat.</p>
                </div>
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

        this.visualizer  = this.container.querySelector('#ai-visualizer');
        this.messages    = this.container.querySelector('#ai-messages');
        this.chatInput   = this.container.querySelector('#ai-chat-input');
        this.chatSendBtn = this.container.querySelector('#ai-chat-send');
        this.closeBtn    = this.container.querySelector('#ai-close-btn');
    }

    bindEvents() {
        if (this.startBtn)   this.startBtn.addEventListener('click',   () => this.startSession());
        if (this.endBtn)     this.endBtn.addEventListener('click',     () => this.endSession());
        if (this.closeBtn)   this.closeBtn.addEventListener('click',   () => this.container?.classList.add('hidden'));
        if (this.textChatBtn) {
            this.textChatBtn.addEventListener('click', () => {
                this.container?.classList.toggle('hidden');
                if (!this.container?.classList.contains('hidden') && this.chatInput) this.chatInput.focus();
            });
        }
        if (this.chatInput && this.chatSendBtn) {
            const send = () => {
                const text = this.chatInput.value.trim();
                if (!text) return;
                this.addMessage(text, 'user');
                this.chatInput.value = '';
                // Text injection via WebSocket end_session is unsupported in voice-only pipe;
                // for now, logged as not available.
                console.warn('[AmpereAI] Text send not available in voice pipe mode — voice session required.');
                this.addMessage('⚠️ Text input requires an active voice session.', 'system');
            };
            this.chatSendBtn.addEventListener('click', send);
            this.chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') send(); });
        }
    }

    // ─── Session lifecycle ────────────────────────────────────────────────────

    async startSession() {
        if (this.isConnecting || this.isConnected) return;
        if (this.options.onStart) this.options.onStart();
        this.setConnectingState();

        try {
            // 1. Mic access
            this.micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl:  true,
                    sampleRate:       PCM_SAMPLE_RATE,
                    channelCount:     1,
                }
            });

            // 2. Visitor ID
            let visitorId = localStorage.getItem('ampere_visitor_id');
            if (!visitorId) {
                const cookieMatch = document.cookie.split('; ').find(r => r.startsWith('ampere_visitor_id='));
                if (cookieMatch) {
                    visitorId = cookieMatch.split('=')[1];
                    localStorage.setItem('ampere_visitor_id', visitorId);
                }
            }
            if (!visitorId) {
                visitorId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : 'v-' + Math.random().toString(36).slice(2, 15);
                localStorage.setItem('ampere_visitor_id', visitorId);
            }
            this.visitorId = visitorId;
            const convId = crypto.randomUUID();
            this.convId  = convId;

            // 3. Time greeting
            const hour = new Date().getHours();
            const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

            // 4. Fetch personalized greeting in parallel with animation delay
            const fallbackGreeting = `${timeGreeting}, this is Emily with Ampere AI. How can I help you today?`;
            let personalizedGreeting = fallbackGreeting;
            let situationalBriefing  = '';
            let visitorStatus        = 'new';
            let userName             = '';
            let knownPhone           = '';
            let knownEmail           = '';
            let hasVoiceprint        = 'no';

            const greetingFetch = fetch(`${API_BASE}/greeting/web`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'x-workspace-id': WORKSPACE_ID },
                body:    JSON.stringify({ visitor_id: visitorId, time_greeting: timeGreeting }),
            }).then(async res => {
                if (!res.ok) return;
                const data = await res.json();
                if (data.dynamic_greeting)   { personalizedGreeting = data.dynamic_greeting; }
                if (data.situational_briefing) { situationalBriefing = data.situational_briefing; }
                if (data.visitor_status)     { visitorStatus = data.visitor_status; }
                if (data.name)               { userName = data.name; }
                if (data.known_phone)        { knownPhone = data.known_phone; }
                if (data.known_email)        { knownEmail = data.known_email; }
                if (data.has_voiceprint !== undefined) {
                    hasVoiceprint = (data.has_voiceprint === true || data.has_voiceprint === 'yes') ? 'yes' : 'no';
                }
                // Store on instance so _handleSessionInit can trigger TTS playback
                this.pendingGreeting = personalizedGreeting;
                console.log(`%c[AmpereAI] 🎯 GREETING: "${personalizedGreeting}" (${visitorStatus})`, 'color:#10b981;font-weight:bold;');
            }).catch(err => console.log(`%c[AmpereAI] ⚠️ Greeting fetch failed`, 'color:#f59e0b;', err));

            // 5. Init voiceprint ring buffer (unchanged)
            try {
                const vpCtx = new AudioContext({ sampleRate: PCM_SAMPLE_RATE });
                await vpCtx.audioWorklet.addModule('/assets/js/audio-worklet-processor.js');
                const vpWorklet = new AudioWorkletNode(vpCtx, 'voice-print-processor');
                const vpSrc = vpCtx.createMediaStreamSource(this.micStream);
                vpSrc.connect(vpWorklet);
                this.voiceBuffer = {
                    node: vpWorklet,
                    context: vpCtx,
                    getSnapshot: (durationMs = 3000) => new Promise(resolve => {
                        const timeout = setTimeout(() => {
                            vpWorklet.port.removeEventListener('message', handler);
                            resolve({ status: 'timeout' });
                        }, 5000);
                        const handler = e => {
                            clearTimeout(timeout);
                            vpWorklet.port.removeEventListener('message', handler);
                            resolve(e.data);
                        };
                        vpWorklet.port.addEventListener('message', handler);
                        vpWorklet.port.start();
                        vpWorklet.port.postMessage({ type: 'snapshot', durationMs });
                    }),
                };
                console.log('%c[AmpereAI] 🎙️ VOICE BUFFER: initialized (16kHz ring buffer)', 'color:#06b6d4;font-weight:bold;');
            } catch (vpErr) {
                console.warn('[AmpereAI] Voice buffer init failed (non-blocking):', vpErr);
                this.voiceBuffer = null;
            }

            // 6. Wait for greeting + animation ramp
            await Promise.all([
                new Promise(r => setTimeout(r, 1800)),
                greetingFetch,
            ]);

            // 7. Open VoiceSessionDO WebSocket
            const wsUrl = `${WS_BASE}/voice/session?workspace_id=${WORKSPACE_ID}&visitor_id=${encodeURIComponent(visitorId)}&conv_id=${encodeURIComponent(convId)}`;
            console.log(`%c[AmpereAI] 🔌 CONNECTING: ${wsUrl}`, 'color:#a855f7;font-weight:bold;');
            this.ws = new WebSocket(wsUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen    = () => this._onWsOpen(convId, visitorId, personalizedGreeting, situationalBriefing, userName, hasVoiceprint, timeGreeting);
            this.ws.onmessage = e  => this._onWsMessage(e);
            this.ws.onclose   = e  => this._onWsClose(e);
            this.ws.onerror   = e  => this._onWsError(e);

            // 8. Schedule voiceprint captures (unchanged timing)
            const _vpAction = hasVoiceprint === 'yes' ? 'verify' : 'enroll';
            const VP_DELAYS = [25000, 15000, 15000];
            let cumulativeDelay = 0;
            VP_DELAYS.forEach((delay, i) => {
                cumulativeDelay += delay;
                setTimeout(() => this._runVoiceCapture(i, VP_DELAYS.length, _vpAction, userName), cumulativeDelay);
            });

        } catch (error) {
            console.warn('[AmpereAI] Mic access failed or connection error', error);
            this.isConnecting = false;

            if (error.name === 'NotAllowedError' || error.name === 'NotFoundError' || error.name === 'NotReadableError') {
                this.updateStatusUI('error', 'No Mic Detected');
                this.container?.classList.remove('hidden');
                const promptId = 'ai-mic-prompt-' + Date.now();
                this.addMessage(`
                    <div class="flex flex-col gap-3">
                        <span class="font-bold text-red-400">Microphone not detected.</span>
                        <div class="flex gap-2 text-xs">
                             <a class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded cursor-pointer transition-colors" onclick="location.reload()">Retry Mic</a>
                        </div>
                    </div>
                `, 'system');
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

    async endSession() {
        if (this.options.onEnd) this.options.onEnd();

        // Send end_session to DO
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try { this.ws.send(JSON.stringify({ type: 'end_session' })); } catch { /* ok */ }
            setTimeout(() => { try { this.ws?.close(1000, 'user_ended'); } catch { /* ok */ } }, 200);
        }
        this.ws = null;

        // Stop mic
        this._stopMic();

        // Stop playback
        this._stopPlayback();

        // Cleanup voiceprint buffer
        if (this.voiceBuffer) {
            try {
                this.voiceBuffer.node.disconnect();
                await this.voiceBuffer.context.close();
            } catch { /* ok */ }
            this.voiceBuffer = null;
        }

        this.isConnected  = false;
        this.isConnecting = false;
    }

    // ─── WebSocket handlers ───────────────────────────────────────────────────

    _onWsOpen(convId, visitorId, greeting, briefing, userName, hasVoiceprint, timeGreeting) {
        console.log(`%c[AmpereAI] ✅ WS OPEN conv=${convId}`, 'color:#10b981;font-weight:bold;');
        // session_init frame will arrive from DO — we wait for it before fully connecting
    }

    _onWsMessage(event) {
        if (event.data instanceof ArrayBuffer) {
            // Binary: MP3 audio chunk from TTS
            this._queueAudio(event.data);
            return;
        }

        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        switch (msg.type) {
            case 'session_init':
                this._handleSessionInit(msg);
                break;
            case 'transcript':
                this._handleTranscript(msg);
                break;
            case 'mode':
                this._handleMode(msg);
                break;
            case 'ended':
                // Sentinel-triggered end: DO closed the session after farewell
                console.log(`%c[AmpereAI] 📴 SESSION ENDED: reason=${msg.reason}`, 'color:#f59e0b;font-weight:bold;');
                this.addMessage('Session ended. Thank you!', 'system');
                this.endSession();
                break;
            case 'error':
                if (msg.code === 'scribe_text') {
                    // Diagnostic: raw Scribe message text — log as info not error
                    console.info(`%c[AmpereAI] SCRIBE_RAW: ${msg.message}`, 'color:#a78bfa;');
                    return;
                }
                console.error(`[AmpereAI] DO error: ${msg.code} — ${msg.message}`);
                this.addMessage(`⚠️ ${msg.message || msg.code}`, 'system');
                break;
            default:
                break;
        }

    }

    _onWsClose(event) {
        console.log(`[AmpereAI] WS CLOSED code=${event.code} reason="${event.reason}"`);
        this.handleDisconnect();
    }

    _onWsError(event) {
        console.error('[AmpereAI] WS ERROR', event);
        this.handleError(new Error('WebSocket connection failed'));
    }

    // ─── Frame handlers ───────────────────────────────────────────────────────

    _handleSessionInit(msg) {
        console.log(`%c[AmpereAI] SESSION_INIT conv=${msg.conv_id}`, 'color:#a855f7;font-weight:bold;');
        this.isConnecting = false;
        this.isConnected  = true;

        // Seed session identity (same pattern as before)
        if (msg.conv_id && this.visitorId) {
            fetch(`${API_BASE}/session/seed`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'x-workspace-id': WORKSPACE_ID },
                body:    JSON.stringify({ conv_id: msg.conv_id, visitor_id: this.visitorId }),
            }).then(r => console.log(`%c[AmpereAI] 🔗 SESSION SEED → ${r.status}`, 'color:#a855f7;font-weight:bold;'))
              .catch(e => console.warn('[AmpereAI] Session seed failed:', e));
        }

        // Sync 3D scene
        if (window.demoScene?.setVoiceConnected) window.demoScene.setVoiceConnected(true);
        if (window.systemLink)                    window.systemLink.clearAllStreams();

        this.updateStatusUI('connected', 'Secure Connection');
        if (this.startBtn) this.startBtn.classList.add('hidden');
        if (this.endBtn)   this.endBtn.classList.remove('hidden');

        if (this.messages) {
            this.messages.innerHTML = '';
            this.addMessage('Connection established. Say hello!', 'system');
        }

        // Start streaming mic audio to DO
        this._startMicStreaming();

        // Push greeting to TTS: send to DO which pipes it directly to ElevenLabs TTS.
        // This is the initial "Emily speaks first" turn — bypasses Scribe/LLM entirely.
        if (this.ws && this.pendingGreeting) {
            const greetingText = this.pendingGreeting;
            this.pendingGreeting = null;
            console.log(`%c[AmpereAI] 📤 SPEAK_GREETING: "${greetingText.slice(0, 60)}..."`, 'color:#10b981;font-weight:bold;');
            try { this.ws.send(JSON.stringify({ type: 'speak', text: greetingText })); } catch { /* ok */ }
        }
    }

    _handleTranscript(msg) {
        // Partial user speech — just update status
        if (!msg.final && msg.source === 'user') {
            this.updateStatusUI('connected', 'Listening...');
            return;
        }

        // Final user speech — show in transcript
        if (msg.final && msg.source === 'user') {
            this.addMessage(msg.text, 'user');
            if (window.demoScene?.setProcessingState) window.demoScene.setProcessingState(true);
            this.updateStatusUI('connected', 'Computing...');
            // Pause voiceprint capture during agent thinking/speaking
            if (this.voiceBuffer?.node?.port) this.voiceBuffer.node.port.postMessage({ type: 'pause' });
        }

        // Agent response (full, after LLM completes)
        if (msg.final && msg.source === 'agent') {
            this.addMessage(msg.text, 'agent');
            // Trigger systemLink memory visualization
            if (window.systemLink) window.systemLink.log('AGENT: ' + msg.text.slice(0, 60), 'agent');
        }
    }

    _handleMode(msg) {
        const mode = msg.mode; // 'listening' | 'thinking' | 'speaking'

        if (window.demoScene?.setProcessingState) {
            window.demoScene.setProcessingState(mode === 'thinking');
        }

        if (this.isConnected) {
            if (mode === 'speaking') {
                this.updateStatusUI('connected', 'Agent Speaking');
                this.updateVisualizer(true);
                if (this.voiceBuffer?.node?.port) this.voiceBuffer.node.port.postMessage({ type: 'pause' });
            } else if (mode === 'listening') {
                this.updateStatusUI('connected', 'Listening...');
                this.updateVisualizer(false);
                if (this.voiceBuffer?.node?.port) this.voiceBuffer.node.port.postMessage({ type: 'resume' });
            } else if (mode === 'thinking') {
                this.updateStatusUI('connected', 'Computing...');
                this.updateVisualizer(false);
            }
        }
    }

    // ─── Mic streaming ────────────────────────────────────────────────────────

    async _startMicStreaming() {
        if (!this.micStream || !this.ws) return;

        try {
            this.micCtx = new AudioContext({ sampleRate: PCM_SAMPLE_RATE });
            // Log actual sampleRate — Chrome may not honor our 16kHz request on all systems
            console.log(`%c[AmpereAI] 🎤 AudioContext actual sampleRate: ${this.micCtx.sampleRate}Hz (requested ${PCM_SAMPLE_RATE}Hz)`, 'color:#f59e0b;font-weight:bold;');

            // Use ScriptProcessor for simple PCM chunk streaming
            // (AudioWorklet streaming mode would require a new processor — ScriptProcessor is fine for 16kHz)
            const source      = this.micCtx.createMediaStreamSource(this.micStream);
            const bufferSize  = 4096; // ~256ms at 16kHz — Scribe expects small frequent chunks
            const processor   = this.micCtx.createScriptProcessor(bufferSize, 1, 1);

            let audioChunksSent = 0;
            processor.onaudioprocess = (e) => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
                const float32 = e.inputBuffer.getChannelData(0);

                // Convert Float32 → Int16 PCM
                const int16 = new Int16Array(float32.length);
                for (let i = 0; i < float32.length; i++) {
                    const s = Math.max(-1, Math.min(1, float32[i]));
                    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                this.ws.send(int16.buffer);
                audioChunksSent++;

                // Every 8 chunks (~2s): log RMS energy. Silence=~0.000, ambient>0.005, speech>0.020
                if (audioChunksSent === 1 || audioChunksSent % 8 === 0) {
                    let sumSq = 0;
                    for (let i = 0; i < float32.length; i++) sumSq += float32[i] * float32[i];
                    const rms = Math.sqrt(sumSq / float32.length);
                    const label = rms < 0.001 ? '🔇 SILENCE' : rms < 0.010 ? '🔈 ambient' : '🔊 SPEECH';
                    console.log(`[AmpereAI] 🎤 MIC chunk=${audioChunksSent} RMS=${rms.toFixed(4)} ${label}`);
                }
            };

            source.connect(processor);
            processor.connect(this.micCtx.destination); // must connect to destination for onaudioprocess to fire

            this.micWorklet = processor; // store ref for cleanup
            console.log('%c[AmpereAI] 🎤 MIC STREAMING: started (16kHz PCM → VoiceSessionDO)', 'color:#06b6d4;font-weight:bold;');
        } catch (err) {
            console.error('[AmpereAI] Mic streaming failed:', err);
        }
    }

    _stopMic() {
        if (this.micWorklet) {
            try { this.micWorklet.disconnect(); } catch { /* ok */ }
            this.micWorklet = null;
        }
        if (this.micCtx) {
            try { this.micCtx.close(); } catch { /* ok */ }
            this.micCtx = null;
        }
        if (this.micStream) {
            this.micStream.getTracks().forEach(t => t.stop());
            this.micStream = null;
        }
    }

    // ─── Audio playback (MP3 chunks from TTS) ────────────────────────────────

    _queueAudio(arrayBuffer) {
        this.mp3Buffer.push(arrayBuffer);
        if (!this.isPlaying) this._drainAudioQueue();
    }

    async _drainAudioQueue() {
        if (this.isPlaying || this.mp3Buffer.length === 0) return;
        this.isPlaying = true;

        // Coalesce all queued chunks into one ArrayBuffer
        const total  = this.mp3Buffer.reduce((s, b) => s + b.byteLength, 0);
        const merged = new Uint8Array(total);
        let   offset = 0;
        for (const chunk of this.mp3Buffer) {
            merged.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        }
        this.mp3Buffer = [];

        try {
            if (!this.playCtx || this.playCtx.state === 'closed') {
                this.playCtx = new AudioContext();
            }
            const audioBuffer = await this.playCtx.decodeAudioData(merged.buffer);
            const source = this.playCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.playCtx.destination);
            source.onended = () => {
                this.isPlaying = false;
                // Play any chunks that arrived while we were playing
                if (this.mp3Buffer.length > 0) this._drainAudioQueue();
            };
            source.start();
        } catch (err) {
            console.warn('[AmpereAI] Audio decode failed (non-fatal):', err);
            this.isPlaying = false;
            if (this.mp3Buffer.length > 0) this._drainAudioQueue();
        }
    }

    _stopPlayback() {
        this.mp3Buffer = [];
        this.isPlaying = false;
        if (this.playCtx) {
            try { this.playCtx.close(); } catch { /* ok */ }
            this.playCtx = null;
        }
    }

    // ─── Voiceprint capture (unchanged from v3.529) ───────────────────────────

    async _runVoiceCapture(captureIndex, totalCaptures, action, userName) {
        try {
            if (!this.isConnected) {
                console.log('%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: session ended, skipping', 'color:#6b7280;');
                return;
            }
            if (!this.voiceBuffer) {
                console.log('%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: no buffer, skipping', 'color:#6b7280;');
                return;
            }
            console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Capture ${captureIndex + 1}/${totalCaptures} (${action})`, 'color:#8b5cf6;font-weight:bold;');
            const snapshot = await this.voiceBuffer.getSnapshot(15000);
            if (snapshot.status !== 'ok') {
                console.warn(`[AmpereAI] AUTO-VOICEPRINT: snapshot failed: ${snapshot.status}`);
                return;
            }
            const wavBase64 = this._pcmToWavBase64(snapshot.samples, snapshot.sampleRate);
            const res = await fetch(`${API_BASE}/voice/capture`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'x-workspace-id': WORKSPACE_ID },
                body:    JSON.stringify({
                    user_id:        this.visitorId,
                    audio:          wavBase64,
                    sampleRate:     snapshot.sampleRate,
                    action,
                    capture_index:  captureIndex,
                    total_captures: totalCaptures,
                    display_name:   userName || '',
                }),
            });
            const result = await res.json();
            console.log(`%c[AmpereAI] 🎙️ AUTO-VOICEPRINT: Capture ${captureIndex + 1} → ${res.status}`, 'color:#8b5cf6;', result);

            const isFinal = captureIndex >= totalCaptures - 1;
            if (isFinal && this.convId) {
                let vaStatus = null, vaScore = 0;
                if (action === 'enroll' && result.status === 'enrolled') { vaStatus = 'enrolled'; vaScore = 1.0; }
                else if (action === 'verify') { vaStatus = result.verified ? 'verified' : 'failed'; vaScore = result.confidence ?? result.score ?? 0; }
                if (vaStatus) {
                    fetch(`${API_BASE}/session/voice-auth`, {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json', 'x-workspace-id': WORKSPACE_ID },
                        body:    JSON.stringify({ conv_id: this.convId, status: vaStatus, score: vaScore, user_id: this.visitorId }),
                    }).then(r => console.log(`%c[AmpereAI] 🔐 VOICE_AUTH_STORED: status=${vaStatus} → ${r.status}`, 'color:#a855f7;font-weight:bold;'))
                      .catch(e => console.warn('[AmpereAI] voice-auth store failed:', e));
                }
            }

            if (result.final !== false && action === 'verify' && result.verified) {
                const confidence = result.confidence?.toFixed(2) || 'N/A';
                if (window.systemLink) {
                    window.systemLink.log('VOICE_VERIFIED: ' + (this.visitorId?.slice(0, 8) || 'user'), 'secure');
                    window.systemLink.triggerOtpRx();
                }
                // Verified — could inject context via WS if server supports it in future
            }
        } catch (err) {
            console.warn('[AmpereAI] AUTO-VOICEPRINT: capture error (non-fatal):', err?.message || err);
        }
    }

    _pcmToWavBase64(samples, sampleRate) {
        const numChannels = 1, bitsPerSample = 16;
        const bytesPerSample = bitsPerSample / 8;
        const dataLength = samples.length * bytesPerSample;
        const buffer = new ArrayBuffer(44 + dataLength);
        const view   = new DataView(buffer);
        const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
        ws(0, 'RIFF'); view.setUint32(4, 36 + dataLength, true);
        ws(8, 'WAVE'); ws(12, 'fmt '); view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
        view.setUint16(32, numChannels * bytesPerSample, true); view.setUint16(34, bitsPerSample, true);
        ws(36, 'data'); view.setUint32(40, dataLength, true);
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        const bytes = new Uint8Array(buffer);
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }

    // ─── Disconnect handlers ──────────────────────────────────────────────────

    handleDisconnect() {
        this.isConnected  = false;
        this.isConnecting = false;
        this._stopMic();
        this._stopPlayback();
        this.ws = null;

        if (window.demoScene?.setVoiceConnected) window.demoScene.setVoiceConnected(false);
        this.updateStatusUI('disconnected', 'Disconnected');
        setTimeout(() => {
            if (!this.isConnected && !this.isConnecting) this.updateStatusUI('disconnected', 'Standby');
        }, 2000);

        if (this.startBtn) {
            this.startBtn.classList.remove('hidden');
            this.startBtn.disabled = false;
            this.startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        if (this.endBtn) this.endBtn.classList.add('hidden');
        if (this.uvInterval) { clearInterval(this.uvInterval); this.uvInterval = null; }
        this.updateVisualizer(false);
    }

    handleError(err) {
        this.isConnecting = false;
        this.isConnected  = false;
        this._stopMic();
        this._stopPlayback();
        this.ws = null;

        if (window.demoScene?.setVoiceConnected) window.demoScene.setVoiceConnected(false);
        this.updateStatusUI('error', 'Error');
        if (this.startBtn) { this.startBtn.classList.remove('hidden'); this.startBtn.disabled = false; }
        if (this.endBtn)   this.endBtn.classList.add('hidden');
        if (this.messages) this.messages.innerHTML += `<p class="text-red-400 text-xs mt-1">Error: ${err.message || 'Connection failed'}</p>`;
    }

    // ─── UI helpers (unchanged from v3.529) ──────────────────────────────────

    addMessage(text, sender) {
        if (!this.messages) return;
        const div = document.createElement('div');
        const isUser   = sender === 'user';
        const isSystem = sender === 'system';
        if (isSystem) {
            div.className = 'flex w-full justify-center my-2';
            div.innerHTML = `<div class="text-[10px] uppercase tracking-widest text-slate-500 text-center">${text}</div>`;
        } else {
            div.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'}`;
            div.innerHTML = `
                <div class="${isUser ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30' : 'bg-slate-800/80 text-slate-200 border border-white/10'} px-3 py-2 rounded-2xl ${isUser ? 'rounded-br-none' : 'rounded-bl-none'} max-w-[85%] text-sm leading-relaxed shadow-sm">
                    ${text}
                </div>`;
        }
        this.messages.appendChild(div);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    setConnectingState() {
        this.isConnecting = true;
        this.updateStatusUI('connecting', 'Connecting...');
        if (this.startBtn) {
            this.startBtn.disabled = true;
            this.startBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    updateStatusUI(state, message) {
        if (!this.statusTarget) return;
        console.log(`[AI-Chat] updateStatusUI: ${state} — ${message}`);

        const sceneText = this.statusTarget.querySelector('.ampere-status-text');
        if (sceneText) {
            sceneText.innerText = message;
            sceneText.classList.remove('text-yellow-400', 'text-blue-400', 'text-red-500', 'text-slate-500', 'animate-pulse');
            sceneText.style.color = '';
            if (state === 'connecting') { sceneText.classList.add('text-yellow-400', 'animate-pulse'); sceneText.style.color = '#facc15'; }
            else if (state === 'connected') { sceneText.classList.add('text-blue-400'); sceneText.style.color = '#60a5fa'; }
            else if (state === 'error') { sceneText.classList.add('text-red-500'); sceneText.style.color = '#ef4444'; }
        } else {
            const span = document.createElement('span');
            span.className = 'ampere-status-text text-[10px] uppercase text-slate-500 tracking-widest font-mono transition-colors duration-300';
            span.innerText = message;
            if (state === 'connecting') { span.classList.add('text-yellow-400', 'animate-pulse'); span.style.color = '#facc15'; }
            else if (state === 'connected') { span.classList.add('text-blue-400'); span.style.color = '#60a5fa'; }
            this.statusTarget.appendChild(span);
        }

        if (state === 'connecting' || state === 'connected') {
            const explicitContainer = document.getElementById('voice-visualizer-container');
            const desiredTarget = explicitContainer || this.statusTarget;
            let needsInjection = !this.visualizer || !this.visualizer.isConnected;
            if (this.visualizer && this.visualizer.parentNode !== desiredTarget) {
                if (this.visualizer.parentNode) this.visualizer.parentNode.removeChild(this.visualizer);
                this.visualizer = null;
                needsInjection = true;
            }
            if (needsInjection) {
                const viz = this.createVisualizer('bg-blue-400');
                desiredTarget.appendChild(viz);
                this.visualizer = viz;
            }
        } else if (state === 'disconnected') {
            if (this.visualizer) { this.visualizer.remove(); this.visualizer = null; }
        }
    }

    updateVisualizer(isActive) {
        if (!this.visualizer) return;
        if (window.demoScene?.setVoiceState) window.demoScene.setVoiceState(isActive);

        const bars = this.visualizer.querySelectorAll('.uv-bar');
        if (isActive) {
            this.visualizer.classList.remove('opacity-60');
            this.visualizer.classList.add('opacity-100', 'shadow-[0_0_30px_rgba(34,211,238,0.3)]', 'border-cyan-400/30');
            if (!this.uvInterval) {
                bars.forEach(b => b.classList.remove('animate-pulse'));
                this.uvInterval = setInterval(() => {
                    let avgLevel = 0;
                    bars.forEach((bar, i) => {
                        const distFromCenter = Math.abs(2 - i);
                        const centerBias = 1.0 - distFromCenter * 0.15;
                        const flux = Math.random();
                        const h = Math.max(20, Math.floor(flux * centerBias * 100));
                        bar.style.height = `${h}%`;
                        if (i === 2) avgLevel += flux; else avgLevel += flux * 0.5;
                    });
                    if (window.demoScene?.setVoiceLevel) window.demoScene.setVoiceLevel(Math.min(avgLevel / 1.8, 1.0));
                }, 40);
            }
        } else {
            this.visualizer.classList.remove('opacity-100', 'shadow-[0_0_30px_rgba(34,211,238,0.3)]', 'border-cyan-400/30');
            this.visualizer.classList.add('opacity-80');
            if (this.uvInterval) { clearInterval(this.uvInterval); this.uvInterval = null; }
            if (window.demoScene?.setVoiceLevel) window.demoScene.setVoiceLevel(0.0);
            bars.forEach((bar, i) => {
                bar.style.height = `${[30, 45, 60, 45, 30][i]}%`;
                bar.classList.add('animate-pulse');
            });
        }
    }

    createVisualizer(colorClass = 'bg-blue-400') {
        const viz = document.createElement('div');
        viz.className = 'flex items-center justify-center gap-[4px] h-12 ml-0 opacity-100 transition-all duration-500 pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 shadow-2xl';
        viz.id = 'ampere-voice-uv';
        [30, 45, 60, 45, 30].forEach((h, i) => {
            const bar = document.createElement('div');
            bar.className = 'uv-bar w-[8px] rounded-[1px] bg-gradient-to-t from-blue-500 to-cyan-300 transition-all duration-100 ease-out animate-pulse';
            bar.style.height = `${h}%`;
            bar.style.animationDelay = `${i * 150}ms`;
            viz.appendChild(bar);
        });
        return viz;
    }
}
