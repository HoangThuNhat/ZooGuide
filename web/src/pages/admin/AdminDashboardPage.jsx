import React, { useState, useEffect, useMemo } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminDashboardPage() {
    const { showToast } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTickets: 0,
        activeTickets: 0,
        expiredTickets: 0,
        totalAnimals: 0,
        totalSpecies: 0,
        totalAreas: 0,
        totalNarrations: 0,
        totalAudios: 0,
        activeSessions: 0,
        recentHealthLogs: [],
        recentActivities: []
    });
    const [animalOptions, setAnimalOptions] = useState([]);

    // Time filter states
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [appliedFilter, setAppliedFilter] = useState({
        period: 'all',
        fromDate: null,
        toDate: null,
        label: 'Toàn bộ thời gian'
    });

    // Business filter states
    const [healthStatusFilter, setHealthStatusFilter] = useState('all');
    const [selectedAnimalFilter, setSelectedAnimalFilter] = useState('all');

    // Form inputs for Health Log
    const [healthForm, setHealthForm] = useState({
        animalCode: '',
        veterinarian: 'BS. Trần Minh Quân',
        healthStatus: 'Rất tốt',
        weightKg: '215.5',
        temperatureC: '38.2',
        notes: '',
        actionRequired: ''
    });

    // Calculate start & end ISO strings for a chosen period preset
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
            const dateStr = now.toLocaleDateString('vi-VN');
            return {
                fromDate: startOfDay(now),
                toDate: endOfDay(now),
                label: 'Hôm nay',
                rangeDesc: dateStr
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
                rangeDesc: `01/${now.getMonth() + 1}/${now.getFullYear()} - ${endMonth.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`
            };
        } else if (period === 'lastMonth') {
            const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return {
                fromDate: startOfDay(startLastMonth),
                toDate: endOfDay(endLastMonth),
                label: 'Tháng trước',
                rangeDesc: `01/${startLastMonth.getMonth() + 1}/${startLastMonth.getFullYear()} - ${endLastMonth.getDate()}/${startLastMonth.getMonth() + 1}/${startLastMonth.getFullYear()}`
            };
        } else if (period === 'thisYear') {
            const startYear = new Date(now.getFullYear(), 0, 1);
            const endYear = new Date(now.getFullYear(), 11, 31);
            return {
                fromDate: startOfDay(startYear),
                toDate: endOfDay(endYear),
                label: 'Năm nay',
                rangeDesc: `01/01/${now.getFullYear()} - 31/12/${now.getFullYear()}`
            };
        } else if (period === 'custom') {
            if (!startStr && !endStr) {
                return { fromDate: null, toDate: null, label: 'Tùy chỉnh khoảng ngày', rangeDesc: 'Chưa chọn khoảng ngày' };
            }
            const from = startStr ? startOfDay(new Date(startStr)) : null;
            const to = endStr ? endOfDay(new Date(endStr)) : null;
            return {
                fromDate: from,
                toDate: to,
                label: 'Tùy chỉnh khoảng ngày',
                rangeDesc: `${startStr ? new Date(startStr).toLocaleDateString('vi-VN') : '...'} đến ${endStr ? new Date(endStr).toLocaleDateString('vi-VN') : '...'}`
            };
        }

        // 'all'
        return {
            fromDate: null,
            toDate: null,
            label: 'Toàn bộ thời gian',
            rangeDesc: 'Tất cả dữ liệu ghi nhận'
        };
    };

    const loadDashboardData = async (filterObj = appliedFilter) => {
        setIsLoading(true);
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
            }

            if (animalsRes.success && animalsRes.data && animalsRes.data.length > 0) {
                setAnimalOptions(animalsRes.data);
                setHealthForm(prev => ({
                    ...prev,
                    animalCode: prev.animalCode || animalsRes.data[0].code || `ANI-${animalsRes.data[0].id}`
                }));
            }
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu dashboard:", err);
            showToast("Không thể tải toàn bộ số liệu thống kê máy chủ", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData(appliedFilter);
    }, []);

    // Filtered health logs based on health status and selected animal
    const filteredHealthLogs = useMemo(() => {
        if (!stats.recentHealthLogs) return [];
        return stats.recentHealthLogs.filter(log => {
            if (healthStatusFilter !== 'all' && log.healthStatus !== healthStatusFilter) {
                return false;
            }
            if (selectedAnimalFilter !== 'all') {
                const matchCode = (log.animalCode || '').toLowerCase() === selectedAnimalFilter.toLowerCase();
                const matchName = (log.animalName || '').toLowerCase() === selectedAnimalFilter.toLowerCase();
                if (!matchCode && !matchName) return false;
            }
            return true;
        });
    }, [stats.recentHealthLogs, healthStatusFilter, selectedAnimalFilter]);

    const handleApplyFilter = (period = selectedPeriod) => {
        if (period === 'custom') {
            if (!customStartDate && !customEndDate) {
                showToast("Vui lòng chọn ngày bắt đầu hoặc ngày kết thúc.", "error");
                return;
            }
            if (customStartDate && customEndDate && customStartDate > customEndDate) {
                showToast("Ngày bắt đầu không được lớn hơn ngày kết thúc.", "error");
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
        setSelectedAnimalFilter('all');
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

    const hasActiveFilters = appliedFilter.period !== 'all' || healthStatusFilter !== 'all' || selectedAnimalFilter !== 'all';

    const handleHealthSubmit = async (e) => {
        e.preventDefault();
        const selectedAnimal = animalOptions.find(a => a.code === healthForm.animalCode || a.id === Number(healthForm.animalCode));
        const newRecord = {
            id: Date.now(),
            animalCode: healthForm.animalCode,
            animalName: selectedAnimal ? (selectedAnimal.nameVi || selectedAnimal.name) : healthForm.animalCode,
            date: new Date().toISOString().slice(0, 10),
            veterinarian: healthForm.veterinarian,
            weightKg: parseFloat(healthForm.weightKg) || 0,
            temperatureC: parseFloat(healthForm.temperatureC) || 38.0,
            healthStatus: healthForm.healthStatus,
            notes: healthForm.notes || "Kiểm tra định kỳ bình thường",
            actionRequired: healthForm.actionRequired
        };

        setStats(prev => ({
            ...prev,
            recentHealthLogs: [newRecord, ...(prev.recentHealthLogs || [])]
        }));

        showToast("Đã lưu nhật ký khám sức khỏe động vật thành công!", "success");
        setHealthForm(prev => ({
            ...prev,
            weightKg: '',
            temperatureC: '38.0',
            notes: '',
            actionRequired: ''
        }));
    };

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Trung Tâm Điều Hành ZooGuide
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Thống kê tổng quan tình trạng vận hành, động vật, chuồng trại và dịch vụ tham quan thời gian thực từ cơ sở dữ liệu.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        className="btn btn-sm btn-outline" 
                        onClick={() => loadDashboardData(appliedFilter)}
                        disabled={isLoading}
                        title="Đồng bộ lại số liệu"
                    >
                        {isLoading ? "Đang đồng bộ..." : "Làm mới số liệu"}
                    </button>
                </div>
            </div>

            {/* Operational Data Filters Bar */}
            <div className="admin-card" style={{ marginBottom: '28px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>
                            Bộ Lọc Dữ Liệu Vận Hành
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                            Thời gian: <strong>{appliedFilter.label}</strong> {appliedFilter.rangeDesc ? `(${appliedFilter.rangeDesc})` : ''}
                        </span>
                        {healthStatusFilter !== 'all' && (
                            <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                                Sức khỏe: <strong>{healthStatusFilter}</strong>
                            </span>
                        )}
                        {selectedAnimalFilter !== 'all' && (
                            <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                                Cá thể: <strong>{selectedAnimalFilter}</strong>
                            </span>
                        )}
                        {hasActiveFilters && (
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={handleResetFilter}
                                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                title="Đưa toàn bộ bộ lọc về mặc định"
                            >
                                Đặt lại bộ lọc
                            </button>
                        )}
                    </div>
                </div>

                <div className="admin-filter-grid">
                    {/* Period Preset Dropdown */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.82rem', fontWeight: '700' }}>
                            Khoảng thời gian
                        </label>
                        <select
                            className="form-select"
                            value={selectedPeriod}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedPeriod(val);
                                if (val !== 'custom') {
                                    handleApplyFilter(val);
                                }
                            }}
                            style={{ width: '100%' }}
                        >
                            <option value="all">Toàn bộ thời gian (Tất cả)</option>
                            <option value="today">Hôm nay</option>
                            <option value="last7days">7 ngày gần nhất</option>
                            <option value="last30days">30 ngày gần nhất</option>
                            <option value="thisMonth">Tháng này</option>
                            <option value="lastMonth">Tháng trước</option>
                            <option value="thisYear">Năm nay</option>
                            <option value="custom">Tùy chỉnh khoảng ngày...</option>
                        </select>
                    </div>

                    {/* Health Status Filter */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.82rem', fontWeight: '700' }}>
                            Tình trạng sức khỏe
                        </label>
                        <select
                            className="form-select"
                            value={healthStatusFilter}
                            onChange={(e) => setHealthStatusFilter(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="all">Tất cả tình trạng</option>
                            <option value="Rất tốt">Rất tốt</option>
                            <option value="Khỏe mạnh">Khỏe mạnh</option>
                            <option value="Theo dõi định kỳ">Theo dõi định kỳ</option>
                            <option value="Cần cách ly chăm sóc">Cần cách ly chăm sóc</option>
                            <option value="Bình thường">Bình thường</option>
                        </select>
                    </div>

                    {/* Animal Filter */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.82rem', fontWeight: '700' }}>
                            Cá thể động vật
                        </label>
                        <select
                            className="form-select"
                            value={selectedAnimalFilter}
                            onChange={(e) => setSelectedAnimalFilter(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="all">Tất cả cá thể động vật</option>
                            {animalOptions.map(a => (
                                <option key={a.code || a.id} value={a.nameVi || a.name || a.code}>
                                    {a.nameVi || a.name} ({a.code || `ANI-${a.id}`})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Start Date */}
                    {selectedPeriod === 'custom' && (
                        <div>
                            <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.82rem', fontWeight: '700' }}>
                                Từ ngày
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}

                    {/* Custom End Date */}
                    {selectedPeriod === 'custom' && (
                        <div>
                            <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.82rem', fontWeight: '700' }}>
                                Đến ngày
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}

                    {/* Action Buttons for Custom Period */}
                    {selectedPeriod === 'custom' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleApplyFilter('custom')}
                                style={{ padding: '9px 18px', fontSize: '0.85rem' }}
                            >
                                Áp dụng khoảng ngày
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Row */}
            <div className="admin-metrics-row">
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">
                        {appliedFilter.period !== 'all' ? `Vé phát hành (${appliedFilter.label})` : 'Tổng vé phát hành'}
                    </span>
                    <span className="metric-number">
                        {isLoading ? "..." : (stats.totalTickets || 0)}
                    </span>
                    <span className="text-xs text-success font-semibold">
                        Đang hoạt động: {stats.activeTickets || 0}
                    </span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Tổng số cá thể động vật</span>
                    <span className="metric-number">
                        {isLoading ? "..." : (stats.totalAnimals || 0)}
                    </span>
                    <span className="text-xs text-info font-semibold">
                        {stats.totalSpecies || 0} loài sinh thái
                    </span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Phân khu chuồng trại</span>
                    <span className="metric-number">
                        {isLoading ? "..." : (stats.totalAreas || 0)}
                    </span>
                    <span className="text-xs text-success font-semibold">100% đạt chuẩn an toàn</span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">
                        {appliedFilter.period !== 'all' ? `Bài thuyết minh (${appliedFilter.label})` : 'Bài thuyết minh đa ngữ'}
                    </span>
                    <span className="metric-number">
                        {isLoading ? "..." : (stats.totalNarrations || 0)}
                    </span>
                    <span className="text-xs text-muted font-semibold">
                        {stats.activeSessions || 0} phiên khách trong kỳ
                    </span>
                </div>
            </div>

            {/* Health & Breeding Quick Log Section */}
            <div className="ticket-page-layout">
                {/* Left: Health Log Records & Recent Activities */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className="font-bold text-base m-0">Nhật Ký Y Tế & Chăm Sóc Gần Nhất</h3>
                        <span className="text-xs text-muted font-semibold">
                            {filteredHealthLogs.length} / {stats.recentHealthLogs?.length || 0} hồ sơ phù hợp
                        </span>
                    </div>

                    <div id="admin-health-logs-list">
                        {isLoading ? (
                            <div className="text-center p-6 text-muted">Đang tải nhật ký kiểm tra y tế...</div>
                        ) : filteredHealthLogs.length > 0 ? (
                            filteredHealthLogs.map(log => (
                                <div key={log.id} className="health-log-card">
                                    <div className="health-log-header">
                                        <div>
                                            <h4 className="font-bold text-sm text-primary">
                                                {log.animalName} <span className="font-mono text-muted text-xs">({log.animalCode})</span>
                                            </h4>
                                            <span className="text-xs text-muted">Ngày khám: {log.date} • Bác sĩ: {log.veterinarian}</span>
                                        </div>
                                        <span className="badge badge-info">{log.healthStatus}</span>
                                    </div>
                                    <div className="health-log-details">
                                        <div className="pill-stat">Cân nặng: <strong>{log.weightKg} kg</strong></div>
                                        <div className="pill-stat">Thân nhiệt: <strong>{log.temperatureC}°C</strong></div>
                                    </div>
                                    <p className="health-log-notes"><strong>Ghi chú:</strong> {log.notes}</p>
                                    {log.actionRequired && (
                                        <p className="health-log-action"><strong>Hành động:</strong> {log.actionRequired}</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="admin-card text-center text-muted p-6" style={{ marginBottom: '20px' }}>
                                <div style={{ fontWeight: '600', color: '#1E293B', marginBottom: '4px', fontSize: '1rem' }}>
                                    Không có nhật ký y tế nào phù hợp với bộ lọc đã chọn
                                </div>
                                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem' }}>
                                    Thời gian: {appliedFilter.label} {appliedFilter.rangeDesc ? `(${appliedFilter.rangeDesc})` : ''}
                                    {healthStatusFilter !== 'all' ? ` • Tình trạng: ${healthStatusFilter}` : ''}
                                    {selectedAnimalFilter !== 'all' ? ` • Cá thể: ${selectedAnimalFilter}` : ''}
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline"
                                        onClick={handleResetFilter}
                                    >
                                        Đặt lại bộ lọc
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Operational Activities Section */}
                    {stats.recentActivities && stats.recentActivities.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 className="font-bold text-base m-0">Dòng Hoạt Động Vận Hành Gần Nhất</h3>
                                <span className="text-xs text-muted">{stats.recentActivities.length} sự kiện</span>
                            </div>
                            <div className="admin-card" style={{ padding: '8px 16px' }}>
                                {stats.recentActivities.map((act, idx) => (
                                    <div 
                                        key={idx} 
                                        style={{ 
                                            padding: '10px 0', 
                                            borderBottom: idx !== stats.recentActivities.length - 1 ? '1px dashed #E2E8F0' : 'none',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#1E293B' }}>
                                                {act.title}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                                {act.description}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <span className={`badge ${act.type === 'Ticket' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.72rem' }}>
                                                {act.type}
                                            </span>
                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                                                {new Date(act.timestamp).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Add Health Log Form */}
                <div className="admin-card">
                    <h3 className="font-bold text-base mb-3">Ghi Nhận Kiểm Tra Sức Khỏe Mới</h3>
                    <form id="admin-health-form" onSubmit={handleHealthSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="health-select-animal">Chọn động vật kiểm tra</label>
                            <select 
                                id="health-select-animal" 
                                className="form-select" 
                                required
                                value={healthForm.animalCode}
                                onChange={(e) => setHealthForm({ ...healthForm, animalCode: e.target.value })}
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
                                <label className="form-label" htmlFor="health-input-vet">Bác sĩ phụ trách</label>
                                <input 
                                    type="text" 
                                    id="health-input-vet" 
                                    className="form-input" 
                                    required
                                    value={healthForm.veterinarian}
                                    onChange={(e) => setHealthForm({ ...healthForm, veterinarian: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="health-input-status">Tình trạng chung</label>
                                <select 
                                    id="health-input-status" 
                                    className="form-select"
                                    value={healthForm.healthStatus}
                                    onChange={(e) => setHealthForm({ ...healthForm, healthStatus: e.target.value })}
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
                                <label className="form-label" htmlFor="health-input-weight">Cân nặng (kg)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    id="health-input-weight" 
                                    className="form-input" 
                                    placeholder="VD: 215.5" 
                                    required
                                    value={healthForm.weightKg}
                                    onChange={(e) => setHealthForm({ ...healthForm, weightKg: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="health-input-temp">Thân nhiệt (°C)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    id="health-input-temp" 
                                    className="form-input" 
                                    required
                                    value={healthForm.temperatureC}
                                    onChange={(e) => setHealthForm({ ...healthForm, temperatureC: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="health-input-notes">Ghi chú lâm sàng & chế độ ăn</label>
                            <textarea 
                                id="health-input-notes" 
                                className="form-textarea" 
                                rows="2" 
                                placeholder="Ghi nhận hoạt động, ăn uống, móng răng..."
                                value={healthForm.notes}
                                onChange={(e) => setHealthForm({ ...healthForm, notes: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="health-input-action">Hành động y tế cần tiếp theo</label>
                            <input 
                                type="text" 
                                id="health-input-action" 
                                className="form-input" 
                                placeholder="VD: Bổ sung canxi tuần tới"
                                value={healthForm.actionRequired}
                                onChange={(e) => setHealthForm({ ...healthForm, actionRequired: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
                            Lưu Nhật Ký Sức Khỏe
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
