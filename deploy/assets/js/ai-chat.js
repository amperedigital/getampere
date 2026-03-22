// v3.606: Fix AEC race condition — await _initPlayCtxAsync before sending greeting so ref-capture worklet
// Transport: WebSocket (PCM 16kHz → Scribe STT → T1/T2/T3 LLM → EL TTS → PCM 22050Hz binary back)
// Voiceprint, greeting, identity seeding, systemLink all preserved.
// v3.605: Phase 2+3 AEC — NLMS adaptive filter + playback-side ref-capture worklet.
//   Eliminated fixed delayCompSamples/attenuation; filter self-calibrates to hardware.
//   Moved SAB writes from main thread (_queueAudio) to audio-ref-capture-processor.js
//   so the reference signal is captured at TRUE playback time, not schedule time.
// v3.606: Fix ordering bug — _initPlayCtxAsync now completes BEFORE the greeting speak
//   frame is sent to the server. Eliminates the race where PCM arrived before the worklet
//   module loaded, causing the fallback bare-ctx to win and blocking ref-capture forever.
// v3.608: Remove brittle word-count barge-in gate (server). Replace with client-side mic mute
//   during TTS playback: PCM is not sent to Scribe while isPlaying=true, + 250ms reverb holdoff.
//   Scribe never sees Emily's voice → no false partial transcripts → no false barge-ins.
//   Also removed BARGE_IN_MIN_WORDS constant from voice-session-do.ts (was always circumvented).
// v3.609: Fix barge-in during TTS mute window. RMS threshold to detect user speech.
// v3.610: Remove TTS mute gate entirely. Trust the AEC — it suppresses Emily's bleed to ~0.0002
//   RMS (confirmed from session logs). Scribe sees only real user speech, including quiet utterances.
//   Volume-based gates were wrong: a soft "wait" is a valid barge-in. Let Scribe decide what is
//   speech. Server's existing partial_transcript → barge_in pipeline handles the interrupt.
//   Kept: 250ms post-TTS holdoff only (room reverb tail suppression, not active-TTS blocking).
console.log('[AmpereAI] v3.665 Voice Pipe Client Loaded (browser AEC3 + RTCPeerConnection loopback restored)');

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
const TTS_PCM_SAMPLE_RATE = 22050; // EL TTS pcm_22050 output → scheduled into AudioContext

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
        this.playCtx        = null;   // AudioContext for PCM TTS playback (22050 Hz)
        this.masterGain     = null;   // GainNode — volume master; faded to 0 on barge-in
        this.playQueue      = [];     // legacy — unused
        this.isPlaying      = false;
        this.mp3Buffer      = [];     // legacy name — now holds raw PCM Int16 chunks
        this.pcmNextAt      = 0;      // AudioContext timestamp: when next PCM chunk should start
        this.pcmCarry       = null;   // leftover byte from odd-length PCM chunk (byte-alignment carry)

        // Phase 2 AEC: SharedArrayBuffer ring buffer for TTS reference signal.
        // Layout: [write_ptr (Int32, 4 bytes) | Float32 samples (16000 * 4 bytes = 1s at 16kHz)]
        // Written by audio-ref-capture-processor.js (running in playCtx) at DAC render time;
        // read by AEC worklet. SAB + context preserved across barge-ins for NLMS continuity.
        this.referenceBuffer  = null;   // unused — kept for legacy guards only (v3.620: NLMS removed)
        this.refWritePtr      = null;   // Int32Array view of first 4 bytes (write pointer)
        this.refSamples       = null;   // Float32Array view of remaining bytes (ring data)

        // v3.607: barge-in now fades masterGain to 0 (keeps ctx alive) rather than closing ctx.
        // _queueAudio restores gain when new PCM arrives. Flag prevents stale ctx reuse.
        this.bargeInFaded     = false;  // true while masterGain is at 0 post-barge-in
        // v3.608: timestamp of when the last TTS source actually ended (used for mic holdoff)
        this.lastTtsEndClient = 0;
        // Pending greeting — set when /greeting/web fetch resolves, consumed in _handleSessionInit
        this.pendingGreeting = null;

        // v3.620: RTCPeerConnection loopback for AEC3 reference (restored in v3.633)
        this.loopbackPc1      = null;   // RTCPeerConnection sender side
        this.loopbackPc2      = null;   // RTCPeerConnection receiver side
        this.loopbackAudioEl  = null;   // HTMLAudioElement driven by pc2 (user hears + AEC3 reference)

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
                    // v3.620: Browser AEC3 enabled with RTCPeerConnection loopback for proper reference.
                    // TTS audio flows: AudioContext → MediaStreamDestination → pc1 → pc2 → HTMLAudioElement.
                    // AEC3 uses the WebRTC receiver track as its reference — sample-synchronized.
                    // NLMS worklet removed entirely (replaced by AEC3 + simple passthrough).
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl:  false,  // keep off — natural level variation for Scribe
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

            // 4. Build fallback greeting (agent-generated personalization happens server-side)
            // /greeting/web is retired (v3.585) — pendingGreeting always set to fallback here.
            // VoiceSessionDO.speakDirectToTts() plays it on SESSION_INIT.
            const fallbackGreeting = `${timeGreeting}! How can I help you today?`;
            this.pendingGreeting = fallbackGreeting;

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

            // 6. Wait for animation ramp before opening WS
            await new Promise(r => setTimeout(r, 1800));

            // 7. Open VoiceSessionDO WebSocket
            const wsUrl = `${WS_BASE}/voice/session?workspace_id=${WORKSPACE_ID}&visitor_id=${encodeURIComponent(visitorId)}&conv_id=${encodeURIComponent(convId)}`;
            console.log(`%c[AmpereAI] 🔌 CONNECTING: ${wsUrl}`, 'color:#a855f7;font-weight:bold;');
            this.ws = new WebSocket(wsUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen    = () => this._onWsOpen(convId);
            this.ws.onmessage = e  => this._onWsMessage(e);
            this.ws.onclose   = e  => this._onWsClose(e);
            this.ws.onerror   = e  => this._onWsError(e);

            // 8. Schedule voiceprint captures (enroll — greeting/web no longer provides voiceprint status)
            const VP_DELAYS = [25000, 15000, 15000];
            let cumulativeDelay = 0;
            VP_DELAYS.forEach((delay, i) => {
                cumulativeDelay += delay;
                setTimeout(() => this._runVoiceCapture(i, VP_DELAYS.length, 'enroll', ''), cumulativeDelay);
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

        // Capture WS ref before nulling — the timeout below fires 200ms later,
        // by which time this.ws is already null (classic null-before-close bug).
        const ws = this.ws;
        this.ws = null;
        if (ws && ws.readyState === WebSocket.OPEN) {
            try { ws.send(JSON.stringify({ type: 'end_session' })); } catch { /* ok */ }
            setTimeout(() => { try { ws.close(1000, 'user_ended'); } catch { /* ok */ } }, 200);
        }

        // Stop mic + playback
        this._stopMic();
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

        // Reset UI directly — don't rely on WS onclose firing (it may not if we
        // null the socket before the close event propagates).
        this.handleDisconnect();
    }

    // ─── WebSocket handlers ───────────────────────────────────────────────────

    _onWsOpen(convId) {
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
            case 'barge_in':
                // Server detected barge-in — flush scheduled audio immediately.
                // Audio frames already sent to the speaker can't be recalled,
                // but we can stop scheduling future frames and snap pcmNextAt
                // back to now so the next response starts cleanly.
                this._flushAudioBuffer();
                console.log('%c[AmpereAI] 🛑 BARGE_IN: audio buffer flushed', 'color:#f97316;font-weight:bold;');
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

        // v3.620: SAB / NLMS AEC removed. Browser AEC3 with RTCPeerConnection loopback
        // handles echo cancellation. referenceBuffer stays null.

        // Start streaming mic audio to DO
        this._startMicStreaming();

        // v3.606: Init playCtx WITH ref-capture worklet BEFORE sending the greeting frame.
        //
        // WHY ORDER MATTERS: the server takes ~800ms from receiving the speak frame to
        // delivering the first PCM chunk (TTS warmup). We must have AudioContext + ref-capture
        // worklet fully wired within that window so the SAB starts receiving writes before
        // any TTS audio arrives at _queueAudio.
        //
        // v3.605 BUG: greeting was sent FIRST, then _initPlayCtxAsync was fired fire-and-forget.
        // If the worklet module fetch took >800ms (uncached network), _queueAudio's synchronous
        // fallback created a bare ctx (masterGain → destination, NO ref-capture). Then when
        // _initPlayCtxAsync finally resolved, its guard "if (this.playCtx && state !== 'closed')
        // return" bailed out — the fallback ctx was already there. SAB never got any writes.
        // NLMS filter ran on zeros → zero echo cancellation → Emily heard herself → barge-in loop.
        //
        // FIX: use .finally() so greeting sends only after playCtx is ready (or gracefully failed).
        this._initPlayCtxAsync()
            .catch(err => console.warn('[AmpereAI] AEC: playCtx init failed (will fallback):', err))
            .finally(() => {
                if (this.ws && this.pendingGreeting) {
                    const greetingText = this.pendingGreeting;
                    this.pendingGreeting = null;
                    console.log(`%c[AmpereAI] 📤 SPEAK_GREETING (playCtx ready): "${greetingText.slice(0, 60)}..."`, 'color:#10b981;font-weight:bold;');
                    try { this.ws.send(JSON.stringify({ type: 'speak', text: greetingText })); } catch { /* ok */ }
                }
            });
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
            console.log(`%c[AmpereAI] 🎤 AudioContext actual sampleRate: ${this.micCtx.sampleRate}Hz (requested ${PCM_SAMPLE_RATE}Hz)`, 'color:#f59e0b;font-weight:bold;');

            // v3.620: Always use passthrough worklet. Browser AEC3 (enabled in getUserMedia)
            // handles echo cancellation with the RTCPeerConnection loopback as its reference.
            // NLMS and SAB branches removed.
            await this.micCtx.audioWorklet.addModule('/assets/js/audio-mic-processor.js');
            const micWorklet = new AudioWorkletNode(this.micCtx, 'mic-stream-processor');
            console.log('%c[AmpereAI] 🎤 AEC: passthrough mic (browser AEC3 + RTCPeerConnection loopback)', 'color:#06b6d4;font-weight:bold;');

            const source = this.micCtx.createMediaStreamSource(this.micStream);
            source.connect(micWorklet);
            // AudioWorkletNode does not need to connect to destination — postMessage is the output.

            let audioChunksSent = 0;
            micWorklet.port.onmessage = (e) => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

                // v3.610: No TTS mute gate. AEC suppresses Emily's bleed — Scribe only sees
                // user speech. Any RMS-threshold gate would block quiet barge-ins ("wait",
                // "okay", soft interruptions) — exactly the problem the user reported.
                // Trust Scribe as the speech detector. Server partial_transcript → barge_in
                // pipeline handles interruptions for all volumes.
                //
                // Exception: 250ms POST-TTS holdoff for room reverb tail (speaker bleed after
                // Emily stops). This is brief enough to not block immediate follow-on responses.
                const float32 = e.data;
                const MIC_HOLDOFF_MS = 250;
                const inHoldoff = !this.isPlaying
                    && this.lastTtsEndClient > 0
                    && (Date.now() - this.lastTtsEndClient < MIC_HOLDOFF_MS);
                if (inHoldoff) return;

                // Convert Float32 → Int16 PCM (16-bit signed, clamped)
                const int16 = new Int16Array(float32.length);
                for (let i = 0; i < float32.length; i++) {
                    const s = Math.max(-1, Math.min(1, float32[i]));
                    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                this.ws.send(int16.buffer);
                audioChunksSent++;

                // Every 64 worklet blocks (~512ms): log RMS energy
                if (audioChunksSent === 1 || audioChunksSent % 64 === 0) {
                    const sent64 = Math.ceil(audioChunksSent / 64);
                    let sumSq = 0;
                    for (let i = 0; i < float32.length; i++) sumSq += float32[i] * float32[i];
                    const rms = Math.sqrt(sumSq / float32.length);
                    const label = rms < 0.001 ? '🔇 SILENCE' : rms < 0.010 ? '🔈 ambient' : '🔊 SPEECH';
                    console.log(`[AmpereAI] 🎤 MIC chunk=${sent64} RMS=${rms.toFixed(4)} ${label}`);
                }
            };

            this.micWorklet = micWorklet; // store ref for cleanup
            console.log('%c[AmpereAI] 🎤 MIC STREAMING: started (AudioWorklet 16kHz PCM → VoiceSessionDO)', 'color:#06b6d4;font-weight:bold;');
        } catch (err) {
            console.error('[AmpereAI] Mic streaming failed:', err);
        }
    }

    _stopMic() {
        if (this.micWorklet) {
            try {
                // Signal the AudioWorklet to stop processing before disconnecting
                this.micWorklet.port.postMessage({ type: 'stop' });
                this.micWorklet.disconnect();
            } catch { /* ok */ }
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

    // ─── Audio playback (PCM 22050Hz chunks from TTS) ─────────────────────────
    // EL TTS streams raw 16-bit signed PCM at 22050Hz. Each WebSocket binary
    // message is a chunk of that stream. We schedule each chunk into a
    // AudioContext using the audio clock so playback is perfectly gapless
    // with no decodeAudioData() and no partial-frame decode errors.

    _queueAudio(arrayBuffer) {
        // v3.605: SAB reference writes REMOVED from main thread.
        // audio-ref-capture-processor.js (running in playCtx) captures actual playback samples
        // at DAC render time and writes them to the SAB. This eliminates the scheduling-
        // lookahead timing error (main thread was writing samples seconds before they played).

        // Ensure playback AudioContext is ready.
        // _initPlayCtxAsync() is fired on session_init and on every barge-in.
        // If it hasn't resolved yet (edge case: PCM arrived before LLM finished), fall back
        // to a synchronous no-worklet context and continue — no audio is lost.
        if (!this.playCtx || this.playCtx.state === 'closed') {
            // Synchronous fallback — ref-capture worklet NOT attached.
            // Should only happen in error scenarios; _initPlayCtxAsync normally wins the race.
            console.warn('[AmpereAI] _queueAudio: playCtx not ready — creating synchronous fallback (no AEC reference this chunk)');
            this.playCtx    = new AudioContext({ sampleRate: TTS_PCM_SAMPLE_RATE });
            this.masterGain = this.playCtx.createGain();
            this.masterGain.connect(this.playCtx.destination);
            this.pcmNextAt  = 0;
            this.bargeInFaded = false;
        }
        if (this.playCtx.state === 'suspended') {
            this.playCtx.resume().catch(() => {});
        }
        if (this.bargeInFaded && this.masterGain) {
            this.bargeInFaded = false;
            this.pcmNextAt = 0;
            this.masterGain.gain.cancelScheduledValues(this.playCtx.currentTime);
            this.masterGain.gain.setValueAtTime(0, this.playCtx.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(1, this.playCtx.currentTime + 0.05);
            // Resume loopback audio element if it was paused by the barge-in flush.
            if (this.loopbackAudioEl && this.loopbackAudioEl.paused) {
                this.loopbackAudioEl.play().catch(() => {});
            }
            console.log('%c[AmpereAI] 🔊 GAIN_RESTORE: new response starting, fading gain back to 1', 'color:#10b981;');
        }

        // pcm_22050 = 16-bit signed LE samples = 2 bytes each.
        // EL's HTTP stream chunks can be split at any byte boundary by the network.
        // CARRY BUFFER FIX: save the orphan byte and prepend to the next chunk.
        let incoming = arrayBuffer;
        if (this.pcmCarry && this.pcmCarry.byteLength > 0) {
            const merged = new Uint8Array(this.pcmCarry.byteLength + incoming.byteLength);
            merged.set(new Uint8Array(this.pcmCarry), 0);
            merged.set(new Uint8Array(incoming), this.pcmCarry.byteLength);
            incoming = merged.buffer;
            this.pcmCarry = null;
        }
        const evenBytes = incoming.byteLength & ~1;
        if (evenBytes === 0) { this.pcmCarry = incoming; return; }
        if (evenBytes < incoming.byteLength) {
            this.pcmCarry = incoming.slice(evenBytes);
        }

        // Decode Int16 PCM → Float32
        const int16   = new Int16Array(incoming, 0, evenBytes / 2);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        // Schedule chunk into Web Audio API
        const audioBuffer = this.playCtx.createBuffer(1, float32.length, TTS_PCM_SAMPLE_RATE);
        audioBuffer.copyToChannel(float32, 0);
        const startAt = Math.max(this.pcmNextAt, this.playCtx.currentTime + 0.01);
        const source  = this.playCtx.createBufferSource();
        source.buffer = audioBuffer;
        // masterGain routes through ref-capture-processor → speaker (SAB written there).
        source.connect(this.masterGain || this.playCtx.destination);
        source.start(startAt);
        this.pcmNextAt = startAt + audioBuffer.duration;

        this.isPlaying = true;
        // v3.613: Notify AEC worklet that TTS is now active — raises gate threshold to 0.030
        // to block Emily's post-NLMS residual. Signal on every new TTS start, including after
        // barge-in recovery. The old !bargeInFaded guard meant the worklet's gate stayed at
        // 0.003 (user-turn threshold) while Emily's new response played post-barge-in, letting
        // her echo straight through to Scribe.
        if (this.micWorklet) {
            this.micWorklet.port.postMessage({ type: 'tts_state', active: true });
        }
        source.onended = () => {
            // v3.618: Guard increased 0.05 → 0.40s.
            // The 50ms window fired false tts_state:false between streaming TTS chunks:
            // if the server was slow delivering the next chunk, pcmNextAt could be <50ms
            // ahead while more audio was still incoming. Gate collapsed to 0.003 mid-speech
            // → Emily's residual (0.0144 RMS) passed the gate → Scribe false barge-in.
            // 400ms gives enough buffer for inter-chunk gaps without delaying mic open after
            // Emily's last word (last chunk ends, 400ms passes, gate drops — acceptable).
            if (this.playCtx && this.pcmNextAt <= this.playCtx.currentTime + 0.40) {
                this.isPlaying = false;
                // v3.608: record when audio physically ended so mic holdoff can expire correctly
                this.lastTtsEndClient = Date.now();
                // v3.612: TTS finished naturally — drop gate to 0.003 so quiet user speech passes
                if (this.micWorklet) {
                    this.micWorklet.port.postMessage({ type: 'tts_state', active: false });
                }
            }
        };
    }

    async _drainAudioQueue() {
        // No-op: PCM playback is now fully scheduled in _queueAudio.
        // Kept for API compatibility.
    }

    _stopPlayback() {
        this.mp3Buffer  = [];
        this.isPlaying  = false;
        this.pcmNextAt  = 0;
        this.pcmCarry   = null; // discard orphan byte on stop (session reset)
        if (this.playCtx) {
            try { this.playCtx.close(); } catch { /* ok */ }
            this.playCtx = null;
        }
    }

    // Barge-in flush: fade Emily's voice out naturally.
    // v3.607: DOES NOT close the AudioContext. Keeping the ctx alive preserves:
    //   (1) ref-capture worklet — continues writing (silence) to SAB during LLM think time
    //   (2) NLMS filter's reference continuity — no SAB gap, no read-ptr reset
    //   (3) Accumulated filter weights — NLMS stays converged for next response
    // Instead: fade masterGain to 0 (silences all scheduled BufferSources naturally),
    // set bargeInFaded=true. When new PCM arrives in _queueAudio, gain ramps back to 1.
    _flushAudioBuffer() {
        const BARGE_IN_FADE_MS = 200;
        this.isPlaying = false;
        this.pcmCarry  = null;
        if (this.playCtx && this.playCtx.state !== 'closed' && this.masterGain) {
            const gain = this.masterGain;
            const ctx  = this.playCtx;
            gain.gain.cancelScheduledValues(ctx.currentTime);
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + BARGE_IN_FADE_MS / 1000);
            this.bargeInFaded = true;
            this.pcmNextAt = 0;
            if (this.micWorklet) {
                this.micWorklet.port.postMessage({ type: 'tts_state', active: false });
            }
            // Pause loopback audio element — clears the WebRTC receiver buffer
            // so user doesn't hear residual TTS audio after barge-in.
            if (this.loopbackAudioEl && !this.loopbackAudioEl.paused) {
                this.loopbackAudioEl.pause();
            }
            console.log('%c[AmpereAI] BARGE_IN_FADE: masterGain → 0 + loopback paused', 'color:#f97316;');
        } else {
            // No active ctx at all — will be created fresh when LLM responds
            this.pcmNextAt = 0;
        }
    }

    // ── _initPlayCtxAsync ─────────────────────────────────────────────────────
    // v3.633: Restored RTCPeerConnection loopback (was removed in v3.622 to fix stutter,
    // but its removal broke AEC — Emily bled back through the mic as Kannada hallucinations).
    // Audio path: sources → masterGain → MediaStreamDestination → pc1 → pc2 → HTMLAudioElement.
    // User hears TTS via the HTMLAudioElement. Browser AEC3 uses the WebRTC receiver
    // track as its reference — perfectly synchronized, no OS loopback timing uncertainty.
    async _initPlayCtxAsync() {
        if (this.playCtx && this.playCtx.state !== 'closed') return;

        const ctx  = new AudioContext({ sampleRate: TTS_PCM_SAMPLE_RATE });
        const gain = ctx.createGain();
        this.pcmNextAt = 0;

        // Route masterGain → loopback destination (NOT ctx.destination).
        // Audio reaches the speaker via the RTCPeerConnection receiver HTMLAudioElement.
        const loopbackDest = ctx.createMediaStreamDestination();
        gain.connect(loopbackDest);

        if (ctx.state === 'suspended') {
            await ctx.resume().catch(() => {});
        }

        this.playCtx        = ctx;
        this.masterGain     = gain;
        this.refCaptureNode = null;

        // Set up RTCPeerConnection loopback AFTER committing ctx/gain refs
        // so any fallback inside _setupRtcLoopback can use this.playCtx.destination.
        await this._setupRtcLoopback(loopbackDest.stream);

        console.log(`%c[AmpereAI] 🔊 PLAY_CTX_READY sampleRate=${ctx.sampleRate}Hz loopback=true`, 'color:#10b981;font-weight:bold;');
    }

    // ── _setupRtcLoopback ─────────────────────────────────────────────────────
    // Creates a local RTCPeerConnection pair (no STUN/TURN — same-page loopback).
    // pc1 sends the TTS MediaStream. pc2's ontrack drives an HTMLAudioElement so the
    // user hears TTS AND browser AEC3 has a properly synchronized WebRTC reference.
    async _setupRtcLoopback(mediaStream) {
        try {
            const pc1 = new RTCPeerConnection();
            const pc2 = new RTCPeerConnection();

            pc1.onicecandidate = ({ candidate }) => {
                if (candidate) pc2.addIceCandidate(candidate).catch(() => {});
            };
            pc2.onicecandidate = ({ candidate }) => {
                if (candidate) pc1.addIceCandidate(candidate).catch(() => {});
            };

            const track = mediaStream.getAudioTracks()[0];
            if (!track) throw new Error('No audio track in loopback MediaStream');
            pc1.addTrack(track, mediaStream);

            // pc2 receiver → HTMLAudioElement
            // Being a WebRTC receiver, AEC3 uses its playout as the reference signal
            // for the getUserMedia mic stream — sample-synchronized echo cancellation.
            pc2.ontrack = ({ streams }) => {
                const audio = new Audio();
                audio.srcObject = streams[0];
                audio.autoplay  = true;
                audio.style.display = 'none';
                document.body.appendChild(audio);
                this.loopbackAudioEl = audio;
                console.log('%c[AmpereAI] 🔊 LOOPBACK: pc2 → HTMLAudioElement (AEC3 reference ready)', 'color:#10b981;font-weight:bold;');
            };

            const offer = await pc1.createOffer();
            await pc1.setLocalDescription(offer);
            await pc2.setRemoteDescription(pc1.localDescription);
            const answer = await pc2.createAnswer();
            await pc2.setLocalDescription(answer);
            await pc1.setRemoteDescription(pc2.localDescription);

            this.loopbackPc1 = pc1;
            this.loopbackPc2 = pc2;
            console.log('%c[AmpereAI] 🔊 LOOPBACK: RTCPeerConnection established (no server)', 'color:#10b981;font-weight:bold;');

        } catch (loopErr) {
            console.warn('[AmpereAI] LOOPBACK: RTCPeerConnection failed, falling back to direct-to-destination:', loopErr);
            // Graceful fallback: route directly to speakers (AEC3 still runs, just OS-level reference)
            if (this.masterGain && this.playCtx) {
                this.masterGain.connect(this.playCtx.destination);
            }
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
