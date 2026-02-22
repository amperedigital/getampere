/* global AudioWorkletProcessor, registerProcessor */
/**
 * AudioWorklet Processor — Voice Print PCM Ring Buffer
 *
 * Runs in the audio rendering thread. Collects PCM samples
 * into a circular buffer and provides snapshots on demand.
 *
 * v3.218: Native 16kHz capture (no downsampling), 10s ring buffer for 8s snapshots.
 */

class VoicePrintProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // v3.218: 10 seconds at 16kHz mono = 160,000 samples
        this.sampleRate = 16000;
        this.bufferSize = this.sampleRate * 10;
        this.buffer = new Float32Array(this.bufferSize);
        this.writeIndex = 0;
        this.totalSamplesWritten = 0;

        this.port.onmessage = (event) => {
            if (event.data.type === 'snapshot') {
                this.sendSnapshot(event.data.durationMs || 8000);
            }
        };
    }

    /**
     * Called for every 128-sample audio frame.
     * Copy samples into the circular buffer.
     */
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channelData = input[0]; // mono — first channel only

        for (let i = 0; i < channelData.length; i++) {
            this.buffer[this.writeIndex] = channelData[i];
            this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
            this.totalSamplesWritten++;
        }

        return true; // keep processing
    }

    /**
     * Extract the last N milliseconds from the ring buffer
     * and send as a message back to the main thread.
     *
     * v3.218: No downsampling — AudioContext is already at 16kHz.
     */
    sendSnapshot(durationMs) {
        const samplesToExtract = Math.min(
            Math.floor((durationMs / 1000) * this.sampleRate),
            this.bufferSize,
            this.totalSamplesWritten
        );

        if (samplesToExtract < this.sampleRate * 0.5) {
            // Less than 0.5s of audio — insufficient
            this.port.postMessage({
                type: 'snapshot',
                status: 'insufficient_audio',
                samplesAvailable: this.totalSamplesWritten,
            });
            return;
        }

        // Read from circular buffer, oldest to newest
        const snapshot = new Float32Array(samplesToExtract);
        let readIndex = (this.writeIndex - samplesToExtract + this.bufferSize) % this.bufferSize;

        for (let i = 0; i < samplesToExtract; i++) {
            snapshot[i] = this.buffer[readIndex];
            readIndex = (readIndex + 1) % this.bufferSize;
        }

        // v3.218: Send directly at native 16kHz — no downsampling needed
        this.port.postMessage({
            type: 'snapshot',
            status: 'ok',
            samples: snapshot,
            sampleRate: this.sampleRate,
            durationMs: Math.round((samplesToExtract / this.sampleRate) * 1000),
        }, [snapshot.buffer]); // transfer buffer for zero-copy
    }
}

registerProcessor('voice-print-processor', VoicePrintProcessor);
