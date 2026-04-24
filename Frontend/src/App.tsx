import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { StudentDashboard } from './pages/StudentDashboard';
import { MentorDashboard } from './pages/MentorDashboard';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';

const FullPageLoader = () => (
    <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
    </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <FullPageLoader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <FullPageLoader />;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

function App() {
    const { user } = useAuth();
    const userRole = user?.role;

    return (
        <Router>
            <Routes>
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><AuthPage /></PublicRoute>} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            {/* FIXED: Check for both MENTOR and SUPER_ADMIN */}
                            {userRole === 'MENTOR' || userRole === 'SUPER_ADMIN'
                                ? <MentorDashboard />
                                : <StudentDashboard />
                            }
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Routes>
        </Router>
    );
}

export default App;
