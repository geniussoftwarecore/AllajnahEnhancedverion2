import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsivePageShell, StatCard, QuickActionCard, ChartCard, Alert, ProgressRing } from '../components/ui';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
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
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function HigherCommitteeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'complaint_update' || message.type === 'new_complaint' || message.type === 'new_comment') {
      setNotification({
        message: message.message || 'تم تحديث',
        type: 'info'
      });
      setTimeout(() => setNotification(null), 5000);
      loadDashboardData();
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/complaints?limit=5&status=escalated')
      ]);
      
      setStats(statsRes.data);
      setRecentComplaints(complaintsRes.data.complaints || []);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-gray-100 text-gray-700',
      under_review: 'bg-primary-100 text-primary-700',
      escalated: 'bg-warning-100 text-warning-700',
      resolved: 'bg-success-100 text-success-700',
      rejected: 'bg-danger-100 text-danger-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      submitted: 'مقدمة',
      under_review: 'قيد المراجعة',
      escalated: 'متصاعدة',
      resolved: 'محلولة',
      rejected: 'مرفوضة',
    };
    return labels[status] || status;
  };

  const resolutionRate = stats ? 
    Math.round((stats.resolved / Math.max(stats.total_complaints, 1)) * 100) : 0;

  const escalatedCount = stats?.escalated || 0;

  return (
    <ResponsivePageShell 
      title={`مرحباً، ${user?.full_name || 'عضو اللجنة العليا'}`}
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

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-success-500' : 'bg-gray-400'} animate-pulse`}></span>
            <span className="text-gray-600 font-medium">{isConnected ? 'متصل بالنظام' : 'غير متصل'}</span>
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-600 to-purple-800 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">لوحة اللجنة العليا</h2>
              <p className="text-purple-100">إدارة شاملة للنظام والمراجعة النهائية</p>
            </div>
            <ShieldCheckIcon className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <QuickActionCard
            icon={UserGroupIcon}
            title="المستخدمين"
            description="إدارة المستخدمين"
            color="primary"
            onClick={() => navigate('/admin/users')}
          />
          <QuickActionCard
            icon={CreditCardIcon}
            title="الدفعات"
            description="مراجعة الدفعات"
            color="success"
            onClick={() => navigate('/admin/payments')}
          />
          <QuickActionCard
            icon={ChartBarIcon}
            title="التحليلات"
            description="تقارير شاملة"
            color="warning"
            onClick={() => navigate('/admin/analytics')}
          />
          <QuickActionCard
            icon={ClipboardDocumentListIcon}
            title="سجل التدقيق"
            description="سجل النشاطات"
            color="gray"
            onClick={() => navigate('/admin/audit-log')}
          />
          <QuickActionCard
            icon={CogIcon}
            title="الإعدادات"
            description="إعدادات النظام"
            color="gray"
            onClick={() => navigate('/admin/settings')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="إحصائيات عامة" subtitle="نظرة شاملة على النظام">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {loading ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <StatCard key={i} loading={true} />
                  ))}
                </>
              ) : (
                <>
                  <StatCard
                    title="الإجمالي"
                    value={stats?.total_complaints || 0}
                    icon={DocumentTextIcon}
                    color="gray"
                  />
                  <StatCard
                    title="قيد المراجعة"
                    value={stats?.under_review || 0}
                    icon={ClockIcon}
                    color="primary"
                  />
                  <StatCard
                    title="متصاعدة"
                    value={stats?.escalated || 0}
                    icon={ArrowTrendingUpIcon}
                    color="warning"
                  />
                  <StatCard
                    title="محلولة"
                    value={stats?.resolved || 0}
                    icon={CheckCircleIcon}
                    color="success"
                  />
                </>
              )}
            </div>

            {!loading && stats && (
              <div className="p-4 bg-gradient-to-br from-primary-50 to-white rounded-lg border border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">معدل الحل الإجمالي</h4>
                    <p className="text-sm text-gray-600">
                      تم حل {stats.resolved} من أصل {stats.total_complaints} شكوى
                    </p>
                  </div>
                  <ProgressRing progress={resolutionRate} color="primary" />
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard title="التنبيهات الهامة" subtitle="يتطلب انتباه فوري">
            <div className={`p-4 rounded-lg border-2 ${escalatedCount > 0 ? 'bg-warning-50 border-warning-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellAlertIcon className={`w-8 h-8 ${escalatedCount > 0 ? 'text-warning-600' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="font-bold text-gray-900">شكاوى متصاعدة</h4>
                    <p className="text-sm text-gray-600">تتطلب مراجعة اللجنة العليا</p>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${escalatedCount > 0 ? 'text-warning-600' : 'text-gray-400'}`}>
                  {escalatedCount}
                </span>
              </div>
              {escalatedCount > 0 && (
                <button
                  onClick={() => navigate('/complaints?status=escalated')}
                  className="mt-3 w-full py-2 bg-warning-600 hover:bg-warning-700 text-white rounded-lg font-medium transition-colors"
                >
                  عرض الشكاوى المتصاعدة
                </button>
              )}
            </div>
          </ChartCard>
        </div>

        <ChartCard 
          title="الشكاوى المتصاعدة" 
          subtitle="الشكاوى التي تتطلب قرار نهائي"
          actions={
            <button
              onClick={() => navigate('/complaints?status=escalated')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              عرض الكل ←
            </button>
          }
        >
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
              ))}
            </div>
          ) : recentComplaints.length > 0 ? (
            <div className="space-y-3">
              {recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                  className="p-4 bg-white hover:bg-gray-50 rounded-lg border-2 border-warning-200 hover:border-warning-400 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">
                        شكوى #{complaint.id}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {complaint.problem_description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{format(new Date(complaint.created_at), 'd MMM yyyy', { locale: ar })}</span>
                        <span>•</span>
                        <span>{complaint.category_name}</span>
                        {complaint.assigned_to_name && (
                          <>
                            <span>•</span>
                            <span>{complaint.assigned_to_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {getStatusLabel(complaint.status)}
                    </span>
                  </div>
                </div>
              ))}</div>
          ) : (
            <div className="text-center py-12">
              <FolderOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد شكاوى متصاعدة حالياً</p>
            </div>
          )}
        </ChartCard>
      </div>
    </ResponsivePageShell>
  );
}

export default HigherCommitteeDashboard;
