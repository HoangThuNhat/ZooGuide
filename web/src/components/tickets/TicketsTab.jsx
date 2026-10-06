import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function TicketsTab() {
    const { currentSession, hasActiveSession, validateTicketCode, clearSession } = useApp();
    const [inputCode, setInputCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [qrScanStatus, setQrScanStatus] = useState('Sẵn sàng nhận diện');

    const handleFormSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!inputCode.trim()) {
            setErrorMsg('Vui lòng nhập mã vé hợp lệ');
            return;
        }

        setErrorMsg('');
        setIsLoading(true);
        const result = await validateTicketCode(inputCode);
        setIsLoading(false);

        if (!result.success) {
            setErrorMsg(result.message);
        } else {
            setInputCode('');
        }
    };

    const handleDemoCode = async (code) => {
        setInputCode(code);
        setErrorMsg('');
        setIsLoading(true);
        const result = await validateTicketCode(code);
        setIsLoading(false);
        if (!result.success) {
            setErrorMsg(result.message);
        }
    };

    const handleSimulateQR = () => {
        setQrScanStatus('Đang nhận diện mã QR trên vé...');
        setTimeout(() => {
            setQrScanStatus('Đã quét thấy mã: ZOO-8899-VIP');
            setTimeout(() => {
                handleDemoCode('ZOO-8899-VIP');
            }, 600);
        }, 1200);
    };

    const handleExitSession = () => {
        if (window.confirm('Quý khách có chắc chắn muốn kết thúc phiên tham quan hiện tại?')) {
            clearSession();
        }
    };

    return (
        <section id="tab-pane-tickets" className="tab-content-pane">
            <div className="ticket-page-layout">
                {/* QR Scan & Code Verification Box */}
                <div className="ticket-scan-box">
                    <h3 className="text-lg font-bold mb-2">Mở Khóa Vé Tham Quan</h3>
                    <p className="text-sm text-muted mb-4">Quét mã QR trên vé vào cổng hoặc nhập mã in trên vé để kích hoạt phiên thuyết minh tự động.</p>

                    {/* Simulated Camera Viewfinder */}
                    <div className="camera-preview-sim">
                        <div className="qr-target-box">
                            <div className="qr-scanline"></div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <button 
                            id="btn-simulate-qr" 
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={handleSimulateQR}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                            <span>Mô phỏng Quét QR Camera</span>
                        </button>
                        <span id="qr-scan-status" className="text-xs text-muted">{qrScanStatus}</span>
                    </div>

                    <form id="ticket-form" className="ticket-form" onSubmit={handleFormSubmit}>
                        <div className="ticket-form-group">
                            <label htmlFor="ticket-input" className="form-label">Mã vé tham quan (VD: ZOO-8899-VIP)</label>
                            <input 
                                type="text" 
                                id="ticket-input" 
                                className="ticket-input-styled" 
                                placeholder="ZOO-XXXX-XXX" 
                                required 
                                autoComplete="off"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                            />
                        </div>

                        {errorMsg && (
                            <p id="ticket-error-msg" className="text-sm text-danger font-semibold mb-3">
                                {errorMsg}
                            </p>
                        )}

                        <button 
                            type="submit" 
                            id="btn-submit-ticket" 
                            className="btn btn-primary w-full" 
                            style={{ width: '100%' }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                                        <path d="M12 2a10 10 0 0 1 10 10"></path>
                                    </svg>
                                    <span>Đang xác thực vé...</span>
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>Kích hoạt vé tham quan</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Codes Helper */}
                    <div className="mt-4 pt-3 border-t border-border">
                        <p className="text-xs text-muted mb-2">Mã vé mẫu kiểm thử nhanh:</p>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                id="btn-demo-vip" 
                                className="btn btn-sm btn-secondary font-mono"
                                onClick={() => handleDemoCode('ZOO-8899-VIP')}
                            >
                                ZOO-8899-VIP (VIP)
                            </button>
                            <button 
                                type="button" 
                                id="btn-demo-std" 
                                className="btn btn-sm btn-secondary font-mono"
                                onClick={() => handleDemoCode('ZOO-1234-STD')}
                            >
                                ZOO-1234-STD (Tiêu chuẩn)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Session Digital Card */}
                <div>
                    <div className="ticket-info-card">
                        <div className="ticket-card-header">
                            <div>
                                <span className="badge badge-amber mb-1">E-TICKET PASS</span>
                                <h4 className="text-lg font-bold">Thẻ Tham Quan Điện Tử</h4>
                            </div>
                            <div className="ticket-code-display" id="session-card-code">
                                {hasActiveSession ? currentSession.ticketCode : 'CHƯA CÓ VÉ'}
                            </div>
                        </div>

                        <div className="ticket-detail-grid">
                            <div>
                                <span className="ticket-meta-label">Chủ vé</span>
                                <p className="ticket-meta-val" id="session-card-name">
                                    {hasActiveSession ? currentSession.customerName : '—'}
                                </p>
                            </div>
                            <div>
                                <span className="ticket-meta-label">Hạng vé</span>
                                <p className="ticket-meta-val" id="session-card-type">
                                    {hasActiveSession ? currentSession.ticketType : 'Chưa kích hoạt'}
                                </p>
                            </div>
                            <div>
                                <span className="ticket-meta-label">Ngày hiệu lực</span>
                                <p className="ticket-meta-val" id="session-card-date">
                                    {hasActiveSession ? currentSession.validDate : '—'}
                                </p>
                            </div>
                            <div>
                                <span className="ticket-meta-label">Trạng thái</span>
                                <p className={`ticket-meta-val ${hasActiveSession ? 'text-success' : 'text-danger'}`}>
                                    {hasActiveSession ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <span className="ticket-meta-label">Phân khu được phép vào</span>
                            <p className="text-sm font-semibold">
                                {hasActiveSession 
                                    ? `Toàn bộ ${currentSession.zonesAllowed.includes('ALL') ? '5 phân khu (Khu A, B, C, D, E)' : currentSession.zonesAllowed.join(', ')} + Thuyết minh Audio` 
                                    : 'Vui lòng kích hoạt vé để xem thông tin phân khu'}
                            </p>
                        </div>

                        {hasActiveSession && (
                            <button 
                                id="btn-exit-session" 
                                className="btn btn-sm btn-outline" 
                                style={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.4)' }}
                                onClick={handleExitSession}
                            >
                                Kết thúc phiên tham quan
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
