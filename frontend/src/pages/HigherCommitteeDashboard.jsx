import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ResponsivePageShell, StatCard, Alert, CTAButton } from '../components/ui';
import ComplaintList from '../components/ComplaintList';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserGroupIcon,
  CreditCardIcon,
  CogIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

function HigherCommitteeDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'complaint_update' || message.type === 'new_complaint' || message.type === 'new_comment') {
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

  const adminLinks = [
    { to: '/admin/users', label: 'إدارة المستخدمين', icon: UserGroupIcon, color: 'primary' },
    { to: '/admin/payments', label: 'مراجعة الدفعات', icon: CreditCardIcon, color: 'success' },
    { to: '/admin/analytics', label: 'التحليلات', icon: ChartBarIcon, color: 'secondary' },
    { to: '/admin/audit-log', label: 'سجل التدقيق', icon: ClipboardDocumentListIcon, color: 'gray' },
    { to: '/admin/settings', label: 'الإعدادات', icon: CogIcon, color: 'gray' },
  ];

  return (
    <ResponsivePageShell 
      title="لوحة اللجنة العليا"
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">الإدارة</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {adminLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <CTAButton
                  variant="outline"
                  fullWidth
                  size="sm"
                  rightIcon={<link.icon className="w-4 h-4" />}
                >
                  {link.label}
                </CTAButton>
              </Link>
            ))}
          </div>
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
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            جميع الشكاوى
          </h3>
          <div className="animate-enter">
            <ComplaintList onUpdate={loadStats} role="higher_committee" />
          </div>
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default HigherCommitteeDashboard;
