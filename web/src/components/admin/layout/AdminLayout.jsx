import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
    const location = useLocation();

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

                {/* Back to Visitor Portal Button */}
                <div className="admin-sidebar-footer">
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

                    <div className="admin-header-right">
                        <div className="admin-online-indicator" title="Kết nối máy chủ ổn định">
                            <span className="admin-online-dot" />
                            <span>Hệ thống trực tuyến</span>
                        </div>
                        <Link to="/" className="admin-header-primary-btn">
                            Mở Trang Khách
                        </Link>
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
