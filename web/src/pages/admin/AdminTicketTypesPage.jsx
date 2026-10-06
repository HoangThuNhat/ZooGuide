import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketTypesPage() {
    const { showToast } = useApp();
    const [ticketTypes, setTicketTypes] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        price: '',
        description: ''
    });

    const loadData = async () => {
        const res = await ZooApi.getTicketTypes();
        if (res.success) setTicketTypes(res.data);
    };

    useEffect(() => {
        loadData();
    }, []);

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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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

            <div className="ticket-page-layout">
                {/* List Table */}
                <div>
                    <div className="admin-table-wrapper">
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
                                {ticketTypes.map(t => (
                                    <tr key={t.id}>
                                        <td className="font-mono font-bold">{t.code}</td>
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
                                ))}
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
                                placeholder="VD: Combo Tham Quan & Trải Nghiệm"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Giá vé (VNĐ)</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                placeholder="VD: 250000"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Quyền lợi và mô tả</label>
                            <textarea 
                                className="form-textarea" 
                                rows="3" 
                                placeholder="Bao gồm cổng chính, xe điện, audio guide..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editMode ? 'Lưu Thay Đổi' : 'Lưu Loại Vé'}
                            </button>
                            {editMode && (
                                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
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
