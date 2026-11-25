import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function TicketModal() {
    const { isTicketModalOpen, setIsTicketModalOpen, validateTicketCode, switchTab, currentLang, t } = useApp();
    const [inputCode, setInputCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isTicketModalOpen) return undefined;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsTicketModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTicketModalOpen, setIsTicketModalOpen]);

    if (!isTicketModalOpen) return null;
    const isEn = currentLang === 'en';

    const handleValidate = async (codeToUse) => {
        const code = codeToUse || inputCode;
        if (!code || !code.trim()) {
            setErrorMsg(t?.ticketEnterCodeError || (isEn ? 'Please enter a valid ticket code' : 'Vui lòng nhập mã vé'));
            return;
        }

        setErrorMsg('');
        setIsLoading(true);

        const result = await validateTicketCode(code);
        setIsLoading(false);

        if (!result.success) {
            setErrorMsg(result.message);
        }
    };

    return (
        <div id="ticket-modal" className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={() => setIsTicketModalOpen(false)}></div>
            <div className="modal-dialog">
                <div className="modal-header">
                    <h3 className="font-bold text-base">{t?.heroScanBtn || 'Kích Hoạt Phiên Tham Quan'}</h3>
                    <button
                        id="btn-close-ticket-modal"
                        type="button"
                        className="btn btn-icon btn-sm"
                        aria-label={t?.closeBtn || (isEn ? 'Close' : 'Đóng')}
                        onClick={() => setIsTicketModalOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                <div className="modal-body">
                    <p className="text-sm text-muted mb-3">
                        {t?.ticketLockedDesc || 'Vui lòng quét hoặc nhập mã vé thực tế trên hệ thống để mở khóa Thuyết minh tự động & Dẫn đường.'}
                    </p>

                    <form onSubmit={(e) => { e.preventDefault(); handleValidate(); }} className="mb-4">
                        <div className="ticket-form-group mb-3">
                            <input
                                type="text"
                                className="ticket-input-styled"
                                placeholder="ZG-YYYYMMDD-XXXXXXXX"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {errorMsg && (
                            <p className="text-sm text-danger font-semibold mb-3">{errorMsg}</p>
                        )}
                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }} disabled={isLoading}>
                            {isLoading ? (t?.ticketValidatingLabel || (isEn ? 'Validating ticket...' : 'Đang xác thực vé...')) : (t?.heroScanBtn || 'Kích hoạt vé tham quan')}
                        </button>
                    </form>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '8px' }}>
                            {t?.heroHasNoTicketPrompt || (isEn ? "Don't have an admission ticket yet?" : 'Quý khách chưa có vé vào cổng Thảo Cầm Viên?')}
                        </p>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ width: '100%', borderColor: '#15803D', color: '#15803D', fontWeight: 600 }}
                            onClick={() => {
                                setIsTicketModalOpen(false);
                                switchTab('tickets');
                            }}
                        >
                            {t?.btnPurchaseTicket || 'Mua vé tham quan trực tuyến'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
