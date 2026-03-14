import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, FileText, Presentation, X } from 'lucide-react';
import RetroButton from './RetroButton';

const FILE_ICONS = {
    '.pdf': '📄',
    '.txt': '📝',
    '.docx': '📋',
    '.pptx': '📊',
};

const UploadPanel = ({ onUpload, files, setFiles, isUploading }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (newFiles) => {
        const SUPPORTED_TYPES = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];
        const SUPPORTED_EXT = ['.pdf', '.txt', '.docx', '.pptx'];

        const validFiles = newFiles.filter(file =>
            SUPPORTED_TYPES.includes(file.type) ||
            SUPPORTED_EXT.some(ext => file.name.toLowerCase().endsWith(ext))
        );

        if (validFiles.length < newFiles.length) {
            const skipped = newFiles.length - validFiles.length;
            console.warn(`Skipped ${skipped} unsupported file(s). Supported: PDF, TXT, DOCX, PPTX`);
        }

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (indexToRemove) => {
        setFiles(files.filter((_, index) => index !== indexToRemove));
    };

    const getFileIcon = (filename) => {
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return FILE_ICONS[ext] || '📄';
    };

    const getFileExt = (filename) => {
        return filename.split('.').pop().toUpperCase();
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in relative z-10">
            <video
                autoPlay
                muted
                loop
                playsInline
                className="dashboard-video-bg"
                onLoadedData={(e) => {
                    // Skip initial 0.5s to avoid black frames during loop
                    e.target.currentTime = 0.5;
                }}
            >
                <source src="/landing-page/videos/dashboard.mp4" type="video/mp4" />
            </video>
            <div className="text-center mb-2">
                <h2 className="text-3xl font-orbitron text-hawkins-red uppercase tracking-[0.2em] neon-glow-red">
                    Document Uplink
                </h2>
                <div className="w-24 h-0.5 mx-auto bg-hawkins-red/30 mt-2 mb-4"></div>
                <p className="text-hawkins-text/60 mt-2 text-xs font-mono uppercase tracking-widest italic">
                    [ ACCESSING SECURE DATA CHANNELS ]
                </p>
            </div>

            <div
                className={`glass-panel p-10 border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center min-h-[250px] cursor-pointer
          ${isDragging
                        ? 'border-hawkins-red scale-[1.02] bg-hawkins-red/20 shadow-[0_0_30px_rgba(255,42,42,0.2)]'
                        : 'border-hawkins-red/30 hover:border-hawkins-red/60 hover:bg-hawkins-red/5'
                    } ${isDragging ? 'scanning-effect' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    className="hidden"
                    multiple
                    accept=".pdf,.txt,.docx,.pptx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                />

                <div className={`p-5 rounded-full bg-black/40 border-2 border-hawkins-red/40 mb-6 transition-all duration-300 ${isDragging ? 'animate-pulse scale-110 border-hawkins-red shadow-[0_0_20px_rgba(255,42,42,0.4)]' : 'group-hover:border-hawkins-red/60'}`}>
                    <UploadCloud className={`w-10 h-10 transition-colors duration-300 ${isDragging ? 'text-hawkins-red' : 'text-hawkins-red/60'}`} />
                </div>

                <p className="text-hawkins-red font-terminal text-sm text-center leading-loose tracking-widest neon-glow-red/50">
                    {isDragging ? '>>> INITIATE TRANSFER <<<' : 'ATTACH INTELLIGENCE ASSETS'}
                </p>

                <p className="text-hawkins-text/40 font-mono text-[10px] mt-2 uppercase">
                    (or click to browse local sectors)
                </p>

                <div className="flex gap-4 mt-6">
                    {['PDF', 'TXT', 'DOCX', 'PPTX'].map(ext => (
                        <span key={ext} className="text-[10px] font-mono px-3 py-1 border border-hawkins-red/20 text-hawkins-red/40 bg-hawkins-red/5 rounded-sm">
                            {ext}
                        </span>
                    ))}
                </div>
            </div>

            {files.length > 0 && (
                <div className="border border-hawkins-red/30 p-4 bg-black/60 font-mono text-sm relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-50 z-10"></div>

                    <div className="flex justify-between items-center mb-4 border-b border-hawkins-red/30 pb-2 relative z-20">
                        <span className="text-hawkins-red">UPLOAD LOG:</span>
                        <span className="text-xs text-hawkins-text/50">{files.length} FILES</span>
                    </div>

                    <ul className="space-y-2 relative z-20 max-h-48 overflow-y-auto pr-2">
                        {files.map((file, index) => (
                            <li key={`${file.name}-${index}`} className="flex items-center justify-between text-hawkins-text group hover:bg-hawkins-red/10 p-1">
                                <div className="flex items-center gap-2 truncate">
                                    <span className="text-hawkins-red">{'>'}</span>
                                    <span className="text-base">{getFileIcon(file.name)}</span>
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-[10px] px-1 py-0.5 border border-hawkins-text/20 text-hawkins-text/40 shrink-0">
                                        {getFileExt(file.name)}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    className="text-hawkins-red/50 hover:text-hawkins-red p-1 shrink-0"
                                    disabled={isUploading}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex justify-end mt-4">
                <RetroButton
                    onClick={onUpload}
                    disabled={files.length === 0 || isUploading}
                    variant="primary"
                    className="w-full sm:w-auto"
                >
                    {isUploading ? 'TRANSMITTING...' : 'PROCESS DOCUMENTS'}
                </RetroButton>
            </div>
        </div>
    );
};

export default UploadPanel;
