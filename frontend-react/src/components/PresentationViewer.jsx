import React, { useState, useEffect } from 'react';
import { Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import RetroButton from './RetroButton';

const PresentationViewer = ({ result, onRestart }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewError, setPreviewError] = useState(null);
    const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

    const handleTogglePreview = async () => {
        if (!showPreview && !previewData) {
            try {
                const response = await fetch('http://localhost:8000/api/preview-slides');
                if (!response.ok) throw new Error('Failed to load preview');
                const data = await response.json();
                setPreviewData(data);
                setCurrentSlideIdx(0);
            } catch (error) {
                console.error('Preview error:', error);
                setPreviewError('Failed to establish link with Hawkins Lab mainframe.');
            }
        }
        setShowPreview(!showPreview);
    };

    const handleNext = () => {
        if (previewData && previewData.slides && currentSlideIdx < previewData.slides.length - 1) {
            setCurrentSlideIdx(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlideIdx > 0) {
            setCurrentSlideIdx(prev => prev - 1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showPreview) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') setShowPreview(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPreview, currentSlideIdx, previewData]);

    if (!result) return null;

    const currentSlide = previewData?.slides?.[currentSlideIdx];

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 animate-fade-in py-8">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-stranger text-hawkins-cyan tracking-wider text-neon-cyan mb-2 drop-shadow-lg">
                    Briefing Generated
                </h2>
                <p className="text-hawkins-text/80 font-mono text-sm uppercase">
                    {result.slides_count} slides successfully synthesized
                </p>
            </div>

            <div className="w-full bg-black/60 border border-neon-cyan p-6 flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="flex-1 font-mono space-y-4">
                    <div className="border-l-4 border-neon-red pl-4">
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
                    <div className="flex justify-between items-center max-w-3xl mx-auto mb-2 px-4">
                        <h3 className="font-orbitron text-hawkins-text tracking-widest text-sm opacity-60 uppercase">PROTOTYPE VIEWER</h3>
                        {previewData?.slides && (
                            <div className="font-mono text-hawkins-cyan text-[10px] md:text-xs">
                                SLIDE: {currentSlideIdx + 1} / {previewData.slides.length}
                            </div>
                        )}
                    </div>

                    <div className="relative aspect-[16/9] w-full max-w-3xl mx-auto border-4 border-[#333] rounded-sm bg-[#111] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden group">
                        {/* Projector light cone effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[150%] bg-gradient-to-b from-white/10 to-transparent -rotate-12 transform-gpu blur-xl pointer-events-none z-10"></div>

                        {previewData ? (
                            /* Real Slide Data */
                            <div className="absolute inset-0 bg-[#0b0c10] flex flex-col justify-center items-center p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGIwYzEwIiBmaWxsLW9wYWNpdHk9IjEiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEg4ViA4SDBWMHptNCA0SDhWIDhINFY0eiIgZmlsbD0iIzFhMWMxZCIgZmlsbC1vcGFjaXR5PSIwLjUiPjwvcGF0aD4KPC9zdmc+')] overflow-hidden">
                                {/* Classified Overlay */}
                                <div className="absolute top-4 right-4 border-2 border-red-500/30 text-red-500/30 font-terminal text-[10px] p-1 rotate-12">
                                    CLASSIFIED
                                </div>

                                {currentSlide.type === 'title' ? (
                                    /* Title Slide Layout */
                                    <div className="flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                                        <h1 className="font-stranger text-2xl md:text-3xl text-hawkins-red text-neon-red tracking-wide px-4 break-words drop-shadow-lg">
                                            {currentSlide.title}
                                        </h1>
                                        <div className="w-1/2 h-1 bg-hawkins-red shadow-[0_0_15px_#ff003c]"></div>
                                        <p className="text-hawkins-cyan font-mono text-lg">{currentSlide.subtitle || result.title}</p>
                                    </div>
                                ) : (
                                    /* Content/Bullet Slide Layout */
                                    <div className="w-full flex flex-col h-full animate-fade-in">
                                        <h2 className="text-hawkins-red font-stranger text-xl md:text-2xl mb-4 tracking-wider border-b border-hawkins-red/30 pb-2 text-neon-red">
                                            {currentSlide.title}
                                        </h2>

                                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                            {currentSlide.type === 'bullet_points' && currentSlide.bullet_points && (
                                                <ul className="text-left font-mono space-y-4">
                                                    {currentSlide.bullet_points.map((bullet, bIdx) => (
                                                        <li key={bIdx} className="text-hawkins-text flex items-start gap-3 text-sm md:text-base">
                                                            <span className="text-hawkins-cyan mt-1.5 shrink-0 w-2 h-2 bg-hawkins-cyan shadow-[0_0_5px_#00ffff]"></span>
                                                            <span>{bullet}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {(currentSlide.type === 'content' || currentSlide.content) && currentSlide.content && (
                                                <p className="text-left font-mono text-hawkins-text text-sm md:text-base leading-relaxed">
                                                    {currentSlide.content}
                                                </p>
                                            )}

                                            {currentSlide.type === 'citation' && (
                                                <div className="space-y-4">
                                                    {(currentSlide.bullet_points || currentSlide.references) && (
                                                        <ul className="text-left font-mono space-y-2">
                                                            {(currentSlide.bullet_points || currentSlide.references).map((ref, rIdx) => (
                                                                <li key={rIdx} className="text-hawkins-text/80 text-xs italic">
                                                                    {ref}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>
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

                        {/* Navigation Overlay */}
                        {previewData && (
                            <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentSlideIdx === 0}
                                    className="p-1 md:p-2 rounded-full bg-black/50 border border-hawkins-cyan/30 text-hawkins-cyan pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hawkins-cyan/20 transition-all"
                                >
                                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={currentSlideIdx === previewData.slides.length - 1}
                                    className="p-1 md:p-2 rounded-full bg-black/50 border border-hawkins-cyan/30 text-hawkins-cyan pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hawkins-cyan/20 transition-all"
                                >
                                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                                </button>
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
