import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminSpeciesPage() {
    const { showToast } = useApp();
    const [speciesList, setSpeciesList] = useState([]);
    const [formData, setFormData] = useState({
        nameVi: '',
        nameEn: '',
        scientificOrder: '',
        description: ''
    });

    const loadData = async () => {
        const res = await ZooApi.getSpecies();
        if (res.success) setSpeciesList(res.data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nameVi.trim()) return;

        const res = await ZooApi.createSpecies(formData);
        if (res.success) {
            showToast("Thêm loài mới thành công!", "success");
            setFormData({ nameVi: '', nameEn: '', scientificOrder: '', description: '' });
            loadData();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa phân loại loài này?")) {
            await ZooApi.deleteSpecies(id);
            showToast("Đã xóa loài khỏi danh sách", "info");
            loadData();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Phân Loại Loài (Species Management)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Quản lý các bộ, họ và chi động vật được bảo tồn trong hệ thống vườn thú ZooGuide.
                    </p>
                </div>
                <span className="chip font-bold">{speciesList.length} loài sinh thái</span>
            </div>

            <div className="ticket-page-layout">
                {/* List Table */}
                <div>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Tên Tiếng Việt</th>
                                    <th>Tên Khoa Học / Quốc Tế</th>
                                    <th>Bộ (Order)</th>
                                    <th>Mô tả sinh thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {speciesList.map(s => (
                                    <tr key={s.id}>
                                        <td className="font-bold text-primary">{s.nameVi}</td>
                                        <td className="italic">{s.nameEn}</td>
                                        <td><span className="chip chip-sm">{s.scientificOrder}</span></td>
                                        <td className="text-xs text-muted" style={{ maxWidth: '280px' }}>{s.description}</td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-outline text-danger" 
                                                style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                onClick={() => handleDelete(s.id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Form */}
                <div className="admin-card">
                    <h3 className="font-bold text-base mb-3">Thêm Loài Động Vật Mới</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Tên loài (Tiếng Việt)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Họ Mèo lớn"
                                required
                                value={formData.nameVi}
                                onChange={(e) => setFormData({ ...formData, nameVi: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tên tiếng Anh / Tên quốc tế</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Big Cats (Felidae)"
                                required
                                value={formData.nameEn}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bộ khoa học (Order)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Carnivora"
                                required
                                value={formData.scientificOrder}
                                onChange={(e) => setFormData({ ...formData, scientificOrder: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mô tả đặc điểm sinh học</label>
                            <textarea 
                                className="form-textarea" 
                                rows="3" 
                                placeholder="Nhập tóm tắt mô tả..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
                            Lưu Phân Loại Loài
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
