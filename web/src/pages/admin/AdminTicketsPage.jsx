import React, { useState, useEffect, useMemo } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketsPage() {
    const { showToast } = useApp();

    // Active View Tab: 'orders' (Đơn hàng & Giao dịch QR) | 'tickets' (Quản lý mã vé)
    const [activeTab, setActiveTab] = useState('orders');

    // Data States
    const [tickets, setTickets] = useState([]);
    const [orders, setOrders] = useState([]);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Selected order for detail modal
    const [viewingOrder, setViewingOrder] = useState(null);

    // Search & Filter state for Tickets
    const [ticketSearchTerm, setTicketSearchTerm] = useState('');
    const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
    const [ticketTypeFilter, setTicketTypeFilter] = useState('all');

    // Search & Filter state for Orders
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');

    // Load Tickets & Orders from Backend
    const loadTicketsData = async () => {
        setLoadingTickets(true);
        try {
            const res = await ZooApi.getTickets();
            if (res && res.data) setTickets(res.data);
            const resTypes = await ZooApi.getTicketTypes();
            if (resTypes && resTypes.data) setTicketTypes(resTypes.data);
        } catch (err) {
            console.error("Load tickets error:", err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const loadOrdersData = async () => {
        setLoadingOrders(true);
        try {
            const res = await ZooApi.getOrders();
            if (res && res.data) setOrders(res.data);
        } catch (err) {
            console.error("Load orders error:", err);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        loadTicketsData();
        loadOrdersData();
    }, []);

    // Filtered Tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            if (ticketSearchTerm.trim()) {
                const term = ticketSearchTerm.trim().toLowerCase();
                const matchCode = (t.ticketCode || '').toLowerCase().includes(term);
                const matchType = (t.ticketType || t.ticketTypeName || '').toLowerCase().includes(term);
                const matchCust = (t.customerName || '').toLowerCase().includes(term);
                const matchOrder = (t.orderCode || '').toLowerCase().includes(term);
                if (!matchCode && !matchType && !matchCust && !matchOrder) return false;
            }

            if (ticketStatusFilter !== 'all') {
                if (ticketStatusFilter === 'Active' && t.status !== 'Active' && t.status !== 'Valid') return false;
                if (ticketStatusFilter === 'Used' && t.status !== 'Used') return false;
                if (ticketStatusFilter === 'Expired' && t.status !== 'Expired') return false;
                if (ticketStatusFilter === 'Locked' && t.status !== 'Locked' && t.status !== 'Cancelled') return false;
            }

            if (ticketTypeFilter !== 'all') {
                const typeStr = String(ticketTypeFilter).trim().toLowerCase();
                const matchId = String(t.ticketTypeId).trim().toLowerCase() === typeStr;
                const matchName = (t.ticketTypeName || t.ticketType || '').toLowerCase() === typeStr;
                if (!matchId && !matchName) return false;
            }

            return true;
        });
    }, [tickets, ticketSearchTerm, ticketStatusFilter, ticketTypeFilter]);

    // Filtered Orders
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (orderSearchTerm.trim()) {
                const term = orderSearchTerm.trim().toLowerCase();
                const matchCode = (o.orderCode || '').toLowerCase().includes(term);
                const matchName = (o.customerName || '').toLowerCase().includes(term);
                const matchPhone = (o.customerPhone || '').toLowerCase().includes(term);
                const matchEmail = (o.customerEmail || '').toLowerCase().includes(term);
                const matchRef = (o.bankTransactionRef || '').toLowerCase().includes(term);
                if (!matchCode && !matchName && !matchPhone && !matchEmail && !matchRef) return false;
            }

            if (orderPaymentFilter !== 'all') {
                if (o.paymentStatus !== orderPaymentFilter) return false;
            }

            return true;
        });
    }, [orders, orderSearchTerm, orderPaymentFilter]);

    // Update Ticket Status (Check-in Used, Lock, Reactivate)
    const handleUpdateTicketStatus = async (ticket, newStatus) => {
        const ticketCode = ticket.ticketCode;
        const res = await ZooApi.updateTicketStatus(ticketCode, newStatus);
        if (res.success) {
            showToast(`Cập nhật trạng thái vé ${ticketCode} -> ${newStatus} thành công!`, "success");
            loadTicketsData();
        } else {
            showToast(res.message || "Không thể cập nhật trạng thái vé", "error");
        }
    };

    // Delete Ticket
    const handleDeleteTicket = async (ticketId, ticketCode) => {
        if (!ticketId) {
            showToast("Không tìm thấy ID vé để xóa", "error");
            return;
        }
        if (window.confirm(`Bạn có chắc muốn xóa mã vé ${ticketCode}?`)) {
            const res = await ZooApi.deleteTicket(ticketId);
            if (res.success) {
                showToast("Đã xóa vé thành công!", "info");
                loadTicketsData();
            } else {
                showToast(res.message || res.error || "Không thể xóa vé này", "error");
            }
        }
    };

    const formatCurrency = (amt) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0);
    };

    // Order Metrics
    const totalRevenue = orders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const paidOrdersCount = orders.filter(o => o.paymentStatus === 'Paid').length;
    const pendingOrdersCount = orders.filter(o => o.paymentStatus === 'Pending').length;

    // Ticket Metrics
    const validTicketsCount = tickets.filter(t => t.status === 'Active' || t.status === 'Valid').length;
    const usedTicketsCount = tickets.filter(t => t.status === 'Used').length;

    return (
        <div>
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Vé & Giao Dịch QR Thảo Cầm Viên
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Tách bạch Trạng thái thanh toán (PaymentStatus) và Trạng thái vé (TicketStatus). Vé chỉ được phát hành tự động qua thanh toán.
                    </p>
                </div>

                {/* Top Metrics Cards */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', padding: '8px 14px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'block' }}>DOANH THU VIETQR</span>
                        <strong style={{ fontSize: '1.05rem', color: '#15803D' }}>{formatCurrency(totalRevenue)}</strong>
                    </div>
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 14px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'block' }}>ĐƠN ĐÃ THANH TOÁN</span>
                        <strong style={{ fontSize: '1.05rem', color: '#15803D' }}>{paidOrdersCount} đơn</strong>
                    </div>
                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '8px 14px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 700, display: 'block' }}>CHỜ THANH TOÁN</span>
                        <strong style={{ fontSize: '1.05rem', color: '#D97706' }}>{pendingOrdersCount} đơn</strong>
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'block' }}>VÉ HỢP LỆ / ĐÃ DÙNG</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>{validTicketsCount} / {usedTicketsCount}</strong>
                    </div>
                </div>
            </div>

            {/* Tab Navigation: 'orders' vs 'tickets' */}
            <div style={{
                display: 'flex',
                gap: '10px',
                margin: '20px 0 16px 0',
                background: '#FFFFFF',
                padding: '6px',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                maxWidth: '560px'
            }}>
                <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                        flex: 1,
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'orders' ? '#15803D' : 'transparent',
                        color: activeTab === 'orders' ? '#FFFFFF' : '#475569',
                        transition: 'all 0.15s ease'
                    }}
                >
                    💳 Đơn Hàng & Giao Dịch QR ({orders.length})
                </button>
                <button
                    onClick={() => setActiveTab('tickets')}
                    style={{
                        flex: 1,
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'tickets' ? '#15803D' : 'transparent',
                        color: activeTab === 'tickets' ? '#FFFFFF' : '#475569',
                        transition: 'all 0.15s ease'
                    }}
                >
                    🎟️ Quản Lý Mã Vé & Check-in ({tickets.length})
                </button>
            </div>

            {/* TAB 1: DANH SÁCH ĐƠN HÀNG & GIAO DỊCH VIETQR */}
            {activeTab === 'orders' && (
                <div>
                    {/* Bộ lọc đơn hàng */}
                    <div className="admin-card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Tìm mã đơn ZG-..., tên, số điện thoại, mã tham chiếu ngân hàng..."
                                    value={orderSearchTerm}
                                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ minWidth: '180px' }}>
                                <select
                                    className="form-select"
                                    value={orderPaymentFilter}
                                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                                >
                                    <option value="all">-- Tất cả trạng thái thanh toán --</option>
                                    <option value="Paid">Đã thanh toán (Paid)</option>
                                    <option value="Pending">Chờ thanh toán (Pending)</option>
                                    <option value="Failed">Thất bại (Failed)</option>
                                    <option value="Expired">Hết hạn (Expired)</option>
                                </select>
                            </div>

                            <button
                                className="btn btn-outline"
                                onClick={loadOrdersData}
                                disabled={loadingOrders}
                            >
                                🔄 Làm mới
                            </button>
                        </div>
                    </div>

                    {/* Bảng Đơn Hàng */}
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã Đơn Hàng</th>
                                    <th>Khách Hàng</th>
                                    <th>Số Vé</th>
                                    <th>Tổng Tiền</th>
                                    <th>Trạng Thái Thanh Toán</th>
                                    <th>Mã GD Ngân Hàng</th>
                                    <th>Thời Gian Tạo</th>
                                    <th>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingOrders ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                                            ⏳ Đang tải dữ liệu đơn hàng...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map(o => (
                                        <tr key={o.orderId || o.orderCode}>
                                            <td className="font-mono font-bold" style={{ color: '#0F172A' }}>
                                                {o.orderCode}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: '#0F172A' }}>{o.customerName}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{o.customerPhone} • {o.customerEmail}</div>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>
                                                {o.totalTickets || (o.tickets?.length || o.items?.reduce((s, i) => s + i.quantity, 0)) || 1} vé
                                            </td>
                                            <td style={{ fontWeight: 800, color: '#15803D' }}>
                                                {formatCurrency(o.totalAmount)}
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    o.paymentStatus === 'Paid' ? 'badge-success' : 
                                                    (o.paymentStatus === 'Pending' ? 'badge-warning' : 'badge-danger')
                                                }`}>
                                                    {o.paymentStatus === 'Paid' ? '✓ Đã thanh toán (Paid)' : 
                                                     (o.paymentStatus === 'Pending' ? '⏳ Chờ thanh toán' : o.paymentStatus)}
                                                </span>
                                            </td>
                                            <td className="font-mono" style={{ fontSize: '0.82rem', color: '#475569' }}>
                                                {o.bankTransactionRef || '—'}
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                                                {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => setViewingOrder(o)}
                                                    style={{ borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
                                                >
                                                    👁️ Chi tiết vé
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                            Không có đơn hàng nào khớp với điều kiện tìm kiếm.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: QUẢN LÝ MÃ VÉ & TRẠNG THÁI THAM QUAN */}
            {activeTab === 'tickets' && (
                <div>
                    {/* Bộ lọc vé */}
                    <div className="admin-card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '220px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Tìm mã vé ZG-..., tên khách hàng, mã đơn..."
                                    value={ticketSearchTerm}
                                    onChange={(e) => setTicketSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ minWidth: '180px' }}>
                                <select
                                    className="form-select"
                                    value={ticketStatusFilter}
                                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                                >
                                    <option value="all">-- Tất cả trạng thái vé --</option>
                                    <option value="Active">Hợp lệ / Chưa dùng (Active/Valid)</option>
                                    <option value="Used">Đã sử dụng (Used)</option>
                                    <option value="Expired">Hết hạn (Expired)</option>
                                    <option value="Locked">Bị khóa (Locked)</option>
                                </select>
                            </div>

                            <div style={{ minWidth: '160px' }}>
                                <select
                                    className="form-select"
                                    value={ticketTypeFilter}
                                    onChange={(e) => setTicketTypeFilter(e.target.value)}
                                >
                                    <option value="all">-- Tất cả hạng vé --</option>
                                    {ticketTypes.map(tt => (
                                        <option key={tt.ticketTypeId || tt.id} value={tt.ticketTypeId || tt.id}>
                                            {tt.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className="btn btn-outline"
                                onClick={loadTicketsData}
                                disabled={loadingTickets}
                            >
                                🔄 Làm mới
                            </button>
                        </div>
                    </div>

                    {/* Bảng Mã Vé */}
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã Vé Điện Tử</th>
                                    <th>Mã Đơn Hàng</th>
                                    <th>Hạng Vé</th>
                                    <th>Khách Hàng</th>
                                    <th>Bắt Đầu</th>
                                    <th>Hết Hạn</th>
                                    <th>Trạng Thái Vé</th>
                                    <th>Hành Động Nghiệp Vụ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingTickets ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                                            ⏳ Đang nạp danh sách mã vé...
                                        </td>
                                    </tr>
                                ) : filteredTickets.length > 0 ? (
                                    filteredTickets.map(t => (
                                        <tr key={t.ticketCode}>
                                            <td className="font-mono font-bold" style={{ color: '#0F172A' }}>
                                                {t.ticketCode}
                                            </td>
                                            <td className="font-mono" style={{ fontSize: '0.82rem', color: '#475569' }}>
                                                {t.orderCode || '—'}
                                            </td>
                                            <td>{t.ticketTypeName || t.ticketType || 'Chuẩn'}</td>
                                            <td>{t.customerName || '—'}</td>
                                            <td style={{ fontSize: '0.82rem' }}>{t.validFromDate}</td>
                                            <td style={{ fontSize: '0.82rem' }}>{t.validUntilDate}</td>
                                            <td>
                                                <span className={`badge ${
                                                    (t.status === 'Active' || t.status === 'Valid') ? 'badge-success' : 
                                                    (t.status === 'Used' ? 'badge-info' : 'badge-danger')
                                                }`}>
                                                    {(t.status === 'Active' || t.status === 'Valid') ? 'Hợp lệ (Valid)' : 
                                                     (t.status === 'Used' ? 'Đã dùng (Used)' : t.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {/* Thao tác Check-in đánh dấu Đã sử dụng */}
                                                    {(t.status === 'Active' || t.status === 'Valid') && (
                                                        <button 
                                                            className="btn btn-sm btn-outline text-success"
                                                            style={{ borderColor: '#86EFAC', color: '#166534', fontSize: '0.78rem' }}
                                                            onClick={() => handleUpdateTicketStatus(t, 'Used')}
                                                            title="Đánh dấu khách đã qua cổng soát vé"
                                                        >
                                                            ✓ Check-in
                                                        </button>
                                                    )}

                                                    {/* Thao tác Khóa vé / Kích hoạt lại */}
                                                    {(t.status === 'Active' || t.status === 'Valid') ? (
                                                        <button 
                                                            className="btn btn-sm btn-outline text-warning"
                                                            style={{ borderColor: '#FDE68A', color: '#B45309', fontSize: '0.78rem' }}
                                                            onClick={() => handleUpdateTicketStatus(t, 'Locked')}
                                                            title="Tạm khóa vé này"
                                                        >
                                                            🔒 Khóa vé
                                                        </button>
                                                    ) : t.status === 'Locked' ? (
                                                        <button 
                                                            className="btn btn-sm btn-outline text-primary"
                                                            style={{ fontSize: '0.78rem' }}
                                                            onClick={() => handleUpdateTicketStatus(t, 'Valid')}
                                                        >
                                                            🔓 Mở khóa
                                                        </button>
                                                    ) : null}

                                                    {/* Xóa vé */}
                                                    {t.id && (
                                                        <button 
                                                            className="btn btn-sm btn-outline text-danger"
                                                            style={{ borderColor: '#FCA5A5', color: '#DC2626', fontSize: '0.78rem' }}
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
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                            Không tìm thấy vé nào phù hợp.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL XEM CHI TIẾT ĐƠN HÀNG & MÃ VÉ ĐÃ CẤP */}
            {viewingOrder && (
                <div className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 100 }}>
                    <div className="modal-backdrop" onClick={() => setViewingOrder(null)}></div>
                    <div className="modal-dialog" style={{ maxWidth: '640px', borderRadius: '20px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                                    Chi Tiết Đơn Hàng: {viewingOrder.orderCode}
                                </h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                                    Trạng thái thanh toán: <strong style={{ color: viewingOrder.paymentStatus === 'Paid' ? '#15803D' : '#D97706' }}>{viewingOrder.paymentStatus}</strong>
                                </p>
                            </div>
                            <button
                                className="btn btn-icon btn-sm"
                                onClick={() => setViewingOrder(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', background: '#F8FAFC', padding: '14px', borderRadius: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Khách hàng:</span>
                                    <div style={{ fontWeight: 700 }}>{viewingOrder.customerName}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Liên hệ:</span>
                                    <div>{viewingOrder.customerPhone} • {viewingOrder.customerEmail}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Tổng tiền:</span>
                                    <div style={{ fontWeight: 800, color: '#15803D' }}>{formatCurrency(viewingOrder.totalAmount)}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Mã tham chiếu ngân hàng:</span>
                                    <div className="font-mono">{viewingOrder.bankTransactionRef || 'Chưa có'}</div>
                                </div>
                            </div>

                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                                Danh Sách Mã Vé Đã Cấp Cho Đơn Này ({viewingOrder.tickets?.length || 0}):
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                {viewingOrder.tickets && viewingOrder.tickets.length > 0 ? (
                                    viewingOrder.tickets.map((tk, idx) => (
                                        <div
                                            key={tk.ticketId || idx}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 14px',
                                                background: '#F0FDF4',
                                                borderRadius: '10px',
                                                border: '1px solid #BBF7D0'
                                            }}
                                        >
                                            <div>
                                                <span className="font-mono font-bold" style={{ color: '#0F172A' }}>{tk.ticketCode}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '8px' }}>({tk.ticketTypeName || 'Vé chuẩn'})</span>
                                            </div>
                                            <span className="badge badge-success">
                                                {tk.status || 'Active'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px' }}>
                                        Chưa có vé nào được cấp (Đơn hàng chưa hoàn tất thanh toán).
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
