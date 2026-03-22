import PhoneUI from '../components/PhoneUI';

export default function LandingPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300 relative overflow-hidden flex justify-center items-center">
            
            {/* Dynamic Mesh Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background-dark to-background-dark"></div>
            </div>

            <PhoneUI />
            
        </div>
    );
}
