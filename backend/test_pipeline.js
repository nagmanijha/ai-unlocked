/**
 * AskBox — Demo Script for Video Walkthrough
 * ============================================
 *
 * Mocks a 30-second voice call via WebSocket so you can record
 * your video demo without needing to dial a real phone number.
 *
 * Usage:
 *   node test_pipeline.js
 *
 * What it does:
 *   1. Connects to ws://localhost:5000/acs-audio
 *   2. Sends mock audio packets (simulating a student speaking)
 *   3. Displays the full pipeline output in the backend terminal
 *   4. Disconnects cleanly after 30 seconds
 *
 * The backend terminal will show:
 *   [Pipeline] New call connected
 *   [STT] Detected "What is photosynthesis?" [lang=en-IN]
 *   [RAG] Retrieved context in Xms from cache/search
 *   [Pipeline] Starting LLM stream...
 *   [Pipeline] TTFB: Xms
 *   [Telemetry] Logging Call: ...
 *   [Pipeline] Turn complete
 *   [Pipeline] Call disconnected
 */

const WebSocket = require('ws');

// Detect port from arg or default to 3001
const PORT = process.argv[2] || '3001';
const LANG = process.argv[3] || 'hi'; // hi, mr, ta

const SCENARIOS = {
    hi: { name: 'Hindi', query: 'कल का मौसम कैसा रहेगा?', callId: 'demo-hi-001' },
    mr: { name: 'Marathi', query: 'आजचे मार्केट भाव काय आहेत?', callId: 'demo-mr-001' },
    ta: { name: 'Tamil', query: 'பயிர் நோய்கள் பற்றி சொல்லுங்கள்', callId: 'demo-ta-001' }
};

const active = SCENARIOS[LANG] || SCENARIOS.hi;
const WS_URL = `ws://localhost:${PORT}/acs-audio?callId=${active.callId}`;

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║         AskBox — Voice Pipeline Demo Script         ║');
console.log('║           Team Node — Nagmani Jha                   ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  Scenario:  ${active.name.padEnd(40)}║`);
console.log(`║  Query:     ${active.query.padEnd(40)}║`);
console.log(`║  Connecting to ws://localhost:${PORT}...              ║`);
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

const ws = new WebSocket(WS_URL);

let packetsSent = 0;
let messagesReceived = 0;
let audioInterval = null;

ws.on('open', () => {
    console.log('✅ WebSocket connected to', WS_URL);
    console.log('📤 Sending mock audio packets...');
    console.log('');

    // Send mock audio packets every 20ms (50 packets/sec = real-time 16kHz audio)
    audioInterval = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) {
            clearInterval(audioInterval);
            return;
        }

        // Generate a mock ACS audio packet (JSON with base64 PCM)
        const mockPCM = Buffer.alloc(640, 0); // 640 bytes = 20ms of 16kHz 16-bit mono
        // Add some "noise" so it's not pure silence
        for (let i = 0; i < mockPCM.length; i += 2) {
            mockPCM.writeInt16LE(Math.floor(Math.random() * 1000 - 500), i);
        }

        const packet = JSON.stringify({
            kind: 'AudioData',
            audioData: {
                data: mockPCM.toString('base64'),
                encoding: 'base64',
                sampleRate: 16000,
                channels: 1,
            },
        });

        ws.send(packet);
        packetsSent++;

        // Progress indicator
        if (packetsSent % 50 === 0) {
            const seconds = (packetsSent * 20) / 1000;
            process.stdout.write(`\r📤 Sent ${packetsSent} packets (${seconds.toFixed(1)}s of audio)`);
        }
    }, 20);

    // Stop after 30 seconds
    setTimeout(() => {
        console.log('');
        console.log('');
        console.log('⏱️  30 seconds elapsed — closing connection...');
        clearInterval(audioInterval);
        ws.close(1000, 'Demo complete');
    }, 30_000);
});

ws.on('message', (data) => {
    messagesReceived++;
    try {
        const msg = JSON.parse(data.toString());
        if (msg.kind === 'AudioData') {
            if (messagesReceived === 1) {
                console.log('');
                console.log('🔊 Receiving TTS audio back from pipeline...');
            }
            const audioSize = Buffer.from(msg.audioData.data, 'base64').length;
            process.stdout.write(`\r🔊 Received ${messagesReceived} audio chunks (latest: ${audioSize} bytes)`);
        } else {
            console.log('📩 Received:', JSON.stringify(msg).slice(0, 100));
        }
    } catch {
        // Binary data
        process.stdout.write(`\r🔊 Received ${messagesReceived} binary chunks`);
    }
});

ws.on('close', (code, reason) => {
    clearInterval(audioInterval);
    console.log('');
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                  Demo Complete                      ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  Packets sent:     ${String(packetsSent).padEnd(33)}║`);
    console.log(`║  Responses received: ${String(messagesReceived).padEnd(31)}║`);
    console.log(`║  Close code:       ${String(code).padEnd(33)}║`);
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('💡 Check the backend terminal for the full pipeline logs.');
    process.exit(0);
});

ws.on('error', (err) => {
    console.error('');
    console.error('❌ WebSocket error:', err.message);
    console.error('');
    console.error('Make sure the backend is running:');
    console.error('  cd backend && npm run dev');
    process.exit(1);
});
