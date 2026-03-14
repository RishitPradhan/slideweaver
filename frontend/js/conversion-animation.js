/**
 * Upside Down Portal — Conversion Loading Animation
 * 
 * A cinematic overlay showing a PDF icon being pulled into a red glowing
 * portal and reassembling as a PPT icon. Self-contained: injects its own
 * HTML + CSS on first use.
 *
 * API:
 *   window.showConversionAnimation()  — call when Generate is clicked
 *   window.hideConversionAnimation()  — call when backend responds
 */
(function () {
    'use strict';

    let overlayEl = null;
    let statusInterval = null;
    let injected = false;

    const STATUS_MESSAGES = [
        'Opening the Upside Down…',
        'Restructuring document layers…',
        'Generating presentation slides…',
        'Channeling interdimensional energy…',
        'Assembling classified briefing…',
    ];

    /* ── Inject CSS ──────────────────────────────────────────── */
    function injectStyles() {
        if (injected) return;
        injected = true;

        const css = `
/* ═══ Portal Overlay ═══════════════════════════════════════════ */
#portalOverlay {
    position: fixed;
    inset: 0;
    z-index: 50000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(5, 0, 2, 0.82);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.6s ease;
}
#portalOverlay.active {
    opacity: 1;
    pointer-events: auto;
}

/* ── Stage ─────────────────────────────────────────────────── */
.portal-stage {
    position: relative;
    width: 340px;
    height: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

/* ── PDF Icon ──────────────────────────────────────────────── */
.portal-pdf-icon,
.portal-ppt-icon {
    position: absolute;
    width: 64px;
    height: 78px;
    opacity: 0;
}

.portal-pdf-icon {
    top: 20px;
    animation: pdfDescend 8s ease-in-out infinite;
}

.portal-ppt-icon {
    bottom: 60px;
    animation: pptAssemble 8s ease-in-out infinite;
}

/* PDF body */
.pdf-body, .ppt-body {
    width: 100%; height: 100%;
    border-radius: 4px 12px 4px 4px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 18px rgba(255, 30, 30, 0.25);
}
.pdf-body {
    background: linear-gradient(135deg, #1a0008, #2a0012);
    border: 1.5px solid #cc2244;
}
.ppt-body {
    background: linear-gradient(135deg, #0a0818, #140a28);
    border: 1.5px solid #ff6622;
    box-shadow: 0 0 18px rgba(255, 100, 30, 0.25);
}

.pdf-body::before {
    content: '';
    position: absolute; top: 0; right: 0;
    width: 16px; height: 16px;
    background: linear-gradient(135deg, #cc2244 50%, transparent 50%);
    border-radius: 0 0 0 4px;
}
.ppt-body::before {
    content: '';
    position: absolute; top: 0; right: 0;
    width: 16px; height: 16px;
    background: linear-gradient(135deg, #ff6622 50%, transparent 50%);
    border-radius: 0 0 0 4px;
}

.pdf-label, .ppt-label {
    font-family: 'Orbitron', 'Share Tech Mono', monospace;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 3px;
}
.pdf-label { color: #ff3355; text-shadow: 0 0 10px #ff1133; }
.ppt-label { color: #ff8833; text-shadow: 0 0 10px #ff6622; }

/* Decorative lines on icons */
.icon-lines {
    position: absolute;
    bottom: 10px; left: 10px; right: 10px;
    display: flex; flex-direction: column; gap: 4px;
}
.icon-lines span {
    height: 2px;
    border-radius: 1px;
    opacity: 0.35;
    width: 100%;
}
.pdf-body .icon-lines span { background: #ff3355; }
.ppt-body .icon-lines span { background: #ff8833; }
.icon-lines span:nth-child(2) { width: 75%; }
.icon-lines span:nth-child(3) { width: 50%; }

/* ── Portal Ring ───────────────────────────────────────────── */
.portal-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 220px;
    height: 80px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: transparent;
    box-shadow:
        0 0 30px 8px rgba(255, 20, 40, 0.45),
        0 0 70px 20px rgba(255, 20, 40, 0.2),
        inset 0 0 30px 8px rgba(255, 20, 40, 0.3);
    animation: portalPulse 3s ease-in-out infinite;
    overflow: hidden;
}

.portal-inner {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(ellipse at center,
        rgba(255, 10, 30, 0.5) 0%,
        rgba(120, 0, 15, 0.6) 40%,
        rgba(30, 0, 5, 0.95) 75%,
        transparent 100%);
    animation: portalSwirl 4s linear infinite;
}

/* ── Lightning Container & Bolts ────────────────────────────── */
.lightning-container {
    position: absolute;
    top: 50%; left: 50%;
    width: 220px; height: 80px;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.portal-lightning {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 60px;
    transform-origin: top center;
    opacity: 0;
}
.portal-lightning::before,
.portal-lightning::after {
    content: '';
    position: absolute;
    width: 100%;
    background: #ff3355;
    box-shadow: 0 0 10px #ff1133, 0 0 20px #ff0022;
    border-radius: 1px;
}
.portal-lightning::before {
    top: -10%; height: 60%;
    transform: rotate(15deg);
}
.portal-lightning::after {
    top: 40%; height: 60%;
    transform: rotate(-20deg);
}

.portal-lightning:nth-child(1) {
    transform: translate(-50%, -50%) rotate(-35deg);
    animation: lightningFlash 8s 2.5s ease-in-out infinite;
}
.portal-lightning:nth-child(2) {
    transform: translate(-50%, -50%) rotate(30deg);
    animation: lightningFlash 8s 3.2s ease-in-out infinite;
}
.portal-lightning:nth-child(3) {
    transform: translate(-50%, -50%) rotate(5deg);
    animation: lightningFlash 8s 3.8s ease-in-out infinite;
}

/* ── Particles ─────────────────────────────────────────────── */
.portal-particles {
    position: absolute;
    top: 50%; left: 50%;
    width: 0; height: 0;
}

.p-dot {
    position: absolute;
    width: 6px; height: 6px;
    border-radius: 50%;
    opacity: 0;
    box-shadow: 0 0 10px var(--c, #ff3344);
}

/* scatter outward phase 2-4s, converge downward phase 4-6s */
.p-dot:nth-child(1)  { background:#ff3344; --c:#ff3344; animation: particle 8s 2.0s ease-in-out infinite; --px:-60px; --py:-40px; --fx:0px; --fy:110px; }
.p-dot:nth-child(2)  { background:#ff6633; --c:#ff6633; animation: particle 8s 2.1s ease-in-out infinite; --px: 55px; --py:-35px; --fx:0px; --fy:115px; }
.p-dot:nth-child(3)  { background:#ff2255; --c:#ff2255; animation: particle 8s 2.2s ease-in-out infinite; --px:-40px; --py: 30px; --fx:0px; --fy:105px; }
.p-dot:nth-child(4)  { background:#cc2233; --c:#cc2233; animation: particle 8s 2.3s ease-in-out infinite; --px: 70px; --py: 20px; --fx:0px; --fy:120px; }
.p-dot:nth-child(5)  { background:#ff4422; --c:#ff4422; animation: particle 8s 2.15s ease-in-out infinite; --px:-75px; --py: 10px; --fx:0px; --fy:112px; }
.p-dot:nth-child(6)  { background:#ff5544; --c:#ff5544; animation: particle 8s 2.25s ease-in-out infinite; --px: 45px; --py:-50px; --fx:0px; --fy:108px; }
.p-dot:nth-child(7)  { background:#dd3322; --c:#dd3322; animation: particle 8s 2.35s ease-in-out infinite; --px:-30px; --py:-55px; --fx:0px; --fy:118px; }
.p-dot:nth-child(8)  { background:#ff7744; --c:#ff7744; animation: particle 8s 2.05s ease-in-out infinite; --px: 65px; --py:-15px; --fx:0px; --fy:106px; }
.p-dot:nth-child(9)  { background:#ff2233; --c:#ff2233; animation: particle 8s 2.4s ease-in-out infinite; --px:-55px; --py: 45px; --fx:0px; --fy:114px; }
.p-dot:nth-child(10) { background:#ee4433; --c:#ee4433; animation: particle 8s 2.18s ease-in-out infinite; --px: 50px; --py: 40px; --fx:0px; --fy:110px; }
.p-dot:nth-child(11) { background:#ff3366; --c:#ff3366; animation: particle 8s 2.28s ease-in-out infinite; --px:-80px; --py:-20px; --fx:0px; --fy:116px; }
.p-dot:nth-child(12) { background:#ff5522; --c:#ff5522; animation: particle 8s 2.38s ease-in-out infinite; --px: 35px; --py: 55px; --fx:0px; --fy:122px; }

/* ── Status Text ───────────────────────────────────────────── */
.portal-status-text {
    position: absolute;
    bottom: 16px;
    width: 100%;
    text-align: center;
    font-family: 'Share Tech Mono', 'Orbitron', monospace;
    font-size: 12px;
    letter-spacing: 3px;
    color: #cc3344;
    text-shadow: 0 0 8px rgba(255, 30, 50, 0.4);
    opacity: 0;
    transition: opacity 0.5s ease;
}
.portal-status-text.visible {
    opacity: 1;
}

/* ── Ambient glow behind portal ────────────────────────────── */
.portal-ambient {
    position: absolute;
    top: 50%; left: 50%;
    width: 300px; height: 300px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(180,0,20,0.12) 0%, transparent 70%);
    animation: ambientPulse 4s ease-in-out infinite;
    pointer-events: none;
}

/* ═══ Keyframes ═══════════════════════════════════════════════ */

/* PDF floats down and gets sucked in */
@keyframes pdfDescend {
    0%   { opacity:0; transform: translateY(0) scale(1); }
    5%   { opacity:1; }
    20%  { opacity:1; transform: translateY(60px) scale(1); }
    30%  { opacity:0; transform: translateY(120px) scale(0.2) rotate(10deg); }
    31%  { opacity:0; transform: translateY(0) scale(1); }
    100% { opacity:0; }
}

/* PPT assembles from particles below portal */
@keyframes pptAssemble {
    0%   { opacity:0; transform: scale(0.3) translateY(-30px); }
    60%  { opacity:0; transform: scale(0.3) translateY(-30px); }
    75%  { opacity:1; transform: scale(1.08) translateY(0); }
    82%  { opacity:1; transform: scale(1) translateY(0); }
    90%  { opacity:1; transform: scale(1) translateY(0); }
    95%  { opacity:0; transform: scale(1) translateY(0); }
    100% { opacity:0; }
}

/* Portal glow pulsing */
@keyframes portalPulse {
    0%, 100% {
        box-shadow:
            0 0 30px 8px rgba(255,20,40,0.35),
            0 0 60px 15px rgba(255,20,40,0.15),
            inset 0 0 30px 8px rgba(255,20,40,0.2);
    }
    50% {
        box-shadow:
            0 0 45px 12px rgba(255,20,40,0.5),
            0 0 90px 25px rgba(255,20,40,0.2),
            inset 0 0 40px 12px rgba(255,20,40,0.3);
    }
}

/* Swirl rotation */
@keyframes portalSwirl {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

/* Lightning flash */
@keyframes lightningFlash {
    0%  { opacity:0; }
    2%  { opacity:0.9; }
    4%  { opacity:0; }
    6%  { opacity:0.7; }
    8%  { opacity:0; }
    100%{ opacity:0; }
}

/* Particles: scatter then converge */
@keyframes particle {
    0%   { opacity:0; transform:translate(0,0) scale(0); }
    25%  { opacity:0; }
    30%  { opacity:1; transform:translate(var(--px),var(--py)) scale(1.2); }
    50%  { opacity:0.8; transform:translate(
            calc(var(--px) * 0.5 + var(--fx) * 0.5),
            calc(var(--py) * 0.5 + var(--fy) * 0.5)
         ) scale(0.8); }
    65%  { opacity:0.6; transform:translate(var(--fx),var(--fy)) scale(0.5); }
    70%  { opacity:0; transform:translate(var(--fx),var(--fy)) scale(0); }
    100% { opacity:0; }
}

/* Ambient glow */
@keyframes ambientPulse {
    0%,100% { opacity:0.5; transform:translate(-50%,-50%) scale(1); }
    50%     { opacity:1;   transform:translate(-50%,-50%) scale(1.15); }
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 480px) {
    .portal-stage { width: 260px; height: 340px; }
    .portal-ring  { width: 160px; height: 60px; }
    .portal-pdf-icon, .portal-ppt-icon { width: 48px; height: 58px; }
    .pdf-label, .ppt-label { font-size: 11px; letter-spacing: 2px; }
    .portal-status-text { font-size: 10px; letter-spacing: 2px; }
}
`;
        const style = document.createElement('style');
        style.id = 'portalAnimationStyles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ── Build overlay HTML ───────────────────────────────────── */
    function buildOverlay() {
        if (overlayEl) return overlayEl;

        const div = document.createElement('div');
        div.id = 'portalOverlay';
        div.innerHTML = `
            <div class="portal-stage">
                <!-- Ambient glow -->
                <div class="portal-ambient"></div>

                <!-- PDF icon -->
                <div class="portal-pdf-icon">
                    <div class="pdf-body">
                        <span class="pdf-label">PDF</span>
                        <div class="icon-lines">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>

                <!-- Portal ring -->
                <div class="portal-ring">
                    <div class="portal-inner"></div>
                </div>

                <!-- Lightning (Moved outside ring to avoid overflow clipping) -->
                <div class="lightning-container">
                    <div class="portal-lightning"></div>
                    <div class="portal-lightning"></div>
                    <div class="portal-lightning"></div>
                </div>

                <!-- Particles -->
                <div class="portal-particles">
                    <div class="p-dot"></div><div class="p-dot"></div>
                    <div class="p-dot"></div><div class="p-dot"></div>
                    <div class="p-dot"></div><div class="p-dot"></div>
                    <div class="p-dot"></div><div class="p-dot"></div>
                    <div class="p-dot"></div><div class="p-dot"></div>
                    <div class="p-dot"></div><div class="p-dot"></div>
                </div>

                <!-- PPT icon -->
                <div class="portal-ppt-icon">
                    <div class="ppt-body">
                        <span class="ppt-label">PPT</span>
                        <div class="icon-lines">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>

                <!-- Status text -->
                <div class="portal-status-text" id="portalStatusText"></div>
            </div>
        `;

        document.body.appendChild(div);
        overlayEl = div;
        return div;
    }

    /* ── Rotating status text ─────────────────────────────────── */
    function startStatusRotation() {
        const el = document.getElementById('portalStatusText');
        if (!el) return;

        let idx = 0;
        el.textContent = STATUS_MESSAGES[0];

        // Fade in first message after a beat
        requestAnimationFrame(() => {
            el.classList.add('visible');
        });

        statusInterval = setInterval(() => {
            el.classList.remove('visible');
            setTimeout(() => {
                idx = (idx + 1) % STATUS_MESSAGES.length;
                el.textContent = STATUS_MESSAGES[idx];
                el.classList.add('visible');
            }, 500);
        }, 3000);
    }

    function stopStatusRotation() {
        if (statusInterval) {
            clearInterval(statusInterval);
            statusInterval = null;
        }
    }

    /* ── Public API ────────────────────────────────────────────── */

    window.showConversionAnimation = function () {
        injectStyles();
        const overlay = buildOverlay();

        // Force reflow so transition triggers
        overlay.offsetHeight;
        overlay.classList.add('active');
        startStatusRotation();
    };

    window.hideConversionAnimation = function () {
        if (!overlayEl) return;

        stopStatusRotation();
        overlayEl.classList.remove('active');

        // Remove from DOM after fade-out
        setTimeout(() => {
            if (overlayEl && overlayEl.parentNode) {
                overlayEl.parentNode.removeChild(overlayEl);
                overlayEl = null;
            }
        }, 700);
    };
})();
