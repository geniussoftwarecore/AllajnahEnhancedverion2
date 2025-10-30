import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import axios from './api/axios';
import Login from './pages/Login';
import Register from './pages/Register';
import Setup from './pages/Setup';
import TraderDashboard from './pages/TraderDashboard';
import TechnicalCommitteeDashboard from './pages/TechnicalCommitteeDashboard';
import HigherCommitteeDashboard from './pages/HigherCommitteeDashboard';

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
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await axios.get('/setup/status');
        setNeedsSetup(response.data.needs_setup);
      } catch (error) {
        console.error('Failed to check setup status:', error);
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
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/setup" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/setup" element={<Navigate to="/login" />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      
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
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50" dir="rtl">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
