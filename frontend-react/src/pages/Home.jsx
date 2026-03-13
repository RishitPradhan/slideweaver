import React, { useState } from 'react';
import LandingPage from '../components/LandingPage';
import UploadPanel from '../components/UploadPanel';
import QueryTerminal from '../components/QueryTerminal';
import ProcessingScreen from '../components/ProcessingScreen';
import PresentationViewer from '../components/PresentationViewer';

const STAGES = {
    LANDING: 0,
    UPLOAD: 1,
    QUERY: 2,
    PROCESSING: 3,
    RESULT: 4
};

const Home = () => {
    const [stage, setStage] = useState(STAGES.LANDING);
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState(null);

    const handleStart = () => {
        document.body.classList.add('animate-vhs-glitch');
        setTimeout(() => {
            document.body.classList.remove('animate-vhs-glitch');
            setStage(STAGES.UPLOAD);
        }, 500);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('http://localhost:8000/upload-documents', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            setIsUploading(false);
            document.body.classList.add('animate-vhs-glitch');
            setTimeout(() => {
                document.body.classList.remove('animate-vhs-glitch');
                setStage(STAGES.QUERY);
            }, 500);
        } catch (error) {
            console.error('Error uploading:', error);
            setIsUploading(false);
            alert('Failed to upload documents. Please check if the backend server is running.');
        }
    };

    const handleGenerate = async (query, slideCount, options = {}) => {
        setIsGenerating(true);

        document.body.classList.add('animate-vhs-glitch');
        setTimeout(async () => {
            document.body.classList.remove('animate-vhs-glitch');
            setStage(STAGES.PROCESSING);

            try {
                const formData = new FormData();
                formData.append('topic', query);
                formData.append('num_slides', slideCount);
                formData.append('tone', options.tone || 'professional');
                formData.append('verbosity', options.verbosity || 'standard');
                formData.append('language', options.language || 'English');
                formData.append('template', options.template || 'hawkins_dark');
                formData.append('include_images', options.includeImages || false);
                formData.append('include_toc', options.includeToc || false);

                const response = await fetch('http://localhost:8000/generate-presentation', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error('Generation failed');

                const data = await response.json();

                setIsGenerating(false);
                setResult({
                    title: data.title,
                    filename: data.filename,
                    download_url: data.download_url,
                    slides_count: data.slides_count,
                    theme: data.theme,
                });

                document.body.classList.add('animate-vhs-glitch');
                setTimeout(() => {
                    document.body.classList.remove('animate-vhs-glitch');
                    setStage(STAGES.RESULT);
                }, 500);

            } catch (error) {
                console.error('Error generating:', error);
                setIsGenerating(false);
                alert('Failed to generate presentation. Please check if the backend server is running.');
                setStage(STAGES.QUERY);
            }
        }, 500);
    };

    const handleRestart = () => {
        setFiles([]);
        setResult(null);
        setStage(STAGES.LANDING);
    };

    return (
        <div className="min-h-screen bg-hawkins-bg text-hawkins-text font-mono overflow-hidden relative selection:bg-hawkins-red/30">

            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden opacity-20">
                <div className="absolute inset-[-100%] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px] transform perspective-[1000px] rotate-x-[60deg] translate-y-[-20%]"></div>
            </div>

            {/* Subtle vignette */}
            <div className="fixed inset-0 pointer-events-none z-[-1] shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"></div>

            <main className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center relative z-10 transition-opacity duration-500">

                {stage !== STAGES.LANDING && (
                    <header className="absolute top-4 left-4 right-4 flex justify-between items-center opacity-70 animate-fade-in pointer-events-none">
                        <div className="font-terminal text-[10px] md:text-xs text-hawkins-red tracking-widest uppercase">
                            SLIDEWEAVER — AI BRIEFING GENERATOR
                        </div>
                        <div className="font-mono text-xs text-hawkins-cyan">
                            {new Date().toISOString().split('T')[0]} // v2.0
                        </div>
                    </header>
                )}

                <div className="w-full relative">
                    {stage === STAGES.LANDING && <LandingPage onStart={handleStart} />}
                    {stage === STAGES.UPLOAD && <UploadPanel files={files} setFiles={setFiles} onUpload={handleUpload} isUploading={isUploading} />}
                    {stage === STAGES.QUERY && <QueryTerminal onGenerate={handleGenerate} isGenerating={isGenerating} />}
                    {stage === STAGES.PROCESSING && <ProcessingScreen />}
                    {stage === STAGES.RESULT && <PresentationViewer result={result} onRestart={handleRestart} />}
                </div>
            </main>
        </div>
    );
};

export default Home;
