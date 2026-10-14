import React, { useState, useEffect } from 'react';
import { MOCK_DB, ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminAnimalsPage() {
    const { showToast } = useApp();
    const [animals, setAnimals] = useState([]);
    const [areas, setAreas] = useState([]);
    const [enclosures, setEnclosures] = useState([]);
    const [speciesOptions, setSpeciesOptions] = useState([]);
    const [isEditing, setIsEditing] = useState(null);

    const initialForm = {
        nameVi: '',
        nameEn: '',
        scientificName: '',
        species: 'Sư tử Châu Phi',
        speciesId: 1,
        zoneId: 'zone-b',
        zoneCode: 'B',
        zoneName: 'Khu Động Vật Ăn Thịt Hoàng Gia',
        areaId: 1,
        enclosureId: '',
        gender: 'Male',
        origin: '',
        diet: '',
        weight: '',
        lifespan: '',
        iucnStatus: 'VU - Sắp nguy cấp',
        healthStatus: 'Khỏe mạnh',
        breedingStatus: 'Bình thường',
        imageUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80'
    };

    const [formData, setFormData] = useState(initialForm);

    const loadData = async () => {
        const resA = await ZooApi.getAnimals();
        if (resA.success) setAnimals(resA.data);

        const resZ = await ZooApi.getAreas();
        if (resZ.success) {
            setAreas(resZ.data);
            if (resZ.data.length > 0 && !formData.zoneId) {
                setFormData(prev => ({
                    ...prev,
                    zoneId: resZ.data[0].id || `zone-${resZ.data[0].code?.toLowerCase()}`,
                    areaId: resZ.data[0].areaId || resZ.data[0].id
                }));
            }
        }

        const resE = await ZooApi.getEnclosures();
        if (resE.success) setEnclosures(resE.data);

        const resS = await ZooApi.getSpecies();
        if (resS.success) setSpeciesOptions(resS.data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleZoneChange = (zoneId) => {
        const area = areas.find(a => a.id === zoneId || a.areaId === Number(zoneId));
        const newAreaId = area ? (area.areaId || area.id) : 1;
        setFormData(prev => ({
            ...prev,
            zoneId,
            areaId: newAreaId,
            zoneCode: area ? area.code : 'A',
            zoneName: area ? (area.nameVi || area.name) : '',
            enclosureId: '' // Reset chuồng khi đổi khu vực
        }));
    };

    const handleSpeciesChange = (speciesId) => {
        const sp = speciesOptions.find(s => String(s.id) === String(speciesId));
        if (sp) {
            setFormData({
                ...formData,
                speciesId: sp.id,
                species: sp.nameVi,
                scientificName: sp.nameEn || formData.scientificName,
                iucnStatus: sp.conservationStatus || formData.iucnStatus,
                imageUrl: formData.imageUrl || sp.imageUrl || ''
            });
        } else {
            setFormData({
                ...formData,
                speciesId: null,
                species: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nameVi.trim()) {
            showToast("Vui lòng nhập tên cá thể động vật", "error");
            return;
        }

        const payload = {
            ...formData,
            enclosureId: formData.enclosureId ? Number(formData.enclosureId) : null
        };

        if (isEditing) {
            const res = await ZooApi.updateAnimal(isEditing, payload);
            if (res.success) {
                showToast("Cập nhật thông tin động vật thành công!", "success");
                setIsEditing(null);
                setFormData(initialForm);
                loadData();
            } else {
                showToast(res.error || res.message || "Không thể cập nhật hồ sơ động vật", "error");
            }
        } else {
            const res = await ZooApi.createAnimal(payload);
            if (res.success) {
                showToast("Thêm mới cá thể động vật thành công!", "success");
                setFormData(initialForm);
                loadData();
            } else {
                showToast(res.error || res.message || "Không thể tạo mới cá thể động vật", "error");
            }
        }
    };

    const handleEdit = (animal) => {
        setIsEditing(animal.id);
        setFormData({
            ...animal,
            nameVi: animal.nameVi || animal.name,
            speciesId: animal.speciesId || 1,
            areaId: animal.areaId || 1,
            enclosureId: animal.enclosureId || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setFormData(initialForm);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa cá thể động vật này khỏi hồ sơ quản lý?")) {
            const res = await ZooApi.deleteAnimal(id);
            if (res.success) {
                showToast("Đã xóa động vật khỏi hệ thống", "info");
                if (isEditing === id) handleCancelEdit();
                loadData();
            } else {
                showToast(res.error || res.message || "Không thể xóa động vật khỏi hệ thống", "error");
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
                        Quản Lý Động Vật (Animal Records CMS)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Hồ sơ các cá thể thú, liên kết phân loại loài (Species), định vị chuồng trại trên bản đồ và tình trạng bảo tồn IUCN.
                    </p>
                </div>
                <span className="chip font-bold">{animals.length} cá thể động vật</span>
            </div>

            <div className="ticket-page-layout">
                {/* Animal Grid List */}
                <div>
                    <div className="admin-table-wrapper ticket-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã / Hình</th>
                                    <th>Tên cá thể & Loài sinh học</th>
                                    <th>Phân khu</th>
                                    <th>Chuồng trại</th>
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
                                            <div className="text-xs text-muted">
                                                <span className="font-semibold text-primary">{a.species}</span>
                                                {a.scientificName && <span> • <em className="italic">{a.scientificName}</em></span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="chip chip-sm">Khu {a.zoneCode}</span>
                                        </td>
                                        <td>
                                            {a.enclosureName ? (
                                                <span className="chip chip-sm font-semibold" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                                                    {a.enclosureName}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted italic">Chưa xếp chuồng</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${getIucnBadgeClass(a.iucnStatus)}`}>{a.iucnStatus}</span>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 className="font-bold text-base m-0">
                            {isEditing ? 'Cập Nhật Hồ Sơ Động Vật' : 'Thêm Động Vật Mới'}
                        </h3>
                        {isEditing && (
                            <button className="btn btn-sm btn-outline" onClick={handleCancelEdit}>
                                Hủy sửa
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Tên cá thể động vật (Tiếng Việt)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                required
                                placeholder="VD: Sư tử Simba"
                                value={formData.nameVi}
                                onChange={(e) => setFormData({ ...formData, nameVi: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Thuộc Loài sinh học (Species)</label>
                            <select 
                                className="form-select"
                                value={formData.speciesId || ''}
                                onChange={(e) => handleSpeciesChange(e.target.value)}
                            >
                                <option value="">-- Chọn loài sinh học --</option>
                                {speciesOptions.map(sp => (
                                    <option key={sp.id} value={sp.id}>
                                        {sp.nameVi} ({sp.nameEn}) - {sp.conservationStatus}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Tên quốc tế</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="African Lion Simba"
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tên khoa học (Latin)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Panthera leo"
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
                                        <option key={z.id} value={z.id}>Khu {z.code} - {z.nameVi || z.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Chuồng trại (Enclosure)</label>
                                <select 
                                    className="form-select"
                                    value={formData.enclosureId || ''}
                                    onChange={(e) => setFormData({ ...formData, enclosureId: e.target.value ? Number(e.target.value) : '' })}
                                >
                                    <option value="">-- Chưa xếp chuồng (Trống) --</option>
                                    {enclosures
                                        .filter(e => e.areaId === Number(formData.areaId))
                                        .map(e => (
                                            <option key={e.enclosureId || e.id} value={e.enclosureId || e.id}>
                                                {e.name} ({e.code || `ENC-${e.enclosureId}`})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Giới tính</label>
                                <select 
                                    className="form-select"
                                    value={formData.gender || "Male"}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="Male">Đực (Male)</option>
                                    <option value="Female">Cái (Female)</option>
                                    <option value="Unknown">Chưa rõ (Unknown)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tình trạng bảo tồn (IUCN)</label>
                                <select 
                                    className="form-select"
                                    value={formData.iucnStatus}
                                    onChange={(e) => setFormData({ ...formData, iucnStatus: e.target.value })}
                                >
                                    <option value="CR - Cực kỳ nguy cấp">CR - Cực kỳ nguy cấp</option>
                                    <option value="EN - Nguy cấp">EN - Nguy cấp</option>
                                    <option value="VU - Sắp nguy cấp">VU - Sắp nguy cấp</option>
                                    <option value="NT - Sắp bị đe dọa">NT - Sắp bị đe dọa</option>
                                    <option value="LC - Ít quan tâm">LC - Ít quan tâm</option>
                                    <option value="EW - Tuyệt chủng trong tự nhiên">EW - Tuyệt chủng trong tự nhiên</option>
                                    <option value="EX - Tuyệt chủng">EX - Tuyệt chủng</option>
                                    <option value="DD - Thiếu dữ liệu">DD - Thiếu dữ liệu</option>
                                    <option value="NE - Chưa được đánh giá">NE - Chưa được đánh giá</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Xuất xứ / Nguồn gốc</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="VD: Tanzania, Serengeti"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thức ăn chính</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="VD: Thịt bò tươi, hươu nai"
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
                                    placeholder="VD: 190 kg"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tuổi thọ trung bình</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="VD: 14 - 18 năm"
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
