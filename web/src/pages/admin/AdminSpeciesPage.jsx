import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export const IUCN_STATUS_OPTIONS = [
    { value: 'LC - Ít quan tâm', label: 'LC - Ít quan tâm (Least Concern)' },
    { value: 'NT - Sắp bị đe dọa', label: 'NT - Sắp bị đe dọa (Near Threatened)' },
    { value: 'VU - Sắp nguy cấp', label: 'VU - Sắp nguy cấp (Vulnerable)' },
    { value: 'EN - Nguy cấp', label: 'EN - Nguy cấp (Endangered)' },
    { value: 'CR - Cực kỳ nguy cấp', label: 'CR - Cực kỳ nguy cấp (Critically Endangered)' },
    { value: 'EW - Tuyệt chủng trong tự nhiên', label: 'EW - Tuyệt chủng trong tự nhiên (Extinct in the Wild)' },
    { value: 'EX - Tuyệt chủng', label: 'EX - Tuyệt chủng (Extinct)' },
    { value: 'DD - Thiếu dữ liệu', label: 'DD - Thiếu dữ liệu (Data Deficient)' },
    { value: 'NE - Chưa được đánh giá', label: 'NE - Chưa được đánh giá (Not Evaluated)' }
];

export const normalizeConservationStatus = (status) => {
    if (!status) return 'LC - Ít quan tâm';
    const s = status.trim().toUpperCase();
    if (s.startsWith('CR') || s.includes('CỰC KỲ') || s.includes('CRITICALLY')) return 'CR - Cực kỳ nguy cấp';
    if (s.startsWith('EW') || s.includes('TUYỆT CHỦNG TRONG TỰ NHIÊN')) return 'EW - Tuyệt chủng trong tự nhiên';
    if (s.startsWith('EX') || s.includes('TUYỆT CHỦNG') || s.includes('EXTINCT')) return 'EX - Tuyệt chủng';
    if (s.startsWith('EN') || (s.includes('NGUY CẤP') && !s.includes('SẮP')) || s.includes('ENDANGERED')) return 'EN - Nguy cấp';
    if (s.startsWith('VU') || s.includes('SẮP NGUY CẤP') || s.includes('VULNERABLE')) return 'VU - Sắp nguy cấp';
    if (s.startsWith('NT') || s.includes('SẮP BỊ ĐE DỌA') || s.includes('NEAR THREATENED')) return 'NT - Sắp bị đe dọa';
    if (s.startsWith('DD') || s.includes('THIẾU DỮ LIỆU') || s.includes('DEFICIENT')) return 'DD - Thiếu dữ liệu';
    if (s.startsWith('NE') || s.includes('CHƯA ĐƯỢC ĐÁNH GIÁ') || s.includes('NOT EVALUATED')) return 'NE - Chưa được đánh giá';
    if (s.startsWith('LC') || s.includes('ÍT QUAN TÂM') || s.includes('LEAST CONCERN')) return 'LC - Ít quan tâm';

    const found = IUCN_STATUS_OPTIONS.find(opt => opt.value === status);
    if (found) return found.value;
    return 'LC - Ít quan tâm';
};

