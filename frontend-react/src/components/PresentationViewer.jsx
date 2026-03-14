import React, { useState, useEffect, useCallback } from 'react';
import { Download, Eye, ChevronLeft, ChevronRight, List, Maximize2, Minimize2, X } from 'lucide-react';
import RetroButton from './RetroButton';

// Strip HTML tags and decode entities from LLM-generated text
const stripHtml = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ')
        .trim();
};

const cleanBullets = (bullets) => {
    if (!Array.isArray(bullets)) return bullets;
    return bullets.map(b => stripHtml(b)).filter(b => b && b.length > 0);
};

// ── Image Panel Component ───────────────────────────────────
const SlideImage = ({ slide, colors }) => {
    if (!slide.__image_path__) return null;
    return (
        <div className="h-full flex items-center justify-center p-4">
            <div className="border rounded overflow-hidden shadow-2xl max-h-full max-w-full"
                style={{ borderColor: `${colors.accent1}30`, boxShadow: `0 8px 32px rgba(0,0,0,0.5)` }}>
                <img
                    src={`http://localhost:8000/images/${slide.__image_path__}`}
                    alt={slide.title}
                    className="max-h-full max-w-full object-contain"
                    style={{ maxHeight: '350px' }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="text-center font-mono py-8 px-4 opacity-40 text-xs" style="color: ${colors.accent1}">📷 Image in PPTX</div>`;
                    }}
                />
            </div>
        </div>
    );
};

const PresentationViewer = ({ result, onRestart }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewError, setPreviewError] = useState(null);
    const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleTogglePreview = async () => {
        if (!showPreview && !previewData) {
            try {
                const response = await fetch('http://localhost:8000/api/preview-slides');
                if (!response.ok) throw new Error('Failed to load preview');
                const data = await response.json();

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

    const handleNext = useCallback(() => {
        if (previewData?.slides && currentSlideIdx < previewData.slides.length - 1) {
            setCurrentSlideIdx(prev => prev + 1);
        }
    }, [currentSlideIdx, previewData]);

    const handlePrev = useCallback(() => {
        if (currentSlideIdx > 0) {
            setCurrentSlideIdx(prev => prev - 1);
        }
    }, [currentSlideIdx]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showPreview) return;
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); handleNext(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
            if (e.key === 'Escape') {
                if (isFullscreen) setIsFullscreen(false);
                else setShowPreview(false);
            }
            if (e.key === 'f' || e.key === 'F') setIsFullscreen(prev => !prev);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPreview, isFullscreen, handleNext, handlePrev]);

    if (!result) return null;

    const themeColors = previewData?.theme_colors || result?.theme_colors || {
        primary: 'ff2a2a', background: '0b0c10',
        accent1: '00ffff', accent2: '39ff14',
        text1: 'dddddd', text2: '888888'
    };

    const colors = {
        primary: `#${themeColors.primary.replace('#', '')}`,
        bg: `#${themeColors.background.replace('#', '')}`,
        accent1: `#${themeColors.accent1.replace('#', '')}`,
        accent2: `#${themeColors.accent2?.replace('#', '') || '39ff14'}`,
        text1: `#${themeColors.text1?.replace('#', '') || 'dddddd'}`,
        text2: `#${themeColors.text2?.replace('#', '') || '888888'}`
    };

    const currentSlide = previewData?.slides?.[currentSlideIdx];
    const totalSlides = previewData?.slides?.length || 0;
    const hasImage = currentSlide?.__image_path__;

    // ── Slide Content Renderer ──────────────────────────────────
    const renderSlideContent = (slide) => {
        if (!slide) return null;

        switch (slide.type) {
            case 'title':
                return (
                    <div className="flex flex-col items-center justify-center text-center h-full w-full px-12 gap-6">
                        <div className="w-24 h-0.5 opacity-40" style={{ backgroundColor: colors.accent1 }}></div>
                        <h1
                            className="font-orbitron text-4xl lg:text-5xl xl:text-6xl uppercase tracking-wider leading-tight"
                            style={{ color: colors.primary, textShadow: `0 0 30px ${colors.primary}40` }}
                        >
                            {stripHtml(slide.title)}
                        </h1>
                        <div className="w-48 h-1 rounded" style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)` }}></div>
                        <p className="font-mono text-xl lg:text-2xl mt-2 tracking-wide" style={{ color: colors.accent1 }}>
                            {stripHtml(slide.subtitle) || result.title}
                        </p>
                        <div className="w-24 h-0.5 opacity-40 mt-4" style={{ backgroundColor: colors.accent1 }}></div>
                    </div>
                );

            case 'toc':
                return (
                    <div className="flex flex-col h-full w-full px-10 py-6">
                        <div className="flex items-center gap-3 mb-6">
                            <List className="w-5 h-5" style={{ color: colors.accent1 }} />
                            <h2 className="font-orbitron text-xl lg:text-2xl uppercase tracking-wider"
                                style={{ color: colors.primary, textShadow: `0 0 15px ${colors.primary}30` }}>
                                {stripHtml(slide.title) || 'Table of Contents'}
                            </h2>
                        </div>
                        <div className="w-full h-0.5 mb-6" style={{ background: `linear-gradient(90deg, ${colors.primary}, transparent)` }}></div>
                        <div className="flex-1 overflow-y-auto">
                            <ol className="space-y-3">
                                {cleanBullets(slide.bullet_points || slide.items || []).map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-base group transition-all duration-200 hover:translate-x-1">
                                        <span className="font-orbitron text-xs w-7 h-7 flex items-center justify-center border rounded"
                                            style={{ color: colors.accent1, borderColor: `${colors.accent1}50` }}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <span className="font-mono" style={{ color: colors.text1 }}>{item}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                );

            case 'bullet_points':
                return (
                    <div className={`flex h-full w-full ${hasImage ? 'flex-row' : 'flex-col'}`}>
                        {/* Text side */}
                        <div className={`flex flex-col ${hasImage ? 'w-1/2' : 'w-full'} px-10 py-6`}>
                            <h2 className="font-orbitron text-xl lg:text-2xl uppercase tracking-wider mb-2"
                                style={{ color: colors.primary, textShadow: `0 0 15px ${colors.primary}30` }}>
                                {stripHtml(slide.title)}
                            </h2>
                            <div className="w-full h-0.5 mb-6" style={{ background: `linear-gradient(90deg, ${colors.primary}, transparent)` }}></div>
                            <div className="flex-1 overflow-y-auto">
                                <ul className="space-y-4">
                                    {cleanBullets(slide.bullet_points || []).map((bullet, bIdx) => (
                                        <li key={bIdx} className="flex items-start gap-3 text-sm lg:text-base group">
                                            <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full shadow-lg"
                                                style={{ backgroundColor: colors.accent1, boxShadow: `0 0 6px ${colors.accent1}` }}></span>
                                            <span className="font-mono leading-relaxed" style={{ color: colors.text1 }}>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {/* Image side */}
                        {hasImage && (
                            <div className="w-1/2 border-l flex items-center justify-center"
                                style={{ borderColor: `${colors.text1}10` }}>
                                <SlideImage slide={slide} colors={colors} />
                            </div>
                        )}
                    </div>
                );

            case 'image':
                return (
                    <div className="flex h-full w-full flex-row">
                        {/* Text side — show content or bullet_points if available */}
                        <div className="w-1/2 flex flex-col px-10 py-6">
                            <h2 className="font-orbitron text-xl lg:text-2xl uppercase tracking-wider mb-2"
                                style={{ color: colors.primary, textShadow: `0 0 15px ${colors.primary}30` }}>
                                {stripHtml(slide.title)}
                            </h2>
                            <div className="w-full h-0.5 mb-6" style={{ background: `linear-gradient(90deg, ${colors.primary}, transparent)` }}></div>
                            <div className="flex-1 overflow-y-auto">
                                {slide.content && (
                                    <p className="font-mono text-sm lg:text-base leading-relaxed mb-4" style={{ color: colors.text1 }}>
                                        {stripHtml(slide.content)}
                                    </p>
                                )}
                                {slide.bullet_points && (
                                    <ul className="space-y-4">
                                        {cleanBullets(slide.bullet_points).map((bullet, bIdx) => (
                                            <li key={bIdx} className="flex items-start gap-3 text-sm lg:text-base">
                                                <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full shadow-lg"
                                                    style={{ backgroundColor: colors.accent1, boxShadow: `0 0 6px ${colors.accent1}` }}></span>
                                                <span className="font-mono leading-relaxed" style={{ color: colors.text1 }}>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {!slide.content && !slide.bullet_points && (
                                    <p className="font-mono text-sm opacity-50 italic" style={{ color: colors.text1 }}>Visual content slide</p>
                                )}
                            </div>
                        </div>
                        {/* Image side */}
                        <div className="w-1/2 border-l flex items-center justify-center"
                            style={{ borderColor: `${colors.text1}10` }}>
                            {slide.__image_path__ ? (
                                <SlideImage slide={slide} colors={colors} />
                            ) : (
                                <div className="font-mono text-sm opacity-30 text-center p-8" style={{ color: colors.text1 }}>
                                    📷 Image available in downloaded PPTX
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'content':
                return (
                    <div className={`flex h-full w-full ${hasImage ? 'flex-row' : 'flex-col'}`}>
                        {/* Text side */}
                        <div className={`flex flex-col ${hasImage ? 'w-1/2' : 'w-full'} px-10 py-6`}>
                            <h2 className="font-orbitron text-xl lg:text-2xl uppercase tracking-wider mb-2"
                                style={{ color: colors.primary, textShadow: `0 0 15px ${colors.primary}30` }}>
                                {stripHtml(slide.title)}
                            </h2>
                            <div className="w-full h-0.5 mb-6" style={{ background: `linear-gradient(90deg, ${colors.primary}, transparent)` }}></div>
                            <div className="flex-1 overflow-y-auto">
                                {slide.content && (
                                    <p className="font-mono text-sm lg:text-base leading-relaxed" style={{ color: colors.text1 }}>
                                        {stripHtml(slide.content)}
                                    </p>
                                )}
                                {slide.bullet_points && (
                                    <ul className="space-y-4 mt-4">
                                        {cleanBullets(slide.bullet_points).map((bullet, bIdx) => (
                                            <li key={bIdx} className="flex items-start gap-3 text-sm lg:text-base">
                                                <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full shadow-lg"
                                                    style={{ backgroundColor: colors.accent1, boxShadow: `0 0 6px ${colors.accent1}` }}></span>
                                                <span className="font-mono leading-relaxed" style={{ color: colors.text1 }}>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        {/* Image side */}
                        {hasImage && (
                            <div className="w-1/2 border-l flex items-center justify-center"
                                style={{ borderColor: `${colors.text1}10` }}>
                                <SlideImage slide={slide} colors={colors} />
                            </div>
                        )}
                    </div>
                );

            case 'citation':
                return (
                    <div className="flex flex-col h-full w-full px-10 py-6">
                        <h2 className="font-orbitron text-xl lg:text-2xl uppercase tracking-wider mb-2"
                            style={{ color: colors.primary, textShadow: `0 0 15px ${colors.primary}30` }}>
                            {stripHtml(slide.title) || 'References'}
                        </h2>
                        <div className="w-full h-0.5 mb-6" style={{ background: `linear-gradient(90deg, ${colors.primary}, transparent)` }}></div>
                        <div className="flex-1 overflow-y-auto">
                            {(slide.bullet_points || slide.references) ? (
                                <ul className="space-y-2">
                                    {cleanBullets(slide.bullet_points || slide.references).map((ref, rIdx) => (
                                        <li key={rIdx} className="font-mono text-xs italic opacity-70 flex items-start gap-2" style={{ color: colors.text1 }}>
                                            <span style={{ color: colors.accent1 }}>›</span>
                                            <span>{ref}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : slide.content ? (
                                <p className="font-mono text-xs italic whitespace-pre-line opacity-70" style={{ color: colors.text1 }}>{stripHtml(slide.content)}</p>
                            ) : null}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className={`flex h-full w-full ${hasImage ? 'flex-row' : 'flex-col'}`}>
                        <div className={`flex flex-col ${hasImage ? 'w-1/2' : 'w-full'} px-10 py-6`}>
                            <h2 className="font-orbitron text-xl lg:text-2xl uppercase tracking-wider mb-2"
                                style={{ color: colors.primary, textShadow: `0 0 15px ${colors.primary}30` }}>
                                {stripHtml(slide.title)}
                            </h2>
                            <div className="w-full h-0.5 mb-6" style={{ background: `linear-gradient(90deg, ${colors.primary}, transparent)` }}></div>
                            <div className="flex-1 overflow-y-auto">
                                {slide.content && (
                                    <p className="font-mono text-sm lg:text-base leading-relaxed mb-4" style={{ color: colors.text1 }}>
                                        {stripHtml(slide.content)}
                                    </p>
                                )}
                                {slide.bullet_points && (
                                    <ul className="space-y-4 mt-2">
                                        {cleanBullets(slide.bullet_points).map((bullet, bIdx) => (
                                            <li key={bIdx} className="flex items-start gap-3 text-sm lg:text-base">
                                                <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full shadow-lg"
                                                    style={{ backgroundColor: colors.accent1, boxShadow: `0 0 6px ${colors.accent1}` }}></span>
                                                <span className="font-mono leading-relaxed" style={{ color: colors.text1 }}>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        {hasImage && (
                            <div className="w-1/2 border-l flex items-center justify-center"
                                style={{ borderColor: `${colors.text1}10` }}>
                                <SlideImage slide={slide} colors={colors} />
                            </div>
                        )}
                    </div>
                );
        }
    };

    // ── Thumbnail Renderer ─────────────────────────────────────
    const renderThumbnail = (slide, idx) => {
        const isActive = idx === currentSlideIdx;
        const label = slide.type === 'title' ? '🎯' :
            slide.type === 'toc' ? '📋' :
                slide.type === 'image' ? '🖼️' :
                    slide.type === 'citation' ? '📚' :
                        slide.type === 'bullet_points' ? '•••' : '📄';

        return (
            <button
                key={idx}
                onClick={() => setCurrentSlideIdx(idx)}
                className="w-full shrink-0 text-left transition-all duration-200 rounded border-2 overflow-hidden group"
                style={{
                    borderColor: isActive ? colors.accent1 : `${colors.text1}20`,
                    backgroundColor: isActive ? `${colors.accent1}15` : `${colors.bg}CC`,
                    boxShadow: isActive ? `0 0 12px ${colors.accent1}30` : 'none',
                }}
            >
                <div className="aspect-[16/9] w-full flex flex-col justify-center items-center p-2 relative" style={{ backgroundColor: isActive ? `${colors.bg}` : `${colors.bg}B0` }}>
                    <div className="text-center">
                        <span className="text-lg">{label}</span>
                        <p className="text-[8px] font-mono mt-1 truncate w-full px-1 opacity-70"
                            style={{ color: isActive ? colors.accent1 : colors.text1 }}>
                            {stripHtml(slide.title)?.substring(0, 20) || `Slide ${idx + 1}`}
                        </p>
                    </div>
                    <div className="absolute bottom-1 right-1 text-[8px] font-mono px-1 rounded"
                        style={{ color: isActive ? colors.accent1 : `${colors.text1}60`, backgroundColor: `${colors.bg}90` }}>
                        {idx + 1}
                    </div>
                </div>
            </button>
        );
    };

    // ── RESULT CARD (before preview opens) ──────────────────────
    if (!showPreview) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-10 animate-fade-in py-8 relative z-10">
                <div className="text-center mb-4">
                    <h2 className="text-4xl font-orbitron uppercase tracking-[0.3em] mb-3 neon-glow-cyan" style={{ color: colors.accent1 }}>
                        Briefing Synthesized
                    </h2>
                    <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-hawkins-cyan to-transparent opacity-50 mb-6"></div>
                    <p className="font-mono text-xs uppercase tracking-[0.4em] opacity-60" style={{ color: colors.text1 }}>
                        [ {result.slides_count} Intelligence Nodes Generated • Protocol: {result.theme || 'hawkins_dark'} ]
                    </p>
                </div>

                <div className="w-full glass-panel border-hawkins-cyan/30 p-8 flex flex-col md:flex-row gap-10 items-center justify-between shadow-[0_0_50px_rgba(0,255,255,0.1)]">
                    <div className="flex-1 font-mono space-y-6">
                        <div className="border-l-4 pl-6 relative" style={{ borderColor: colors.primary }}>
                            {/* Subtle pulsing glow for the primary designation */}
                            <div className="absolute -left-[6px] top-0 bottom-0 w-[8px] bg-hawkins-red/20 blur-sm animate-pulse"></div>

                            <h3 className="text-[10px] mb-2 opacity-40 tracking-[0.3em] font-terminal uppercase" style={{ color: colors.text1 }}>OBJECTIVE DESIGNATION</h3>
                            <p className="text-2xl font-bold tracking-tight uppercase" style={{ color: colors.primary }}>{result.title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-hawkins-cyan/10">
                            <div>
                                <h3 className="text-[10px] mb-1 opacity-30 tracking-widest uppercase" style={{ color: colors.text1 }}>DATA_SECTOR_ID</h3>
                                <p className="text-xs truncate font-terminal" style={{ color: colors.accent1 }}>{result.filename}</p>
                            </div>
                            <div>
                                <h3 className="text-[10px] mb-1 opacity-30 tracking-widest uppercase" style={{ color: colors.text1 }}>ENCRYPTION_STATUS</h3>
                                <p className="text-xs text-green-500 font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                                    SECURE_SYNC
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 w-full md:w-auto">
                        <RetroButton onClick={handleTogglePreview} variant="primary" className="flex items-center justify-center gap-3 text-lg py-4 px-8 neon-glow-red/20 shadow-[0_0_20px_rgba(255,42,42,0.2)]">
                            <Eye className="w-6 h-6" />
                            DECODE PREVIEW
                        </RetroButton>
                        <a href={`http://localhost:8000${result.download_url}`} download className="w-full md:w-auto">
                            <RetroButton variant="secondary" className="w-full flex items-center justify-center gap-3 text-lg py-4 px-8">
                                <Download className="w-6 h-6" />
                                DOWNLOAD BRIEF
                            </RetroButton>
                        </a>
                    </div>
                </div>

                <div className="mt-8">
                    <button onClick={onRestart}
                        className="font-mono text-xs tracking-[0.3em] uppercase opacity-30 hover:opacity-100 hover:text-hawkins-red transition-all duration-300 group"
                    >
                        [ <span className="group-hover:animate-pulse">TERMINATE_CURRENT_SESSION_AND_PURGE</span> ]
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-[100]' : 'w-full'} flex flex-col relative overflow-hidden`}
            style={{ backgroundColor: colors.bg, minHeight: isFullscreen ? '100vh' : 'calc(100vh - 2rem)' }}>

            {/* Dynamic Background Grid */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-10 overflow-hidden">
                <div
                    className="absolute inset-[-100%] transform perspective-[1000px] rotate-x-[60deg] translate-y-[-20%]"
                    style={{
                        backgroundImage: `linear-gradient(${colors.accent1}30 1px, transparent 1px), linear-gradient(90deg, ${colors.accent1}30 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                ></div>
            </div>

            {/* ── Top toolbar ── */}
            <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
                style={{ backgroundColor: `${colors.bg}F0`, borderColor: `${colors.text1}15` }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowPreview(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider transition-all hover:scale-105"
                        style={{ color: colors.accent1, borderColor: `${colors.accent1}40`, backgroundColor: `${colors.accent1}10` }}>
                        <X className="w-3 h-3" />
                        Close
                    </button>
                    <div className="h-4 w-px" style={{ backgroundColor: `${colors.text1}20` }}></div>
                    <span className="font-orbitron text-xs tracking-widest uppercase" style={{ color: colors.primary }}>
                        {stripHtml(previewData?.title) || result.title}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="font-mono text-xs" style={{ color: `${colors.text1}80` }}>
                        {currentSlideIdx + 1} / {totalSlides}
                    </span>
                    <div className="h-4 w-px" style={{ backgroundColor: `${colors.text1}20` }}></div>
                    <button onClick={() => setIsFullscreen(prev => !prev)}
                        className="p-1.5 rounded border transition-all hover:scale-110"
                        style={{ color: colors.accent1, borderColor: `${colors.accent1}30` }}
                        title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}>
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <a href={`http://localhost:8000${result.download_url}`} download
                        className="p-1.5 rounded border transition-all hover:scale-110"
                        style={{ color: colors.accent1, borderColor: `${colors.accent1}30` }}
                        title="Download PPTX">
                        <Download className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* ── Main content area ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Slide thumbnails sidebar ── */}
                <div className="w-44 lg:w-52 shrink-0 border-r overflow-y-auto p-3 space-y-2"
                    style={{ backgroundColor: `${colors.bg}D0`, borderColor: `${colors.text1}10` }}>
                    <p className="font-mono text-[9px] uppercase tracking-widest mb-3 opacity-40" style={{ color: colors.text1 }}>
                        Slides
                    </p>
                    {previewData?.slides?.map((slide, idx) => renderThumbnail(slide, idx))}
                </div>

                {/* ── Main slide area ── */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-12 relative overflow-hidden"
                    style={{ backgroundColor: '#05070a' }}>

                    {/* Background Ambient Glow */}
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                        style={{ background: `radial-gradient(circle at center, ${colors.primary}20, transparent 70%)` }}></div>

                    {/* ── The Slide ── */}
                    <div className="w-full max-w-5xl aspect-[16/9] relative rounded-lg overflow-hidden shadow-2xl border crt-flicker"
                        style={{
                            backgroundColor: colors.bg,
                            borderColor: `${colors.text1}15`,
                            boxShadow: `0 0 80px rgba(0,0,0,0.8), 0 0 40px ${colors.bg}40, inset 0 0 100px rgba(0,0,0,0.5)`
                        }}>

                        {/* Corner accents - more prominent */}
                        <div className="absolute top-0 left-0 w-16 h-1" style={{ backgroundColor: `${colors.accent1}60`, boxShadow: `0 0 10px ${colors.accent1}` }}></div>
                        <div className="absolute top-0 left-0 w-1 h-16" style={{ backgroundColor: `${colors.accent1}60`, boxShadow: `0 0 10px ${colors.accent1}` }}></div>
                        <div className="absolute bottom-0 right-0 w-16 h-1" style={{ backgroundColor: `${colors.primary}60`, boxShadow: `0 0 10px ${colors.primary}` }}></div>
                        <div className="absolute bottom-0 right-0 w-1 h-16" style={{ backgroundColor: `${colors.primary}60`, boxShadow: `0 0 10px ${colors.primary}` }}></div>

                        {/* Slide number context */}
                        <div className="absolute bottom-4 left-6 font-terminal text-[10px] opacity-40 z-10 flex items-center gap-2"
                            style={{ color: colors.text1 }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-hawkins-red animate-pulse"></span>
                            SECURE_FEED_STREAMS_ACTIVE
                        </div>

                        {/* Slide number */}
                        <div className="absolute bottom-4 right-6 font-mono text-[10px] z-10 bg-black/40 px-3 py-1 border border-white/10 rounded"
                            style={{ color: colors.accent1 }}>
                            NODE: {String(currentSlideIdx + 1).padStart(2, '0')} // {String(totalSlides).padStart(2, '0')}
                        </div>

                        {/* Slide content */}
                        <div className="absolute inset-0 flex flex-col justify-center">
                            {previewData ? (
                                renderSlideContent(currentSlide)
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <p className="font-mono animate-pulse tracking-widest" style={{ color: colors.accent1 }}>
                                        {previewError ? `ERROR: ${previewError}` : 'FETCHING DATA NODES...'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Inner vignette - stronger for dark vibe */}
                        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none rounded-lg"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none"></div>
                    </div>

                    {/* ── Navigation controls ── */}
                    <div className="flex items-center justify-center gap-10 mt-10">
                        <button onClick={handlePrev} disabled={currentSlideIdx === 0}
                            className="p-3.5 rounded-full border-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 active:scale-95 shadow-lg"
                            style={{ borderColor: `${colors.accent1}60`, color: colors.accent1, backgroundColor: `${colors.accent1}10`, boxShadow: `0 0 15px ${colors.accent1}20` }}>
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-2.5 bg-black/40 px-4 py-2 rounded-full border border-white/10">
                            {previewData?.slides?.map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentSlideIdx(idx)}
                                    className="transition-all duration-300 rounded-full"
                                    style={{
                                        width: idx === currentSlideIdx ? '32px' : '8px',
                                        height: '8px',
                                        backgroundColor: idx === currentSlideIdx ? colors.accent1 : `${colors.text1}20`,
                                        boxShadow: idx === currentSlideIdx ? `0 0 12px ${colors.accent1}` : 'none',
                                    }}>
                                </button>
                            ))}
                        </div>

                        <button onClick={handleNext} disabled={currentSlideIdx === totalSlides - 1}
                            className="p-3.5 rounded-full border-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 active:scale-95 shadow-lg"
                            style={{ borderColor: `${colors.accent1}60`, color: colors.accent1, backgroundColor: `${colors.accent1}10`, boxShadow: `0 0 15px ${colors.accent1}20` }}>
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    <p className="font-mono text-[10px] mt-6 opacity-30 tracking-[0.2em] uppercase" style={{ color: colors.text1 }}>
                        <span className="text-hawkins-cyan">← →</span> NAVIGATE  •  <span className="text-hawkins-cyan">F</span> FULLSCREEN  •  <span className="text-hawkins-cyan">ESC</span> EXIT_REMOTE_LINK
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PresentationViewer;
