import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi } from '../../services/api';

export default function TicketModal() {
    const { isTicketModalOpen, setIsTicketModalOpen, validateTicketCode, t } = useApp();
    const [inputCode, setInputCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeDbTickets, setActiveDbTickets] = useState([]);

    useEffect(() => {
        if (!isTicketModalOpen) return;
        let isMounted = true;
        ZooApi.getTickets().then(res => {
            if (isMounted && res.success && Array.isArray(res.data)) {
                const activeOnes = res.data.filter(tk => tk.status === 'Active').slice(0, 3);
                setActiveDbTickets(activeOnes);
            }
        });
        return () => { isMounted = false; };
    }, [isTicketModalOpen]);

    if (!isTicketModalOpen) return null;

    const handleValidate = async (codeToUse) => {
        const code = codeToUse || inputCode;
        if (!code || !code.trim()) {
            setErrorMsg('Vui lòng nhập mã vé');
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
                        className="btn btn-icon btn-sm"
                        aria-label="Đóng"
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
                                placeholder="ZOO-XXXX-XXX"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {errorMsg && (
                            <p className="text-sm text-danger font-semibold mb-3">{errorMsg}</p>
                        )}
                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }} disabled={isLoading}>
                            {isLoading ? 'Đang xác thực vé...' : (t?.heroScanBtn || 'Kích hoạt vé tham quan')}
                        </button>
                    </form>

                    {activeDbTickets.length > 0 && (
                        <div>
                            <div className="text-xs text-muted mb-2 font-semibold">
                                Vé hợp lệ hiện có trong cơ sở dữ liệu Supabase:
                            </div>
                            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                {activeDbTickets.map(tk => (
                                    <button
                                        key={tk.ticketId}
                                        type="button"
                                        className="btn btn-sm btn-secondary font-mono"
                                        onClick={() => {
                                            setInputCode(tk.ticketCode);
                                            handleValidate(tk.ticketCode);
                                        }}
                                    >
                                        {tk.ticketCode} ({tk.ticketTypeName})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
