import { useState, useRef, useEffect, useCallback } from 'react';

interface DemoCallTrackerProps {
    scenario?: {
        id: string;
        language: string;
        query: string;
        translation: string;
    };
}

/** Silence threshold — RMS below this = "not speaking" */
const SILENCE_THRESHOLD = 0.01;

/**
 * Convert Float32 PCM samples (-1..1) to Int16 PCM (–32768..32767).
 * Returns a base64-encoded string of the 16-bit PCM data.
 */
function float32ToBase64PCM16(float32: Float32Array): string {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Play a base64-encoded raw PCM-16kHz-16bit-mono buffer through an AudioContext.
 * We manually decode the raw PCM since decodeAudioData expects a codec header.
 */
function playPCM16Audio(base64: string, ctx: AudioContext): void {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    // Interpret as 16-bit signed integers
    const int16 = new Int16Array(bytes.buffer);
    const sampleRate = 16000;

    // Create an AudioBuffer and fill with float samples
    const audioBuffer = ctx.createBuffer(1, int16.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) {
        channelData[i] = int16[i] / 32768;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
}

export default function DemoCallTracker({ scenario }: DemoCallTrackerProps) {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'completed' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [packetsSent, setPacketsSent] = useState(0);
    const [messagesReceived, setMessagesReceived] = useState(0);
    const [volume, setVolume] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const silenceStartRef = useRef<number | null>(null);
    const packetCountRef = useRef(0);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev.slice(-49), `${new Date().toLocaleTimeString()} — ${msg}`]);
    }, []);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopDemoCall(true); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startDemoCall = async () => {
        if (wsRef.current) return;

        setStatus('connecting');
        setLogs([]);
        setPacketsSent(0);
        setMessagesReceived(0);
        packetCountRef.current = 0;
        silenceStartRef.current = null;

        addLog(`Initializing ${scenario?.language || ''} live voice pipeline...`);

        // ── Step 1: Get Microphone ──
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            mediaStreamRef.current = stream;
            addLog('🎤 Microphone access granted');
        } catch (err) {
            setStatus('error');
            addLog('❌ Microphone access denied. Please allow mic permission.');
            console.error(err);
            return;
        }

        // ── Step 2: Create AudioContext for capture (16kHz) ──
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;

        // Separate playback context at device default sample rate
        const playbackCtx = new AudioContext();
        playbackCtxRef.current = playbackCtx;

        // ── Step 3: Connect WebSocket ──
        try {
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = import.meta.env.VITE_WS_URL || 'localhost:3001';
            const callId = `demo-live-${Date.now().toString(36)}`;
            const url = `${proto}//${wsHost}/acs-audio?callId=${callId}`;
            addLog(`Connecting to ${url}...`);

            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setStatus('active');
                addLog('✅ WebSocket connected to Audio Pipeline');
                addLog('🎤 Speak now — the AI listens for your question...');

                // ── Wire up microphone → WebSocket via ScriptProcessor ──
                const source = audioCtx.createMediaStreamSource(stream);
                sourceRef.current = source;

                // 4096 frames at 16kHz ≈ 256ms chunks
                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                source.connect(processor);
                processor.connect(audioCtx.destination);

                processor.onaudioprocess = (event: AudioProcessingEvent) => {
                    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                    const input = event.inputBuffer.getChannelData(0);

                    // ── Volume-based VAD ──
                    let sum = 0;
                    for (let i = 0; i < input.length; i++) {
                        sum += Math.abs(input[i]);
                    }
                    const rms = sum / input.length;
                    setVolume(rms);

                    if (rms < SILENCE_THRESHOLD) {
                        // Silence detected
                        if (!silenceStartRef.current) {
                            silenceStartRef.current = Date.now();
                        }
                        setIsSpeaking(false);
                    } else {
                        // User is speaking — reset silence timer
                        silenceStartRef.current = null;
                        setIsSpeaking(true);
                    }

                    // Always send audio (the backend's STT needs the full stream,
                    // and uses its own silence timer to endpoint)
                    const base64Data = float32ToBase64PCM16(input);

                    const packet = JSON.stringify({
                        kind: 'AudioData',
                        audioData: {
                            data: base64Data,
                            encoding: 'base64',
                            sampleRate: 16000,
                            channels: 1,
                        },
                    });

                    wsRef.current.send(packet);
                    packetCountRef.current++;
                    setPacketsSent(packetCountRef.current);
                };
            };

            // ── Handle incoming TTS audio ──
            ws.onmessage = (event) => {
                setMessagesReceived(prev => prev + 1);
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.kind === 'AudioData' && msg.audioData?.data) {
                        addLog('🔊 [TTS] Playing AI audio response...');
                        // Play the received PCM audio through speakers
                        if (playbackCtxRef.current) {
                            playPCM16Audio(msg.audioData.data, playbackCtxRef.current);
                        }
                    } else if (msg.kind === 'StopAudio') {
                        addLog('⏹️ [System] Playback stopped (barge-in)');
                    } else {
                        addLog(`📩 [System] ${JSON.stringify(msg).substring(0, 100)}`);
                    }
                } catch {
                    addLog('🔊 [TTS] Received binary audio chunk');
                }
            };

            ws.onerror = () => {
                setStatus('error');
                addLog(`❌ WebSocket error! Is backend running at ${import.meta.env.VITE_WS_URL || 'localhost:3001'}?`);
                stopDemoCall(false);
            };

            ws.onclose = () => {
                setStatus(prev => prev === 'error' ? 'error' : 'completed');
                addLog('📞 Call disconnected');
                stopDemoCall(false);
            };

            // Auto-stop after 60 seconds
            setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    addLog('⏱️ 60 seconds elapsed. Ending call.');
                    stopDemoCall(true);
                }
            }, 60000);

        } catch (error) {
            setStatus('error');
            addLog('❌ Failed to create WebSocket connection');
            console.error(error);
        }
    };

    const stopDemoCall = (forceClose = true) => {
        // Stop audio processing
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // Stop microphone
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }

        // Close AudioContexts
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
        if (playbackCtxRef.current && playbackCtxRef.current.state !== 'closed') {
            playbackCtxRef.current.close().catch(() => {});
            playbackCtxRef.current = null;
        }

        // Close WebSocket
        if (wsRef.current && forceClose) {
            wsRef.current.close(1000, 'Demo stopped by user');
        }
        wsRef.current = null;
        silenceStartRef.current = null;
        setVolume(0);
        setIsSpeaking(false);
        setStatus(prev => prev === 'active' || prev === 'connecting' ? 'completed' : prev);
    };

    // Volume bar width (0-100%)
    const volumeWidth = Math.min(volume * 5000, 100);

    return (
        <div className="glass-panel p-6 rounded-2xl border border-primary/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">campaign</span>
                    <h3 className="text-xl font-bold">Live Voice Demo</h3>
                </div>
                <div className="flex gap-2">
                    {status === 'idle' || status === 'completed' || status === 'error' ? (
                        <button
                            onClick={startDemoCall}
                            className="px-4 py-2 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">mic</span>
                            Start Voice Call
                        </button>
                    ) : (
                        <button
                            onClick={() => stopDemoCall(true)}
                            className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/50 font-bold rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">call_end</span>
                            End Call
                        </button>
                    )}
                </div>
            </div>

            <p className="text-sm text-slate-400 mb-4">
                Speak into your microphone to interact with the AI. The system detects
                <strong> ~3 seconds of silence</strong> as the end of your question, then responds with audio.
            </p>

            {/* ── Volume / Speaking Indicator ── */}
            {status === 'active' && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                            {isSpeaking ? '🎤 Listening...' : '🤫 Silence — waiting for speech...'}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-primary transition-all duration-100 rounded-full"
                            style={{ width: `${volumeWidth}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background-dark/50 p-4 rounded-xl border border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Audio Packets Sent</p>
                    <p className="text-2xl font-black text-primary">{packetsSent}</p>
                    <p className="text-[10px] text-slate-600">Live microphone PCM</p>
                </div>
                <div className="bg-background-dark/50 p-4 rounded-xl border border-accent-teal/10">
                    <p className="text-[10px] uppercase font-bold text-slate-500">TTS Chunks Received</p>
                    <p className="text-2xl font-black text-accent-teal">{messagesReceived}</p>
                    <p className="text-[10px] text-slate-600">AI audio response</p>
                </div>
            </div>

            <div className="bg-black/90 p-4 rounded-xl border border-slate-800 font-mono text-[11px] h-48 overflow-y-auto space-y-2">
                {logs.length === 0 ? (
                    <p className="text-slate-600 italic">Click "Start Voice Call" to begin a live AI conversation...</p>
                ) : (
                    logs.map((log, i) => (
                        <p key={i} className={
                            log.includes('❌') ? 'text-red-400' :
                                log.includes('✅') || log.includes('🔊') ? 'text-accent-teal' :
                                    log.includes('🎤') ? 'text-green-400' :
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
