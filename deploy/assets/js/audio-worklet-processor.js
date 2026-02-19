/* global AudioWorkletProcessor, registerProcessor */
/**
 * AudioWorklet Processor — Voice Print PCM Ring Buffer
 *
 * Runs in the audio rendering thread. Collects PCM samples
 * into a circular buffer and provides snapshots on demand.
 */

class VoicePrintProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // 5 seconds at 48kHz mono = 240,000 samples
        this.bufferSize = 48000 * 5;
        this.buffer = new Float32Array(this.bufferSize);
        this.writeIndex = 0;
        this.totalSamplesWritten = 0;

        this.port.onmessage = (event) => {
            if (event.data.type === 'snapshot') {
                this.sendSnapshot(event.data.durationMs || 3000);
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
     */
    sendSnapshot(durationMs) {
        const sampleRate = 48000; // AudioWorklet default
        const samplesToExtract = Math.min(
            Math.floor((durationMs / 1000) * sampleRate),
            this.bufferSize,
            this.totalSamplesWritten
        );

        if (samplesToExtract < sampleRate * 0.5) {
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

        // Downsample to 16kHz for the voice model
        const downsampleRatio = 3; // 48000 / 16000 = 3
        const downsampledLength = Math.floor(samplesToExtract / downsampleRatio);
        const downsampled = new Float32Array(downsampledLength);

        for (let i = 0; i < downsampledLength; i++) {
            downsampled[i] = snapshot[i * downsampleRatio];
        }

        this.port.postMessage({
            type: 'snapshot',
            status: 'ok',
            samples: downsampled,
            sampleRate: 16000,
            durationMs: Math.round((downsampledLength / 16000) * 1000),
        }, [downsampled.buffer]); // transfer buffer for zero-copy
    }
}

registerProcessor('voice-print-processor', VoicePrintProcessor);
