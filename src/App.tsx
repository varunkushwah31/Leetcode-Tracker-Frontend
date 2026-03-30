import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';

// A sleek, full-screen loading spinner for when the app is verifying tokens
const FullPageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-slate-50">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
  </div>
);

// Guards routes that ONLY logged-in users should see (Dashboards, Classrooms)
const ProtectedRoute = ({children} : {children : React.ReactNode}) => {
  const {isAuthenticated, isLoading} = useAuth();
  if(isLoading) return <FullPageLoader />
  if(!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>
};

// Guards routes that ONLY logged-out users should see (Login, Register)
const PublicRoute = ({children} : {children : React.ReactNode}) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  // If they are already logged in, send them straight to their dashboard
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

const DashboardPlaceholder = () => {
  const {user,logout} = useAuth();
  return(
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-slate-50">
      <h1 className="text-4xl font-bold text-slate-800">Welcome , {user?.name}!</h1>
      <p className="text-slate-500">You have successfully breached the mainframe.</p>
      <button
      onClick={logout}
      className="rounded-lg bg-red-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 shadow-md">
        Secure Logout
      </button>
    </div>
  );
};

const LoginPlaceholder = () => (
    <div className="flex h-screen items-center justify-center text-2xl font-bold text-slate-400">
        Login Page (Building Next...)
    </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* PUBLIC ROUTES */}
        <Route 
            path="/login" 
            element={ <PublicRoute> <LoginPlaceholder /> </PublicRoute> } 
        />
        
        {/* PROTECTED ROUTES */}
        <Route 
            path="/dashboard" 
            element={ <ProtectedRoute> <DashboardPlaceholder /> </ProtectedRoute> } 
        />

        {/* DEFAULT FALLBACK (Catch-all for random URLs) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

        <Route 
            path="/login" 
            element={ <PublicRoute> <Login /> </PublicRoute> } 
        />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;