/* global AudioWorkletProcessor, registerProcessor */
/**
 * AudioWorklet Processor — Mic PCM Streaming
 *
 * Runs in the audio rendering thread. Receives 128-sample blocks from the
 * browser audio engine and forwards them to the main thread via postMessage.
 * Replaces the deprecated ScriptProcessorNode for microphone capture.
 *
 * The main thread converts Float32 → Int16 PCM and sends over WebSocket to
 * VoiceSessionDO → Scribe.
 */

class MicStreamProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.active = true;
        this.port.onmessage = (e) => {
            if (e.data?.type === 'stop') this.active = false;
        };
    }

    process(inputs) {
        if (!this.active) return false; // detach from graph
        const input = inputs[0];
        if (!input || !input[0]) return true;
        // Transfer buffer for zero-copy (main thread owns it after this)
        const samples = input[0].slice(); // copy — input[0] is immutable view
        this.port.postMessage(samples, [samples.buffer]);
        return true;
    }
}

registerProcessor('mic-stream-processor', MicStreamProcessor);
