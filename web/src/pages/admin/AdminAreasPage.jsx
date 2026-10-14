import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminAreasPage() {
    const { showToast } = useApp();
    const [areas, setAreas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        code: '',
        nameVi: '',
        nameEn: '',
        color: '#15803D',
        descriptionVi: '',
        descriptionEn: '',
        latitude: '10.7875',
        longitude: '106.7052',
        radiusMeters: '50'
    };

    const [formData, setFormData] = useState(initialForm);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await ZooApi.getAreas();
            if (res.success) {
                setAreas(res.data || []);
            } else {
                showToast(res.message || "Không thể tải danh sách phân khu", "error");
            }
        } catch (err) {
            console.error("Lỗi tải phân khu:", err);
            showToast("Lỗi kết nối khi tải danh sách phân khu", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEditClick = (area) => {
        setEditingId(area.areaId || area.id);
        setFormData({
            code: area.code || '',
            nameVi: area.nameVi || area.name || '',
            nameEn: area.nameEn || '',
            color: area.color || '#15803D',
            descriptionVi: area.descriptionVi || area.description || '',
            descriptionEn: area.descriptionEn || '',
            latitude: String(area.latitude || '10.7875'),
            longitude: String(area.longitude || '106.7052'),
            radiusMeters: String(area.radiusMeters || '50')
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nameVi.trim()) {
            showToast("Vui lòng nhập tên phân khu", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                code: formData.code.toUpperCase(),
                name: formData.nameVi,
                nameVi: formData.nameVi,
                nameEn: formData.nameEn,
                color: formData.color,
                description: formData.descriptionVi,
                descriptionVi: formData.descriptionVi,
                descriptionEn: formData.descriptionEn,
                latitude: parseFloat(formData.latitude) || 10.7875,
                longitude: parseFloat(formData.longitude) || 106.7052,
                radiusMeters: parseFloat(formData.radiusMeters) || 50
            };

            if (editingId) {
                const res = await ZooApi.updateArea(editingId, payload);
                if (res.success) {
                    showToast("Cập nhật phân khu thành công!", "success");
                    cancelEdit();
                    loadData();
                } else {
                    showToast(res.error || res.message || "Lỗi cập nhật phân khu", "error");
                }
            } else {
                const res = await ZooApi.createArea(payload);
                if (res.success) {
                    showToast("Thêm phân khu mới thành công!", "success");
                    setFormData(initialForm);
                    loadData();
                } else {
                    showToast(res.error || res.message || "Lỗi tạo mới phân khu", "error");
                }
            }
        } catch (err) {
            showToast("Lỗi máy chủ khi lưu phân khu", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa phân khu này? Nếu phân khu đang có động vật sinh sống, hệ thống sẽ ngăn chặn việc xóa.")) {
            return;
        }

        try {
            const res = await ZooApi.deleteArea(id);
            if (res.success) {
                showToast("Đã xóa phân khu khỏi danh sách", "info");
                if (editingId === id) cancelEdit();
                loadData();
            } else {
                showToast(res.error || res.message || "Không thể xóa phân khu này vì đang có động vật cư trú.", "error");
            }
        } catch {
            showToast("Lỗi kết nối khi xóa phân khu", "error");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Phân Khu & Chuồng Trại (Areas & Enclosures)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Thông tin kiểm định các phân khu chuồng trại, tọa độ GPS Geofencing, môi trường sống và số lượng loài động vật.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn btn-sm btn-outline" onClick={loadData} disabled={isLoading}>
                        {isLoading ? "Đang tải..." : "🔄 Làm mới"}
                    </button>
                    <span className="chip font-bold">{areas.length} phân khu hoạt động</span>
                </div>
            </div>

            <div className="ticket-page-layout">
                {/* Areas Grid */}
                <div>
                    {isLoading && areas.length === 0 ? (
                        <div className="p-6 text-center text-muted">Đang tải danh sách phân khu...</div>
                    ) : (
                        <div className="animals-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                            {areas.map(area => {
                                const areaId = area.areaId || area.id;
                                return (
                                    <div key={areaId} className="admin-card">
                                        <div className="admin-card-header" style={{ borderLeft: `4px solid ${area.color || '#15803D'}` }}>
                                            <div>
                                                <span className="text-xs uppercase tracking-wider text-muted">Khu vực {area.code || areaId}</span>
                                                <h4 className="font-bold text-base">{area.nameVi || area.name}</h4>
                                            </div>
                                            <span className="badge badge-success">Đạt chuẩn</span>
                                        </div>
                                        <div className="admin-card-body">
                                            <p className="text-sm text-muted mb-3" style={{ minHeight: '40px' }}>
                                                {area.descriptionVi || area.description || "Phân khu cảnh quan tự nhiên."}
                                            </p>
                                            <div className="admin-stat-row">
                                                <span>Số lượng cá thể:</span>
                                                <strong>{area.animalCount ?? (area.animals ? area.animals.length : 0)} cá thể</strong>
                                            </div>
                                            <div className="admin-stat-row">
                                                <span>Bán kính định vị GPS:</span>
                                                <span className="text-xs font-mono">{area.radiusMeters || 50} mét</span>
                                            </div>
                                            <div className="admin-stat-row">
                                                <span>Màu chỉ dẫn bản đồ:</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: area.color || '#15803D' }}></span>
                                                    <code>{area.color || '#15803D'}</code>
                                                </span>
                                            </div>
                                            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button 
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => handleEditClick(area)}
                                                >
                                                    Sửa
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline text-danger" 
                                                    style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                    onClick={() => handleDelete(areaId)}
                                                >
                                                    Xóa khu
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Add/Edit Form */}
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 className="font-bold text-base m-0">
                            {editingId ? "Chỉnh Sửa Phân Khu" : "Tạo Mới Phân Khu Sở Thú"}
                        </h3>
                        {editingId && (
                            <button className="btn btn-sm btn-outline" onClick={cancelEdit}>
                                Hủy sửa
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Mã phân khu</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="VD: F" 
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Màu nhận diện bản đồ</label>
                                <input 
                                    type="color" 
                                    className="form-input" 
                                    style={{ height: '42px', padding: '2px' }}
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tên phân khu (Tiếng Việt)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Khu Rừng Cận Nhiệt Đới" 
                                required
                                value={formData.nameVi}
                                onChange={(e) => setFormData({ ...formData, nameVi: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tên phân khu (English)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Subtropical Forest Biome"
                                value={formData.nameEn}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                            />
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Vĩ độ tâm (Latitude)</label>
                                <input 
                                    type="number" 
                                    step="0.000001"
                                    className="form-input" 
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Kinh độ tâm (Longitude)</label>
                                <input 
                                    type="number" 
                                    step="0.000001"
                                    className="form-input" 
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Bán kính kích hoạt Geofencing (Mét)</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                value={formData.radiusMeters}
                                onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mô tả sinh thái phân khu</label>
                            <textarea 
                                className="form-textarea" 
                                rows="3" 
                                placeholder="Không gian cảnh quan, hào bảo vệ, độ ẩm..."
                                value={formData.descriptionVi}
                                onChange={(e) => setFormData({ ...formData, descriptionVi: e.target.value })}
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-full" 
                            style={{ width: '100%' }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang lưu..." : editingId ? "Cập Nhật Phân Khu" : "Lưu Phân Khu"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
