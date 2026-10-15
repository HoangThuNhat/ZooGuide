import React, { useState, useEffect, useMemo } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketTypesPage() {
    const { showToast } = useApp();
    const [ticketTypes, setTicketTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priceRange, setPriceRange] = useState('all');
    const [sortBy, setSortBy] = useState('default');

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        price: '',
        description: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await ZooApi.getTicketTypes();
            if (res.success) setTicketTypes(res.data);
        } catch (err) {
            console.error("Load ticket types error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter & Sort logic
    const filteredTypes = useMemo(() => {
        return ticketTypes
            .filter(t => {
                // Search: Code, Name, Description
                if (searchTerm.trim()) {
                    const term = searchTerm.trim().toLowerCase();
                    const matchCode = (t.code || '').toLowerCase().includes(term);
                    const matchName = (t.name || '').toLowerCase().includes(term);
                    const matchDesc = (t.description || '').toLowerCase().includes(term);
                    if (!matchCode && !matchName && !matchDesc) {
                        return false;
                    }
                }

                // Status filter
                if (statusFilter === 'active' && t.isActive === false) return false;
                if (statusFilter === 'inactive' && t.isActive !== false) return false;

                // Price range filter
                const price = Number(t.price) || 0;
                if (priceRange === 'under100k' && price >= 100000) return false;
                if (priceRange === '100k-250k' && (price < 100000 || price > 250000)) return false;
                if (priceRange === 'above250k' && price <= 250000) return false;

                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
                if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
                if (sortBy === 'price-asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
                if (sortBy === 'price-desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
                return (a.id || 0) - (b.id || 0);
            });
    }, [ticketTypes, searchTerm, statusFilter, priceRange, sortBy]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPriceRange('all');
        setSortBy('default');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.code.trim()) return;

        const payload = {
            ...formData,
            price: Number(formData.price) || 0
        };

        if (editMode) {
            const res = await ZooApi.updateTicketType(editId, payload);
            if (res.success) {
                showToast("Cập nhật loại vé thành công!", "success");
                cancelEdit();
                loadData();
            } else {
                showToast(res.message || res.error || "Lỗi cập nhật", "error");
            }
        } else {
            const res = await ZooApi.createTicketType(payload);
            if (res.success) {
                showToast("Thêm loại vé mới thành công!", "success");
                setFormData({ code: '', name: '', price: '', description: '' });
                loadData();
            } else {
                showToast(res.message || res.error || "Lỗi tạo loại vé", "error");
            }
        }
    };

    const handleEditClick = (t) => {
        setEditMode(true);
        setEditId(t.id);
        setFormData({
            code: t.code,
            name: t.name,
            price: t.price,
            description: t.description || ''
        });
    };

    const cancelEdit = () => {
        setEditMode(false);
        setEditId(null);
        setFormData({ code: '', name: '', price: '', description: '' });
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa loại vé này? Nếu loại vé đang được sử dụng, nó sẽ bị chuyển sang trạng thái Ngừng Bán.")) {
            const res = await ZooApi.deleteTicketType(id);
            if (res.success) {
                showToast(res.message || "Đã xóa loại vé thành công!", "info");
                loadData();
            } else {
                showToast(res.error || res.message || "Không thể xóa loại vé này.", "error");
            }
        }
    };

    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const isFilteringActive = searchTerm || statusFilter !== 'all' || priceRange !== 'all' || sortBy !== 'default';

    return (
        <div>
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Loại Vé & Bảng Giá (Ticket Types & Pricing)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Thiết lập các gói vé tham quan, giá bán niêm yết và chính sách quyền lợi đi kèm.
                    </p>
                </div>
                <span className="chip font-bold">{ticketTypes.length} loại vé được bán</span>
            </div>

            {/* Search and Filters Bar */}
            <div className="admin-card" style={{ marginBottom: '20px', padding: '16px' }}>
                <div className="admin-filter-grid">
                    {/* Search Field */}
                    <div style={{ position: 'relative' }}>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            🔍 Tìm kiếm mã / tên loại vé
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Nhập mã, tên loại vé, mô tả..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingRight: searchTerm ? '30px' : '10px' }}
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

                    {/* Status Filter */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            🏷️ Trạng thái bán
                        </label>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">-- Tất cả trạng thái --</option>
                            <option value="active">Đang bán</option>
                            <option value="inactive">Ngừng bán</option>
                        </select>
                    </div>

                    {/* Price Range Filter */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            💰 Khoảng giá
                        </label>
                        <select
                            className="form-select"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                        >
                            <option value="all">-- Tất cả mức giá --</option>
                            <option value="under100k">Dưới 100.000 VNĐ</option>
                            <option value="100k-250k">100.000 - 250.000 VNĐ</option>
                            <option value="above250k">Trên 250.000 VNĐ</option>
                        </select>
                    </div>

                    {/* Sort Dropdown */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            ↕️ Sắp xếp theo
                        </label>
                        <select
                            className="form-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="default">Mặc định (Theo ID)</option>
                            <option value="name-asc">Tên: A → Z</option>
                            <option value="name-desc">Tên: Z → A</option>
                            <option value="price-asc">Giá: Thấp → Cao</option>
                            <option value="price-desc">Giá: Cao → Thấp</option>
                        </select>
                    </div>

                    {/* Filter Actions */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isFilteringActive && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleResetFilters}
                                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                            >
                                ↺ Đặt lại
                            </button>
                        )}
                        <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: '600', marginLeft: 'auto' }}>
                            Hiển thị: <strong>{filteredTypes.length}</strong> / {ticketTypes.length} loại vé
                        </span>
                    </div>
                </div>
            </div>

            {/* Layout Grid: Table + Add/Edit Form */}
            <div className="ticket-page-layout">
                {/* List Table */}
                <div>
                    <div className="admin-table-wrapper ticket-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã loại vé</th>
                                    <th>Tên hạng vé</th>
                                    <th>Giá vé niêm yết</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTypes.length > 0 ? (
                                    filteredTypes.map(t => (
                                        <tr key={t.id}>
                                            <td className="font-mono font-bold" style={{ color: '#0F172A' }}>{t.code}</td>
                                            <td>
                                                <strong>{t.name}</strong>
                                                <div className="text-xs text-muted" style={{ maxWidth: '200px' }}>{t.description}</div>
                                            </td>
                                            <td className="font-bold text-primary">{formatVND(t.price)}</td>
                                            <td>
                                                {t.isActive !== false ? 
                                                    <span className="badge badge-success">Đang bán</span> : 
                                                    <span className="badge badge-danger">Ngừng bán</span>
                                                }
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-outline mr-2" onClick={() => handleEditClick(t)}>Sửa</button>
                                                <button className="btn btn-sm btn-outline text-danger" style={{ borderColor: '#FCA5A5', color: '#DC2626' }} onClick={() => handleDeleteClick(t.id)}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                                            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
                                            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1E293B' }}>
                                                Không tìm thấy loại vé nào phù hợp
                                            </div>
                                            <p style={{ margin: '4px 0 12px 0', fontSize: '0.88rem' }}>
                                                Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh khoảng giá và trạng thái bán.
                                            </p>
                                            {isFilteringActive && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-primary"
                                                    onClick={handleResetFilters}
                                                >
                                                    ↺ Đặt lại bộ lọc
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Form */}
                <div className="admin-card">
                    <h3 className="font-bold text-base mb-3">{editMode ? 'Chỉnh Sửa Loại Vé' : 'Tạo Loại Vé Mới'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Mã hạng vé (Code)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: COMBO-2026"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                disabled={editMode}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tên hạng vé</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Vé Khám Phá Safari Cao Cấp"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Giá niêm yết (VNĐ)</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                placeholder="VD: 150000"
                                required
                                min="0"
                                step="1000"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mô tả quyền lợi</label>
                            <textarea 
                                className="form-textarea" 
                                rows="3"
                                placeholder="Bao gồm cổng chính, xe điện, audio guide..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, minWidth: '130px' }}>
                                {editMode ? 'Lưu Thay Đổi' : 'Thêm Loại Vé'}
                            </button>
                            {editMode && (
                                <button type="button" className="btn btn-secondary" onClick={cancelEdit} style={{ minWidth: '80px' }}>
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
