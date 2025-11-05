import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ResponsivePageShell, StatCard, CTAButton, Alert, ProgressRing, SkeletonDashboard, LoadingFallback, AdminNavMenu } from '../components/ui';
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
  FolderOpenIcon,
  EyeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-3 font-semibold transition-all duration-300
        ${active 
          ? 'text-primary-600 dark:text-primary-400' 
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }
        hover:bg-gradient-to-b hover:from-gray-50/50 hover:to-transparent
        dark:hover:from-gray-700/30 dark:hover:to-transparent
      `}
    >
      {children}
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-full shadow-glow-green"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function HigherCommitteeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
        api.get('/complaints?limit=10&status=escalated')
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
      submitted: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      under_review: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
      escalated: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
      resolved: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
      rejected: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300',
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
        title="لوحة اللجنة العليا"
        subtitle="إدارة شاملة للنظام"
        notificationCount={0}
      >
        <SkeletonDashboard />
      </ResponsivePageShell>
    );
  }

  return (
    <ResponsivePageShell 
      title="لوحة اللجنة العليا"
      subtitle={`مرحباً، ${user?.full_name || 'عضو اللجنة العليا'}`}
      notificationCount={notification ? 1 : 0}
    >
      <div className="space-y-6">
        <AdminNavMenu />
        
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
            <span className="text-gray-600 dark:text-gray-400 font-medium">{isConnected ? 'متصل بالنظام' : 'غير متصل'}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}
          </div>
        </div>

        <div className="card-glass-strong overflow-hidden shadow-lg">
          <div className="flex flex-wrap border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-white/50 to-transparent dark:from-gray-800/50">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              نظرة عامة
            </TabButton>
            <TabButton
              active={activeTab === 'statistics'}
              onClick={() => setActiveTab('statistics')}
            >
              الإحصائيات
            </TabButton>
            <TabButton
              active={activeTab === 'complaints'}
              onClick={() => setActiveTab('complaints')}
            >
              الشكاوى المتصاعدة
            </TabButton>
            <TabButton
              active={activeTab === 'actions'}
              onClick={() => setActiveTab('actions')}
            >
              إجراءات سريعة
            </TabButton>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <OverviewTab stats={stats} escalatedCount={escalatedCount} resolutionRate={resolutionRate} navigate={navigate} />}
            {activeTab === 'statistics' && <StatisticsTab stats={stats} resolutionRate={resolutionRate} />}
            {activeTab === 'complaints' && <ComplaintsTab recentComplaints={recentComplaints} navigate={navigate} getStatusColor={getStatusColor} getStatusLabel={getStatusLabel} loading={loading} />}
            {activeTab === 'actions' && <QuickActionsTab navigate={navigate} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </ResponsivePageShell>
  );
}

function OverviewTab({ stats, escalatedCount, resolutionRate, navigate }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 sm:p-8 shadow-xl border-2 border-primary-100 dark:border-primary-900/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <ShieldCheckIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">لوحة اللجنة العليا</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">المراجعة النهائية والإشراف الشامل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass-strong p-6 sm:p-8 shadow-xl border border-primary-100 dark:border-primary-900/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">معدل الحل الإجمالي</h3>
          </div>
          <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-transparent rounded-2xl border-2 border-primary-200 dark:border-primary-800/30">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">نسبة الإنجاز</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تم حل {stats?.resolved || 0} من أصل {stats?.total_complaints || 0} شكوى
              </p>
            </div>
            <ProgressRing progress={resolutionRate} size={100} strokeWidth={10} color="primary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-glass-strong p-6 sm:p-8 shadow-xl border border-warning-100 dark:border-warning-900/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center shadow-md">
              <BellAlertIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">التنبيهات الهامة</h3>
          </div>
          <div className={`p-6 rounded-2xl border-2 ${escalatedCount > 0 ? 'bg-gradient-to-br from-warning-50 to-white dark:from-warning-900/20 dark:to-transparent border-warning-300 dark:border-warning-800/30' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BellAlertIcon className={`w-10 h-10 ${escalatedCount > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400'}`} />
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">شكاوى متصاعدة</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تتطلب مراجعة اللجنة العليا</p>
                </div>
              </div>
              <span className={`text-4xl font-bold ${escalatedCount > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400'}`}>
                {escalatedCount}
              </span>
            </div>
            {escalatedCount > 0 && (
              <CTAButton
                onClick={() => navigate('/complaints?status=escalated')}
                variant="warning"
                size="md"
                fullWidth
                icon={ArrowRightIcon}
              >
                عرض الشكاوى المتصاعدة
              </CTAButton>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatisticsTab({ stats, resolutionRate }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 sm:p-8 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">إحصائيات مفصلة</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">نظرة شاملة على أداء النظام</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-transparent rounded-2xl border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <DocumentTextIcon className="w-10 h-10 text-gray-600 dark:text-gray-400" />
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_complaints || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">إجمالي الشكاوى</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">جميع الشكاوى المقدمة</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-transparent rounded-2xl border-2 border-primary-200 dark:border-primary-800/30">
            <div className="flex items-center justify-between mb-4">
              <ClockIcon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              <span className="text-3xl font-bold text-primary-700 dark:text-primary-300">{stats?.under_review || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">قيد المراجعة</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تحت الفحص الحالي</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-warning-50 to-white dark:from-warning-900/20 dark:to-transparent rounded-2xl border-2 border-warning-200 dark:border-warning-800/30">
            <div className="flex items-center justify-between mb-4">
              <ArrowTrendingUpIcon className="w-10 h-10 text-warning-600 dark:text-warning-400" />
              <span className="text-3xl font-bold text-warning-700 dark:text-warning-300">{stats?.escalated || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">متصاعدة</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تتطلب قرار نهائي</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-success-50 to-white dark:from-success-900/20 dark:to-transparent rounded-2xl border-2 border-success-200 dark:border-success-800/30">
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="w-10 h-10 text-success-600 dark:text-success-400" />
              <span className="text-3xl font-bold text-success-700 dark:text-success-300">{stats?.resolved || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">محلولة</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تم حلها بنجاح</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-danger-50 to-white dark:from-danger-900/20 dark:to-transparent rounded-2xl border-2 border-danger-200 dark:border-danger-800/30">
            <div className="flex items-center justify-between mb-4">
              <XCircleIcon className="w-10 h-10 text-danger-600 dark:text-danger-400" />
              <span className="text-3xl font-bold text-danger-700 dark:text-danger-300">{stats?.rejected || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">مرفوضة</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">لم تستوفِ المعايير</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-transparent rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/30">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{resolutionRate}%</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">معدل الحل</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">نسبة النجاح الإجمالية</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ComplaintsTab({ recentComplaints, navigate, getStatusColor, getStatusLabel, loading }) {
  if (loading) {
    return <LoadingFallback message="جاري تحميل الشكاوى..." />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 sm:p-8 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center shadow-md">
              <BellAlertIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">الشكاوى المتصاعدة</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">الشكاوى التي تتطلب قرار نهائي</p>
            </div>
          </div>
          <CTAButton
            onClick={() => navigate('/complaints?status=escalated')}
            variant="primary"
            size="md"
            icon={EyeIcon}
          >
            عرض الكل
          </CTAButton>
        </div>

        {recentComplaints.length > 0 ? (
          <div className="overflow-x-auto -mx-6 sm:-mx-8">
            <div className="inline-block min-w-full align-middle px-6 sm:px-8">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">رقم الشكوى</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الوصف</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التصنيف</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentComplaints.map((complaint, index) => (
                    <motion.tr
                      key={complaint.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">#{complaint.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2 max-w-md">
                          {complaint.problem_description}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{complaint.category_name}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(complaint.created_at), 'd MMM yyyy', { locale: ar })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <CTAButton
                          onClick={() => navigate(`/complaints/${complaint.id}`)}
                          variant="ghost"
                          size="sm"
                          icon={EyeIcon}
                        >
                          عرض
                        </CTAButton>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد شكاوى متصاعدة حالياً</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function QuickActionsTab({ navigate }) {
  const actions = [
    {
      title: 'المستخدمين',
      description: 'إدارة حسابات المستخدمين',
      icon: UserGroupIcon,
      color: 'primary',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'الدفعات',
      description: 'مراجعة طلبات الدفع',
      icon: CreditCardIcon,
      color: 'success',
      onClick: () => navigate('/admin/payments')
    },
    {
      title: 'التحليلات',
      description: 'تقارير وإحصائيات شاملة',
      icon: ChartBarIcon,
      color: 'warning',
      onClick: () => navigate('/admin/analytics')
    },
    {
      title: 'سجل التدقيق',
      description: 'سجل النشاطات والعمليات',
      icon: ClipboardDocumentListIcon,
      color: 'secondary',
      onClick: () => navigate('/admin/audit-log')
    },
    {
      title: 'الإعدادات',
      description: 'إعدادات النظام والتصنيفات',
      icon: CogIcon,
      color: 'gray',
      onClick: () => navigate('/admin/settings')
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 sm:p-8 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">إجراءات سريعة</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">الوصول السريع إلى أهم الأقسام</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CTAButton
                onClick={action.onClick}
                variant="secondary"
                size="lg"
                fullWidth
                className="!justify-start !items-start !h-auto !py-6 !px-6"
              >
                <div className="flex items-start gap-4 w-full">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${
                    action.color === 'primary' ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                    action.color === 'success' ? 'bg-gradient-to-br from-success-500 to-success-600' :
                    action.color === 'warning' ? 'bg-gradient-to-br from-warning-500 to-warning-600' :
                    action.color === 'secondary' ? 'bg-gradient-to-br from-secondary-500 to-secondary-600' :
                    'bg-gradient-to-br from-gray-500 to-gray-600'
                  } flex items-center justify-center shadow-md`}>
                    <action.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">{action.description}</p>
                  </div>
                </div>
              </CTAButton>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default HigherCommitteeDashboard;
