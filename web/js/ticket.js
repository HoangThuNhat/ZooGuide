/**
 * ZooGuide - Ticket & Session Management
 * Handles QR Scanner, Ticket Validation, and Visitor State
 */

const TicketManager = {
    STORAGE_KEY: 'zooguide_ticket_session',
    currentSession: null,

    init() {
        this.loadSession();
        this.bindEvents();
        this.updateUI();
    },

    loadSession() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Check expiry
                if (new Date(parsed.expiresAt) > new Date()) {
                    this.currentSession = parsed;
                } else {
                    this.clearSession();
                }
            }
        } catch (e) {
            console.error("Error loading session:", e);
            this.clearSession();
        }
    },

    hasActiveSession() {
        return !!this.currentSession;
    },

    getSession() {
        return this.currentSession;
    },

    saveSession(session) {
        this.currentSession = session;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
        this.updateUI();
        window.dispatchEvent(new CustomEvent('ticketSessionChanged', { detail: session }));
    },

    clearSession() {
        this.currentSession = null;
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.updateUI();
        window.dispatchEvent(new CustomEvent('ticketSessionChanged', { detail: null }));
    },

    async validateCode(code) {
        const errorEl = document.getElementById('ticket-error-msg');
        const submitBtn = document.getElementById('btn-submit-ticket');

        if (errorEl) {
            errorEl.classList.add('hidden');
            errorEl.textContent = '';
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10"></path>
                </svg>
                <span>Đang xác thực vé...</span>
            `;
        }

        try {
            const result = await ZooApi.validateTicket(code);
            if (result.success) {
                this.saveSession(result.session);
                this.closeModal();
                if (window.ZooApp && window.ZooApp.showToast) {
                    window.ZooApp.showToast("Mở khóa phiên tham quan thành công!", "success");
                }
            } else {
                if (errorEl) {
                    errorEl.textContent = result.message;
                    errorEl.classList.remove('hidden');
                }
            }
        } catch (err) {
            if (errorEl) {
                errorEl.textContent = "Lỗi đường truyền. Vui lòng thử lại.";
                errorEl.classList.remove('hidden');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Kích hoạt vé tham quan</span>
                `;
            }
        }
    },

    bindEvents() {
        // Form submit
        const form = document.getElementById('ticket-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('ticket-input');
                if (input && input.value) {
                    this.validateCode(input.value);
                }
            });
        }

        // Quick demo buttons
        const demoVipBtn = document.getElementById('btn-demo-vip');
        if (demoVipBtn) {
            demoVipBtn.addEventListener('click', () => {
                const input = document.getElementById('ticket-input');
                if (input) input.value = "ZOO-8899-VIP";
                this.validateCode("ZOO-8899-VIP");
            });
        }

        const demoStdBtn = document.getElementById('btn-demo-std');
        if (demoStdBtn) {
            demoStdBtn.addEventListener('click', () => {
                const input = document.getElementById('ticket-input');
                if (input) input.value = "ZOO-1234-STD";
                this.validateCode("ZOO-1234-STD");
            });
        }

        // Camera QR scan simulation
        const qrScanTrigger = document.getElementById('btn-simulate-qr');
        if (qrScanTrigger) {
            qrScanTrigger.addEventListener('click', () => {
                this.simulateQRScan();
            });
        }

        // Logout/Exit session
        const exitBtn = document.getElementById('btn-exit-session');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                if (confirm("Quý khách có chắc chắn muốn kết thúc phiên tham quan hiện tại?")) {
                    this.clearSession();
                    if (window.ZooApp && window.ZooApp.showToast) {
                        window.ZooApp.showToast("Đã kết thúc phiên tham quan", "info");
                    }
                }
            });
        }
    },

    simulateQRScan() {
        const qrLine = document.querySelector('.qr-scanline');
        const statusText = document.getElementById('qr-scan-status');
        if (statusText) statusText.textContent = "Đang nhận diện mã QR trên vé...";
        
        setTimeout(() => {
            if (statusText) statusText.textContent = "Đã quét thấy mã: ZOO-8899-VIP";
            setTimeout(() => {
                this.validateCode("ZOO-8899-VIP");
            }, 600);
        }, 1200);
    },

    openModal() {
        const modal = document.getElementById('ticket-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('modal-open');
            const input = document.getElementById('ticket-input');
            if (input) input.focus();
        }
    },

    closeModal() {
        const modal = document.getElementById('ticket-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    },

    updateUI() {
        const session = this.currentSession;
        const badge = document.getElementById('ticket-status-badge');
        const lockOverlays = document.querySelectorAll('.ticket-lock-overlay');
        const sessionInfo = document.getElementById('active-session-info');
        const sessionCode = document.getElementById('badge-ticket-code');
        const sessionOwner = document.getElementById('badge-ticket-owner');
        const sessionType = document.getElementById('badge-ticket-type');

        if (session) {
            // Unlocked
            if (badge) {
                badge.classList.remove('badge-locked');
                badge.classList.add('badge-active');
                badge.title = `Vé: ${session.ticketCode} - ${session.ticketType}`;
            }
            if (sessionCode) sessionCode.textContent = session.ticketCode;
            if (sessionOwner) sessionOwner.textContent = session.customerName;
            if (sessionType) sessionType.textContent = session.ticketType;
            if (sessionInfo) sessionInfo.classList.remove('hidden');

            lockOverlays.forEach(el => el.classList.add('hidden'));
        } else {
            // Locked
            if (badge) {
                badge.classList.add('badge-locked');
                badge.classList.remove('badge-active');
                badge.title = "Chưa quét mã vé";
            }
            if (sessionInfo) sessionInfo.classList.add('hidden');
            lockOverlays.forEach(el => el.classList.remove('hidden'));
        }
    }
};

window.TicketManager = TicketManager;
