import React, { useState, useEffect, useMemo } from 'react';
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
    const [isLoading, setIsLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    // Search, Filter, Sort & Pagination state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState('8');

    const initialForm = {
        nameVi: '',
        nameEn: '',
        conservationStatus: 'LC - Ít quan tâm',
        description: '',
        imageUrl: ''
    };

    const [formData, setFormData] = useState(initialForm);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await ZooApi.getSpecies();
            if (res.success) setSpeciesList(res.data);
        } catch (err) {
            console.error("Load species error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy, pageSize]);

    // Filtered & Sorted species
    const filteredSpecies = useMemo(() => {
        let result = speciesList.filter(s => {
            // Search filter: Tên tiếng Việt, Tên tiếng Anh / khoa học, Mô tả
            if (searchTerm.trim()) {
                const term = searchTerm.trim().toLowerCase();
                const matchVi = (s.nameVi || '').toLowerCase().includes(term);
                const matchEn = (s.nameEn || '').toLowerCase().includes(term);
                const matchDesc = (s.description || '').toLowerCase().includes(term);
                if (!matchVi && !matchEn && !matchDesc) {
                    return false;
                }
            }

            // Conservation status filter (IUCN)
            if (statusFilter !== 'all') {
                const normStatus = normalizeConservationStatus(s.conservationStatus);
                const targetNorm = normalizeConservationStatus(statusFilter);
                if (normStatus !== targetNorm && !(s.conservationStatus || '').toLowerCase().includes(statusFilter.toLowerCase())) {
                    return false;
                }
            }

            return true;
        });

        // Sorting
        const iucnRank = {
            'EX - Tuyệt chủng': 9,
            'EW - Tuyệt chủng trong tự nhiên': 8,
            'CR - Cực kỳ nguy cấp': 7,
            'EN - Nguy cấp': 6,
            'VU - Sắp nguy cấp': 5,
            'NT - Sắp bị đe dọa': 4,
            'LC - Ít quan tâm': 2,
            'DD - Thiếu dữ liệu': 3,
            'NE - Chưa được đánh giá': 1
        };

        result.sort((a, b) => {
            if (sortBy === 'name-asc') return (a.nameVi || '').localeCompare(b.nameVi || '', 'vi');
            if (sortBy === 'name-desc') return (b.nameVi || '').localeCompare(a.nameVi || '', 'vi');
            if (sortBy === 'iucn-desc') {
                const rankA = iucnRank[normalizeConservationStatus(a.conservationStatus)] ?? 0;
                const rankB = iucnRank[normalizeConservationStatus(b.conservationStatus)] ?? 0;
                return rankB - rankA;
            }
            return (a.id || 0) - (b.id || 0);
        });

        return result;
    }, [speciesList, searchTerm, statusFilter, sortBy]);

    // Pagination calculations
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredSpecies.length / Number(pageSize)) || 1;
    const paginatedSpecies = useMemo(() => {
        if (pageSize === 'all') return filteredSpecies;
        const size = Number(pageSize);
        const startIndex = (currentPage - 1) * size;
        return filteredSpecies.slice(startIndex, startIndex + size);
    }, [filteredSpecies, currentPage, pageSize]);

    const isFilteringActive = searchTerm.trim() !== '' || statusFilter !== 'all' || sortBy !== 'default';

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortBy('default');
        setCurrentPage(1);
    };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Phân Loại Loài (Species Management)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Quản lý các bộ, họ và chi động vật được bảo tồn trong hệ thống vườn thú ZooGuide kết nối Supabase.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="chip font-bold">{speciesList.length} loài sinh thái</span>
                    <button 
                        className="btn btn-sm btn-outline" 
                        onClick={loadData}
                        disabled={isLoading}
                        title="Làm mới dữ liệu từ máy chủ"
                    >
                        {isLoading ? "..." : "🔄 Làm mới"}
                    </button>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="admin-card" style={{ marginBottom: '20px', padding: '16px' }}>
                <div className="admin-filter-grid">
                    {/* Search Field */}
                    <div style={{ position: 'relative' }}>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            🔍 Tìm kiếm theo tên loại
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Nhập tên loài, tên khoa học..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingRight: searchTerm ? '30px' : '10px', width: '100%' }}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        padding: '2px'
                                    }}
                                    title="Xóa tìm kiếm"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Conservation Status Filter (IUCN) */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            🛡️ Tình trạng bảo tồn (IUCN)
                        </label>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="all">-- Tất cả tình trạng bảo tồn --</option>
                            {IUCN_STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            ↕️ Sắp xếp danh sách
                        </label>
                        <select
                            className="form-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="default">Mặc định (Theo ID)</option>
                            <option value="name-asc">Tên loài: A → Z</option>
                            <option value="name-desc">Tên loài: Z → A</option>
                            <option value="iucn-desc">Mức độ nguy cấp cao nhất</option>
                        </select>
                    </div>

                    {/* Filter Actions */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {isFilteringActive && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleResetFilters}
                                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                            >
                                ↺ Xóa bộ lọc
                            </button>
                        )}
                        <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: '600', marginLeft: isFilteringActive ? '0' : 'auto' }}>
                            Hiển thị: <strong>{filteredSpecies.length}</strong> / {speciesList.length} loài sinh thái
                        </span>
                    </div>
                </div>
            </div>

            <div className="ticket-page-layout">
                {/* List Table */}
                <div>
                    <div className="admin-table-wrapper ticket-table-scroll">
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
                                {paginatedSpecies.length > 0 ? (
                                    paginatedSpecies.map(s => (
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                                            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
                                            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1E293B' }}>
                                                Không tìm thấy loài sinh thái nào phù hợp
                                            </div>
                                            <p style={{ margin: '4px 0 12px 0', fontSize: '0.88rem' }}>
                                                Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc tình trạng bảo tồn.
                                            </p>
                                            {isFilteringActive && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-primary"
                                                    onClick={handleResetFilters}
                                                >
                                                    ↺ Xóa bộ lọc
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#64748B' }}>Số bản ghi mỗi trang:</span>
                            <select
                                className="form-select"
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value)}
                                style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto' }}
                            >
                                <option value="5">5</option>
                                <option value="8">8</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="all">Tất cả</option>
                            </select>
                        </div>

                        {pageSize !== 'all' && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(1)}
                                    title="Trang đầu"
                                    style={{ padding: '4px 8px' }}
                                >
                                    «
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    style={{ padding: '4px 8px' }}
                                >
                                    ‹ Trước
                                </button>
                                <span style={{ margin: '0 6px', fontWeight: '600', color: '#1E293B' }}>
                                    Trang {currentPage} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    style={{ padding: '4px 8px' }}
                                >
                                    Sau ›
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    title="Trang cuối"
                                    style={{ padding: '4px 8px' }}
                                >
                                    »
                                </button>
                            </div>
                        )}
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
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, minWidth: '140px' }}>
                                {editMode ? 'Cập Nhật Phân Loại Loài' : 'Lưu Phân Loại Loài'}
                            </button>
                            {editMode && (
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleCancelEdit}
                                    style={{ minWidth: '80px' }}
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
