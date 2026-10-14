import React, { useState, useEffect, useMemo } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketsPage() {
    const { showToast } = useApp();
    const [tickets, setTickets] = useState([]);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    // Default validFrom to current time, validUntil to end of day
    const getDefaultValidFrom = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };
    
    const getDefaultValidUntil = () => {
        const now = new Date();
        now.setHours(23, 59, 0, 0);
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        ticketTypeId: '',
        customerName: '',
        validFrom: getDefaultValidFrom(),
        validUntil: getDefaultValidUntil()
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await ZooApi.getTickets();
            if (res.success) setTickets(res.data);
            const resTypes = await ZooApi.getTicketTypes();
            if (resTypes.success) setTicketTypes(resTypes.data);
        } catch (err) {
            console.error("Load tickets error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filtered tickets based on search term, status, type, and date
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            // Search filter: ticket code, ticket type name, customer name, ID
            if (searchTerm.trim()) {
                const term = searchTerm.trim().toLowerCase();
                const matchCode = (t.ticketCode || '').toLowerCase().includes(term);
                const matchType = (t.ticketType || '').toLowerCase().includes(term);
                const matchCust = (t.customerName || '').toLowerCase().includes(term);
                const matchId = String(t.id || t.ticketId || '').includes(term);
                if (!matchCode && !matchType && !matchCust && !matchId) {
                    return false;
                }
            }

            // Status filter (Active/Valid, Used, Expired, Cancelled/Locked)
            if (statusFilter !== 'all') {
                if (statusFilter === 'Active' && t.status !== 'Active') return false;
                if (statusFilter === 'Used' && t.status !== 'Used') return false;
                if (statusFilter === 'Expired' && t.status !== 'Expired') return false;
                if (statusFilter === 'Cancelled' && (t.status !== 'Cancelled' && t.status !== 'Locked')) return false;
            }

            // Ticket Type filter
            if (typeFilter !== 'all') {
                if (String(t.ticketTypeId) !== String(typeFilter) && t.ticketType !== typeFilter) {
                    return false;
                }
            }

            // Date filter (matches validFrom or validUntil date string)
            if (dateFilter) {
                const dStr = (t.validFromDate || t.validFrom || '') + ' ' + (t.validUntilDate || t.validUntil || '');
                if (!dStr.includes(dateFilter)) {
                    return false;
                }
            }

            return true;
        });
    }, [tickets, searchTerm, statusFilter, typeFilter, dateFilter]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setTypeFilter('all');
        setDateFilter('');
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        
        if (!formData.ticketTypeId) {
            showToast("Vui lòng chọn hạng vé", "error");
            return;
        }

        const vf = new Date(formData.validFrom);
        const vu = new Date(formData.validUntil);
        
        if (vu <= vf) {
            showToast("Thời gian kết thúc phải sau thời gian bắt đầu.", "error");
            return;
        }

        const res = await ZooApi.createTicket(formData);
        if (res.success) {
            showToast(`Phát hành vé thành công. Mã vé: ${res.data.ticketCode}`, "success");
            setFormData({
                ticketTypeId: '',
                customerName: '',
                validFrom: getDefaultValidFrom(),
                validUntil: getDefaultValidUntil()
            });
            loadData();
        } else {
            showToast(res.message || res.error || "Có lỗi xảy ra", "error");
        }
    };

    const handleToggleStatus = async (ticket) => {
        const newStatus = ticket.status === 'Active' ? 'Expired' : 'Active';
        const res = await ZooApi.updateTicketStatus(ticket.ticketCode, newStatus);
        if (res.success) {
            showToast(`Đã chuyển trạng thái vé sang: ${newStatus}`, "info");
            loadData();
        } else {
            showToast(res.message || "Không thể cập nhật trạng thái", "error");
        }
    };

    const handleDeleteTicket = async (ticketId, ticketCode) => {
        if (!ticketId) {
            showToast("Không tìm thấy ID vé để xóa", "error");
            return;
        }
        if (window.confirm(`Bạn có chắc chắn muốn xóa vé ${ticketCode}? Thao tác này chỉ thành công khi vé chưa liên kết phiên tham quan.`)) {
            const res = await ZooApi.deleteTicket(ticketId);
            if (res.success) {
                showToast("Đã xóa vé thành công khỏi hệ thống!", "info");
                loadData();
            } else {
                showToast(res.error || res.message || "Không thể xóa vé này", "error");
            }
        }
    };

    const activeTicketsCount = tickets.filter(t => t.status === 'Active').length;
    const expiredTicketsCount = tickets.filter(t => t.status !== 'Active').length;
    const isFilteringActive = searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter;

    return (
        <div>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Vé Tham Quan (Tickets Management)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Danh sách vé đã phát hành, tra cứu mã vé QR/Barcode, ngày hiệu lực và trạng thái phiên.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-success">Đang hoạt động: {activeTicketsCount}</span>
                    <span className="badge badge-danger">Hết hạn / Khác: {expiredTicketsCount}</span>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="admin-card" style={{ marginBottom: '20px', padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                    {/* Search Field */}
                    <div style={{ position: 'relative' }}>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            🔍 Tìm kiếm mã vé / hạng vé
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Nhập mã vé, tên loại vé, khách hàng..."
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
                            🏷️ Trạng thái vé
                        </label>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">-- Tất cả trạng thái --</option>
                            <option value="Active">Hợp lệ / Chưa sử dụng (Active)</option>
                            <option value="Used">Đã sử dụng (Used)</option>
                            <option value="Expired">Hết hạn (Expired)</option>
                            <option value="Cancelled">Đã hủy / Bị khóa (Cancelled/Locked)</option>
                        </select>
                    </div>

                    {/* Ticket Type Filter */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                            🎟️ Loại vé tham quan
                        </label>
                        <select
                            className="form-select"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">-- Tất cả loại vé --</option>
                            {ticketTypes.map(tt => (
                                <option key={tt.id} value={tt.id}>{tt.name}</option>
                            ))}
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
                                ↺ Đặt lại bộ lọc
                            </button>
                        )}
                        <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: '600', marginLeft: 'auto' }}>
                            Hiển thị: <strong>{filteredTickets.length}</strong> / {tickets.length} vé
                        </span>
                    </div>
                </div>
            </div>

            {/* Layout Grid: Table + Create Form */}
            <div className="ticket-page-layout">
                {/* Tickets Table */}
                <div>
                    <div className="admin-table-wrapper ticket-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã vé</th>
                                    <th>Hạng vé</th>
                                    <th>Bắt đầu</th>
                                    <th>Hết hạn</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.length > 0 ? (
                                    filteredTickets.map(t => (
                                        <tr key={t.ticketCode}>
                                            <td className="font-mono font-bold" style={{ color: '#0F172A' }}>{t.ticketCode}</td>
                                            <td>{t.ticketType}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{t.validFromDate}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{t.validUntilDate}</td>
                                            <td>
                                                <span className={`badge ${t.status === 'Active' ? 'badge-success' : (t.status === 'Used' ? 'badge-info' : 'badge-danger')}`}>
                                                    {t.status === 'Active' ? 'Chưa dùng (Active)' : (t.status === 'Used' ? 'Đã sử dụng' : t.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => handleToggleStatus(t)}
                                                    >
                                                        {t.status === 'Active' ? 'Đánh dấu Hết Hạn' : 'Kích hoạt lại'}
                                                    </button>
                                                    {t.id && (
                                                        <button 
                                                            className="btn btn-sm btn-outline text-danger"
                                                            style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                            onClick={() => handleDeleteTicket(t.id, t.ticketCode)}
                                                        >
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                                            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
                                            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1E293B' }}>
                                                Không tìm thấy vé nào phù hợp
                                            </div>
                                            <p style={{ margin: '4px 0 12px 0', fontSize: '0.88rem' }}>
                                                Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc trạng thái và loại vé.
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

                {/* Create Ticket Form */}
                <div className="admin-card">
                    <h3 className="font-bold text-base mb-3">Phát Hành Vé Mới</h3>
                    <form onSubmit={handleCreateTicket}>
                        <div className="form-group">
                            <label className="form-label">Tên khách hàng</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="VD: Nguyễn Văn A (Tùy chọn)"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hạng vé tham quan</label>
                            <select 
                                className="form-select"
                                required
                                value={formData.ticketTypeId}
                                onChange={(e) => setFormData({ ...formData, ticketTypeId: e.target.value })}
                            >
                                <option value="">-- Chọn loại vé --</option>
                                {ticketTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Thời gian bắt đầu (Valid From)</label>
                            <input 
                                type="datetime-local" 
                                className="form-input" 
                                required
                                value={formData.validFrom}
                                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Thời gian kết thúc (Valid Until)</label>
                            <input 
                                type="datetime-local" 
                                className="form-input" 
                                required
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
                            Phát Hành Vé Điện Tử
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
