import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketsPage() {
    const { showToast } = useApp();
    const [tickets, setTickets] = useState([]);
    const [ticketTypes, setTicketTypes] = useState([]);
    
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
        const res = await ZooApi.getTickets();
        if (res.success) setTickets(res.data);
        const resTypes = await ZooApi.getTicketTypes();
        if (resTypes.success) setTicketTypes(resTypes.data);
    };

    useEffect(() => {
        loadData();
    }, []);

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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Quản Lý Vé Tham Quan (Tickets Management)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Danh sách vé đã phát hành, tra cứu mã vé QR/Barcode, ngày hiệu lực.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-success">Đang hoạt động: {tickets.filter(t => t.status === 'Active').length}</span>
                    <span className="badge badge-danger">Hết hạn: {tickets.filter(t => t.status !== 'Active').length}</span>
                </div>
            </div>

            <div className="ticket-page-layout">
                {/* Tickets Table */}
                <div>
<div className="admin-table-wrapper ticket-table-scroll">                        <table className="admin-table">
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
                                {tickets.map(t => (
                                    <tr key={t.ticketCode}>
                                        <td className="font-mono font-bold">{t.ticketCode}</td>
                                        <td>{t.ticketType}</td>
                                        <td>{t.validFromDate}</td>
                                        <td>{t.validUntilDate}</td>
                                        <td>
                                            <span className={`badge ${t.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-outline"
                                                onClick={() => handleToggleStatus(t)}
                                            >
                                                {t.status === 'Active' ? 'Đánh dấu Hết Hạn' : 'Kích hoạt lại'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
                                placeholder="VD: Hoàng Tuấn Anh (Tùy chọn)"
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
