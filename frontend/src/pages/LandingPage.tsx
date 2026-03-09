import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DEMO_SCENARIOS = [
    {
        id: 'hi',
        language: 'Hindi',
        query: 'कल का मौसम कैसा रहेगा?',
        translation: 'How will the weather be tomorrow?',
        response: 'नमस्ते! कल उत्तर भारत में मौसम साफ रहेगा और धूप खिली रहेगी।',
        color: 'primary'
    },
    {
        id: 'mr',
        language: 'Marathi',
        query: 'आजचे मार्केट भाव काय आहेत?',
        translation: "What are today's market prices?",
        response: 'नमस्कार! आज मुंबई बाजारत कांदा २५ रुपये आणि कापूस ६५०० रुपये आहे।',
        color: 'accent-teal'
    },
    {
        id: 'ta',
        language: 'Tamil',
        query: 'பயிர் நோய்கள் பற்றி சொல்லுங்கள்',
        translation: 'Tell me about crop diseases',
        response: 'வணக்கம்! பயிர் நோய்களைத் தவிர்க்க வேப்ப எண்ணெய் அல்லது இயற்கை உரங்களைப் பயன்படுத்தலாம்.',
        color: 'primary'
    }
];

export default function LandingPage() {
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [activeScenario, setActiveScenario] = useState(DEMO_SCENARIOS[0]);
    const navigate = useNavigate();

    const launchDemo = () => {
        // Navigate to login with a demo flag and selected language
        navigate(`/login?demo=true&lang=${activeScenario.id}`);
    };
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">

            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-3xl">record_voice_over</span>
                        <span className="text-xl font-bold tracking-tight text-slate-100 uppercase tracking-widest">AskBox</span>
                    </div>
                    <div className="hidden md:flex items-center gap-10">
                        <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Our Vision</a>
                        <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Impact</a>
                        <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Technology</a>
                        <Link to="/login" className="bg-primary text-background-dark px-6 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all">
                            Sign In
                        </Link>
                    </div>
                    <button className="md:hidden text-slate-100">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex flex-col justify-center px-6 lg:px-20 overflow-hidden bg-mesh">
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
                    <div className="w-full h-[400px] flex items-end justify-center gap-1">
                        {/* Soundwave Visualization */}
                        <div className="w-2 bg-primary rounded-full h-1/4 animate-pulse"></div>
                        <div className="w-2 bg-teal-500 rounded-full h-2/4"></div>
                        <div className="w-2 bg-primary rounded-full h-3/4"></div>
                        <div className="w-2 bg-teal-500 rounded-full h-full"></div>
                        <div className="w-2 bg-primary rounded-full h-2/4"></div>
                        <div className="w-2 bg-teal-500 rounded-full h-3/4"></div>
                        <div className="w-2 bg-primary rounded-full h-1/2"></div>
                        <div className="w-2 bg-teal-500 rounded-full h-full"></div>
                        <div className="w-2 bg-primary rounded-full h-2/3"></div>
                        <div className="w-2 bg-teal-500 rounded-full h-1/4"></div>
                        <div className="w-2 bg-primary rounded-full h-3/4"></div>
                        <div className="w-2 bg-teal-500 rounded-full h-full"></div>
                        <div className="w-2 bg-primary rounded-full h-1/2"></div>
                    </div>
                </div>

                <div className="relative z-10 max-w-4xl">
                    <span className="inline-block px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">Empowering Rural Connectivity</span>
                    <h1 className="text-6xl md:text-8xl font-extrabold leading-[1.1] tracking-tighter text-slate-100 mb-8">
                        Knowledge for <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-teal">Every Voice.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
                        Empowering rural India with AI-powered voice intelligence on any basic phone. No internet required, just a simple phone call to access the world's knowledge.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/login" className="bg-primary text-background-dark h-14 px-10 rounded-xl font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                            Try AskBox <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                        <button
                            onClick={() => setShowDemoModal(true)}
                            className="border border-slate-700 h-14 px-10 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            View Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* The Flow of Knowledge (Asymmetric) */}
            <section className="py-24 px-6 lg:px-20 bg-background-dark relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-20 items-start">
                        <div className="lg:w-1/3">
                            <h2 className="text-4xl font-bold mb-6 text-slate-100">The Flow of <br />Knowledge</h2>
                            <p className="text-slate-400 mb-8">We bridge the digital divide by turning every basic handset into a window for intelligent conversation.</p>
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-all">
                                    <span className="material-symbols-outlined">play_arrow</span>
                                </div>
                                <span className="font-bold">Watch the flow</span>
                            </div>
                        </div>

                        <div className="lg:w-2/3 grid grid-cols-1 gap-8 relative">
                            <div className="absolute left-8 top-12 bottom-12 w-px bg-gradient-to-b from-primary via-accent-teal to-primary hidden md:block"></div>

                            <div className="relative bg-slate-custom/30 border border-slate-800 p-8 rounded-2xl flex items-center gap-8 hover:border-primary/40 transition-all group ml-0 md:ml-12">
                                <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-background-dark shrink-0 glow-saffron">
                                    <span className="material-symbols-outlined text-3xl">phone_in_talk</span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold mb-2">Voice Call</h4>
                                    <p className="text-slate-400">Users dial a toll-free number and ask questions in their native dialect—no typing or internet needed.</p>
                                </div>
                                <span className="absolute -left-16 top-1/2 -translate-y-1/2 text-primary font-mono hidden md:block">01</span>
                            </div>

                            <div className="relative bg-slate-custom/30 border border-slate-800 p-8 rounded-2xl flex items-center gap-8 hover:border-accent-teal/40 transition-all group ml-0 md:ml-24">
                                <div className="size-16 rounded-2xl bg-accent-teal flex items-center justify-center text-background-dark shrink-0 glow-teal">
                                    <span className="material-symbols-outlined text-3xl">psychology</span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold mb-2">AI Processing</h4>
                                    <p className="text-slate-400">Our LLMs process speech-to-text, analyze intent in context, and generate accurate, localized responses.</p>
                                </div>
                                <span className="absolute -left-16 top-1/2 -translate-y-1/2 text-accent-teal font-mono hidden md:block">02</span>
                            </div>

                            <div className="relative bg-slate-custom/30 border border-slate-800 p-8 rounded-2xl flex items-center gap-8 hover:border-primary/40 transition-all group ml-0 md:ml-12">
                                <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-background-dark shrink-0 glow-saffron">
                                    <span className="material-symbols-outlined text-3xl">record_voice_over</span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold mb-2">Instant Response</h4>
                                    <p className="text-slate-400">The AI responds instantly in the same native language, providing actionable advice in real-time.</p>
                                </div>
                                <span className="absolute -left-16 top-1/2 -translate-y-1/2 text-primary font-mono hidden md:block">03</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Stats */}
            <section className="py-24 px-6 lg:px-20 bg-slate-custom/10 border-y border-slate-800">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-100">Our Growing Impact</h2>
                </div>
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="p-10 rounded-3xl bg-background-dark border border-slate-800 hover:border-primary transition-all text-center">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Questions Answered</p>
                        <h3 className="text-6xl font-black text-primary mb-2">120k+</h3>
                        <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            <span>+15% monthly growth</span>
                        </div>
                    </div>
                    <div className="p-10 rounded-3xl bg-background-dark border border-slate-800 hover:border-primary transition-all text-center">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Native Languages</p>
                        <h3 className="text-6xl font-black text-slate-100 mb-2">9</h3>
                        <div className="flex items-center justify-center gap-2 text-primary font-bold">
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>2 more in pipeline</span>
                        </div>
                    </div>
                    <div className="p-10 rounded-3xl bg-background-dark border border-slate-800 hover:border-primary transition-all text-center">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Active Users</p>
                        <h3 className="text-6xl font-black text-accent-teal mb-2">45k</h3>
                        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold">
                            <span className="material-symbols-outlined text-sm">group</span>
                            <span>Across 12 states</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Voices from the Field */}
            <section className="py-24 px-6 lg:px-20 bg-background-dark">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-bold text-slate-100 mb-16 text-center">Voices from the Field</h2>
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="size-16 rounded-full bg-slate-800 border-2 border-primary shrink-0"></div>
                            <div className="bg-slate-custom/20 p-8 rounded-2xl rounded-tl-none border border-slate-800 relative">
                                <p className="text-lg text-slate-200 italic mb-4 leading-relaxed">
                                    "I used to travel 20km to ask the market clerk about crop prices. Now I just call AskBox from my old phone and I know exactly when to sell my harvest."
                                </p>
                                <p className="text-primary font-bold">— Rajesh K., Farmer (Bihar)</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row-reverse items-start gap-6">
                            <div className="size-16 rounded-full bg-slate-800 border-2 border-accent-teal shrink-0"></div>
                            <div className="bg-slate-custom/20 p-8 rounded-2xl rounded-tr-none border border-slate-800 relative text-right">
                                <p className="text-lg text-slate-200 italic mb-4 leading-relaxed">
                                    "During the monsoon, getting medical advice was impossible. Having this voice assistant helps me triage basic symptoms for my children instantly."
                                </p>
                                <p className="text-accent-teal font-bold">— Meena S., Mother (Odisha)</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="size-16 rounded-full bg-slate-800 border-2 border-primary shrink-0"></div>
                            <div className="bg-slate-custom/20 p-8 rounded-2xl rounded-tl-none border border-slate-800 relative">
                                <p className="text-lg text-slate-200 italic mb-4 leading-relaxed">
                                    "Understanding government schemes was so difficult. AskBox explained the application process in my own language. I finally got my business loan."
                                </p>
                                <p className="text-primary font-bold">— Anita D., Entrepreneur (Rajasthan)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Modal */}
            {showDemoModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-slate-custom/30 border border-primary/20 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-primary/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">campaign</span>
                                <h3 className="text-2xl font-black text-slate-100 italic uppercase">Interactive Demo Simulation</h3>
                            </div>
                            <button
                                onClick={() => setShowDemoModal(false)}
                                className="size-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-2 justify-center bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit mx-auto">
                                {DEMO_SCENARIOS.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveScenario(s)}
                                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeScenario.id === s.id ? 'bg-primary text-background-dark shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {s.language}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-4">
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <p className="text-[10px] uppercase font-bold text-primary mb-2">Simulated User Query ({activeScenario.language})</p>
                                        <p className="text-sm italic text-slate-300">"{activeScenario.query}"</p>
                                        <p className="text-[10px] text-slate-500 mt-2">Tr: "{activeScenario.translation}"</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-accent-teal/5 border border-accent-teal/10">
                                        <p className="text-[10px] uppercase font-bold text-accent-teal mb-2">AI Response (Voice Stream)</p>
                                        <p className="text-sm text-slate-300">"{activeScenario.response}"</p>
                                    </div>
                                </div>
                                <div className="w-48 flex flex-col items-center justify-center gap-4 bg-black/40 rounded-2xl border border-white/5">
                                    <div className={`size-20 rounded-full bg-${activeScenario.id === 'mr' ? 'accent-teal' : 'primary'}/20 flex items-center justify-center relative`}>
                                        <div className={`absolute inset-0 rounded-full border-2 border-${activeScenario.id === 'mr' ? 'accent-teal' : 'primary'} animate-ping opacity-20`}></div>
                                        <span className={`material-symbols-outlined text-${activeScenario.id === 'mr' ? 'accent-teal' : 'primary'} text-4xl`}>graphic_eq</span>
                                    </div>
                                    <span className={`text-[10px] font-bold text-${activeScenario.id === 'mr' ? 'accent-teal' : 'primary'} animate-pulse tracking-widest uppercase`}>Live Synthesis</span>
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-accent-teal">shield_person</span>
                                    Full Admin Experience
                                </h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    The real power lies in the Admin Console. Monitor 120,000+ localized conversations,
                                    manage knowledge documents, and watch real-time telemetry from across the country.
                                </p>
                                <button
                                    onClick={launchDemo}
                                    className="w-full py-4 rounded-xl bg-primary text-background-dark font-black text-lg hover:scale-[1.02] transition-all shadow-lg glow-saffron"
                                >
                                    Launch Admin Dashboard Demo →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Footer */}
            <footer className="bg-background-dark border-t border-slate-800 py-12 px-6 lg:px-20 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">record_voice_over</span>
                        <span className="text-xl font-bold tracking-tight text-slate-100 uppercase">AskBox</span>
                    </div>
                    <div className="flex gap-8 text-sm text-slate-400">
                        <a href="#" className="hover:text-primary">Privacy Policy</a>
                        <a href="#" className="hover:text-primary">Terms of Service</a>
                        <a href="#" className="hover:text-primary">Contact Us</a>
                    </div>
                    <div className="flex gap-4">
                        <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-xl">share</span>
                        </div>
                        <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-xl">mail</span>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
                    © 2024 AskBox Intelligence Systems. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
