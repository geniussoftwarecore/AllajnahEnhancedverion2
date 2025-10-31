import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ResponsivePageShell, StatCard, CTAButton, Alert } from '../components/ui';
import ComplaintForm from '../components/ComplaintForm';
import ComplaintList from '../components/ComplaintList';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CreditCardIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

function TraderDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'complaint_update' || message.type === 'new_comment') {
      setNotification({
        message: message.message || 'تم تحديث شكوى',
        type: 'info'
      });
      setTimeout(() => setNotification(null), 5000);
      loadStats();
    }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      title: 'إجمالي الشكاوى',
      value: stats?.total_complaints || 0,
      icon: DocumentTextIcon,
      color: 'gray',
    },
    {
      title: 'قيد المراجعة',
      value: stats?.under_review || 0,
      icon: ClockIcon,
      color: 'primary',
    },
    {
      title: 'تم التصعيد',
      value: stats?.escalated || 0,
      icon: ArrowTrendingUpIcon,
      color: 'warning',
    },
    {
      title: 'محلولة',
      value: stats?.resolved || 0,
      icon: CheckCircleIcon,
      color: 'success',
    },
    {
      title: 'مرفوضة',
      value: stats?.rejected || 0,
      icon: XCircleIcon,
      color: 'danger',
    },
  ];

  return (
    <ResponsivePageShell 
      title="لوحة التحكم - التاجر"
      notificationCount={notification ? 1 : 0}
    >
      <div className="space-y-6">
        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-success-500' : 'bg-gray-400'} animate-pulse`}></span>
          <span className="text-gray-600 font-medium">{isConnected ? 'متصل' : 'غير متصل'}</span>
        </div>

        <div className="card p-4">
          <Link to="/subscription">
            <CTAButton
              variant="secondary"
              fullWidth
              rightIcon={<CreditCardIcon className="w-5 h-5" />}
            >
              الاشتراك والدفع
            </CTAButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <StatCard key={i} loading={true} />
              ))}
            </>
          ) : (
            statsConfig.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))
          )}
        </div>

        <div className="card p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              شكاواي
            </h2>
            <CTAButton
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? 'outline' : 'primary'}
              rightIcon={showForm ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
            >
              {showForm ? 'إلغاء' : 'تقديم شكوى جديدة'}
            </CTAButton>
          </div>

          <div className="animate-enter">
            {showForm ? (
              <ComplaintForm 
                onSuccess={() => {
                  setShowForm(false);
                  loadStats();
                }}
              />
            ) : (
              <ComplaintList onUpdate={loadStats} />
            )}
          </div>
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default TraderDashboard;
