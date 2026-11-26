import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ZooApi from '../../services/api';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Determine redirect path
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get('redirect') || '/admin';
    const reason = params.get('reason');

    useEffect(() => {
        // If already authenticated and token valid, check whether password change is required
        if (ZooApi.isAuthenticated()) {
            const storedUser = ZooApi.getStoredUser();
            if (storedUser?.mustChangePassword) {
                const target = redirectPath && redirectPath !== '/admin/change-password'
                    ? `/admin/change-password?redirect=${encodeURIComponent(redirectPath)}`
                    : '/admin/change-password';
                navigate(target, { replace: true });
            } else {
                navigate(redirectPath, { replace: true });
            }
        }
        if (
            reason === 'session_expired' ||
            reason === 'inactivity_timeout' ||
            reason === 'absolute_timeout'
        ) {
            setErrorMessage('Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
        } else if (reason === 'unauthorized') {
            setErrorMessage('Bạn cần đăng nhập bằng tài khoản quản trị để tiếp tục.');
        }
    }, [navigate, redirectPath, reason]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const trimmedUser = username.trim();
        if (!trimmedUser) {
            setErrorMessage('Vui lòng nhập tên đăng nhập.');
            return;
        }
        if (!password) {
            setErrorMessage('Vui lòng nhập mật khẩu.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await ZooApi.login(trimmedUser, password);
            if (res.success) {
                // Ensure user role is Admin or Staff
                const user = res.user || res.data?.user;
                const role = user?.role;
                if (role !== 'Admin' && role !== 'Staff') {
                    ZooApi.logout();
                    setErrorMessage('Tài khoản của bạn không có quyền truy cập khu vực quản trị.');
                    setIsLoading(false);
                    return;
                }
                const mustChangePassword = Boolean(
                    res.mustChangePassword ||
                    res.data?.mustChangePassword ||
                    user?.mustChangePassword
                );
                if (mustChangePassword) {
                    const target = redirectPath && redirectPath !== '/admin' && redirectPath !== '/admin/change-password'
                        ? `/admin/change-password?redirect=${encodeURIComponent(redirectPath)}`
                        : '/admin/change-password';
                    navigate(target, { replace: true });
                    return;
                }
                navigate(redirectPath, { replace: true });
            } else {
                setErrorMessage(res.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setErrorMessage('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-card">
                {/* Brand header */}
                <div className="admin-login-header">
                    <div className="admin-login-logo">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <h1 className="admin-login-title">ZooGuide Admin</h1>
                    <p className="admin-login-subtitle">Hệ thống Quản Trị & Điều Hành Vườn Thú Sài Gòn</p>
                </div>

                {/* Error Banner */}
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
                    <div className="admin-form-group">
                        <label htmlFor="admin-username">Tên đăng nhập</label>
                        <div className="admin-input-wrapper">
                            <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <input
                                id="admin-username"
                                type="text"
                                className="admin-form-input"
                                placeholder="Ví dụ: admin hoặc staff_hoang"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                autoFocus
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="admin-form-group">
                        <label htmlFor="admin-password">Mật khẩu</label>
                        <div className="admin-input-wrapper">
                            <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input
                                id="admin-password"
                                type="password"
                                className="admin-form-input"
                                placeholder="Nhập mật khẩu quản trị"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="admin-login-options">
                        <label className="admin-checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                            />
                            <span>Ghi nhớ phiên đăng nhập</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="admin-login-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="admin-login-btn-loading">
                                <span className="admin-spinner"></span>
                                Đang xác thực...
                            </span>
                        ) : (
                            'Đăng Nhập Quản Trị'
                        )}
                    </button>
                </form>

                {/* Footer link back to visitor site */}
                <div className="admin-login-footer">
                    <Link to="/" className="admin-login-back-link">
                        ← Quay lại Trang Khách Tham Quan
                    </Link>
                </div>
            </div>
        </div>
    );
}
