import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-trigger demo if redirected from Landing Page demo button
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('demo') === 'true') {
            handleDemoLogin();
        }
    }, []);

    const handleDemoLogin = async () => {
        setLoading(true);
        setError('');
        try {
            // Attempt a demo login with pre-configured developer credentials
            await login('demo@askbox.in', 'askbox1234');
            navigate('/dashboard');
        } catch (err: any) {
            setError('Demo account not yet initialized. Please Register or contact the developer.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await api.register(email, password, name);
                await login(email, password);
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || (isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Please check your details.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background-dark relative overflow-hidden">
            {/* Left — Branding panel */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
                {/* Decorative animated waveform bars */}
                <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-end gap-1.5 opacity-20">
                    {[40, 65, 30, 80, 50, 70, 35, 90, 45, 60, 25, 75, 55].map((h, i) => (
                        <div
                            key={i}
                            className="w-1.5 rounded-full bg-primary"
                            style={{
                                height: `${h}px`,
                                animation: `pulse ${1.5 + i * 0.15}s ease-in-out infinite alternate`,
                            }}
                        />
                    ))}
                </div>

                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-background-dark text-2xl font-bold">graphic_eq</span>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-100">AskBox</h2>
                    </div>
                    <p className="text-xs text-primary/50 uppercase font-bold tracking-widest">AI for Social Good</p>
                </div>

                <div className="max-w-md">
                    <h1 className="text-5xl font-black tracking-tight text-slate-100 leading-tight mb-6">
                        Knowledge for
                        <br />
                        <span className="text-primary">Every Voice.</span>
                    </h1>
                    <p className="text-slate-400 leading-relaxed">
                        Empowering rural India with AI-powered voice intelligence on any basic phone.
                        No internet required, just a simple phone call to access the world's knowledge.
                    </p>

                    {/* Impact counters */}
                    <div className="flex gap-8 mt-10">
                        <div>
                            <div className="text-2xl font-black text-primary">120k+</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Questions Answered</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-accent-teal">9</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Languages</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-100">45k</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Users</div>
                        </div>
                    </div>
                </div>

                <p className="text-[10px] text-slate-600">© 2024 AskBox Intelligence Systems. Team Node — Nagmani Jha</p>
            </div>

            {/* Right — Login form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-background-dark text-2xl font-bold">graphic_eq</span>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight">AskBox</h2>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight mb-1">{isLogin ? 'Welcome back' : 'Create an account'}</h3>
                    <p className="text-sm text-slate-500 mb-8">{isLogin ? 'Sign in to the admin console' : 'Register to manage AskBox'}</p>

                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">Name</label>
                                <input
                                    id="register-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="John Doe"
                                    required={!isLogin}
                                    autoFocus={!isLogin}
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                placeholder="admin@askbox.in"
                                required
                                autoFocus={isLogin}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">Password</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-background-dark py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                            {loading ? (isLogin ? 'Signing in...' : 'Signing up...') : (isLogin ? 'Sign In →' : 'Sign Up →')}
                        </button>

                        {isLogin && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleDemoLogin}
                                    className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors border border-slate-700"
                                >
                                    <span className="material-symbols-outlined text-sm">explore</span>
                                    Explore Demo →
                                </button>
                                <p className="text-[10px] text-slate-600 text-center mt-2">No registration required for demo access</p>
                            </div>
                        )}
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                }}
                                className="text-primary font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>

                    <p className="text-center text-[10px] text-slate-600 mt-8">
                        Empowering rural education through AI-powered voice assistance
                    </p>
                </div>
            </div>

            {/* Inline keyframes */}
            <style>{`
        @keyframes pulse {
          0% { transform: scaleY(0.6); }
          100% { transform: scaleY(1); }
        }
      `}</style>
        </div>
    );
}
