import React, { useRef, useEffect, useState } from 'react';
import './vecnagame.css';

const VecnaEscape = () => {
    const canvasRef = useRef(null);

    // React UI State
    const [gameState, setGameState] = useState('START'); // START, PLAYING, CINEMATIC, GAMEOVER
    const [uiScore, setUiScore] = useState(0);
    const [uiDistance, setUiDistance] = useState(0);
    const [uiSpeed, setUiSpeed] = useState(0);

    // Web Audio API for Thunder
    const audioCtxRef = useRef(null);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtxRef.current = new AudioContext();
            }
        }
    };

    const playThunder = () => {
        if (!audioCtxRef.current) return;
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
        
        try {
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            // Deep rumble sweep
            osc.frequency.setValueAtTime(80, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 3);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(30, ctx.currentTime + 2);

            gain.gain.setValueAtTime(0.6, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 3);
        } catch (e) {
            console.error("Audio error", e);
        }
    };

    // Internal Mutable Game State for high-performance Canvas Loop
    const stateRef = useRef({
        status: 'START',
        frames: 0,
        score: 0,
        distanceTraveled: 0,
        speed: 4.5, // Cinematic run start
        
        vecna: { x: 200, y: 150, width: 30, height: 60, vy: 0, isJumping: false, isSliding: false, hoverTick: 0 },
        eleven: { x: -100, width: 40, height: 70, distance: 300 }, // Distance behind Vecna
        
        obstacles: [],
        collectibles: [], // Energy fragments
        
        // Parallax environment arrays
        cracks: [],
        trees: [],
        clouds: [],
        buildings: [],
        debris: [],
        ashParticles: [],
        tkParticles: [], // Eleven's telekinetic hand particles

        // Effects
        lightningFlash: 0,
        lightningBolts: [],
        fogOffset: 0,
        screenShake: 0,
        cinematicTimer: 0
    });

    const JUMP_FORCE = -12;
    const GRAVITY = 0.6;
    const GROUND_Y = 320; 

    const resetGame = () => {
        stateRef.current = {
            status: 'PLAYING',
            frames: 0,
            score: 0,
            distanceTraveled: 0,
            speed: 4.5,
            
            vecna: { x: 200, y: GROUND_Y - 60, width: 30, height: 60, vy: 0, isJumping: false, isSliding: false, hoverTick: 0 },
            eleven: { x: -100, width: 40, height: 70, distance: 300 },
            
            obstacles: [], collectibles: [], cracks: [], trees: [], clouds: [], buildings: [], debris: [], ashParticles: [], tkParticles: [],
            
            lightningFlash: 0, lightningBolts: [], fogOffset: 0, screenShake: 0, cinematicTimer: 0
        };
        
        // Initial environment population
        populateEnvironment(800); 

        setGameState('PLAYING');
        setUiScore(0);
        setUiDistance(0);
        // Base starting speed increased further
        setUiSpeed(45);
    };

    const populateEnvironment = (width) => {
        const state = stateRef.current;
        for (let i=0; i<5; i++) state.clouds.push({ x: Math.random() * width, y: Math.random() * 100, speed: Math.random() * 0.5 + 0.1, size: Math.random() * 150 + 100 });
        for (let i=0; i<8; i++) state.buildings.push({ x: Math.random() * width, width: Math.random() * 60 + 40, height: Math.random() * 100 + 50 });
        for (let i=0; i<10; i++) state.trees.push({ x: Math.random() * width, height: Math.random() * 150 + 100, width: Math.random() * 15 + 10 });
        for (let i=0; i<50; i++) state.ashParticles.push({ x: Math.random() * width, y: Math.random() * 400, vx: (Math.random()-0.5), vy: Math.random(), size: Math.random()*2+1 });
    };

    const handleInput = (action) => {
        initAudio();
        const state = stateRef.current;
        
        if (state.status === 'START' || state.status === 'GAMEOVER') {
            if (action === 'JUMP') resetGame();
        } else if (state.status === 'PLAYING') {
            if (action === 'JUMP') {
                if (!state.vecna.isJumping) {
                    state.vecna.vy = JUMP_FORCE;
                    state.vecna.isJumping = true;
                }
            } else if (action === 'SLIDE_DOWN') {
                state.vecna.isSliding = true;
                state.vecna.height = 30;
                if (!state.vecna.isJumping) state.vecna.y = GROUND_Y - 30;
            } else if (action === 'SLIDE_UP') {
                state.vecna.isSliding = false;
                state.vecna.height = 60;
                if (!state.vecna.isJumping) state.vecna.y = GROUND_Y - 60;
            }
        }
    };

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') handleInput('JUMP');
            if (e.code === 'ArrowDown') handleInput('SLIDE_DOWN');
        };
        const onKeyUp = (e) => {
            if (e.code === 'ArrowDown') handleInput('SLIDE_UP');
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Native resolution for wider cinematic aspect ratio
        canvas.width = 900;
        canvas.height = 400;

        let animationId;

        const updatePhysics = (state) => {
            const v = state.vecna;
            v.vy += GRAVITY;
            v.y += v.vy;
            if (v.y + v.height >= GROUND_Y) {
                v.y = GROUND_Y - v.height;
                v.vy = 0;
                v.isJumping = false;
            }
        };

        const triggerCaughtCinematic = (state) => {
            state.status = 'CINEMATIC';
            setGameState('CINEMATIC');
            state.lightningFlash = 1.0;
            state.screenShake = 20;
            playThunder();
            // Generate lightning bolts
            const v = state.vecna;
            state.lightningBolts.push({ x: v.x + 15, life: 1.0 });
        };

        const updatePlayingState = (state, cw) => {
            state.frames++;
            state.distanceTraveled += (state.speed / 10);
            
            // Locked speed requested by user
            state.speed = 4.5;

            // Sync UI periodically
            if (state.frames % 15 === 0) {
                setUiScore(state.score);
                setUiDistance(Math.floor(state.distanceTraveled));
                setUiSpeed(Math.round(state.speed * 10));
            }

            updatePhysics(state);

            // Eleven follow logic
            state.eleven.x = state.vecna.x - state.eleven.distance;
            
            // Generate Eleven TK particles
            if (state.frames % 3 === 0) {
                state.tkParticles.push({
                    x: state.eleven.x + state.eleven.width,
                    y: state.eleven.y + state.eleven.height / 2 + (Math.random() * 20 - 10),
                    vx: Math.random() * 2,
                    vy: Math.random() * 2 - 1,
                    life: 1.0
                });
            }

            // Spawn Environment
            const spawnInterval = 30; // Shorter interval for more frequent obstacles
            if ((state.frames === 20) || (state.frames > 20 && state.frames % spawnInterval === 0 && Math.random() < 0.85)) {
                state.obstacles.push({ x: cw, y: GROUND_Y - 40, width: 30, height: 40, type: 'debris' });
            }
            if (state.frames % 100 === 0 && Math.random() < 0.4) {
                state.collectibles.push({ x: cw, y: GROUND_Y - 80 - Math.random() * 40, radius: 8 });
            }
            if (state.frames % 30 === 0) {
                state.cracks.push({ x: cw, width: Math.random() * 100 + 40 });
            }

            // Move Entities
            [...state.trees, ...state.buildings, ...state.obstacles, ...state.collectibles, ...state.cracks].forEach(ent => {
                ent.x -= state.speed;
            });
            state.clouds.forEach(c => c.x -= c.speed);

            // Clean up off-screen
            state.obstacles = state.obstacles.filter(o => o.x + o.width > 0);
            state.collectibles = state.collectibles.filter(c => c.x + c.radius * 2 > 0);
            state.cracks = state.cracks.filter(c => c.x + c.width > 0);
            
            // Update Ash
            state.ashParticles.forEach(p => {
                p.x -= state.speed * 1.5 + p.vx;
                p.y += p.vy;
                if (p.y > 400) p.y = 0;
                if (p.x < 0) p.x = cw;
            });

            // Update TK Particles
            state.tkParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.05;
            });
            state.tkParticles = state.tkParticles.filter(p => p.life > 0);

            // Weather Events
            if (Math.random() < 0.005) {
                state.lightningFlash = 0.8 + Math.random() * 0.2;
                if (Math.random() < 0.3) playThunder();
            }

            // Collisions
            const v = state.vecna;
            const isColliding = (r1, r2) => r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;

            for (let i = state.obstacles.length - 1; i >= 0; i--) {
                if (isColliding(v, state.obstacles[i])) {
                    state.obstacles.splice(i, 1);
                    // Penalty: Eleven gets closer, speed drops temporarily, screen shake
                    state.eleven.distance -= 60;
                    state.screenShake = 10;
                    state.lightningFlash = 0.5;
                    
                    if (state.eleven.distance <= 50) {
                        triggerCaughtCinematic(state);
                    }
                }
            }

            for (let i = state.collectibles.length - 1; i >= 0; i--) {
                const col = state.collectibles[i];
                if (isColliding(v, { x: col.x - col.radius, y: col.y - col.radius, width: col.radius*2, height: col.radius*2 })) {
                    state.collectibles.splice(i, 1);
                    state.score++;
                    state.eleven.distance = Math.min(300, state.eleven.distance + 10); // Gain some distance back
                }
            }
        };

        const updateCinematicState = (state) => {
            state.cinematicTimer++;
            state.frames++;
            const v = state.vecna;
            
            // Elevate Vecna with telekinesis
            if (state.cinematicTimer > 30 && v.y > GROUND_Y - 150) {
                v.y -= 1;
                v.hoverTick += 0.1;
                v.y += Math.sin(v.hoverTick) * 0.5; // Wobble
            }

            // Pull Vecna towards Eleven
            if (state.cinematicTimer > 60 && v.x > state.eleven.x + 60) {
                v.x -= 0.5;
            }

            // Screen glitching
            if (state.cinematicTimer > 100 && state.cinematicTimer % 5 === 0) {
                state.screenShake = 5;
                state.lightningFlash = 0.3;
            }

            // Red telekinetic lines to Vecna
            state.tkParticles.push({
                x: state.eleven.x + state.eleven.width,
                y: GROUND_Y - state.eleven.height / 2,
                vx: (v.x - state.eleven.x) * 0.05 + (Math.random() * 5 - 2.5),
                vy: (v.y - (GROUND_Y - state.eleven.height / 2)) * 0.05 + (Math.random() * 5 - 2.5),
                life: 1.0,
                isRed: true 
            });

            state.tkParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
            });
            state.tkParticles = state.tkParticles.filter(p => p.life > 0);

            // Final Flash and Transition
            if (state.cinematicTimer === 220) {
                state.lightningFlash = 1.0;
                playThunder();
            }
            if (state.cinematicTimer > 250) {
                state.status = 'GAMEOVER';
                setGameState('GAMEOVER');
            }
        };

        const renderEnvironment = (ctx, cw, ch, state) => {
            // Sky Gradient (Bright cinematic orange/red)
            const skyGradient = ctx.createLinearGradient(0, 0, 0, ch);
            skyGradient.addColorStop(0, '#ff4500'); // Orange Red
            skyGradient.addColorStop(0.5, '#cc2900'); // Vibrant burnt orange
            skyGradient.addColorStop(1, '#4d0000'); // Dark at horizon
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, cw, ch);

            // Lightning Flash Illumination
            if (state.lightningFlash > 0) {
                ctx.fillStyle = `rgba(255, 200, 220, ${state.lightningFlash * 0.5})`;
                ctx.fillRect(0, 0, cw, ch);
                
                // Dim flash decay
                if (state.status !== 'CINEMATIC' || state.cinematicTimer < 200 || state.cinematicTimer > 230) {
                     state.lightningFlash -= 0.05;
                }
            }

            // Distant Ferris wheel
            ctx.strokeStyle = `rgba(100, 20, 30, ${0.4 + state.lightningFlash*0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const fwX = cw - 150 - (state.distanceTraveled * 0.05 % cw);
            ctx.arc(fwX, GROUND_Y - 120, 40, 0, Math.PI*2);
            // Spokes
            for(let i=0; i<8; i++) {
                const angle = (Math.PI*2 / 8) * i + state.frames * 0.01;
                ctx.moveTo(fwX, GROUND_Y - 120);
                ctx.lineTo(fwX + Math.cos(angle)*40, GROUND_Y - 120 + Math.sin(angle)*40);
            }
            ctx.stroke();

            // Clouds
            ctx.fillStyle = `rgba(20, 5, 15, ${0.6 - state.lightningFlash*0.2})`;
            state.clouds.forEach(c => {
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.size, 0, Math.PI*2);
                ctx.arc(c.x + c.size*0.6, c.y - c.size*0.2, c.size*0.8, 0, Math.PI*2);
                ctx.arc(c.x - c.size*0.6, c.y + c.size*0.1, c.size*0.7, 0, Math.PI*2);
                ctx.fill();
                // Wrap around
                if (c.x + c.size * 2 < 0) c.x = cw + c.size * 2;
            });

            // Buildings (Hawkins Silhouette)
            ctx.fillStyle = '#050204';
            state.buildings.forEach(b => {
                let bx = b.x - (state.distanceTraveled * 0.2 % cw);
                if (bx < -b.width) bx += cw + b.width;
                ctx.fillRect(bx, GROUND_Y - b.height, b.width, b.height);
            });

            // Dead Trees
            ctx.fillStyle = '#11050a';
            state.trees.forEach(t => {
                let tx = t.x - (state.distanceTraveled * 0.5 % cw);
                if (tx < -t.width) tx += cw + t.width;
                ctx.beginPath();
                ctx.moveTo(tx, GROUND_Y);
                ctx.lineTo(tx + t.width/2, GROUND_Y - t.height);
                ctx.lineTo(tx + t.width, GROUND_Y);
                ctx.fill();
            });

            // Glowing Ground Cracks
            ctx.strokeStyle = '#ff003c';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff003c';
            state.cracks.forEach(c => {
                ctx.beginPath();
                ctx.moveTo(c.x, GROUND_Y + 5);
                ctx.lineTo(c.x + c.width*0.3, GROUND_Y + 15);
                ctx.lineTo(c.x + c.width*0.7, GROUND_Y + 8);
                ctx.lineTo(c.x + c.width, GROUND_Y + 20);
                ctx.stroke();
            });
            ctx.shadowBlur = 0;

            // Ground Silhouette
            ctx.fillStyle = '#080205';
            ctx.fillRect(0, GROUND_Y, cw, ch - GROUND_Y);
        };

        const renderEntities = (ctx, state) => {
            // Collectibles (Upside Down Fragments)
            state.collectibles.forEach(col => {
                ctx.fillStyle = '#00e5ff'; // Cyan glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00e5ff';
                ctx.beginPath();
                // Diamond shape
                ctx.moveTo(col.x, col.y - col.radius);
                ctx.lineTo(col.x + col.radius, col.y);
                ctx.lineTo(col.x, col.y + col.radius);
                ctx.lineTo(col.x - col.radius, col.y);
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            // Obstacles (Debris)
            state.obstacles.forEach(obs => {
                ctx.fillStyle = '#d2b48c'; // Light brown
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Jagged edges to simulate debris
                ctx.fillStyle = '#c2a47c';
                ctx.fillRect(obs.x+5, obs.y-5, obs.width-10, 10);
            });

            // Pixel Art Matrices (12 cols x 16 rows)
            const VECNA_SPRITE = [
                "  RRRRRRRR  ",
                " RRRRRRRRRR ",
                " RR0RRRR0RR ",
                " RRRRRRRRRR ",
                "  RRRRRRRR  ",
                " RRRRRRRRRR ",
                "RRRRRRRRRRRR",
                "RR RR  RR RR",
                "R  RR  RR  R",
                "   RR  RR   ",
                "   RR  RR   ",
                "  R  R   R  ",
                "  R  R   R  ",
                "  R  R   R  ",
                " R   R  R   ",
                " R   R  R   "
            ];
            
            const VECNA_SLIDE_SPRITE = [
                "            ",
                "            ",
                "            ",
                "            ",
                "            ",
                "            ",
                "   RRRRRR   ",
                "  RRRRRRRR  ",
                "  R0RRRR0RT ",
                " RRRRRRRRRR ",
                "  R RRRRRR  ",
                "  R   R  R  ",
                "  RR  R  R  ",
                " R R  RR R  ",
                " R R     R  ",
                "   R     R  "
            ];

            const ELEVEN_SPRITE = [
                "    0000    ",
                "   000000   ",
                "   0DDDD0   ",
                "   0DDDD0   ",
                "    DDDD    ",
                "     BB     ",
                "   BBBBBB   ",
                "  BBBBBBBB  ",
                "  BBBBBBBB  ",
                "  BB BBBB BB",
                "  B   WW   B",
                "     WWWW   ",
                "      00    ",
                "     0  0   ",
                "     0  0   ",
                "    0    0  "
            ];
            
            const COLOR_MAP = {
                'R': (state.status === 'CINEMATIC' || state.status === 'GAMEOVER') && state.cinematicTimer > 60 ? '#ff003c' : '#8f1f58',
                '0': '#000000',
                'D': '#ffe0bd',
                'B': '#1a4e6e',
                'W': '#ffffff',
                'T': '#4a1535'
            };

            const drawSprite = (sprite, startX, startY, width, height) => {
                const rows = sprite.length;
                const cols = sprite[0].length;
                const pW = width / cols;
                const pH = height / rows;
                for (let r=0; r<rows; r++) {
                    for (let c=0; c<cols; c++) {
                        const char = sprite[r][c];
                        if (char !== ' ') {
                            ctx.fillStyle = COLOR_MAP[char];
                            ctx.fillRect(startX + c*pW, startY + r*pH, pW+0.5, pH+0.5); // +0.5 to prevent sub-pixel gaps
                        }
                    }
                }
            };

            // Vecna (Player)
            const v = state.vecna;
            if (state.status === 'CINEMATIC') {
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ff003c';
            }
            const currentVecnaSprite = v.isSliding ? VECNA_SLIDE_SPRITE : VECNA_SPRITE;
            drawSprite(currentVecnaSprite, v.x, v.y, v.width, v.height);
            ctx.shadowBlur = 0;

            // Eleven (Pursuer)
            state.eleven.y = GROUND_Y - state.eleven.height;
            const isElevenGlowing = state.status === 'CINEMATIC' || state.status === 'GAMEOVER';
            ctx.shadowBlur = isElevenGlowing ? 30 : 10;
            ctx.shadowColor = isElevenGlowing ? '#ff003c' : 'rgba(255, 0, 0, 0.4)';
            drawSprite(ELEVEN_SPRITE, state.eleven.x, state.eleven.y, state.eleven.width, state.eleven.height);
            ctx.shadowBlur = 0;

            // Telekinetic Particles
            state.tkParticles.forEach(p => {
                ctx.fillStyle = p.isRed ? `rgba(255, 0, 60, ${p.life})` : `rgba(255, 255, 255, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.isRed ? 2 : 1, 0, Math.PI*2);
                ctx.fill();
            });
        };

        const renderWeather = (ctx, cw, ch, state) => {
            // Fog / Mist
            state.fogOffset += 0.5;
            const gradient = ctx.createLinearGradient(0, GROUND_Y - 50, 0, GROUND_Y + 50);
            gradient.addColorStop(0, 'rgba(30, 10, 20, 0)');
            gradient.addColorStop(0.5, 'rgba(40, 15, 25, 0.6)');
            gradient.addColorStop(1, 'rgba(10, 5, 10, 0.9)');
            ctx.fillStyle = gradient;
            // Draw wobbly fog
            ctx.beginPath();
            ctx.moveTo(0, ch);
            for(let x=0; x<=cw; x+=50) {
                ctx.lineTo(x, GROUND_Y - 30 + Math.sin((x + state.fogOffset)*0.01) * 20);
            }
            ctx.lineTo(cw, ch);
            ctx.fill();

            // Upside Down Ash Particles
            ctx.fillStyle = 'rgba(200, 210, 220, 0.6)';
            state.ashParticles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                ctx.fill();
            });
        };

        const renderLightningBolts = (ctx, state) => {
             // Optional draw lightning bolts down from sky occasionally during cinematic
        };

        const gameLoop = () => {
            const state = stateRef.current;
            
            // Screen shake translation
            if (state.screenShake > 0) {
                ctx.save();
                ctx.translate(Math.random() * state.screenShake - state.screenShake/2, Math.random() * state.screenShake - state.screenShake/2);
                state.screenShake -= 1;
            } else {
                ctx.save();
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (state.status === 'PLAYING') {
                updatePlayingState(state, canvas.width);
            } else if (state.status === 'CINEMATIC') {
                updateCinematicState(state);
            } else if (state.status === 'GAMEOVER') {
                // Keep the cinematic scene alive and animating
                state.frames++;
                const v = state.vecna;
                v.hoverTick += 0.05;
                v.y += Math.sin(v.hoverTick) * 0.2;

                if (state.frames % 5 === 0) {
                    state.tkParticles.push({
                        x: state.eleven.x + state.eleven.width,
                        y: GROUND_Y - state.eleven.height / 2,
                        vx: (v.x - state.eleven.x) * 0.02 + (Math.random() * 2 - 1),
                        vy: (v.y - (GROUND_Y - state.eleven.height / 2)) * 0.02 + (Math.random() * 2 - 1),
                        life: 1.0,
                        isRed: true 
                    });
                }
                state.tkParticles.forEach(p => {
                    p.x += p.vx * 0.5;
                    p.y += p.vy * 0.5;
                    p.life -= 0.01;
                });
                state.tkParticles = state.tkParticles.filter(p => p.life > 0);
            }

            renderEnvironment(ctx, canvas.width, canvas.height, state);
            renderEntities(ctx, state);
            renderWeather(ctx, canvas.width, canvas.height, state);
            renderLightningBolts(ctx, state);

            ctx.restore(); // Restore from shake translation

            animationId = requestAnimationFrame(gameLoop);
        };

        gameLoop();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, []);

    // UI Overlay Rendering
    let overlayUI = null;

    if (gameState === 'START') {
        overlayUI = (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 animate-fade-in pointer-events-none">
                <h2 className="text-4xl font-stranger text-neon-red mb-4 tracking-widest text-center">VECNA ESCAPE<br/><span className="text-sm font-mono tracking-normal text-white drop-shadow-none opacity-80">SURVIVE ELEVEN'S WRATH</span></h2>
                <p className="text-white font-mono text-center max-w-sm mb-6 opacity-70">
                    Run through the Upside Down apocalypse.<br/><br/>
                    [SPACE/UP]: Jump<br/>
                    [DOWN]: Slide<br/><br/>
                    Mistakes bring her closer.
                </p>
                <div className="text-neon-cyan font-bold font-terminal animate-pulse blink-slow mt-4">
                    PRESS [SPACE] OR CLICK TO START
                </div>
            </div>
        );
    } else if (gameState === 'GAMEOVER') {
         overlayUI = (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-30 animate-fade-in pointer-events-auto shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-stranger text-hawkins-red mb-2 tracking-[0.2em] shadow-red drop-shadow-[0_0_15px_rgba(255,0,0,1)] text-center px-4">VECNA LOST</h2>
                <h3 className="text-xl md:text-2xl font-terminal text-hawkins-text mb-8 tracking-widest text-center animate-pulse opacity-90 drop-shadow-md">CAUGHT BY ELEVEN</h3>
                
                <div className="flex flex-col gap-2 md:gap-4 text-center font-mono text-sm md:text-xl mb-8 md:mb-12 bg-black/80 px-6 py-4 md:p-6 border border-hawkins-cyan shadow-lg backdrop-blur-sm max-w-[90%] sm:max-w-sm w-full mx-4">
                    <div className="flex justify-between w-full">
                        <span className="text-hawkins-cyan/80 text-left">DISTANCE TRAVELED:</span>
                        <span className="text-white font-bold tracking-wider text-right">{uiDistance}m</span>
                    </div>
                    <div className="flex justify-between w-full">
                        <span className="text-hawkins-cyan/80 text-left">FRAGMENTS:</span>
                        <span className="text-white font-bold tracking-wider text-right">{uiScore}</span>
                    </div>
                    <div className="flex justify-between w-full">
                        <span className="text-hawkins-cyan/80 text-left">FINAL SPEED:</span>
                        <span className="text-white font-bold tracking-wider text-right">{uiSpeed} km/h</span>
                    </div>
                </div>
                
                <button 
                    className="text-neon-cyan font-bold font-mono animate-pulse blink-slow border-2 border-neon-cyan px-6 py-3 hover:bg-hawkins-cyan/20 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.4)]" 
                    onClick={(e) => { e.stopPropagation(); resetGame(); }}
                >
                    [ RETRY EXPERIMENT ]
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-5xl rounded-lg overflow-hidden border-2 border-[#1a0510] shadow-[0_0_50px_rgba(255,0,60,0.3)] bg-black" onClick={() => { if(gameState === 'START' || gameState==='GAMEOVER') handleInput('JUMP'); }}>
            {/* Real-time HUD */}
            {gameState === 'PLAYING' && (
                <div className="absolute top-4 right-6 text-right font-mono z-10 text-white drop-shadow-md pointer-events-none">
                    <div className="text-xl">DISTANCE: <span className="text-neon-cyan">{uiDistance}m</span></div>
                    <div className="text-sm opacity-80">FRAGMENTS: {uiScore}</div>
                    <div className="text-sm opacity-60 text-hawkins-red">Eleven Dist: {Math.max(0, stateRef.current.eleven.distance)}m</div>
                </div>
            )}
            
            {overlayUI}

            <canvas 
                ref={canvasRef}
                className="w-full h-auto max-h-[600px] object-contain cursor-crosshair mix-blend-screen"
                style={{ imageRendering: 'pixelated' }}
            />
            
            {/* Cinematic color grading overlay */}
            <div className="absolute inset-0 z-0 mix-blend-color pointer-events-none bg-gradient-to-b from-red-900/10 via-orange-900/10 to-blue-900/10"></div>
            
            {/* VHS Grid Lines Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20" 
                style={{
                    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
                    backgroundSize: '100% 4px'
                }} 
            ></div>
        </div>
    );
};

export default VecnaEscape;
