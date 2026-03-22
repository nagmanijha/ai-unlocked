import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PhoneUI() {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
    const [aiText, setAiText] = useState('');
    const [textInput, setTextInput] = useState('');
    const [language, setLanguage] = useState<'en-IN' | 'hi-IN' | 'te-IN' | 'mr-IN'>('en-IN');

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    // Playback queue reference to ensure smooth contiguous audio
    const nextPlayTimeRef = useRef<number>(0);

    const startCall = async () => {
        if (wsRef.current) return;
        setStatus('connecting');
        setAiText('');
        nextPlayTimeRef.current = 0;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
            });
            mediaStreamRef.current = stream;

            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = import.meta.env.VITE_WS_URL || 'localhost:3001';
            const url = `${proto}//${wsHost}/acs-audio?callId=demo-phone-ui-${Date.now()}&lang=${language}`;
            
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setStatus('listening');

                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                audioContextRef.current = audioCtx;
                nextPlayTimeRef.current = audioCtx.currentTime;

                const source = audioCtx.createMediaStreamSource(stream);
                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = processor;

                processor.onaudioprocess = (e) => {
                    if (ws.readyState !== WebSocket.OPEN) return;
                    const float32Audio = e.inputBuffer.getChannelData(0);
                    const int16Audio = new Int16Array(float32Audio.length);
                    for (let i = 0; i < float32Audio.length; i++) {
                        let s = Math.max(-1, Math.min(1, float32Audio[i]));
                        int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }
                    const uint8Audio = new Uint8Array(int16Audio.buffer);
                    let binary = '';
                    for (let i = 0; i < uint8Audio.length; i++) binary += String.fromCharCode(uint8Audio[i]);
                    
                    ws.send(JSON.stringify({
                        kind: 'AudioData',
                        audioData: { data: btoa(binary), encoding: 'base64', sampleRate: 16000, channels: 1 }
                    }));
                };

                source.connect(processor);
                processor.connect(audioCtx.destination);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    
                    if (msg.kind === 'AudioData') {
                        setStatus('speaking');
                        playAudioChunk(msg.audioData.data);
                    } else if (msg.kind === 'TextResponse') {
                        setAiText(msg.text);
                    }
                } catch (err) {
                    console.error('WebSocket receive error', err);
                }
            };

            ws.onerror = () => stopCall('error');
            ws.onclose = () => stopCall('idle');

        } catch (error) {
            console.error(error);
            stopCall('error');
        }
    };

    const playAudioChunk = (base64Data: string) => {
        const audioCtx = audioContextRef.current;
        if (!audioCtx) return;

        // Decode Base64
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert Little-Endian Int16 PCM to Float32
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        // Create buffer and source
        const buffer = audioCtx.createBuffer(1, float32Array.length, 16000);
        buffer.getChannelData(0).set(float32Array);

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);

        // Schedule strict contiguous playback
        if (nextPlayTimeRef.current < audioCtx.currentTime) {
            nextPlayTimeRef.current = audioCtx.currentTime;
        }
        
        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += buffer.duration;

        // Attach listener to flip state back to listening if this was the last queued chunk
        source.onended = () => {
            if (audioCtx.currentTime >= nextPlayTimeRef.current - 0.1) {
                setStatus(prev => prev === 'speaking' ? 'listening' : prev);
            }
        };
    };

    const stopCall = (finalStatus: 'idle' | 'error' = 'idle') => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close(1000, 'User ended call');
            wsRef.current = null;
        }
        setStatus(finalStatus);
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (!textInput.trim()) return;

        wsRef.current.send(JSON.stringify({ kind: 'TextData', text: textInput }));
        setTextInput('');
        setAiText('...'); // Loading indicator
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[90vh] z-10">
            
            {/* 3D Glassmorphism Phone Frame */}
            <div className="relative w-[340px] h-[720px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl shadow-primary/20 ring-1 ring-white/10 before:absolute before:inset-0 before:rounded-[3rem] before:bg-gradient-to-b before:from-slate-700/50 before:to-slate-900/50">
                
                {/* Hardware details */}
                <div className="absolute top-0 inset-x-0 h-7 flex items-end justify-center z-20">
                    <div className="w-32 h-6 bg-black rounded-b-3xl"></div>
                </div>

                {/* Inner Screen */}
                <div className="relative w-full h-full bg-background-dark rounded-[2.25rem] overflow-hidden flex flex-col">
                    
                    {/* Animated Background */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <div className={`absolute -top-[20%] -left-[50%] w-[200%] h-[100%] rounded-full opacity-30 blur-[100px] transition-all duration-1000 ${
                            status === 'listening' ? 'bg-primary scale-110 translate-y-20' : 
                            status === 'speaking' ? 'bg-accent-teal scale-125 translate-y-40 animate-pulse' : 
                            'bg-primary/20 scale-100'
                        }`} />
                    </div>

                    {/* App Header */}
                    <div className="relative z-10 px-6 pt-12 pb-4 flex justify-between items-center text-white">
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value as any)}
                            disabled={status !== 'idle' && status !== 'error'}
                            className="bg-white/10 border border-white/20 text-white text-xs rounded-full px-3 py-1 outline-none appearance-none cursor-pointer hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                            <option value="en-IN" className="text-black">English (India)</option>
                            <option value="hi-IN" className="text-black">Hindi</option>
                            <option value="mr-IN" className="text-black">Marathi</option>
                            <option value="te-IN" className="text-black">Telugu</option>
                            <option value="ta-IN" className="text-black">Tamil</option>
                            <option value="bn-IN" className="text-black">Bengali</option>
                            <option value="gu-IN" className="text-black">Gujarati</option>
                            <option value="kn-IN" className="text-black">Kannada</option>
                        </select>
                        <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                        </div>
                    </div>

                    {/* Main UI Area */}
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
                        
                        {/* Dynamic Avatar / Status Ring */}
                        <div className="relative mb-8">
                            {status === 'listening' && (
                                <>
                                    <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-40 scale-150"></div>
                                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse scale-125"></div>
                                </>
                            )}
                            {status === 'speaking' && (
                                <>
                                    <div className="absolute inset-0 rounded-full border-2 border-accent-teal animate-ping opacity-40 scale-[2.0]"></div>
                                    <div className="absolute inset-0 rounded-full border border-accent-teal animate-ping opacity-20 scale-[2.5]" style={{ animationDelay: '300ms' }}></div>
                                </>
                            )}
                            
                            <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 z-10 relative ${
                                status === 'idle' ? 'bg-slate-800' :
                                status === 'listening' ? 'bg-primary' :
                                status === 'speaking' ? 'bg-accent-teal' :
                                'bg-slate-800'
                            }`}>
                                <span className={`material-symbols-outlined text-6xl ${status === 'idle' ? 'text-slate-500' : 'text-background-dark'}`}>
                                    {status === 'idle' ? 'mic_off' : status === 'listening' ? 'mic' : status === 'speaking' ? 'graphic_eq' : 'error'}
                                </span>
                            </div>
                        </div>

                        {/* Text Status */}
                        <h2 className="text-2xl font-black text-white mb-2 transition-all">
                            {status === 'idle' ? 'Ready to Call' :
                             status === 'connecting' ? 'Connecting...' :
                             status === 'listening' ? 'Listening...' :
                             status === 'speaking' ? 'AI Responding' :
                             'Connection Error'}
                        </h2>

                        {/* AI Subtitle Captions */}
                        <div className="h-24 w-full flex items-center justify-center">
                            <p className="text-base text-slate-300 italic px-2 transition-all line-clamp-3">
                                {aiText ? `"${aiText}"` : (status === 'listening' && 'Speak your question...')}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="relative z-10 p-6 pb-12 w-full flex flex-col gap-6 mt-auto bg-gradient-to-t from-black via-black/80 to-transparent">
                        
                        {/* Action Switcher */}
                        {status === 'idle' || status === 'error' ? (
                            <button 
                                onClick={startCall}
                                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-110 transition-transform"
                            >
                                <span className="material-symbols-outlined text-3xl">call</span>
                            </button>
                        ) : (
                            <button 
                                onClick={() => stopCall('idle')}
                                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white mx-auto shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-110 transition-transform"
                            >
                                <span className="material-symbols-outlined text-3xl">call_end</span>
                            </button>
                        )}
                        
                        {/* Text Input Fallback (only visible during call) */}
                        <form onSubmit={handleTextSubmit} className={`transition-all duration-300 ${status === 'idle' ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                            <div className="relative flex items-center">
                                <input 
                                    type="text" 
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Or type a message..." 
                                    className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-5 pr-12 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button type="submit" className="absolute right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background-dark hover:scale-105 transition-transform disabled:opacity-50" disabled={!textInput.trim()}>
                                    <span className="material-symbols-outlined text-sm">send</span>
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>

            {/* Admin & Portal Links Layer */}
            <div className="relative z-10 mt-10 text-center flex gap-6">
                <Link to="/portal" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    User Portal
                </Link>
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Admin Console
                </Link>
            </div>

        </div>
    );
}
