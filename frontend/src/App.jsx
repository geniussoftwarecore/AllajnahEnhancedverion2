import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from './api/axios';
import useRTL from './hooks/useRTL';
import PageTransition from './components/PageTransition';
import LoadingFallback from './components/LoadingFallback';
import Login from './pages/Login';
import Register from './pages/Register';
import Setup from './pages/Setup';

const TraderDashboard = lazy(() => import('./pages/TraderDashboard'));
const TraderSubscription = lazy(() => import('./pages/TraderSubscription'));
const TechnicalCommitteeDashboard = lazy(() => import('./pages/TechnicalCommitteeDashboard'));
const HigherCommitteeDashboard = lazy(() => import('./pages/HigherCommitteeDashboard'));
const UsersManagement = lazy(() => import('./pages/Admin/UsersManagement'));
const PaymentsReview = lazy(() => import('./pages/Admin/PaymentsReview'));
const Settings = lazy(() => import('./pages/Admin/Settings'));
const Analytics = lazy(() => import('./pages/Admin/Analytics'));
const AuditLog = lazy(() => import('./pages/Admin/AuditLog'));

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await api.get('setup/status');
        setNeedsSetup(response.data.needs_setup);
        localStorage.setItem('setup_completed', (!response.data.needs_setup).toString());
      } catch (error) {
        console.error('Failed to check setup status:', error);
        const storedStatus = localStorage.getItem('setup_completed');
        if (storedStatus === 'true') {
          setNeedsSetup(false);
        }
      } finally {
        setSetupLoading(false);
      }
    };

    checkSetupStatus();
  }, []);

  if (setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/setup" element={<PageTransition><Setup /></PageTransition>} />
          <Route path="*" element={<Navigate to="/setup" />} />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
        <Route path="/setup" element={<Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <PageTransition><Register /></PageTransition>} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              {user?.role === 'trader' && <TraderDashboard />}
              {user?.role === 'technical_committee' && <TechnicalCommitteeDashboard />}
              {user?.role === 'higher_committee' && <HigherCommitteeDashboard />}
              {!user && <Navigate to="/login" />}
            </PrivateRoute>
          }
        />
        
        {/* Trader Routes */}
        <Route
          path="/subscription"
          element={
            <PrivateRoute allowedRoles={['trader']}>
              <TraderSubscription />
            </PrivateRoute>
          }
        />

        {/* Higher Committee Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['higher_committee']}>
              <UsersManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <PrivateRoute allowedRoles={['higher_committee']}>
              <PaymentsReview />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute allowedRoles={['higher_committee']}>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <PrivateRoute allowedRoles={['higher_committee']}>
              <Analytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/audit-log"
          element={
            <PrivateRoute allowedRoles={['higher_committee']}>
              <AuditLog />
            </PrivateRoute>
          }
        />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function AppContent() {
  const { isRTL } = useRTL();
  
  return (
    <div className="min-h-screen">
      <AppRoutes />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={isRTL}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
