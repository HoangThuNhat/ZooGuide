import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketsPage() {
    const { showToast } = useApp();
    const [tickets, setTickets] = useState([]);
    const [formData, setFormData] = useState({
        ticketCode: '',
        customerName: '',
        ticketType: 'VIP Family Pass',
        validDate: new Date().toISOString().split('T')[0],
        hasAudioGuide: true
    });

    const loadData = async () => {
        const res = await ZooApi.getTickets();
        if (res.success) setTickets(res.data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!formData.customerName.trim()) return;

        const res = await ZooApi.createTicket(formData);
        if (res.success) {
            showToast("Phát hành vé tham quan mới thành công!", "success");
            setFormData({
                ticketCode: '',
                customerName: '',
                ticketType: 'VIP Family Pass',
                validDate: new Date().toISOString().split('T')[0],
                hasAudioGuide: true
            });
            loadData();
        }
    };

    const handleToggleStatus = async (ticket) => {
        const newStatus = ticket.status === 'Active' ? 'Expired' : 'Active';
        const res = await ZooApi.updateTicketStatus(ticket.ticketCode, newStatus);
        if (res.success) {
            showToast(`Đã chuyển trạng thái vé sang: ${newStatus}`, "info");
            loadData();
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
                        Danh sách vé đã phát hành, tra cứu mã vé QR/Barcode, ngày hiệu lực và quyền nghe Audio Guide.
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
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã vé</th>
                                    <th>Khách hàng</th>
                                    <th>Hạng vé</th>
                                    <th>Hạn sử dụng</th>
                                    <th>Trạng thái</th>
                                    <th>Audio Guide</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.ticketCode}>
                                        <td className="font-mono font-bold">{t.ticketCode}</td>
                                        <td><strong>{t.customerName}</strong></td>
                                        <td>{t.ticketType}</td>
                                        <td>{t.validDate}</td>
                                        <td>
                                            <span className={`badge ${t.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="chip chip-sm">{t.hasAudioGuide ? 'Có quyền' : 'Không'}</span>
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
                                required
                                placeholder="VD: Hoàng Tuấn Anh"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hạng vé tham quan</label>
                            <select 
                                className="form-select"
                                value={formData.ticketType}
                                onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                            >
                                <option value="VIP Family Pass">VIP Family Pass</option>
                                <option value="Standard Adult">Standard Adult (Người lớn)</option>
                                <option value="Standard Child">Standard Child (Trẻ em)</option>
                                <option value="Student Pass">Student Pass (Học sinh/Sinh viên)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ngày hiệu lực</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                required
                                value={formData.validDate}
                                onChange={(e) => setFormData({ ...formData, validDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                                type="checkbox" 
                                id="has-audio" 
                                checked={formData.hasAudioGuide}
                                onChange={(e) => setFormData({ ...formData, hasAudioGuide: e.target.checked })}
                            />
                            <label htmlFor="has-audio" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                                Cho phép mở khóa quyền Thuyết Minh Audio Guide
                            </label>
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
