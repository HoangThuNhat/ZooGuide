import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminAreasPage() {
    const { showToast } = useApp();
    const [areas, setAreas] = useState([]);
    const [formData, setFormData] = useState({
        code: '',
        nameVi: '',
        nameEn: '',
        color: '#15803D',
        descriptionVi: '',
        descriptionEn: ''
    });

    const loadData = async () => {
        const res = await ZooApi.getAreas();
        if (res.success) setAreas(res.data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.code.trim() || !formData.nameVi.trim()) return;

        const res = await ZooApi.createArea(formData);
        if (res.success) {
            showToast("Thêm phân khu mới thành công!", "success");
            setFormData({ code: '', nameVi: '', nameEn: '', color: '#15803D', descriptionVi: '', descriptionEn: '' });
            loadData();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa phân khu này?")) {
            await ZooApi.deleteArea(id);
            showToast("Đã xóa phân khu", "info");
            loadData();
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
                        Thông tin kiểm định các phân khu A, B, C, D, E, môi trường sống và số lượng loài động vật.
                    </p>
                </div>
                <span className="chip font-bold">{areas.length} phân khu hoạt động</span>
            </div>

            <div className="ticket-page-layout">
                {/* Areas Grid */}
                <div>
                    <div className="animals-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {areas.map(area => (
                            <div key={area.id} className="admin-card">
                                <div className="admin-card-header" style={{ borderLeft: `4px solid ${area.color}` }}>
                                    <div>
                                        <span className="text-xs uppercase tracking-wider text-muted">Khu vực {area.code}</span>
                                        <h4 className="font-bold text-base">{area.nameVi}</h4>
                                    </div>
                                    <span className="badge badge-success">Đạt chuẩn</span>
                                </div>
                                <div className="admin-card-body">
                                    <p className="text-sm text-muted mb-3">{area.descriptionVi}</p>
                                    <div className="admin-stat-row">
                                        <span>Số lượng loài hiện tại:</span>
                                        <strong>{area.animalCount} loài</strong>
                                    </div>
                                    <div className="admin-stat-row">
                                        <span>Màu chỉ dẫn bản đồ:</span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: area.color }}></span>
                                            <code>{area.color}</code>
                                        </span>
                                    </div>
                                    <div className="admin-stat-row">
                                        <span>Kiểm định an toàn:</span>
                                        <span className="text-success font-semibold">✓ Đạt chuẩn an toàn</span>
                                    </div>
                                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button 
                                            className="btn btn-sm btn-outline text-danger" 
                                            style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                            onClick={() => handleDelete(area.id)}
                                        >
                                            Xóa khu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Form */}
                <div className="admin-card">
                    <h3 className="font-bold text-base mb-3">Tạo Mới Phân Khu Sở Thú</h3>
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

                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
                            Lưu Phân Khu
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
