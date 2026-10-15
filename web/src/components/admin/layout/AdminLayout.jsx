import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';

export default function AdminLayout() {
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
                // When resizing to desktop, close mobile drawer overlay to avoid residual backdrops
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Toggle handler for both desktop and mobile/tablet
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

    // Current effective sidebar visibility state
    const isSidebarOpen = isDesktopScreen ? isDesktopSidebarOpen : isMobileMenuOpen;

    const adminNavLinks = [
        { path: '/admin', label: 'Tổng Quan', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', exact: true },
        { path: '/admin/species', label: 'Quản Lý Loài (Species)', icon: 'M12 2a9 9 0 0 0-9 9c0 4.1 2.8 7.6 6.7 8.6L12 22l2.3-2.4C18.2 18.6 21 15.1 21 11a9 9 0 0 0-9-9z' },
        { path: '/admin/animals', label: 'Quản Lý Động Vật', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
        { path: '/admin/areas', label: 'Khu Vực & Chuồng Trại', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
        { path: '/admin/tickets', label: 'Quản Lý Vé', icon: 'M2 6h20v12H2zm4 6h.01M18 12h.01' },
        { path: '/admin/ticket-types', label: 'Loại Vé (Ticket Types)', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
        { path: '/admin/ticket-sessions', label: 'Phiên Khách Tham Quan', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
        { path: '/admin/narration', label: 'Nội Dung Thuyết Minh', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' }
    ];

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2">
                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFF', whiteSpace: 'nowrap' }}>ZooAdmin</h2>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>Bảng Quản Trị Hệ Thống</span>
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
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                <path d={link.icon}></path>
                            </svg>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Back to Visitor Portal Button */}
                <div className="admin-sidebar-footer">
                    <Link
                        to="/"
                        className="admin-sidebar-visitor-link"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span>Về Trang Khách Tham Quan</span>
                    </Link>
                </div>
            </aside>

            {/* Admin Content Area */}
            <div className="admin-content-area">
                {/* Admin Top Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        {/* Hamburger Button: Always visible on desktop, tablet, and mobile */}
                        <button
                            type="button"
                            className={`admin-menu-toggle ${isSidebarOpen ? 'active' : 'collapsed'}`}
                            onClick={handleToggleSidebar}
                            aria-label={isSidebarOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
                            aria-expanded={isSidebarOpen}
                            title={isSidebarOpen ? "Thu gọn thanh điều hướng (Sidebar)" : "Mở rộng thanh điều hướng (Sidebar)"}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <div className="admin-header-title">
                            <strong className="admin-brand-highlight">ZooGuide</strong>
                            <span className="admin-portal-badge-text"> Management Portal</span>
                            <span className="admin-header-subtitle"> • Cán bộ: <strong>Quản Trị Viên</strong></span>
                        </div>
                    </div>

                    <div className="admin-header-right">
                        <span className="badge badge-success admin-status-badge">Máy Chủ Trực Tuyến</span>
                        <Link to="/" className="btn btn-sm btn-outline admin-header-guest-btn">
                            Xem Website Khách
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
