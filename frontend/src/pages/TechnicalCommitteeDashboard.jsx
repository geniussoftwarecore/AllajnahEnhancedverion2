import React, { useState, useEffect } from 'react';
import { ResponsivePageShell, StatCard, Alert } from '../components/ui';
import ComplaintList from '../components/ComplaintList';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';
import { 
  DocumentPlusIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

function TechnicalCommitteeDashboard() {
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
      title: 'جديدة',
      value: stats?.submitted || 0,
      icon: DocumentPlusIcon,
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
  ];

  return (
    <ResponsivePageShell 
      title="لوحة اللجنة الفنية"
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

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
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
            الشكاوى
          </h3>
          <div className="animate-enter">
            <ComplaintList onUpdate={loadStats} role="technical_committee" />
          </div>
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default TechnicalCommitteeDashboard;
