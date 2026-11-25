import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi, API_CONFIG } from '../../services/api';

export default function ElectronicTicketModal() {
    const {
        isElectronicTicketModalOpen,
        setIsElectronicTicketModalOpen,
        selectedTicketForPass,
        setSelectedTicketForPass,
        currentSession,
        hasActiveSession,
        clearSession,
        setIsTicketModalOpen,
        showToast
    } = useApp();

    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (!isElectronicTicketModalOpen) return undefined;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsElectronicTicketModalOpen(false);
                if (setSelectedTicketForPass) setSelectedTicketForPass(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isElectronicTicketModalOpen, setIsElectronicTicketModalOpen, setSelectedTicketForPass]);

    if (!isElectronicTicketModalOpen) return null;

    // Xác định thông tin vé thực tế để hiển thị
    // Ưu tiên: vé được chọn cụ thể -> phiên hiện tại -> đơn mua gần nhất trong sessionStorage
    let ticketCode = '';
    let customerName = 'Khách tham quan';
    let ticketType = 'Vé tham quan điện tử';
    let validUntil = '';
    let sessionId = null;
    let isActiveSession = false;

    if (selectedTicketForPass) {
        ticketCode = selectedTicketForPass.ticketCode || '';
        customerName = selectedTicketForPass.customerName || 'Khách tham quan';
        ticketType = selectedTicketForPass.ticketTypeName || selectedTicketForPass.ticketType || 'Vé tham quan điện tử';
        validUntil = selectedTicketForPass.validUntil || selectedTicketForPass.validUntilDate || '';
        sessionId = selectedTicketForPass.sessionId || (currentSession?.sessionId ? currentSession.sessionId : null);
        isActiveSession = Boolean(sessionId || hasActiveSession || currentSession);
    } else if (currentSession) {
        ticketCode = currentSession.ticketCode || '';
        customerName = currentSession.customerName || 'Khách tham quan';
        ticketType = currentSession.ticketType || 'Vé tham quan điện tử';
        validUntil = currentSession.expiresAt || currentSession.validDate || '';
        sessionId = currentSession.sessionId || null;
        isActiveSession = Boolean(sessionId);
    } else {
        // Thử tìm vé vừa mua trong sessionStorage
        try {
            const rawOrder = sessionStorage.getItem('zooguide_pending_ticket_order') || sessionStorage.getItem('zooguide_pending_order');
            if (rawOrder) {
                const parsedOrder = JSON.parse(rawOrder);
                const tks = parsedOrder.issuedTickets || parsedOrder.tickets || [];
                if (tks.length > 0) {
                    const tk = tks[0];
                    ticketCode = tk.ticketCode || '';
                    customerName = parsedOrder.customerName || 'Khách tham quan';
                    ticketType = tk.ticketTypeName || parsedOrder.ticketType?.name || 'Vé tham quan điện tử';
                    validUntil = tk.validUntil || '';
                }
            }
        } catch (e) {
            console.warn('Cannot read cached order for ticket pass:', e);
        }
    }

    // Nếu thiết bị đang có phiên tham quan hoạt động, luôn liên kết sessionId để cho phép thoát phiên
    if (!sessionId && currentSession?.sessionId) {
        sessionId = currentSession.sessionId;
        isActiveSession = true;
    }

    const handleClose = () => {
        setIsElectronicTicketModalOpen(false);
        if (setSelectedTicketForPass) setSelectedTicketForPass(null);
    };

    // Xử lý nút Thoát phiên tham quan nằm bên trong modal thẻ điện tử
    const handleExitSession = async () => {
        const targetSessionId = sessionId || currentSession?.sessionId;
        if (!targetSessionId) {
            showToast("Không tìm thấy mã phiên tham quan để kết thúc.", "error");
            return;
        }

        // 1. Hiển thị hộp thoại xác nhận đúng yêu cầu
        const confirmMsg = "Quý khách có chắc chắn muốn thoát phiên tham quan này trên thiết bị? Mã vé và lịch sử của quý khách vẫn được bảo toàn nguyên vẹn trên hệ thống.";
        const userConfirmed = window.confirm(confirmMsg);
        
        // 2. Nếu khách chọn Hủy, không thực hiện thao tác nào
        if (!userConfirmed) return;

        // 3. Nếu khách xác nhận, gọi API backend hiện có để kết thúc đúng phiên tham quan
        setIsExiting(true);
        try {
            const res = await ZooApi.exitTicketSession(targetSessionId);
            if (res && res.success) {
                // 4. Chỉ thông báo thành công và cập nhật UI sau khi backend xác nhận thao tác thành công
                // 6. Cập nhật trạng thái phiên và giao diện trang chủ
                clearSession();
                handleClose();
                showToast("Đã thoát phiên tham quan thành công.", "success");
            } else {
                // 5. Nếu API lỗi, giữ nguyên trạng thái giao diện và hiển thị thông báo lỗi để khách thử lại
                const errorMsg = res?.message || "Không thể kết thúc phiên tham quan từ máy chủ. Vui lòng thử lại.";
                showToast(errorMsg, "error");
            }
        } catch (err) {
            console.error("handleExitSession error:", err);
            // Giữ nguyên trạng thái giao diện khi lỗi mạng
            showToast("Lỗi kết nối đến máy chủ khi thoát phiên tham quan. Vui lòng thử lại.", "error");
        } finally {
            setIsExiting(false);
        }
    };

    const handleCopyCode = () => {
        if (!ticketCode) return;
        navigator.clipboard.writeText(ticketCode);
        showToast(`Đã sao chép mã vé: ${ticketCode}`, "info");
    };

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={handleClose}></div>
            <div className="modal-dialog" style={{ maxWidth: '440px', padding: 0, borderRadius: '24px', border: 'none', background: 'transparent' }}>
                
                {/* GIAO DIỆN THẺ THAM QUAN ĐIỆN TỬ (E-TICKET PASS) */}
                <div
                    className="custom-scrollbar"
                    style={{
                        background: '#FFFFFF',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                        border: '1px solid #CBD5E1',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}
                >
                    {/* Header Thẻ: Tiêu đề Thẻ Tham Quan Điện Tử & Trạng thái phiên */}
                    <div style={{
                        background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                        color: '#FFFFFF',
                        padding: '20px 22px 16px 22px',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2
                    }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                color: '#FFFFFF',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Đóng thẻ điện tử"
                        >
                            ✕
                        </button>

                        <div style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>
                            Thảo Cầm Viên Sài Gòn
                        </div>
                        <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
                            Thẻ Tham Quan Điện Tử
                        </h3>

                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isActiveSession ? '#4ADE80' : '#FCD34D'
                            }}></span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                {isActiveSession ? 'Phiên Đang Hoạt Động' : 'Vé Đã Phát Hành'}
                            </span>
                        </div>
                    </div>

                    {/* Nội dung Thẻ */}
                    {ticketCode ? (
                        <div style={{ padding: '22px 24px' }}>
                            {/* Ở GIỮA: Mã vé to rõ */}
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Mã vé tham quan
                                </div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#F8FAFC',
                                    border: '1.5px dashed #CBD5E1',
                                    padding: '6px 14px',
                                    borderRadius: '10px'
                                }}>
                                    <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px' }}>
                                        {ticketCode}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyCode}
                                        style={{
                                            background: '#FFFFFF',
                                            border: '1px solid #CBD5E1',
                                            borderRadius: '6px',
                                            padding: '2px 8px',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Sao chép
                                    </button>
                                </div>
                            </div>

                            {/* Ở GIỮA: Khung chứa ảnh mã QR thực tế */}
                            <div style={{
                                textAlign: 'center',
                                background: '#F8FAFC',
                                padding: '16px',
                                borderRadius: '18px',
                                border: '1px solid #E2E8F0',
                                marginBottom: '18px'
                            }}>
                                <div style={{
                                    background: '#FFFFFF',
                                    padding: '10px',
                                    borderRadius: '12px',
                                    display: 'inline-block',
                                    border: '1px solid #CBD5E1',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <img
                                        src={`${API_CONFIG.BASE_URL}/tickets/${encodeURIComponent(ticketCode)}/qr`}
                                        alt={`QR Code ${ticketCode}`}
                                        style={{ width: '180px', height: '180px', display: 'block' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketCode)}`;
                                        }}
                                    />
                                </div>
                                <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                                    Xuất trình mã QR tại cổng kiểm soát hoặc để kích hoạt thuyết minh GPS
                                </p>
                            </div>

                            {/* Ở GIỮA: Thông tin vé chi tiết */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px',
                                background: '#F1F5F9',
                                padding: '14px',
                                borderRadius: '12px',
                                marginBottom: '18px',
                                fontSize: '0.85rem'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Chủ vé:</span>
                                    <strong style={{ color: '#0F172A' }}>{customerName}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Hạng vé:</span>
                                    <strong style={{ color: '#0F172A' }}>{ticketType}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Thời hạn:</span>
                                    <span style={{ fontSize: '0.8rem', color: '#334155' }}>
                                        {validUntil ? validUntil.slice(0, 16).replace('T', ' ') : 'Trong ngày'}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Trạng thái:</span>
                                    <span style={{ color: '#15803D', fontWeight: 700 }}>
                                        {isActiveSession ? 'Đang hoạt động' : 'Hợp lệ'}
                                    </span>
                                </div>
                            </div>

                            {/* PHÍA DƯỚI: Mã phiên tham quan */}
                            {sessionId && (
                                <div style={{
                                    textAlign: 'center',
                                    marginBottom: '16px',
                                    padding: '8px 12px',
                                    background: '#F8FAFC',
                                    borderRadius: '10px',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '0.8rem',
                                    color: '#64748B'
                                }}>
                                    <span>Mã phiên tham quan: </span>
                                    <strong className="font-mono" style={{ color: '#0F172A', wordBreak: 'break-all' }}>{sessionId}</strong>
                                </div>
                            )}

                            {/* NÚT THOÁT PHIÊN THAM QUAN: Ngay bên dưới mã phiên tham quan ở cuối modal */}
                            {isActiveSession ? (
                                <button
                                    id="btn-modal-exit-session"
                                    type="button"
                                    onClick={handleExitSession}
                                    disabled={isExiting}
                                    style={{
                                        width: '100%',
                                        minHeight: '48px',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        background: '#FEF2F2',
                                        color: '#DC2626',
                                        border: '1.5px solid #FCA5A5',
                                        fontWeight: 700,
                                        fontSize: '0.92rem',
                                        cursor: isExiting ? 'wait' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {/* Biểu tượng thoát phù hợp */}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    <span>{isExiting ? 'Đang thoát phiên...' : 'Thoát phiên tham quan'}</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    style={{
                                        width: '100%',
                                        minHeight: '44px',
                                        padding: '11px 18px',
                                        borderRadius: '12px',
                                        background: '#F1F5F9',
                                        color: '#475569',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Đóng thẻ điện tử
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Trường hợp chưa tìm thấy vé */
                        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', color: '#94A3B8', marginBottom: '10px' }}>
                                🎟️
                            </div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 800 }}>
                                Chưa Tìm Thấy Thông Tin Vé
                            </h4>
                            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748B' }}>
                                Quý khách chưa kích hoạt phiên tham quan hoặc phiên trước đó đã hết hạn. Nếu đã có mã vé, quý khách có thể kích hoạt ngay bên dưới.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleClose();
                                        setIsTicketModalOpen(true);
                                    }}
                                    style={{
                                        padding: '11px',
                                        borderRadius: '10px',
                                        background: '#15803D',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Nhập mã kích hoạt vé
                                </button>

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '10px',
                                        background: '#F1F5F9',
                                        color: '#64748B',
                                        border: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Đóng cửa sổ
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}