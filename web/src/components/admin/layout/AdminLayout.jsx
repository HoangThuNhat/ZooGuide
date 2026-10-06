import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';

export default function AdminLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="admin-portal-wrapper" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
            {/* Admin Sidebar */}
            <aside 
                className={`admin-portal-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
                style={{
                    width: '260px',
                    background: '#0F172A',
                    color: '#F8FAFC',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    zIndex: 100,
                    transition: 'all 200ms ease'
                }}
            >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2">
                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFF' }}>ZooAdmin</h2>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Bảng Quản Trị Hệ Thống</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {adminNavLinks.map(link => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={link.exact}
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: isActive ? 600 : 500,
                                textDecoration: 'none',
                                color: isActive ? '#FFFFFF' : '#94A3B8',
                                background: isActive ? '#15803D' : 'transparent',
                                transition: 'all 150ms ease'
                            })}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d={link.icon}></path>
                            </svg>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Back to Visitor Portal Button */}
                <div style={{ padding: '16px 14px', borderTop: '1px solid #1E293B' }}>
                    <Link
                        to="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px',
                            borderRadius: '8px',
                            background: '#334155',
                            color: '#F8FAFC',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span>Về Trang Khách Tham Quan</span>
                    </Link>
                </div>
            </aside>

            {/* Admin Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Admin Top Header */}
                <header style={{
                    height: '64px',
                    background: '#FFFFFF',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            className="btn btn-icon btn-sm"
                            style={{ display: 'none' }}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            ☰
                        </button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                            ZooGuide Management Portal • Cán bộ phụ trách: <strong>Quản Trị Viên</strong>
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="badge badge-success">Máy Chủ Trực Tuyến</span>
                        <Link to="/" className="btn btn-sm btn-outline">
                            Xem Website Khách
                        </Link>
                    </div>
                </header>

                {/* Main Dynamic View */}
                <main style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
