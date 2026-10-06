import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Visitor Portal
import VisitorPortal from './pages/visitor/VisitorPortal';

// Admin Portal & Pages
import AdminLayout from './components/admin/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSpeciesPage from './pages/admin/AdminSpeciesPage';
import AdminAnimalsPage from './pages/admin/AdminAnimalsPage';
import AdminAreasPage from './pages/admin/AdminAreasPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminTicketTypesPage from './pages/admin/AdminTicketTypesPage';
import AdminTicketSessionsPage from './pages/admin/AdminTicketSessionsPage';
import AdminNarrationPage from './pages/admin/AdminNarrationPage';

// Common Global Feedback
import ToastContainer from './components/common/ToastContainer';

export default function App() {
    return (
        <>
            <Routes>
                {/* Visitor Routes */}
                <Route path="/" element={<VisitorPortal />} />

                {/* Admin Management Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="species" element={<AdminSpeciesPage />} />
                    <Route path="animals" element={<AdminAnimalsPage />} />
                    <Route path="areas" element={<AdminAreasPage />} />
                    <Route path="tickets" element={<AdminTicketsPage />} />
                    <Route path="ticket-types" element={<AdminTicketTypesPage />} />
                    <Route path="ticket-sessions" element={<AdminTicketSessionsPage />} />
                    <Route path="narration" element={<AdminNarrationPage />} />
                </Route>

                {/* Catch-all redirect to Visitor */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global Toast Container */}
            <ToastContainer />
        </>
    );
}
