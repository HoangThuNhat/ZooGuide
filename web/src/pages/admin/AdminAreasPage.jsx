import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminAreasPage() {
    const { showToast } = useApp();
    const [activeTab, setActiveTab] = useState('areas'); // 'areas' | 'enclosures'
    const [areas, setAreas] = useState([]);
    const [enclosures, setEnclosures] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [selectedAreaFilter, setSelectedAreaFilter] = useState('all');
    const [areaSearchQuery, setAreaSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Area Form State
    const [isEditingArea, setIsEditingArea] = useState(null);
    const initialAreaForm = {
        code: '',
        nameVi: '',
        nameEn: '',
        color: '#15803D',
        descriptionVi: '',
        descriptionEn: '',
        latitude: '10.7875',
        longitude: '106.7052',
        mapX: 400,
        mapY: 300,
        radiusMeters: '50'
    };
    const [areaForm, setAreaForm] = useState(initialAreaForm);

    // Enclosure Form State
    const [isEditingEnclosure, setIsEditingEnclosure] = useState(null);
    const initialEnclosureForm = {
        areaId: '',
        code: '',
        name: '',
        description: '',
        imageUrl: '',
        status: 'Active',
        mapX: 450,
        mapY: 320
    };
    const [enclosureForm, setEnclosureForm] = useState(initialEnclosureForm);

    // Move Animal State
    const [movingAnimal, setMovingAnimal] = useState(null); // animal obj
    const [targetEnclosureId, setTargetEnclosureId] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const resA = await ZooApi.getAreas();
            if (resA.success) {
                setAreas(resA.data || []);
                if (resA.data && resA.data.length > 0 && !enclosureForm.areaId) {
                    setEnclosureForm(prev => ({ ...prev, areaId: resA.data[0].areaId || resA.data[0].id }));
                }
            } else {
                showToast(resA.message || "Không thể tải danh sách phân khu", "error");
            }

            const resE = await ZooApi.getEnclosures();
            if (resE.success) setEnclosures(resE.data);

            const resAni = await ZooApi.getAnimals();
            if (resAni.success) setAnimals(resAni.data);
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

    // AREA HANDLERS
    const handleAreaSubmit = async (e) => {
        e.preventDefault();
        if (!areaForm.nameVi.trim()) {
            showToast("Vui lòng nhập tên phân khu", "error");
            return;
        }

        const payload = {
            code: areaForm.code.trim().toUpperCase(),
            name: areaForm.nameVi.trim(),
            nameVi: areaForm.nameVi.trim(),
            nameEn: areaForm.nameEn,
            description: areaForm.descriptionVi.trim(),
            descriptionVi: areaForm.descriptionVi.trim(),
            descriptionEn: areaForm.descriptionEn,
            color: areaForm.color,
            latitude: parseFloat(areaForm.latitude) || 10.7875,
            longitude: parseFloat(areaForm.longitude) || 106.7052,
            mapX: areaForm.mapX !== '' ? parseFloat(areaForm.mapX) : null,
            mapY: areaForm.mapY !== '' ? parseFloat(areaForm.mapY) : null,
            radiusMeters: parseFloat(areaForm.radiusMeters) || 50
        };

        setIsSubmitting(true);
        try {
            if (isEditingArea) {
                const res = await ZooApi.updateArea(isEditingArea, payload);
                if (res.success) {
                    showToast("Cập nhật phân khu thành công!", "success");
                    setIsEditingArea(null);
                    setAreaForm(initialAreaForm);
                    loadData();
                } else {
                    showToast(res.error || res.message || "Lỗi cập nhật phân khu", "error");
                }
            } else {
                const res = await ZooApi.createArea(payload);
                if (res.success) {
                    showToast("Thêm phân khu mới thành công!", "success");
                    setAreaForm(initialAreaForm);
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

    const handleEditArea = (area) => {
        setIsEditingArea(area.areaId || area.id);
        setAreaForm({
            code: area.code || '',
            nameVi: area.nameVi || area.name || '',
            nameEn: area.nameEn || '',
            color: area.color || '#15803D',
            descriptionVi: area.descriptionVi || area.description || '',
            descriptionEn: area.descriptionEn || '',
            latitude: String(area.latitude || '10.7875'),
            longitude: String(area.longitude || '106.7052'),
            mapX: area.mapX != null ? area.mapX : 400,
            mapY: area.mapY != null ? area.mapY : 300,
            radiusMeters: String(area.radiusMeters || '50')
        });
        setActiveTab('areas');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditArea = () => {
        setIsEditingArea(null);
        setAreaForm(initialAreaForm);
    };

    const handleDeleteArea = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa phân khu này? Nếu phân khu đang có động vật sinh sống, hệ thống sẽ ngăn chặn việc xóa.")) {
            return;
        }

        try {
            const res = await ZooApi.deleteArea(id);
            if (res.success) {
                showToast("Đã xóa phân khu khỏi danh sách", "info");
                if (isEditingArea === id) cancelEditArea();
                loadData();
            } else {
                showToast(res.error || res.message || "Không thể xóa phân khu này vì đang có động vật cư trú.", "error");
            }
        } catch {
            showToast("Lỗi kết nối khi xóa phân khu", "error");
        }
    };

    // ENCLOSURE HANDLERS
    const handleEnclosureSubmit = async (e) => {
        e.preventDefault();
        if (!enclosureForm.name.trim() || !enclosureForm.areaId) {
            showToast("Vui lòng nhập tên chuồng và chọn phân khu.", "warning");
            return;
        }

        const payload = {
            areaId: parseInt(enclosureForm.areaId),
            code: enclosureForm.code.trim() || null,
            name: enclosureForm.name.trim(),
            description: enclosureForm.description.trim(),
            imageUrl: enclosureForm.imageUrl.trim(),
            status: enclosureForm.status,
            mapX: enclosureForm.mapX !== '' ? parseFloat(enclosureForm.mapX) : null,
            mapY: enclosureForm.mapY !== '' ? parseFloat(enclosureForm.mapY) : null
        };

        if (isEditingEnclosure) {
            const res = await ZooApi.updateEnclosure(isEditingEnclosure, payload);
            if (res.success) {
                showToast("Cập nhật thông tin chuồng trại thành công!", "success");
                setIsEditingEnclosure(null);
                setEnclosureForm({ ...initialEnclosureForm, areaId: areas[0]?.areaId || '' });
                loadData();
            } else {
                showToast(res.error || res.message || "Lỗi cập nhật chuồng", "error");
            }
        } else {
            const res = await ZooApi.createEnclosure(payload);
            if (res.success) {
                showToast("Thêm mới chuồng trại thành công!", "success");
                setEnclosureForm({ ...initialEnclosureForm, areaId: areas[0]?.areaId || '' });
                loadData();
            } else {
                showToast(res.error || res.message || "Lỗi tạo chuồng", "error");
            }
        }
    };

    const handleEditEnclosure = (enc) => {
        setIsEditingEnclosure(enc.enclosureId || enc.id);
        setEnclosureForm({
            areaId: enc.areaId,
            code: enc.code || '',
            name: enc.name || '',
            description: enc.description || '',
            imageUrl: enc.imageUrl || '',
            status: enc.status || 'Active',
            mapX: enc.mapX != null ? enc.mapX : 450,
            mapY: enc.mapY != null ? enc.mapY : 320
        });
        setActiveTab('enclosures');
    };

    const handleDeleteEnclosure = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa chuồng này? Nếu chuồng đang có động vật, bạn cần chuyển chúng trước.")) {
            const res = await ZooApi.deleteEnclosure(id);
            if (res.success) {
                showToast("Đã xóa chuồng thành công", "info");
                loadData();
            } else {
                showToast(res.error || res.message || "Không thể xóa chuồng.", "error");
            }
        }
    };

    // MOVE ANIMAL HANDLER
    const handleConfirmMoveAnimal = async () => {
        if (!movingAnimal) return;
        const targetId = targetEnclosureId ? parseInt(targetEnclosureId) : null;
        const res = await ZooApi.moveAnimalEnclosure(movingAnimal.animalId || movingAnimal.id, targetId);
        if (res.success) {
            showToast(res.message || "Chuyển chuồng cho động vật thành công!", "success");
            setMovingAnimal(null);
            setTargetEnclosureId('');
            loadData();
        } else {
            showToast(res.error || res.message || "Không thể chuyển chuồng.", "error");
        }
    };

    const filteredAreas = areas.filter(area => {
        if (!areaSearchQuery.trim()) return true;
        const q = areaSearchQuery.toLowerCase().trim();
        const nameVi = (area.nameVi || area.name || '').toLowerCase();
        const nameEn = (area.nameEn || '').toLowerCase();
        const code = (area.code || '').toLowerCase();
        const desc = (area.descriptionVi || area.description || '').toLowerCase();
        return nameVi.includes(q) || nameEn.includes(q) || code.includes(q) || desc.includes(q);
    });

    const filteredEnclosures = enclosures.filter(e => {
        if (selectedAreaFilter === 'all') return true;
        return e.areaId === Number(selectedAreaFilter);
    });

    return (
        <div>
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Phân Khu & Chuồng Trại (Areas & Enclosures)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Cấu trúc phân cấp chuẩn: <strong>Sở thú → Phân khu (Area) → Chuồng trại (Enclosure) → Cá thể động vật</strong>.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-outline" onClick={loadData} disabled={isLoading}>
                        {isLoading ? "Đang tải..." : "🔄 Làm mới"}
                    </button>
                    <span className="chip font-bold" style={{ background: '#DCFCE7', color: '#166534' }}>
                        {areas.length} Phân Khu
                    </span>
                    <span className="chip font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                        {enclosures.length} Chuồng Trại
                    </span>
                </div>
            </div>

            {/* Sub-Tabs Selector */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', marginBottom: '24px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
                <button
                    className="btn btn-sm"
                    style={{
                        padding: '10px 20px',
                        fontWeight: 700,
                        borderBottom: activeTab === 'areas' ? '3px solid #15803D' : '3px solid transparent',
                        borderRadius: '0',
                        background: 'transparent',
                        color: activeTab === 'areas' ? '#15803D' : '#64748B'
                    }}
                    onClick={() => setActiveTab('areas')}
                >
                    🗺️ Danh Sách Phân Khu ({areas.length})
                </button>
                <button
                    className="btn btn-sm"
                    style={{
                        padding: '10px 20px',
                        fontWeight: 700,
                        borderBottom: activeTab === 'enclosures' ? '3px solid #15803D' : '3px solid transparent',
                        borderRadius: '0',
                        background: 'transparent',
                        color: activeTab === 'enclosures' ? '#15803D' : '#64748B'
                    }}
                    onClick={() => setActiveTab('enclosures')}
                >
                    🏠 Quản Lý Chuồng Trại ({enclosures.length})
                </button>
            </div>

            {/* TAB 1: AREAS MANAGEMENT */}
            {activeTab === 'areas' && (
                <div className="ticket-page-layout">
                    {/* Areas Grid with Scroll Container */}
                    <div>
                        {/* Thanh tìm kiếm nhanh phân khu */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '34px', paddingRight: areaSearchQuery ? '32px' : '10px', height: '38px', fontSize: '0.875rem' }}
                                    placeholder="Tìm kiếm phân khu theo tên, mã khu..."
                                    value={areaSearchQuery}
                                    onChange={(e) => setAreaSearchQuery(e.target.value)}
                                />
                                {areaSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setAreaSearchQuery('')}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#94A3B8',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            padding: '2px 6px'
                                        }}
                                        title="Xóa tìm kiếm"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <span className="text-xs text-muted font-bold">
                                Hiển thị {filteredAreas.length} / {areas.length} phân khu
                            </span>
                        </div>

                        {isLoading && areas.length === 0 ? (
                            <div className="p-6 text-center text-muted">Đang tải danh sách phân khu...</div>
                        ) : filteredAreas.length === 0 ? (
                            <div className="admin-card text-center p-6 text-muted">
                                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🗺️</div>
                                <strong>Không tìm thấy phân khu nào phù hợp</strong>
                                <p style={{ margin: '6px 0 12px 0', fontSize: '0.85rem' }}>
                                    Vui lòng kiểm tra lại từ khóa tìm kiếm "{areaSearchQuery}".
                                </p>
                                <button className="btn btn-sm btn-outline" onClick={() => setAreaSearchQuery('')}>
                                    Xóa tìm kiếm
                                </button>
                            </div>
                        ) : (
                            /* Container có thanh cuộn cho danh sách phân khu */
                            <div className="admin-areas-scroll-container custom-scrollbar">
                                <div className="animals-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                    {filteredAreas.map(area => (
                                        <div key={area.id || area.areaId} className="admin-card">
                                            <div className="admin-card-header" style={{ borderLeft: `4px solid ${area.color || '#15803D'}` }}>
                                                <div>
                                                    <span className="text-xs uppercase tracking-wider text-muted font-bold">Khu vực {area.code}</span>
                                                    <h4 className="font-bold text-base">{area.nameVi || area.name}</h4>
                                                </div>
                                                <span className="badge badge-success">Đạt chuẩn</span>
                                            </div>
                                            <div className="admin-card-body">
                                                <p className="text-sm text-muted mb-3" style={{ minHeight: '38px' }}>
                                                    {area.descriptionVi || area.description || "Khu vực sinh thái sở thú."}
                                                </p>
                                                <div className="admin-stat-row">
                                                    <span>Số chuồng hiện tại:</span>
                                                    <strong className="text-primary">{area.enclosures ? area.enclosures.length : (area.enclosureCount || 0)} chuồng</strong>
                                                </div>
                                                <div className="admin-stat-row">
                                                    <span>Số lượng cá thể thú:</span>
                                                    <strong>{area.animalCount ?? 0} cá thể</strong>
                                                </div>
                                                <div className="admin-stat-row">
                                                    <span>Bán kính định vị GPS:</span>
                                                    <span className="text-xs font-mono">{area.radiusMeters || 50} mét</span>
                                                </div>
                                                <div className="admin-stat-row">
                                                    <span>Tọa độ bản đồ (MapX, MapY):</span>
                                                    <code>{area.mapX != null ? Math.round(area.mapX) : 'Chưa gán'}, {area.mapY != null ? Math.round(area.mapY) : 'Chưa gán'}</code>
                                                </div>
                                                <div className="admin-stat-row">
                                                    <span>Màu nhận diện:</span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: area.color || '#15803D' }}></span>
                                                        <code>{area.color || '#15803D'}</code>
                                                    </span>
                                                </div>
                                                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => handleEditArea(area)}
                                                    >
                                                        Sửa khu
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline text-danger"
                                                        style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                        onClick={() => handleDeleteArea(area.areaId || area.id)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Area Form (Sticky on Desktop) */}
                    <div className="admin-card admin-sticky-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 className="font-bold text-base m-0">
                                {isEditingArea ? 'Cập Nhật Phân Khu Sở Thú' : 'Tạo Mới Phân Khu Sở Thú'}
                            </h3>
                            {isEditingArea && (
                                <button className="btn btn-sm btn-outline" onClick={cancelEditArea}>
                                    Hủy sửa
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleAreaSubmit}>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Mã phân khu (Code)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="VD: A, B, C, F..."
                                        required
                                        value={areaForm.code}
                                        onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Màu nhận diện bản đồ</label>
                                    <input
                                        type="color"
                                        className="form-input"
                                        style={{ height: '42px', padding: '2px' }}
                                        value={areaForm.color}
                                        onChange={(e) => setAreaForm({ ...areaForm, color: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tên phân khu (Tiếng Việt)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="VD: Khu Động Vật Ăn Thịt"
                                    required
                                    value={areaForm.nameVi}
                                    onChange={(e) => setAreaForm({ ...areaForm, nameVi: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tên phân khu (English)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="VD: Subtropical Forest Biome"
                                    value={areaForm.nameEn}
                                    onChange={(e) => setAreaForm({ ...areaForm, nameEn: e.target.value })}
                                />
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Vĩ độ tâm (Latitude)</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        className="form-input"
                                        value={areaForm.latitude}
                                        onChange={(e) => setAreaForm({ ...areaForm, latitude: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kinh độ tâm (Longitude)</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        className="form-input"
                                        value={areaForm.longitude}
                                        onChange={(e) => setAreaForm({ ...areaForm, longitude: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bán kính kích hoạt Geofencing (Mét)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={areaForm.radiusMeters}
                                    onChange={(e) => setAreaForm({ ...areaForm, radiusMeters: e.target.value })}
                                />
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Tọa độ Map X (0 - 1000)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="VD: 520"
                                        value={areaForm.mapX}
                                        onChange={(e) => setAreaForm({ ...areaForm, mapX: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tọa độ Map Y (0 - 700)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="VD: 160"
                                        value={areaForm.mapY}
                                        onChange={(e) => setAreaForm({ ...areaForm, mapY: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mô tả sinh thái phân khu</label>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Không gian cảnh quan, hào bảo vệ, thảm thực vật..."
                                    value={areaForm.descriptionVi}
                                    onChange={(e) => setAreaForm({ ...areaForm, descriptionVi: e.target.value })}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Đang lưu...' : isEditingArea ? 'Lưu Cập Nhật Phân Khu' : 'Lưu Phân Khu Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB 2: ENCLOSURES MANAGEMENT */}
            {activeTab === 'enclosures' && (
                <div>
                    {/* Filter bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="text-sm font-bold text-muted">Lọc theo phân khu:</span>
                            <select
                                className="form-select"
                                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}
                                value={selectedAreaFilter}
                                onChange={(e) => setSelectedAreaFilter(e.target.value)}
                            >
                                <option value="all">Tất cả phân khu ({enclosures.length} chuồng)</option>
                                {areas.map(a => (
                                    <option key={a.areaId || a.id} value={a.areaId || a.id}>
                                        Khu {a.code} - {a.nameVi || a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="text-xs text-muted">
                            Hiển thị {filteredEnclosures.length} / {enclosures.length} chuồng
                        </span>
                    </div>

                    <div className="ticket-page-layout">
                        {/* Enclosures List Table */}
                        <div>
                            <div className="admin-table-wrapper ticket-table-scroll custom-scrollbar">
                                <table className="admin-table" style={{ minWidth: '750px' }}>
                                    <thead>
                                        <tr>
                                            <th>Mã / Tên Chuồng Trại</th>
                                            <th>Phân khu</th>
                                            <th>Tọa độ (X, Y)</th>
                                            <th>Trạng thái</th>
                                            <th>Động vật sinh sống</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEnclosures.map(enc => {
                                            const residentAnimals = animals.filter(a => a.enclosureId === (enc.enclosureId || enc.id));
                                            return (
                                                <tr key={enc.enclosureId || enc.id}>
                                                    <td>
                                                        <div>
                                                            <strong className="text-base font-bold">{enc.name}</strong>
                                                            <div className="text-xs text-muted font-mono">{enc.code}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="chip chip-sm font-semibold">
                                                            Khu {enc.areaCode || enc.areaName}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <code className="text-xs">
                                                            {enc.mapX != null ? Math.round(enc.mapX) : 'Chưa gán'}, {enc.mapY != null ? Math.round(enc.mapY) : 'Chưa gán'}
                                                        </code>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${enc.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                                            {enc.status === 'Active' ? 'Hoạt động' : 'Bảo trì'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <span className="font-bold text-primary">{residentAnimals.length} cá thể</span>
                                                            {residentAnimals.length > 0 && (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                                                    {residentAnimals.map(a => (
                                                                        <span
                                                                            key={a.id || a.animalId}
                                                                            className="chip chip-sm"
                                                                            style={{ background: '#F1F5F9', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                            title="Bấm để chuyển chuồng cho cá thể này"
                                                                            onClick={() => {
                                                                                setMovingAnimal(a);
                                                                                setTargetEnclosureId('');
                                                                            }}
                                                                        >
                                                                            {a.nameVi || a.name} ⇄
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button
                                                                className="btn btn-sm btn-outline"
                                                                onClick={() => handleEditEnclosure(enc)}
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline text-danger"
                                                                style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                                onClick={() => handleDeleteEnclosure(enc.enclosureId || enc.id)}
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredEnclosures.length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                                                    Chưa có chuồng trại nào trong phân khu này. Hãy tạo chuồng mới ở biểu mẫu bên cạnh!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Enclosure Create/Edit Form */}
                        <div className="admin-card admin-sticky-card">
                            <h3 className="font-bold text-base mb-3">
                                {isEditingEnclosure ? 'Cập Nhật Chuồng Trại' : 'Tạo Mới Chuồng Trại (Enclosure)'}
                            </h3>
                            <form onSubmit={handleEnclosureSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Phân khu trực thuộc</label>
                                    <select
                                        className="form-select"
                                        required
                                        value={enclosureForm.areaId}
                                        onChange={(e) => setEnclosureForm({ ...enclosureForm, areaId: e.target.value })}
                                    >
                                        <option value="">-- Chọn phân khu --</option>
                                        {areas.map(a => (
                                            <option key={a.areaId || a.id} value={a.areaId || a.id}>
                                                Khu {a.code} - {a.nameVi || a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Mã chuồng</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="VD: ENC-TIG-01"
                                            value={enclosureForm.code}
                                            onChange={(e) => setEnclosureForm({ ...enclosureForm, code: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Trạng thái chuồng</label>
                                        <select
                                            className="form-select"
                                            value={enclosureForm.status}
                                            onChange={(e) => setEnclosureForm({ ...enclosureForm, status: e.target.value })}
                                        >
                                            <option value="Active">Hoạt động (Active)</option>
                                            <option value="Maintenance">Bảo trì (Maintenance)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tên chuồng trại</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="VD: Chuồng Hổ Bengal Hoàng Gia"
                                        required
                                        value={enclosureForm.name}
                                        onChange={(e) => setEnclosureForm({ ...enclosureForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Tọa độ Map X (0 - 1000)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="VD: 495"
                                            value={enclosureForm.mapX}
                                            onChange={(e) => setEnclosureForm({ ...enclosureForm, mapX: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tọa độ Map Y (0 - 700)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="VD: 115"
                                            value={enclosureForm.mapY}
                                            onChange={(e) => setEnclosureForm({ ...enclosureForm, mapY: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">URL Hình ảnh chuồng trại</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        placeholder="https://..."
                                        value={enclosureForm.imageUrl}
                                        onChange={(e) => setEnclosureForm({ ...enclosureForm, imageUrl: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Mô tả quy mô chuồng</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="3"
                                        placeholder="Diện tích khuôn viên, hào nước bảo vệ, mỏm đá tự nhiên..."
                                        value={enclosureForm.description}
                                        onChange={(e) => setEnclosureForm({ ...enclosureForm, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {isEditingEnclosure ? 'Lưu Cập Nhật Chuồng' : 'Lưu Chuồng Trại Mới'}
                                    </button>
                                    {isEditingEnclosure && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => { setIsEditingEnclosure(null); setEnclosureForm({ ...initialEnclosureForm, areaId: areas[0]?.areaId || '' }); }}
                                        >
                                            Hủy
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: MOVE ANIMAL TO ANOTHER ENCLOSURE */}
            {movingAnimal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-backdrop" onClick={() => setMovingAnimal(null)}></div>
                    <div className="modal-dialog" style={{ maxWidth: '480px' }}>
                        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="font-bold text-base" style={{ margin: 0 }}>
                                ⇄ Chuyển Chuồng Cho Động Vật
                            </h3>
                            <button className="btn btn-icon btn-sm" onClick={() => setMovingAnimal(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                                <div className="font-bold text-base text-primary">{movingAnimal.nameVi || movingAnimal.name}</div>
                                <div className="text-xs text-muted">Mã: {movingAnimal.code} • Loài: {movingAnimal.species}</div>
                                <div className="text-xs mt-1">
                                    Chuồng hiện tại: <strong>{movingAnimal.enclosureName || 'Chưa xếp chuồng'}</strong>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label font-bold">Chọn chuồng đích muốn chuyển tới:</label>
                                <select
                                    className="form-select"
                                    value={targetEnclosureId}
                                    onChange={(e) => setTargetEnclosureId(e.target.value)}
                                >
                                    <option value="">-- Gỡ khỏi chuồng (Chưa xếp chuồng) --</option>
                                    {enclosures.map(e => (
                                        <option key={e.enclosureId || e.id} value={e.enclosureId || e.id}>
                                            Khu {e.areaCode}: {e.name} ({e.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-muted mt-2">
                                ℹ️ Khi chuyển chuồng, hệ thống sẽ tự động cập nhật phân khu (Area) của động vật theo phân khu của chuồng mới.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setMovingAnimal(null)}>
                                Hủy Bỏ
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={handleConfirmMoveAnimal}>
                                Xác Nhận Chuyển Chuồng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
