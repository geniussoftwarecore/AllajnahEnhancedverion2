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
  CreditCardIcon,
  PlusCircleIcon,
  ViewfinderCircleIcon,
  SparklesIcon,
  BellAlertIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function TraderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'complaint_update' || message.type === 'new_comment') {
      setNotification({
        message: message.message || 'تم تحديث شكوى',
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
        api.get('/complaints?limit=5')
      ]);
      
      setStats(statsRes.data);
      setRecentComplaints(complaintsRes.data.complaints || []);
      
      try {
        const subRes = await api.get('/subscription');
        setSubscription(subRes.data);
      } catch (error) {
        console.log('No subscription found');
      }
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

  const completionRate = stats ? 
    Math.round((stats.resolved / Math.max(stats.total_complaints, 1)) * 100) : 0;

  if (loading) {
    return (
      <ResponsivePageShell 
        title={`مرحباً، ${user?.full_name || 'التاجر'}`}
        notificationCount={0}
      >
        <SkeletonDashboard />
      </ResponsivePageShell>
    );
  }

  return (
    <ResponsivePageShell 
      title={`مرحباً، ${user?.full_name || 'التاجر'}`}
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">لوحة التحكم الذكية</h2>
              <p className="text-primary-100">إدارة شكاواك بكل سهولة وفعالية</p>
            </div>
            <SparklesIcon className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/complaints?new=true')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <PlusCircleIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">شكوى جديدة</h3>
            <p className="text-sm text-blue-100">تقديم شكوى جديدة</p>
          </button>
          <button
            onClick={() => navigate('/complaints')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <ViewfinderCircleIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">متابعة الشكاوى</h3>
            <p className="text-sm text-blue-100">عرض جميع الشكاوى</p>
          </button>
          <button
            onClick={() => navigate('/subscription')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer relative"
          >
            {subscription?.status !== 'active' && <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
            <CreditCardIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">الاشتراك</h3>
            <p className="text-sm text-blue-100">إدارة الاشتراك والدفع</p>
          </button>
          <button
            onClick={() => navigate('/complaints')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <BellAlertIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">الإشعارات</h3>
            <p className="text-sm text-blue-100">التحديثات والرسائل</p>
          </button>
        </div>

        {subscription && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">حالة الاشتراك</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{subscription.status === 'active' ? 'الاشتراك نشط' : 'يتطلب تجديد'}</p>
            <div className="flex items-center gap-6">
              <div className={`flex-1 p-6 rounded-xl border-2 ${subscription.status === 'active' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 font-semibold">تاريخ الانتهاء</p>
                    <p className="text-xl font-bold text-gray-900">
                      {format(new Date(subscription.end_date), 'd MMMM yyyy', { locale: ar })}
                    </p>
                  </div>
                  <CalendarIcon className={`w-10 h-10 ${subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">إحصائيات الشكاوى</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">نظرة عامة على شكاواك</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
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
                  title="تم التصعيد"
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
                <StatCard
                  title="مرفوضة"
                  value={stats?.rejected || 0}
                  icon={XCircleIcon}
                  color="danger"
                />
              </>
            )}
          </div>

          {!loading && stats && (
            <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">معدل الحل</h4>
                  <p className="text-sm text-gray-600">
                    تم حل {stats.resolved} من أصل {stats.total_complaints} شكوى
                  </p>
                </div>
                <ProgressRing progress={completionRate} color="success" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">آخر الشكاوى</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">الشكاوى الأخيرة المقدمة</p>
            </div>
            <button
              onClick={() => navigate('/complaints')}
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
                  className="p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 cursor-pointer transition-all shadow-md hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                        {complaint.title || `شكوى #${complaint.id}`}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {complaint.problem_description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{format(new Date(complaint.created_at), 'd MMM yyyy', { locale: ar })}</span>
                        <span>•</span>
                        <span>{complaint.category_name}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(complaint.status)}`}>
                      {getStatusLabel(complaint.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4 font-medium">لم تقم بتقديم أي شكوى بعد</p>
              <button
                onClick={() => navigate('/complaints?new=true')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                تقديم شكوى جديدة
              </button>
            </div>
          )}
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default TraderDashboard;
