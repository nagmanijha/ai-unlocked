import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface SummaryFile {
    filename: string;
    url: string;
    createdAt: string;
}

export default function UserPortalPage() {
    const [summaries, setSummaries] = useState<SummaryFile[]>([]);
    const [selectedSummary, setSelectedSummary] = useState<SummaryFile | null>(null);
    const [summaryText, setSummaryText] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSummaries();
    }, []);

    const fetchSummaries = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/summaries');
            const json = await res.json();
            if (json.success) {
                setSummaries(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch summaries', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSummaryText = async (file: SummaryFile) => {
        setSelectedSummary(file);
        setSummaryText('Loading transcript and summary...');
        try {
            const res = await fetch(file.url);
            const text = await res.text();
            setSummaryText(text);
        } catch (error) {
            setSummaryText('Error loading file. It might have been deleted.');
        }
    };

    return (
        <div className="min-h-screen bg-background-dark text-white p-6 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full mix-blend-screen filter blur-[128px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="w-10 h-10 rounded-xl bg-surface/50 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Link>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            User Portal
                        </h1>
                    </div>
                    <div>
                        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Admin Dashboard &rarr;</Link>
                    </div>
                </header>

                {/* Main Content grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                    
                    {/* List Column */}
                    <div className="col-span-1 bg-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col overflow-hidden">
                        <h2 className="text-xl font-semibold mb-4 px-2">Recent Calls</h2>
                        
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="text-center text-gray-400 py-10">Loading calls...</div>
                            ) : summaries.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">No calls have been made yet.</div>
                            ) : (
                                summaries.map((file, idx) => (
                                    <button
                                        key={file.filename}
                                        onClick={() => loadSummaryText(file)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border ${
                                            selectedSummary?.filename === file.filename 
                                                ? 'bg-primary/20 border-primary/50' 
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="font-medium text-white truncate">Call Summary</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(file.createdAt).toLocaleString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Viewer Column */}
                    <div className="col-span-2 bg-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl relative overflow-hidden flex flex-col">
                        {!selectedSummary ? (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500 animate-pulse">
                                Select a call from the list to view its summary
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">Conversation Record</h2>
                                        <div className="text-sm text-gray-400">
                                            {new Date(selectedSummary.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <a href={selectedSummary.url} download className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                                        Download .txt
                                    </a>
                                </div>
                                <div className="flex-1 overflow-y-auto text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed custom-scrollbar pr-4">
                                    {summaryText}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}} />
        </div>
    );
}
