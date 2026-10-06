import React, { createContext, useContext, useState, useEffect } from 'react';
import { ZooApi } from '../services/api';

const AppContext = createContext(null);

const STORAGE_KEY = 'zooguide_ticket_session';

export const translations = {
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
};

export function AppProvider({ children }) {
    // Current Active Visitor Tab: 'map' | 'animals' | 'tickets'
    const [currentTab, setCurrentTab] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        return ['map', 'animals', 'tickets'].includes(hash) ? hash : 'map';
    });

    // Language state
    const [currentLang, setCurrentLang] = useState('vi');

    // Ticket Session state
    const [currentSession, setCurrentSession] = useState(null);

    // Modals
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [selectedAnimalForDetail, setSelectedAnimalForDetail] = useState(null);
    const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

    // Audio Engine State
    const [audioState, setAudioState] = useState({
        animal: null,
        narration: null,
        isPlaying: false,
        currentTime: 0,
        duration: 120,
        playbackRate: 1.0,
        isVisible: false
    });

    // Navigation / Wayfinding State for Map
    const [navTargetAnimal, setNavTargetAnimal] = useState(null);
    const [filterZone, setFilterZone] = useState('all');

    // Toast notifications
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3600);
    };

    // Load session on startup
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (new Date(parsed.expiresAt) > new Date()) {
                    setCurrentSession(parsed);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                    sessionStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (e) {
            console.error("Error loading session:", e);
        }

        // Welcome greeting
        const timer = setTimeout(() => {
            const hasSession = localStorage.getItem(STORAGE_KEY);
            if (!hasSession) {
                showToast("Chào mừng đến với ZooGuide! Hãy quét mã vé để mở khóa đầy đủ tính năng.", "info");
            }
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    // Listen to window hash change
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '') || 'map';
            if (['map', 'animals', 'tickets'].includes(hash)) {
                setCurrentTab(hash);
            }
        };
        window.addEventListener('popstate', handleHashChange);
        return () => window.removeEventListener('popstate', handleHashChange);
    }, []);

    const switchTab = (tabId, updateHistory = true) => {
        setCurrentTab(tabId);
        if (updateHistory) {
            window.location.hash = `#${tabId}`;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const setLanguage = (lang) => {
        if (!['vi', 'en'].includes(lang)) return;
        setCurrentLang(lang);
        const t = translations[lang];
        showToast(t.languageChanged, "info");
    };

    const validateTicketCode = async (code) => {
        const res = await ZooApi.validateTicket(code);
        if (res.success) {
            setCurrentSession(res.session);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.session));
            setIsTicketModalOpen(false);
            showToast("Mở khóa phiên tham quan thành công!", "success");
            return { success: true };
        } else {
            return { success: false, message: res.message };
        }
    };

    const clearSession = () => {
        setCurrentSession(null);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        showToast("Đã kết thúc phiên tham quan", "info");
    };

    const hasActiveSession = !!currentSession;

    return (
        <AppContext.Provider value={{
            currentTab,
            switchTab,
            currentLang,
            setLanguage,
            currentSession,
            hasActiveSession,
            validateTicketCode,
            clearSession,
            isTicketModalOpen,
            setIsTicketModalOpen,
            selectedAnimalForDetail,
            setSelectedAnimalForDetail,
            isTranscriptModalOpen,
            setIsTranscriptModalOpen,
            audioState,
            setAudioState,
            navTargetAnimal,
            setNavTargetAnimal,
            filterZone,
            setFilterZone,
            toasts,
            showToast,
            t: translations[currentLang]
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
