/**
 * Stranger Things — Survive the Upside Down
 * Embedded loading game engine for PDF-to-PPT conversion.
 * Exposes: window.startGame(), window.gameUpdateProgress(v), window.gameConversionComplete(url)
 */
(function () {
  'use strict';

  /* ── DOM ──────────────────────────────────────────────── */
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return; // guard
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const hudScore = document.getElementById('hudScore');
  const hudLives = document.getElementById('hudLives');
  const hudWave  = document.getElementById('hudWave');
  const progFill = document.getElementById('gameProgressFill');
  const lightsRow = document.getElementById('gameLightsRow');
  const gravWarn = document.getElementById('gravityWarning');
  const goOverlay = document.getElementById('gameOverOverlay');
  const vicOverlay = document.getElementById('victoryOverlay');
  const goScoreEl = document.getElementById('goScore');
  const vicScoreEl = document.getElementById('victoryScore');
  const restartBtn = document.getElementById('restartBtn');

  /* ── Christmas Lights ────────────────────────────────── */
  const LIGHT_CT = 30;
  const LIGHT_COLORS = ['#ff2244','#ff6622','#ffcc00','#22ff44','#2266ff','#cc22ff','#ff22aa'];
  for (let i = 0; i < LIGHT_CT; i++) {
    const b = document.createElement('div');
    b.className = 'light-bulb';
    b.style.setProperty('--c', LIGHT_COLORS[i % LIGHT_COLORS.length]);
    lightsRow.appendChild(b);
  }
  const bulbs = lightsRow.querySelectorAll('.light-bulb');

  /* ── State ───────────────────────────────────────────── */
  let score = 0, lives = 3, wave = 1;
  let running = false, over = false, done = false;
  let flipped = false, flipTimer = 0, showWarn = false;
  let spawnTimer = 0, spawnInt = 70, frameCount = 0, fireCD = 0;
  const FLIP_INT = 20 * 60;
  const WARN_B   = 3 * 60;
  let animId = null;

  const player = { x: W / 2, y: H - 40, speed: 5 };
  const keys = { left: false, right: false, fire: false };
  let bullets = [], enemies = [], particles = [], bgParts = [];

  /* ── BG Particles ────────────────────────────────────── */
  function initBG() {
    bgParts = [];
    for (let i = 0; i < 15; i++) {
      bgParts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .3,
        r: 2 + Math.random() * 4, a: Math.random() * .4,
        type: Math.random() > .5 ? 'vine' : 'shadow',
      });
    }
  }

  /* ── Draw Helpers ────────────────────────────────────── */
  function drawShip(x, y, flip) {
    ctx.save(); ctx.translate(x, y);
    if (flip) ctx.scale(1, -1);
    ctx.fillStyle = '#ff2244';
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(-14, 12); ctx.lineTo(-6, 8);
    ctx.lineTo(0, 14); ctx.lineTo(6, 8); ctx.lineTo(14, 12);
    ctx.closePath(); ctx.fill();
    ctx.shadowColor = '#ff0033'; ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff4466';
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-6, 6); ctx.lineTo(6, 6);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }

  function drawDemo(x, y, r) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#881122'; ctx.shadowColor = '#ff0033'; ctx.shadowBlur = 10;
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.rotate((i / 5) * Math.PI * 2);
      ctx.beginPath(); ctx.ellipse(0, -r * .6, r * .35, r * .7, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#330008';
    ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        r: 1.5 + Math.random() * 2.5, life: 30 + Math.random() * 20, maxLife: 50,
        color,
      });
    }
  }

  /* ── Spawn ───────────────────────────────────────────── */
  function spawnEnemy() {
    const t = Math.random(), x = 20 + Math.random() * (W - 40);
    const base = 1 + wave * .3;
    if (t < .7) {
      enemies.push({ x, y: flipped ? H + 20 : -20, r: 14 + Math.random() * 6,
        speed: base + Math.random() * 1.2, type: 'demo', hp: 1 });
    } else if (t < .85) {
      enemies.push({ x, y: flipped ? H + 15 : -15, r: 8,
        speed: base + 1.5 + Math.random(), type: 'vine', hp: 1 });
    } else {
      enemies.push({ x, y: flipped ? H + 12 : -12, r: 10 + Math.random() * 5,
        speed: base * .7, type: 'shadow', hp: 2 });
    }
  }

  /* ── Update ──────────────────────────────────────────── */
  function update() {
    if (!running || done) return;
    frameCount++;

    // Gravity flip
    flipTimer++;
    const ttFlip = FLIP_INT - (flipTimer % FLIP_INT);
    if (ttFlip <= WARN_B && ttFlip > 0 && !showWarn) {
      showWarn = true; gravWarn.classList.add('show');
    }
    if (flipTimer % FLIP_INT === 0 && flipTimer > 0) {
      flipped = !flipped; showWarn = false; gravWarn.classList.remove('show');
      player.y = flipped ? 40 : H - 40;
    }
    if (ttFlip > WARN_B && showWarn) { showWarn = false; gravWarn.classList.remove('show'); }

    // Movement
    if (keys.left && player.x > 18) player.x -= player.speed;
    if (keys.right && player.x < W - 18) player.x += player.speed;

    // Fire
    if (fireCD > 0) fireCD--;
    if (keys.fire && fireCD <= 0) {
      const d = flipped ? 1 : -1;
      bullets.push({ x: player.x, y: player.y + d * 14, vy: d * 7 });
      fireCD = 12;
    }

    // Bullets
    bullets = bullets.filter(b => { b.y += b.vy; return b.y > -10 && b.y < H + 10; });

    // Spawn
    spawnTimer++;
    if (spawnTimer >= spawnInt) { spawnEnemy(); spawnTimer = 0; }

    // Enemies
    const dir = flipped ? -1 : 1;
    enemies = enemies.filter(e => {
      e.y += e.speed * dir;
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi], dx = b.x - e.x, dy = b.y - e.y;
        if (Math.sqrt(dx * dx + dy * dy) < e.r + 4) {
          bullets.splice(bi, 1); e.hp--;
          burst(e.x, e.y, '#ff3355', 6);
          if (e.hp <= 0) {
            score += e.type === 'shadow' ? 15 : 10;
            burst(e.x, e.y, '#cc1133', 12);
            return false;
          }
        }
      }
      if (flipped ? e.y < -30 : e.y > H + 30) {
        lives--;
        if (lives <= 0) triggerGameOver();
        return false;
      }
      return true;
    });

    // Waves
    if (frameCount % (600 - wave * 30) === 0 && spawnInt > 25) {
      wave++; spawnInt = Math.max(25, 70 - wave * 5);
    }

    // Particles
    particles = particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
    bgParts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    });

    updateHUD();
  }

  /* ── Render ──────────────────────────────────────────── */
  function render() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0005'); g.addColorStop(.5, '#120008'); g.addColorStop(1, '#0a0005');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // BG
    bgParts.forEach(p => {
      ctx.save(); ctx.globalAlpha = p.a;
      if (p.type === 'vine') {
        ctx.strokeStyle = '#441122'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x - 8, p.y);
        ctx.bezierCurveTo(p.x - 4, p.y - 6, p.x + 4, p.y + 6, p.x + 8, p.y);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#220011';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

    // Bullets
    ctx.fillStyle = '#ff4466'; ctx.shadowColor = '#ff2244'; ctx.shadowBlur = 6;
    bullets.forEach(b => ctx.fillRect(b.x - 1.5, b.y - 5, 3, 10));
    ctx.shadowBlur = 0;

    // Enemies
    enemies.forEach(e => {
      if (e.type === 'demo') { drawDemo(e.x, e.y, e.r); }
      else if (e.type === 'vine') {
        ctx.save(); ctx.strokeStyle = '#662233'; ctx.lineWidth = 2;
        ctx.shadowColor = '#aa1133'; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.moveTo(e.x - 8, e.y + 4);
        ctx.bezierCurveTo(e.x - 3, e.y - 8, e.x + 3, e.y + 8, e.x + 8, e.y - 4);
        ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
      } else {
        ctx.save(); ctx.globalAlpha = .7; ctx.fillStyle = '#330015';
        ctx.shadowColor = '#660022'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
      }
    });

    // Player
    if (running && !over) drawShip(player.x, player.y, flipped);

    // Particles
    particles.forEach(p => {
      ctx.save(); ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }

  function updateHUD() {
    hudScore.textContent = 'SCORE: ' + score;
    hudLives.textContent = Array(Math.max(0, lives)).fill('♥').join(' ');
    hudWave.textContent = 'WAVE ' + wave;
  }

  /* ── Game Over ───────────────────────────────────────── */
  function triggerGameOver() {
    over = true; running = false;
    goScoreEl.textContent = 'SCORE: ' + score;
    goOverlay.classList.add('show');
  }

  restartBtn.addEventListener('click', () => {
    if (done) return;
    goOverlay.classList.remove('show');
    resetState();
  });

  function resetState() {
    score = 0; lives = 3; wave = 1;
    flipped = false; flipTimer = 0; spawnTimer = 0; spawnInt = 70;
    frameCount = 0; fireCD = 0; showWarn = false;
    gravWarn.classList.remove('show');
    player.x = W / 2; player.y = H - 40;
    bullets = []; enemies = []; particles = [];
    over = false; running = true;
    updateHUD();
  }

  /* ── Loop ────────────────────────────────────────────── */
  function loop() {
    update(); render();
    if (!done) animId = requestAnimationFrame(loop);
  }

  /* ── Input ───────────────────────────────────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp') { keys.fire = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === ' ' || e.key === 'ArrowUp') keys.fire = false;
  });

  function addMobile(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
    el.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; });
    el.addEventListener('mousedown', () => keys[key] = true);
    el.addEventListener('mouseup', () => keys[key] = false);
    el.addEventListener('mouseleave', () => keys[key] = false);
  }
  addMobile('mLeft', 'left');
  addMobile('mRight', 'right');
  addMobile('mFire', 'fire');

  /* ── Light Flicker ───────────────────────────────────── */
  let flickerInterval = null;
  function startFlicker() {
    flickerInterval = setInterval(() => {
      if (done) return;
      const idx = Math.floor(Math.random() * LIGHT_CT);
      const b = bulbs[idx];
      if (!b.classList.contains('on')) {
        b.classList.add('on');
        setTimeout(() => { if (!b.classList.contains('celebrate')) b.classList.remove('on'); }, 200);
      }
    }, 400);
  }

  /* ══════════════════════════════════════════════════════
     PUBLIC API — called from app.js
     ══════════════════════════════════════════════════════ */

  /** Start the game (called when generation begins) */
  window.startGame = function () {
    done = false;
    goOverlay.classList.remove('show');
    vicOverlay.classList.remove('show');
    progFill.style.width = '0%';
    progFill.classList.remove('complete');
    bulbs.forEach(b => b.classList.remove('on', 'celebrate'));
    initBG();
    resetState();
    startFlicker();
    loop();
  };

  /** Update progress bar (0–100) and light up Christmas lights */
  window.gameUpdateProgress = function (value) {
    const v = Math.max(0, Math.min(100, value));
    progFill.style.width = v + '%';
    const litCt = Math.floor((v / 100) * LIGHT_CT);
    bulbs.forEach((b, i) => {
      if (i < litCt) b.classList.add('on');
      else b.classList.remove('on');
    });
  };

  /** Conversion finished — stop game, show victory */
  window.gameConversionComplete = function (downloadUrl) {
    done = true; running = false; over = false;
    goOverlay.classList.remove('show');
    gravWarn.classList.remove('show');
    if (flickerInterval) clearInterval(flickerInterval);

    progFill.style.width = '100%';
    progFill.classList.add('complete');
    bulbs.forEach(b => b.classList.add('on', 'celebrate'));

    vicScoreEl.textContent = 'FINAL SCORE: ' + score;
    vicOverlay.classList.add('show');

    // Final render
    render();
  };

  /** Stop the game silently (used when transitioning away) */
  window.stopGame = function () {
    done = true; running = false;
    if (flickerInterval) clearInterval(flickerInterval);
    if (animId) cancelAnimationFrame(animId);
  };
})();
