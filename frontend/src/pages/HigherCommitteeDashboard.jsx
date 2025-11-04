import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsivePageShell, StatCard, QuickActionCard, ChartCard, Alert, ProgressRing, SkeletonDashboard } from '../components/ui';
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

  if (loading) {
    return (
      <ResponsivePageShell 
        title={`مرحباً، ${user?.full_name || 'عضو اللجنة العليا'}`}
        notificationCount={0}
      >
        <SkeletonDashboard />
      </ResponsivePageShell>
    );
  }

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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">لوحة اللجنة العليا</h2>
              <p className="text-purple-100">إدارة شاملة للنظام والمراجعة النهائية</p>
            </div>
            <ShieldCheckIcon className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <UserGroupIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">المستخدمين</h3>
            <p className="text-sm text-blue-100">إدارة المستخدمين</p>
          </button>
          <button
            onClick={() => navigate('/admin/payments')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <CreditCardIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">الدفعات</h3>
            <p className="text-sm text-blue-100">مراجعة الدفعات</p>
          </button>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <ChartBarIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">التحليلات</h3>
            <p className="text-sm text-blue-100">تقارير شاملة</p>
          </button>
          <button
            onClick={() => navigate('/admin/audit-log')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <ClipboardDocumentListIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">سجل التدقيق</h3>
            <p className="text-sm text-blue-100">سجل النشاطات</p>
          </button>
          <button
            onClick={() => navigate('/admin/settings')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <CogIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">الإعدادات</h3>
            <p className="text-sm text-blue-100">إعدادات النظام</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">إحصائيات عامة</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">نظرة شاملة على النظام</p>
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
              <div className="p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border-2 border-primary-200">
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
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">التنبيهات الهامة</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">يتطلب انتباه فوري</p>
            <div className={`p-6 rounded-xl border-2 ${escalatedCount > 0 ? 'bg-warning-50 border-warning-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellAlertIcon className={`w-10 h-10 ${escalatedCount > 0 ? 'text-warning-600' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">شكاوى متصاعدة</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تتطلب مراجعة اللجنة العليا</p>
                  </div>
                </div>
                <span className={`text-3xl font-bold ${escalatedCount > 0 ? 'text-warning-600' : 'text-gray-400'}`}>
                  {escalatedCount}
                </span>
              </div>
              {escalatedCount > 0 && (
                <button
                  onClick={() => navigate('/complaints?status=escalated')}
                  className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  عرض الشكاوى المتصاعدة
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">الشكاوى المتصاعدة</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">الشكاوى التي تتطلب قرار نهائي</p>
            </div>
            <button
              onClick={() => navigate('/complaints?status=escalated')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              عرض الكل ←
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 h-20 rounded-xl"></div>
              ))}
            </div>
          ) : recentComplaints.length > 0 ? (
            <div className="space-y-3">
              {recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                  className="p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-xl border-2 border-warning-200 dark:border-warning-800 hover:border-warning-400 cursor-pointer transition-all shadow-md hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                        شكوى #{complaint.id}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {complaint.problem_description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
              <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد شكاوى متصاعدة حالياً</p>
            </div>
          )}
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default HigherCommitteeDashboard;
