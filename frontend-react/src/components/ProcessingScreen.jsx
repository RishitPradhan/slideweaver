import React, { useState, useEffect } from 'react';

const ProcessingScreen = () => {
    const [logs, setLogs] = useState([]);
    const [currentLogIndex, setCurrentLogIndex] = useState(0);

    const processingLogs = [
        "INITIALIZING SYSTEM OVERRIDE...",
        "ACCESSING RESTRICTED FILES...",
        "SCANNING DOCUMENTS FOR ANOMALIES...",
        "EXTRACTING ENTITIES...",
        "BUILDING VECTOR SPACE...",
        "CALCULATING DIMENSIONAL RIFTS...",
        "SYNTHESIZING KNOWLEDGE GRAPH...",
        "GENERATING SLIDE STRUCTURE...",
        "APPLYING CLASSIFIED THEME...",
        "FINALIZING PRESENTATION ARTIFACT..."
    ];

    useEffect(() => {
        if (currentLogIndex < processingLogs.length) {
            const timer = setTimeout(() => {
                setLogs(prev => [...prev, processingLogs[currentLogIndex]]);
                setCurrentLogIndex(prev => prev + 1);
            }, Math.random() * 1000 + 500); // Random delay between 0.5s and 1.5s
            return () => clearTimeout(timer);
        }
    }, [currentLogIndex]);

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8 animate-fade-in py-12">
            {/* Radar Scanner Animation */}
            <div className="relative w-48 h-48 rounded-full border-4 border-hawkins-red glow-effect flex items-center justify-center overflow-hidden">
                <div className="absolute inset-2 rounded-full border border-hawkins-red/30"></div>
                <div className="absolute w-full h-[2px] bg-hawkins-red/50 top-1/2 -translate-y-1/2"></div>
                <div className="absolute h-full w-[2px] bg-hawkins-red/50 left-1/2 -translate-x-1/2"></div>
                {/* Radar beam sweep */}
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(255,42,42,0.5)_360deg)] origin-center animate-radar-sweep rounded-full"></div>
                {/* Center blip */}
                <div className="absolute w-3 h-3 bg-hawkins-cyan rounded-full animate-ping z-10"></div>
            </div>

            <div className="w-full bg-black/80 border-2 border-hawkins-cyan/50 p-6 min-h-[300px] relative font-mono text-sm sm:text-base">
                <div className="absolute top-0 left-0 w-full h-1 bg-hawkins-cyan shadow-[0_0_10px_#00ffff]"></div>

                {/* Glitch overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.2)_0%,transparent_100%)]"></div>

                <div className="flex justify-between items-center border-b border-hawkins-cyan/30 pb-2 mb-4 text-hawkins-cyan text-xs">
                    <span>PROCESSING TERMINAL</span>
                    <span className="animate-pulse">UPLINK ACTIVE</span>
                </div>

                <div className="space-y-2 h-[220px] overflow-y-auto">
                    {logs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                            <span className="text-hawkins-red shrink-0">{'>'}</span>
                            <span className="text-hawkins-text font-terminal tracking-tight leading-loose animate-fade-in" style={{ animationDuration: '0.2s' }}>
                                {log}
                            </span>
                        </div>
                    ))}
                    {currentLogIndex < processingLogs.length && (
                        <div className="flex gap-2 animate-pulse mt-2">
                            <span className="text-hawkins-cyan font-bold">_</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcessingScreen;
