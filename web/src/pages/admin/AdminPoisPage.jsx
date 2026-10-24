import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

const CATEGORIES = [
    { value: 'all', label: 'Tất cả phân loại' },
    { value: 'Entrance', label: 'Cổng vào (Entrance)' },
    { value: 'Landmark', label: 'Di tích & Danh thắng' },
    { value: 'Botanical', label: 'Cây di sản & Thực vật' },
    { value: 'Attraction', label: 'Cảnh quan & Hồ nước' },
    { value: 'Enclosure', label: 'Khu chuồng trại thú' },
    { value: 'Facility', label: 'Tiện ích & Dịch vụ' }
];

export default function AdminPoisPage() {
    const { showToast, supportedLanguages } = useApp();

    const [pois, setPois] = useState([]);
    const [areas, setAreas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedVerification, setSelectedVerification] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPoi, setEditingPoi] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Narration Management Modal
    const [isNarrationModalOpen, setIsNarrationModalOpen] = useState(false);
    const [selectedPoiForNarration, setSelectedPoiForNarration] = useState(null);
    const [poiNarrations, setPoiNarrations] = useState([]);
    const [isLoadingNarrations, setIsLoadingNarrations] = useState(false);
    const [narrationForm, setNarrationForm] = useState({
        poiNarrationId: null,
        languageId: '',
        title: '',
        content: '',
        status: 'Published',
        audioUrl: '',
        durationSeconds: 60,
        referenceSource: ''
    });
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [audioUploadFile, setAudioUploadFile] = useState(null);

    // Mini map for coordinate picking
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    // POI Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        category: 'Landmark',
        latitude: 10.787600,
        longitude: 106.705300,
        isActive: true,
        isCoordinateVerified: false,
        verificationSource: '',
        areaId: ''
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [poisRes, areasRes] = await Promise.all([
                ZooApi.getPois(),
                ZooApi.getAreas()
            ]);

            if (poisRes.success && poisRes.data) {
                setPois(poisRes.data);
            }
            if (areasRes.success && areasRes.data) {
                setAreas(areasRes.data);
            }
        } catch (err) {
            console.error('Error loading POIs:', err);
            showToast('Không thể tải danh sách điểm tham quan', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter POIs
    const filteredPois = pois.filter(p => {
        if (searchKeyword.trim()) {
            const q = searchKeyword.trim().toLowerCase();
            const matchName = (p.name || '').toLowerCase().includes(q);
            const matchCode = (p.code || '').toLowerCase().includes(q);
            const matchDesc = (p.description || '').toLowerCase().includes(q);
            if (!matchName && !matchCode && !matchDesc) return false;
        }

        if (selectedCategory !== 'all') {
            if ((p.category || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }

        if (selectedVerification === 'verified' && !p.isCoordinateVerified) return false;
        if (selectedVerification === 'unverified' && p.isCoordinateVerified) return false;

        if (selectedStatus === 'active' && !p.isActive) return false;
        if (selectedStatus === 'inactive' && p.isActive) return false;

        return true;
    });

    // Initialize or update Map in Modal
    useEffect(() => {
        if (!isEditModalOpen || !mapContainerRef.current) return;

        const timer = setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            const initialLat = Number(formData.latitude) || 10.787600;
            const initialLng = Number(formData.longitude) || 106.705300;

            const map = L.map(mapContainerRef.current, {
                center: [initialLat, initialLng],
                zoom: 17,
                minZoom: 15,
                maxZoom: 19
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const customIcon = L.divIcon({
                className: 'poi-picker-marker',
                html: `<div style="background:#15803D;color:#FFF;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;border:2px solid #FFF;">📍</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28]
            });

            const marker = L.marker([initialLat, initialLng], {
                icon: customIcon,
                draggable: true
            }).addTo(map);

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(pos.lat.toFixed(7)),
                    longitude: parseFloat(pos.lng.toFixed(7))
                }));
            });

            map.on('click', (e) => {
                marker.setLatLng(e.latlng);
                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(e.latlng.lat.toFixed(7)),
                    longitude: parseFloat(e.latlng.lng.toFixed(7))
                }));
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;
        }, 150);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isEditModalOpen]);

    const handleOpenCreateModal = () => {
        setEditingPoi(null);
        setFormData({
            code: `POI-${Math.floor(100 + Math.random() * 900)}`,
            name: '',
            description: '',
            category: 'Landmark',
            latitude: 10.787600,
            longitude: 106.705300,
            isActive: true,
            isCoordinateVerified: true,
            verificationSource: 'Khảo sát thực địa Saigon Zoo',
            areaId: ''
        });
        setIsEditModalOpen(true);
    };

    const handleOpenEditModal = (poi) => {
        setEditingPoi(poi);
        setFormData({
            code: poi.code || '',
            name: poi.name || '',
            description: poi.description || '',
            category: poi.category || 'Landmark',
            latitude: Number(poi.latitude) || 10.787600,
            longitude: Number(poi.longitude) || 106.705300,
            isActive: poi.isActive !== false,
            isCoordinateVerified: Boolean(poi.isCoordinateVerified),
            verificationSource: poi.verificationSource || '',
            areaId: poi.areaId || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSavePoi = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showToast('Vui lòng nhập tên điểm tham quan.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            if (editingPoi) {
                // Update
                const res = await ZooApi.updatePoi(editingPoi.poiId, {
                    name: formData.name.trim(),
                    description: formData.description?.trim(),
                    category: formData.category,
                    latitude: Number(formData.latitude),
                    longitude: Number(formData.longitude),
                    isActive: formData.isActive,
                    isCoordinateVerified: formData.isCoordinateVerified,
                    verificationSource: formData.verificationSource?.trim(),
                    areaId: formData.areaId ? Number(formData.areaId) : null
                });

                if (res.success) {
                    showToast(`Đã cập nhật điểm tham quan "${formData.name}" thành công!`, 'success');
                    setIsEditModalOpen(false);
                    loadData();
                } else {
                    showToast(res.error || 'Lỗi khi cập nhật điểm tham quan', 'error');
                }
            } else {
                // Create
                const res = await ZooApi.createPoi({
                    code: formData.code.trim().toUpperCase(),
                    name: formData.name.trim(),
                    description: formData.description?.trim(),
                    category: formData.category,
                    latitude: Number(formData.latitude),
                    longitude: Number(formData.longitude),
                    isActive: formData.isActive,
                    isCoordinateVerified: formData.isCoordinateVerified,
                    verificationSource: formData.verificationSource?.trim(),
                    areaId: formData.areaId ? Number(formData.areaId) : null
                });

                if (res.success) {
                    showToast(`Đã tạo mới điểm tham quan "${formData.name}" thành công!`, 'success');
                    setIsEditModalOpen(false);
                    loadData();
                } else {
                    showToast(res.error || 'Lỗi khi tạo mới điểm tham quan', 'error');
                }
            }
        } catch (err) {
            console.error('Save POI error:', err);
            showToast(err.message || 'Lỗi kết nối máy chủ', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (poi) => {
        const nextState = !poi.isActive;
        const res = await ZooApi.updatePoiStatus(poi.poiId, nextState);
        if (res.success) {
            showToast(`Đã ${nextState ? 'kích hoạt' : 'tạm dừng'} điểm ${poi.name}.`, 'success');
            setPois(prev => prev.map(p => p.poiId === poi.poiId ? { ...p, isActive: nextState } : p));
        } else {
            showToast(res.error || 'Không thể đổi trạng thái', 'error');
        }
    };

    const handleToggleVerification = async (poi) => {
        const nextState = !poi.isCoordinateVerified;
        const source = nextState ? (poi.verificationSource || 'Xác thực bởi Quản Trị Viên') : '';
        const res = await ZooApi.verifyPoiCoordinates(poi.poiId, nextState, source);
        if (res.success) {
            showToast(`Đã ${nextState ? 'xác thực tọa độ' : 'hủy xác thực'} cho ${poi.name}.`, 'success');
            setPois(prev => prev.map(p => p.poiId === poi.poiId ? { ...p, isCoordinateVerified: nextState, verificationSource: source } : p));
        } else {
            showToast(res.error || 'Không thể cập nhật kiểm định tọa độ', 'error');
        }
    };

    const handleDeletePoi = async (poi) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa điểm tham quan "${poi.name}" (${poi.code})? Hành động này sẽ xóa cả các bài thuyết minh liên kết.`)) {
            return;
        }

        const res = await ZooApi.deletePoi(poi.poiId);
        if (res.success) {
            showToast(`Đã xóa điểm tham quan "${poi.name}".`, 'success');
            setPois(prev => prev.filter(p => p.poiId !== poi.poiId));
        } else {
            showToast(res.error || 'Không thể xóa điểm tham quan', 'error');
        }
    };

    // --- NARRATION MANAGEMENT ---
    const handleOpenNarrations = async (poi) => {
        setSelectedPoiForNarration(poi);
        setIsNarrationModalOpen(true);
        setIsLoadingNarrations(true);
        setAudioUploadFile(null);

        const defaultLang = supportedLanguages[0]?.languageId || 1;
        setNarrationForm({
            poiNarrationId: null,
            languageId: defaultLang,
            title: `Thuyết minh: ${poi.name}`,
            content: poi.description || '',
            status: 'Published',
            audioUrl: '',
            durationSeconds: 60,
            referenceSource: 'Ban Quản Lý Thảo Cầm Viên Sài Gòn'
        });

        try {
            const res = await ZooApi.getPoiNarrations(poi.poiId);
            if (res.success) {
                setPoiNarrations(res.data);
            }
        } catch (err) {
            console.error('Error loading narrations:', err);
        } finally {
            setIsLoadingNarrations(false);
        }
    };

    const handleSelectNarrationToEdit = (narr) => {
        setNarrationForm({
            poiNarrationId: narr.poiNarrationId,
            languageId: narr.languageId,
            title: narr.title,
            content: narr.content,
            status: narr.status,
            audioUrl: narr.audioUrl || '',
            durationSeconds: narr.durationSeconds || 60,
            referenceSource: narr.referenceSource || ''
        });
        setAudioUploadFile(null);
    };

    const handleResetNarrationForm = () => {
        const defaultLang = supportedLanguages[0]?.languageId || 1;
        setNarrationForm({
            poiNarrationId: null,
            languageId: defaultLang,
            title: selectedPoiForNarration ? `Thuyết minh: ${selectedPoiForNarration.name}` : '',
            content: selectedPoiForNarration?.description || '',
            status: 'Published',
            audioUrl: '',
            durationSeconds: 60,
            referenceSource: 'Ban Quản Lý Thảo Cầm Viên Sài Gòn'
        });
        setAudioUploadFile(null);
    };

    const handleSaveNarration = async (e) => {
        e.preventDefault();
        if (!narrationForm.title.trim() || !narrationForm.content.trim()) {
            showToast('Vui lòng điền tiêu đề và nội dung thuyết minh.', 'error');
            return;
        }

        try {
            if (narrationForm.poiNarrationId) {
                // Update
                const res = await ZooApi.updatePoiNarration(selectedPoiForNarration.poiId, narrationForm.poiNarrationId, {
                    title: narrationForm.title.trim(),
                    content: narrationForm.content.trim(),
                    status: narrationForm.status,
                    audioUrl: narrationForm.audioUrl.trim(),
                    durationSeconds: Number(narrationForm.durationSeconds),
                    referenceSource: narrationForm.referenceSource.trim()
                });

                if (res.success) {
                    showToast('Đã cập nhật bài thuyết minh POI thành công!', 'success');
                    // Upload audio if a file was selected
                    if (audioUploadFile) {
                        await uploadAudio(selectedPoiForNarration.poiId, narrationForm.poiNarrationId, audioUploadFile);
                    }
                    refreshNarrations(selectedPoiForNarration.poiId);
                    handleResetNarrationForm();
                } else {
                    showToast(res.error || 'Lỗi khi cập nhật bài thuyết minh', 'error');
                }
            } else {
                // Create
                const res = await ZooApi.addPoiNarration(selectedPoiForNarration.poiId, {
                    languageId: Number(narrationForm.languageId),
                    title: narrationForm.title.trim(),
                    content: narrationForm.content.trim(),
                    status: narrationForm.status,
                    audioUrl: narrationForm.audioUrl.trim(),
                    durationSeconds: Number(narrationForm.durationSeconds),
                    referenceSource: narrationForm.referenceSource.trim()
                });

                if (res.success) {
                    showToast('Đã thêm mới bài thuyết minh POI thành công!', 'success');
                    // Upload audio if a file was selected
                    if (audioUploadFile && res.data?.poiNarrationId) {
                        await uploadAudio(selectedPoiForNarration.poiId, res.data.poiNarrationId, audioUploadFile);
                    }
                    refreshNarrations(selectedPoiForNarration.poiId);
                    handleResetNarrationForm();
                } else {
                    showToast(res.error || 'Lỗi khi thêm bài thuyết minh', 'error');
                }
            }
        } catch (err) {
            console.error('Save narration error:', err);
            showToast(err.message || 'Lỗi kết nối máy chủ', 'error');
        }
    };

    const uploadAudio = async (poiId, narrationId, file) => {
        setIsUploadingAudio(true);
        try {
            const res = await ZooApi.uploadPoiNarrationAudio(poiId, narrationId, file);
            if (res.success) {
                showToast(`Đã tải lên file âm thanh ${file.name} vào Supabase Storage!`, 'success');
            } else {
                showToast(res.error || 'Lỗi tải lên file âm thanh', 'error');
            }
        } catch (err) {
            showToast('Lỗi khi tải file âm thanh', 'error');
        } finally {
            setIsUploadingAudio(false);
            setAudioUploadFile(null);
        }
    };

    const refreshNarrations = async (poiId) => {
        const res = await ZooApi.getPoiNarrations(poiId);
        if (res.success) {
            setPoiNarrations(res.data);
            setPois(prev => prev.map(p => p.poiId === poiId ? { ...p, narrationCount: res.data.length, hasAudio: res.data.some(n => !!n.audioUrl) } : p));
        }
    };

    const handleDeleteNarration = async (narrId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài thuyết minh này?')) return;
        const res = await ZooApi.deletePoiNarration(selectedPoiForNarration.poiId, narrId);
        if (res.success) {
            showToast('Đã xóa bài thuyết minh POI.', 'success');
            refreshNarrations(selectedPoiForNarration.poiId);
            if (narrationForm.poiNarrationId === narrId) {
                handleResetNarrationForm();
            }
        } else {
            showToast(res.error || 'Không thể xóa bài thuyết minh', 'error');
        }
    };

    return (
        <div className="admin-page-container">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Quản Lý Điểm Tham Quan (POI)</h2>
                    <p className="admin-page-desc">
                        Quản lý các cổng, di tích, cây di sản, cảnh quan và chuồng thú với tọa độ GPS thực địa và thuyết minh âm thanh đa ngôn ngữ.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        className="btn btn-sm btn-outline"
                        onClick={loadData}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                    <button 
                        className="btn btn-sm btn-primary"
                        onClick={handleOpenCreateModal}
                    >
                        + Thêm Điểm Mới
                    </button>
                </div>
            </div>

            {/* Filter Card */}
            <div className="admin-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
                    <div>
                        <label className="form-label text-xs">Tìm kiếm điểm tham quan</label>
                        <input 
                            type="text"
                            className="form-input"
                            placeholder="Nhập tên, mã POI (GATE-A, ENC...)..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="form-label text-xs">Phân loại</label>
                        <select 
                            className="form-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label text-xs">Kiểm định tọa độ</label>
                        <select 
                            className="form-select"
                            value={selectedVerification}
                            onChange={(e) => setSelectedVerification(e.target.value)}
                        >
                            <option value="all">Tất cả tình trạng</option>
                            <option value="verified">Đã xác thực tọa độ WGS84</option>
                            <option value="unverified">Chưa xác thực tọa độ</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label text-xs">Trạng thái phát hành</label>
                        <select 
                            className="form-select"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang kích hoạt</option>
                            <option value="inactive">Tạm dừng / Chưa mở</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#64748B' }}>
                    <span>
                        Hiển thị <strong>{filteredPois.length}</strong> / <strong>{pois.length}</strong> điểm tham quan trong cơ sở dữ liệu.
                    </span>
                    {(searchKeyword || selectedCategory !== 'all' || selectedVerification !== 'all' || selectedStatus !== 'all') && (
                        <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                                setSearchKeyword('');
                                setSelectedCategory('all');
                                setSelectedVerification('all');
                                setSelectedStatus('all');
                            }}
                        >
                            Đặt lại bộ lọc
                        </button>
                    )}
                </div>
            </div>

            {/* POIs Table */}
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '100px' }}>Mã POI</th>
                                <th>Tên Điểm Tham Quan</th>
                                <th style={{ width: '140px' }}>Phân Loại</th>
                                <th style={{ width: '170px' }}>Tọa Độ GPS (WGS84)</th>
                                <th style={{ width: '130px' }}>Kiểm Định</th>
                                <th style={{ width: '120px' }}>Thuyết Minh</th>
                                <th style={{ width: '110px' }}>Trạng Thái</th>
                                <th style={{ width: '180px', textAlign: 'right' }}>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                        Đang tải danh sách điểm tham quan từ máy chủ...
                                    </td>
                                </tr>
                            ) : filteredPois.length > 0 ? (
                                filteredPois.map(poi => (
                                    <tr key={poi.poiId}>
                                        <td>
                                            <span className="font-mono text-xs font-bold" style={{ color: '#065F46' }}>
                                                {poi.code}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>
                                                {poi.name}
                                            </div>
                                            {poi.description && (
                                                <div style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                                                    {poi.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className="badge badge-info text-xs">
                                                {poi.category}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="font-mono text-xs" style={{ color: '#334155' }}>
                                                {Number(poi.latitude).toFixed(6)}, {Number(poi.longitude).toFixed(6)}
                                            </div>
                                        </td>
                                        <td>
                                            {poi.isCoordinateVerified ? (
                                                <span 
                                                    className="badge badge-success text-xs" 
                                                    title={poi.verificationSource || 'Đã xác thực'}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleToggleVerification(poi)}
                                                >
                                                    ✓ Đã xác thực
                                                </span>
                                            ) : (
                                                <span 
                                                    className="badge badge-warning text-xs"
                                                    title="Chưa kiểm định tọa độ thực địa"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleToggleVerification(poi)}
                                                >
                                                    ⚠ Chưa xác thực
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-outline"
                                                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                                onClick={() => handleOpenNarrations(poi)}
                                            >
                                                {poi.narrationCount > 0 ? `${poi.narrationCount} bài` : '+ Thêm'}
                                                {poi.hasAudio && <span style={{ marginLeft: '4px' }}>🎵</span>}
                                            </button>
                                        </td>
                                        <td>
                                            <button 
                                                className={`badge ${poi.isActive ? 'badge-success' : 'badge-danger'}`}
                                                style={{ cursor: 'pointer', border: 'none' }}
                                                onClick={() => handleToggleStatus(poi)}
                                                title="Bấm để bật/tắt kích hoạt"
                                            >
                                                {poi.isActive ? 'Kích hoạt' : 'Tạm dừng'}
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                <button 
                                                    className="btn btn-sm btn-outline"
                                                    style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                                                    onClick={() => handleOpenEditModal(poi)}
                                                    title="Sửa thông tin và tọa độ"
                                                >
                                                    Sửa
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline"
                                                    style={{ fontSize: '0.78rem', padding: '4px 8px', color: '#DC2626' }}
                                                    onClick={() => handleDeletePoi(poi)}
                                                    title="Xóa điểm tham quan"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                        Không tìm thấy điểm tham quan nào phù hợp với bộ lọc đã chọn.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Create or Edit POI */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => !isSaving && setIsEditModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingPoi ? `Sửa Điểm Tham Quan: ${editingPoi.name}` : 'Thêm Mới Điểm Tham Quan (POI)'}
                            </h3>
                            <button 
                                type="button"
                                className="modal-close-btn"
                                onClick={() => !isSaving && setIsEditModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSavePoi}>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="poi-input-code">Mã điểm tham quan (Unique Code) *</label>
                                    <input 
                                        type="text"
                                        id="poi-input-code"
                                        className="form-input font-mono"
                                        placeholder="VD: GATE-A, POI-HUNG, ENC-01"
                                        required
                                        disabled={Boolean(editingPoi)}
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="poi-input-category">Phân loại điểm *</label>
                                    <select 
                                        id="poi-input-category"
                                        className="form-select"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Entrance">Cổng vào (Entrance)</option>
                                        <option value="Landmark">Di tích & Danh thắng (Landmark)</option>
                                        <option value="Botanical">Cây di sản & Thực vật (Botanical)</option>
                                        <option value="Attraction">Cảnh quan & Hồ nước (Attraction)</option>
                                        <option value="Enclosure">Khu chuồng trại thú (Enclosure)</option>
                                        <option value="Facility">Tiện ích & Dịch vụ (Facility)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="poi-input-name">Tên điểm tham quan *</label>
                                <input 
                                    type="text"
                                    id="poi-input-name"
                                    className="form-input"
                                    placeholder="VD: Cổng Chính A (Lê Duẩn), Đền Thờ Vua Hùng..."
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="poi-input-desc">Mô tả giới thiệu</label>
                                <textarea 
                                    id="poi-input-desc"
                                    className="form-textarea"
                                    rows="2"
                                    placeholder="Mô tả tóm tắt về lịch sử, tiện ích hoặc đặc điểm nổi bật..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Coordinate Picker Section */}
                            <div style={{ marginTop: '16px', marginBottom: '16px', background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="form-label font-bold" style={{ margin: 0 }}>
                                        📍 Tọa Độ Địa Lý WGS84 Thực Tế (Bấm chọn trên bản đồ hoặc nhập thủ công)
                                    </label>
                                    <span className="text-xs text-muted">
                                        Lat: {formData.latitude} | Lng: {formData.longitude}
                                    </span>
                                </div>

                                <div 
                                    ref={mapContainerRef} 
                                    style={{ 
                                        height: '240px', 
                                        width: '100%', 
                                        borderRadius: '6px', 
                                        marginBottom: '12px',
                                        border: '1px solid #CBD5E1' 
                                    }} 
                                />

                                <div className="form-grid-2">
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label text-xs">Vĩ độ (Latitude WGS84) *</label>
                                        <input 
                                            type="number"
                                            step="0.0000001"
                                            className="form-input font-mono"
                                            required
                                            value={formData.latitude}
                                            onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label text-xs">Kinh độ (Longitude WGS84) *</label>
                                        <input 
                                            type="number"
                                            step="0.0000001"
                                            className="form-input font-mono"
                                            required
                                            value={formData.longitude}
                                            onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Verification & Source */}
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label text-xs">Phân khu trực thuộc (Tùy chọn)</label>
                                    <select 
                                        className="form-select"
                                        value={formData.areaId}
                                        onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                                    >
                                        <option value="">Không liên kết phân khu</option>
                                        {areas.map(a => (
                                            <option key={a.areaId || a.id} value={a.areaId || a.id}>
                                                {a.name} ({a.code || `Area ${a.areaId}`})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label text-xs">Nguồn gốc kiểm định tọa độ</label>
                                    <input 
                                        type="text"
                                        className="form-input"
                                        placeholder="VD: Khảo sát thực địa RTK GPS / OpenStreetMap Saigon Zoo"
                                        value={formData.verificationSource}
                                        onChange={e => setFormData({ ...formData, verificationSource: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                                    <input 
                                        type="checkbox"
                                        checked={formData.isCoordinateVerified}
                                        onChange={e => setFormData({ ...formData, isCoordinateVerified: e.target.checked })}
                                    />
                                    <strong>Đánh dấu tọa độ này đã được xác thực chính xác</strong>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                                    <input 
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span>Kích hoạt hiển thị cho khách tham quan</span>
                                </label>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '20px' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSaving}
                                >
                                    Hủy Bỏ
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Đang lưu...' : (editingPoi ? 'Cập Nhật Điểm' : 'Tạo Điểm Mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Manage Multilingual Narrations for POI */}
            {isNarrationModalOpen && selectedPoiForNarration && (
                <div className="modal-overlay" onClick={() => setIsNarrationModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '880px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Thuyết Minh Đa Ngôn Ngữ: {selectedPoiForNarration.name}
                                </h3>
                                <span className="text-xs text-muted">
                                    Mã POI: <strong>{selectedPoiForNarration.code}</strong> • Phân loại: <strong>{selectedPoiForNarration.category}</strong>
                                </span>
                            </div>
                            <button 
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setIsNarrationModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* List of existing narrations */}
                        <div style={{ marginBottom: '20px' }}>
                            <h4 className="font-bold text-sm mb-2" style={{ color: '#0F172A' }}>
                                Các ngôn ngữ đã xuất bản ({poiNarrations.length})
                            </h4>

                            {isLoadingNarrations ? (
                                <div className="text-center p-4 text-muted">Đang tải danh sách thuyết minh...</div>
                            ) : poiNarrations.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                                    {poiNarrations.map(narr => (
                                        <div 
                                            key={narr.poiNarrationId} 
                                            style={{
                                                padding: '12px',
                                                border: narrationForm.poiNarrationId === narr.poiNarrationId ? '2px solid #15803D' : '1px solid #E2E8F0',
                                                borderRadius: '8px',
                                                background: narrationForm.poiNarrationId === narr.poiNarrationId ? '#F0FDF4' : '#FFFFFF',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleSelectNarrationToEdit(narr)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span className="badge badge-primary text-xs">
                                                    {narr.languageName} ({narr.languageCode.toUpperCase()})
                                                </span>
                                                <span className={`badge ${narr.status === 'Published' ? 'badge-success' : 'badge-warning'} text-xs`}>
                                                    {narr.status}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E293B', marginBottom: '4px' }}>
                                                {narr.title}
                                            </div>
                                            {narr.audioUrl ? (
                                                <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span>🎵 File audio đã gắn</span>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.75rem', color: '#D97706' }}>
                                                    ⚠ Chưa có file âm thanh
                                                </div>
                                            )}
                                            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    type="button"
                                                    className="btn btn-sm btn-outline"
                                                    style={{ fontSize: '0.72rem', padding: '2px 6px', color: '#DC2626' }}
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteNarration(narr.poiNarrationId); }}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-4 text-muted" style={{ background: '#F8FAFC', borderRadius: '6px' }}>
                                    Chưa có bài thuyết minh nào cho điểm tham quan này. Hãy tạo bài thuyết minh đầu tiên bên dưới.
                                </div>
                            )}
                        </div>

                        {/* Editor Form */}
                        <form onSubmit={handleSaveNarration} style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 className="font-bold text-sm" style={{ color: '#0F172A', margin: 0 }}>
                                    {narrationForm.poiNarrationId ? 'Chỉnh Sửa Bài Thuyết Minh' : 'Soạn Thảo Bài Thuyết Minh Mới'}
                                </h4>
                                {narrationForm.poiNarrationId && (
                                    <button 
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={handleResetNarrationForm}
                                    >
                                        + Soạn ngôn ngữ khác
                                    </button>
                                )}
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="narr-input-lang">Chọn ngôn ngữ *</label>
                                    <select 
                                        id="narr-input-lang"
                                        className="form-select"
                                        disabled={Boolean(narrationForm.poiNarrationId)}
                                        value={narrationForm.languageId}
                                        onChange={e => setNarrationForm({ ...narrationForm, languageId: e.target.value })}
                                    >
                                        {supportedLanguages.map(l => (
                                            <option key={l.languageId || l.id} value={l.languageId || l.id}>
                                                {l.flagIcon || '🌐'} {l.nativeName || l.name} ({l.code.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="narr-input-status">Trạng thái phát hành *</label>
                                    <select 
                                        id="narr-input-status"
                                        className="form-select"
                                        value={narrationForm.status}
                                        onChange={e => setNarrationForm({ ...narrationForm, status: e.target.value })}
                                    >
                                        <option value="Published">Published (Phát hành công khai)</option>
                                        <option value="Draft">Draft (Bản nháp / Đang biên tập)</option>
                                        <option value="Archived">Archived (Lưu trữ)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="narr-input-title">Tiêu đề bài thuyết minh *</label>
                                <input 
                                    type="text"
                                    id="narr-input-title"
                                    className="form-input"
                                    required
                                    value={narrationForm.title}
                                    onChange={e => setNarrationForm({ ...narrationForm, title: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="narr-input-content">Nội dung thuyết minh chi tiết *</label>
                                <textarea 
                                    id="narr-input-content"
                                    className="form-textarea"
                                    rows="4"
                                    required
                                    placeholder="Soạn thảo lời bình thuyết minh âm thanh cho du khách..."
                                    value={narrationForm.content}
                                    onChange={e => setNarrationForm({ ...narrationForm, content: e.target.value })}
                                />
                            </div>

                            {/* Audio file upload and preview */}
                            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                                <label className="form-label font-bold text-xs" style={{ marginBottom: '8px' }}>
                                    🎵 File Âm Thanh Thuyết Minh (Tải lên Supabase Storage hoặc gắn URL)
                                </label>

                                <div className="form-grid-2">
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label text-xs">Tải lên file âm thanh (.mp3, .wav)</label>
                                        <input 
                                            type="file"
                                            accept="audio/*,.mp3,.wav,.m4a"
                                            className="form-input"
                                            onChange={e => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setAudioUploadFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        {audioUploadFile && (
                                            <div className="text-xs text-success mt-1">
                                                Đã chọn: {audioUploadFile.name} ({(audioUploadFile.size / 1024).toFixed(1)} KB)
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label text-xs">Hoặc đường dẫn âm thanh (Audio URL)</label>
                                        <input 
                                            type="text"
                                            className="form-input font-mono"
                                            placeholder="https://.../narration-audio/...mp3"
                                            value={narrationForm.audioUrl}
                                            onChange={e => setNarrationForm({ ...narrationForm, audioUrl: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {narrationForm.audioUrl && (
                                    <div style={{ marginTop: '12px' }}>
                                        <label className="form-label text-xs">Nghe thử âm thanh trước khi xuất bản:</label>
                                        <audio 
                                            controls 
                                            src={narrationForm.audioUrl} 
                                            style={{ width: '100%', height: '36px' }}
                                        >
                                            Trình duyệt không hỗ trợ nghe audio.
                                        </audio>
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn btn-outline"
                                    onClick={() => setIsNarrationModalOpen(false)}
                                >
                                    Đóng
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isUploadingAudio}
                                >
                                    {isUploadingAudio ? 'Đang tải lên audio...' : (narrationForm.poiNarrationId ? 'Cập Nhật Thuyết Minh' : 'Lưu & Xuất Bản')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
