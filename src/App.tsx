import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import MentorDashboard from './pages/MentorDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

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

  // Safely cast user to any to bypass the missing 'role' type definition for now
  const userRole = (user as any)?.role;

  return (
    <Router>
      <Routes>
        
        {/* PUBLIC ROUTES */}
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        
        {/* PROTECTED ROUTE: Master Dashboard Switcher */}
        <Route 
            path="/dashboard" 
            element={
                <ProtectedRoute>
                    {userRole === 'MENTOR' ? <MentorDashboard /> : <Dashboard />}
                </ProtectedRoute>
            } 
        />

        {/* DEFAULT FALLBACK */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;