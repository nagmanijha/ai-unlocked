import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/calls', label: 'Call Logs', icon: 'call' },
    { path: '/knowledge', label: 'Knowledge Base', icon: 'menu_book' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
            {/* Header / Top Navbar */}
            <header className="flex items-center justify-between border-b border-primary/20 bg-background-dark px-6 py-3 shrink-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-background-dark text-2xl font-bold">graphic_eq</span>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight">AskBox</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`text-sm font-medium transition-colors ${isActive
                                            ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                                            : 'text-slate-400 hover:text-primary'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            className="bg-primary/5 border-none rounded-full pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-primary min-w-[240px] outline-none"
                            placeholder="Global search..."
                            type="text"
                        />
                    </div>
                    <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <span className="material-symbols-outlined text-primary text-xl">notifications</span>
                    </div>
                    <div
                        className="size-9 rounded-full bg-primary flex items-center justify-center text-background-dark font-bold text-sm cursor-pointer ring-2 ring-primary/20"
                        title={user?.name || 'Admin'}
                    >
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>

                    {/* Mobile hamburger */}
                    <button className="md:hidden text-slate-400" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <aside
                    className={`w-64 border-r border-primary/10 bg-background-dark/50 flex flex-col p-6 shrink-0 overflow-y-auto custom-scrollbar
            fixed inset-y-[57px] left-0 z-50 md:static md:inset-auto transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                >
                    <div className="mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-4">Navigation</h3>
                        <div className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                                ? 'bg-primary/10 text-primary font-semibold'
                                                : 'text-slate-400 hover:bg-primary/5'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                        <span className="text-sm">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* User & Logout at bottom */}
                    <div className="mt-auto pt-6 border-t border-primary/10">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent-teal/10 border border-primary/20">
                            <p className="text-xs font-bold text-primary mb-1">Team Node</p>
                            <p className="text-[10px] text-slate-400 mb-3">{user?.email || 'admin@askbox.in'}</p>
                            <button
                                onClick={logout}
                                className="w-full text-xs py-1.5 rounded bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-background-dark">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
