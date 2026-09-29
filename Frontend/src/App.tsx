import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import type { Role } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';

const StudentDashboard = React.lazy(() =>
    import('./pages/StudentDashboard').then((m) => ({ default: m.StudentDashboard }))
);
const MentorDashboard = React.lazy(() =>
    import('./pages/MentorDashboard').then((m) => ({ default: m.MentorDashboard }))
);
const AuthPage = React.lazy(() =>
    import('./pages/AuthPage').then((m) => ({ default: m.AuthPage }))
);
const LandingPage = React.lazy(() =>
    import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const ContactPage = React.lazy(() =>
    import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const OAuth2RedirectHandler = React.lazy(() =>
    import('./pages/OAuth2RedirectHandler').then((m) => ({ default: m.OAuth2RedirectHandler }))
);

const FullPageLoader = () => (
    <div className="flex h-screen items-center justify-center bg-slate-50" role="status" aria-live="polite" aria-label="Loading">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
    </div>
);

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <FullPageLoader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <FullPageLoader />;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

// Avoids a double redirect: unauthenticated users land on "/" instead of
// bouncing through "/dashboard" -> "/login".
const CatchAllRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <FullPageLoader />;
    return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
};

function DashboardSwitch() {
    const { user } = useAuth();
    const userRole = user?.role;

    if (userRole === 'MENTOR' || userRole === 'SUPER_ADMIN') {
        return <MentorDashboard />;
    }
    return <StudentDashboard />;
}

function App() {
    return (
        <Router>
            <ErrorBoundary>
                <Suspense fallback={<FullPageLoader />}>
                    <Routes>
                        {/* 2. Removed <PublicRoute> so logged-in users can still see the Landing Page */}
                        <Route path="/" element={<LandingPage />} />

                        <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><AuthPage /></PublicRoute>} />
                        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

                        {/* 3. Added the missing Contact route! */}
                        <Route path="/contact" element={<ContactPage />} />

                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['MENTOR', 'SUPER_ADMIN', 'STUDENT']}>
                                    <DashboardSwitch />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<CatchAllRoute />} />

                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
