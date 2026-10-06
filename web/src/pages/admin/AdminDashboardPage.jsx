import React, { useState, useEffect } from 'react';
import { MOCK_DB, ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminDashboardPage() {
    const { showToast } = useApp();
    const [healthLogs, setHealthLogs] = useState([]);

    // Form inputs for Health Log
    const [healthForm, setHealthForm] = useState({
        animalCode: 'ANI-001',
        veterinarian: 'BS. Trần Minh Quân',
        healthStatus: 'Rất tốt',
        weightKg: '215.5',
        temperatureC: '38.2',
        notes: '',
        actionRequired: ''
    });

    useEffect(() => {
        ZooApi.getHealthLogs().then(res => {
            if (res.success) setHealthLogs(res.data);
        });
    }, []);

    const handleHealthSubmit = async (e) => {
        e.preventDefault();
        const animal = MOCK_DB.animals.find(a => a.code === healthForm.animalCode);
        const record = {
            animalCode: healthForm.animalCode,
            animalName: animal ? animal.nameVi : healthForm.animalCode,
            veterinarian: healthForm.veterinarian,
            weightKg: parseFloat(healthForm.weightKg) || 0,
            temperatureC: parseFloat(healthForm.temperatureC) || 38.0,
            healthStatus: healthForm.healthStatus,
            notes: healthForm.notes,
            actionRequired: healthForm.actionRequired
        };

        const res = await ZooApi.addHealthRecord(record);
        if (res.success) {
            showToast("Đã lưu nhật ký khám sức khỏe động vật!", "success");
            setHealthForm({
                animalCode: 'ANI-001',
                veterinarian: 'BS. Trần Minh Quân',
                healthStatus: 'Rất tốt',
                weightKg: '',
                temperatureC: '38.0',
                notes: '',
                actionRequired: ''
            });
            ZooApi.getHealthLogs().then(r => r.success && setHealthLogs(r.data));
        }
    };

    const tickets = MOCK_DB.tickets;
    const areas = MOCK_DB.areas;
    const animals = MOCK_DB.animals;
    const species = MOCK_DB.species;

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                    Trung Tâm Điều Hành ZooGuide
                </h2>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                    Thống kê tổng quan tình trạng vận hành, động vật, chuồng trại và dịch vụ tham quan hôm nay.
                </p>
            </div>

            {/* Metrics Row */}
            <div className="admin-metrics-row">
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Tổng vé phát hành</span>
                    <span className="metric-number">{tickets.length}</span>
                    <span className="text-xs text-success">Đang hoạt động: {tickets.filter(t => t.status === 'Active').length}</span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Tổng số cá thể động vật</span>
                    <span className="metric-number">{animals.length}</span>
                    <span className="text-xs text-info">{species.length} loài sinh thái</span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Chuồng trại kiểm định</span>
                    <span className="metric-number">{areas.length} / {areas.length}</span>
                    <span className="text-xs text-success">100% đạt chuẩn an toàn</span>
                </div>
                <div className="metric-card">
                    <span className="text-xs text-muted uppercase font-bold">Bài thuyết minh</span>
                    <span className="metric-number">{Object.keys(MOCK_DB.narrations).length * 2}</span>
                    <span className="text-xs text-muted">Song ngữ Việt - Anh</span>
                </div>
            </div>

            {/* Health & Breeding Quick Log Section */}
            <div className="ticket-page-layout mt-4">
                {/* Left: Health Log Records */}
                <div>
                    <h3 className="font-bold text-base mb-3">Nhật Ký Y Tế & Sinh Sản Gần Nhất</h3>
                    <div id="admin-health-logs-list">
                        {healthLogs.map(log => (
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
                        ))}
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
                                {animals.map(a => (
                                    <option key={a.code} value={a.code}>{a.nameVi} ({a.code})</option>
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
