import React, { useState, useEffect, useMemo } from 'react';
import { ZooApi, API_CONFIG } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketsPage() {
    const { showToast } = useApp();

    // 2 Tab Quản lý: 'orders' (Mua vé) | 'tickets' (Danh sách vé)
    const [activeTab, setActiveTab] = useState('orders');

    // Data States
    const [tickets, setTickets] = useState([]);
    const [orders, setOrders] = useState([]);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Modal States
    const [viewingOrder, setViewingOrder] = useState(null);
    const [viewingQrTicket, setViewingQrTicket] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form State cho "Phát hành vé thủ công"
    const [createForm, setCreateForm] = useState({
        ticketTypeId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        validDays: 1,
        note: ''
    });
    const [submittingCreate, setSubmittingCreate] = useState(false);

    // Search & Filter state for Mua vé (Tab 1)
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');

    // Search & Filter state for Tickets (Tab 2)
    const [ticketSearchTerm, setTicketSearchTerm] = useState('');
    const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
    const [ticketTypeFilter, setTicketTypeFilter] = useState('all');

    // Tải dữ liệu vé và loại vé
    const loadTicketsData = async () => {
        setLoadingTickets(true);
        try {
            const res = await ZooApi.getTickets();
            if (res && res.data) setTickets(res.data);
            const resTypes = await ZooApi.getTicketTypes();
            if (resTypes && resTypes.data) {
                setTicketTypes(resTypes.data);
                if (resTypes.data.length > 0 && !createForm.ticketTypeId) {
                    setCreateForm(prev => ({ ...prev, ticketTypeId: resTypes.data[0].ticketTypeId || resTypes.data[0].id }));
                }
            }
        } catch (err) {
            console.error("Load tickets error:", err);
        } finally {
            setLoadingTickets(false);
        }
    };

    // Tải dữ liệu đơn hàng mua vé
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

    // Danh sách giao dịch mua vé đã lọc (Tab 1)
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (orderSearchTerm.trim()) {
                const term = orderSearchTerm.trim().toLowerCase();
                const matchCode = (o.orderCode || '').toLowerCase().includes(term);
                const matchName = (o.customerName || '').toLowerCase().includes(term);
                const matchPhone = (o.customerPhone || '').toLowerCase().includes(term);
                const matchEmail = (o.customerEmail || '').toLowerCase().includes(term);
                const matchRef = (o.bankTransactionRef || o.transactionReference || '').toLowerCase().includes(term);
                if (!matchCode && !matchName && !matchPhone && !matchEmail && !matchRef) return false;
            }

            if (orderPaymentFilter !== 'all') {
                if (o.paymentStatus !== orderPaymentFilter) return false;
            }

            return true;
        });
    }, [orders, orderSearchTerm, orderPaymentFilter]);

    // Danh sách vé đã lọc (Tab 2)
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
                if (ticketStatusFilter === 'Valid' && t.status !== 'Active' && t.status !== 'Valid' && t.status !== 1) return false;
                if (ticketStatusFilter === 'Used' && t.status !== 'Used' && t.status !== 2) return false;
                if (ticketStatusFilter === 'Expired' && t.status !== 'Expired' && t.status !== 3) return false;
                if (ticketStatusFilter === 'Cancelled' && t.status !== 'Cancelled' && t.status !== 4) return false;
                if (ticketStatusFilter === 'Locked' && t.status !== 'Locked' && t.status !== 5) return false;
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

    // Xử lý Cập nhật trạng thái vé (Check-in, Khóa, Mở khóa, Hủy vé)
    const handleUpdateTicketStatus = async (ticket, newStatus) => {
        const ticketCode = ticket.ticketCode;
        try {
            const res = await ZooApi.updateTicketStatus(ticketCode, newStatus);
            if (res.success) {
                const actionLabels = {
                    'Used': 'Đã check-in thành công',
                    'Locked': 'Đã tạm khóa vé',
                    'Valid': 'Đã mở khóa vé thành công',
                    'Cancelled': 'Đã hủy vé thành công'
                };
                const msg = actionLabels[newStatus] || `Cập nhật sang ${newStatus}`;
                showToast(`Vé ${ticketCode}: ${msg}`, "success");
                loadTicketsData();
                return true;
            } else {
                showToast(res.message || "Không thể cập nhật trạng thái vé", "error");
                return false;
            }
        } catch (err) {
            console.error("handleUpdateTicketStatus error:", err);
            showToast("Lỗi kết nối khi cập nhật trạng thái vé", "error");
            return false;
        }
    };

    // Xử lý Hủy vé (Vô hiệu hóa vé an toàn, không xóa cứng để bảo toàn giao dịch)
    const handleCancelTicket = async (ticket) => {
        const confirmMsg = `XÁC NHẬN HỦY VÉ:\nBạn có chắc chắn muốn hủy/vô hiệu hóa vé ${ticket.ticketCode}?\n\n- Vé sau khi hủy sẽ không thể dùng để check-in hoặc kích hoạt phiên tham quan.\n- Dữ liệu giao dịch và lịch sử tài chính vẫn được bảo toàn nguyên vẹn trên hệ thống.`;
        if (window.confirm(confirmMsg)) {
            await handleUpdateTicketStatus(ticket, 'Cancelled');
        }
    };

    // Xử lý Xóa cứng vé (Chỉ áp dụng với vé nháp chưa phát hành chính thức, chưa sử dụng và không gắn giao dịch thanh toán)
    const handleDeleteTicket = async (ticketId, ticketCode) => {
        if (!ticketId) {
            showToast("Không tìm thấy mã số định danh vé để xóa", "error");
            return;
        }
        const confirmMsg = `XÁC NHẬN XÓA VÉ:\nBạn có chắc chắn muốn xóa vé: ${ticketCode}?\n\nLƯU Ý: Vé này chưa phát hành chính thức và chưa sử dụng. Dữ liệu sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.`;
        if (window.confirm(confirmMsg)) {
            const res = await ZooApi.deleteTicket(ticketId);
            if (res.success) {
                showToast(`Đã xóa vé ${ticketCode} thành công.`, "info");
                loadTicketsData();
            } else {
                showToast(res.message || res.error || "Không thể xóa vé này vì vi phạm ràng buộc dữ liệu.", "error");
            }
        }
    };

    // Xử lý Form Phát hành vé thủ công
    const handleCreateTicketSubmit = async (e) => {
        e.preventDefault();
        if (!createForm.ticketTypeId) {
            showToast("Vui lòng chọn loại vé muốn phát hành", "warning");
            return;
        }

        setSubmittingCreate(true);
        try {
            const now = new Date();
            const validFrom = now.toISOString();
            const days = parseInt(createForm.validDays) || 1;
            const validUntilDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            const validUntil = validUntilDate.toISOString();

            const payload = {
                ticketTypeId: Number(createForm.ticketTypeId),
                customerName: createForm.customerName.trim() || 'Khách mua tại quầy',
                customerEmail: createForm.customerEmail.trim(),
                customerPhone: createForm.customerPhone.trim(),
                validFrom,
                validUntil,
                status: 1, // Valid
                note: createForm.note.trim() || 'Vé phát hành trực tiếp tại quầy'
            };

            const res = await ZooApi.createTicket(payload);
            if (res.success) {
                showToast(`Đã phát hành vé thành công. Mã vé: ${res.data?.ticketCode || 'Mới'}`, "success");
                setShowCreateModal(false);
                setCreateForm({
                    ticketTypeId: ticketTypes[0]?.ticketTypeId || ticketTypes[0]?.id || '',
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    validDays: 1,
                    note: ''
                });
                loadTicketsData();
                loadOrdersData();
            } else {
                showToast(res.message || "Không thể phát hành vé. Vui lòng kiểm tra lại thông tin.", "error");
            }
        } catch (err) {
            console.error("handleCreateTicketSubmit error:", err);
            showToast("Lỗi hệ thống khi gửi yêu cầu phát hành vé", "error");
        } finally {
            setSubmittingCreate(false);
        }
    };

    const formatCurrency = (amt) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0);
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 4px' }}>
            {/* VÙNG CỐ ĐỊNH: Tiêu đề trang & Thanh chuyển tab ghim phía trên khi cuộn */}
            <div style={{
                position: 'sticky',
                top: '-28px',
                zIndex: 30,
                background: '#F8FAFC',
                paddingTop: '8px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: '16px'
            }}>
                {/* Header: Giao diện quản trị phẳng, sạch sẽ, không chứa emoji trang trí */}
                <div className="admin-page-header" style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                                QUẢN LÝ VÉ
                            </h2>
                            <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                                Theo dõi danh sách mua vé tham quan trực tuyến VietQR và quản lý cấp phát vé điện tử Thảo Cầm Viên.
                            </p>
                        </div>

                        {/* Nút hành động phát hành vé */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowCreateModal(true);
                                    if (activeTab !== 'tickets') setActiveTab('tickets');
                                }}
                                style={{ fontWeight: 700 }}
                            >
                                + Phát hành vé mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* TAB NAVIGATION: 2 Tab điều hướng chính */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    background: '#F1F5F9',
                    padding: '5px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    maxWidth: '460px'
                }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            background: activeTab === 'orders' ? '#15803D' : 'transparent',
                            color: activeTab === 'orders' ? '#FFFFFF' : '#475569',
                            boxShadow: activeTab === 'orders' ? '0 1px 4px rgba(0, 0, 0, 0.1)' : 'none',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Mua vé ({orders.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('tickets')}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            background: activeTab === 'tickets' ? '#15803D' : 'transparent',
                            color: activeTab === 'tickets' ? '#FFFFFF' : '#475569',
                            boxShadow: activeTab === 'tickets' ? '0 1px 4px rgba(0, 0, 0, 0.1)' : 'none',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Danh sách vé ({tickets.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: MUA VÉ (DANH SÁCH ĐƠN MUA VÉ & THANH TOÁN) */}
            {activeTab === 'orders' && (
                <div>
                    {/* Thanh lọc & tìm kiếm */}
                    <div className="admin-card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '260px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Tìm mã đơn, tên khách hàng, số điện thoại, mã GD ngân hàng..."
                                    value={orderSearchTerm}
                                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ minWidth: '190px' }}>
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
                                type="button"
                                className="btn btn-outline"
                                onClick={loadOrdersData}
                                disabled={loadingOrders}
                            >
                                Làm mới
                            </button>
                        </div>
                    </div>

                    {/* Bảng Mua Vé: Cho phép cuộn dọc nội dung dài và cuộn ngang khi nhiều cột */}
                    <div
                        className="admin-table-wrapper ticket-table-scroll custom-scrollbar"
                        style={{
                            maxHeight: 'calc(100vh - 270px)',
                            minHeight: '260px',
                            overflowY: 'auto',
                            overflowX: 'auto',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                        }}
                    >
                        <table className="admin-table" style={{ minWidth: '960px', width: '100%', margin: 0 }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ background: '#F8FAFC' }}>Mã Đơn Mua Vé</th>
                                    <th style={{ background: '#F8FAFC' }}>Khách Hàng</th>
                                    <th style={{ background: '#F8FAFC' }}>Số Lượng Vé</th>
                                    <th style={{ background: '#F8FAFC' }}>Tổng Tiền</th>
                                    <th style={{ background: '#F8FAFC' }}>Trạng Thái Thanh Toán</th>
                                    <th style={{ background: '#F8FAFC' }}>Mã GD Ngân Hàng</th>
                                    <th style={{ background: '#F8FAFC' }}>Thời Gian Mua Vé</th>
                                    <th style={{ background: '#F8FAFC' }}>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingOrders ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                            Đang tải dữ liệu mua vé...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map(o => (
                                        <tr key={o.orderId || o.orderCode}>
                                            <td className="font-mono font-bold" style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                {o.orderCode}
                                                {o.paymentMethod === 'AdminDirect' && (
                                                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#0369A1', fontWeight: 600 }}>
                                                        (Quản trị viên phát hành)
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: '#0F172A' }}>{o.customerName || 'Khách vãng lai'}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                                    {o.customerPhone && <span>{o.customerPhone}</span>}
                                                    {o.customerPhone && o.customerEmail && <span> • </span>}
                                                    {o.customerEmail && <span>{o.customerEmail}</span>}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, textAlign: 'center' }}>
                                                {o.totalTickets || (o.tickets?.length || o.quantity) || 1} vé
                                            </td>
                                            <td style={{ fontWeight: 800, color: '#15803D', whiteSpace: 'nowrap' }}>
                                                {formatCurrency(o.totalAmount)}
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    o.paymentStatus === 'Paid' ? 'badge-success' : 
                                                    (o.paymentStatus === 'Pending' ? 'badge-warning' : 'badge-danger')
                                                }`}>
                                                    {o.paymentStatus === 'Paid' ? 'Đã thanh toán (Paid)' : 
                                                     (o.paymentStatus === 'Pending' ? 'Chờ thanh toán' : o.paymentStatus)}
                                                </span>
                                            </td>
                                            <td className="font-mono" style={{ fontSize: '0.82rem', color: '#475569', whiteSpace: 'nowrap' }}>
                                                {o.bankTransactionRef || o.transactionReference || '—'}
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => setViewingOrder(o)}
                                                    style={{ borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                                                >
                                                    Chi tiết vé
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                            Không có đơn mua vé nào khớp với điều kiện tìm kiếm.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: DANH SÁCH VÉ */}
            {activeTab === 'tickets' && (
                <div>
                    {/* Thanh công cụ & Bộ lọc vé */}
                    <div className="admin-card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '220px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Tìm mã vé, tên khách hàng, mã đơn..."
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
                                    <option value="Valid">Hợp lệ (Valid)</option>
                                    <option value="Used">Đã sử dụng (Used)</option>
                                    <option value="Cancelled">Đã hủy (Cancelled)</option>
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
                                type="button"
                                className="btn btn-outline"
                                onClick={loadTicketsData}
                                disabled={loadingTickets}
                            >
                                Làm mới
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setShowCreateModal(true)}
                                style={{ fontWeight: 700 }}
                            >
                                + Thêm vé
                            </button>
                        </div>
                    </div>

                    {/* Bảng Danh Sách Vé: Cho phép cuộn dọc nội dung dài và cuộn ngang khi nhiều cột */}
                    <div
                        className="admin-table-wrapper ticket-table-scroll custom-scrollbar"
                        style={{
                            maxHeight: 'calc(100vh - 270px)',
                            minHeight: '260px',
                            overflowY: 'auto',
                            overflowX: 'auto',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                        }}
                    >
                        <table className="admin-table" style={{ minWidth: '1060px', width: '100%', margin: 0 }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ background: '#F8FAFC' }}>Mã Vé Điện Tử</th>
                                    <th style={{ background: '#F8FAFC' }}>Mã Đơn Mua Vé</th>
                                    <th style={{ background: '#F8FAFC' }}>Hạng Vé</th>
                                    <th style={{ background: '#F8FAFC' }}>Khách Hàng</th>
                                    <th style={{ background: '#F8FAFC' }}>Hiệu Lực Từ</th>
                                    <th style={{ background: '#F8FAFC' }}>Hết Hạn</th>
                                    <th style={{ background: '#F8FAFC' }}>Trạng Thái Vé</th>
                                    <th style={{ background: '#F8FAFC', minWidth: '220px' }}>Hành Động Nghiệp Vụ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingTickets ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                            Đang nạp danh sách mã vé...
                                        </td>
                                    </tr>
                                ) : filteredTickets.length > 0 ? (
                                    filteredTickets.map(t => {
                                        const isValid = t.status === 'Active' || t.status === 'Valid' || t.status === 1;
                                        const isUsed = t.status === 'Used' || t.status === 2;
                                        const isExpired = t.status === 'Expired' || t.status === 3;
                                        const isCancelled = t.status === 'Cancelled' || t.status === 4;
                                        const isLocked = t.status === 'Locked' || t.status === 5;

                                        // Vé gắn với giao dịch thanh toán chính thức
                                        const isOfficialPaidTicket = Boolean(t.orderId || t.orderCode);
                                        // Vé có thể xóa cứng: chỉ khi chưa thanh toán/phát hành chính thức, chưa sử dụng
                                        const canHardDelete = !isOfficialPaidTicket && !isUsed && !isCancelled;

                                        return (
                                            <tr key={t.ticketId || t.ticketCode}>
                                                <td className="font-mono font-bold" style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                    {t.ticketCode}
                                                </td>
                                                <td className="font-mono" style={{ fontSize: '0.82rem', color: '#475569', whiteSpace: 'nowrap' }}>
                                                    {t.orderCode || '—'}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600 }}>{t.ticketTypeName || t.ticketType || 'Chuẩn'}</span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{t.customerName || '—'}</div>
                                                    {t.customerPhone && (
                                                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{t.customerPhone}</div>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                    {t.validFrom ? new Date(t.validFrom).toLocaleDateString('vi-VN') : (t.validFromDate || '—')}
                                                </td>
                                                <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                    {t.validUntil ? new Date(t.validUntil).toLocaleDateString('vi-VN') : (t.validUntilDate || '—')}
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        isValid ? 'badge-success' : 
                                                        (isUsed ? 'badge-info' : 
                                                         (isCancelled ? 'badge-secondary' :
                                                          (isLocked ? 'badge-danger' : 'badge-warning')))
                                                    }`}>
                                                        {isValid ? 'Hợp lệ' : 
                                                         (isUsed ? 'Đã sử dụng' : 
                                                          (isCancelled ? 'Đã hủy' :
                                                           (isLocked ? 'Bị khóa' : 
                                                            (isExpired ? 'Hết hạn' : t.status))))}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        {/* Xem ảnh QR vé */}
                                                        <button 
                                                            type="button"
                                                            className="btn btn-sm btn-outline"
                                                            style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                                                            onClick={() => setViewingQrTicket(t)}
                                                            title="Xem mã QR để quét hoặc in vé"
                                                        >
                                                            Xem QR
                                                        </button>

                                                        {/* Nút Check-in: Chỉ hiển thị khi vé Hợp lệ */}
                                                        {isValid && (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-sm btn-outline text-success"
                                                                style={{ borderColor: '#86EFAC', color: '#166534', fontSize: '0.78rem', padding: '4px 8px', fontWeight: 700 }}
                                                                onClick={() => handleUpdateTicketStatus(t, 'Used')}
                                                                title="Đánh dấu khách đã qua cổng soát vé"
                                                            >
                                                                Check-in
                                                            </button>
                                                        )}

                                                        {/* Nút Khóa / Mở khóa vé */}
                                                        {isValid ? (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-sm btn-outline text-warning"
                                                                style={{ borderColor: '#FDE68A', color: '#B45309', fontSize: '0.78rem', padding: '4px 8px' }}
                                                                onClick={() => handleUpdateTicketStatus(t, 'Locked')}
                                                                title="Tạm khóa vé này"
                                                            >
                                                                Khóa vé
                                                            </button>
                                                        ) : isLocked ? (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-sm btn-outline text-primary"
                                                                style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                                                                onClick={() => handleUpdateTicketStatus(t, 'Valid')}
                                                                title="Mở khóa vé"
                                                            >
                                                                Mở khóa
                                                            </button>
                                                        ) : null}

                                                        {/* Nút Hủy vé: Dành cho vé chính thức đã phát hành cần ngừng sử dụng an toàn */}
                                                        {isOfficialPaidTicket && !isUsed && !isCancelled && (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-sm btn-outline text-danger"
                                                                style={{ borderColor: '#FCA5A5', color: '#B91C1C', fontSize: '0.78rem', padding: '4px 8px' }}
                                                                onClick={() => handleCancelTicket(t)}
                                                                title="Hủy vé (Vô hiệu hóa vé để bảo toàn giao dịch tài chính)"
                                                            >
                                                                Hủy vé
                                                            </button>
                                                        )}

                                                        {/* Nút Xóa vé: Chỉ cho phép xóa khi vé chưa phát hành chính thức, chưa sử dụng */}
                                                        {canHardDelete && (t.id || t.ticketId) && (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-sm btn-outline text-danger"
                                                                style={{ borderColor: '#CBD5E1', color: '#64748B', fontSize: '0.78rem', padding: '4px 8px' }}
                                                                onClick={() => handleDeleteTicket(t.id || t.ticketId, t.ticketCode)}
                                                                title="Xóa vé nháp chưa phát hành"
                                                            >
                                                                Xóa
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                                            Không tìm thấy vé nào phù hợp với bộ lọc.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL PHÁT HÀNH VÉ THỦ CÔNG */}
            {showCreateModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 110 }}>
                    <div className="modal-backdrop" onClick={() => !submittingCreate && setShowCreateModal(false)}></div>
                    <div className="modal-dialog" style={{ maxWidth: '580px', borderRadius: '16px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                                    Phát Hành Vé Tham Quan Thủ Công (Tại Quầy)
                                </h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                                    Hệ thống tự động ghi nhận đơn quản trị (AdminDirect) và cấp mã vé có hiệu lực ngay lập tức.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-icon btn-sm"
                                onClick={() => !submittingCreate && setShowCreateModal(false)}
                                disabled={submittingCreate}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicketSubmit}>
                            <div className="modal-body" style={{ padding: '20px' }}>
                                {/* Chọn loại vé */}
                                <div className="form-group" style={{ marginBottom: '14px' }}>
                                    <label className="form-label" style={{ fontWeight: 700 }}>
                                        Loại vé tham quan <span style={{ color: '#DC2626' }}>*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        value={createForm.ticketTypeId}
                                        onChange={(e) => setCreateForm({ ...createForm, ticketTypeId: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Chọn hạng vé --</option>
                                        {ticketTypes.map(tt => (
                                            <option key={tt.ticketTypeId || tt.id} value={tt.ticketTypeId || tt.id}>
                                                {tt.name} — {formatCurrency(tt.price)} ({tt.durationMinutes ? `${Math.round(tt.durationMinutes / 60)} giờ` : '1 ngày'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Thông tin khách hàng */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>
                                            Tên khách hàng
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Khách mua tại quầy"
                                            value={createForm.customerName}
                                            onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            placeholder="0901234567"
                                            value={createForm.customerPhone}
                                            onChange={(e) => setCreateForm({ ...createForm, customerPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '14px' }}>
                                    <label className="form-label" style={{ fontWeight: 700 }}>
                                        Gmail nhận mã vé QR (Tùy chọn)
                                    </label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="khachhang@gmail.com (Hệ thống sẽ tự động gửi vé nếu có)"
                                        value={createForm.customerEmail}
                                        onChange={(e) => setCreateForm({ ...createForm, customerEmail: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>
                                            Thời hạn hiệu lực (Ngày)
                                        </label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            min="1"
                                            max="30"
                                            value={createForm.validDays}
                                            onChange={(e) => setCreateForm({ ...createForm, validDays: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700 }}>
                                            Lý do / Ghi chú cấp vé
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Vé quầy số 1, vé đối tác..."
                                            value={createForm.note}
                                            onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={submittingCreate}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submittingCreate}
                                    style={{ fontWeight: 700 }}
                                >
                                    {submittingCreate ? 'Đang phát hành...' : 'Xác nhận phát hành'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL XEM ẢNH QR VÉ */}
            {viewingQrTicket && (
                <div className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 120 }}>
                    <div className="modal-backdrop" onClick={() => setViewingQrTicket(null)}></div>
                    <div className="modal-dialog" style={{ maxWidth: '440px', borderRadius: '16px', textAlign: 'center' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                                    Mã QR Vé Tham Quan
                                </h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                                    Hạng vé: {viewingQrTicket.ticketTypeName || viewingQrTicket.ticketType || 'Vé tham quan'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-icon btn-sm"
                                onClick={() => setViewingQrTicket(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '24px 20px' }}>
                            <div style={{
                                background: '#FFFFFF',
                                padding: '16px',
                                borderRadius: '16px',
                                display: 'inline-block',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                                marginBottom: '16px'
                            }}>
                                <img
                                    src={`${API_CONFIG.BASE_URL}/tickets/${encodeURIComponent(viewingQrTicket.ticketCode)}/qr`}
                                    alt={`QR Ticket ${viewingQrTicket.ticketCode}`}
                                    style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(viewingQrTicket.ticketCode)}`;
                                    }}
                                />
                            </div>

                            <div className="font-mono font-bold" style={{ fontSize: '1.25rem', color: '#0F172A', letterSpacing: '1px', marginBottom: '8px' }}>
                                {viewingQrTicket.ticketCode}
                            </div>

                            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                                Trạng thái: <strong style={{ color: viewingQrTicket.status === 'Used' ? '#D97706' : (viewingQrTicket.status === 'Cancelled' ? '#DC2626' : '#15803D') }}>
                                    {viewingQrTicket.status || 'Valid'}
                                </strong>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    window.open(`${API_CONFIG.BASE_URL}/tickets/${encodeURIComponent(viewingQrTicket.ticketCode)}/qr`, '_blank');
                                }}
                            >
                                Mở ảnh gốc
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setViewingQrTicket(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XEM CHI TIẾT ĐƠN MUA VÉ */}
            {viewingOrder && (
                <div className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 100 }}>
                    <div className="modal-backdrop" onClick={() => setViewingOrder(null)}></div>
                    <div className="modal-dialog" style={{ maxWidth: '640px', borderRadius: '16px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                                    Chi Tiết Đơn Mua Vé: {viewingOrder.orderCode}
                                </h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                                    Trạng thái thanh toán: <strong style={{ color: viewingOrder.paymentStatus === 'Paid' ? '#15803D' : '#D97706' }}>{viewingOrder.paymentStatus}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-icon btn-sm"
                                onClick={() => setViewingOrder(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', background: '#F8FAFC', padding: '14px', borderRadius: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Khách hàng:</span>
                                    <div style={{ fontWeight: 700 }}>{viewingOrder.customerName || 'Khách vãng lai'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Liên hệ:</span>
                                    <div>{viewingOrder.customerPhone || '—'} {viewingOrder.customerEmail ? `• ${viewingOrder.customerEmail}` : ''}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Tổng tiền:</span>
                                    <div style={{ fontWeight: 800, color: '#15803D' }}>{formatCurrency(viewingOrder.totalAmount)}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Mã tham chiếu ngân hàng:</span>
                                    <div className="font-mono">{viewingOrder.bankTransactionRef || viewingOrder.transactionReference || 'Chưa có'}</div>
                                </div>
                            </div>

                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                                Danh Sách Mã Vé Thuộc Đơn Này ({viewingOrder.tickets?.length || 0}):
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
                                                <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '8px' }}>({tk.ticketTypeName || 'Vé tham quan'})</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`badge ${tk.status === 'Cancelled' ? 'badge-secondary' : 'badge-success'}`}>
                                                    {tk.status === 'Cancelled' ? 'Đã hủy' : (tk.status || 'Valid')}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline"
                                                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                                    onClick={() => {
                                                        setViewingQrTicket(tk);
                                                    }}
                                                >
                                                    Xem QR
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px' }}>
                                        {viewingOrder.paymentStatus === 'Paid' 
                                            ? 'Đang phát hành vé cho đơn hàng...' 
                                            : 'Chưa có vé nào được cấp (Đơn hàng chưa hoàn tất thanh toán).'}
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