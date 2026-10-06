import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function TicketModal() {
    const { isTicketModalOpen, setIsTicketModalOpen, validateTicketCode } = useApp();
    const [inputCode, setInputCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
                    <h3 className="font-bold text-base">Kích Hoạt Phiên Tham Quan</h3>
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
                    <p className="text-sm text-muted mb-3">Vui lòng quét hoặc nhập mã vé để mở khóa Thuyết minh tự động & Dẫn đường.</p>
                    
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
                            {isLoading ? 'Đang xác thực vé...' : 'Kích hoạt vé tham quan'}
                        </button>
                    </form>

                    <div className="flex gap-2">
                        <button 
                            type="button"
                            className="btn btn-sm btn-secondary font-mono" 
                            onClick={() => { setInputCode('ZOO-8899-VIP'); handleValidate('ZOO-8899-VIP'); }}
                        >
                            Kích hoạt mã VIP: ZOO-8899-VIP
                        </button>
                        <button 
                            type="button"
                            className="btn btn-sm btn-secondary font-mono" 
                            onClick={() => { setInputCode('ZOO-1234-STD'); handleValidate('ZOO-1234-STD'); }}
                        >
                            Mã STD: ZOO-1234-STD
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
