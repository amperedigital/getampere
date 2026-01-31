export class SystemLink {
    constructor() {
        this.elements = {
            extractLed: document.getElementById('mem-extract-led'),
            insertLed: document.getElementById('mem-insert-led'),
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
        const workspaceString = urlParams.get('workspace') || "default";

        // Always auto-connect unless specifically disabled
        // For now, let's Boot then Connect
        this.runBootSequence().then(() => {
             if (apiHost) {
                 this.connectLoop(apiHost, workspaceString);
             } else {
                 this.setMode('SLEEP');
             }
        });
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
        let url = apiHost;
        if (url.startsWith('http')) {
            url = url.replace(/^http/, 'ws');
        }
        if (!url.startsWith('ws')) {
            url = 'wss://' + url;
        }
        if (!url.includes('/memory/visualizer')) {
                url = url.replace(/\/$/, '') + "/memory/visualizer";
        }
        
        // Append workspace
        if (workspace) {
            url += `?workspace=${encodeURIComponent(workspace)}`;
        }

        this.connectToWorker(url);
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

    connectToWorker(url) {
        if (this.socket) {
            this.socket.close();
        }
        
        console.log("MemoryViz: Connecting to " + url);
        try {
            this.socket = new WebSocket(url);
            
            this.socket.onopen = () => {
                this.log("SOCKET CONNECTED", "system");
                this.stopAttractMode(); 
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Console Logging for Observability
                    console.log("[SystemLink] Received WS Data:", data);

                    // Handle broadcast messages
                    if (data.type === 'connected') {
                         this.log("LINK ESTABLISHED", "system");
                         return;
                    }
                    
                    const payload = data; 
                    
                    // Future: Add handlers for 'handoff', 'calendar', etc.
                    // For now, these are just illustrative of the universal link.
                    
                    if (payload.type === 'memory_added' || payload.type === 'insert_batch') {
                         
                        // TRIGGER HALO ROTATION -> MEMORY
                        if (window.demoScene) window.demoScene.selectFunction("memory");
                        else if (window.techDemoScene) window.techDemoScene.selectFunction("memory");

                        const items = payload.items || [];
                        if (items.length > 0) {
                            items.forEach((item, i) => {
                                setTimeout(() => this.triggerInsert(item), i * 200);
                            });
                        } else {
                            this.triggerInsert("DATA_PACKET");
                        }
                    } else if (payload.type === 'memory_retrieved') {
                         
                         // TRIGGER HALO ROTATION -> MEMORY
                         if (window.demoScene) window.demoScene.selectFunction("memory");
                         else if (window.techDemoScene) window.techDemoScene.selectFunction("memory");

                         const items = payload.items || [];
                         if (items.length > 0) {
                             items.forEach((item, i) => {
                                 setTimeout(() => this.triggerExtract(item), i * 200);
                             });
                         } else {
                             this.triggerExtract("QUERY_RESULT");
                         }
                    } 
                } catch (e) {
                    console.error("Viz msg error", e);
                }
            };
            
            this.socket.onclose = (e) => {
                this.log("SOCKET LOST " + (e.reason || ""), "dim");
                // Fallback to attract mode after delay
                setTimeout(() => {
                    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
                        this.startAttractMode();
                        // Retry connection periodically
                        // this.init(); // Careful with recursion
                    }
                }, 3000);
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
        
        // Base transitions for fade out
        element.style.transition = 'background-color 200ms ease-out, box-shadow 200ms ease-out';

        if (isOn) {
            element.classList.remove('bg-slate-800');
            // Ensure Tailwind classes exist or use style. This assumes standard palette.
            // Using specific classes referenced in HTML construction to match style
             if (colorName === 'emerald') {
                element.classList.add('bg-emerald-400', 'shadow-[0_0_8px_rgba(52,211,153,0.8)]');
             } else {
                element.classList.add('bg-amber-400', 'shadow-[0_0_8px_rgba(251,191,36,0.8)]');
             }
        } else {
            // Reset
            element.classList.remove('bg-emerald-400', 'shadow-[0_0_8px_rgba(52,211,153,0.8)]', 'bg-amber-400', 'shadow-[0_0_8px_rgba(251,191,36,0.8)]');
            element.classList.add('bg-slate-800');
        }
    }

    tick() {
        if (!this.isRunning) return;

        if (this.currentMode === 'IDLE' || this.currentMode === 'SLEEP') {
            const lowPulse = 2 + Math.sin(Date.now() / 800) * 2; // Breathing 0-4%
            this.elements.activityBar.style.width = `${lowPulse}%`;
            this.elements.activityBar.className = "h-full bg-slate-700 shadow-none transition-all duration-300 ease-out";
            
            // Occasional keepalive ping
            if (Math.random() > 0.992) this.log("STANDBY...", "dim");
            return;
        }

        // Update Bar Randomly based on mode
        // Jittery movement for tech feel
        const activity = 20 + Math.random() * 80; 
        this.elements.activityBar.style.width = `${activity}%`;
        
        // Color the bar based on mode
        if (this.currentMode === 'INSERT') {
             this.elements.activityBar.className = "h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-100 ease-out";
             
             // In attract mode, generate random logs. 
             // In manual mode, logs are generated by the trigger function, so skip here.
             if (this.attractModeActive && Math.random() > 0.6) this.generateInsertLog();
             
        } else {
             this.elements.activityBar.className = "h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-100 ease-out";
             
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
        const task = tasks[Math.floor(Math.random()*tasks.length)];
        this.logCompact(`[${addr}] ${task} OK`);
    }

    generateHexAddr() {
        return "0x" + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }

    generateHexContent(chunks=3) {
        let s = "";
        for(let i=0; i<chunks; i++) {
            s += Math.floor(Math.random()*255).toString(16).toUpperCase().padStart(2,'0') + " ";
        }
        return s.trim();
    }

    logCompact(text) {
        // Fast log sans typewriter for high-speed stuff, or maybe fast typewriter?
        // Let's use direct append for high speed to avoid queue jam
        this.log(text, 'data');
    }

    async typewriterLog(text, type='data', speed=10) {
        const span = document.createElement('div');
        
        if (type === 'system') {
            span.className = "text-slate-500 font-bold mb-1 mt-1 border-t border-white/5 pt-1";
        } else if (type === 'dim') {
            span.className = "text-slate-700 italic";
        } else {
            span.className = "text-blue-400/80 hover:text-blue-300";
        }

        span.textContent = "> ";
        this.elements.streamWindow.appendChild(span);
        this.scrollToBottom();

        for (let i = 0; i < text.length; i++) {
            span.textContent += text[i];
            if (i % 3 === 0) { // Update DOM every 3 chars to save layout thrashing
                this.scrollToBottom();
                await new Promise(r => setTimeout(r, speed));
            }
        }
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.elements.streamWindow.scrollTop = this.elements.streamWindow.scrollHeight;
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
        
        this.elements.streamWindow.appendChild(span);
        
        // Cleanup old lines
        while (this.elements.streamWindow.children.length > this.maxLines) {
            this.elements.streamWindow.removeChild(this.elements.streamWindow.firstChild);
        }
        
        this.scrollToBottom();
    }
}
