import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import ZooApi, { getAuthToken, getStoredUser, clearAuthSession } from '../../../services/api';

export default function AdminProtectedRoute() {
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            const token = getAuthToken();
            if (!token) {
                if (isMounted) {
                    setIsAuthorized(false);
                    setIsVerifying(false);
                }
                return;
            }

            const storedUser = getStoredUser();
            if (storedUser && storedUser.role !== 'Admin' && storedUser.role !== 'Staff') {
                clearAuthSession();
                if (isMounted) {
                    setIsAuthorized(false);
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
                        setIsAuthorized(true);
                    } else {
                        clearAuthSession();
                        setIsAuthorized(false);
                    }
                } else {
                    clearAuthSession();
                    setIsAuthorized(false);
                }
            } catch (err) {
                console.warn('Session verification network error:', err);
                // If offline or network error, but token exists and stored role is Admin/Staff, fallback to stored session
                if (storedUser && (storedUser.role === 'Admin' || storedUser.role === 'Staff')) {
                    setIsAuthorized(true);
                } else {
                    clearAuthSession();
                    setIsAuthorized(false);
                }
            } finally {
                if (isMounted) setIsVerifying(false);
            }
        };

        checkSession();

        const handleUnauthorized = () => {
            clearAuthSession();
            setIsAuthorized(false);
        };

        window.addEventListener('zooguide:unauthorized', handleUnauthorized);
        return () => {
            isMounted = false;
            window.removeEventListener('zooguide:unauthorized', handleUnauthorized);
        };
    }, []);

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
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/admin/login?redirect=${redirectParam}&reason=unauthorized`} replace />;
    }

    return <Outlet />;
}
