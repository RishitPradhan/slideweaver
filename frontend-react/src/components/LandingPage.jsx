import React, { useState, useEffect } from 'react';
import RetroButton from './RetroButton';

const LandingPage = ({ onStart }) => {
    const [typedText, setTypedText] = useState("");
    const fullText = "\"The Upside Down of documents... transformed into presentations.\"";

    useEffect(() => {
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < fullText.length) {
                setTypedText(fullText.substring(0, i + 1));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 50);

        return () => clearInterval(typingInterval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
            {/* Animated Radar Background */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
                <div className="w-[800px] h-[800px] rounded-full border border-hawkins-cyan/30 relative">
                    <div className="absolute inset-0 rounded-full border border-hawkins-cyan/20 scale-75"></div>
                    <div className="absolute inset-0 rounded-full border border-hawkins-cyan/20 scale-50"></div>
                    <div className="absolute inset-0 rounded-full border border-hawkins-cyan/20 scale-25"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-hawkins-cyan/20"></div>
                    <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-hawkins-cyan/20"></div>
                    {/* Sweeper */}
                    <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent to-hawkins-cyan origin-left animate-radar-sweep opacity-50"></div>
                </div>
            </div>

            <div className="z-10 text-center max-w-4xl w-full flex flex-col items-center animate-fade-in">
                <div className="mb-4">
                    <h2 className="text-hawkins-cyan font-terminal text-sm md:text-base tracking-widest uppercase opacity-80 mb-2">
                        Hawkins AV Club Intelligence System
                    </h2>
                </div>

                <h1 className="text-4xl md:text-6xl font-black font-orbitron text-hawkins-red text-neon-red uppercase tracking-tighter mb-8 leading-tight animate-vhs-glitch" style={{ animationDuration: '4s' }}>
                    Mr. Clarke's<br />Automated Briefing<br />Generator
                </h1>

                <div className="h-16 mb-12 flex items-center justify-center">
                    <p className="text-hawkins-text font-mono text-lg md:text-xl text-center typewriter bg-black/50 px-4 py-2 border-l-4 border-hawkins-cyan">
                        <span className="text-hawkins-cyan mr-2">{'>'}</span>
                        {typedText}
                        <span className="w-2 h-5 bg-hawkins-cyan inline-block ml-1 animate-blink align-middle"></span>
                    </p>
                </div>

                <div className="mt-8">
                    <RetroButton onClick={onStart} className="text-xl px-8 py-4">
                        Initialize Briefing System
                    </RetroButton>
                </div>
            </div>

            {/* Particles/Sparks */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-hawkins-red/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        </div>
    );
};

export default LandingPage;
