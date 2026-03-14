import React, { useState, useEffect } from 'react';

const ProcessingScreen = () => {
    const [logs, setLogs] = useState([]);
    const [currentLogIndex, setCurrentLogIndex] = useState(0);

    const processingLogs = [
        "INITIALIZING SYSTEM OVERRIDE...",
        "ACCESSING UPLOADED DOCUMENTS...",
        "SCANNING DOCUMENTS FOR ANOMALIES...",
        "EXTRACTING ENTITIES & KEY CONCEPTS...",
        "BUILDING VECTOR SPACE INDEX...",
        "CONNECTING TO GEMINI AI...",
        "SYNTHESIZING KNOWLEDGE GRAPH...",
        "GENERATING SLIDE STRUCTURE...",
        "PROCESSING IMAGE ASSETS...",
        "APPLYING DYNAMIC THEME PALETTE...",
        "RENDERING PRESENTATION ARTIFACT...",
        "FINALIZING PPTX OUTPUT...",
    ];

    useEffect(() => {
        if (currentLogIndex < processingLogs.length) {
            const timer = setTimeout(() => {
                setLogs(prev => [...prev, processingLogs[currentLogIndex]]);
                setCurrentLogIndex(prev => prev + 1);
            }, Math.random() * 1000 + 500);
            return () => clearTimeout(timer);
        }
    }, [currentLogIndex]);

    const progress = Math.round((currentLogIndex / processingLogs.length) * 100);

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-10 animate-fade-in py-12 relative z-10">
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
                    <span className="text-lg font-bold neon-glow-red">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-black/60 border border-hawkins-red/30 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-hawkins-red/40 to-hawkins-red transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,42,42,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="w-full glass-panel border-hawkins-red/30 p-0 min-h-[350px] shadow-[0_0_30px_rgba(255,42,42,0.05)]">
                <div className="bg-hawkins-red/10 px-4 py-2 flex items-center justify-between text-[10px] border-b border-hawkins-red/30 tracking-widest text-hawkins-red">
                    <span className="font-bold flex items-center gap-2">
                        INTELLIGENCE_STREAMING_CHANNEL_ACTIVE
                    </span>
                    <span className="animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
                        GEMINI_AI_LINK: SYNC
                    </span>
                </div>

                <div className="p-6 space-y-3 h-[250px] overflow-y-auto terminal-scrollbar font-mono text-sm sm:text-base bg-black/20">
                    {logs.map((log, index) => (
                        <div key={index} className="flex gap-3 items-start animate-fade-in" style={{ animationDuration: '0.4s' }}>
                            <span className="text-hawkins-red font-bold opacity-80 shrink-0">{'>'}</span>
                            <span className="text-hawkins-text font-terminal tracking-wide leading-relaxed">
                                {log}
                            </span>
                        </div>
                    ))}
                    {currentLogIndex < processingLogs.length && (
                        <div className="flex gap-2 mt-2">
                            <span className="text-hawkins-red font-bold opacity-80 shrink-0">{'>'}</span>
                            <span className="terminal-cursor text-hawkins-red"></span>
                        </div>
                    )}
                </div>

                <div className="bg-black/40 px-4 py-1 text-[8px] font-mono text-hawkins-text/20 uppercase tracking-[0.5em] text-center border-t border-hawkins-red/10">
                    Transmission Encrypted - Hawkins National Laboratory Secure Line
                </div>
            </div>
        </div>
    );
};

export default ProcessingScreen;
