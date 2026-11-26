import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    ZooApi,
    getAuthToken,
    getStoredUser,
    clearAuthSession,
    checkAdminSessionValidity,
    recordAdminActivity
} from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AdminChangePasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const appContext = useApp();
    const showToast = appContext?.showToast;

    const [isVerifyingSession, setIsVerifyingSession] = useState(true);
    const [currentUser, setCurrentUser] = useState(() => getStoredUser());
    const [mustChangePassword, setMustChangePassword] = useState(() => Boolean(getStoredUser()?.mustChangePassword));

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const params = new URLSearchParams(location.search);
    const rawRedirect = params.get('redirect') || '/admin';
    const redirectPath = rawRedirect.startsWith('/admin/change-password') || rawRedirect.startsWith('/admin/login')
        ? '/admin'
        : rawRedirect;

    useEffect(() => {
        let isMounted = true;

        const verifyAuth = async () => {
            const validity = checkAdminSessionValidity();
            const token = getAuthToken();
            if (!validity.valid || !token) {
                clearAuthSession();
                if (isMounted) {
                    navigate('/admin/login?reason=session_expired', { replace: true });
                }
                return;
            }

            const stored = getStoredUser();
            if (stored && stored.role !== 'Admin' && stored.role !== 'Staff') {
                clearAuthSession();
                if (isMounted) {
                    navigate('/admin/login?reason=unauthorized', { replace: true });
                }
                return;
            }

            try {
                const res = await ZooApi.getCurrentUser();
                if (!isMounted) return;

                const profile = res.user || res.data;
                if (!res.success || !profile || (profile.role !== 'Admin' && profile.role !== 'Staff')) {
                    clearAuthSession();
                    navigate('/admin/login?reason=unauthorized', { replace: true });
                    return;
                }

                setCurrentUser(profile);
                setMustChangePassword(Boolean(res.mustChangePassword || profile.mustChangePassword));
                setIsVerifyingSession(false);
            } catch {
                if (!isMounted) return;
                if (stored && (stored.role === 'Admin' || stored.role === 'Staff')) {
                    setCurrentUser(stored);
                    setMustChangePassword(Boolean(stored.mustChangePassword));
                    setIsVerifyingSession(false);
                } else {
                    clearAuthSession();
                    navigate('/admin/login?reason=session_expired', { replace: true });
                }
            }
        };

        verifyAuth();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    // Chặn nút Back của trình duyệt quay lại các trang quản trị khi chưa hoàn tất đổi mật khẩu bắt buộc
    useEffect(() => {
        if (!mustChangePassword || Boolean(successMessage) || typeof window === 'undefined') {
            return undefined;
        }

        const currentUrl = `${location.pathname}${location.search || ''}`;
        try {
            window.history.pushState({ mandatoryPasswordChange: true }, '', currentUrl);
        } catch {
            // Ignore history state errors
        }

        const handlePopState = () => {
            try {
                window.history.pushState({ mandatoryPasswordChange: true }, '', currentUrl);
            } catch {
                navigate(currentUrl, { replace: true });
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [mustChangePassword, successMessage, location.pathname, location.search, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        recordAdminActivity(true);

        if (!currentPassword) {
            setErrorMessage('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }
        if (!newPassword) {
            setErrorMessage('Vui lòng nhập mật khẩu mới.');
            return;
        }
        if (newPassword.length < 6) {
            setErrorMessage('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.');
            return;
        }
        if (!confirmPassword) {
            setErrorMessage('Vui lòng nhập xác nhận mật khẩu mới.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMessage('Mật khẩu mới và xác nhận mật khẩu không khớp.');
            return;
        }
        if (currentPassword === newPassword) {
            setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await ZooApi.changePassword(currentPassword, newPassword, confirmPassword);
            if (res.success) {
                const msg = res.message || 'Đổi mật khẩu thành công! Đang chuyển vào hệ thống quản trị...';
                setSuccessMessage(msg);
                setMustChangePassword(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                if (typeof showToast === 'function') {
                    showToast('Đổi mật khẩu quản trị thành công!', 'success');
                }
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 900);
            } else {
                if (res.status === 401) {
                    clearAuthSession();
                    navigate('/admin/login?reason=session_expired', { replace: true });
                    return;
                }
                setErrorMessage(res.message || 'Đổi mật khẩu không thành công. Vui lòng kiểm tra lại.');
            }
        } catch (err) {
            console.error('Change password error:', err);
            setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await ZooApi.logout({ reason: 'manual_logout' });
        navigate('/admin/login', { replace: true });
    };

    if (isVerifyingSession) {
        return (
            <div className="admin-loading-screen" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#0F172A',
                color: '#E2E8F0',
                gap: '16px'
            }}>
                <div className="admin-spinner" style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#10B981',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <p style={{ fontSize: '14px', color: '#94A3B8' }}>Đang kiểm tra trạng thái tài khoản quản trị...</p>
            </div>
        );
    }

    const renderEyeIcon = (isVisible) => (
        isVisible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        )
    );

    const toggleBtnStyle = {
        position: 'absolute',
        right: '10px',
        background: 'transparent',
        border: 'none',
        color: '#64748B',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-card" style={{ maxWidth: '460px' }}>
                <div className="admin-login-header">
                    <div className="admin-login-logo">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <h1 className="admin-login-title">Change Password</h1>
                    <p className="admin-login-subtitle">
                        {currentUser?.username
                            ? `Tài khoản: ${currentUser.fullName || currentUser.username} (${currentUser.role})`
                            : 'Đổi mật khẩu bảo mật tài khoản quản trị ZooGuide'}
                    </p>
                </div>

                {mustChangePassword && !successMessage && (
                    <div
                        role="status"
                        data-testid="password-expired-banner"
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            background: '#FFFBEB',
                            border: '1px solid #FCD34D',
                            color: '#92400E',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            fontSize: '0.84rem',
                            lineHeight: '1.45',
                            marginBottom: '18px'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '2px' }}>
                                Your password has expired. Please change your password to continue.
                            </strong>
                            <span>
                                Mật khẩu quản trị đã quá thời hạn 24 giờ. Vui lòng đổi mật khẩu mới để tiếp tục sử dụng hệ thống quản trị.
                            </span>
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <div className="admin-login-alert" role="alert">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {successMessage && (
                    <div
                        role="alert"
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            background: '#ECFDF5',
                            border: '1px solid #6EE7B7',
                            color: '#065F46',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            lineHeight: '1.4',
                            marginBottom: '20px'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '1px' }}>
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
                    <div className="admin-form-group">
                        <label htmlFor="admin-current-password">Current Password (Mật khẩu hiện tại)</label>
                        <div className="admin-input-wrapper">
                            <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input
                                id="admin-current-password"
                                name="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                className="admin-form-input"
                                style={{ paddingRight: '42px' }}
                                placeholder="Nhập mật khẩu hiện tại"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoComplete="current-password"
                                autoFocus
                                required
                                disabled={isSubmitting || Boolean(successMessage)}
                            />
                            <button
                                type="button"
                                style={toggleBtnStyle}
                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                aria-label={showCurrentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                                tabIndex={-1}
                            >
                                {renderEyeIcon(showCurrentPassword)}
                            </button>
                        </div>
                    </div>

                    <div className="admin-form-group">
                        <label htmlFor="admin-new-password">New Password (Mật khẩu mới)</label>
                        <div className="admin-input-wrapper">
                            <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            <input
                                id="admin-new-password"
                                name="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                className="admin-form-input"
                                style={{ paddingRight: '42px' }}
                                placeholder="Tối thiểu 6 ký tự, khác mật khẩu cũ"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                                disabled={isSubmitting || Boolean(successMessage)}
                            />
                            <button
                                type="button"
                                style={toggleBtnStyle}
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                                tabIndex={-1}
                            >
                                {renderEyeIcon(showNewPassword)}
                            </button>
                        </div>
                    </div>

                    <div className="admin-form-group">
                        <label htmlFor="admin-confirm-password">Confirm New Password (Xác nhận mật khẩu mới)</label>
                        <div className="admin-input-wrapper">
                            <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            <input
                                id="admin-confirm-password"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="admin-form-input"
                                style={{ paddingRight: '42px' }}
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                                disabled={isSubmitting || Boolean(successMessage)}
                            />
                            <button
                                type="button"
                                style={toggleBtnStyle}
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                                tabIndex={-1}
                            >
                                {renderEyeIcon(showConfirmPassword)}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="admin-login-submit-btn"
                        disabled={isSubmitting || Boolean(successMessage)}
                    >
                        {isSubmitting ? (
                            <span className="admin-login-btn-loading">
                                <span className="admin-spinner"></span>
                                Đang cập nhật mật khẩu...
                            </span>
                        ) : (
                            'Change Password'
                        )}
                    </button>
                </form>

                <div className="admin-login-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    {!mustChangePassword ? (
                        <Link to={redirectPath} className="admin-login-back-link">
                            ← Quay lại Trang Quản Trị
                        </Link>
                    ) : (
                        <Link to="/" className="admin-login-back-link">
                            ← Trang Khách Tham Quan
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
