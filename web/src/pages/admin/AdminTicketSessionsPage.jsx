import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ZooApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

function formatSessionDateTime(utcValue, fallbackText = '—') {
    if (!utcValue) return fallbackText;
    try {
        const iso = typeof utcValue === 'string' && !utcValue.endsWith('Z') && utcValue.includes('T')
            ? `${utcValue}Z`
            : utcValue;
        const parsed = new Date(iso);
        if (Number.isNaN(parsed.getTime())) return String(utcValue);
        return parsed.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch {
        return String(utcValue);
    }
}

function getEffectiveSessionStatus(session) {
    const raw = (session?.status || '').toUpperCase();
    if (raw === 'REVOKED') return 'REVOKED';
    if (raw === 'ENDED') return 'ENDED';
    if (raw === 'EXPIRED') return 'EXPIRED';
    if (session?.isActive === false) {
        return session?.endedAt || session?.endedAtUtc ? 'ENDED' : 'EXPIRED';
    }
    if (session?.endedAtUtc || session?.endedAt) return 'ENDED';
    if (session?.expiredAtUtc) {
        const exp = new Date(session.expiredAtUtc);
        if (!Number.isNaN(exp.getTime()) && exp.getTime() <= Date.now()) {
            return 'EXPIRED';
        }
    }
    return raw === 'ACTIVE' ? 'ACTIVE' : (raw || 'ENDED');
}

export default function AdminTicketSessionsPage() {
    const { showToast } = useApp();
    const [allSessions, setAllSessions] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all'); // all | Active | Ended | Expired | Revoked
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 250);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const loadData = useCallback(async (silent = false, targetStatus = statusFilter, targetSearch = debouncedSearch) => {
        if (!silent) {
            setIsLoading(true);
            setLoadError(null);
        }
        try {
            const hasFilter = (targetStatus && targetStatus !== 'all') || Boolean(targetSearch);
            const filteredReq = ZooApi.getTicketSessions({
                status: targetStatus,
                search: targetSearch
            });

            if (hasFilter) {
                const [filteredRes, allRes] = await Promise.all([
                    filteredReq,
                    ZooApi.getTicketSessions()
                ]);
                if (filteredRes.success && Array.isArray(filteredRes.data)) {
                    setSessions(filteredRes.data);
                    if (allRes.success && Array.isArray(allRes.data)) {
                        setAllSessions(allRes.data);
                    }
                    setLoadError(null);
                    setLastUpdatedAt(new Date());
                } else {
                    const msg = filteredRes.message || filteredRes.error || 'Không thể tải danh sách phiên tham quan từ máy chủ.';
                    setLoadError(msg);
                    if (!silent) showToast(msg, 'error');
                }
            } else {
                const res = await filteredReq;
                if (res.success && Array.isArray(res.data)) {
                    setSessions(res.data);
                    setAllSessions(res.data);
                    setLoadError(null);
                    setLastUpdatedAt(new Date());
                } else {
                    const msg = res.message || res.error || 'Không thể tải danh sách phiên tham quan từ máy chủ.';
                    setLoadError(msg);
                    if (!silent) showToast(msg, 'error');
                }
            }
        } catch (err) {
            console.error('Lỗi tải phiên tham quan:', err);
            const msg = 'Lỗi kết nối khi tải danh sách phiên tham quan.';
            setLoadError(msg);
            if (!silent) showToast(msg, 'error');
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [showToast, statusFilter, debouncedSearch]);

    useEffect(() => {
        loadData(false, statusFilter, debouncedSearch);
        const timer = setInterval(() => {
            loadData(true, statusFilter, debouncedSearch);
        }, 30000);
        return () => clearInterval(timer);
    }, [loadData, statusFilter, debouncedSearch]);

    const handleRevokeSession = async (sessionId) => {
        if (!window.confirm(`Bạn có chắc chắn muốn thu hồi phiên tham quan:\n${sessionId}?`)) {
            return;
        }

        setProcessingId(sessionId);
        try {
            const res = await ZooApi.revokeTicketSession(sessionId);
            if (res.success) {
                showToast(res.message || 'Đã thu hồi phiên tham quan thành công!', 'success');
                await loadData(false, statusFilter, debouncedSearch);
            } else {
                showToast(res.message || 'Không thể thu hồi phiên tham quan', 'error');
                await loadData(true, statusFilter, debouncedSearch);
            }
        } catch (err) {
            showToast('Lỗi máy chủ khi thu hồi phiên', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (effectiveStatus) => {
        if (effectiveStatus === 'ACTIVE') return <span className="badge badge-success">Đang hoạt động</span>;
        if (effectiveStatus === 'REVOKED') return <span className="badge badge-danger">Đã thu hồi</span>;
        if (effectiveStatus === 'EXPIRED') return <span className="badge badge-warning">Hết hạn</span>;
        if (effectiveStatus === 'ENDED') return <span className="badge badge-info">Đã kết thúc</span>;
        return <span className="badge badge-info">{effectiveStatus || 'Đã kết thúc'}</span>;
    };

    const normalizedAllSessions = useMemo(() => {
        return allSessions.map(s => ({
            ...s,
            effectiveStatus: getEffectiveSessionStatus(s)
        }));
    }, [allSessions]);

    const summary = useMemo(() => {
        let active = 0;
        let ended = 0;
        let expired = 0;
        let revoked = 0;
        for (const s of normalizedAllSessions) {
            if (s.effectiveStatus === 'ACTIVE') active++;
            else if (s.effectiveStatus === 'ENDED') ended++;
            else if (s.effectiveStatus === 'EXPIRED') expired++;
            else if (s.effectiveStatus === 'REVOKED') revoked++;
        }
        return {
            total: normalizedAllSessions.length,
            active,
            ended,
            expired,
            revoked
        };
    }, [normalizedAllSessions]);

    const filteredSessions = useMemo(() => {
        return sessions.map(s => ({
            ...s,
            effectiveStatus: getEffectiveSessionStatus(s)
        }));
    }, [sessions]);

    const filterTabs = [
        { id: 'all', label: `Tất cả (${summary.total})` },
        { id: 'Active', label: `Đang hoạt động (${summary.active})` },
        { id: 'Ended', label: `Đã kết thúc (${summary.ended})` },
        { id: 'Expired', label: `Hết hạn (${summary.expired})` },
        { id: 'Revoked', label: `Đã thu hồi (${summary.revoked})` }
    ];

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                        Giám Sát Phiên Tham Quan (Ticket Sessions Monitor)
                    </h2>
                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                        Theo dõi danh sách phiên vé tham quan (TicketSession) đã kích hoạt. Phiên đang hoạt động là phiên có trạng thái Active, chưa kết thúc và chưa vượt quá thời điểm hết hạn.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {lastUpdatedAt && (
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            Cập nhật: {lastUpdatedAt.toLocaleTimeString('vi-VN')}
                        </span>
                    )}
                    <Link to="/admin" className="btn btn-sm btn-outline">
                        Xem thiết bị trực tuyến →
                    </Link>
                    <button className="btn btn-sm btn-outline" onClick={() => loadData(false)} disabled={isLoading}>
                        {isLoading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                    <span className="badge badge-success font-bold" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>
                        {summary.active} phiên đang hoạt động
                    </span>
                </div>
            </div>

            {/* Thẻ thống kê nhanh theo đúng từng trạng thái phiên */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #15803D', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Phiên đang hoạt động</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#15803D', marginTop: '4px' }}>{summary.active}</div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #0284C7', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Đã kết thúc (Khách thoát)</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{summary.ended}</div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #D97706', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Hết hạn (Expired)</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>{summary.expired}</div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #DC2626', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Đã thu hồi (Revoked)</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>{summary.revoked}</div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #475569', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Tổng số phiên</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{summary.total}</div>
                </div>
            </div>

            {loadError && (
                <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    color: '#991B1B',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{loadError}</span>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => loadData(false)}>
                        Thử lại
                    </button>
                </div>
            )}

            {/* Thanh tìm kiếm & lọc trạng thái */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '14px'
            }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`btn btn-sm ${statusFilter === tab.id ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setStatusFilter(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo mã phiên, mã vé, họ tên khách..."
                        style={{
                            minWidth: '260px',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.85rem'
                        }}
                    />
                    {(statusFilter !== 'all' || searchTerm.trim() !== '') && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                                setStatusFilter('all');
                                setSearchTerm('');
                            }}
                        >
                            Xóa bộ lọc
                        </button>
                    )}
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
                            <th>Kết thúc lúc</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && filteredSessions.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center p-6 text-muted">
                                    Đang tải dữ liệu phiên tham quan từ máy chủ...
                                </td>
                            </tr>
                        ) : filteredSessions.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center p-6 text-muted">
                                    {allSessions.length === 0
                                        ? 'Hiện chưa có phiên tham quan nào được kích hoạt.'
                                        : 'Không có phiên tham quan nào khớp với bộ lọc hiện tại.'}
                                </td>
                            </tr>
                        ) : (
                            filteredSessions.map(s => {
                                const isActionable = s.effectiveStatus === 'ACTIVE';
                                const isBusy = processingId === s.sessionId;
                                return (
                                    <tr key={s.sessionId}>
                                        <td className="font-mono font-bold text-primary" style={{ fontSize: '0.8rem' }}>
                                            {s.sessionId}
                                        </td>
                                        <td className="font-mono font-bold">{s.ticketCode}</td>
                                        <td>
                                            <strong>{s.customerName || 'Khách tham quan'}</strong>
                                            {s.isInternalUser && (
                                                <span
                                                    className="badge badge-info"
                                                    style={{ marginLeft: '6px', fontSize: '0.68rem', padding: '2px 6px' }}
                                                >
                                                    Nội bộ
                                                </span>
                                            )}
                                        </td>
                                        <td>{s.ticketType || 'Vé tiêu chuẩn'}</td>
                                        <td className="text-xs text-muted">{formatSessionDateTime(s.startedAtUtc || s.activatedAt, '—')}</td>
                                        <td className="text-xs text-muted">{formatSessionDateTime(s.expiredAtUtc || s.expiresAt, '—')}</td>
                                        <td className="text-xs text-muted">{formatSessionDateTime(s.endedAtUtc || s.endedAt, '—')}</td>
                                        <td>
                                            {getStatusBadge(s.effectiveStatus)}
                                        </td>
                                        <td>
                                            {isActionable ? (
                                                <button
                                                    className="btn btn-sm btn-outline text-danger"
                                                    style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                                                    onClick={() => handleRevokeSession(s.sessionId)}
                                                    disabled={isBusy}
                                                >
                                                    {isBusy ? 'Đang xử lý...' : 'Thu hồi phiên'}
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
                <em>
                    Ghi chú: <strong>Phiên tham quan (TicketSession)</strong> được tạo khi khách quét/kích hoạt vé hợp lệ và độc lập với chỉ số <strong>Thiết bị đang hoạt động (Active Devices)</strong>. Một thiết bị chưa quét vé có thể có 0 phiên; ngược lại một thiết bị hoặc nhóm khách dùng chung trình duyệt có thể kích hoạt nhiều vé khác nhau tương ứng nhiều phiên hợp lệ.
                </em>
            </div>
        </div>
    );
}
