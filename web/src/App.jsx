import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Visitor Portal
import VisitorPortal from './pages/visitor/VisitorPortal';

// Admin Portal & Pages
import AdminLayout from './components/admin/layout/AdminLayout';
import AdminProtectedRoute from './components/admin/layout/AdminProtectedRoute';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSpeciesPage from './pages/admin/AdminSpeciesPage';
import AdminAnimalsPage from './pages/admin/AdminAnimalsPage';
import AdminAreasPage from './pages/admin/AdminAreasPage';
import AdminPoisPage from './pages/admin/AdminPoisPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminTicketTypesPage from './pages/admin/AdminTicketTypesPage';
import AdminTicketSessionsPage from './pages/admin/AdminTicketSessionsPage';
import AdminNarrationPage from './pages/admin/AdminNarrationPage';

// Common Global Feedback & Device Monitoring
import ToastContainer from './components/common/ToastContainer';
import OfflineBanner from './components/common/OfflineBanner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { initDeviceTracker } from './services/deviceTracker';

export default function App() {
    // Start truthful active-device heartbeat monitoring
    useEffect(() => {
        const cleanup = initDeviceTracker();
        return cleanup;
    }, []);

    return (
        <>
            {/* Global Online/Offline Banner */}
            <OfflineBanner />

            <ErrorBoundary title="Đã xảy ra sự cố trong ứng dụng ZooGuide">
                <Routes>
                    {/* Visitor Routes */}
                    <Route path="/" element={<VisitorPortal />} />

                    {/* Admin Login Route */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />

                    {/* Protected Admin Management Routes */}
                    <Route path="/admin" element={<AdminProtectedRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route index element={<AdminDashboardPage />} />
                            <Route path="species" element={<AdminSpeciesPage />} />
                            <Route path="animals" element={<AdminAnimalsPage />} />
                            <Route path="areas" element={<AdminAreasPage />} />
                            <Route path="pois" element={<AdminPoisPage />} />
                            <Route path="tickets" element={<AdminTicketsPage />} />
                            <Route path="ticket-types" element={<AdminTicketTypesPage />} />
                            <Route path="ticket-sessions" element={<AdminTicketSessionsPage />} />
                            <Route path="narration" element={<AdminNarrationPage />} />
                        </Route>
                    </Route>

                    {/* Catch-all redirect to Visitor */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ErrorBoundary>

            {/* Global Toast Container */}
            <ToastContainer />
        </>
    );
}
