/* global AudioWorkletProcessor, registerProcessor, Atomics, SharedArrayBuffer */
/**
 * AEC AudioWorklet Processor — audio-aec-processor.js
 * v3.605 — Phase 2+3: NLMS Adaptive Acoustic Echo Cancellation
 *
 * REPLACES: fixed linear subtraction with hardcoded delayCompSamples (0.85 attenuation).
 *   Problem with the old approach: the acoustic delay from speaker → mic is hardware-specific
 *   (typically 10–60ms at 16kHz = 160–960 samples). With a fixed guess of 400 samples (~25ms),
 *   any hardware running outside that range produced over-subtraction artifacts (audible ticks).
 *   These ticks were picked up by Scribe as short phantom commits, triggering false barge-ins.
 *
 * NLMS (Normalized Least Mean Squares) ADAPTIVE FILTER:
 *   Maintains N=512 filter coefficients (taps) that learn the impulse response of the acoustic
 *   path from speaker to mic. After convergence (~2–3 seconds of audio), the filter precisely
 *   models the round-trip: scheduling delay, OS buffer, speaker driver, air travel, mic capture.
 *   No hardcoded delay. No hardcoded attenuation. Works on any hardware automatically.
 *
 *   Algorithm (per sample):
 *     y[n]  = w^T · x[n]          (estimated echo: dot product of weights × reference history)
 *     e[n]  = mic[n] - y[n]       (residual: cleaned mic signal)
 *     P[n]  = ε + ||x[n]||²        (reference signal power, normalized)
 *     w    += (μ / P[n]) · e[n] · x[n]   (NLMS weight update)
 *
 * PARAMETERS:
 *   N   = 512 taps   — covers 0–32ms at 16kHz. Power-of-2 enables bitmask indexing.
 *   μ   = 0.05        — step size. Conservative: stable across all input levels.
 *                       Converges in ~N/μ ≈ 10,000 samples ≈ 0.6 seconds.
 *   ε   = 1e-6        — regularization. Prevents division by zero in silence.
 *
 * REFERENCE SIGNAL SOURCE:
 *   The SAB is written by audio-ref-capture-processor.js (playback-side worklet) at exact
 *   DAC render time — NOT by the main thread at schedule time. This eliminates the timing
 *   error where PCM was written to SAB seconds before it played (scheduling lookahead).
 *
 * HOT PATH OPTIMIZATION:
 *   N is a power of 2 (512 = 2^9). Circular buffer indexing uses bitwise AND instead of
 *   modulo: (ptr & MASK) where MASK = N-1 = 511. V8 JIT optimizes this to a single ALU op.
 *
 * PASSTHROUGH FALLBACK:
 *   If SAB is unavailable (no COOP/COEP headers, old browser), mic audio passes through
 *   unchanged. No regression vs. pre-AEC behaviour.
 *
 * SAB LAYOUT:
 *   Bytes 0–3:  Int32 write pointer (atomic, advanced by ref-capture-processor)
 *   Bytes 4+:   Float32 ring buffer, 16000 samples (1 second at 16kHz)
 */

class AecMicProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.active = true;

        const opts = options?.processorOptions ?? {};
        const sab  = opts.referenceBuffer ?? null;

        if (sab && sab instanceof SharedArrayBuffer) {
            this.refWritePtr = new Int32Array(sab, 0, 1); // atomic write pointer (written by ref-capture)
            this.refData     = new Float32Array(sab, 4);  // reference ring buffer
            this.refLen      = this.refData.length;        // 16000 samples
            this.hasSab      = true;
        } else {
            this.hasSab = false;
        }

        // -- NLMS filter state -------------------------------------------------------
        // N MUST be a power of 2 for the bitmask optimization in the hot path.
        this.N    = 512;          // filter taps — covers 0–32ms at 16kHz
        this.MASK = this.N - 1;   // 511 (0x1FF) — bitmask for circular indexing
        this.mu   = 0.05;         // NLMS step size
        this.eps  = 1e-6;         // regularization constant

        // Filter coefficients: w[0] is most recent tap, w[N-1] is oldest
        this.w       = new Float32Array(this.N);

        // Local reference history ring buffer (maintained by worklet, not from SAB)
        // We copy reference samples here for fast sequential access in the NLMS loop.
        this.refBuf  = new Float32Array(this.N);
        this.histPtr = 0; // ring write head (circular, bitmask-indexed)

        // Scratch vector for reference snapshot (avoids double circular-index computation)
        // Reused across process() calls — no allocation in hot path.
        this.xvec = new Float32Array(this.N);

        // SAB read position — tracks where we're reading reference samples
        // -1 means not yet initialized (will be set on first process() call with data)
        this.refReadPtr = -1;

        // -- Noise gate state --------------------------------------------------------
        // v3.613: Dynamic threshold — two levels based on ttsActive flag:
        //   TTS active   (Emily speaking): 0.030 — blocks her post-NLMS residual.
        //     Session logs confirmed Emily's steady-state AEC residual is ~0.0205 RMS
        //     (chunk=7, t≈3s, NLMS fully converged). 0.012 was below that — Emily's own
        //     voice passed the gate, got sent to Scribe, triggered false barge-ins.
        //     0.030 is above the observed residual with margin. Normal user speech is
        //     0.03–0.15 RMS — real barge-in still passes if user speaks at normal volume.
        //   TTS inactive (user's turn)  : 0.003 — floor noise only; quiet user speech passes.
        //
        // ttsActive defaults to true — greeting fires immediately after session init.
        // ai-chat.js sends { type: 'tts_state', active: bool } on TTS start/stop.
        //
        // GATE_HOLD_BLOCKS=8: gate stays open 64ms after RMS drops, preventing speech tail clipping.
        // v3.618: Raised 0.030 → 0.050. Session log showed Emily's post-NLMS residual at
        // 0.0384 RMS (chunk=38, t≈4s) — above 0.030 → gate opened → Scribe false barge-in.
        // The 0.0205 "steady-state" figure was after full NLMS convergence (~0.6s); during
        // the convergence window residual is higher. 0.050 sits above the observed peak
        // with margin, while normal user speech (0.05–0.15 RMS) still triggers barge-in
        // only when the user speaks materially louder than the threshold.
        // With browser AEC disabled (v3.618), NLMS is the sole AEC — no double-cancellation.
        this.GATE_THRESHOLD_TTS    = 0.050; // during TTS: above measured 0.0384 peak residual
        this.GATE_THRESHOLD_SILENT = 0.003; // user's turn: floor noise only; quiet speech passes
        this.ttsActive  = true;   // start TTS-active; greeting plays right after session init
        this.GATE_OPEN  = false;
        this.gateHold   = 0;

        this.port.onmessage = (e) => {
            if (e.data?.type === 'stop')      this.active = false;
            if (e.data?.type === 'tts_state') this.ttsActive = !!e.data.active;

            // v3.614: Reset NLMS filter weights after a barge-in.
            // Problem: during TTS the 512 filter taps converge to model Emily's voice.
            // After barge-in Emily stops, but this.w is "tuned to cancel Emily."
            // When the user speaks next, the filter cancels THEIR voice (mistaken for echo).
            // Result: e[n] ≈ 0 → gate sees nothing → Scribe sees silence → mic appears dead.
            //
            // Fix: zero all taps + clear reference history + reset read pointer.
            // The filter re-converges in ~0.6s (N/μ = 512/0.05 = 10,240 samples).
            // During that window the 0.003 gate is already active but with a clean slate —
            // the user's voice is not mistaken for Emily's echo.
            //
            // NOT called on natural TTS end (weights stay warm for next response).
            // ONLY called on barge-in, where the acoustic state has fundamentally changed.
            if (e.data?.type === 'reset_nlms') {
                this.w.fill(0);        // zero all 512 NLMS filter taps
                this.refBuf.fill(0);   // clear local reference history ring buffer
                this.refReadPtr = -1;  // force re-alignment on next process() call
                console.log('[AecMicProcessor] NLMS weights RESET (post-barge-in)');
            }
        };
    }

    process(inputs) {
        if (!this.active) return false;

        const input = inputs[0];
        if (!input?.[0]) return true;
        const mic = input[0]; // 128 Float32 samples at 16kHz

        // -- Passthrough: AEC not available ------------------------------------------
        if (!this.hasSab) {
            const out = mic.slice();
            this.port.postMessage(out, [out.buffer]);
            return true;
        }

        // -- Read SAB state ----------------------------------------------------------
        const writePtr = Atomics.load(this.refWritePtr, 0);

        // -- Initialize read pointer on first call with data -------------------------
        if (this.refReadPtr === -1) {
            // Need at least N samples of history before we can start NLMS.
            // Align refReadPtr to be N samples behind the current write head.
            // This gives the filter room to look back across all N taps.
            if (writePtr < this.N) {
                // Not enough reference data yet — output SILENCE (not passthrough).
                // CRITICAL: during this window Emily's TTS is already playing and her voice
                // is bleeding into the mic. Passing raw mic to Scribe here would let Scribe
                // transcribe Emily's own greeting and trigger a false barge-in.
                // Silence is safe — the window is only ~30ms (512/16000s).
                const silence = new Float32Array(mic.length); // zeros
                this.port.postMessage(silence, [silence.buffer]);
                return true;
            }
            // Start reading from N samples behind current write head
            this.refReadPtr = (writePtr - this.N + this.refLen) % this.refLen;
        }

        // -- Check reference availability --------------------------------------------
        // Ensure there are enough reference samples available for this block.
        const refAvailable = (writePtr - this.refReadPtr + this.refLen) % this.refLen;
        if (refAvailable < mic.length) {
            // Reference is behind mic (ref-capture hasn't caught up yet) — output SILENCE.
            // Same reasoning as above: during TTS Emily's voice is in the mic right now.
            // Raw passthrough here causes Scribe to transcribe Emily's greeting.
            const silence = new Float32Array(mic.length); // zeros
            this.port.postMessage(silence, [silence.buffer]);
            return true;
        }

        // -- NLMS per-sample filter --------------------------------------------------
        const out     = new Float32Array(mic.length);
        const w       = this.w;
        const rb      = this.refBuf;
        const xvec    = this.xvec;
        const N       = this.N;
        const MASK    = this.MASK;
        const mu      = this.mu;
        const eps     = this.eps;
        const refData = this.refData;
        const refLen  = this.refLen;

        let histPtr    = this.histPtr;
        let refReadPtr = this.refReadPtr;

        for (let i = 0; i < mic.length; i++) {
            // -- Read one reference sample from SAB ----------------------------------
            const refSample = refData[refReadPtr];
            refReadPtr = (refReadPtr + 1) % refLen;

            // -- Push into local reference history ring ------------------------------
            // histPtr is the NEXT write position (most recent sample will be at histPtr after write)
            rb[histPtr] = refSample;

            // -- Extract reference vector x[0..N-1] ----------------------------------
            // x[0] = most recent sample (at histPtr), x[k] = sample k steps ago
            // Using bitmask: (histPtr - k + N) & MASK — no modulo, single ALU op per k
            let power = eps;
            for (let k = 0; k < N; k++) {
                const xk = rb[(histPtr - k + N) & MASK];
                xvec[k]  = xk;
                power   += xk * xk;
            }

            // -- Compute estimated echo: y = w^T x -----------------------------------
            let y = 0;
            for (let k = 0; k < N; k++) {
                y += w[k] * xvec[k];
            }

            // -- Error: cleaned mic signal -------------------------------------------
            const e = mic[i] - y;
            out[i]  = e;

            // -- NLMS weight update: w += (mu/P) * e * x -----------------------------
            const step = mu / power;
            for (let k = 0; k < N; k++) {
                w[k] += step * e * xvec[k];
            }

            // Advance history ring pointer (bitmask wrap)
            histPtr = (histPtr + 1) & MASK;
        }

        // Persist state for next block
        this.histPtr    = histPtr;
        this.refReadPtr = refReadPtr;

        // -- Noise gate (post-NLMS mic isolation) ------------------------------------
        // v3.613: Dynamic threshold.
        //   ttsActive=true  -> GATE_THRESHOLD_TTS=0.030 : above Emily's ~0.0205 steady-state residual
        //   ttsActive=false -> GATE_THRESHOLD_SILENT=0.003: floor noise only; quiet user speech passes
        // Hold: gate stays OPEN for GATE_HOLD_BLOCKS after RMS drops, preventing speech tail clipping.
        const GATE_THRESHOLD   = this.ttsActive ? this.GATE_THRESHOLD_TTS : this.GATE_THRESHOLD_SILENT;
        const GATE_HOLD_BLOCKS = 8; // 8 x 128 samples = 64ms hold after speech drops
        let blockRms = 0;
        for (let i = 0; i < out.length; i++) blockRms += out[i] * out[i];
        blockRms = Math.sqrt(blockRms / out.length);

        if (blockRms >= GATE_THRESHOLD) {
            // Signal present — open gate instantly
            this.GATE_OPEN = true;
            this.gateHold  = GATE_HOLD_BLOCKS;
        } else if (this.gateHold > 0) {
            // Below threshold but still in hold period — keep gate open
            this.gateHold--;
        } else {
            // Hold expired — close gate
            this.GATE_OPEN = false;
        }

        if (!this.GATE_OPEN) {
            // Suppress: zero the block before forwarding to Scribe
            out.fill(0);
        }

        // Zero-copy transfer to main thread -> Float32 -> Int16 -> WebSocket
        this.port.postMessage(out, [out.buffer]);
        return true;
    }
}

registerProcessor('aec-mic-processor', AecMicProcessor);
