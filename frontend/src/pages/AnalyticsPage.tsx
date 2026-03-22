import { useState, useEffect } from 'react';
import { api } from '../services/api';
// Assuming types exist or can be mocked
import type { LanguageDistribution } from '../types';

export default function AnalyticsPage() {
    const [languages, setLanguages] = useState<LanguageDistribution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const lang = await api.getLanguageDistribution();
            setLanguages(lang);
        } catch (err) {
            console.error('Failed to load analytics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && languages.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 mx-auto w-full bg-background-dark min-h-[calc(100vh-80px)] text-slate-100 audio-wave-bg">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary text-sm font-bold tracking-widest uppercase">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        Live Regional Engine v4.0
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
                        Regional Language <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-teal">Analytics</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl font-medium">
                        Deep-dive into dialect diversity and performance metrics across the Indian subcontinent. Real-time processing of 22+ official languages and 1,600+ dialects.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 rounded-xl bg-surface-dark border border-border-dark font-bold text-sm hover:bg-border-dark transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">download</span> Export Dataset
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-primary text-background-dark font-bold text-sm hover:shadow-[0_0_20px_rgba(244,171,37,0.4)] transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">refresh</span> Update Models
                    </button>
                </div>
            </div>

            {/* Layered Grid Layout */}
            <div className="grid grid-cols-12 gap-6">

                {/* 1. Dialect Diversity Map (Large) */}
                <div className="col-span-12 lg:col-span-8 glass-panel rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 flex gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-black text-accent-teal">84.2%</span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Coverage Intensity</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">map</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Dialect Density Grid</h3>
                            <p className="text-sm text-slate-500 font-medium">Heatmap of conversational threads by region</p>
                        </div>
                    </div>

                    <div className="relative w-full aspect-[16/9] rounded-2xl bg-background-dark/50 border border-border-dark overflow-hidden group-hover:border-primary/30 transition-colors">
                        {/* Map Placeholder Image */}
                        <div className="w-full h-full bg-surface-dark opacity-40 mix-blend-luminosity flex items-center justify-center">
                            <span className="material-symbols-outlined text-8xl text-slate-600">map</span>
                        </div>

                        {/* Floating Data Points Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full h-full">
                                {/* Heat Markers */}
                                <div className="absolute top-1/4 left-1/3 size-24 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                                <div className="absolute top-1/2 left-1/4 size-32 bg-accent-teal/10 rounded-full blur-3xl animate-pulse delay-700"></div>
                                <div className="absolute bottom-1/3 right-1/4 size-40 bg-primary/15 rounded-full blur-3xl"></div>

                                {/* Stitched lines metaphor */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 800 500">
                                    <path d="M100,100 Q400,50 700,400" fill="none" stroke="#f4ab25" strokeDasharray="4,4" strokeWidth="1"></path>
                                    <path d="M150,400 Q300,200 650,150" fill="none" stroke="#2dd4bf" strokeDasharray="4,4" strokeWidth="1"></path>
                                </svg>

                                {/* Interactive Pins */}
                                <div className="absolute top-[35%] left-[45%] group/pin cursor-pointer z-10">
                                    <div className="size-3 bg-primary rounded-full shadow-[0_0_10px_#f4ab25]"></div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-surface-dark border border-primary/50 p-2 rounded-lg opacity-0 group-hover/pin:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-primary font-bold uppercase">Hindi (Standard)</p>
                                        <p className="text-xs font-medium">98.2% Accuracy</p>
                                    </div>
                                </div>

                                <div className="absolute top-[65%] left-[55%] group/pin cursor-pointer z-10">
                                    <div className="size-3 bg-accent-teal rounded-full shadow-[0_0_10px_#2dd4bf]"></div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-surface-dark border border-accent-teal/50 p-2 rounded-lg opacity-0 group-hover/pin:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-accent-teal font-bold uppercase">Tamil (Central)</p>
                                        <p className="text-xs font-medium">94.5% Accuracy</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Scatter Plot: Accuracy vs Latency (Tall) */}
                <div className="col-span-12 lg:col-span-4 glass-panel rounded-3xl p-8 border-l-4 border-l-primary/40">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-12 rounded-2xl bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                            <span className="material-symbols-outlined text-3xl">bubble_chart</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Accuracy Index</h3>
                            <p className="text-sm text-slate-500 font-medium">Precision vs Response Time</p>
                        </div>
                    </div>

                    <div className="h-[400px] w-full relative border-l border-b border-border-dark mt-10">
                        <span className="absolute -left-8 top-0 -rotate-90 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Accuracy (%)</span>
                        <span className="absolute -bottom-8 right-0 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Latency (ms)</span>

                        <div className="absolute inset-4">
                            <div className="absolute bottom-[92%] left-[15%] group/point">
                                <div className="size-6 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center hover:scale-125 transition-transform cursor-pointer">
                                    <span className="text-[8px] font-bold">HI</span>
                                </div>
                            </div>
                            <div className="absolute bottom-[85%] left-[30%] group/point">
                                <div className="size-8 bg-accent-teal/20 border-2 border-accent-teal rounded-full flex items-center justify-center hover:scale-125 transition-transform cursor-pointer">
                                    <span className="text-[8px] font-bold text-accent-teal">MA</span>
                                </div>
                            </div>
                            <div className="absolute bottom-[78%] left-[45%] group/point">
                                <div className="size-10 bg-white/10 border-2 border-slate-400 rounded-full flex items-center justify-center hover:scale-125 transition-transform cursor-pointer">
                                    <span className="text-[8px] font-bold">TA</span>
                                </div>
                            </div>
                            <div className="absolute bottom-[60%] left-[70%] group/point">
                                <div className="size-5 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center hover:scale-125 transition-transform cursor-pointer">
                                    <span className="text-[8px] font-bold">BE</span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-[75%] inset-x-0 border-t border-dashed border-primary/20" style={{ bottom: '75%', position: 'absolute', width: '100%', borderTop: '1px dashed rgba(var(--color-primary)/0.2)' }}>
                            <span className="bg-background-dark text-[8px] px-1 text-primary/60 font-bold ml-4 relative -top-2">Target Accuracy (75%)</span>
                        </div>
                    </div>

                    <div className="mt-12 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-surface-dark/50 rounded-xl">
                            <span className="text-sm font-semibold">Top Performer</span>
                            <span className="text-primary font-bold">Hindi Standard</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-surface-dark/50 rounded-xl border border-accent-teal/20">
                            <span className="text-sm font-semibold">Fastest Growth</span>
                            <span className="text-accent-teal font-bold">Kannada (Dialect A)</span>
                        </div>
                    </div>
                </div>

                {/* 3. Top Recurring Topics: Staggered Knowledge Nodes */}
                <div className="col-span-12 lg:col-span-7 glass-panel rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-3xl">psychology</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Recurring Knowledge Nodes</h3>
                                <p className="text-sm text-slate-500 font-medium">Contextual topics identified across languages</p>
                            </div>
                        </div>
                        <select className="bg-surface-dark border-border-dark rounded-lg text-xs font-bold text-slate-400 focus:ring-primary">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                        </select>
                    </div>

                    <div className="relative h-[280px] w-full flex flex-wrap gap-4 items-center justify-center">
                        <div className="p-4 bg-primary/10 border border-primary/40 rounded-2xl flex flex-col items-center gap-1 hover:-translate-y-2 transition-transform cursor-pointer">
                            <span className="text-2xl font-black">Weather</span>
                            <span className="text-[10px] font-bold text-primary uppercase">12.4k Mentions</span>
                        </div>
                        <div className="p-6 bg-accent-teal/10 border border-accent-teal/40 rounded-[2rem] flex flex-col items-center gap-1 hover:-translate-y-2 transition-transform cursor-pointer mt-8">
                            <span className="text-3xl font-black">Agriculture</span>
                            <span className="text-[10px] font-bold text-accent-teal uppercase">28.9k Mentions</span>
                        </div>
                        <div className="p-3 bg-surface-dark border border-border-dark rounded-xl flex flex-col items-center gap-1 hover:-translate-y-2 transition-transform cursor-pointer mb-12">
                            <span className="text-lg font-bold">Payments</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">8.1k Mentions</span>
                        </div>
                        <div className="p-5 bg-white/5 border border-white/20 rounded-[1.5rem] flex flex-col items-center gap-1 hover:-translate-y-2 transition-transform cursor-pointer mt-4">
                            <span className="text-xl font-black">Medical Help</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">15.2k Mentions</span>
                        </div>
                        <div className="p-4 bg-primary/10 border border-primary/40 rounded-full flex flex-col items-center gap-1 hover:-translate-y-2 transition-transform cursor-pointer ml-4">
                            <span className="text-xl font-bold">Education</span>
                            <span className="text-[10px] font-bold text-primary uppercase">10.4k Mentions</span>
                        </div>

                        {/* Decorative Stitch Lines */}
                        <div className="absolute inset-0 -z-10 pointer-events-none">
                            <div className="absolute top-1/2 left-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent rotate-12"></div>
                            <div className="absolute bottom-1/3 right-1/4 w-48 h-[1px] bg-gradient-to-r from-transparent via-accent-teal/30 to-transparent -rotate-6"></div>
                        </div>
                    </div>
                </div>

                {/* 4. Language Growth: Area Charts (Horizontal) */}
                <div className="col-span-12 lg:col-span-5 glass-panel rounded-3xl p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-3xl">trending_up</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Global Adoption</h3>
                            <p className="text-sm text-slate-500 font-medium">Volumetric growth by language group</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2 group/chart">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold">Indo-Aryan Languages</span>
                                <span className="text-primary font-black">+14.2%</span>
                            </div>
                            <div className="h-12 w-full bg-surface-dark rounded-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/20 to-primary/40 rounded-xl" style={{ width: '82%' }}></div>
                                <svg className="absolute bottom-0 w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 20">
                                    <path d="M0,20 Q10,15 20,18 T40,10 T60,15 T80,5 T100,10 L100,20 L0,20 Z" fill="rgba(var(--color-primary)/0.3)"></path>
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-2 group/chart">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold">Dravidian Languages</span>
                                <span className="text-accent-teal font-black">+22.8%</span>
                            </div>
                            <div className="h-12 w-full bg-surface-dark rounded-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 via-accent-teal/20 to-accent-teal/40 rounded-xl" style={{ width: '91%' }}></div>
                                <svg className="absolute bottom-0 w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 20">
                                    <path d="M0,20 Q15,10 30,15 T50,5 T70,12 T90,2 T100,8 L100,20 L0,20 Z" fill="rgba(var(--color-accent-teal)/0.3)"></path>
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-2 group/chart">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold">Tibeto-Burman Dialects</span>
                                <span className="text-slate-400 font-black">+8.4%</span>
                            </div>
                            <div className="h-12 w-full bg-surface-dark rounded-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-400/5 via-slate-400/20 to-slate-400/40 rounded-xl" style={{ width: '45%' }}></div>
                                <svg className="absolute bottom-0 w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 20">
                                    <path d="M0,20 Q20,18 40,15 T60,18 T80,14 T100,16 L100,20 L0,20 Z" fill="rgba(148,163,184,0.3)"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
