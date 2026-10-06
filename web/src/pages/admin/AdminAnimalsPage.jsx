import React, { useState, useEffect } from 'react';
import { MOCK_DB, ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminAnimalsPage() {
    const { showToast } = useApp();
    const [animals, setAnimals] = useState([]);
    const [areas, setAreas] = useState([]);
    const [isEditing, setIsEditing] = useState(null);

    const initialForm = {
        nameVi: '',
        nameEn: '',
        scientificName: '',
        species: 'Họ Mèo lớn (Felidae)',
        zoneId: 'zone-b',
        zoneCode: 'B',
        zoneName: 'Khu Động Vật Ăn Thịt Hoàng Gia',
        origin: '',
        diet: '',
        weight: '',
        lifespan: '',
        iucnStatus: 'Nguy cấp (EN)',
        healthStatus: 'Khỏe mạnh',
        breedingStatus: 'Bình thường',
        imageUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=800&q=80'
    };

    const [formData, setFormData] = useState(initialForm);

    const loadData = async () => {
        const resA = await ZooApi.getAnimals();
        if (resA.success) setAnimals(resA.data);
        const resZ = await ZooApi.getAreas();
        if (resZ.success) setAreas(resZ.data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleZoneChange = (zoneId) => {
        const area = areas.find(a => a.id === zoneId);
        setFormData({
            ...formData,
            zoneId,
            zoneCode: area ? area.code : 'A',
            zoneName: area ? area.nameVi : ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nameVi.trim()) return;

        if (isEditing) {
            const res = await ZooApi.updateAnimal(isEditing, formData);
            if (res.success) {
                showToast("Cập nhật thông tin động vật thành công!", "success");
                setIsEditing(null);
                setFormData(initialForm);
                loadData();
            }
        } else {
            const res = await ZooApi.createAnimal(formData);
            if (res.success) {
                showToast("Thêm mới cá thể động vật thành công!", "success");
                setFormData(initialForm);
                loadData();
            }
        }
    };

    const handleEdit = (animal) => {
        setIsEditing(animal.id);
        setFormData({ ...animal });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa động vật này khỏi hồ sơ quản lý?")) {
            await ZooApi.deleteAnimal(id);
            showToast("Đã xóa động vật khỏi hệ thống", "info");
            loadData();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Động Vật (Animal Records CMS)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Hồ sơ các cá thể thú, định vị chuồng trại trên bản đồ, tình trạng bảo tồn IUCN và chế độ dinh dưỡng.
                    </p>
                </div>
                <span className="chip font-bold">{animals.length} cá thể động vật</span>
            </div>

            <div className="ticket-page-layout">
                {/* Animal Grid List */}
                <div>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã / Hình</th>
                                    <th>Tên loài & Tên Latin</th>
                                    <th>Phân khu</th>
                                    <th>Bảo tồn (IUCN)</th>
                                    <th>Hồ sơ sức khỏe</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {animals.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img src={a.imageUrl} alt={a.nameVi} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                                                <span className="font-mono text-xs font-bold">{a.code}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>{a.nameVi}</strong>
                                            <div className="text-xs text-muted italic">{a.scientificName}</div>
                                        </td>
                                        <td>
                                            <span className="chip chip-sm">Khu {a.zoneCode}</span>
                                        </td>
                                        <td>
                                            <span className="badge badge-amber">{a.iucnStatus}</span>
                                        </td>
                                        <td className="text-xs text-success">{a.healthStatus}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => handleEdit(a)}
                                                >
                                                    Sửa
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline text-danger" 
                                                    style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                    onClick={() => handleDelete(a.id)}
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

                {/* Create/Edit Form */}
                <div className="admin-card">
                    <h3 className="font-bold text-base mb-3">
                        {isEditing ? 'Cập Nhật Hồ Sơ Động Vật' : 'Thêm Động Vật Mới'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Tên động vật (Tiếng Việt)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                required
                                placeholder="VD: Hổ Bengal Hoàng Gia"
                                value={formData.nameVi}
                                onChange={(e) => setFormData({ ...formData, nameVi: e.target.value })}
                            />
                        </div>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Tên quốc tế</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Royal Bengal Tiger"
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tên khoa học (Latin)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Panthera tigris tigris"
                                    value={formData.scientificName}
                                    onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Phân khu nuôi thả</label>
                                <select 
                                    className="form-select"
                                    value={formData.zoneId}
                                    onChange={(e) => handleZoneChange(e.target.value)}
                                >
                                    {areas.map(z => (
                                        <option key={z.id} value={z.id}>Khu {z.code} - {z.nameVi}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tình trạng bảo tồn (IUCN)</label>
                                <select 
                                    className="form-select"
                                    value={formData.iucnStatus}
                                    onChange={(e) => setFormData({ ...formData, iucnStatus: e.target.value })}
                                >
                                    <option value="Cực kỳ nguy cấp (CR)">Cực kỳ nguy cấp (CR)</option>
                                    <option value="Nguy cấp (EN)">Nguy cấp (EN)</option>
                                    <option value="Sắp nguy cấp (VU)">Sắp nguy cấp (VU)</option>
                                    <option value="Sắp bị đe dọa (NT)">Sắp bị đe dọa (NT)</option>
                                    <option value="Ít quan tâm (LC)">Ít quan tâm (LC)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Xuất xứ / Nguồn gốc</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="VD: Ấn Độ"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thức ăn chính</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="VD: Thịt hươu, thịt bò"
                                    value={formData.diet}
                                    onChange={(e) => setFormData({ ...formData, diet: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Cân nặng</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="180 - 260 kg"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tuổi thọ trung bình</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="15 - 20 năm"
                                    value={formData.lifespan}
                                    onChange={(e) => setFormData({ ...formData, lifespan: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">URL Hình ảnh động vật</label>
                            <input 
                                type="url" 
                                className="form-input" 
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {isEditing ? 'Cập Nhật Hồ Sơ' : 'Lưu Động Vật'}
                            </button>
                            {isEditing && (
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => { setIsEditing(null); setFormData(initialForm); }}
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
