"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function createWavHeader(dataLength, sampleRate = 16000, numChannels = 1, bitsPerSample = 16) {
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
//# sourceMappingURL=convert_recording.js.map