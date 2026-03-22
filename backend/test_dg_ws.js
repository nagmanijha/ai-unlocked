const WebSocket = require('ws');
const fs = require('fs');

const API_KEY = process.env.DEEPGRAM_API_KEY || '2e79034d70865f2ef225e1232fdc5a7467d0f08d';
const url = 'wss://api.deepgram.com/v1/listen?model=nova-2&language=hi&smart_format=true&interim_results=true&encoding=linear16&sample_rate=16000&channels=1&endpointing=300';
const logFileName = 'dg_logs.json';
fs.writeFileSync(logFileName, '[\n');
const log = (msg) => { fs.appendFileSync(logFileName, JSON.stringify(msg, null, 2) + ',\n'); }

const ws = new WebSocket(url, { headers: { Authorization: `Token ${API_KEY}` } });

ws.on('open', () => {
    log({ event: 'connected' });
    const buf = Buffer.alloc(32000);
    for (let i = 0; i < buf.length; i++) { buf[i] = Math.random() * 255; }
    ws.send(buf);
    setTimeout(() => { ws.send(JSON.stringify({ type: 'CloseStream' })); }, 2000);
});

ws.on('message', (data) => {
    const res = JSON.parse(data.toString());
    if (res.type !== 'Metadata') log(res);
});

ws.on('close', (code, reason) => { log({ event: 'closed', code, reason: reason.toString() }); console.log('Done'); process.exit(0); });
ws.on('error', (e) => log({ event: 'error', error: e.message }));
