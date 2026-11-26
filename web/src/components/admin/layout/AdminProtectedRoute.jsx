import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import {
    ZooApi,
    getAuthToken,
    getStoredUser,
    clearAuthSession,
    checkAdminSessionValidity,
    AUTH_STORAGE_KEY,
    AUTH_SESSION_META_KEY,
    AUTH_BROADCAST_CHANNEL
} from '../../../services/api';

export default function AdminProtectedRoute() {
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [redirectReason, setRedirectReason] = useState('unauthorized');

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            const validity = checkAdminSessionValidity();
            if (!validity.valid) {
                const isExpired =
                    validity.reason === 'inactivity_timeout' ||
                    validity.reason === 'absolute_timeout' ||
                    validity.reason === 'session_expired' ||
                    validity.reason === 'invalid_token';
                clearAuthSession();
                if (isMounted) {
                    setRedirectReason(isExpired ? 'session_expired' : 'unauthorized');
                    setIsAuthorized(false);
                    setMustChangePassword(false);
                    setIsVerifying(false);
                }
                return;
            }

            const token = getAuthToken();
            if (!token) {
                if (isMounted) {
                    setRedirectReason('session_expired');
                    setIsAuthorized(false);
                    setMustChangePassword(false);
                    setIsVerifying(false);
                }
                return;
            }

            const storedUser = getStoredUser();
            if (storedUser && storedUser.role !== 'Admin' && storedUser.role !== 'Staff') {
                clearAuthSession();
                if (isMounted) {
                    setRedirectReason('unauthorized');
                    setIsAuthorized(false);
                    setMustChangePassword(false);
                    setIsVerifying(false);
                }
                return;
            }

            try {
                const res = await ZooApi.getCurrentUser();
                if (!isMounted) return;

                const userProfile = res.user || res.data;
                if (res.success && userProfile) {
                    const role = userProfile.role;
                    if (role === 'Admin' || role === 'Staff') {
                        const requireChange = Boolean(res.mustChangePassword || userProfile.mustChangePassword);
                        setMustChangePassword(requireChange);
                        setIsAuthorized(true);
                    } else {
                        clearAuthSession();
                        setRedirectReason('unauthorized');
                        setIsAuthorized(false);
                        setMustChangePassword(false);
                    }
                } else {
                    clearAuthSession();
                    setRedirectReason('session_expired');
                    setIsAuthorized(false);
                    setMustChangePassword(false);
                }
            } catch (err) {
                console.warn('Session verification network error:', err);
                const stillValid = checkAdminSessionValidity().valid;
                if (stillValid && storedUser && (storedUser.role === 'Admin' || storedUser.role === 'Staff')) {
                    // Never allow bypassing mandatory password change on network error
                    setMustChangePassword(Boolean(storedUser.mustChangePassword));
                    setIsAuthorized(true);
                } else {
                    clearAuthSession();
                    setRedirectReason('session_expired');
                    setIsAuthorized(false);
                    setMustChangePassword(false);
                }
            } finally {
                if (isMounted) setIsVerifying(false);
            }
        };

        checkSession();

        const handleUnauthorized = (event) => {
            const reason = event?.detail?.reason;
            clearAuthSession();
            if (isMounted) {
                setRedirectReason(reason === 'manual_logout' ? 'logged_out' : 'session_expired');
                setIsAuthorized(false);
                setMustChangePassword(false);
            }
        };

        const handlePasswordChangeRequired = () => {
            if (isMounted) {
                setMustChangePassword(true);
            }
        };

        const handleStorageChange = (event) => {
            if (
                event.key === null ||
                event.key === AUTH_STORAGE_KEY ||
                event.key === AUTH_SESSION_META_KEY
            ) {
                const validity = checkAdminSessionValidity();
                if (!validity.valid && isMounted) {
                    setRedirectReason('session_expired');
                    setIsAuthorized(false);
                    setMustChangePassword(false);
                }
            }
        };

        let channel = null;
        if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
            try {
                channel = new window.BroadcastChannel(AUTH_BROADCAST_CHANNEL);
                channel.onmessage = (event) => {
                    const msg = event?.data;
                    if (msg?.type === 'ADMIN_SESSION_ENDED' && isMounted) {
                        clearAuthSession();
                        setRedirectReason(msg.reason === 'manual_logout' ? 'logged_out' : 'session_expired');
                        setIsAuthorized(false);
                        setMustChangePassword(false);
                    } else if (msg?.type === 'ADMIN_PASSWORD_CHANGED' && isMounted) {
                        setMustChangePassword(false);
                    }
                };
            } catch {
                channel = null;
            }
        }

        window.addEventListener('zooguide:unauthorized', handleUnauthorized);
        window.addEventListener('zooguide:password-change-required', handlePasswordChangeRequired);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            isMounted = false;
            window.removeEventListener('zooguide:unauthorized', handleUnauthorized);
            window.removeEventListener('zooguide:password-change-required', handlePasswordChangeRequired);
            window.removeEventListener('storage', handleStorageChange);
            if (channel) {
                try {
                    channel.close();
                } catch {}
            }
        };
    }, [location.pathname]);

    if (isVerifying) {
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
                <p style={{ fontSize: '14px', color: '#94A3B8' }}>Đang xác thực quyền truy cập quản trị...</p>
            </div>
        );
    }

    if (!isAuthorized) {
        if (redirectReason === 'logged_out') {
            return <Navigate to="/admin/login" replace />;
        }
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/admin/login?redirect=${redirectParam}&reason=${redirectReason}`} replace />;
    }

    if (mustChangePassword) {
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/admin/change-password?redirect=${redirectParam}`} replace />;
    }

    return <Outlet />;
}
