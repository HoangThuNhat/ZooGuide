import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

export default function TicketsTab() {
    const { currentSession, hasActiveSession, validateTicketCode, clearSession } = useApp();
    const [inputCode, setInputCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [qrScanStatus, setQrScanStatus] = useState('Sẵn sàng nhận diện');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const isProcessingRef = useRef(false);
    const scanTimerRef = useRef(null);

    // Dừng camera
    const stopCamera = useCallback(() => {
        if (scanTimerRef.current) {
            clearInterval(scanTimerRef.current);
            scanTimerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    // Xử lý mã phát hiện được từ camera hoặc scanner
    const handleCodeDetected = useCallback(async (detectedCode) => {
        if (isProcessingRef.current || !detectedCode) return;
        isProcessingRef.current = true;

        // Rung nhẹ thông báo nếu thiết bị hỗ trợ
        if (navigator.vibrate) {
            try { navigator.vibrate(150); } catch {}
        }

        const normalized = detectedCode.trim().toUpperCase();
        setInputCode(normalized);
        setQrScanStatus(`Đã nhận diện mã: ${normalized}`);
        setErrorMsg('');
        setIsLoading(true);

        const result = await validateTicketCode(normalized);
        setIsLoading(false);

        if (result.success) {
            setQrScanStatus(`✓ Xác thực thành công: ${normalized}`);
            stopCamera();
            isProcessingRef.current = false;
        } else {
            setErrorMsg(result.message || 'Mã vé không hợp lệ hoặc không thể xác thực');
            setQrScanStatus('Xác thực thất bại. Vui lòng quét lại');
            // Mở lại khóa quét sau 2.5 giây để tránh gửi request dồn dập
            setTimeout(() => {
                isProcessingRef.current = false;
                setQrScanStatus('Sẵn sàng quét mã tiếp theo...');
            }, 2500);
        }
    }, [validateTicketCode, stopCamera]);

    // Bắt đầu Camera thật
    const startCamera = async () => {
        setCameraError('');
        setErrorMsg('');
        setQrScanStatus('Đang yêu cầu quyền truy cập camera...');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError('Trình duyệt không hỗ trợ truy cập camera hoặc đang chạy trên kết nối không bảo mật (cần HTTPS hoặc localhost).');
            setQrScanStatus('Camera không khả dụng');
            return;
        }

        try {
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            setIsCameraActive(true);
            setQrScanStatus('Camera đang hoạt động. Hãy hướng ống kính vào mã QR trên vé...');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                await videoRef.current.play().catch(e => console.warn("Video play error:", e));
            }

            // Kiểm tra hỗ trợ BarcodeDetector Web API
            if ('BarcodeDetector' in window) {
                try {
                    const formats = await window.BarcodeDetector.getSupportedFormats();
                    const detector = new window.BarcodeDetector({
                        formats: formats.includes('qr_code') ? formats : ['qr_code']
                    });

                    scanTimerRef.current = setInterval(async () => {
                        if (!videoRef.current || videoRef.current.readyState < 2 || isProcessingRef.current) {
                            return;
                        }

                        try {
                            const barcodes = await detector.detect(videoRef.current);
                            if (barcodes && barcodes.length > 0) {
                                const code = barcodes[0].rawValue;
                                if (code) {
                                    handleCodeDetected(code);
                                }
                            }
                        } catch (err) {
                            // Bỏ qua lỗi từng frame
                        }
                    }, 350);
                } catch (e) {
                    console.warn("BarcodeDetector error:", e);
                }
            } else {
                setQrScanStatus('Camera đã bật. Hãy hướng ống kính vào mã QR trên vé để quét.');
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setIsCameraActive(false);

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError('Người dùng đã từ chối quyền truy cập camera. Vui lòng cho phép quyền trong cài đặt trình duyệt để quét vé.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('Không tìm thấy thiết bị camera trên máy.');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setCameraError('Camera đang bị ứng dụng khác sử dụng hoặc không thể khởi tạo.');
            } else {
                setCameraError(`Không thể mở camera: ${err.message || 'Lỗi không xác định'}.`);
            }
            setQrScanStatus('Lỗi kết nối camera');
        }
    };

    // Quét ảnh từ file tải lên
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setQrScanStatus('Đang đọc mã từ hình ảnh tải lên...');
        setErrorMsg('');

        if ('BarcodeDetector' in window) {
            try {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await img.decode();

                const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] });
                const barcodes = await detector.detect(img);

                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    handleCodeDetected(barcodes[0].rawValue);
                    return;
                }
            } catch (err) {
                console.warn("Image detection error:", err);
            }
        }

        setQrScanStatus('Không tự động nhận diện được mã trong ảnh. Vui lòng kiểm tra lại góc chụp.');
    };

    // Dọn dẹp camera khi unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleFormSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!inputCode.trim()) {
            setErrorMsg('Vui lòng nhập mã vé hợp lệ');
            return;
        }

        setErrorMsg('');
        setIsLoading(true);
        const result = await validateTicketCode(inputCode.trim().toUpperCase());
        setIsLoading(false);

        if (!result.success) {
            setErrorMsg(result.message);
        } else {
            setInputCode('');
        }
    };

    const handleExitSession = () => {
        if (window.confirm('Quý khách có chắc chắn muốn kết thúc phiên tham quan hiện tại?')) {
            clearSession();
        }
    };

    return (
        <section id="tab-pane-tickets" className="tab-content-pane">
            <div className="ticket-page-layout">
                {/* QR Scan & Manual Input Box (Left Column) */}
                <div className="ticket-scan-box">
                    <div className="ticket-scan-header">
                        <div className="ticket-scan-badge">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            <span>Quét Mã QR & Nhập Vé</span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Mở Khóa Vé Tham Quan</h3>
                        <p className="text-sm text-muted mt-1">
                            Quét mã QR bằng camera thiết bị hoặc nhập mã in trên vé để kích hoạt phiên thuyết minh tự động và bản đồ số.
                        </p>
                    </div>

                    {/* Camera Viewfinder Box */}
                    <div className="camera-preview-sim">
                        {isCameraActive && (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                }} 
                            />
                        )}

                        <div className="qr-target-box">
                            <span className="qr-corner qr-corner-tl"></span>
                            <span className="qr-corner qr-corner-tr"></span>
                            <span className="qr-corner qr-corner-bl"></span>
                            <span className="qr-corner qr-corner-br"></span>
                            <div className="qr-scanline"></div>
                        </div>

                        {!isCameraActive && (
                            <div className="camera-inactive-placeholder">
                                <div className="camera-inactive-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-300">Ống kính camera chưa kích hoạt</span>
                                <span className="text-2xs text-slate-400">Bấm "Bật Camera Quét Mã" hoặc nhập mã vé bên dưới</span>
                            </div>
                        )}
                    </div>

                    {cameraError && (
                        <div className="alert alert-danger mb-3 p-3 text-xs" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px' }}>
                            ⚠️ {cameraError}
                        </div>
                    )}

                    <div className="ticket-scan-controls">
                        <div className="w-full mb-3" style={{ width: '100%' }}>
                            {!isCameraActive ? (
                                <button 
                                    id="btn-start-camera"
                                    type="button"
                                    className="btn btn-primary w-full"
                                    style={{ width: '100%', height: '48px', fontSize: '0.9375rem', fontWeight: '700' }}
                                    onClick={startCamera}
                                    disabled={isLoading}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                    <span>Bật Camera Quét Mã</span>
                                </button>
                            ) : (
                                <button 
                                    id="btn-stop-camera"
                                    type="button"
                                    className="btn btn-outline text-danger w-full"
                                    style={{ width: '100%', height: '48px', borderColor: '#FCA5A5', color: '#DC2626', fontWeight: '700' }}
                                    onClick={stopCamera}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                    <span>✕ Tắt Camera Quét</span>
                                </button>
                            )}
                        </div>

                        <div className="ticket-status-indicator justify-center w-full mb-1" style={{ width: '100%', justifyContent: 'center' }}>
                            <span className={`ticket-status-dot ${isCameraActive ? 'active' : ''}`}></span>
                            <span id="qr-scan-status">{qrScanStatus}</span>
                        </div>
                    </div>

                    {/* Manual Ticket Input Form */}
                    <form id="ticket-form" className="ticket-form mt-2" onSubmit={handleFormSubmit}>
                        <div className="ticket-form-group">
                            <div className="ticket-input-wrapper">
                                <span className="ticket-input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                                        <path d="M6 10v4"></path>
                                        <path d="M10 10v4"></path>
                                        <path d="M14 10v4"></path>
                                        <path d="M18 10v4"></path>
                                    </svg>
                                </span>
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
                        </div>

                        {errorMsg && (
                            <div id="ticket-error-msg" className="alert alert-danger mb-3 p-2.5 text-xs flex items-center gap-2" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px' }}>
                                <span>❌</span>
                                <span className="font-semibold">{errorMsg}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            id="btn-submit-ticket" 
                            className="btn-ticket-submit" 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                                        <path d="M12 2a10 10 0 0 1 10 10"></path>
                                    </svg>
                                    <span>Đang xác thực với máy chủ...</span>
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
                </div>

                {/* Right Column: Realistic E-Ticket Pass Card */}
                <div className="ticket-pass-wrapper">
                    <div className="ticket-info-card">
                        {/* Ticket Pass Upper Section */}
                        <div className="ticket-pass-top">
                            {/* Header: Compact Brand Badge + Status Indicator */}
                            <div className="ticket-card-header">
                                <div>
                                    <span className="ticket-brand-badge">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        E-TICKET PASS
                                    </span>
                                    <h4 className="ticket-card-title">Thẻ Tham Quan Điện Tử</h4>
                                </div>
                                <div>
                                    {hasActiveSession ? (
                                        <div className="ticket-status-pill active">
                                            <span className="pulse-indicator"></span>
                                            <span>Đang Hoạt Động</span>
                                        </div>
                                    ) : (
                                        <div className="ticket-status-pill pending">
                                            <span className="status-indicator-idle"></span>
                                            <span>Chưa Kích Hoạt</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dedicated Ticket Code Banner */}
                            <div className="ticket-code-banner">
                                <div className="ticket-code-label-group">
                                    <span className="ticket-code-sublabel">Mã vé tham quan</span>
                                    <span className="ticket-code-hint">
                                        {hasActiveSession 
                                            ? 'Xác thực thành công trên hệ thống' 
                                            : 'Quét QR hoặc nhập mã để mở khóa'}
                                    </span>
                                </div>
                                <div className={`ticket-code-display ${!hasActiveSession ? 'empty-state' : ''}`} id="session-card-code">
                                    {hasActiveSession ? currentSession.ticketCode : 'CHƯA CÓ VÉ'}
                                </div>
                            </div>

                            {/* 2x2 Ticket Meta Details Grid */}
                            <div className="ticket-detail-grid">
                                <div className="ticket-info-item">
                                    <span className="ticket-meta-label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        Chủ vé
                                    </span>
                                    <p className="ticket-meta-val" id="session-card-name">
                                        {hasActiveSession ? (currentSession.customerName || 'Khách tham quan') : '—'}
                                    </p>
                                </div>
                                <div className="ticket-info-item">
                                    <span className="ticket-meta-label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                        </svg>
                                        Hạng vé
                                    </span>
                                    <p className="ticket-meta-val" id="session-card-type">
                                        {hasActiveSession ? currentSession.ticketType : 'Chưa kích hoạt'}
                                    </p>
                                </div>
                                <div className="ticket-info-item">
                                    <span className="ticket-meta-label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <circle cx="12" cy="12" r="10"/>
                                            <polyline points="12 6 12 12 16 14"/>
                                        </svg>
                                        Thời hạn phiên
                                    </span>
                                    <p className="ticket-meta-val" id="session-card-date">
                                        {hasActiveSession ? (currentSession.expiresAt ? currentSession.expiresAt.slice(0, 19).replace('T', ' ') : currentSession.validDate) : '—'}
                                    </p>
                                </div>
                                <div className="ticket-info-item">
                                    <span className="ticket-meta-label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                        </svg>
                                        Trạng thái
                                    </span>
                                    <p className={`ticket-meta-val ${hasActiveSession ? 'text-success' : 'text-pending'}`}>
                                        {hasActiveSession ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                                    </p>
                                </div>
                            </div>

                            {/* Quyền Lợi Tham Quan Section */}
                            <div className="ticket-perks-box">
                                <div className="ticket-perks-header">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                    </svg>
                                    <span>Quyền lợi tham quan</span>
                                </div>
                                {hasActiveSession ? (
                                    <ul className="ticket-perks-list">
                                        <li>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            <span><strong>Phân khu:</strong> Toàn bộ {currentSession.zonesAllowed?.includes('ALL') ? 'các phân khu sở thú' : currentSession.zonesAllowed?.join(', ')}</span>
                                        </li>
                                        <li>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            <span>Thuyết minh Audio đa ngôn ngữ tự động định vị GPS</span>
                                        </li>
                                        <li>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            <span>Bản đồ tương tác dẫn đường & Trợ lý ảo AI ZooGuide</span>
                                        </li>
                                    </ul>
                                ) : (
                                    <div className="ticket-perks-inactive-hint">
                                        <p className="text-xs text-light-muted mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                            Kích hoạt vé để tự động mở khóa các dịch vụ số:
                                        </p>
                                        <div className="ticket-perks-badges">
                                            <span className="perk-badge">🎧 Thuyết minh Audio GPS</span>
                                            <span className="perk-badge">🗺️ Bản đồ tham quan số</span>
                                            <span className="perk-badge">💬 Trợ lý ảo ZooGuide</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Perforated Divider with Circular Notches */}
                        <div className="ticket-perforation-divider" aria-hidden="true">
                            <div className="ticket-notch ticket-notch-left"></div>
                            <div className="ticket-perforation-line"></div>
                            <div className="ticket-notch ticket-notch-right"></div>
                        </div>

                        {/* Bottom Ticket Stub (Barcode & Action Button) */}
                        <div className="ticket-pass-bottom">
                            <div className="ticket-barcode-container">
                                <div className="ticket-barcode-graphic" aria-hidden="true">
                                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 2, 3, 1, 2].map((w, i) => (
                                        <span key={i} className="barcode-bar" style={{ width: `${w}px` }}></span>
                                    ))}
                                </div>
                                <div className="ticket-serial-text">
                                    {hasActiveSession 
                                        ? `PASS AUTH • ${currentSession.ticketCode} • SESSION ACTIVE` 
                                        : 'ZOO ELECTRONIC PASS • SCAN OR ENTER CODE TO ACTIVATE'}
                                </div>
                            </div>

                            {hasActiveSession && (
                                <button 
                                    id="btn-exit-session" 
                                    type="button"
                                    className="btn-ticket-end" 
                                    onClick={handleExitSession}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    <span>Kết thúc phiên tham quan</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
