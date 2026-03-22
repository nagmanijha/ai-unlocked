/**
 * Helper to wrap raw 16kHz 16-bit Mono PCM buffer with a standard RIFF/WAV header
 * so that standard media players can play the saved TTS output files.
 */
export function wrapPcmToWav(pcmBuffer: Buffer, sampleRate: number = 16000, numChannels: number = 1, bitDepth: number = 16): Buffer {
    const dataSize = pcmBuffer.length;
    const headerSize = 44;
    const wavBuffer = Buffer.alloc(headerSize + dataSize);

    // RIFF chunk descriptor
    wavBuffer.write('RIFF', 0); // ChunkID
    wavBuffer.writeUInt32LE(36 + dataSize, 4); // ChunkSize
    wavBuffer.write('WAVE', 8); // Format

    // 'fmt ' sub-chunk
    wavBuffer.write('fmt ', 12); // Subchunk1ID
    wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    wavBuffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    wavBuffer.writeUInt16LE(numChannels, 22); // NumChannels
    wavBuffer.writeUInt32LE(sampleRate, 24); // SampleRate
    
    const byteRate = (sampleRate * numChannels * bitDepth) / 8;
    wavBuffer.writeUInt32LE(byteRate, 28); // ByteRate
    
    const blockAlign = (numChannels * bitDepth) / 8;
    wavBuffer.writeUInt16LE(blockAlign, 32); // BlockAlign
    wavBuffer.writeUInt16LE(bitDepth, 34); // BitsPerSample

    // 'data' sub-chunk
    wavBuffer.write('data', 36); // Subchunk2ID
    wavBuffer.writeUInt32LE(dataSize, 40); // Subchunk2Size

    // Write the actual raw PCM audio data
    pcmBuffer.copy(wavBuffer, headerSize);

    return wavBuffer;
}
