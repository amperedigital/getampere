export class SystemLink {
    constructor() {
        this.elements = {
            extractLed: document.getElementById('mem-extract-led'),
            insertLed: document.getElementById('mem-insert-led'),
            otpTxLed: document.getElementById('otp-tx-led'),
            otpRxLed: document.getElementById('otp-rx-led'),
            activityBar: document.getElementById('mem-activity-bar'),
            streamWindow: document.getElementById('mem-data-stream')
        };

        // Configuration
        this.maxLines = 20;
        this.currentMode = 'IDLE'; // IDLE, INSERT, EXTRACT
        this.isRunning = false;

        // Only start if elements exist
        if (this.elements.streamWindow) {
            this.init();
        }
    }

    init() {
        this.isRunning = true;
        // this.log("INITIALIZING SYSTEM LINK...", "system"); // Moved to Boot Sequence

        // Start the visual tick loop (handling graph animations)
        setInterval(() => this.tick(), 160);

        // Check for WebSocket param or default to Prod Worker
        const urlParams = new URLSearchParams(window.location.search);
        const apiHost = urlParams.get('mem_api') || "https://memory-api.tight-butterfly-7b71.workers.dev";
        const workspaceString = urlParams.get('workspace') || "emily";
        console.log("%c[SystemLink] 🌐 CONNECTION ATTEMPT: " + apiHost + " [Workspace: " + workspaceString + "]", "color: #3b82f6; font-weight: bold;");

        // Always auto-connect unless specifically disabled
        // Boot Sequence (Visual) - Fire and Forget (don't block connection)
        this.runBootSequence();

        // Connect immediately (Network)
        if (apiHost) {
            this.connectLoop(apiHost, workspaceString);
        } else {
            this.setMode('SLEEP');
        }
    }

    async runBootSequence() {
        await this.typewriterLog("SYS_INIT SEQUENCE...", "system");
        await this.delay(400);
        await this.typewriterLog("MEM_ALLOC 0x4000... OK", "system");
        await this.delay(300);
        await this.typewriterLog("H-LINK PROT... ESTABLISHED", "system");
        await this.delay(600);
        this.log("STANDBY_MONITOR_ACTIVE", "dim");
    }

    delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    connectLoop(apiHost, workspace = 'default') {
        try {
            let urlStr = apiHost;
            // Ensure protocol compatibility
            if (urlStr.startsWith('http')) urlStr = urlStr.replace(/^http/, 'ws');
            else if (!urlStr.startsWith('ws')) urlStr = 'wss://' + urlStr;

            // Ensure path exists
            if (!urlStr.includes('/memory/visualizer')) {
                if (urlStr.includes('?')) {
                    const parts = urlStr.split('?');
                    parts[0] = parts[0].replace(/\/$/, '') + "/memory/visualizer";
                    urlStr = parts.join('?');
                } else {
                    urlStr = urlStr.replace(/\/$/, '') + "/memory/visualizer";
                }
            }

            // Use URL object for clean param handling
            const url = new URL(urlStr);
            if (workspace) url.searchParams.set("workspace", workspace);

            this.connectToWorker(url.toString());
        } catch (e) {
            console.error("Connect Loop Error", e);
            // Fallback for simple strings or invalid URL objects
            this.connectToWorker(apiHost);
        }
    }

    startAttractMode() {
        this.attractModeActive = true;
        this.scheduleNextAction();
    }

    stopAttractMode() {
        this.attractModeActive = false;
        if (this.attractTimer) clearTimeout(this.attractTimer);
        // Do not force IDLE if we are actually doing work, but usually good to reset
        // this.setMode('IDLE');
    }

    scheduleNextAction() {
        if (!this.isRunning || !this.attractModeActive) return;
        const duration = 2000 + Math.random() * 4000;
        this.attractTimer = setTimeout(() => {
            if (!this.attractModeActive) return;
            this.switchRandomMode();
            this.scheduleNextAction();
        }, duration);
    }

    switchRandomMode() {
        // Toggle between Insert and Extract mostly, sometimes Idle
        const rand = Math.random();
        if (rand < 0.45) {
            this.setMode('INSERT');
        } else if (rand < 0.90) {
            this.setMode('EXTRACT');
        } else {
            this.setMode('SLEEP');
        }
    }

    // --- Public API for Socket Triggers ---

    triggerInsert(label = null) {
        if (this.idleTimer) clearTimeout(this.idleTimer);

        this.setMode('INSERT');

        // Custom Log
        // const addr = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        // const content = label || Math.random().toString(36).substring(7).toUpperCase();
        const content = label || this.generateHexContent(4);
        this.logCompact(`WRITE <${content}>`);

        // Return to IDLE after a short burst if in manual mode
        if (!this.attractModeActive) {
            this.idleTimer = setTimeout(() => this.setMode('SLEEP'), 1200);
        }
    }

    triggerExtract(label = null) {
        if (this.idleTimer) clearTimeout(this.idleTimer);

        this.setMode('EXTRACT');

        const content = label || "DATA_SEG";
        this.logCompact(`READ  <${content}>`);

        if (!this.attractModeActive) {
            this.idleTimer = setTimeout(() => this.setMode('SLEEP'), 1200);
        }
    }

    triggerOtpTx() {
        if (this.elements.otpTxLed) {
            // Flash Orange
            this.elements.otpTxLed.classList.remove('bg-slate-800', 'border-slate-600');
            this.elements.otpTxLed.classList.add('bg-orange-500', 'border-orange-400', 'shadow-[0_0_12px_rgba(249,115,22,0.8)]');

            setTimeout(() => {
                if (this.elements.otpTxLed) {
                    this.elements.otpTxLed.classList.add('bg-slate-800', 'border-slate-600');
                    this.elements.otpTxLed.classList.remove('bg-orange-500', 'border-orange-400', 'shadow-[0_0_12px_rgba(249,115,22,0.8)]');
                }
            }, 800);
        }
    }

    triggerOtpRx() {
        if (this.elements.otpRxLed) {
            // Flash Emerald/Green
            this.elements.otpRxLed.classList.remove('bg-slate-800', 'border-slate-600');
            this.elements.otpRxLed.classList.add('bg-emerald-400', 'border-emerald-300', 'shadow-[0_0_12px_rgba(52,211,153,0.8)]');

            setTimeout(() => {
                if (this.elements.otpRxLed) {
                    this.elements.otpRxLed.classList.add('bg-slate-800', 'border-slate-600');
                    this.elements.otpRxLed.classList.remove('bg-emerald-400', 'border-emerald-300', 'shadow-[0_0_12px_rgba(52,211,153,0.8)]');
                }
            }, 800);
        }
    }


    triggerRevertToDefault(delay = 5000, reason = "TIMEOUT") {
        if (this.revertTimer) clearTimeout(this.revertTimer);
        this.revertTimer = setTimeout(() => {
            if (window.techDemoScene) {
                this.log(`VISUALIZER: RETURN -> MEMORY (${reason})`, "dim");
                window.techDemoScene.selectFunction("memory");
            }
        }, delay);
    }

    connectToWorker(url) {
        if (this.socket) {
            this.socket.close();
        }

        console.log("MemoryViz: Connecting to " + url);
        try {
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                this.log("SOCKET CONNECTED", "system");

                // v2.813: Cleanup previous session data
                if (this.elements.streamWindow) {
                    this.elements.streamWindow.innerHTML = '';
                    this.log("SECURE_LINK [ESTABLISHED]", "success");
                    this.log("STANDBY_MONITOR_ACTIVE", "dim");
                }

                this.stopAttractMode();
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Console Logging for Observability
                    console.log("%c[SystemLink] 📥 WS MESSAGE RECEIVED:", "background: #1e293b; color: #34d399; font-weight: bold; padding: 2px 4px;", data);

                    // Handle broadcast messages
                    if (data.type === 'connected') {
                        this.log("LINK ESTABLISHED", "system");
                        return;
                    }

                    const payload = data;

                    // Future: Add handlers for 'handoff', 'calendar', etc.
                    // For now, these are just illustrative of the universal link.

                    if (payload.type === 'memory_added' || payload.type === 'insert_batch' || payload.type === 'upsert') {

                        // TRIGGER HALO ROTATION -> MEMORY
                        if (window.demoScene) window.demoScene.selectFunction("memory");
                        else if (window.techDemoScene) window.techDemoScene.selectFunction("memory");

                        const items = payload.items || [];
                        if (items.length > 0) {
                            items.forEach((item, i) => {
                                const activeText = typeof item === 'string' ? item : (item.fact || "DATA_PKT");
                                // Truncate for UI - widened to 32 chars for readability
                                const display = activeText.length > 32 ? activeText.substring(0, 32) + ".." : activeText;
                                setTimeout(() => this.triggerInsert(display), i * 200);
                            });
                        } else {
                            this.triggerInsert("DATA_PACKET");
                        }
                    } else if (payload.type === 'identity_confirmed') {
                        // v2.800: Visual feedback for identity lock
                        this.log("IDENTITY LOCKED", "secure");
                        console.log("%c[SystemLink] 🔒 IDENTITY CONFIRMED: " + JSON.stringify(payload), "color: #ff00ff; font-weight: bold;");
                        if (window.techDemoScene) {
                            window.techDemoScene.selectFunction("identity");
                            this.triggerRevertToDefault(6000, "IDENTITY_LOCK");
                        }

                        setTimeout(() => {
                            if (payload.email) this.triggerInsert("USR: " + payload.email);
                            else if (payload.phone) this.triggerInsert("PH: " + payload.phone);
                            else if (payload.visitor_id) this.triggerInsert("ID: VISITOR_COOKIE");
                        }, 500);
                    } else if (payload.type === 'auth_req' || payload.type === 'auth_request_otp') {
                        // OTP Challenge - Rotate Halo to OTP (Index 6)
                        console.log("%c[SystemLink] 🔐 AUTH REQUESTED: " + JSON.stringify(payload), "color: #ff00ff; font-weight: bold;");
                        this.log("⚠️ IDENTITY_CHALLENGE: OTP REQUIRED", "alert");
                        if (window.techDemoScene) {
                            window.techDemoScene.selectFunction("otp");
                            // v2.905: Increased from 8s to 60s as it was reverting before user noticed.
                            this.triggerRevertToDefault(60000, "OTP_CHALLENGE");
                        }
                        this.triggerOtpTx();
                        this.log(`AUTH_REQ [${payload.channel?.toUpperCase() || 'OTP'}]`, "system");

                    } else if (payload.type === 'auth_verify') {
                        console.log("%c[SystemLink] 🔓 AUTH VERIFIED", "color: #ff00ff; font-weight: bold;");
                        // Success
                        this.log("✅ IDENTITY: VERIFIED", "secure");
                        this.log(`SECURE_CHANNEL: ${payload.contact || "ESTABLISHED"}`, "secure");
                        if (window.techDemoScene) {
                            window.techDemoScene.selectFunction("identity");
                            this.triggerRevertToDefault(6000, "VERIFIED");
                        }
                        this.triggerOtpRx();

                    } else if (payload.type === 'auth_fail') {
                        console.log("%c[SystemLink] ❌ AUTH FAILED: " + JSON.stringify(payload), "color: #ff00ff; font-weight: bold;");
                        this.log("🚫 AUTH_FAIL: " + (payload.reason || "INVALID"), "error");
                        if (this.elements.extractLed) {
                            this.elements.extractLed.classList.add('bg-red-500', 'shadow-[0_0_10px_red]');
                            setTimeout(() => this.elements.extractLed.classList.remove('bg-red-500', 'shadow-[0_0_10px_red]'), 500);
                        }
                    } else if (payload.type === 'memory_retrieved' || payload.type === 'memory_query') {

                        console.log("%c[SystemLink] 💾 MEMORY RETRIEVED: " + JSON.stringify(payload), "color: #ff00ff; font-weight: bold;");
                        // TRIGGER HALO ROTATION -> MEMORY
                        if (window.demoScene) window.demoScene.selectFunction("memory");
                        else if (window.techDemoScene) window.techDemoScene.selectFunction("memory");

                        const items = payload.items || [];
                        if (items.length > 0) {
                            items.forEach((item, i) => {
                                const activeText = typeof item === 'string' ? item : (item.fact || "QUERY_RES");
                                const display = activeText.length > 32 ? activeText.substring(0, 32) + ".." : activeText;
                                setTimeout(() => this.triggerExtract(display), i * 200);
                            });
                        } else {
                            this.triggerExtract("QUERY_RESULT");
                        }
                    } else if (payload.type === 'handoff') {
                        console.log("%c[SystemLink] 📡 HANDOFF: " + JSON.stringify(payload), "color: #ff00ff; font-weight: bold;");
                        this.log("TRANSFER: " + (payload.reason || "AGENT_BRIDGE").toUpperCase(), "system");
                        // Trigger visual feedback (Green Pulse + Identity Mode)
                        if (window.techDemoScene) window.techDemoScene.selectFunction("identity");
                        this.triggerOtpRx();
                        setTimeout(() => this.triggerExtract("HANDOFF_PKT"), 200);
                    }
                } catch (e) {
                    console.error("Viz msg error", e);
                }
            };

            this.socket.onclose = (e) => {
                this.log("SOCKET LOST " + (e.reason || ""), "dim");
                // v2.825: CLEAR STREAM ON DISCONNECT
                // Wipe the data stream window so it's fresh for the next user/session
                setTimeout(() => {
                    if (this.elements.streamWindow) {
                        this.elements.streamWindow.innerHTML = '';
                        this.log("DATA STREAM CLEARED", "system");
                        this.log("READY FOR RESET", "dim");
                    }
                }, 1500); // Small delay to let user see "SOCKET LOST"

                /*
                setTimeout(() => {
                    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
                        this.startAttractMode();
                    }
                }, 3000);
                */
            };

            this.socket.onerror = (err) => {
                console.error("WS Error", err);
                this.log("WS_ERR: CONN_FAIL", "dim");
            };
        } catch (e) {
            console.log("Socket init error", e);
            this.log("INIT_ERR: " + e.message, "dim");
        }
    }


    setMode(mode) {
        // Debounce or just explicit set? Explicit set.
        this.currentMode = mode;

        // Reset LEDs (Turn off)
        this.setLedState(this.elements.insertLed, false, 'emerald');
        this.setLedState(this.elements.extractLed, false, 'amber');

        if (mode === 'INSERT') {
            this.setLedState(this.elements.insertLed, true, 'emerald');
        } else if (mode === 'EXTRACT') {
            this.setLedState(this.elements.extractLed, true, 'amber');
        }
    }

    setLedState(element, isOn, colorName) {
        if (!element) return;

        // Base transitions
        element.style.transition = 'background-color 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out';

        if (isOn) {
            if (colorName === 'emerald') {
                element.style.backgroundColor = '#34d399'; // emerald-400
                element.style.borderColor = '#6ee7b7';     // emerald-300
                element.style.boxShadow = '0 0 12px rgba(52,211,153,0.9)';
            } else {
                element.style.backgroundColor = '#fbbf24'; // amber-400
                element.style.borderColor = '#fcd34d';     // amber-300
                element.style.boxShadow = '0 0 12px rgba(251,191,36,0.9)';
            }
            // Ensure slate is overridden
            element.classList.remove('bg-slate-800', 'border-slate-600');
        } else {
            // Reset
            element.style.backgroundColor = ''; // Revert to class or default
            element.style.borderColor = '';
            element.style.boxShadow = '';
            element.classList.add('bg-slate-800', 'border-slate-600');
        }
    }

    tick() {
        if (!this.isRunning) return;

        if (this.currentMode === 'IDLE' || this.currentMode === 'SLEEP') {
            const lowPulse = 2 + Math.sin(Date.now() / 800) * 2; // Breathing 0-4%
            this.elements.activityBar.style.width = `${lowPulse}%`;
            // Reset colors
            this.elements.activityBar.style.backgroundColor = '';
            this.elements.activityBar.style.boxShadow = '';
            this.elements.activityBar.className = "h-full bg-slate-700 shadow-none transition-all duration-300 ease-out";

            // v2.811: Removed random STANDBY logs
            // if (Math.random() > 0.992) this.log("STANDBY...", "dim");
            return;
        }

        // Active Mode Jitter
        const activity = 20 + Math.random() * 80;
        this.elements.activityBar.style.width = `${activity}%`;

        // Force Colors via Style (Safety)
        if (this.currentMode === 'INSERT') {
            this.elements.activityBar.style.backgroundColor = '#10b981'; // emerald-500
            this.elements.activityBar.style.boxShadow = '0 0 15px rgba(16,185,129,0.8)';

            if (this.attractModeActive && Math.random() > 0.6) this.generateInsertLog();

        } else {
            this.elements.activityBar.style.backgroundColor = '#f59e0b'; // amber-500
            this.elements.activityBar.style.boxShadow = '0 0 15px rgba(245,158,11,0.8)';

            if (this.attractModeActive && Math.random() > 0.6) this.generateExtractLog();
        }
    }

    generateInsertLog() {
        const addr = this.generateHexAddr();
        const data = this.generateHexContent(3);
        this.logCompact(`[${addr}] WR <${data}>`);
    }

    generateExtractLog() {
        const addr = this.generateHexAddr();
        const tasks = ["READ", "SYNC"];
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        this.logCompact(`[${addr}] ${task} OK`);
    }

    generateHexAddr() {
        return "0x" + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }

    generateHexContent(chunks = 3) {
        let s = "";
        for (let i = 0; i < chunks; i++) {
            s += Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0') + " ";
        }
        return s.trim();
    }

    logCompact(text) {
        // Fast log sans typewriter for high-speed stuff, or maybe fast typewriter?
        // Let's use direct append for high speed to avoid queue jam
        this.log(text, 'data');
    }

    async typewriterLog(text, type = 'data', speed = 10) {
        const span = document.createElement('div');

        if (type === 'system') {
            span.className = "text-slate-500 font-bold mb-1 mt-1 border-t border-white/5 pt-1";
        } else if (type === 'dim') {
            span.className = "text-slate-700 italic";
        } else {
            span.className = "text-blue-400/80 hover:text-blue-300";
        }

        span.textContent = "> ";
        this.elements.streamWindow.prepend(span);
        this.scrollToTop();

        for (let i = 0; i < text.length; i++) {
            span.textContent += text[i];
            if (i % 3 === 0) { // Update DOM every 3 chars to save layout thrashing
                this.scrollToTop();
                await new Promise(r => setTimeout(r, speed));
            }
        }
        this.scrollToTop();
    }

    scrollToTop() {
        this.elements.streamWindow.scrollTop = 0;
    }

    log(text, type = 'data') {
        const span = document.createElement('div');
        span.textContent = `> ${text}`;

        if (type === 'system') {
            span.className = "text-slate-500 font-bold mb-1 mt-1 border-t border-white/5 pt-1";
        } else if (type === 'dim') {
            span.className = "text-slate-700 italic";
        } else {
            span.className = "text-blue-400/80 hover:text-blue-300";
        }

        this.elements.streamWindow.prepend(span);

        // Cleanup old (bottom) lines
        while (this.elements.streamWindow.children.length > this.maxLines) {
            this.elements.streamWindow.removeChild(this.elements.streamWindow.lastChild);
        }

        this.scrollToTop();
    }
}
