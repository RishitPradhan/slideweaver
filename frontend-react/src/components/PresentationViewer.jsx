import React, { useState, useEffect } from 'react';
import { Download, Eye, ChevronLeft, ChevronRight, List } from 'lucide-react';
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

                // Fetch theme colors if not present in preview data
                if (!data.theme_colors && data.theme) {
                    const themeRes = await fetch('http://localhost:8000/api/themes');
                    const themeData = await themeRes.json();
                    const theme = themeData.themes.find(t => t.id === data.theme);
                    if (theme) data.theme_colors = theme;
                }

                setPreviewData(data);
                setCurrentSlideIdx(0);
            } catch (error) {
                console.error('Preview error:', error);
                setPreviewError('Failed to load preview data.');
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

    // Use previewData theme_colors if available, otherwise result.theme_colors, otherwise fallback
    const themeColors = previewData?.theme_colors || result.theme_colors || {
        primary: 'ff2a2a', background: '0b0c10',
        accent1: '00ffff', accent2: '39ff14',
        text1: 'dddddd', text2: '888888'
    };

    // Add '#' to hex colors
    const colors = {
        primary: `#${themeColors.primary.replace('#', '')}`,
        bg: `#${themeColors.background.replace('#', '')}`,
        accent1: `#${themeColors.accent1.replace('#', '')}`,
        accent2: `#${themeColors.accent2.replace('#', '')}`,
        text1: `#${themeColors.text1.replace('#', '')}`,
        text2: `#${themeColors.text2.replace('#', '')}`
    };

    const currentSlide = previewData?.slides?.[currentSlideIdx];

    const renderSlideContent = (slide) => {
        if (!slide) return null;

        switch (slide.type) {
            case 'title':
                return (
                    <div className="flex flex-col items-center justify-center text-center space-y-4 animate-fade-in w-full">
                        <h1 className="font-orbitron text-2xl md:text-3xl uppercase tracking-normal px-4 break-words" style={{ color: colors.primary, textShadow: `0 0 10px ${colors.primary}` }}>
                            {slide.title}
                        </h1>
                        <div className="w-1/2 h-1 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: colors.primary, color: colors.primary }}></div>
                        <p className="font-mono text-lg" style={{ color: colors.accent1 }}>{slide.subtitle || result.title}</p>
                    </div>
                );

            case 'toc':
                return (
                    <div className="w-full flex flex-col h-full animate-fade-in">
                        <h2 className="font-orbitron text-xl md:text-2xl mb-4 uppercase tracking-wider border-b pb-2 flex items-center gap-2" style={{ color: colors.primary, borderColor: `${colors.primary}4D` }}>
                            <List className="w-5 h-5" />
                            {slide.title || 'Table of Contents'}
                        </h2>
                        <div className="flex-1 overflow-y-auto">
                            <ol className="text-left font-mono space-y-3">
                                {(slide.bullet_points || slide.items || []).map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm md:text-base group cursor-pointer transition-colors" style={{ color: colors.text1 }}>
                                        <span className="font-bold min-w-[24px] text-right" style={{ color: colors.accent1 }}>{String(idx + 1).padStart(2, '0')}</span>
                                        <span className="border-b border-transparent hover:border-current" style={{ borderColor: 'transparent' }} onMouseEnter={e => e.currentTarget.style.borderColor = `${colors.accent1}4D`} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>{item}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                );

            case 'bullet_points':
                return (
                    <div className="w-full flex flex-col h-full animate-fade-in">
                        <h2 className="font-orbitron text-xl md:text-2xl mb-4 uppercase tracking-wider border-b pb-2" style={{ color: colors.primary, borderColor: `${colors.primary}4D` }}>
                            {slide.title}
                        </h2>
                        <div className="flex-1 overflow-y-auto pr-2">
                            <ul className="text-left font-mono space-y-4">
                                {(slide.bullet_points || []).map((bullet, bIdx) => (
                                    <li key={bIdx} className="flex items-start gap-3 text-sm md:text-base" style={{ color: colors.text1 }}>
                                        <span className="mt-1.5 shrink-0 w-2 h-2 shadow-[0_0_5px_currentColor]" style={{ backgroundColor: colors.accent1, color: colors.accent1 }}></span>
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div className="w-full flex flex-col h-full animate-fade-in">
                        <h2 className="font-orbitron text-xl md:text-2xl mb-4 uppercase tracking-wider border-b pb-2" style={{ color: colors.primary, borderColor: `${colors.primary}4D` }}>
                            {slide.title}
                        </h2>
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                            {slide.__image_path__ ? (
                                <div className="border-2 p-1 max-h-full max-w-full flex items-center justify-center" style={{ borderColor: `${colors.accent1}4D` }}>
                                    <img
                                        src={`http://localhost:8000/images/${slide.__image_path__}`}
                                        alt={slide.title}
                                        className="max-h-full max-w-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `<div class="text-center text-xs font-mono py-8" style="color: ${colors.accent1}99">📷 Image available in downloaded PPTX</div>`;
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="font-mono text-sm opacity-60" style={{ color: colors.text1 }}>
                                    {slide.content || 'Visual content'}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'citation':
                return (
                    <div className="w-full flex flex-col h-full animate-fade-in">
                        <h2 className="font-orbitron text-xl md:text-2xl mb-4 uppercase tracking-wider border-b pb-2" style={{ color: colors.primary, borderColor: `${colors.primary}4D` }}>
                            {slide.title || 'References'}
                        </h2>
                        <div className="flex-1 overflow-y-auto">
                            {(slide.bullet_points || slide.references) ? (
                                <ul className="text-left font-mono space-y-2">
                                    {(slide.bullet_points || slide.references).map((ref, rIdx) => (
                                        <li key={rIdx} className="text-xs italic opacity-80" style={{ color: colors.text1 }}>
                                            {ref}
                                        </li>
                                    ))}
                                </ul>
                            ) : slide.content ? (
                                <p className="text-xs font-mono italic whitespace-pre-line opacity-80" style={{ color: colors.text1 }}>{slide.content}</p>
                            ) : null}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="w-full flex flex-col h-full animate-fade-in">
                        <h2 className="font-orbitron text-xl md:text-2xl mb-4 uppercase tracking-wider border-b pb-2" style={{ color: colors.primary, borderColor: `${colors.primary}4D` }}>
                            {slide.title}
                        </h2>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {slide.content && (
                                <p className="text-left font-mono text-sm md:text-base leading-relaxed" style={{ color: colors.text1 }}>
                                    {slide.content}
                                </p>
                            )}
                            {slide.bullet_points && (
                                <ul className="text-left font-mono space-y-4 mt-4">
                                    {slide.bullet_points.map((bullet, bIdx) => (
                                        <li key={bIdx} className="flex items-start gap-3 text-sm md:text-base" style={{ color: colors.text1 }}>
                                            <span className="mt-1.5 shrink-0 w-2 h-2 shadow-[0_0_5px_currentColor]" style={{ backgroundColor: colors.accent1, color: colors.accent1 }}></span>
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 animate-fade-in py-8">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-orbitron uppercase tracking-widest mb-2" style={{ color: colors.accent1, textShadow: `0 0 10px ${colors.accent1}` }}>
                    Briefing Generated
                </h2>
                <p className="font-mono text-sm uppercase opacity-80" style={{ color: colors.text1 }}>
                    {result.slides_count} slides • Theme: {result.theme || 'hawkins_dark'}
                </p>
            </div>

            <div className="w-full border p-6 flex flex-col md:flex-row gap-8 items-center justify-between" style={{ backgroundColor: `${colors.bg}E6`, borderColor: `${colors.accent1}4D` }}>
                <div className="flex-1 font-mono space-y-4">
                    <div className="border-l-4 pl-4" style={{ borderColor: colors.primary }}>
                        <h3 className="text-xs mb-1 opacity-60" style={{ color: colors.text1 }}>TOPIC DESIGNATION</h3>
                        <p className="text-lg" style={{ color: colors.primary }}>{result.title}</p>
                    </div>

                    <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: `${colors.accent1}1A` }}>
                        <div>
                            <p className="text-xs opacity-60" style={{ color: colors.text1 }}>FILE ID</p>
                            <p style={{ color: colors.accent1 }}>{result.filename}</p>
                        </div>
                        <div>
                            <p className="text-xs opacity-60" style={{ color: colors.text1 }}>STATUS</p>
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

            {/* Presentation Preview */}
            {showPreview && (
                <div className="w-full mt-8 animate-fade-in">
                    <div className="flex justify-between items-center max-w-3xl mx-auto mb-2 px-4">
                        <h3 className="font-orbitron tracking-widest text-sm opacity-60 uppercase" style={{ color: colors.text1 }}>SLIDE VIEWER</h3>
                        {previewData?.slides && (
                            <div className="font-mono text-[10px] md:text-xs" style={{ color: colors.accent1 }}>
                                SLIDE: {currentSlideIdx + 1} / {previewData.slides.length}
                            </div>
                        )}
                    </div>

                    {/* Slide Thumbnails */}
                    {previewData?.slides && (
                        <div className="max-w-3xl mx-auto mb-4 px-4">
                            <div className="flex gap-1 overflow-x-auto pb-2">
                                {previewData.slides.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlideIdx(idx)}
                                        className={`shrink-0 px-2 py-1 text-[9px] font-mono transition-all border`}
                                        style={{
                                            borderColor: idx === currentSlideIdx ? colors.accent1 : `${colors.text1}33`,
                                            backgroundColor: idx === currentSlideIdx ? `${colors.accent1}33` : 'transparent',
                                            color: idx === currentSlideIdx ? colors.accent1 : `${colors.text1}66`
                                        }}
                                        onMouseEnter={e => { if (idx !== currentSlideIdx) e.currentTarget.style.borderColor = `${colors.accent1}80`; }}
                                        onMouseLeave={e => { if (idx !== currentSlideIdx) e.currentTarget.style.borderColor = `${colors.text1}33`; }}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative aspect-[16/9] w-full max-w-3xl mx-auto border-4 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden group" style={{ borderColor: '#333', backgroundColor: colors.bg }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[150%] bg-gradient-to-b from-white/10 to-transparent -rotate-12 transform-gpu blur-xl pointer-events-none z-10"></div>

                        {previewData ? (
                            <div className="absolute inset-0 flex flex-col justify-center items-center p-8 overflow-hidden" style={{ backgroundColor: colors.bg }}>
                                <div className="absolute top-4 right-4 border-2 font-terminal text-[10px] p-1 rotate-12" style={{ borderColor: `${colors.primary}4D`, color: `${colors.primary}4D` }}>
                                    CLASSIFIED
                                </div>
                                {renderSlideContent(currentSlide)}
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col justify-center items-center p-8" style={{ backgroundColor: colors.bg }}>
                                <p className="font-mono animate-pulse" style={{ color: colors.accent1 }}>
                                    {previewError ? `ERROR: ${previewError}` : 'LOADING PREVIEW DATA...'}
                                </p>
                            </div>
                        )}

                        {/* Navigation */}
                        {previewData && (
                            <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentSlideIdx === 0}
                                    className="p-1 md:p-2 rounded-full border pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    style={{ backgroundColor: `${colors.bg}80`, borderColor: `${colors.accent1}4D`, color: colors.accent1 }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = `${colors.accent1}33`}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = `${colors.bg}80`}
                                >
                                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={currentSlideIdx === previewData.slides.length - 1}
                                    className="p-1 md:p-2 rounded-full border pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    style={{ backgroundColor: `${colors.bg}80`, borderColor: `${colors.accent1}4D`, color: colors.accent1 }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = `${colors.accent1}33`}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = `${colors.bg}80`}
                                >
                                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                                </button>
                            </div>
                        )}

                        <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,1)] pointer-events-none z-20"></div>
                    </div>
                </div>
            )}

            <div className="mt-12">
                <button
                    onClick={onRestart}
                    className="font-mono text-sm underline underline-offset-4 transition-colors opacity-50 hover:opacity-100"
                    style={{ color: colors.text1, textDecorationColor: `${colors.accent1}4D` }}
                    onMouseEnter={e => { e.currentTarget.style.color = colors.accent1; e.currentTarget.style.textDecorationColor = colors.accent1; }}
                    onMouseLeave={e => { e.currentTarget.style.color = colors.text1; e.currentTarget.style.textDecorationColor = `${colors.accent1}4D`; }}
                >
                    [ TERMINATE SESSION AND RESTART ]
                </button>
            </div>
        </div>
    );
};

export default PresentationViewer;
