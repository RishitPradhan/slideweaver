/**
 * Mr. Clarke's Briefing Generator — Frontend Logic
 * Handles file upload, presentation generation, preview, and download.
 */

// ── DOM Elements ─────────────────────────────────────────────
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const generateSection = document.getElementById('generateSection');
const topicInput = document.getElementById('topicInput');
const slideCount = document.getElementById('slideCount');
const slideCountDisplay = document.getElementById('slideCountDisplay');
const generateBtn = document.getElementById('generateBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressLog = document.getElementById('progressLog');
const resultSection = document.getElementById('resultSection');
const resultTitle = document.getElementById('resultTitle');
const resultInfo = document.getElementById('resultInfo');
const downloadBtn = document.getElementById('downloadBtn');
const newBriefingBtn = document.getElementById('newBriefingBtn');
const systemStatus = document.getElementById('systemStatus');
const previewBtn = document.getElementById('previewBtn');
const previewModal = document.getElementById('previewModal');
const slideCanvas = document.getElementById('slideCanvas');
const slideCounter = document.getElementById('slideCounter');
const prevSlide = document.getElementById('prevSlide');
const nextSlide = document.getElementById('nextSlide');
const closePreview = document.getElementById('closePreview');
const listenSlide = document.getElementById('listenSlide');

// ── State ────────────────────────────────────────────────────
let selectedFiles = [];
let previewSlides = [];
let currentSlideIdx = 0;

// ── File Selection ───────────────────────────────────────────

browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    addFiles(Array.from(e.target.files));
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    addFiles(Array.from(e.dataTransfer.files));
});

function addFiles(files) {
    const validFiles = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return ['pdf', 'txt'].includes(ext);
    });
    if (validFiles.length === 0) {
        alert('⚠ Only PDF and TXT files are supported.');
        return;
    }
    selectedFiles = [...selectedFiles, ...validFiles];
    renderFileList();
    uploadBtn.style.display = 'inline-flex';
}

function renderFileList() {
    fileList.innerHTML = selectedFiles.map((file, idx) => `
        <div class="file-item">
            <span class="file-icon">${file.name.endsWith('.pdf') ? '📄' : '📝'}</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatSize(file.size)}</span>
            <button class="file-remove" onclick="removeFile(${idx})">✕</button>
        </div>
    `).join('');
}

function removeFile(idx) {
    selectedFiles.splice(idx, 1);
    renderFileList();
    if (selectedFiles.length === 0) uploadBtn.style.display = 'none';
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// ── Slide Count Slider ──────────────────────────────────────

slideCount.addEventListener('input', () => {
    slideCountDisplay.textContent = slideCount.value;
});

// ── Upload Documents ─────────────────────────────────────────

uploadBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    uploadBtn.disabled = true;
    uploadBtn.querySelector('.btn-text').textContent = '⏳ UPLOADING...';
    systemStatus.textContent = 'PROCESSING DOCUMENTS';

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));

    try {
        const response = await fetch('/upload-documents', {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (response.ok) {
            systemStatus.textContent = `${data.chunks_count} CHUNKS INDEXED`;
            generateSection.style.display = 'block';
            generateSection.scrollIntoView({ behavior: 'smooth' });
            uploadBtn.querySelector('.btn-text').textContent = '✓ DOCUMENTS PROCESSED';
            uploadBtn.style.borderColor = '#39ff14';
            uploadBtn.style.color = '#39ff14';
        } else {
            throw new Error(data.detail || 'Upload failed');
        }
    } catch (error) {
        alert('⚠ Upload Error: ' + error.message);
        uploadBtn.disabled = false;
        uploadBtn.querySelector('.btn-text').textContent = '⬆ UPLOAD & PROCESS';
        systemStatus.textContent = 'ERROR — RETRY UPLOAD';
    }
});

// ── Generate Presentation ────────────────────────────────────

generateBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) {
        topicInput.style.borderColor = '#ff2a2a';
        topicInput.focus();
        setTimeout(() => topicInput.style.borderColor = '', 2000);
        return;
    }

    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').textContent = '⏳ GENERATING...';
    systemStatus.textContent = 'GENERATING BRIEFING';

    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    progressSection.scrollIntoView({ behavior: 'smooth' });

    const progressSteps = [
        { pct: 10, msg: '> Querying document database...' },
        { pct: 25, msg: '> Retrieving relevant intel chunks...' },
        { pct: 40, msg: '> Contacting AI intelligence core...' },
        { pct: 55, msg: '> Generating slide outline...' },
        { pct: 70, msg: '> Applying Hawkins Lab classification theme...' },
        { pct: 85, msg: '> Building PPTX presentation...' },
        { pct: 92, msg: '> Adding entrance animations...' },
    ];

    let stepIdx = 0;
    const progressInterval = setInterval(() => {
        if (stepIdx < progressSteps.length) {
            const step = progressSteps[stepIdx];
            progressFill.style.width = step.pct + '%';
            addLogEntry(step.msg);
            stepIdx++;
        }
    }, 800);

    const formData = new FormData();
    formData.append('topic', topic);
    formData.append('num_slides', slideCount.value);

    try {
        const response = await fetch('/generate-presentation', {
            method: 'POST',
            body: formData,
        });

        clearInterval(progressInterval);
        const data = await response.json();

        if (response.ok) {
            progressFill.style.width = '100%';
            addLogEntry('> ✓ BRIEFING GENERATION COMPLETE');
            addLogEntry(`> Title: ${data.title}`);
            addLogEntry(`> Slides: ${data.slides_count}`);

            setTimeout(() => {
                progressSection.style.display = 'none';
                resultSection.style.display = 'block';
                resultTitle.textContent = data.title || 'Briefing Ready';
                resultInfo.textContent = `${data.slides_count} slides generated — Ready for download`;
                downloadBtn.href = data.download_url;
                downloadBtn.download = data.filename;
                resultSection.scrollIntoView({ behavior: 'smooth' });
                systemStatus.textContent = 'BRIEFING READY';
            }, 1000);
        } else {
            throw new Error(data.detail || 'Generation failed');
        }
    } catch (error) {
        clearInterval(progressInterval);
        progressFill.style.width = '0%';
        addLogEntry('> ⚠ ERROR: ' + error.message);
        systemStatus.textContent = 'ERROR — CHECK INPUT';
        alert('⚠ Generation Error: ' + error.message);
    }

    generateBtn.disabled = false;
    generateBtn.querySelector('.btn-text').textContent = '⚡ GENERATE BRIEFING';
});

function addLogEntry(text) {
    const entry = document.createElement('p');
    entry.className = 'log-entry';
    entry.textContent = text;
    progressLog.appendChild(entry);
    progressLog.scrollTop = progressLog.scrollHeight;
}

// ── Preview Slides ───────────────────────────────────────────

previewBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/preview-slides');
        if (!response.ok) throw new Error('No preview data');
        const data = await response.json();

        previewSlides = data.slides || [];
        if (previewSlides.length === 0) {
            alert('No slides to preview.');
            return;
        }

        currentSlideIdx = 0;
        renderSlide();
        previewModal.style.display = 'flex';
    } catch (err) {
        alert('⚠ Could not load preview: ' + err.message);
    }
});

closePreview.addEventListener('click', () => {
    previewModal.style.display = 'none';
    if (window.stopNarration) window.stopNarration();
});

prevSlide.addEventListener('click', () => {
    if (currentSlideIdx > 0) {
        if (window.stopNarration) window.stopNarration();
        currentSlideIdx--;
        renderSlide();
    }
});

nextSlide.addEventListener('click', () => {
    if (currentSlideIdx < previewSlides.length - 1) {
        if (window.stopNarration) window.stopNarration();
        currentSlideIdx++;
        renderSlide();
    }
});

listenSlide.addEventListener('click', () => {
    if (window.startNarration) {
        const text = slideCanvas.innerText || slideCanvas.textContent;
        window.startNarration(text);
    }
});

// Keyboard nav
document.addEventListener('keydown', (e) => {
    if (previewModal.style.display !== 'flex') return;
    if (e.key === 'ArrowLeft') prevSlide.click();
    if (e.key === 'ArrowRight') nextSlide.click();
    if (e.key === 'Escape') closePreview.click();
});

function renderSlide() {
    const slide = previewSlides[currentSlideIdx];
    slideCounter.textContent = `${currentSlideIdx + 1} / ${previewSlides.length}`;

    if (slide.type === 'title') {
        slideCanvas.className = 'slide-canvas title-slide';
        slideCanvas.innerHTML = `
            <div class="slide-big-title">${escapeHtml(slide.title || '')}</div>
            <div class="slide-subtitle">${escapeHtml(slide.subtitle || '')}</div>
            <div class="slide-badge">HAWKINS NATIONAL LABORATORY — CLASSIFIED</div>
        `;
    } else if (slide.type === 'bullet_points') {
        slideCanvas.className = 'slide-canvas';
        const bullets = (slide.bullet_points || []).map(b => `<li>${escapeHtml(b)}</li>`).join('');
        slideCanvas.innerHTML = `
            <div class="slide-title-bar"><h3>${escapeHtml(slide.title || '')}</h3></div>
            <div class="slide-body"><ul>${bullets}</ul></div>
        `;
    } else {
        slideCanvas.className = 'slide-canvas';
        slideCanvas.innerHTML = `
            <div class="slide-title-bar"><h3>${escapeHtml(slide.title || '')}</h3></div>
            <div class="slide-body"><p>${escapeHtml(slide.content || '')}</p></div>
        `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ── New Briefing ─────────────────────────────────────────────

newBriefingBtn.addEventListener('click', () => {
    resultSection.style.display = 'none';
    progressSection.style.display = 'none';
    progressFill.style.width = '0%';
    progressLog.innerHTML = '<p class="log-entry">> Initializing briefing protocol...</p>';
    topicInput.value = '';
    generateSection.scrollIntoView({ behavior: 'smooth' });
    systemStatus.textContent = 'READY FOR NEW BRIEFING';
});

// ── Keyboard shortcut ────────────────────────────────────────
topicInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generateBtn.click();
});
