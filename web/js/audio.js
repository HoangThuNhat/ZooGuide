/**
 * ZooGuide - Smart Audio Narration Engine
 * Features: Multi-language Audio, Web Speech Synthesis Fallback, Interactive Transcript & Karaoke Highlights
 */

const AudioEngine = {
    currentAnimalId: null,
    currentNarration: null,
    isPlaying: false,
    currentTime: 0,
    duration: 120,
    playbackRate: 1.0,
    timer: null,
    synth: window.speechSynthesis,
    speechUtterance: null,
    useSynth: true, // Uses natural SpeechSynthesis fallback for genuine audible narration

    init() {
        this.bindEvents();
    },

    async playAnimalAudio(animalId, startAutoplay = true) {
        if (!TicketManager.hasActiveSession()) {
            TicketManager.openModal();
            if (window.ZooApp && window.ZooApp.showToast) {
                window.ZooApp.showToast("Vui lòng quét hoặc nhập mã vé để nghe thuyết minh!", "warning");
            }
            return;
        }

        const lang = window.ZooApp ? window.ZooApp.currentLang : 'vi';
        const res = await ZooApi.getNarration(animalId, lang);

        if (!res.success) {
            if (window.ZooApp) window.ZooApp.showToast("Không tìm thấy dữ liệu thuyết minh", "error");
            return;
        }

        this.currentAnimalId = animalId;
        this.currentNarration = res.data;
        this.duration = res.data.durationSec || 120;
        this.currentTime = 0;

        const animal = MOCK_DB.animals.find(a => a.id === parseInt(animalId));

        // Update Bottom Bar UI
        this.renderPlayerBar(animal, res.data);
        this.renderTranscriptModal(animal, res.data);

        // Show Player Bar
        const bar = document.getElementById('floating-audio-bar');
        if (bar) bar.classList.remove('hidden');

        if (startAutoplay) {
            this.play();
        }
    },

    renderPlayerBar(animal, narration) {
        const titleEl = document.getElementById('player-track-title');
        const subtitleEl = document.getElementById('player-track-subtitle');
        const thumbEl = document.getElementById('player-track-thumb');
        const totalTimeEl = document.getElementById('player-total-time');

        if (titleEl) titleEl.textContent = narration.title;
        if (subtitleEl) subtitleEl.textContent = `${animal.nameVi} • ${narration.narrator}`;
        if (thumbEl) thumbEl.src = animal.imageUrl;
        if (totalTimeEl) totalTimeEl.textContent = narration.durationFormatted || this.formatTime(this.duration);
    },

    renderTranscriptModal(animal, narration) {
        const modalTitle = document.getElementById('transcript-modal-title');
        const modalNarrator = document.getElementById('transcript-modal-narrator');
        const transcriptContainer = document.getElementById('transcript-lines-container');

        if (modalTitle) modalTitle.textContent = narration.title;
        if (modalNarrator) modalNarrator.textContent = `Giọng đọc: ${narration.narrator}`;

        if (transcriptContainer && narration.transcript) {
            transcriptContainer.innerHTML = narration.transcript.map((line, idx) => `
                <div class="transcript-line" data-time="${line.time}" id="t-line-${idx}">
                    <span class="transcript-timestamp">${this.formatTime(line.time)}</span>
                    <p class="transcript-text">${line.text}</p>
                </div>
            `).join('');

            // Click timestamp to seek
            transcriptContainer.querySelectorAll('.transcript-line').forEach(lineEl => {
                lineEl.addEventListener('click', () => {
                    const time = parseInt(lineEl.getAttribute('data-time'));
                    this.seekTo(time);
                });
            });
        }
    },

    play() {
        this.isPlaying = true;
        this.updatePlayButtonUI(true);

        if (this.useSynth && this.synth && this.currentNarration && this.currentNarration.transcript) {
            this.synth.cancel(); // Stop any ongoing speech
            const fullText = this.currentNarration.transcript.map(t => t.text).join(' ');
            this.speechUtterance = new SpeechSynthesisUtterance(fullText);
            this.speechUtterance.rate = this.playbackRate;
            this.speechUtterance.lang = (window.ZooApp && window.ZooApp.currentLang === 'en') ? 'en-US' : 'vi-VN';

            this.speechUtterance.onend = () => {
                this.pause();
                this.currentTime = this.duration;
                this.updateProgressUI();
            };

            this.synth.speak(this.speechUtterance);
        }

        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.currentTime >= this.duration) {
                this.pause();
                this.currentTime = this.duration;
            } else {
                this.currentTime += 1;
            }
            this.updateProgressUI();
            this.updateTranscriptHighlight();
        }, 1000 / this.playbackRate);
    },

    pause() {
        this.isPlaying = false;
        this.updatePlayButtonUI(false);
        clearInterval(this.timer);
        if (this.synth) {
            this.synth.pause();
            if (this.currentTime >= this.duration) {
                this.synth.cancel();
            }
        }
    },

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    },

    seekTo(seconds) {
        this.currentTime = Math.max(0, Math.min(seconds, this.duration));
        this.updateProgressUI();
        this.updateTranscriptHighlight();

        if (this.isPlaying) {
            this.play();
        }
    },

    skip(deltaSeconds) {
        this.seekTo(this.currentTime + deltaSeconds);
    },

    setSpeed(speed) {
        this.playbackRate = speed;
        if (this.isPlaying) {
            this.play();
        }
    },

    updatePlayButtonUI(playing) {
        const playBtns = document.querySelectorAll('.btn-audio-toggle-play');
        playBtns.forEach(btn => {
            if (playing) {
                btn.innerHTML = `
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                        <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                    </svg>
                `;
                btn.setAttribute('aria-label', 'Tạm dừng thuyết minh');
            } else {
                btn.innerHTML = `
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                `;
                btn.setAttribute('aria-label', 'Phát thuyết minh');
            }
        });
    },

    updateProgressUI() {
        const currentTimeEl = document.getElementById('player-current-time');
        const progressBar = document.getElementById('player-progress-fill');
        const scrubber = document.getElementById('player-scrubber');

        if (currentTimeEl) currentTimeEl.textContent = this.formatTime(this.currentTime);

        const pct = (this.currentTime / this.duration) * 100;
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (scrubber) scrubber.value = pct;
    },

    updateTranscriptHighlight() {
        if (!this.currentNarration || !this.currentNarration.transcript) return;

        const transcript = this.currentNarration.transcript;
        let activeIdx = 0;

        for (let i = 0; i < transcript.length; i++) {
            if (this.currentTime >= transcript[i].time) {
                activeIdx = i;
            }
        }

        document.querySelectorAll('.transcript-line').forEach((el, idx) => {
            if (idx === activeIdx) {
                el.classList.add('transcript-active');
                // Auto scroll into view
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                el.classList.remove('transcript-active');
            }
        });
    },

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    bindEvents() {
        // Play / Pause buttons
        document.querySelectorAll('.btn-audio-toggle-play').forEach(btn => {
            btn.addEventListener('click', () => this.togglePlay());
        });

        // Skip buttons
        const skipBack = document.getElementById('btn-audio-skip-back');
        if (skipBack) skipBack.addEventListener('click', () => this.skip(-10));

        const skipForward = document.getElementById('btn-audio-skip-fwd');
        if (skipForward) skipForward.addEventListener('click', () => this.skip(10));

        // Speed selector
        const speedSelect = document.getElementById('audio-speed-select');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.setSpeed(parseFloat(e.target.value));
            });
        }

        // Scrubber range input
        const scrubber = document.getElementById('player-scrubber');
        if (scrubber) {
            scrubber.addEventListener('input', (e) => {
                const pct = parseFloat(e.target.value);
                const targetSec = (pct / 100) * this.duration;
                this.seekTo(targetSec);
            });
        }

        // Open Transcript Modal
        const btnOpenTranscript = document.getElementById('btn-open-transcript');
        if (btnOpenTranscript) {
            btnOpenTranscript.addEventListener('click', () => {
                const modal = document.getElementById('transcript-modal');
                if (modal) modal.classList.remove('hidden');
            });
        }

        // Close Transcript Modal
        const btnCloseTranscript = document.getElementById('btn-close-transcript');
        if (btnCloseTranscript) {
            btnCloseTranscript.addEventListener('click', () => {
                const modal = document.getElementById('transcript-modal');
                if (modal) modal.classList.add('hidden');
            });
        }
    }
};

window.AudioEngine = AudioEngine;
