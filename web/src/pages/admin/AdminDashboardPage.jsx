import React, { useState, useEffect } from 'react';
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

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, animalsRes] = await Promise.all([
                ZooApi.getDashboardStats(),
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
        loadDashboardData();
    }, []);

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Trung Tâm Điều Hành ZooGuide
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Thống kê tổng quan tình trạng vận hành, động vật, chuồng trại và dịch vụ tham quan thời gian thực từ cơ sở dữ liệu.
                    </p>
                </div>
                <button 
                    className="btn btn-sm btn-outline" 
                    onClick={loadDashboardData}
                    disabled={isLoading}
                    title="Cập nhật số liệu"
                >
                    {isLoading ? "Đang đồng bộ..." : "🔄 Làm mới số liệu"}
                </button>
            </div>

            {/* Metrics Row */}
            <div className="admin-metrics-row">
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Tổng vé phát hành</span>
                    <span className="metric-number">
                        {isLoading ? "..." : (stats.totalTickets || 0)}
                    </span>
                    <span className="text-xs text-success">
                        Đang hoạt động: {stats.activeTickets || 0}
                    </span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Tổng số cá thể động vật</span>
                    <span className="metric-number">
                        {isLoading ? "..." : (stats.totalAnimals || 0)}
                    </span>
                    <span className="text-xs text-info">
                        {stats.totalSpecies || 0} loài sinh thái
                    </span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Phân khu chuồng trại</span>
                    <span className="metric-number">
                        {isLoading ? "..." : (stats.totalAreas || 0)}
                    </span>
                    <span className="text-xs text-success">100% đạt chuẩn an toàn</span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Bài thuyết minh đa ngữ</span>
                    <span className="metric-number">
                        {isLoading ? "..." : (stats.totalNarrations || 0)}
                    </span>
                    <span className="text-xs text-muted">
                        {stats.activeSessions || 0} phiên khách trực tuyến
                    </span>
                </div>
            </div>

            {/* Health & Breeding Quick Log Section */}
            <div className="ticket-page-layout mt-4">
                {/* Left: Health Log Records */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 className="font-bold text-base m-0">Nhật Ký Y Tế & Sinh Sản Gần Nhất</h3>
                        <span className="text-xs text-muted">
                            {stats.recentHealthLogs?.length || 0} hồ sơ ghi nhận
                        </span>
                    </div>

                    <div id="admin-health-logs-list">
                        {isLoading && (!stats.recentHealthLogs || stats.recentHealthLogs.length === 0) ? (
                            <div className="text-center p-6 text-muted">Đang tải nhật ký kiểm tra y tế...</div>
                        ) : stats.recentHealthLogs && stats.recentHealthLogs.length > 0 ? (
                            stats.recentHealthLogs.map(log => (
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
                                    <p className="health-log-notes">📝 <strong>Ghi chú:</strong> {log.notes}</p>
                                    {log.actionRequired && (
                                        <p className="health-log-action">⚠️ <strong>Hành động:</strong> {log.actionRequired}</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="admin-card text-center text-muted p-6">
                                Chưa có nhật ký y tế nào được ghi nhận hôm nay.
                            </div>
                        )}
                    </div>
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
