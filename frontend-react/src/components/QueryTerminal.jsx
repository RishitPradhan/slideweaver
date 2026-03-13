import React, { useState } from 'react';
import RetroButton from './RetroButton';

const QueryTerminal = ({ onGenerate, isGenerating }) => {
    const [query, setQuery] = useState('');
    const [slideCount, setSlideCount] = useState(6);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !isGenerating) {
            onGenerate(query, slideCount);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-orbitron text-hawkins-red uppercase tracking-widest text-neon-red">
                    Query Terminal
                </h2>
                <p className="text-hawkins-text/70 mt-2 text-sm font-mono uppercase">
                    Enter investigation parameters
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="border border-hawkins-red/30 bg-black/80 font-mono relative p-1 pb-4">
                    <div className="bg-hawkins-red/20 px-4 py-1 flex items-center justify-between text-xs border-b border-hawkins-red/30 mb-4">
                        <span className="text-hawkins-red">HAWKINS_TERMINAL_v1.0.4</span>
                        <span className="text-hawkins-text/50">auth: granted</span>
                    </div>

                    <div className="px-4 flex items-start gap-2">
                        <span className="text-hawkins-red font-bold mt-1">C:\&gt;</span>
                        <div className="flex-1 relative">
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Explain the strange radio signals in Hawkins..."
                                className="w-full bg-transparent text-hawkins-text outline-none resize-none min-h-[100px] placeholder-hawkins-text/30"
                                autoFocus
                                disabled={isGenerating}
                                spellCheck="false"
                            />
                            {/* Blinking cursor effect overlaying the text area slightly when focused */}
                        </div>
                    </div>
                </div>

                <div className="border border-hawkins-cyan/30 bg-black/60 p-4 font-mono">
                    <label className="flex flex-col gap-4 cursor-pointer">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-hawkins-cyan uppercase">Target Slide Count:</span>
                            <span className="text-hawkins-cyan bg-hawkins-cyan/10 px-2 py-1 border border-hawkins-cyan/30">
                                {slideCount} SLIDES
                            </span>
                        </div>
                        <input
                            type="range"
                            min="3"
                            max="15"
                            value={slideCount}
                            onChange={(e) => setSlideCount(parseInt(e.target.value))}
                            disabled={isGenerating}
                            className="w-full h-2 bg-hawkins-bg border border-hawkins-cyan/30 rounded-none appearance-none cursor-pointer accent-hawkins-cyan focus:outline-none focus:ring-1 focus:ring-hawkins-cyan"
                        />
                    </label>
                </div>

                <div className="flex justify-center mt-4">
                    <RetroButton
                        type="submit"
                        disabled={!query.trim() || isGenerating}
                        variant="primary"
                        className="w-full text-lg py-4"
                    >
                        {isGenerating ? 'GENERATING BRIEFING...' : 'GENERATE BRIEFING'}
                    </RetroButton>
                </div>
            </form>
        </div>
    );
};

export default QueryTerminal;
