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
import MerchantRegister from './pages/MerchantRegister';

const TraderDashboard = lazy(() => import('./pages/TraderDashboard'));
const TraderSubscription = lazy(() => import('./pages/TraderSubscription'));
const TechnicalCommitteeDashboard = lazy(() => import('./pages/TechnicalCommitteeDashboard'));
const HigherCommitteeDashboard = lazy(() => import('./pages/HigherCommitteeDashboard'));
const TaskQueue = lazy(() => import('./pages/TaskQueue'));
const ApprovalManagement = lazy(() => import('./pages/ApprovalManagement'));
const UsersManagement = lazy(() => import('./pages/Admin/UsersManagement'));
const PaymentsReview = lazy(() => import('./pages/Admin/PaymentsReview'));
const Settings = lazy(() => import('./pages/Admin/Settings'));
const Analytics = lazy(() => import('./pages/Admin/Analytics'));
const AuditLog = lazy(() => import('./pages/Admin/AuditLog'));
const QuickReplies = lazy(() => import('./pages/Admin/QuickReplies'));
const ComplaintList = lazy(() => import('./components/ComplaintList'));
const ComplaintForm = lazy(() => import('./components/ComplaintForm'));
const ComplaintDetail = lazy(() => import('./components/ComplaintDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const UserSettings = lazy(() => import('./pages/UserSettings'));
const MerchantApprovals = lazy(() => import('./pages/MerchantApprovals'));

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
        <Route path="/register-merchant" element={user ? <Navigate to="/" /> : <PageTransition><MerchantRegister /></PageTransition>} />
        
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
        
        {/* Complaint Routes */}
        <Route
          path="/complaints"
          element={
            <PrivateRoute allowedRoles={['trader', 'technical_committee', 'higher_committee']}>
              <ComplaintList />
            </PrivateRoute>
          }
        />
        <Route
          path="/complaints/new"
          element={
            <PrivateRoute allowedRoles={['trader']}>
              <ComplaintForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/complaints/:id"
          element={
            <PrivateRoute allowedRoles={['trader', 'technical_committee', 'higher_committee']}>
              <ComplaintDetail />
            </PrivateRoute>
          }
        />

        {/* User Profile Routes */}
        <Route
          path="/profile"
          element={
            <PrivateRoute allowedRoles={['trader', 'technical_committee', 'higher_committee']}>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute allowedRoles={['trader', 'technical_committee', 'higher_committee']}>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute allowedRoles={['trader', 'technical_committee', 'higher_committee']}>
              <UserSettings />
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

        {/* Task Queue Routes */}
        <Route
          path="/task-queue"
          element={
            <PrivateRoute allowedRoles={['technical_committee', 'higher_committee']}>
              <TaskQueue />
            </PrivateRoute>
          }
        />

        {/* Approval Management Routes */}
        <Route
          path="/approvals"
          element={
            <PrivateRoute allowedRoles={['higher_committee']}>
              <ApprovalManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/merchant-approvals"
          element={
            <PrivateRoute allowedRoles={['higher_committee']}>
              <MerchantApprovals />
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
        <Route
          path="/admin/quick-replies"
          element={
            <PrivateRoute allowedRoles={['technical_committee', 'higher_committee']}>
              <QuickReplies />
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
