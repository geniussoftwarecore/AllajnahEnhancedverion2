import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
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
import { queryClient } from './lib/queryClient';

const TraderDashboard = lazy(() => import('./pages/TraderDashboard'));
const TraderSubscription = lazy(() => import('./pages/TraderSubscription'));
const SubscriptionPayment = lazy(() => import('./pages/SubscriptionPayment'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
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
        const storedStatus = localStorage.getItem('setup_completed');
        if (storedStatus === 'true') {
          setNeedsSetup(false);
          setSetupLoading(false);
          return;
        }

        const response = await api.get('setup/status');
        const needsSetupValue = response.data.needs_setup;
        setNeedsSetup(needsSetupValue);
        localStorage.setItem('setup_completed', (!needsSetupValue).toString());
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
              {user?.role === 'TRADER' && <TraderDashboard />}
              {user?.role === 'TECHNICAL_COMMITTEE' && <TechnicalCommitteeDashboard />}
              {user?.role === 'HIGHER_COMMITTEE' && <HigherCommitteeDashboard />}
              {!user && <Navigate to="/login" />}
            </PrivateRoute>
          }
        />
        
        {/* Complaint Routes */}
        <Route
          path="/complaints"
          element={
            <PrivateRoute allowedRoles={['TRADER', 'TECHNICAL_COMMITTEE', 'HIGHER_COMMITTEE']}>
              <ComplaintList />
            </PrivateRoute>
          }
        />
        <Route
          path="/complaints/new"
          element={
            <PrivateRoute allowedRoles={['TRADER']}>
              <ComplaintForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/complaints/:id"
          element={
            <PrivateRoute allowedRoles={['TRADER', 'TECHNICAL_COMMITTEE', 'HIGHER_COMMITTEE']}>
              <ComplaintDetail />
            </PrivateRoute>
          }
        />

        {/* User Profile Routes */}
        <Route
          path="/profile"
          element={
            <PrivateRoute allowedRoles={['TRADER', 'TECHNICAL_COMMITTEE', 'HIGHER_COMMITTEE']}>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute allowedRoles={['TRADER', 'TECHNICAL_COMMITTEE', 'HIGHER_COMMITTEE']}>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute allowedRoles={['TRADER', 'TECHNICAL_COMMITTEE', 'HIGHER_COMMITTEE']}>
              <UserSettings />
            </PrivateRoute>
          }
        />

        {/* Trader Routes */}
        <Route
          path="/subscription"
          element={
            <PrivateRoute allowedRoles={['TRADER']}>
              <TraderSubscription />
            </PrivateRoute>
          }
        />
        <Route
          path="/subscription-payment"
          element={
            <PrivateRoute allowedRoles={['TRADER']}>
              <SubscriptionPayment />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <PrivateRoute allowedRoles={['TRADER']}>
              <PaymentSuccess />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment-cancel"
          element={
            <PrivateRoute allowedRoles={['TRADER']}>
              <PaymentCancel />
            </PrivateRoute>
          }
        />

        {/* Task Queue Routes */}
        <Route
          path="/task-queue"
          element={
            <PrivateRoute allowedRoles={['TECHNICAL_COMMITTEE', 'HIGHER_COMMITTEE']}>
              <TaskQueue />
            </PrivateRoute>
          }
        />

        {/* Approval Management Routes */}
        <Route
          path="/approvals"
          element={
            <PrivateRoute allowedRoles={['HIGHER_COMMITTEE']}>
              <ApprovalManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/merchant-approvals"
          element={
            <PrivateRoute allowedRoles={['HIGHER_COMMITTEE']}>
              <MerchantApprovals />
            </PrivateRoute>
          }
        />

        {/* Higher Committee Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['HIGHER_COMMITTEE']}>
              <UsersManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <PrivateRoute allowedRoles={['HIGHER_COMMITTEE']}>
              <PaymentsReview />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute allowedRoles={['HIGHER_COMMITTEE']}>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <PrivateRoute allowedRoles={['HIGHER_COMMITTEE']}>
              <Analytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/audit-log"
          element={
            <PrivateRoute allowedRoles={['HIGHER_COMMITTEE']}>
              <AuditLog />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/quick-replies"
          element={
            <PrivateRoute allowedRoles={['TECHNICAL_COMMITTEE', 'HIGHER_COMMITTEE']}>
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
