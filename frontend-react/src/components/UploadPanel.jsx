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
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-orbitron text-hawkins-cyan uppercase tracking-widest text-neon-cyan">
                    Document Uplink
                </h2>
                <p className="text-hawkins-text/70 mt-2 text-sm font-mono uppercase">
                    Accepts PDF, TXT, DOCX, and PPTX documents
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
                    accept=".pdf,.txt,.docx,.pptx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                />

                <div className={`p-4 rounded-full bg-hawkins-bg border border-hawkins-cyan/30 mb-4 transition-transform duration-300 ${isDragging ? 'animate-bounce' : ''}`}>
                    <UploadCloud className="w-8 h-8 text-hawkins-cyan" />
                </div>

                <p className="text-hawkins-text font-terminal text-xs text-center leading-loose">
                    {isDragging ? 'INITIATE TRANSFER...' : 'DROP FILES HERE OR CLICK TO BROWSE'}
                </p>

                <div className="flex gap-3 mt-3">
                    {['PDF', 'TXT', 'DOCX', 'PPTX'].map(ext => (
                        <span key={ext} className="text-[10px] font-mono px-2 py-0.5 border border-hawkins-cyan/30 text-hawkins-cyan/60">
                            {ext}
                        </span>
                    ))}
                </div>
            </div>

            {files.length > 0 && (
                <div className="border border-hawkins-cyan/30 p-4 bg-black/60 font-mono text-sm relative overflow-hidden">
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
                    variant="secondary"
                    className="w-full sm:w-auto"
                >
                    {isUploading ? 'TRANSMITTING...' : 'PROCESS DOCUMENTS'}
                </RetroButton>
            </div>
        </div>
    );
};

export default UploadPanel;
