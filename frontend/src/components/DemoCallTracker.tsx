import { useState, useRef, useEffect } from 'react';

interface DemoCallTrackerProps {
    scenario?: {
        id: string;
        language: string;
        query: string;
        translation: string;
    };
}

export default function DemoCallTracker({ scenario }: DemoCallTrackerProps) {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'completed' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [packetsSent, setPacketsSent] = useState(0);
    const [messagesReceived, setMessagesReceived] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const intervalRef = useRef<number | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-49), `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const startDemoCall = () => {
        if (wsRef.current) return;

        setStatus('connecting');
        setLogs([]);
        setPacketsSent(0);
        setMessagesReceived(0);

        addLog(`Initializing ${scenario?.language || ''} voice pipeline demonstration...`);
        if (scenario) {
            addLog(`Simulated Query: "${scenario.query}"`);
        }

        try {
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = import.meta.env.VITE_WS_URL || 'localhost:3001';
const url = `${proto}//${wsHost}/acs-audio?callId=demo-call-ui-001`;
            addLog(`Attempting connection to ${url}...`);

            const ws = new WebSocket(url);
            wsRef.current = ws;

            addLog('WebSocket instance created. Waiting for handshake...');

            ws.onopen = () => {
                setStatus('active');
                addLog('✅ WebSocket connected to Audio Pipeline');
                addLog('📤 Sending mock voice packets (16kHz PCM)...');

                // Send mock packets every 20ms
                intervalRef.current = window.setInterval(() => {
                    if (ws.readyState !== WebSocket.OPEN) return;

                    // Mock 20ms of 16kHz audio data (Base64)
                    // 640 bytes = 20ms 16kHz 16-bit mono
                    // Creating a dummy buffer full of zeros for simplicity in the browser
                    const mockAudioBuffer = new Uint8Array(640);
                    for (let i = 0; i < mockAudioBuffer.length; i++) {
                        mockAudioBuffer[i] = Math.floor(Math.random() * 255); // Random noise
                    }

                    // Convert Uint8Array to Base64 (simple hacky way for small buffers)
                    let binary = '';
                    const bytes = new Uint8Array(mockAudioBuffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64Data = btoa(binary);

                    const packet = JSON.stringify({
                        kind: 'AudioData',
                        audioData: {
                            data: base64Data,
                            encoding: 'base64',
                            sampleRate: 16000,
                            channels: 1,
                        },
                    });

                    ws.send(packet);
                    setPacketsSent(prev => prev + 1);
                }, 20);

                // Auto-stop after 30 seconds
                setTimeout(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        addLog('⏱️ 30 seconds elapsed. Ending test call.');
                        stopDemoCall();
                    }
                }, 30000);
            };

            ws.onmessage = (event) => {
                setMessagesReceived(prev => prev + 1);
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.kind === 'AudioData') {
                        // It's TTS returning!
                        addLog('🔊 [TTS] Received audio chunk from Azure Neural Pipeline');
                    } else {
                        addLog(`📩 [System] ${JSON.stringify(msg).substring(0, 100)}`);
                    }
                } catch {
                    addLog('🔊 [TTS] Received binary chunk');
                }
            };

            ws.onerror = (err) => {
                setStatus('error');
                addLog(`❌ WebSocket error! Check if backend is reachable at ${window.location.host}`);
                console.error(err);
                stopDemoCall(false);
            };

            ws.onclose = () => {
                setStatus(prev => prev === 'error' ? 'error' : 'completed');
                addLog('📞 Call disconnected');
                stopDemoCall(false);
            };

        } catch (error) {
            setStatus('error');
            addLog('❌ Failed to create WebSocket connection');
            console.error(error);
        }
    };

    const stopDemoCall = (forceClose = true) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (wsRef.current && forceClose) {
            wsRef.current.close(1000, 'Demo stopped by user');
        }
        wsRef.current = null;
        setStatus(prev => prev === 'active' || prev === 'connecting' ? 'completed' : prev);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border border-primary/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">campaign</span>
                    <h3 className="text-xl font-bold">Live Demo Pipeline</h3>
                </div>
                <div className="flex gap-2">
                    {status === 'idle' || status === 'completed' || status === 'error' ? (
                        <button
                            onClick={startDemoCall}
                            className="px-4 py-2 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            Start Mock Call
                        </button>
                    ) : (
                        <button
                            onClick={() => stopDemoCall(true)}
                            className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/50 font-bold rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">stop</span>
                            End Call
                        </button>
                    )}
                </div>
            </div>

            <p className="text-sm text-slate-400 mb-6">
                Simulate a live caller interacting with the AI. This connects directly to the backend
                <strong> Audio Pipeline WebSocket</strong> to demonstrate real-time data flow.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background-dark/50 p-4 rounded-xl border border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Audio Packets Sent</p>
                    <p className="text-2xl font-black text-primary">{packetsSent}</p>
                    <p className="text-[10px] text-slate-600">Mock caller voice</p>
                </div>
                <div className="bg-background-dark/50 p-4 rounded-xl border border-accent-teal/10">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Neural TTS Packets Received</p>
                    <p className="text-2xl font-black text-accent-teal">{messagesReceived}</p>
                    <p className="text-[10px] text-slate-600">AI audio response stream</p>
                </div>
            </div>

            <div className="bg-black/90 p-4 rounded-xl border border-slate-800 font-mono text-[11px] h-48 overflow-y-auto space-y-2">
                {logs.length === 0 ? (
                    <p className="text-slate-600 italic">No active call logs. Click "Start Mock Call" to begin telemetry stream...</p>
                ) : (
                    logs.map((log, i) => (
                        <p key={i} className={
                            log.includes('❌') ? 'text-red-400' :
                                log.includes('✅') || log.includes('🔊') ? 'text-accent-teal' :
                                    log.includes('📤') ? 'text-primary' :
                                        'text-slate-300'
                        }>{log}</p>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>

            {(status === 'active' || status === 'connecting') && (
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
                    <div className="h-full bg-primary animate-pulse w-full"></div>
                </div>
            )}
        </div>
    );
}
