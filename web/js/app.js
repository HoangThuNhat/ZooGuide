/**
 * ZooGuide - Core Application Controller
 * Handles Navigation Tabs, Responsive Layouts, Multi-language (i18n), and Toast Feedback
 */

const ZooApp = {
    currentTab: 'map',
    currentLang: 'vi',

    translations: {
        vi: {
            appTitle: "ZooGuide • Thuyết Minh Tự Động Sở Thú",
            tabMap: "Bản Đồ",
            tabAnimals: "Khám Phá",
            tabTicket: "Vé Tham Quan",
            tabAdmin: "Khu Quản Lý",
            chatTitle: "Trợ Lý Vườn Thú",
            unlockedBadge: "Vé Hợp Lệ",
            lockedBadge: "Chưa Kích Hoạt",
            unlockCta: "Quét / Nhập vé để mở khóa",
            searchPlaceholder: "Tìm kiếm tên động vật, loài, khu vực...",
            audioPlayerBar: "Thuyết minh tự động",
            languageChanged: "Đã chuyển đổi sang Tiếng Việt"
        },
        en: {
            appTitle: "ZooGuide • Smart Zoo Audio Tour",
            tabMap: "Interactive Map",
            tabAnimals: "Discover Animals",
            tabTicket: "My Ticket",
            tabAdmin: "Staff & Admin",
            chatTitle: "Zoo Assistant",
            unlockedBadge: "Ticket Active",
            lockedBadge: "Locked",
            unlockCta: "Scan / Enter ticket to unlock",
            searchPlaceholder: "Search animal name, species, biome...",
            audioPlayerBar: "Smart Audio Narration",
            languageChanged: "Language switched to English"
        }
    },

    init() {
        this.bindNavigation();
        this.bindLanguageSwitcher();
        this.bindTicketEvents();

        // Initialize submodules safely
        if (window.TicketManager) window.TicketManager.init();
        if (window.ZooMap) window.ZooMap.init();
        if (window.AnimalsModule) window.AnimalsModule.init();
        if (window.AudioEngine) window.AudioEngine.init();
        if (window.ZooChatbot) window.ZooChatbot.init();
        if (window.AdminPortal) window.AdminPortal.init();

        // Check hash routing
        const hash = window.location.hash.replace('#', '');
        if (['map', 'animals', 'tickets', 'admin'].includes(hash)) {
            this.switchTab(hash);
        } else {
            this.switchTab('map');
        }

        // Welcome greeting
        setTimeout(() => {
            if (!TicketManager.hasActiveSession()) {
                this.showToast("Chào mừng đến với ZooGuide! Hãy quét mã vé để mở khóa đầy đủ tính năng.", "info");
            }
        }, 800);
    },

    bindNavigation() {
        // Desktop nav links and Mobile bottom nav items
        document.querySelectorAll('[data-nav-target]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const target = el.getAttribute('data-nav-target');
                this.switchTab(target);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.replace('#', '') || 'map';
            this.switchTab(hash, false);
        });
    },

    switchTab(tabId, updateHistory = true) {
        this.currentTab = tabId;

        // Update nav links active class
        document.querySelectorAll('[data-nav-target]').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-nav-target') === tabId);
            el.setAttribute('aria-selected', el.getAttribute('data-nav-target') === tabId ? 'true' : 'false');
        });

        // Update Tab Panes
        document.querySelectorAll('.tab-content-pane').forEach(pane => {
            pane.classList.toggle('hidden', pane.id !== `tab-pane-${tabId}`);
        });

        if (updateHistory) {
            window.location.hash = `#${tabId}`;
        }

        // Trigger map re-render or layout recalculation if switching to map
        if (tabId === 'map' && window.ZooMap) {
            window.ZooMap.resetView();
        }

        // Scroll to top of window
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    bindLanguageSwitcher() {
        const langSelect = document.getElementById('global-lang-select');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    },

    setLanguage(lang) {
        if (!['vi', 'en'].includes(lang)) return;
        this.currentLang = lang;

        const t = this.translations[lang];
        this.showToast(t.languageChanged, "info");

        // Reload audio if currently playing
        if (window.AudioEngine && window.AudioEngine.currentAnimalId) {
            window.AudioEngine.playAnimalAudio(window.AudioEngine.currentAnimalId, window.AudioEngine.isPlaying);
        }

        // Update animals list if loaded
        if (window.AnimalsModule) {
            window.AnimalsModule.loadAnimals();
        }
    },

    bindTicketEvents() {
        // Ticket badge click in header opens modal
        const ticketBadge = document.getElementById('ticket-status-badge');
        if (ticketBadge) {
            ticketBadge.addEventListener('click', () => {
                TicketManager.openModal();
            });
        }

        // Close ticket modal buttons
        const btnCloseTicket = document.getElementById('btn-close-ticket-modal');
        if (btnCloseTicket) {
            btnCloseTicket.addEventListener('click', () => {
                TicketManager.closeModal();
            });
        }

        const ticketBackdrop = document.querySelector('#ticket-modal .modal-backdrop');
        if (ticketBackdrop) {
            ticketBackdrop.addEventListener('click', () => {
                TicketManager.closeModal();
            });
        }

        // Lock overlay click
        document.querySelectorAll('.btn-unlock-ticket-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                TicketManager.openModal();
            });
        });
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'warning') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `
            <span class="toast-icon">${iconSvg}</span>
            <span class="toast-text">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 300);
        }, 3600);
    }
};

window.ZooApp = ZooApp;

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    ZooApp.init();
});