export default function AdminSpeciesPage() {
    const { showToast } = useApp();
    const [speciesList, setSpeciesList] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const initialForm = {
        nameVi: '',
        nameEn: '',
        conservationStatus: 'LC - Ít quan tâm',
        description: '',
        imageUrl: ''
    };

    const [formData, setFormData] = useState(initialForm);

    const loadData = async () => {
        const res = await ZooApi.getSpecies();
        if (res.success) setSpeciesList(res.data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (s) => {
        setEditMode(true);
        setEditId(s.id);
        setFormData({
            nameVi: s.nameVi,
            nameEn: s.nameEn || '',
            conservationStatus: normalizeConservationStatus(s.conservationStatus),
            description: s.description || '',
            imageUrl: s.imageUrl || ''
        });
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditId(null);
        setFormData(initialForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nameVi.trim()) return;

        if (editMode) {
            const res = await ZooApi.updateSpecies(editId, formData);
            if (res.success) {
                showToast("Cập nhật loài thành công!", "success");
                handleCancelEdit();
                loadData();
            } else {
                showToast(res.error || "Lỗi cập nhật phân loại loài", "error");
            }
        } else {
            const res = await ZooApi.createSpecies(formData);
            if (res.success) {
                showToast("Thêm loài mới thành công!", "success");
                setFormData(initialForm);
                loadData();
            } else {
                showToast(res.error || "Lỗi tạo loài mới", "error");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa phân loại loài này?")) {
            const res = await ZooApi.deleteSpecies(id);
            if (res.success) {
                showToast("Đã xóa loài khỏi danh sách", "info");
                if (editMode && editId === id) handleCancelEdit();
                loadData();
            } else {
                showToast(res.error || "Không thể xóa loài này do có cá thể động vật liên kết.", "error");
            }
        }
    };

    const getIucnBadgeClass = (status) => {
        const s = (status || '').toUpperCase();
        if (s.includes('CR') || s.includes('CỰC KỲ') || s.includes('EX') || s.includes('EW')) return 'badge-danger';
        if (s.includes('EN') || (s.includes('NGUY CẤP') && !s.includes('SẮP'))) return 'badge-warning';
        if (s.includes('VU') || s.includes('NT') || s.includes('SẮP')) return 'badge-amber';
        return 'badge-success';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Phân Loại Loài (Species Management)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Quản lý các bộ, họ và chi động vật được bảo tồn trong hệ thống vườn thú ZooGuide kết nối Supabase.
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
                                    <th>Hình ảnh / Tên Tiếng Việt</th>
                                    <th>Tên Khoa Học / Quốc Tế</th>
                                    <th>Tình trạng bảo tồn</th>
                                    <th>Mô tả sinh thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {speciesList.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {s.imageUrl && (
                                                    <img 
                                                        src={s.imageUrl} 
                                                        alt={s.nameVi} 
                                                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                                                    />
                                                )}
                                                <span className="font-bold text-primary">{s.nameVi}</span>
                                            </div>
                                        </td>
                                        <td className="italic">{s.nameEn}</td>
                                        <td>
                                            <span className={`badge ${getIucnBadgeClass(s.conservationStatus)}`}>
                                                {s.conservationStatus}
                                            </span>
                                        </td>
                                        <td className="text-xs text-muted" style={{ maxWidth: '280px' }}>{s.description}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => handleEdit(s)}
                                                >
                                                    Sửa
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline text-danger" 
                                                    style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                    onClick={() => handleDelete(s.id)}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add / Edit Form */}
                <div className="admin-card">
                    <h3 className="font-bold text-base mb-3">
                        {editMode ? 'Chỉnh Sửa Loài Động Vật' : 'Thêm Loài Động Vật Mới'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Tên loài (Tiếng Việt)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Sư tử Châu Phi"
                                required
                                value={formData.nameVi}
                                onChange={(e) => setFormData({ ...formData, nameVi: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tên tiếng Anh / Tên khoa học (Latin)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Panthera leo"
                                required
                                value={formData.nameEn}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tình trạng bảo tồn (IUCN)</label>
                            <select 
                                className="form-select"
                                value={formData.conservationStatus}
                                onChange={(e) => setFormData({ ...formData, conservationStatus: e.target.value })}
                            >
                                {IUCN_STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">URL Hình ảnh loài</label>
                            <input 
                                type="url" 
                                className="form-input" 
                                placeholder="https://images.unsplash.com/..."
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mô tả đặc điểm sinh thái</label>
                            <textarea 
                                className="form-textarea" 
                                rows="3" 
                                placeholder="Nhập tóm tắt đặc điểm sinh thái, tập tính..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editMode ? 'Cập Nhật Phân Loại Loài' : 'Lưu Phân Loại Loài'}
                            </button>
                            {editMode && (
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleCancelEdit}
                                >
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
