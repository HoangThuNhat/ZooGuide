import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketSessionsPage() {
    const { showToast } = useApp();
    const [sessions, setSessions] = useState([]);

    const loadData = async () => {
        const res = await ZooApi.getTicketSessions();
        if (res.success) setSessions(res.data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRevokeSession = (sessionId) => {
        if (window.confirm(`Bạn có chắc chắn muốn kết thúc cưỡng bức phiên ${sessionId}?`)) {
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
            showToast("Đã đóng phiên tham quan của thiết bị này", "info");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Giám Sát Phiên Tham Quan (Active Visitor Sessions)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Theo dõi thiết bị của khách du lịch đang kích hoạt trong vườn thú để sử dụng Thuyết minh tự động & Bản đồ dẫn đường.
                    </p>
                </div>
                <span className="badge badge-success font-bold" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>
                    {sessions.length} phiên đang trực tuyến
                </span>
            </div>

            <div className="admin-table-wrapper ticket-table-scroll">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã Phiên (Session ID)</th>
                            <th>Mã vé quét</th>
                            <th>Họ tên khách</th>
                            <th>Gói dịch vụ</th>
                            <th>Thời điểm mở khóa</th>
                            <th>Thiết bị khách</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(s => (
                            <tr key={s.sessionId}>
                                <td className="font-mono font-bold text-primary">{s.sessionId}</td>
                                <td className="font-mono font-bold">{s.ticketCode}</td>
                                <td><strong>{s.customerName}</strong></td>
                                <td>{s.ticketType}</td>
                                <td>{s.activatedAt}</td>
                                <td className="text-xs text-muted">{s.device}</td>
                                <td>
                                    <span className="badge badge-success">Đang trực tuyến</span>
                                </td>
                                <td>
                                    <button 
                                        className="btn btn-sm btn-outline text-danger" 
                                        style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                        onClick={() => handleRevokeSession(s.sessionId)}
                                    >
                                        Đóng phiên
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 pt-3 border-t border-border text-xs text-muted">
                💡 <em>Ghi chú: Mỗi vé khi quét thành công sẽ sinh một mã `TicketSession` có thời hạn 8 tiếng, cấp quyền định vị vị trí và phát âm thanh thuyết minh tại chỗ.</em>
            </div>
        </div>
    );
}
