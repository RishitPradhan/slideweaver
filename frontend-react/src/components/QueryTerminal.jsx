import React, { useState, useEffect } from 'react';
import RetroButton from './RetroButton';

const TONES = [
    { value: 'professional', label: 'PROFESSIONAL' },
    { value: 'casual', label: 'CASUAL' },
    { value: 'academic', label: 'ACADEMIC' },
    { value: 'creative', label: 'CREATIVE' },
];

const VERBOSITIES = [
    { value: 'concise', label: 'CONCISE' },
    { value: 'standard', label: 'STANDARD' },
    { value: 'detailed', label: 'DETAILED' },
];

const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
    'Hindi', 'Portuguese', 'Russian', 'Arabic',
];

const QueryTerminal = ({ onGenerate, isGenerating }) => {
    const [query, setQuery] = useState('');
    const [slideCount, setSlideCount] = useState(6);
    const [tone, setTone] = useState('professional');
    const [verbosity, setVerbosity] = useState('standard');
    const [language, setLanguage] = useState('English');
    const [template, setTemplate] = useState('hawkins_dark');
    const [includeImages, setIncludeImages] = useState(false);
    const [includeToc, setIncludeToc] = useState(false);
    const [themes, setThemes] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8000/api/themes')
            .then(res => res.json())
            .then(data => setThemes(data.themes || []))
            .catch(() => { });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !isGenerating) {
            onGenerate(query, slideCount, {
                tone, verbosity, language, template, includeImages, includeToc,
            });
        }
    };

    const SelectBox = ({ label, value, onChange, options, disabled }) => (
        <div className="flex flex-col gap-1">
            <span className="text-hawkins-cyan text-[10px] uppercase tracking-wider">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="bg-black/80 border border-hawkins-cyan/30 text-hawkins-text text-xs py-2 px-3 font-mono uppercase cursor-pointer
                           hover:border-hawkins-cyan focus:border-hawkins-cyan focus:ring-1 focus:ring-hawkins-cyan/30 outline-none
                           appearance-none transition-all duration-200"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2300ffff' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    paddingRight: '28px',
                }}
            >
                {options.map(opt => (
                    <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                        {typeof opt === 'string' ? opt : opt.label}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 animate-fade-in">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-orbitron text-hawkins-red uppercase tracking-widest text-neon-red">
                    Query Terminal
                </h2>
                <p className="text-hawkins-text/70 mt-2 text-sm font-mono uppercase">
                    Configure investigation parameters
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Topic Input */}
                <div className="border border-hawkins-red/30 bg-black/80 font-mono relative p-1 pb-4">
                    <div className="bg-hawkins-red/20 px-4 py-1 flex items-center justify-between text-xs border-b border-hawkins-red/30 mb-4">
                        <span className="text-hawkins-red">HAWKINS_TERMINAL_v2.0</span>
                        <span className="text-hawkins-text/50">auth: granted</span>
                    </div>

                    <div className="px-4 flex items-start gap-2">
                        <span className="text-hawkins-red font-bold mt-1">C:\&gt;</span>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Describe the presentation topic..."
                            className="w-full bg-transparent text-hawkins-text outline-none resize-none min-h-[80px] placeholder-hawkins-text/30"
                            autoFocus
                            disabled={isGenerating}
                            spellCheck="false"
                        />
                    </div>
                </div>

                {/* Slide Count */}
                <div className="border border-hawkins-cyan/30 bg-black/60 p-4 font-mono">
                    <label className="flex flex-col gap-3 cursor-pointer">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-hawkins-cyan uppercase">Target Slide Count:</span>
                            <span className="text-hawkins-cyan bg-hawkins-cyan/10 px-2 py-1 border border-hawkins-cyan/30">
                                {slideCount} SLIDES
                            </span>
                        </div>
                        <input
                            type="range" min="3" max="15"
                            value={slideCount}
                            onChange={(e) => setSlideCount(parseInt(e.target.value))}
                            disabled={isGenerating}
                            className="w-full h-2 bg-hawkins-bg border border-hawkins-cyan/30 rounded-none appearance-none cursor-pointer accent-hawkins-cyan"
                        />
                    </label>
                </div>

                {/* Theme Selector */}
                <div className="border border-hawkins-cyan/30 bg-black/60 p-4 font-mono">
                    <span className="text-hawkins-cyan text-[10px] uppercase tracking-wider block mb-3">Theme Preset</span>
                    <div className="grid grid-cols-3 gap-2">
                        {themes.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTemplate(t.id)}
                                disabled={isGenerating}
                                className={`p-2 border text-[10px] uppercase font-mono transition-all duration-200 flex items-center gap-2
                                    ${template === t.id
                                        ? 'border-hawkins-cyan bg-hawkins-cyan/20 text-hawkins-cyan'
                                        : 'border-hawkins-text/20 text-hawkins-text/60 hover:border-hawkins-cyan/50 hover:text-hawkins-text'
                                    }`}
                            >
                                {t.id !== 'auto' && (
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                                        style={{ backgroundColor: `#${t.primary}` }}
                                    />
                                )}
                                {t.id === 'auto' && (
                                    <span className="w-3 h-3 rounded-full shrink-0 bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                                )}
                                <span className="truncate">{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Toggle */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-hawkins-text/50 text-xs font-mono uppercase tracking-wider hover:text-hawkins-cyan transition-colors flex items-center gap-2 self-start"
                >
                    <span className="text-hawkins-cyan">{showAdvanced ? '▾' : '▸'}</span>
                    Advanced Parameters
                </button>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="border border-hawkins-cyan/20 bg-black/40 p-4 font-mono space-y-4 animate-fade-in">
                        <div className="grid grid-cols-3 gap-3">
                            <SelectBox label="Tone" value={tone} onChange={setTone} options={TONES} disabled={isGenerating} />
                            <SelectBox label="Verbosity" value={verbosity} onChange={setVerbosity} options={VERBOSITIES} disabled={isGenerating} />
                            <SelectBox label="Language" value={language} onChange={setLanguage} options={LANGUAGES} disabled={isGenerating} />
                        </div>

                        <div className="flex gap-6 pt-2 border-t border-hawkins-cyan/10">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={includeImages}
                                    onChange={(e) => setIncludeImages(e.target.checked)}
                                    disabled={isGenerating}
                                    className="w-4 h-4 accent-hawkins-cyan border-hawkins-cyan/30 bg-black"
                                />
                                <span className="text-hawkins-text/60 text-xs uppercase group-hover:text-hawkins-text transition-colors">
                                    Include Images
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={includeToc}
                                    onChange={(e) => setIncludeToc(e.target.checked)}
                                    disabled={isGenerating}
                                    className="w-4 h-4 accent-hawkins-cyan border-hawkins-cyan/30 bg-black"
                                />
                                <span className="text-hawkins-text/60 text-xs uppercase group-hover:text-hawkins-text transition-colors">
                                    Table of Contents
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="flex justify-center mt-2">
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
