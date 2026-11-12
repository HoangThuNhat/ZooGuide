import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ZooApi, {
    getStoredUser,
    checkAdminSessionValidity,
    recordAdminActivity,
    expireAdminSession,
    clearAuthSession,
    AUTH_STORAGE_KEY,
    AUTH_SESSION_META_KEY,
    AUTH_BROADCAST_CHANNEL
} from '../../../services/api';

// Chỉ ghi nhận các tương tác thực sự của người dùng (loại trừ mousemove, mouseover, mouseenter, scroll)
const VALID_ADMIN_ACTIVITY_EVENTS = [
    'mousedown',
    'keydown',
    'input',
    'change',
    'submit',
    'click',
    'touchstart'
];

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(() => getStoredUser());

    // Persistent desktop sidebar state (default: open on desktop)
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
        try {
            const saved = localStorage.getItem('zooguide_admin_sidebar_desktop');
            if (saved !== null) return saved === 'true';
        } catch (e) {}
        return true;
    });

    // Mobile drawer state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Track whether current screen is desktop (> 1024px)
    const [isDesktopScreen, setIsDesktopScreen] = useState(() => 
        typeof window !== 'undefined' ? window.innerWidth > 1024 : true
    );

    const redirectToLoginExpired = useCallback((reason = 'session_expired') => {
        setCurrentUser(null);
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        if (reason === 'manual_logout') {
            navigate('/admin/login', { replace: true });
        } else {
            navigate(`/admin/login?redirect=${redirectParam}&reason=session_expired`, { replace: true });
        }
    }, [location.pathname, location.search, navigate]);

    useEffect(() => {
        const handleResize = () => {
            const isDesktop = window.innerWidth > 1024;
            setIsDesktopScreen(isDesktop);
            if (isDesktop) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const validity = checkAdminSessionValidity();
        if (!validity.valid) {
            expireAdminSession(validity.reason || 'session_expired');
            redirectToLoginExpired('session_expired');
            return;
        }
        const u = getStoredUser();
        if (u) setCurrentUser(u);
    }, [location.pathname, redirectToLoginExpired]);

    // Bộ giám sát Inactivity Timeout (15 phút), Absolute Session Timeout (8 giờ) và đồng bộ đa tab
    useEffect(() => {
        let isDisposed = false;

        const verifyActiveSession = () => {
            if (isDisposed) return false;
            const validity = checkAdminSessionValidity();
            if (!validity.valid) {
                expireAdminSession(validity.reason || 'session_expired');
                redirectToLoginExpired('session_expired');
                return false;
            }
            return true;
        };

        const handleValidUserActivity = (event) => {
            if (isDisposed) return;
            // Bỏ qua các sự kiện tự động của trình duyệt không xuất phát từ thao tác người dùng
            if (event && event.isTrusted === false) return;
            const updated = recordAdminActivity();
            if (!updated) {
                const validity = checkAdminSessionValidity();
                if (!validity.valid) {
                    redirectToLoginExpired('session_expired');
                }
            }
        };

        const handleVisibilityOrFocus = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            verifyActiveSession();
        };

        const handleUnauthorizedEvent = (event) => {
            if (isDisposed) return;
            const reason = event?.detail?.reason || 'session_expired';
            clearAuthSession();
            redirectToLoginExpired(reason);
        };

        const handleStorageChange = (event) => {
            if (isDisposed) return;
            if (
                event.key === null ||
                event.key === AUTH_STORAGE_KEY ||
                event.key === AUTH_SESSION_META_KEY
            ) {
                const validity = checkAdminSessionValidity();
                if (!validity.valid) {
                    clearAuthSession();
                    redirectToLoginExpired('session_expired');
                }
            }
        };

        let channel = null;
        if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
            try {
                channel = new window.BroadcastChannel(AUTH_BROADCAST_CHANNEL);
                channel.onmessage = (event) => {
                    if (isDisposed) return;
                    const msg = event?.data;
                    if (msg?.type === 'ADMIN_SESSION_ENDED') {
                        clearAuthSession();
                        redirectToLoginExpired(msg.reason || 'session_expired');
                    }
                };
            } catch {
                channel = null;
            }
        }

        // Kiểm tra ngay khi khởi tạo Layout
        if (!verifyActiveSession()) {
            return () => {
                isDisposed = true;
                if (channel) {
                    try { channel.close(); } catch {}
                }
            };
        }

        VALID_ADMIN_ACTIVITY_EVENTS.forEach((evtName) => {
            window.addEventListener(evtName, handleValidUserActivity, { capture: true, passive: true });
        });
        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);
        window.addEventListener('zooguide:unauthorized', handleUnauthorizedEvent);
        window.addEventListener('storage', handleStorageChange);

        const intervalId = window.setInterval(verifyActiveSession, 1000);

        return () => {
            isDisposed = true;
            window.clearInterval(intervalId);
            VALID_ADMIN_ACTIVITY_EVENTS.forEach((evtName) => {
                window.removeEventListener(evtName, handleValidUserActivity, { capture: true });
            });
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
            window.removeEventListener('zooguide:unauthorized', handleUnauthorizedEvent);
            window.removeEventListener('storage', handleStorageChange);
            if (channel) {
                try { channel.close(); } catch {}
            }
        };
    }, [redirectToLoginExpired]);

    const handleLogout = async () => {
        try {
            await ZooApi.logout({ reason: 'manual_logout' });
        } finally {
            setCurrentUser(null);
            navigate('/admin/login', { replace: true });
        }
    };

    // Toggle handler
    const handleToggleSidebar = () => {
        if (window.innerWidth <= 1024) {
            setIsMobileMenuOpen(prev => !prev);
        } else {
            setIsDesktopSidebarOpen(prev => {
                const next = !prev;
                try {
                    localStorage.setItem('zooguide_admin_sidebar_desktop', String(next));
                } catch (e) {}
                return next;
            });
        }
    };

    const isSidebarOpen = isDesktopScreen ? isDesktopSidebarOpen : isMobileMenuOpen;

    const adminNavLinks = [
        { path: '/admin', label: 'Tổng Quan Vận Hành', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', exact: true },
        { path: '/admin/species', label: 'Quản Lý Loài (Species)', icon: 'M12 2a9 9 0 0 0-9 9c0 4.1 2.8 7.6 6.7 8.6L12 22l2.3-2.4C18.2 18.6 21 15.1 21 11a9 9 0 0 0-9-9z' },
        { path: '/admin/animals', label: 'Cá Thể Động Vật', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
        { path: '/admin/areas', label: 'Khu Vực & Chuồng Trại', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
        { path: '/admin/pois', label: 'Điểm Tham Quan (POI)', icon: 'M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z' },
        { path: '/admin/tickets', label: 'Quản Lý Vé', icon: 'M2 6h20v12H2zm4 6h.01M18 12h.01' },
        { path: '/admin/ticket-types', label: 'Bảng Giá & Loại Vé', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
        { path: '/admin/ticket-sessions', label: 'Phiên Khách Tham Quan', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
        { path: '/admin/narration', label: 'Thuyết Minh Động Vật', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' }
    ];

    // Compute current page title
    const activeRoute = adminNavLinks.find(link => 
        link.exact ? location.pathname === link.path : location.pathname.startsWith(link.path)
    );
    const pageTitle = activeRoute ? activeRoute.label : 'Quản Trị';

    return (
        <div className="admin-portal-wrapper">
            {/* Backdrop for Mobile Drawer */}
            {isMobileMenuOpen && (
                <div 
                    className="admin-sidebar-backdrop" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Admin Sidebar */}
            <aside 
                className={`admin-portal-sidebar ${!isDesktopSidebarOpen ? 'desktop-collapsed' : ''} ${isMobileMenuOpen ? 'open' : ''}`}
                aria-label="Thanh điều hướng quản trị"
            >
                <div className="admin-sidebar-header">
                    <div className="admin-sidebar-brand">
                        <div className="admin-sidebar-logo">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <div className="admin-sidebar-brand-text">
                            <h2>ZooGuide Admin</h2>
                            <span>Thảo Cầm Viên Sài Gòn</span>
                        </div>
                    </div>
                    {/* Mobile close button */}
                    <button
                        type="button"
                        className="admin-sidebar-close-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Đóng menu quản trị"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="admin-sidebar-nav">
                    {adminNavLinks.map(link => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={link.exact}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
                            title={link.label}
                        >
                            <span className="admin-sidebar-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={link.icon}></path>
                                </svg>
                            </span>
                            <span className="admin-nav-text">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Back to Visitor Portal Button & User Session */}
                <div className="admin-sidebar-footer">
                    {currentUser && (
                        <div className="admin-sidebar-user-info">
                            <div className="admin-user-avatar">
                                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="admin-user-meta">
                                <span className="admin-user-name">{currentUser.fullName || currentUser.username}</span>
                                <span className="admin-user-role-badge">{currentUser.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
                            </div>
                        </div>
                    )}
                    <Link
                        to="/"
                        className="admin-sidebar-visitor-link"
                        title="Về Trang Khách Tham Quan"
                    >
                        <span className="admin-sidebar-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </span>
                        <span className="admin-nav-text">Về Website Khách</span>
                    </Link>
                    <button
                        type="button"
                        className="admin-sidebar-logout-btn"
                        onClick={handleLogout}
                        title="Đăng xuất"
                    >
                        <span className="admin-sidebar-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </span>
                        <span className="admin-nav-text">Đăng Xuất</span>
                    </button>
                </div>
            </aside>

            {/* Admin Content Area */}
            <div className="admin-content-area">
                {/* Admin Top Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <button
                            type="button"
                            className={`admin-menu-toggle ${isSidebarOpen ? 'active' : 'collapsed'}`}
                            onClick={handleToggleSidebar}
                            aria-label={isSidebarOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
                            aria-expanded={isSidebarOpen}
                            title={isSidebarOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <nav className="admin-breadcrumb" aria-label="Breadcrumb">
                            <span className="admin-breadcrumb-root">Phân hệ quản trị</span>
                            <span className="admin-breadcrumb-sep" aria-hidden="true">/</span>
                            <span className="admin-breadcrumb-current">{pageTitle}</span>
                        </nav>
                    </div>

                    
                </header>

                {/* Main Dynamic View */}
                <main className="admin-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
