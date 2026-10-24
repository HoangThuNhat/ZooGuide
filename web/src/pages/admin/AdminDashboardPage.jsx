import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { ZooApi, API_CONFIG } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { getOrCreateInstallationId } from '../../services/deviceTracker';

export default function AdminDashboardPage() {
    const { showToast } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isLiveSignalR, setIsLiveSignalR] = useState(false);

    const [stats, setStats] = useState({
        activeTicketBuyers: 0,
        activeDevices: 0,
        totalTicketBuyers: 0,
        totalTicketsSold: 0,
        activeBuyerConnections: 0,
        onlineUsers: 0,
        activeDevices5Min: 0,
        totalTrackedDevices: 0,
        activeSessions: 0,
        totalTickets: 0,
        activeTickets: 0,
        expiredTickets: 0,
        totalAnimals: 0,
        totalSpecies: 0,
        totalAreas: 0,
        totalEnclosures: 0,
        totalPois: 0,
        activePois: 0,
        verifiedPois: 0,
        unverifiedPois: 0,
        poisWithNarration: 0,
        poisMissingNarration: 0,
        poisMissingAudio: 0,
        totalNarrations: 0,
        totalAudios: 0,
        languageStats: [],
        recentHealthLogs: [],
        recentActivities: []
    });

    const [animalOptions, setAnimalOptions] = useState([]);

    // Time filter states (applies to tickets, sessions and activities)
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [appliedFilter, setAppliedFilter] = useState({
        period: 'all',
        fromDate: null,
        toDate: null,
        label: 'Toàn bộ thời gian'
    });

    // Veterinary form & section toggle
    const [showHealthForm, setShowHealthForm] = useState(false);
    const [healthStatusFilter, setHealthStatusFilter] = useState('all');
    const [healthForm, setHealthForm] = useState({
        animalCode: '',
        veterinarian: 'BS. Trần Minh Quân',
        healthStatus: 'Rất tốt',
        weightKg: '215.5',
        temperatureC: '38.2',
        notes: '',
        actionRequired: ''
    });

    const calculatePeriodRange = (period, startStr = '', endStr = '') => {
        const now = new Date();
        const startOfDay = (d) => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date.toISOString();
        };
        const endOfDay = (d) => {
            const date = new Date(d);
            date.setHours(23, 59, 59, 999);
            return date.toISOString();
        };

        if (period === 'today') {
            return {
                fromDate: startOfDay(now),
                toDate: endOfDay(now),
                label: 'Hôm nay',
                rangeDesc: now.toLocaleDateString('vi-VN')
            };
        } else if (period === 'last7days') {
            const past7 = new Date(now);
            past7.setDate(past7.getDate() - 6);
            return {
                fromDate: startOfDay(past7),
                toDate: endOfDay(now),
                label: '7 ngày gần nhất',
                rangeDesc: `${past7.toLocaleDateString('vi-VN')} - ${now.toLocaleDateString('vi-VN')}`
            };
        } else if (period === 'last30days') {
            const past30 = new Date(now);
            past30.setDate(past30.getDate() - 29);
            return {
                fromDate: startOfDay(past30),
                toDate: endOfDay(now),
                label: '30 ngày gần nhất',
                rangeDesc: `${past30.toLocaleDateString('vi-VN')} - ${now.toLocaleDateString('vi-VN')}`
            };
        } else if (period === 'thisMonth') {
            const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                fromDate: startOfDay(startMonth),
                toDate: endOfDay(endMonth),
                label: 'Tháng này',
                rangeDesc: `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`
            };
        } else if (period === 'custom') {
            if (!startStr && !endStr) {
                return { fromDate: null, toDate: null, label: 'Tùy chỉnh khoảng ngày', rangeDesc: 'Chưa chọn khoảng ngày' };
            }
            return {
                fromDate: startStr ? startOfDay(new Date(startStr)) : null,
                toDate: endStr ? endOfDay(new Date(endStr)) : null,
                label: 'Tùy chỉnh khoảng ngày',
                rangeDesc: `${startStr ? new Date(startStr).toLocaleDateString('vi-VN') : '...'} - ${endStr ? new Date(endStr).toLocaleDateString('vi-VN') : '...'}`
            };
        }

        return {
            fromDate: null,
            toDate: null,
            label: 'Toàn bộ thời gian',
            rangeDesc: 'Tất cả dữ liệu ghi nhận'
        };
    };

    const loadDashboardData = async (filterObj = appliedFilter) => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const apiFilter = {};
            if (filterObj.fromDate) apiFilter.fromDate = filterObj.fromDate;
            if (filterObj.toDate) apiFilter.toDate = filterObj.toDate;

            const [statsRes, animalsRes] = await Promise.all([
                ZooApi.getDashboardStats(apiFilter),
                ZooApi.getAnimals()
            ]);

            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data);
            } else {
                setLoadError(statsRes.error || 'Không thể đồng bộ số liệu từ máy chủ.');
            }

            if (animalsRes.success && animalsRes.data && animalsRes.data.length > 0) {
                setAnimalOptions(animalsRes.data);
                setHealthForm(prev => ({
                    ...prev,
                    animalCode: prev.animalCode || animalsRes.data[0].code || `ANI-${animalsRes.data[0].id}`
                }));
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu dashboard:', err);
            setLoadError('Không thể kết nối đến máy chủ API.');
            showToast('Không thể tải toàn bộ số liệu thống kê máy chủ', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData(appliedFilter);
    }, []);

    // Kết nối SignalR Hub theo dõi người dùng Online thời gian thực
    useEffect(() => {
        let isMounted = true;
        let hubConn = null;

        const connectSignalR = async () => {
            try {
                const instId = getOrCreateInstallationId();
                const hubUrl = `${API_CONFIG.BASE_URL}/hubs/online?visitorId=${encodeURIComponent(instId)}&role=Admin`;

                hubConn = new signalR.HubConnectionBuilder()
                    .withUrl(hubUrl, {
                        skipNegotiation: false,
                        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
                    })
                    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
                    .configureLogging(signalR.LogLevel.None)
                    .build();

                hubConn.on('ActiveBuyersUpdated', (data) => {
                    if (isMounted && data) {
                        setStats(prev => ({
                            ...prev,
                            activeTicketBuyers: Number(data.activeTicketBuyers ?? 0),
                            activeDevices: Number(data.activeDevices ?? prev.activeDevices ?? 0),
                            activeBuyerConnections: Number(data.activeBuyerConnections ?? 0),
                            onlineUsers: Number(data.activeTicketBuyers ?? 0)
                        }));
                        setIsLiveSignalR(true);
                    }
                });

                hubConn.on('ActiveDevicesUpdated', (data) => {
                    if (isMounted && data) {
                        setStats(prev => ({
                            ...prev,
                            activeDevices: Number(data.activeDevices ?? 0)
                        }));
                        setIsLiveSignalR(true);
                    }
                });

                hubConn.on('OnlineUsersUpdated', (count) => {
                    if (isMounted) {
                        setStats(prev => ({
                            ...prev,
                            activeTicketBuyers: Number(count),
                            onlineUsers: Number(count)
                        }));
                        setIsLiveSignalR(true);
                    }
                });

                hubConn.onreconnected(() => {
                    if (isMounted) setIsLiveSignalR(true);
                });

                hubConn.onclose(() => {
                    if (isMounted) setIsLiveSignalR(false);
                });

                await hubConn.start();
                if (isMounted) setIsLiveSignalR(true);
            } catch (err) {
                console.warn('Admin SignalR connection error, falling back to polling:', err);
                if (isMounted) setIsLiveSignalR(false);
            }
        };

        connectSignalR();

        // Polling dự phòng mỗi 8 giây đảm bảo số liệu luôn chính xác
        const pollInterval = setInterval(async () => {
            if (!isMounted) return;
            try {
                const res = await ZooApi.getOnlineUsers();
                if (res.success && res.data) {
                    setStats(prev => ({
                        ...prev,
                        activeTicketBuyers: typeof res.data.activeTicketBuyers === 'number' ? res.data.activeTicketBuyers : prev.activeTicketBuyers,
                        activeDevices: typeof res.data.activeDevices === 'number' ? res.data.activeDevices : prev.activeDevices,
                        activeBuyerConnections: typeof res.data.activeBuyerConnections === 'number' ? res.data.activeBuyerConnections : prev.activeBuyerConnections,
                        totalTicketBuyers: typeof res.data.totalTicketBuyers === 'number' ? res.data.totalTicketBuyers : prev.totalTicketBuyers,
                        totalTicketsSold: typeof res.data.totalTicketsSold === 'number' ? res.data.totalTicketsSold : prev.totalTicketsSold,
                        onlineUsers: typeof res.data.activeTicketBuyers === 'number' ? res.data.activeTicketBuyers : (res.data.onlineUsers ?? prev.onlineUsers)
                    }));
                }
            } catch (e) {}
        }, 8000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            if (hubConn) {
                hubConn.stop().catch(() => {});
            }
        };
    }, []);

    const handleApplyFilter = (period = selectedPeriod) => {
        if (period === 'custom') {
            if (!customStartDate && !customEndDate) {
                showToast('Vui lòng chọn ngày bắt đầu hoặc ngày kết thúc.', 'error');
                return;
            }
            if (customStartDate && customEndDate && customStartDate > customEndDate) {
                showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc.', 'error');
                return;
            }
        }

        const range = calculatePeriodRange(period, customStartDate, customEndDate);
        const newApplied = { period, ...range };
        setAppliedFilter(newApplied);
        loadDashboardData(newApplied);
    };

    const handleResetFilter = () => {
        setSelectedPeriod('all');
        setCustomStartDate('');
        setCustomEndDate('');
        setHealthStatusFilter('all');
        const defaultFilter = {
            period: 'all',
            fromDate: null,
            toDate: null,
            label: 'Toàn bộ thời gian',
            rangeDesc: 'Tất cả dữ liệu ghi nhận'
        };
        setAppliedFilter(defaultFilter);
        loadDashboardData(defaultFilter);
    };

    const handleHealthSubmit = async (e) => {
        e.preventDefault();
        const selectedAnimal = animalOptions.find(a => a.code === healthForm.animalCode || a.id === Number(healthForm.animalCode));
        const newRecord = {
            animalId: selectedAnimal ? (selectedAnimal.id || selectedAnimal.animalId) : null,
            animalCode: healthForm.animalCode,
            animalName: selectedAnimal ? (selectedAnimal.nameVi || selectedAnimal.name) : healthForm.animalCode,
            date: new Date().toISOString().slice(0, 10),
            veterinarian: healthForm.veterinarian,
            weightKg: parseFloat(healthForm.weightKg) || 0,
            temperatureC: parseFloat(healthForm.temperatureC) || 38.0,
            healthStatus: healthForm.healthStatus,
            notes: healthForm.notes || 'Kiểm tra định kỳ bình thường',
            actionRequired: healthForm.actionRequired
        };

        try {
            const res = await ZooApi.addHealthRecord(newRecord);
            if (!res.success) {
                showToast(res.error || 'Không thể lưu nhật ký khám sức khỏe', 'error');
                return;
            }
            showToast('Đã lưu hồ sơ khám sức khỏe thú y vào cơ sở dữ liệu Supabase!', 'success');
            setHealthForm(prev => ({
                ...prev,
                weightKg: '',
                temperatureC: '38.0',
                notes: '',
                actionRequired: ''
            }));
            await loadDashboardData(appliedFilter);
            setShowHealthForm(false);
        } catch (err) {
            showToast(err.message || 'Lỗi kết nối khi lưu nhật ký sức khỏe', 'error');
        }
    };

    const filteredHealthLogs = useMemo(() => {
        if (!stats.recentHealthLogs) return [];
        return stats.recentHealthLogs.filter(log => {
            if (healthStatusFilter !== 'all' && log.healthStatus !== healthStatusFilter) {
                return false;
            }
            return true;
        });
    }, [stats.recentHealthLogs, healthStatusFilter]);

    return (
        <div className="admin-page-container">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 4px 0', color: '#0F172A' }}>
                        Tổng Quan Vận Hành
                    </h2>
                    <p className="admin-page-desc" style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                        Số liệu vận hành thời gian thực từ cơ sở dữ liệu Supabase: Thiết bị hoạt động, phiên tham quan, sức khỏe POI và quản lý thuyết minh.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => loadDashboardData(appliedFilter)}
                        disabled={isLoading}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M23 4v6h-6"></path>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        {isLoading ? 'Đang đồng bộ...' : 'Làm mới'}
                    </button>
                    <Link to="/admin/pois" className="btn btn-sm btn-primary" style={{ fontSize: '0.8125rem' }}>
                        + Quản Lý POI
                    </Link>
                </div>
            </div>

            {/* Error Banner if API fails */}
            {loadError && (
                <div className="admin-card" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', marginBottom: '20px', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#991B1B', fontSize: '0.88rem', fontWeight: 600 }}>
                            ⚠ Lỗi đồng bộ: {loadError}
                        </div>
                        <button className="btn btn-sm btn-outline" onClick={() => loadDashboardData(appliedFilter)}>
                            Thử lại
                        </button>
                    </div>
                </div>
            )}

            {/* Operational Time Filter */}
            <div className="admin-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                            Bộ lọc giao dịch & phiên tham quan
                        </span>
                        <span className="badge badge-info text-xs">
                            Kỳ báo cáo: {appliedFilter.label} {appliedFilter.rangeDesc ? `(${appliedFilter.rangeDesc})` : ''}
                        </span>
                    </div>

                    {appliedFilter.period !== 'all' && (
                        <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={handleResetFilter}
                            style={{ fontSize: '0.78rem' }}
                        >
                            Xem toàn bộ thời gian
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                        { key: 'all', label: 'Toàn bộ' },
                        { key: 'today', label: 'Hôm nay' },
                        { key: 'last7days', label: '7 ngày qua' },
                        { key: 'last30days', label: '30 ngày qua' },
                        { key: 'thisMonth', label: 'Tháng này' }
                    ].map(p => (
                        <button
                            key={p.key}
                            type="button"
                            className={`btn btn-sm ${selectedPeriod === p.key ? 'btn-primary' : 'btn-outline'}`}
                            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                            onClick={() => {
                                setSelectedPeriod(p.key);
                                handleApplyFilter(p.key);
                            }}
                        >
                            {p.label}
                        </button>
                    ))}

                    <button
                        type="button"
                        className={`btn btn-sm ${selectedPeriod === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                        onClick={() => setSelectedPeriod('custom')}
                    >
                        Tùy chỉnh ngày...
                    </button>

                    {selectedPeriod === 'custom' && (
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', marginLeft: '6px' }}>
                            <input 
                                type="date" 
                                className="form-input" 
                                style={{ padding: '4px 8px', fontSize: '0.8rem', width: '130px' }}
                                value={customStartDate} 
                                onChange={e => setCustomStartDate(e.target.value)} 
                            />
                            <span style={{ color: '#94A3B8' }}>→</span>
                            <input 
                                type="date" 
                                className="form-input" 
                                style={{ padding: '4px 8px', fontSize: '0.8rem', width: '130px' }}
                                value={customEndDate} 
                                onChange={e => setCustomEndDate(e.target.value)} 
                            />
                            <button 
                                type="button" 
                                className="btn btn-sm btn-primary"
                                style={{ fontSize: '0.78rem' }}
                                onClick={() => handleApplyFilter('custom')}
                            >
                                Áp dụng
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION A — OPERATIONAL SUMMARY */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                        Phần A — Tổng Quan Vận Hành Trực Tiếp
                    </h3>
                    <span className="text-xs text-muted">
                        Số liệu thời gian thực được tổng hợp từ máy chủ Supabase
                    </span>
                </div>

                <div className="admin-metrics-grid">
                    {/* 1. Người Mua Vé Đang Hoạt Động (Thời Gian Thực) */}
                    <div className="admin-metric-card" style={{ borderLeft: '3px solid #10B981' }}>
                        <div className="metric-header">
                            <span className="metric-label">Người Mua Vé Đang Hoạt Động</span>
                            <span className="badge badge-success text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                                {isLiveSignalR ? 'SignalR Trực Tiếp' : 'Thời gian thực'}
                            </span>
                        </div>
                        <div className="metric-value" style={{ color: loadError ? '#DC2626' : '#059669' }}>
                            {isLoading ? '...' : (loadError ? 'Lỗi' : (stats.activeTicketBuyers ?? 0))}
                        </div>
                        <div className="metric-footer">
                            <span>Khách mua vé thành công & phiên đang mở (timeout 45s)</span>
                        </div>
                    </div>

                    {/* 2. Tổng Vé Đã Bán */}
                    <div className="admin-metric-card" style={{ borderLeft: '3px solid #F59E0B' }}>
                        <div className="metric-header">
                            <span className="metric-label">Tổng Vé Đã Bán ({appliedFilter.label})</span>
                            <span className="badge badge-warning text-xs">
                                Đã thanh toán
                            </span>
                        </div>
                        <div className="metric-value" style={{ color: '#B45309' }}>
                            {isLoading ? '...' : (loadError ? 'Lỗi' : (stats.totalTicketsSold ?? 0))}
                        </div>
                        <div className="metric-footer">
                            <span>Tổng số vé từ các đơn thanh toán thành công</span>
                            <Link to="/admin/tickets">Quản lý vé →</Link>
                        </div>
                    </div>

                    {/* 3. Thiết Bị / Phiên Đang Hoạt Động */}
                    <div className="admin-metric-card" style={{ borderLeft: '3px solid #8B5CF6' }}>
                        <div className="metric-header">
                            <span className="metric-label">Thiết Bị / Phiên Hoạt Động</span>
                            <span className="badge badge-primary text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6', display: 'inline-block' }}></span>
                                {isLiveSignalR ? 'SignalR Trực Tiếp' : 'Thời gian thực'}
                            </span>
                        </div>
                        <div className="metric-value" style={{ color: '#6D28D9' }}>
                            {isLoading ? '...' : (loadError ? 'Lỗi' : (stats.activeDevices ?? stats.activeDevices5Min ?? 0))}
                        </div>
                        <div className="metric-footer">
                            <span>Phiên/thiết bị đang mở website (cả khách & người mua vé, timeout 45s)</span>
                        </div>
                    </div>

                    {/* 5. Phiên Tham Quan Mở Khóa */}
                    <div className="admin-metric-card" style={{ borderLeft: '3px solid #0284C7' }}>
                        <div className="metric-header">
                            <span className="metric-label">Phiên Tham Quan Mở Khóa</span>
                            <span className="badge badge-info text-xs">Thời gian thực</span>
                        </div>
                        <div className="metric-value" style={{ color: '#0369A1' }}>
                            {isLoading ? '...' : (stats.activeSessions ?? 0)}
                        </div>
                        <div className="metric-footer">
                            <Link to="/admin/ticket-sessions">
                                Danh sách phiên tham quan →
                            </Link>
                        </div>
                    </div>

                    {/* 6. Vé Phát Hành */}
                    <div className="admin-metric-card" style={{ borderLeft: '3px solid #EAB308' }}>
                        <div className="metric-header">
                            <span className="metric-label">Vé Phát Hành ({appliedFilter.label})</span>
                            <span className="badge badge-warning text-xs">
                                {stats.activeTickets || 0} còn hạn
                            </span>
                        </div>
                        <div className="metric-value">
                            {isLoading ? '...' : (stats.totalTickets ?? 0)}
                        </div>
                        <div className="metric-footer">
                            <span>Hết hạn: {stats.expiredTickets || 0}</span>
                            <Link to="/admin/tickets">Chi tiết vé →</Link>
                        </div>
                    </div>

                    {/* 7. Động Vật & Loài */}
                    <div className="admin-metric-card" style={{ borderLeft: '3px solid #EC4899' }}>
                        <div className="metric-header">
                            <span className="metric-label">Động Vật & Loài</span>
                            <span className="badge badge-primary text-xs">Hiện có</span>
                        </div>
                        <div className="metric-value">
                            {isLoading ? '...' : (stats.totalAnimals ?? 0)}
                        </div>
                        <div className="metric-footer">
                            <span>{stats.totalSpecies || 0} loài sinh thái</span>
                            <Link to="/admin/animals">Cá thể thú →</Link>
                        </div>
                    </div>

                    {/* 8. Total POIs */}
                    <div className="admin-metric-card" style={{ borderLeft: '3px solid #059669' }}>
                        <div className="metric-header">
                            <span className="metric-label">Điểm Tham Quan (POI)</span>
                            <span className="badge badge-success text-xs">
                                {stats.activePois || 0} đang mở
                            </span>
                        </div>
                        <div className="metric-value" style={{ color: '#064E3B' }}>
                            {isLoading ? '...' : (stats.totalPois ?? 0)}
                        </div>
                        <div className="metric-footer">
                            <span>{stats.verifiedPois || 0} tọa độ chuẩn</span>
                            <Link to="/admin/pois">Quản lý POIs →</Link>
                        </div>
                    </div>

                    {/* 9. Total Areas & Enclosures */}
                    <div className="admin-metric-card" style={{ borderLeft: '3px solid #64748B' }}>
                        <div className="metric-header">
                            <span className="metric-label">Phân Khu & Chuồng Trại</span>
                            <span className="badge badge-secondary text-xs">Cơ sở vật chất</span>
                        </div>
                        <div className="metric-value">
                            {isLoading ? '...' : (stats.totalAreas ?? 0)}
                        </div>
                        <div className="metric-footer">
                            <span>{stats.totalEnclosures || 0} chuồng thực tế</span>
                            <Link to="/admin/areas">Quản lý phân khu →</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION B — POI & NARRATION HEALTH */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                            Phần B — Tình Trạng Điểm Tham Quan (POI) & Sức Khỏe Thuyết Minh
                        </h3>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '0.8rem' }}>
                            Kiểm định tọa độ WGS84, độ bao phủ thuyết minh âm thanh đa ngôn ngữ cho du khách.
                        </p>
                    </div>
                    <Link to="/admin/pois" className="btn btn-sm btn-outline">
                        Xem chi tiết POIs
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {/* POI Verification Status */}
                    <div className="admin-card" style={{ padding: '18px 20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '14px', color: '#0F172A', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Kiểm Định Tọa Độ Địa Lý</span>
                            <span className="badge badge-info text-xs">{stats.totalPois || 0} tổng điểm</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                                    <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>Tọa độ đã kiểm định WGS84</span>
                                </div>
                                <strong style={{ color: '#166534', fontSize: '1rem' }}>{stats.verifiedPois || 0}</strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: stats.unverifiedPois > 0 ? '#FFFBEB' : '#F8FAFC', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#D97706', fontWeight: 700 }}>⚠</span>
                                    <span style={{ fontSize: '0.85rem', color: '#92400E', fontWeight: 600 }}>Tọa độ chưa xác thực</span>
                                </div>
                                <strong style={{ color: '#92400E', fontSize: '1rem' }}>{stats.unverifiedPois || 0}</strong>
                            </div>

                            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                                {stats.unverifiedPois > 0 ? (
                                    <Link to="/admin/pois" style={{ color: '#D97706', fontWeight: 600 }}>
                                        Cần kiểm định {stats.unverifiedPois} điểm tham quan trên thực địa →
                                    </Link>
                                ) : (
                                    <span style={{ color: '#16A34A' }}>100% điểm tham quan đã có tọa độ WGS84 chuẩn xác.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* POI Narration & Audio Coverage */}
                    <div className="admin-card" style={{ padding: '18px 20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '14px', color: '#0F172A', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Bao Phủ Thuyết Minh Điểm Tham Quan</span>
                            <span className="badge badge-success text-xs">{stats.poisWithNarration || 0} / {stats.totalPois || 0} có bài</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#334155' }}>Điểm đã có bài thuyết minh xuất bản</span>
                                <strong style={{ color: '#0F172A' }}>{stats.poisWithNarration || 0}</strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: stats.poisMissingNarration > 0 ? '#FFF7ED' : '#F8FAFC', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: stats.poisMissingNarration > 0 ? '#C2410C' : '#64748B' }}>
                                    Điểm chưa có bài thuyết minh
                                </span>
                                <strong style={{ color: stats.poisMissingNarration > 0 ? '#C2410C' : '#64748B' }}>
                                    {stats.poisMissingNarration || 0}
                                </strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: stats.poisMissingAudio > 0 ? '#FEF2F2' : '#F8FAFC', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: stats.poisMissingAudio > 0 ? '#DC2626' : '#64748B' }}>
                                    Điểm thiếu file âm thanh MP3
                                </span>
                                <strong style={{ color: stats.poisMissingAudio > 0 ? '#DC2626' : '#64748B' }}>
                                    {stats.poisMissingAudio || 0}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* Language Breakdown */}
                    <div className="admin-card" style={{ padding: '18px 20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '14px', color: '#0F172A', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Phân Bổ Ngôn Ngữ Thuyết Minh</span>
                            <span className="badge badge-info text-xs">{stats.totalNarrations || 0} bài động vật</span>
                        </div>

                        {stats.languageStats && stats.languageStats.length > 0 ? (
                            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {stats.languageStats.map(ls => (
                                    <div key={ls.languageCode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 6px', borderBottom: '1px solid #F1F5F9' }}>
                                        <span>
                                            <strong>{ls.languageName}</strong> ({ls.languageCode.toUpperCase()})
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span className="badge badge-primary text-xs" title="Thuyết minh loài động vật">
                                                {ls.animalNarrationsCount} loài
                                            </span>
                                            <span className="badge badge-success text-xs" title="Thuyết minh POI">
                                                {ls.poiNarrationsCount} POI
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-3 text-muted text-xs">
                                12 ngôn ngữ được kích hoạt trong cơ sở dữ liệu.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION C & SECTION D GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {/* SECTION C — RECENT OPERATIONAL ACTIVITIES */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                            Phần C — Hoạt Động Vận Hành Gần Nhất
                        </h3>
                        <span className="text-xs text-muted">
                            {stats.recentActivities?.length || 0} bản ghi thực tế
                        </span>
                    </div>

                    <div className="admin-card" style={{ padding: '4px 16px' }}>
                        {stats.recentActivities && stats.recentActivities.length > 0 ? (
                            stats.recentActivities.map((act, idx) => (
                                <div 
                                    key={idx}
                                    style={{
                                        padding: '12px 0',
                                        borderBottom: idx !== stats.recentActivities.length - 1 ? '1px solid #F1F5F9' : 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>
                                            {act.title}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                                            {act.description}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <span className={`badge ${act.type === 'Ticket' ? 'badge-success' : act.type === 'POI' ? 'badge-primary' : 'badge-info'} text-xs`}>
                                            {act.type}
                                        </span>
                                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '3px' }}>
                                            {new Date(act.timestamp).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-6 text-muted text-xs">
                                Chưa có hoạt động mới trong khoảng thời gian đã chọn.
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION D — VETERINARY HEALTH LOGS */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                                Phần D — Nhật Ký Thú Y & Sức Khỏe Động Vật
                            </h3>
                        </div>
                        <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => setShowHealthForm(!showHealthForm)}
                            style={{ fontSize: '0.8rem' }}
                        >
                            {showHealthForm ? 'Đóng biểu mẫu' : '+ Ghi nhận kiểm tra y tế'}
                        </button>
                    </div>

                    {/* Expandable Health Record Form */}
                    {showHealthForm && (
                        <div className="admin-card" style={{ marginBottom: '16px', background: '#F8FAFC' }}>
                            <h4 className="font-bold text-sm mb-3" style={{ color: '#0F172A' }}>
                                Bản Ghi Kiểm Tra Y Tế Mới
                            </h4>
                            <form onSubmit={handleHealthSubmit}>
                                <div className="form-group">
                                    <label className="form-label text-xs">Chọn cá thể động vật</label>
                                    <select 
                                        className="form-select"
                                        required
                                        value={healthForm.animalCode}
                                        onChange={e => setHealthForm({ ...healthForm, animalCode: e.target.value })}
                                    >
                                        {animalOptions.map(a => (
                                            <option key={a.code || a.id} value={a.code || a.id}>
                                                {a.nameVi || a.name} ({a.code || `ANI-${a.id}`})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label text-xs">Bác sĩ thú y</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            required
                                            value={healthForm.veterinarian}
                                            onChange={e => setHealthForm({ ...healthForm, veterinarian: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label text-xs">Tình trạng sức khỏe</label>
                                        <select 
                                            className="form-select"
                                            value={healthForm.healthStatus}
                                            onChange={e => setHealthForm({ ...healthForm, healthStatus: e.target.value })}
                                        >
                                            <option value="Rất tốt">Rất tốt</option>
                                            <option value="Khỏe mạnh">Khỏe mạnh</option>
                                            <option value="Theo dõi định kỳ">Theo dõi định kỳ</option>
                                            <option value="Cần cách ly chăm sóc">Cần cách ly chăm sóc</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label text-xs">Cân nặng (kg)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            className="form-input" 
                                            required
                                            value={healthForm.weightKg}
                                            onChange={e => setHealthForm({ ...healthForm, weightKg: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label text-xs">Thân nhiệt (°C)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            className="form-input" 
                                            required
                                            value={healthForm.temperatureC}
                                            onChange={e => setHealthForm({ ...healthForm, temperatureC: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label text-xs">Ghi chú lâm sàng & chế độ dinh dưỡng</label>
                                    <textarea 
                                        className="form-textarea" 
                                        rows="2" 
                                        value={healthForm.notes}
                                        onChange={e => setHealthForm({ ...healthForm, notes: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline" 
                                        onClick={() => setShowHealthForm(false)}
                                    >
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn btn-sm btn-primary">
                                        Lưu Vào Cơ Sở Dữ Liệu
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Recent Health Logs List */}
                    <div className="admin-card" style={{ padding: '8px 16px', maxHeight: '420px', overflowY: 'auto' }}>
                        {filteredHealthLogs.length > 0 ? (
                            filteredHealthLogs.map(log => (
                                <div 
                                    key={log.id} 
                                    style={{
                                        padding: '10px 0',
                                        borderBottom: '1px solid #F1F5F9'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>
                                            {log.animalName} <span className="font-mono text-xs text-muted">({log.animalCode})</span>
                                        </div>
                                        <span className="badge badge-info text-xs">{log.healthStatus}</span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                        Ngày khám: {log.date} • Bác sĩ: {log.veterinarian} • {log.weightKg} kg • {log.temperatureC}°C
                                    </div>
                                    {log.notes && (
                                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px' }}>
                                            Ghi chú: {log.notes}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-6 text-muted text-xs">
                                Chưa có hồ sơ y tế nào.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
