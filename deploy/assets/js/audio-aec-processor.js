/* global AudioWorkletProcessor, registerProcessor, SharedArrayBuffer */
/**
 * AEC AudioWorklet Processor — Mic Capture with Reference Echo Cancellation
 * v3.601 — Phase 2 Full-Duplex AEC
 *
 * Receives mic PCM (128-sample blocks at 16kHz) and subtracts a delayed
 * reference signal from the TTS playback to cancel acoustic echo.
 *
 * The reference signal is written into a SharedArrayBuffer (SAB) ring buffer
 * by _queueAudio() in ai-chat.js as TTS PCM arrives (resampled 22050→16kHz).
 *
 * Architecture:
 *   SAB layout: [ write_ptr (Int32, 4 bytes) | samples (Float32, remainder) ]
 *   write_ptr = index of the NEXT sample to be written (ring-buffer head)
 *   samples   = Float32 ring buffer, 1 second at 16kHz = 16000 samples = 64000 bytes
 *   Total SAB size: 4 + 16000 * 4 = 64004 bytes
 *
 * AEC method: Linear subtraction with delay compensation.
 *   delayCompSamples (~400 = 25ms at 16kHz) accounts for acoustic round-trip:
 *   speaker → air → mic. This is an average; real hardware varies 10–60ms.
 *   attenuationFactor (0.85) is tunable — reduce if mic/speaker are well-isolated,
 *   increase if echo persists. NLMS adaptive filter is Phase 3 if needed.
 *
 * When SAB is not provided (e.g. browser doesn't support it or COOP/COEP missing),
 * the processor falls back to passthrough — mic audio is forwarded unchanged.
 * This ensures zero regression if AEC is unavailable.
 */

class AecMicProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.active = true;

    const opts = options?.processorOptions ?? {};
    const sab  = opts.referenceBuffer ?? null;

    if (sab && sab instanceof SharedArrayBuffer) {
      // SAB layout: [write_ptr (Int32) | samples (Float32 ring)]
      this.refWritePtr = new Int32Array(sab, 0, 1);          // 1 int32 = write pointer
      this.refData     = new Float32Array(sab, 4);           // rest = samples
      this.refLen      = this.refData.length;                // 16000 samples
      this.hasSab      = true;
    } else {
      this.hasSab = false;
    }

    // Round-trip delay compensation: ~25ms at 16kHz = 400 samples
    // Accounts for speaker→mic acoustic travel time. Tunable per hardware.
    this.delayCompSamples = opts.delayCompSamples ?? 400;

    // Echo attenuation factor: 0.85 = subtract 85% of reference signal.
    // Lower values reduce the risk of over-subtracting (introducing artifacts).
    this.attenuation = opts.attenuationFactor ?? 0.85;

    this.port.onmessage = (e) => {
      if (e.data?.type === 'stop') this.active = false;
    };
  }

  process(inputs) {
    if (!this.active) return false;
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const mic = input[0];

    if (!this.hasSab) {
      // Passthrough — AEC not available (no SAB, no COOP/COEP, or old browser)
      const out = mic.slice();
      this.port.postMessage(out, [out.buffer]);
      return true;
    }

    const out     = new Float32Array(mic.length);
    const writePtr = Atomics.load(this.refWritePtr, 0);
    const bufLen   = this.refLen;

    for (let i = 0; i < mic.length; i++) {
      // Read reference sample from the ring buffer, delayed by delayCompSamples
      // to compensate for the acoustic round-trip (speaker → air → mic).
      // The ring buffer is written at 16kHz by the main thread (same rate as mic).
      // We read a sample that was written ~delayCompSamples ago.
      const readIdx  = ((writePtr - this.delayCompSamples - mic.length + i) % bufLen + bufLen) % bufLen;
      const refSample = this.refData[readIdx];

      // Subtract attenuated reference from mic signal
      out[i] = mic[i] - refSample * this.attenuation;
    }

    // Zero-copy transfer to main thread → Float32 → Int16 → WebSocket (same as before)
    this.port.postMessage(out, [out.buffer]);
    return true;
  }
}

registerProcessor('aec-mic-processor', AecMicProcessor);
