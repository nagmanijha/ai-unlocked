import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { OverviewMetrics } from '../types';
import DemoCallTracker from '../components/DemoCallTracker';

const DEMO_SCENARIOS = [
    {
        id: 'hi',
        language: 'Hindi',
        state: 'Uttar Pradesh',
        activeCalls: '6.8M',
        accuracy: '99.4%',
        errorRate: '1.2%',
        compute: '5.4 TFlops',
        load: '82%',
        nodes: '52/52',
        labels: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
        query: 'कल का मौसम कैसा रहेगा?',
        translation: 'How will the weather be tomorrow?',
        color: 'primary'
    },
    {
        id: 'mr',
        language: 'Marathi',
        state: 'Maharashtra',
        activeCalls: '5.2M',
        accuracy: '98.5%',
        errorRate: '2.5%',
        compute: '4.2 TFlops',
        load: '72%',
        nodes: '45/45',
        labels: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
        query: 'आजचे मार्केट भाव काय आहेत?',
        translation: "What are today's market prices?",
        color: 'accent-teal'
    },
    {
        id: 'ta',
        language: 'Tamil',
        state: 'Tamil Nadu',
        activeCalls: '4.4M',
        accuracy: '99.2%',
        errorRate: '1.8%',
        compute: '3.8 TFlops',
        load: '65%',
        nodes: '32/32',
        labels: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
        query: 'பயிர் நோய்கள் பற்றி சொல்லுங்கள்',
        translation: 'Tell me about crop diseases',
        color: 'primary'
    }
];

