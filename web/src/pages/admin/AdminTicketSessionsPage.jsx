import React, { useState, useEffect } from 'react';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminTicketSessionsPage() {
    const { showToast } = useApp();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await ZooApi.getTicketSessions();
            if (res.success) {
                setSessions(res.data);
            } else {
                showToast(res.message || "Không thể tải danh sách phiên tham quan", "error");
            }
        } catch (err) {
            console.error("Lỗi tải phiên tham quan:", err);
            showToast("Lỗi kết nối khi tải phiên tham quan", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRevokeSession = async (sessionId) => {
        if (!window.confirm(`Bạn có chắc chắn muốn kết thúc cưỡng bức phiên tham quan:\n${sessionId}?`)) {
            return;
        }

        setProcessingId(sessionId);
        try {
            const res = await ZooApi.revokeTicketSession(sessionId);
            if (res.success) {
                showToast(res.message || "Đã thu hồi phiên tham quan thành công!", "success");
                loadData();
            } else {
                showToast(res.message || "Không thể thu hồi phiên tham quan", "error");
            }
        } catch (err) {
            showToast("Lỗi máy chủ khi thu hồi phiên", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'ACTIVE') return <span className="badge badge-success">Trực tuyến</span>;
        if (s === 'REVOKED') return <span className="badge badge-danger">Đã thu hồi</span>;
        if (s === 'EXPIRED') return <span className="badge badge-warning">Hết hạn</span>;
        return <span className="badge badge-info">{status || 'Kết thúc'}</span>;
    };

    const activeCount = sessions.filter(s => (s.status || '').toUpperCase() === 'ACTIVE').length;

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Giám Sát Phiên Tham Quan (Ticket Sessions Monitor)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Theo dõi thiết bị của khách du lịch đang kích hoạt trong vườn thú để sử dụng Thuyết minh tự động & Bản đồ dẫn đường.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-outline" onClick={loadData} disabled={isLoading}>
                        {isLoading ? "Đang tải..." : "🔄 Làm mới"}
                    </button>
                    <span className="badge badge-success font-bold" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>
                        {activeCount} phiên trực tuyến
                    </span>
                </div>
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
                            <th>Thời điểm hết hạn</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && sessions.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center p-6 text-muted">
                                    Đang tải dữ liệu phiên tham quan từ máy chủ...
                                </td>
                            </tr>
                        ) : sessions.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center p-6 text-muted">
                                    Hiện chưa có phiên tham quan nào được kích hoạt.
                                </td>
                            </tr>
                        ) : (
                            sessions.map(s => {
                                const isActionable = (s.status || '').toUpperCase() === 'ACTIVE';
                                const isBusy = processingId === s.sessionId;
                                return (
                                    <tr key={s.sessionId}>
                                        <td className="font-mono font-bold text-primary" style={{ fontSize: '0.8rem' }}>
                                            {s.sessionId}
                                        </td>
                                        <td className="font-mono font-bold">{s.ticketCode}</td>
                                        <td><strong>{s.customerName || "Khách tham quan"}</strong></td>
                                        <td>{s.ticketType || "Vé tiêu chuẩn"}</td>
                                        <td className="text-xs text-muted">{s.activatedAt}</td>
                                        <td className="text-xs text-muted">{s.expiresAt || "8 giờ kể từ quét"}</td>
                                        <td>
                                            {getStatusBadge(s.status)}
                                        </td>
                                        <td>
                                            {isActionable ? (
                                                <button 
                                                    className="btn btn-sm btn-outline text-danger" 
                                                    style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                    onClick={() => handleRevokeSession(s.sessionId)}
                                                    disabled={isBusy}
                                                >
                                                    {isBusy ? "Đang xử lý..." : "Đóng phiên"}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-muted">Đã đóng</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 pt-3 border-t border-border text-xs text-muted">
                💡 <em>Ghi chú: Mỗi vé khi quét thành công sẽ sinh một mã `TicketSession` lưu trong cơ sở dữ liệu Supabase, cấp quyền định vị vị trí và phát âm thanh thuyết minh tại chỗ.</em>
            </div>
        </div>
    );
}
