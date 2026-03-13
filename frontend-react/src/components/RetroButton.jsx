import React from 'react';

const RetroButton = ({ children, onClick, disabled = false, className = "", variant = "primary" }) => {
    const baseClasses = "relative px-6 py-3 font-orbitron font-bold uppercase tracking-widest transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-hawkins-bg disabled:opacity-50 disabled:cursor-not-allowed z-10 hover:scale-105 overflow-hidden";

    const variants = {
        primary: "text-hawkins-red border-2 border-neon-red bg-hawkins-red/10 hover:bg-hawkins-red/20 glow-effect",
        secondary: "text-hawkins-cyan border-2 border-neon-cyan bg-hawkins-cyan/10 hover:bg-hawkins-cyan/20 text-shadow-glow-cyan shadow-glow-cyan",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${className}`}
        >
            <span className="relative z-10">{children}</span>
            {/* Glitch overlay on hover */}
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 hover:animate-flicker pointer-events-none mix-blend-overlay"></div>
        </button>
    );
};

export default RetroButton;