export default function DashboardPage() {
    const { isDemoMode } = useAuth();

    // Initialize based on URL param if present
    const [activeScenario, setActiveScenario] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang');
        return DEMO_SCENARIOS.find(s => s.id === lang) || DEMO_SCENARIOS[0];
    });

    const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
        // Simulate real-time updates
        const interval = setInterval(loadMetrics, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadMetrics = async () => {
        try {
            let data;
            if (isDemoMode) {
                // Return high-quality mock data for demo purposes
                data = {
                    totalCallsToday: 1245,
                    averageCallDuration: 184,
                    activeCallsCount: 12402,
                    topLanguages: [
                        { language: 'Hindi', count: 45000 },
                        { language: 'Bhojpuri', count: 28000 },
                        { language: 'Maithili', count: 12000 }
                    ],
                    topQuestions: [
                        { question: 'Crop diseases', count: 1200 },
                        { question: 'Weather forecast', count: 850 },
                        { question: 'Market prices', count: 720 }
                    ]
                };
            } else {
                data = await api.getAnalyticsOverview();
            }

            setMetrics({
                ...data,
                activeCalls: isDemoMode ? 12402 + Math.floor(Math.random() * 50) : Math.floor(Math.random() * 500) + 12000,
            });
        } catch (err) {
            console.error('Failed to load metrics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !metrics) {
        return (
            <div className="flex items-center justify-center h-96">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-12 space-y-8 bg-background-dark min-h-[calc(100vh-80px)] text-slate-100">
            {isDemoMode && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">explore</span>
                        <div>
                            <p className="text-sm font-bold text-slate-100 italic">DEMO_CLUSTER_{activeScenario.id.toUpperCase()} ACTIVE</p>
                            <p className="text-[10px] text-slate-400">Viewing simulated telemetry for {activeScenario.language} region.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
                        {DEMO_SCENARIOS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveScenario(s)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeScenario.id === s.id ? 'bg-primary text-background-dark' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {s.language}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Header handled by Layout, so we just start with the Hero Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Global Compute */}
                <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-5xl text-primary">memory</span>
                    </div>
                    <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Global Compute</p>
                    <h3 className="text-3xl font-black mt-1 text-slate-100">{isDemoMode ? activeScenario.compute : '88.4%'}</h3>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full w-[88%]"></div>
                        </div>
                        <span className="text-[10px] font-bold text-accent-teal">+2.1%</span>
                    </div>
                </div>

                {/* STT Accuracy */}
                <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-5xl text-accent-teal">translate</span>
                    </div>
                    <p className="text-xs font-bold text-accent-teal/60 uppercase tracking-widest">STT Accuracy</p>
                    <h3 className="text-3xl font-black mt-1 text-slate-100">{isDemoMode ? activeScenario.accuracy : '99.12%'}<span className="text-lg font-normal text-slate-500"></span></h3>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-accent-teal/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-teal rounded-full w-[99%]"></div>
                        </div>
                        <span className="text-[10px] font-bold text-accent-teal">STABLE</span>
                    </div>
                </div>

                {/* Active Threads */}
                <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-5xl text-primary">call</span>
                    </div>
                    <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Active Threads</p>
                    <h3 className="text-3xl font-black mt-1 text-slate-100">{isDemoMode ? activeScenario.activeCalls : (metrics?.activeCalls?.toLocaleString() || '12,402')}</h3>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full w-[65%]"></div>
                        </div>
                        <span className="text-[10px] font-bold text-red-500">PEAK</span>
                    </div>
                </div>

                {/* State Nodes */}
                <div className="glass-panel p-6 rounded-xl relative overflow-hidden group border-accent-teal/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-5xl text-accent-teal">hub</span>
                    </div>
                    <p className="text-xs font-bold text-accent-teal/60 uppercase tracking-widest">State Nodes</p>
                    <h3 className="text-3xl font-black mt-1 text-slate-100">{isDemoMode ? activeScenario.nodes : '28/28'}</h3>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-accent-teal/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-teal rounded-full w-full"></div>
                        </div>
                        <span className="text-[10px] font-bold text-accent-teal">ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* Main Grid Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: AI Engine & Connectivity */}
                <div className="lg:col-span-8 space-y-8">
                    {/* AI Engine Health (Waveforms) */}
                    <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">settings_voice</span>
                                <h3 className="text-xl font-bold">AI Engine Health Pulse</h3>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">LLM V5.2</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-accent-teal"></span>
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">STT Nexus</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {/* LLM Pulse */}
                            <div className="relative">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-400">LLM Processing Pulse</span>
                                    <span className={`text-xs font-bold text-${isDemoMode ? activeScenario.color : 'primary'} tracking-widest`}>{isDemoMode ? activeScenario.accuracy : '99.4%'} OPS</span>
                                </div>
                                <div className={`h-24 w-full bg-${isDemoMode ? activeScenario.color : 'primary'}/5 rounded-lg border border-${isDemoMode ? activeScenario.color : 'primary'}/10 overflow-hidden relative`}>
                                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                        <path className="opacity-50" d="M0 50 Q 50 10, 100 50 T 200 50 T 300 50 T 400 50 T 500 50 T 600 50 T 700 50 T 800 50 T 900 50 T 1000 50" fill="none" stroke={isDemoMode ? (activeScenario.color === 'primary' ? '#f4ab25' : '#2dd4bf') : '#f4ab25'} strokeWidth="2"></path>
                                        <path d="M0 50 Q 50 80, 100 50 T 200 50 T 300 50 T 400 50 T 500 50 T 600 50 T 700 50 T 800 50 T 900 50 T 1000 50" fill="none" stroke={isDemoMode ? (activeScenario.color === 'primary' ? '#f4ab25' : '#2dd4bf') : '#f4ab25'} strokeWidth="3"></path>
                                    </svg>
                                    <div className="scanning-line absolute top-0 left-0 animate-[move_5s_infinite]"></div>
                                </div>
                            </div>

                            {/* STT Pulse */}
                            <div className="relative">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-400">STT Waveform Accuracy</span>
                                    <span className="text-xs font-bold text-accent-teal tracking-widest">{isDemoMode ? '0.08ms' : '0.12ms'} LAG</span>
                                </div>
                                <div className="h-24 w-full bg-accent-teal/5 rounded-lg border border-accent-teal/10 overflow-hidden relative">
                                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                        <path d="M0 50 L 20 45 L 40 55 L 60 30 L 80 70 L 100 40 L 120 60 L 140 20 L 160 80 L 180 40 L 200 50 L 220 30 L 240 70 L 260 40 L 280 60 L 300 20 L 320 80 L 340 40 L 360 50 L 380 30 L 400 70" fill="none" stroke="#2dd4bf" strokeWidth="2"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connectivity Pulse */}
                    <div className="glass-panel rounded-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">cell_tower</span>
                                <h3 className="text-xl font-bold">Connectivity Pulse</h3>
                            </div>
                            <div className="text-xs text-slate-500">Live feed from 28 telecom circles</div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* States */}
                            {(isDemoMode ? activeScenario.labels : ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi NCR']).map((label, idx) => (
                                <div key={label} className={`p-4 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-2 ${idx === 3 && !isDemoMode ? 'ring-1 ring-primary/40' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold">{label}</span>
                                        <span className={`h-2 w-2 rounded-full ${idx === 3 && !isDemoMode ? 'bg-primary glow-primary animate-ping' : 'bg-accent-teal glow-teal'}`}></span>
                                    </div>
                                    <div className={`text-lg font-black ${idx === 3 && !isDemoMode ? 'text-primary' : 'text-slate-200'}`}>
                                        {idx === 3 && !isDemoMode ? '82.4%' : '99.9%'}
                                    </div>
                                    <div className={`text-[10px] tracking-tighter uppercase ${idx === 3 && !isDemoMode ? 'text-primary/70 font-bold' : 'text-slate-500'}`}>
                                        {idx === 3 && !isDemoMode ? 'NODE CONGESTION' : 'SIGNAL STABLE'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 relative h-64 w-full bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center overflow-hidden">
                            {/* Map Mock */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
                            <div className="z-10 text-center">
                                <span className="material-symbols-outlined text-6xl text-primary/40 mb-2">map</span>
                                <p className="text-sm font-bold text-slate-400">Interactive Connectivity Mesh</p>
                                <p className="text-xs text-slate-500 mt-1">Overlaying 45,000+ Signal Towers</p>
                            </div>
                            <div className="absolute top-1/4 left-1/3 p-2 bg-accent-teal text-background-dark rounded shadow-lg text-[8px] font-bold">NODE_01: STABLE</div>
                            <div className="absolute bottom-1/3 right-1/4 p-2 bg-primary text-background-dark rounded shadow-lg text-[8px] font-bold">NODE_24: REROUTING</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Clusters & Allocation */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Dialect Clusters */}
                    <div className="glass-panel rounded-2xl p-8 h-fit">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-red-500">error_med</span>
                            <h3 className="text-xl font-bold">Dialect Clusters</h3>
                        </div>
                        <div className="space-y-6">
                            <p className="text-xs text-slate-400 leading-relaxed">STT performance degradation identified in specific regional pockets.</p>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                                        <span>Current Dialect</span>
                                        <span className="text-accent-teal">{isDemoMode ? activeScenario.language : 'Hindi'}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent-teal rounded-full w-[94%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                                        <span>Error Rate</span>
                                        <span className="text-red-400">{isDemoMode ? activeScenario.errorRate : '2.1%'}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full w-[15%]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-primary/10">
                                <button className="w-full py-3 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-all border border-primary/20">
                                    Optimize Dataset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Demo Call Tracker */}
                    <DemoCallTracker scenario={isDemoMode ? activeScenario : undefined} />

                    {/* Resource Allocation */}
                    <div className="glass-panel rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-accent-teal">analytics</span>
                            <h3 className="text-xl font-bold">Resource Allocation</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <div className="flex-1 glass-panel p-4 rounded-xl border-l-4 border-l-accent-teal">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Compute</p>
                                    <p className="text-xl font-black text-slate-200">{isDemoMode ? activeScenario.compute : '4.2 TFlops'}</p>
                                </div>
                                <div className="w-1/3 glass-panel p-4 rounded-xl border-l-4 border-l-primary">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Load</p>
                                    <p className="text-xl font-black text-slate-200">{isDemoMode ? activeScenario.load : '72%'}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-2/5 glass-panel p-4 rounded-xl border-l-4 border-l-primary">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">RAM</p>
                                    <p className="text-xl font-black text-slate-200">1.2 TB</p>
                                </div>
                                <div className="flex-1 glass-panel p-4 rounded-xl border-l-4 border-l-accent-teal">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Bandwidth</p>
                                    <p className="text-xl font-black text-slate-200">420 Gbps</p>
                                </div>
                            </div>
                            <div className="glass-panel p-4 rounded-xl border-l-4 border-l-slate-600 bg-slate-900/40">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Cluster: {isDemoMode ? `DEMO_${activeScenario.id.toUpperCase()}_01` : 'MUMBAI_WEST_A2'}</p>
                                        <p className="text-sm font-bold text-slate-300">Autoscaling Triggered</p>
                                    </div>
                                    <span className="material-symbols-outlined text-accent-teal animate-spin text-sm">settings</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Log Overlay */}
                    <div className="bg-black/80 rounded-2xl p-6 font-mono border border-primary/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-primary/80 uppercase">Live System Logs</span>
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        </div>
                        <div className="space-y-2 overflow-hidden h-40">
                            <p className="text-[10px] text-accent-teal/70">[14:22:01] HANDSHAKE: NODE_DELHI_04_INIT</p>
                            <p className="text-[10px] text-slate-500">[14:22:04] STT_STREAM: PACKET_LOSS_0.02%</p>
                            <p className="text-[10px] text-primary/70">[14:22:12] AUTH: USER_ID_4492_SUCCESS</p>
                            <p className="text-[10px] text-slate-500">[14:22:15] LLM_PROC: TOKENS_SEC_45.2</p>
                            <p className="text-[10px] text-red-500/70">[14:22:20] WARN: LATENCY_THRESHOLD_MUMBAI</p>
                            <p className="text-[10px] text-accent-teal/70">[14:22:25] RECOVERY: AUTO_REROUTE_SUCCESS</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
