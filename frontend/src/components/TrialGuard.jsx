import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsivePageShell, LoadingFallback } from './ui';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function TrialGuard({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isValidated, setIsValidated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const validateTrialStatus = async () => {
      try {
        const response = await api.get('/trial/status');
        const status = response.data;
        
        if (status.has_trial && !status.is_active && !status.has_active_subscription) {
          navigate('/subscription', { replace: true });
          return;
        }
        
        setIsValidated(true);
      } catch (error) {
        console.error('Failed to validate trial status:', error);
        navigate('/subscription', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    validateTrialStatus();
  }, [navigate]);

  if (isChecking) {
    return (
      <ResponsivePageShell 
        title={`مرحباً، ${user?.full_name || 'التاجر'}`}
        notificationCount={0}
      >
        <LoadingFallback message="جاري التحقق من حالة الاشتراك..." />
      </ResponsivePageShell>
    );
  }

  if (!isValidated) {
    return null;
  }

  return <>{children}</>;
}

export default TrialGuard;
