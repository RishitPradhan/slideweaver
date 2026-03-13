import React, { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import RetroButton from './RetroButton';

const PresentationViewer = ({ result, onRestart }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewError, setPreviewError] = useState(null);

    const handleTogglePreview = async () => {
        if (!showPreview && !previewData) {
            try {
                const response = await fetch('http://localhost:8000/api/preview-slides');
                if (!response.ok) throw new Error('Failed to load preview');
                const data = await response.json();
                setPreviewData(data);
            } catch (error) {
                console.error('Preview error:', error);
                setPreviewError('Failed to establish link with Hawkins Lab mainframe.');
            }
        }
        setShowPreview(!showPreview);
    };

    if (!result) return null;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 animate-fade-in py-8">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-orbitron text-hawkins-cyan uppercase tracking-widest text-neon-cyan mb-2">
                    Briefing Generated
                </h2>
                <p className="text-hawkins-text/80 font-mono text-sm uppercase">
                    {result.slides_count} slides successfully synthesized
                </p>
            </div>

            <div className="w-full bg-black/60 border border-hawkins-cyan/30 p-6 flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="flex-1 font-mono space-y-4">
                    <div className="border-l-4 border-hawkins-red pl-4">
                        <h3 className="text-hawkins-text/60 text-xs mb-1">TOPIC DESIGNATION</h3>
                        <p className="text-lg text-hawkins-red">{result.title}</p>
                    </div>

                    <div className="flex gap-6 mt-4 pt-4 border-t border-hawkins-cyan/10">
                        <div>
                            <p className="text-hawkins-text/60 text-xs">FILE ID</p>
                            <p className="text-hawkins-cyan">{result.filename}</p>
                        </div>
                        <div>
                            <p className="text-hawkins-text/60 text-xs">STATUS</p>
                            <p className="text-green-500 animate-pulse">READY</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <RetroButton
                        onClick={handleTogglePreview}
                        variant="primary"
                        className="flex items-center justify-center gap-2"
                    >
                        <Eye className="w-5 h-5" />
                        {showPreview ? 'HIDE PREVIEW' : 'PREVIEW SLIDES'}
                    </RetroButton>

                    <a
                        href={`http://localhost:8000${result.download_url}`}
                        download
                        className="w-full sm:w-auto"
                    >
                        <RetroButton
                            variant="secondary"
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            DOWNLOAD PPTX
                        </RetroButton>
                    </a>
                </div>
            </div>

            {/* Retro Presentation Preview Section */}
            {showPreview && (
                <div className="w-full mt-8 animate-fade-in">
                    <h3 className="text-center font-orbitron text-hawkins-text mb-4 tracking-widest text-sm opacity-60">PROTOTYPE VIEWER</h3>
                    <div className="relative aspect-[16/9] w-full max-w-3xl mx-auto border-4 border-[#333] rounded-sm bg-[#111] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden">
                        {/* Projector light cone effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[150%] bg-gradient-to-b from-white/10 to-transparent -rotate-12 transform-gpu blur-xl pointer-events-none z-10"></div>

                        {previewData ? (
                            /* Real Slide Data */
                            <div className="absolute inset-0 bg-[#0b0c10] flex flex-col justify-center items-center p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGIwYzEwIiBmaWxsLW9wYWNpdHk9IjEiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEg4ViA4SDBWMHptNCA0SDhWIDhINFY0eiIgZmlsbD0iIzFhMWMxZCIgZmlsbC1vcGFjaXR5PSIwLjUiPjwvcGF0aD4KPC9zdmc+')] overflow-y-auto">
                                {/* Classified Overlay */}
                                <div className="absolute top-4 right-4 border-2 border-red-500/30 text-red-500/30 font-terminal text-[10px] p-1 rotate-12">
                                    CLASSIFIED
                                </div>
                                <h1 className="font-orbitron text-3xl md:text-4xl text-center text-hawkins-red text-neon-red mb-4 uppercase tracking-widest max-w-[85%]">
                                    {previewData.title || result.title}
                                </h1>
                                <div className="w-2/3 h-1 bg-hawkins-cyan shadow-[0_0_10px_#00ffff] mb-6 shrink-0"></div>

                                {previewData.slides && previewData.slides.length > 0 && (
                                    <div className="w-full max-w-[80%] space-y-8 pb-8">
                                        {/* Display the first content slide (or index 1 if available) */}
                                        {previewData.slides.slice(1, 3).map((slide, sIdx) => (
                                            <div key={sIdx} className="mb-6 animate-fade-in">
                                                <h2 className="text-hawkins-cyan font-mono text-xl mb-3 border-b border-hawkins-cyan/30 inline-block pb-1">{slide.title}</h2>
                                                {slide.bullets && (
                                                    <ul className="text-left font-mono space-y-3">
                                                        {slide.bullets.slice(0, 4).map((bullet, bIdx) => (
                                                            <li key={bIdx} className="text-hawkins-text flex items-start gap-3 text-sm">
                                                                <span className="text-hawkins-red mt-1 shrink-0">■</span>
                                                                <span>{bullet}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Loading or Error State */
                            <div className="absolute inset-0 bg-[#0b0c10] flex flex-col justify-center items-center p-8">
                                <p className="font-mono text-hawkins-cyan animate-pulse">
                                    {previewError ? `ERROR: ${previewError}` : 'LOADING PROTOTYPE DATA...'}
                                </p>
                            </div>
                        )}

                        {/* CRT Screen curve and border shadow overlay */}
                        <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,1)] pointer-events-none z-20"></div>
                    </div>
                </div>
            )}

            <div className="mt-12">
                <button
                    onClick={onRestart}
                    className="font-mono text-sm text-hawkins-text/50 hover:text-hawkins-cyan underline decoration-hawkins-cyan/30 underline-offset-4 transition-colors"
                >
                    [ TERMINATE SESSION AND RESTART ]
                </button>
            </div>
        </div>
    );
};

export default PresentationViewer;
