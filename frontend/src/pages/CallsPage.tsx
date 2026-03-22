import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { CallMetrics } from '../types';

export default function CallsPage() {
    const [calls, setCalls] = useState<CallMetrics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCalls();
    }, []);

    const loadCalls = async () => {
        try {
            const data = await api.getRecentCalls();
            setCalls(data);
        } catch (err) {
            console.error('Failed to load calls', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-background-dark min-h-[calc(100vh-80px)] text-slate-100 overflow-hidden font-display audio-wave-bg">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">

                {/* Header Setup */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black mb-2">Query Explorer</h1>
                        <p className="text-slate-400 text-sm">Analyze raw dialect interactions across the network.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-1 bg-surface-dark border flex border-border-dark rounded-xl">
                            <button className="px-4 py-2 bg-slate-custom rounded-lg text-xs font-bold shadow-md text-white">24h</button>
                            <button className="px-4 py-2 text-slate-400 rounded-lg text-xs font-bold hover:text-white transition-colors">7d</button>
                            <button className="px-4 py-2 text-slate-400 rounded-lg text-xs font-bold hover:text-white transition-colors">30d</button>
                        </div>
                        <button className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-all">
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Top Mini Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Total Queries (24h)</p>
                            <h3 className="text-2xl font-black">14,209</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">forum</span>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-accent-teal font-bold uppercase tracking-widest mb-1">Avg. Latency</p>
                            <h3 className="text-2xl font-black">112ms</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                            <span className="material-symbols-outlined">speed</span>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Dialect Spread</p>
                            <h3 className="text-2xl font-black">16</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined">language</span>
                        </div>
                    </div>
                </div>

                {/* Explorer List */}
                <div className="glass-panel rounded-3xl overflow-hidden border border-border-dark flex flex-col">
                    <div className="p-4 border-b border-border-dark flex items-center justify-between bg-surface-dark/50">
                        <h3 className="font-bold text-sm">Recent Transcripts</h3>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-mono">1-50 of 14,209</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                            </div>
                        ) : calls.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No calls found in this timeframe.</div>
                        ) : (
                            <div className="divide-y divide-border-dark">
                                {calls.map((call) => (
                                    <div key={call.id} className="p-6 hover:bg-slate-custom/20 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-primary flex flex-col md:flex-row gap-6">
                                        {/* Meta */}
                                        <div className="w-full md:w-1/4 shrink-0 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                                    {call.language}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <span className="material-symbols-outlined text-[14px]">timer</span>
                                                {call.duration}s
                                            </div>
                                        </div>

                                        {/* Transcript Thread */}
                                        <div className="flex-1 space-y-4">
                                            {/* User Bubble */}
                                            <div className="flex gap-3">
                                                <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                                                    <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                                </div>
                                                <div className="bg-surface-dark border border-border-dark p-3 rounded-2xl rounded-tl-none text-sm text-slate-300">
                                                    "{call.transcript || 'Audio snippet being processed...'}"
                                                </div>
                                            </div>

                                            {/* AI Bubble */}
                                            <div className="flex gap-3">
                                                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 glow-saffron">
                                                    <span className="material-symbols-outlined text-sm text-primary">graphic_eq</span>
                                                </div>
                                                <div className="bg-slate-custom p-3 rounded-2xl rounded-tl-none border border-slate-700 text-sm">
                                                    <p className="text-slate-200">
                                                        {call.aiResponse || 'Processing response formulation and knowledge retrieval...'}
                                                    </p>
                                                    <div className="mt-2 text-[10px] text-accent-teal font-mono flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="material-symbols-outlined text-[12px]">done_all</span> Latency: 104ms
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Fallback mock data if API is empty for demonstration */}
                        {calls.length === 0 && !loading && (
                            <div className="divide-y divide-border-dark">
                                <div className="p-6 hover:bg-slate-custom/20 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-primary flex flex-col md:flex-row gap-6">
                                    <div className="w-full md:w-1/4 shrink-0 flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                                HINDI
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">14:12</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <span className="material-symbols-outlined text-[14px]">timer</span>45s
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-3">
                                            <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                                                <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                            </div>
                                            <div className="bg-surface-dark border border-border-dark p-3 rounded-2xl rounded-tl-none text-sm text-slate-300">
                                                "Mausam kaisa rahega agle do din?"
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 glow-saffron">
                                                <span className="material-symbols-outlined text-sm text-primary">graphic_eq</span>
                                            </div>
                                            <div className="bg-slate-custom p-3 rounded-2xl rounded-tl-none border border-slate-700 text-sm">
                                                <p className="text-slate-200">
                                                    "Agle do din mausam saaf rahega, baarish ki koi sambhavna nahi hai."
                                                </p>
                                                <div className="mt-2 text-[10px] text-accent-teal font-mono flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-[12px]">done_all</span> Latency: 84ms
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
