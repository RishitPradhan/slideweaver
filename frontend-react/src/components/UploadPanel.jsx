import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import RetroButton from './RetroButton';
import VecnaEscape from '../../vecnagame/VecnaEscape';

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
        // Filter for PDF and TXT
        const validFiles = newFiles.filter(file =>
            file.type === 'application/pdf' ||
            file.type === 'text/plain' ||
            file.name.endsWith('.pdf') ||
            file.name.endsWith('.txt')
        );

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (indexToRemove) => {
        setFiles(files.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-stranger text-hawkins-cyan tracking-wider text-neon-cyan drop-shadow-lg">
                    Document Uplink
                </h2>
                <p className="text-hawkins-text/70 mt-2 text-sm font-terminal uppercase">
                    Requires PDF or TXT format clearance
                </p>
            </div>

            <div
                className={`relative p-8 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] cursor-pointer bg-hawkins-cyan/5
          ${isDragging
                        ? 'border-neon-cyan scale-[1.02] bg-hawkins-cyan/10'
                        : 'border-hawkins-cyan/50 hover:border-hawkins-cyan hover:bg-hawkins-cyan/10'
                    }`}
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
                    accept=".pdf,.txt,application/pdf,text/plain"
                />

                <div className={`p-4 rounded-full bg-hawkins-bg border border-hawkins-cyan/30 mb-4 transition-transform duration-300 ${isDragging ? 'animate-bounce' : ''}`}>
                    <UploadCloud className="w-8 h-8 text-hawkins-cyan" />
                </div>

                <p className="text-hawkins-text font-terminal text-xs text-center leading-loose">
                    {isDragging ? 'INITIATE TRANSFER...' : 'DROP CLASSIFIED FILES HERE OR CLICK TO BROWSE'}
                </p>
            </div>

            {files.length > 0 && (
                <div className="border border-neon-cyan p-4 bg-black/60 font-mono text-sm relative overflow-hidden shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                    {/* Scanline specifically for the terminal box */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-50 z-10"></div>

                    <div className="flex justify-between items-center mb-4 border-b border-hawkins-cyan/30 pb-2 relative z-20">
                        <span className="text-hawkins-cyan">UPLOAD LOG:</span>
                        <span className="text-xs text-hawkins-text/50">{files.length} FILES</span>
                    </div>

                    <ul className="space-y-2 relative z-20 max-h-48 overflow-y-auto pr-2">
                        {files.map((file, index) => (
                            <li key={`${file.name}-${index}`} className="flex items-center justify-between text-hawkins-text group hover:bg-hawkins-cyan/10 p-1">
                                <div className="flex items-center gap-2 truncate">
                                    <span className="text-hawkins-cyan">{'>'}</span>
                                    <FileIcon className="w-4 h-4 text-hawkins-red shrink-0" />
                                    <span className="truncate">{file.name}</span>
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
                    variant="secondary"
                    className="w-full sm:w-auto"
                >
                    {isUploading ? 'TRANSMITTING...' : 'PROCESS DOCUMENTS'}
                </RetroButton>
            </div>

            {/* Render game during the upload transmission time */}
            {isUploading && (
                <div className="w-full mt-8 animate-fade-in max-h-[400px]">
                    <div className="text-hawkins-cyan font-terminal text-sm mb-2 opacity-80 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-hawkins-red animate-pulse"></span>
                        UPLINK IN PROGRESS - MINI-GAME OVERRIDE
                    </div>
                    <VecnaEscape />
                </div>
            )}
        </div>
    );
};

export default UploadPanel;
