import * as fs from 'fs';
import * as path from 'path';

function createWavHeader(dataLength: number, sampleRate: number = 16000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
    const header = Buffer.alloc(44);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(dataLength + 36, 4);
    header.write('WAVE', 8);
    
    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // length of fmt chunk
    header.writeUInt16LE(1, 20); // format (1 = PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28); // byte rate
    header.writeUInt16LE(numChannels * bitsPerSample / 8, 32); // block align
    header.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataLength, 40);
    
    return header;
}

const recordingsDir = path.resolve(process.cwd(), 'recordings');
if (!fs.existsSync(recordingsDir)) {
    console.error(`Recordings directory not found at ${recordingsDir}`);
    process.exit(1);
}

const files = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.pcm'));
files.forEach(file => {
    const pcmPath = path.join(recordingsDir, file);
    const wavPath = pcmPath.replace('.pcm', '.wav');
    
    const pcmData = fs.readFileSync(pcmPath);
    const header = createWavHeader(pcmData.length);
    const wavData = Buffer.concat([header, pcmData]);
    
    fs.writeFileSync(wavPath, wavData);
    console.log(`Converted ${file} -> ${path.basename(wavPath)}`);
});
