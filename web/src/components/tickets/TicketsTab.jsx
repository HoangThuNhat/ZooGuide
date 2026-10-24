import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ZooApi } from '../../services/api';

export default function TicketsTab() {
    const { currentSession, hasActiveSession, validateTicketCode, clearSession, showToast, t } = useApp();

    // Mode Switcher: 'buy' (Mua vé & Thanh toán VietQR) | 'activate' (Quét/Nhập vé mở khóa)
    const [activeTabMode, setActiveTabMode] = useState('buy');

    // --- STATE CHO ĐẶT VÉ & THANH TOÁN VIETQR ---
    const [ticketTypes, setTicketTypes] = useState([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [cartQuantities, setCartQuantities] = useState({});
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Trạng thái đơn hàng đang xử lý
    const [currentOrder, setCurrentOrder] = useState(null);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
    const [paymentTimeRemaining, setPaymentTimeRemaining] = useState(900); // 15 phút đếm ngược
    const [orderSuccessModal, setOrderSuccessModal] = useState(false);
    const pollingIntervalRef = useRef(null);

    // --- STATE CHO KÍCH HOẠT VÉ THỦ CÔNG & CAMERA ---
    const [inputCode, setInputCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isValidatingTicket, setIsValidatingTicket] = useState(false);
    const [qrScanStatus, setQrScanStatus] = useState('Sẵn sàng nhận diện');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const isProcessingRef = useRef(false);
    const scanTimerRef = useRef(null);

    // 1. Nạp danh mục loại vé từ Backend Supabase
    useEffect(() => {
        let isMounted = true;
        ZooApi.getTicketTypes().then(res => {
            if (isMounted && res && res.success && Array.isArray(res.data)) {
                const validTypes = res.data.filter(tt => tt.price > 0 && tt.price < 500000);
                setTicketTypes(validTypes.length > 0 ? validTypes : res.data);
                
                const initialCart = {};
                (validTypes.length > 0 ? validTypes : res.data).forEach((tt, idx) => {
                    const id = tt.ticketTypeId || tt.id;
                    initialCart[id] = idx === 0 ? 1 : 0;
                });
                setCartQuantities(initialCart);
            }
            if (isMounted) setIsLoadingTypes(false);
        }).catch(err => {
            console.error("Error loading ticket types:", err);
            if (isMounted) setIsLoadingTypes(false);
        });

        return () => { isMounted = false; };
    }, []);

    // 2. Tính toán tổng tiền giỏ vé
    const totalOrderAmount = Object.entries(cartQuantities).reduce((sum, [typeId, qty]) => {
        const tt = ticketTypes.find(t => String(t.ticketTypeId || t.id) === String(typeId));
        return sum + (tt ? tt.price * qty : 0);
    }, 0);

    const totalTicketsCount = Object.values(cartQuantities).reduce((sum, q) => sum + (Number(q) || 0), 0);

    const handleQuantityChange = (typeId, delta) => {
        setCartQuantities(prev => {
            const current = prev[typeId] || 0;
            const next = Math.max(0, Math.min(20, current + delta));
            return { ...prev, [typeId]: next };
        });
    };

    // 3. Tạo Đơn Hàng Thanh Toán VietQR
    const handleCheckoutOrder = async (e) => {
        e.preventDefault();
        if (totalTicketsCount <= 0) {
            showToast("Vui lòng chọn ít nhất 1 vé để tiếp tục.", "error");
            return;
        }
        if (!customerInfo.name.trim() || !customerInfo.phone.trim() || !customerInfo.email.trim()) {
            showToast("Vui lòng điền đầy đủ họ tên, số điện thoại và email.", "error");
            return;
        }

        const items = Object.entries(cartQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([typeId, qty]) => ({
                ticketTypeId: Number(typeId),
                quantity: qty
            }));

        setIsCreatingOrder(true);
        try {
            const res = await ZooApi.createOrder({
                customerName: customerInfo.name.trim(),
                customerEmail: customerInfo.email.trim(),
                customerPhone: customerInfo.phone.trim(),
                items
            });

            if (res && res.success && res.data) {
                setCurrentOrder(res.data);
                setPaymentTimeRemaining(900);
                showToast(`Đã tạo đơn hàng ${res.data.orderCode}. Vui lòng chuyển khoản theo mã VietQR.`, "success");
            } else {
                showToast(res.message || "Không thể khởi tạo đơn hàng.", "error");
            }
        } catch (err) {
            console.error("Checkout order error:", err);
            showToast("Lỗi máy chủ khi tạo đơn hàng.", "error");
        } finally {
            setIsCreatingOrder(false);
        }
    };

    // 4. Polling tự động kiểm tra trạng thái thanh toán đơn hàng
    useEffect(() => {
        if (!currentOrder || currentOrder.paymentStatus === 'Paid' || currentOrder.paymentStatus === 'Expired') {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            return;
        }

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await ZooApi.getOrderByCode(currentOrder.orderCode);
                if (res && res.success && res.data) {
                    if (res.data.paymentStatus === 'Paid') {
                        setCurrentOrder(res.data);
                        setOrderSuccessModal(true);
                        clearInterval(pollingIntervalRef.current);
                        showToast(`Thanh toán thành công đơn hàng ${res.data.orderCode}! Mã vé đã được cấp.`, "success");
                    }
                }
            } catch (err) {
                console.warn("Polling order status error:", err);
            }
        }, 3000);

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [currentOrder, showToast]);

    // 5. Đếm ngược thời gian thanh toán (15 phút)
    useEffect(() => {
        if (!currentOrder || currentOrder.paymentStatus === 'Paid') return;

        const timer = setInterval(() => {
            setPaymentTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCurrentOrder(curr => curr ? { ...curr, paymentStatus: 'Expired' } : null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentOrder]);

    // 6. Giả lập thanh toán thành công trong môi trường Sandbox
    const handleSimulatePayment = async () => {
        if (!currentOrder) return;
        setIsSimulatingPayment(true);
        try {
            const res = await ZooApi.simulateSandboxPayment(currentOrder.orderCode);
            if (res && res.success && res.data) {
                setCurrentOrder(res.data);
                setOrderSuccessModal(true);
                showToast(`Đơn hàng ${res.data.orderCode} đã thanh toán thành công và cấp ${res.data.tickets?.length || 0} vé!`, "success");
            } else {
                showToast(res.message || "Giả lập thanh toán không thành công.", "error");
            }
        } catch (err) {
            console.error("Simulate payment error:", err);
            showToast("Lỗi kết nối giả lập thanh toán.", "error");
        } finally {
            setIsSimulatingPayment(false);
        }
    };

    // 7. Tự động kích hoạt ngay phiên tham quan từ mã vé vừa mua
    const handleActivatePurchasedTicket = async (ticketCode) => {
        if (!ticketCode) return;
        setIsValidatingTicket(true);
        const result = await validateTicketCode(ticketCode);
        setIsValidatingTicket(false);

        if (result.success) {
            showToast(`Đã kích hoạt thành công phiên tham quan với mã vé ${ticketCode}!`, "success");
            setOrderSuccessModal(false);
            setCurrentOrder(null);
        } else {
            showToast(result.message || "Không thể kích hoạt vé này.", "error");
        }
    };

    // --- LOGIC QUÉT CAMERA & NHẬP VÉ THỦ CÔNG ---
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

    const handleCodeDetected = useCallback(async (detectedCode) => {
        if (isProcessingRef.current || !detectedCode) return;
        isProcessingRef.current = true;

        if (navigator.vibrate) {
            try { navigator.vibrate(150); } catch {}
        }

        const normalized = detectedCode.trim().toUpperCase();
        setInputCode(normalized);
        setQrScanStatus(`Đã nhận diện: ${normalized}`);
        setErrorMsg('');
        setIsValidatingTicket(true);

        const result = await validateTicketCode(normalized);
        setIsValidatingTicket(false);

        if (result.success) {
            setQrScanStatus(`Xác thực thành công: ${normalized}`);
            stopCamera();
            isProcessingRef.current = false;
            showToast(`Đã kích hoạt vé ${normalized} thành công!`, "success");
        } else {
            setErrorMsg(result.message || 'Mã vé không hợp lệ hoặc đã hết hạn.');
            setQrScanStatus('Xác thực thất bại. Vui lòng quét lại');
            setTimeout(() => {
                isProcessingRef.current = false;
                setQrScanStatus('Sẵn sàng quét mã tiếp theo...');
            }, 2500);
        }
    }, [validateTicketCode, stopCamera, showToast]);

    const startCamera = async () => {
        setCameraError('');
        setErrorMsg('');
        setQrScanStatus('Đang mở camera...');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError('Trình duyệt không hỗ trợ camera hoặc đang chạy ở kết nối không an toàn (yêu cầu HTTPS hoặc localhost).');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            setIsCameraActive(true);
            setQrScanStatus('Camera đang hoạt động. Hướng ống kính vào mã QR trên vé.');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                await videoRef.current.play().catch(e => console.warn(e));
            }

            if ('BarcodeDetector' in window) {
                try {
                    const formats = await window.BarcodeDetector.getSupportedFormats();
                    const detector = new window.BarcodeDetector({
                        formats: formats.includes('qr_code') ? formats : ['qr_code']
                    });

                    scanTimerRef.current = setInterval(async () => {
                        if (!videoRef.current || videoRef.current.readyState < 2 || isProcessingRef.current) return;
                        try {
                            const barcodes = await detector.detect(videoRef.current);
                            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                                handleCodeDetected(barcodes[0].rawValue);
                            }
                        } catch {}
                    }, 350);
                } catch (e) {
                    console.warn(e);
                }
            }
        } catch (err) {
            setIsCameraActive(false);
            setCameraError(`Không thể mở camera: ${err.message || 'Lỗi thiết bị'}`);
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [stopCamera]);

    const handleManualCodeSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!inputCode.trim()) {
            setErrorMsg('Vui lòng nhập mã vé hợp lệ');
            return;
        }

        setErrorMsg('');
        setIsValidatingTicket(true);
        const result = await validateTicketCode(inputCode.trim().toUpperCase());
        setIsValidatingTicket(false);

        if (!result.success) {
            setErrorMsg(result.message);
        } else {
            showToast(`Đã kích hoạt vé ${inputCode.trim().toUpperCase()} thành công!`, "success");
            setInputCode('');
        }
    };

    const handleExitSession = () => {
        if (window.confirm('Quý khách có chắc chắn muốn kết thúc phiên tham quan hiện tại?')) {
            clearSession();
            showToast("Đã kết thúc phiên tham quan.", "info");
        }
    };

    const formatCurrency = (amt) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0);
    };

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <section id="tab-pane-tickets" className="tab-content-pane" style={{ padding: '12px 0 32px 0' }}>
            {/* Top Navigation Switcher */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                background: '#FFFFFF',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                maxWidth: '600px'
            }}>
                <button
                    onClick={() => setActiveTabMode('buy')}
                    style={{
                        flex: 1,
                        padding: '9px 16px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        border: 'none',
                        background: activeTabMode === 'buy' ? '#15803D' : 'transparent',
                        color: activeTabMode === 'buy' ? '#FFFFFF' : '#475569',
                        transition: 'all 0.15s ease'
                    }}
                >
                    Đặt vé trực tuyến & Thanh toán VietQR
                </button>
                <button
                    onClick={() => setActiveTabMode('activate')}
                    style={{
                        flex: 1,
                        padding: '9px 16px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        border: 'none',
                        background: activeTabMode === 'activate' ? '#15803D' : 'transparent',
                        color: activeTabMode === 'activate' ? '#FFFFFF' : '#475569',
                        transition: 'all 0.15s ease'
                    }}
                >
                    Kích hoạt vé tham quan
                </button>
            </div>

            <div className="ticket-page-layout">
                {/* CỘT TRÁI: FORM ĐẶT VÉ / THANH TOÁN QR / QUÉT MÃ */}
                <div className="ticket-scan-box" style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    
                    {/* TAB 1: MUA VÉ TRỰC TUYẾN & THANH TOÁN VIETQR */}
                    {activeTabMode === 'buy' && (
                        <div>
                            {!currentOrder ? (
                                /* GIAI ĐOẠN 1: CHỌN VÉ VÀ ĐIỀN THÔNG TIN */
                                <div>
                                    <div style={{ marginBottom: '18px' }}>
                                        <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px' }}>
                                            VIETQR ONLINE CHECKOUT
                                        </span>
                                        <h3 style={{ margin: '6px 0 4px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                                            Đặt Vé Tham Quan Thảo Cầm Viên
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                                            Hệ thống cấp mã vé điện tử tự động ngay sau khi hoàn tất chuyển khoản VietQR.
                                        </p>
                                    </div>

                                    {/* Bảng chọn hạng vé */}
                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>
                                            1. Chọn số lượng vé tham quan:
                                        </label>
                                        
                                        {isLoadingTypes ? (
                                            <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                                                Đang nạp bảng giá vé...
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {ticketTypes.map(tt => {
                                                    const typeId = tt.ticketTypeId || tt.id;
                                                    const qty = cartQuantities[typeId] || 0;
                                                    return (
                                                        <div
                                                            key={typeId}
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '12px 16px',
                                                                borderRadius: '8px',
                                                                background: qty > 0 ? '#F0FDF4' : '#F8FAFC',
                                                                border: `1.5px solid ${qty > 0 ? '#86EFAC' : '#E2E8F0'}`,
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                                                                    {tt.name}
                                                                </div>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803D' }}>
                                                                    {formatCurrency(tt.price)}
                                                                </div>
                                                            </div>

                                                            {/* Stepper (+ / -) */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(typeId, -1)}
                                                                    disabled={qty === 0}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #CBD5E1',
                                                                        background: '#FFFFFF',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.95rem',
                                                                        cursor: qty === 0 ? 'not-allowed' : 'pointer',
                                                                        opacity: qty === 0 ? 0.4 : 1
                                                                    }}
                                                                >
                                                                    －
                                                                </button>
                                                                <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 800, fontSize: '0.92rem' }}>
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(typeId, 1)}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #15803D',
                                                                        background: '#15803D',
                                                                        color: '#FFFFFF',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.95rem',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    ＋
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <p style={{ margin: '6px 0 0 0', fontSize: '0.76rem', color: '#64748B' }}>
                                            * Trẻ em dưới 1m: Miễn phí vé vào cổng.
                                        </p>
                                    </div>

                                    {/* Form nhập thông tin khách hàng */}
                                    <form onSubmit={handleCheckoutOrder}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>
                                                2. Thông tin nhận mã vé điện tử:
                                            </label>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Họ và tên khách tham quan *"
                                                    value={customerInfo.name}
                                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                                    style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                                />
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    <input
                                                        type="tel"
                                                        required
                                                        placeholder="Số điện thoại *"
                                                        value={customerInfo.phone}
                                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                                        style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                                    />
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="Email nhận mã vé *"
                                                        value={customerInfo.email}
                                                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                                        style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tóm tắt tổng tiền */}
                                        <div style={{
                                            background: '#F8FAFC',
                                            padding: '12px 16px',
                                            borderRadius: '14px',
                                            border: '1px solid #E2E8F0',
                                            marginBottom: '16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Tổng thanh toán ({totalTicketsCount} vé):</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803D' }}>
                                                    {formatCurrency(totalOrderAmount)}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', background: '#E2E8F0', padding: '3px 8px', borderRadius: '6px', color: '#475569' }}>
                                                Chuẩn VietQR
                                            </span>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isCreatingOrder || totalTicketsCount === 0}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                background: '#15803D',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                fontWeight: 800,
                                                fontSize: '0.95rem',
                                                cursor: totalTicketsCount === 0 ? 'not-allowed' : 'pointer',
                                                opacity: totalTicketsCount === 0 ? 0.6 : 1,
                                                boxShadow: '0 2px 8px rgba(21,128,61,0.2)'
                                            }}
                                        >
                                            {isCreatingOrder ? 'Đang tạo mã thanh toán VietQR...' : `Tạo mã thanh toán VietQR (${formatCurrency(totalOrderAmount)})`}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                /* GIAI ĐOẠN 2: MÀN HÌNH QUÉT MÃ VIETQR THANH TOÁN THỰC TẾ */
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <div>
                                            <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '8px' }}>
                                                VIETQR CODE
                                            </span>
                                            <h4 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                                                Quét mã VietQR để thanh toán
                                            </h4>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Thời gian còn lại</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: paymentTimeRemaining < 180 ? '#DC2626' : '#15803D' }}>
                                                {formatTimer(paymentTimeRemaining)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hộp hiển thị mã VietQR */}
                                    <div style={{
                                        textAlign: 'center',
                                        background: '#F8FAFC',
                                        borderRadius: '18px',
                                        padding: '18px',
                                        border: '1px solid #CBD5E1',
                                        marginBottom: '16px'
                                    }}>
                                        <img
                                            src={currentOrder.qrCodeUrl}
                                            alt="Mã VietQR thanh toán vé ZooGuide"
                                            style={{
                                                width: '240px',
                                                height: '240px',
                                                objectFit: 'contain',
                                                borderRadius: '10px',
                                                background: '#FFFFFF',
                                                padding: '6px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                margin: '0 auto',
                                                display: 'block'
                                            }}
                                        />

                                        <div style={{ marginTop: '14px', fontSize: '0.84rem', color: '#334155' }}>
                                            <div>Ngân hàng: <strong>{currentOrder.bankName} ({currentOrder.bankCode})</strong></div>
                                            <div>Số tài khoản: <strong style={{ color: '#0F172A' }}>{currentOrder.bankAccountNumber}</strong></div>
                                            <div>Chủ tài khoản: <strong>{currentOrder.bankAccountName}</strong></div>
                                            <div style={{ marginTop: '6px' }}>
                                                Nội dung chuyển khoản: <strong style={{ background: '#FEF08A', padding: '2px 8px', borderRadius: '6px', color: '#854D0E' }}>{currentOrder.orderCode}</strong>
                                            </div>
                                            <div style={{ marginTop: '4px', fontSize: '1rem', fontWeight: 800, color: '#15803D' }}>
                                                Số tiền: {formatCurrency(currentOrder.totalAmount)}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#15803D', fontSize: '0.8rem', fontWeight: 700 }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }}></span>
                                            <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản...</span>
                                        </div>
                                    </div>

                                    {/* Nút Sandbox Simulator để kiểm thử */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={handleSimulatePayment}
                                            disabled={isSimulatingPayment}
                                            style={{
                                                flex: 1,
                                                padding: '11px',
                                                borderRadius: '10px',
                                                background: '#2563EB',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {isSimulatingPayment ? 'Đang xử lý...' : 'Giả lập thanh toán thành công (Sandbox)'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setCurrentOrder(null)}
                                            style={{
                                                padding: '11px 16px',
                                                borderRadius: '10px',
                                                background: '#F1F5F9',
                                                color: '#475569',
                                                border: 'none',
                                                fontWeight: 600,
                                                fontSize: '0.82rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Hủy và đặt lại
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: QUÉT QR CAMERA HOẶC NHẬP MÃ VÉ */}
                    {activeTabMode === 'activate' && (
                        <div>
                            <div className="ticket-scan-header" style={{ marginBottom: '14px' }}>
                                <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '8px' }}>
                                    XÁC THỰC MÃ VÉ
                                </span>
                                <h3 className="text-xl font-bold text-foreground" style={{ marginTop: '4px' }}>Kích Hoạt Phiên Tham Quan</h3>
                                <p className="text-sm text-muted mt-1">
                                    Quét mã QR từ vé in hoặc nhập mã vé điện tử để mở khóa thuyết minh GPS và bản đồ số.
                                </p>
                            </div>

                            {/* Khung Camera Viewfinder */}
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
                                        <span className="text-xs font-semibold text-slate-300">Ống kính camera chưa kích hoạt</span>
                                        <span className="text-2xs text-slate-400">Bấm nút bên dưới để bật camera hoặc nhập mã vé</span>
                                    </div>
                                )}
                            </div>

                            {cameraError && (
                                <div className="alert alert-danger mb-3 p-3 text-xs" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px' }}>
                                    Lỗi camera: {cameraError}
                                </div>
                            )}

                            <div className="ticket-scan-controls">
                                <div className="w-full mb-3" style={{ width: '100%' }}>
                                    {!isCameraActive ? (
                                        <button 
                                            type="button"
                                            className="btn btn-primary w-full"
                                            style={{ width: '100%', height: '44px', fontSize: '0.88rem', fontWeight: 700 }}
                                            onClick={startCamera}
                                        >
                                            Bật camera quét mã vé
                                        </button>
                                    ) : (
                                        <button 
                                            type="button"
                                            className="btn btn-outline text-danger w-full"
                                            style={{ width: '100%', height: '44px', borderColor: '#FCA5A5', color: '#DC2626', fontWeight: 700 }}
                                            onClick={stopCamera}
                                        >
                                            Tắt camera quét
                                        </button>
                                    )}
                                </div>

                                <div className="ticket-status-indicator justify-center w-full mb-1" style={{ width: '100%', justifyContent: 'center' }}>
                                    <span className={`ticket-status-dot ${isCameraActive ? 'active' : ''}`}></span>
                                    <span>{qrScanStatus}</span>
                                </div>
                            </div>

                            {/* Form nhập mã vé thủ công */}
                            <form className="ticket-form mt-2" onSubmit={handleManualCodeSubmit}>
                                <div className="ticket-form-group">
                                    <div className="ticket-input-wrapper">
                                        <input 
                                            type="text" 
                                            className="ticket-input-styled" 
                                            placeholder="ZG-YYYYMMDD-XXXXXXXX hoặc ZOO-XXXX" 
                                            required 
                                            autoComplete="off"
                                            value={inputCode}
                                            onChange={(e) => setInputCode(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div className="alert alert-danger mb-3 p-2.5 text-xs flex items-center gap-2" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px' }}>
                                        <span className="font-semibold">{errorMsg}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn-ticket-submit" 
                                    disabled={isValidatingTicket}
                                    style={{ background: '#15803D' }}
                                >
                                    {isValidatingTicket ? 'Đang xác thực với máy chủ...' : 'Kích hoạt mã vé này'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: THẺ THAM QUAN ĐIỆN TỬ (E-TICKET PASS) */}
                <div className="ticket-pass-wrapper">
                    <div className="ticket-info-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                        <div className="ticket-pass-top">
                            <div className="ticket-card-header">
                                <div>
                                    <span className="ticket-brand-badge">
                                        THẢO CẦM VIÊN SÀI GÒN
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

                            {/* Mã vé hiện thời */}
                            <div className="ticket-code-banner">
                                <div className="ticket-code-label-group">
                                    <span className="ticket-code-sublabel">Mã vé tham quan</span>
                                    <span className="ticket-code-hint">
                                        {hasActiveSession ? 'Đã kích hoạt trên hệ thống' : 'Mua vé trực tuyến hoặc quét mã để kích hoạt'}
                                    </span>
                                </div>
                                <div className={`ticket-code-display ${!hasActiveSession ? 'empty-state' : ''}`}>
                                    {hasActiveSession ? currentSession.ticketCode : 'CHƯA CÓ VÉ'}
                                </div>
                            </div>

                            {/* Chi tiết người dùng & thời hạn */}
                            <div className="ticket-detail-grid">
                                <div className="ticket-info-item">
                                    <span className="ticket-meta-label">Chủ vé</span>
                                    <p className="ticket-meta-val">
                                        {hasActiveSession ? (currentSession.customerName || 'Khách tham quan') : '—'}
                                    </p>
                                </div>
                                <div className="ticket-info-item">
                                    <span className="ticket-meta-label">Hạng vé</span>
                                    <p className="ticket-meta-val">
                                        {hasActiveSession ? currentSession.ticketType : 'Chưa kích hoạt'}
                                    </p>
                                </div>
                                <div className="ticket-info-item">
                                    <span className="ticket-meta-label">Thời hạn phiên</span>
                                    <p className="ticket-meta-val">
                                        {hasActiveSession ? (currentSession.expiresAt ? currentSession.expiresAt.slice(0, 19).replace('T', ' ') : currentSession.validDate) : '—'}
                                    </p>
                                </div>
                                <div className="ticket-info-item">
                                    <span className="ticket-meta-label">Trạng thái</span>
                                    <p className={`ticket-meta-val ${hasActiveSession ? 'text-success' : 'text-pending'}`}>
                                        {hasActiveSession ? 'Hợp lệ' : 'Chưa kích hoạt'}
                                    </p>
                                </div>
                            </div>

                            {/* Quyền lợi tham quan */}
                            <div className="ticket-perks-box">
                                <div className="ticket-perks-header">
                                    <span>Quyền lợi tham quan số:</span>
                                </div>
                                <ul className="ticket-perks-list">
                                    <li>
                                        <span>Thuyết minh Audio đa ngôn ngữ tự động định vị GPS</span>
                                    </li>
                                    <li>
                                        <span>Bản đồ địa lý thực tế dẫn đường khuôn viên sở thú</span>
                                    </li>
                                    <li>
                                        <span>Trợ lý ảo AI ZooGuide hỗ trợ hỏi đáp</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Rãnh xé vé giả lập */}
                        <div className="ticket-perforation-divider" aria-hidden="true">
                            <div className="ticket-notch ticket-notch-left"></div>
                            <div className="ticket-perforation-line"></div>
                            <div className="ticket-notch ticket-notch-right"></div>
                        </div>

                        {/* Đuôi vé & Nút kết thúc phiên */}
                        <div className="ticket-pass-bottom">
                            {hasActiveSession && (
                                <button 
                                    type="button"
                                    className="btn-ticket-end" 
                                    onClick={handleExitSession}
                                >
                                    Kết thúc phiên tham quan
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL XÁC NHẬN HOÀN TẤT GIAO DỊCH */}
            {orderSuccessModal && currentOrder && (
                <div className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
                    <div className="modal-backdrop" onClick={() => setOrderSuccessModal(false)}></div>
                    <div className="modal-dialog" style={{ maxWidth: '520px', borderRadius: '20px', overflow: 'hidden' }}>
                        <div style={{ background: '#15803D', color: '#FFFFFF', padding: '22px', textAlign: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Thanh Toán Thành Công</h3>
                            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                                Đơn hàng <strong>{currentOrder.orderCode}</strong> đã được xác nhận thanh toán qua VietQR.
                            </p>
                        </div>

                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#475569', marginBottom: '8px' }}>
                                    MÃ VÉ ĐIỆN TỬ ĐÃ CẤP TỰ ĐỘNG:
                                </label>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {currentOrder.tickets && currentOrder.tickets.length > 0 ? (
                                        currentOrder.tickets.map((t, idx) => (
                                            <div
                                                key={t.ticketId || idx}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: '#F0FDF4',
                                                    border: '1px solid #86EFAC',
                                                    padding: '10px 14px',
                                                    borderRadius: '10px'
                                                }}
                                            >
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>Vé #{idx + 1} ({t.ticketTypeName || 'Chuẩn'})</span>
                                                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                                                        {t.ticketCode}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(t.ticketCode);
                                                        showToast(`Đã sao chép mã vé: ${t.ticketCode}`, "info");
                                                    }}
                                                    style={{
                                                        padding: '5px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #CBD5E1',
                                                        background: '#FFF',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Sao chép mã
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', fontSize: '0.85rem' }}>
                                            Mã vé đang được hệ thống xuất bản.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Nút Kích Hoạt Ngay */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '18px' }}>
                                {currentOrder.tickets && currentOrder.tickets.length > 0 && (
                                    <button
                                        type="button"
                                        disabled={isValidatingTicket}
                                        onClick={() => handleActivatePurchasedTicket(currentOrder.tickets[0].ticketCode)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            background: '#15803D',
                                            color: '#FFFFFF',
                                            border: 'none',
                                            fontWeight: 800,
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(21,128,61,0.2)'
                                        }}
                                    >
                                        {isValidatingTicket ? 'Đang kích hoạt...' : 'Kích hoạt phiên tham quan ngay'}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOrderSuccessModal(false);
                                        setCurrentOrder(null);
                                    }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '10px',
                                        background: '#F1F5F9',
                                        color: '#475569',
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
                    </div>
                </div>
            )}
        </section>
    );
}
