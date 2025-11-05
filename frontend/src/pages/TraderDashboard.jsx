import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
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
  const shouldReduceMotion = useReducedMotion();
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

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-2"
        >
          <div className="flex items-center gap-2 text-sm">
            <motion.span
              animate={shouldReduceMotion ? {} : { scale: isConnected ? [1, 1.2, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-success-500 shadow-lg shadow-success-500/50' : 'bg-gray-400'}`}
            />
            <span className="text-gray-600 dark:text-gray-400 font-semibold">{isConnected ? 'متصل بالنظام' : 'غير متصل'}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative p-8">
            <div className="flex items-start justify-between">
              <div>
                <motion.h2
                  initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.2 }}
                  className="text-3xl font-black text-white mb-2 drop-shadow-lg"
                >
                  لوحة التحكم الذكية
                </motion.h2>
                <motion.p
                  initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.3 }}
                  className="text-primary-100 font-medium text-lg"
                >
                  إدارة شكاواك بكل سهولة وفعالية
                </motion.p>
              </div>
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: [0, 10, 0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5 }}
              >
                <SparklesIcon className="w-16 h-16 text-primary-200 drop-shadow-xl" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.button
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.2 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -5 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={() => navigate('/complaints?new=true')}
            className="group relative overflow-hidden flex flex-col items-center justify-center p-7 bg-gradient-to-br from-blue-600 via-blue-600 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
              <PlusCircleIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">شكوى جديدة</h3>
            <p className="text-sm text-blue-100 font-medium">تقديم شكوى جديدة</p>
          </motion.button>
          <motion.button
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.3 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -5 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={() => navigate('/complaints')}
            className="group relative overflow-hidden flex flex-col items-center justify-center p-7 bg-gradient-to-br from-purple-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
              <ViewfinderCircleIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">متابعة الشكاوى</h3>
            <p className="text-sm text-purple-100 font-medium">عرض جميع الشكاوى</p>
          </motion.button>
          <motion.button
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.4 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -5 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={() => navigate('/subscription')}
            className="group relative overflow-hidden flex flex-col items-center justify-center p-7 bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            {subscription?.status !== 'active' && (
              <motion.span
                animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
              <CreditCardIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">الاشتراك</h3>
            <p className="text-sm text-indigo-100 font-medium">إدارة الاشتراك والدفع</p>
          </motion.button>
          <motion.button
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.5 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -5 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={() => navigate('/complaints')}
            className="group relative overflow-hidden flex flex-col items-center justify-center p-7 bg-gradient-to-br from-pink-600 via-pink-600 to-rose-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
              <BellAlertIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">الإشعارات</h3>
            <p className="text-sm text-pink-100 font-medium">التحديثات والرسائل</p>
          </motion.button>
        </div>

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.6 }}
          className="card-premium p-6 sm:p-8 shadow-xl border-2 border-primary-100 dark:border-primary-900/30"
        >
          {subscription ? (
            <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">حالة الاشتراك</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {subscription.status === 'active' ? 'الاشتراك نشط' : 'يتطلب تجديد'}
                </p>
              </div>
              <motion.div
                animate={shouldReduceMotion ? {} : { scale: subscription.status === 'active' ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: subscription.status === 'active' ? Infinity : 0, duration: 2 }}
                className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg ${
                  subscription.status === 'active'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
                }`}
              >
                {subscription.status === 'active' ? 'نشط' : 'منتهي'}
              </motion.div>
            </div>
            <div className={`p-6 rounded-2xl border-2 shadow-lg ${
              subscription.status === 'active'
                ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700'
                : 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-bold uppercase tracking-wider">تاريخ الانتهاء</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    {format(new Date(subscription.end_date), 'd MMMM yyyy', { locale: ar })}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  subscription.status === 'active'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-yellow-500 to-amber-600'
                }`}>
                  <CalendarIcon className="w-9 h-9 text-white" />
                </div>
              </div>
            </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">الاشتراك</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">لا يوجد اشتراك نشط</p>
                </div>
                <motion.div
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="px-4 py-2 rounded-full font-bold text-sm shadow-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                >
                  غير مشترك
                </motion.div>
              </div>
              <div className="text-center py-8">
                <CreditCardIcon className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">للاستمرار في استخدام النظام، يجب الاشتراك في إحدى الخطط المتاحة</p>
                <button
                  onClick={() => navigate('/subscription')}
                  className="px-8 py-3.5 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 hover:from-primary-700 hover:via-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 inline-flex items-center gap-3"
                >
                  <CreditCardIcon className="w-5 h-5" />
                  اشترك الآن
                </button>
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.7 }}
          className="card-premium p-6 sm:p-8 shadow-xl border-2 border-primary-100 dark:border-primary-900/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">إحصائيات الشكاوى</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">نظرة عامة على شكاواك</p>
            </div>
          </div>
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
            <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 via-primary-50/30 to-purple-50/30 dark:from-gray-800 dark:via-primary-900/10 dark:to-purple-900/10 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">معدل الحل</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    تم حل {stats.resolved} من أصل {stats.total_complaints} شكوى
                  </p>
                </div>
                <ProgressRing progress={completionRate} color="success" />
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.8 }}
          className="card-premium p-6 sm:p-8 shadow-xl border-2 border-primary-100 dark:border-primary-900/30"
        >
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
        </motion.div>
      </div>
    </ResponsivePageShell>
  );
}

export default TraderDashboard;
