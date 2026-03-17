/* global AudioWorkletProcessor, registerProcessor, Atomics, SharedArrayBuffer */
/**
 * Reference Capture AudioWorklet — audio-ref-capture-processor.js
 * v3.605 — Phase 2+3 AEC: playback-side reference signal capture
 *
 * WHY THIS EXISTS:
 *   The previous architecture wrote TTS reference samples to the SAB from the
 *   main thread at the time PCM chunks arrived from ElevenLabs. Those chunks are
 *   SCHEDULED for future playback — for long TTS responses, pcmNextAt can be 1–3
 *   seconds ahead of currentTime. The AEC worklet was subtracting a reference from
 *   the future, not what was actually playing. This caused incorrect subtraction
 *   during the NLMS convergence window, producing ticks and artifacts.
 *
 * WHAT THIS DOES:
 *   Runs inside the TTS playback AudioContext (22050Hz). Inserted between masterGain
 *   and the destination (speaker). Captures the ACTUAL audio samples going to the
 *   speaker in real time, resamples them from 22050Hz → 16kHz, and writes to the
 *   SharedArrayBuffer. The AEC mic worklet reads from this SAB — so the reference
 *   is always temporally aligned with what the speaker is actually outputting.
 *
 * TIMING:
 *   SAB write happens at exact DAC render time (AudioWorklet process() is on the
 *   audio render thread, driven by the hardware clock). The acoustic round-trip
 *   (speaker → air → mic) adds ~10–60ms of delay. The NLMS filter in the AEC
 *   worklet identifies and compensates for this delay automatically.
 *
 * SAB LAYOUT (shared with audio-aec-processor.js):
 *   Bytes 0–3   : Int32 write pointer (atomic)
 *   Bytes 4+    : Float32 ring buffer, 16000 samples = 1 second at 16kHz
 *   Total size  : 4 + 16000 * 4 = 64004 bytes (~64KB)
 *
 * RESAMPLING:
 *   Linear interpolation, 22050 → 16000. Phase accumulator carries across blocks
 *   so there are no discontinuities at block boundaries. High-frequency aliasing
 *   from linear interp is negligible for echo cancellation (we only need the
 *   structural correlation, not fidelity).
 */

class RefCaptureProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.active = true;

        const opts = options?.processorOptions ?? {};
        const sab  = opts.referenceBuffer ?? null;

        if (sab && sab instanceof SharedArrayBuffer) {
            // SAB layout: [write_ptr (Int32, 4 bytes) | samples (Float32 ring)]
            this.refWritePtr = new Int32Array(sab, 0, 1);
            this.refSamples  = new Float32Array(sab, 4);
            this.bufLen      = this.refSamples.length; // 16000 samples
            this.hasSab      = true;
        } else {
            this.hasSab = false;
        }

        // Resampling state: 22050 → 16000 Hz
        // We advance inputPhase by (fSrc/fDst) per output sample.
        // fSrc/fDst = 22050/16000 = 1.378125
        this.fSrcOverFDst = 22050 / 16000; // ≈ 1.378125
        this.inputPhase   = 0;             // fractional input position, carries across blocks
        this.prevSample   = 0;             // last input sample from previous block (for interp)

        this.port.onmessage = (e) => {
            if (e.data?.type === 'stop') this.active = false;
        };
    }

    process(inputs, outputs) {
        if (!this.active) return false;

        const input  = inputs[0]?.[0];   // mono playback audio at 22050Hz
        const output = outputs[0]?.[0];  // passthrough to speaker

        // Always pass audio through unchanged — we are transparent to the graph
        if (output) {
            if (input) {
                output.set(input);
            }
            // If input is empty (silence), output is already zeroed by the runtime
        }

        if (!this.hasSab || !input) return true;

        // ── Resample 22050 → 16000 and write to SAB ─────────────────────────────
        // We iterate over OUTPUT sample positions (at 16kHz) and interpolate
        // the corresponding INPUT position (at 22050Hz).
        //
        // Block boundary handling: inputPhase carries the fractional position
        // across blocks. At the end of each block we subtract the block length
        // so inputPhase represents offset into the CURRENT block.
        //
        // For interpolation at the START of a block: inputPhase may be < 0
        // (referencing a sample from the previous block). We store prevSample
        // from the last input sample of the previous block to handle this.

        let ptr = Atomics.load(this.refWritePtr, 0);
        const bufLen = this.bufLen;
        const src    = input;
        const srcLen = src.length; // 128

        // Generate output samples while inputPhase < srcLen
        // inputPhase < 0 means we're interpolating between prevSample and src[0]
        while (this.inputPhase < srcLen - 1) {
            let s;
            if (this.inputPhase < 0) {
                // Interpolate between previous block's last sample and src[0]
                const frac = this.inputPhase + 1; // 0..1
                s = this.prevSample * (1 - frac) + src[0] * frac;
            } else {
                const lo   = Math.floor(this.inputPhase);
                const hi   = Math.min(lo + 1, srcLen - 1);
                const frac = this.inputPhase - lo;
                s = src[lo] * (1 - frac) + src[hi] * frac;
            }

            // Write resampled sample into SAB ring buffer
            this.refSamples[ptr] = s;
            ptr = (ptr + 1) % bufLen;

            // Advance input phase by fSrc/fDst = 22050/16000
            this.inputPhase += this.fSrcOverFDst;
        }

        // Commit write pointer atomically
        Atomics.store(this.refWritePtr, 0, ptr);

        // Carry for next block: subtract srcLen so phase is relative to next block's start
        this.prevSample = src[srcLen - 1];
        this.inputPhase -= srcLen;

        return true;
    }
}

registerProcessor('ref-capture-processor', RefCaptureProcessor);
