import React, { useState, useEffect } from 'react';
import VecnaEscape from './VecnaEscape';

const ProcessingScreen = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const duration = 20000; // Assume 20s for processing
        const interval = 500;
        const step = (100 / (duration / interval));

        const timer = setInterval(() => {
            setProgress(p => {
                if (p >= 99) return 99;
                return Math.min(99, p + step);
            });
        }, interval);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-10 animate-fade-in py-12 relative z-10">
            {/* Radar Scanner Animation */}
            <div className="relative w-56 h-56 rounded-full border-4 border-hawkins-red neon-glow-red flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-sm">
                <div className="absolute inset-4 rounded-full border-2 border-hawkins-red/20"></div>
                <div className="absolute inset-10 rounded-full border border-hawkins-red/10"></div>
                <div className="absolute w-full h-[1px] bg-hawkins-red/30 top-1/2 -translate-y-1/2"></div>
                <div className="absolute h-full w-[1px] bg-hawkins-red/30 left-1/2 -translate-x-1/2"></div>
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(255,42,42,0.4)_360deg)] origin-center animate-radar-sweep rounded-full"></div>
                <div className="absolute w-4 h-4 bg-white rounded-full animate-ping z-10 shadow-[0_0_15px_#ffffff]"></div>
                <div className="absolute w-2 h-2 bg-white rounded-full z-20 shadow-[0_0_10px_#ffffff]"></div>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full max-w-lg glass-panel p-6 border-hawkins-red/20">
                <div className="flex justify-between items-end text-xs font-mono text-hawkins-red/60 mb-3 tracking-widest">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-hawkins-red animate-pulse"></span>
                        SYSTEM_SYNTHESIS_PROGRESS
                    </span>
                    <span className="text-lg font-bold neon-glow-red">{Math.floor(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-black/60 border border-hawkins-red/30 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-hawkins-red/40 to-hawkins-red transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,42,42,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Vecna Escape Game Container */}
            <div className="w-full glass-panel border-hawkins-red/30 p-0 shadow-[0_0_30px_rgba(255,42,42,0.05)] overflow-hidden">
                <div className="bg-hawkins-red/10 px-4 py-2 flex items-center justify-between text-[10px] border-b border-hawkins-red/30 tracking-widest text-hawkins-red">
                    <span className="font-bold flex items-center gap-2">
                        VECNA_SIMULATION_ACTIVE
                    </span>
                    <span className="animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
                        SYSTEM: ONLINE
                    </span>
                </div>

                <div className="w-full bg-black flex justify-center items-center">
                    <VecnaEscape />
                </div>

                <div className="bg-black/40 px-4 py-1 text-[8px] font-mono text-hawkins-text/20 uppercase tracking-[0.5em] text-center border-t border-hawkins-red/10">
                    Stay Alive Until Briefing Generates - Hawkins National Laboratory Secure Line
                </div>
            </div>
        </div>
    );
};

export default ProcessingScreen;
