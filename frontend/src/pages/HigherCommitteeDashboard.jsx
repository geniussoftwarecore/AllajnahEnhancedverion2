import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ResponsivePageShell, StatCard, CTAButton, Alert, ProgressRing, LoadingFallback, AdminNavMenu } from '../components/ui';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useDashboardStats, useEscalatedComplaints } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentComplaints = [], isLoading: complaintsLoading } = useEscalatedComplaints(10);
  
  const loading = statsLoading || complaintsLoading;

  const handleWebSocketMessage = useCallback((message) => {
    if (message.type === 'complaint_update' || message.type === 'new_complaint' || message.type === 'new_comment') {
      setNotification({
        message: message.message || 'تم تحديث',
        type: 'info'
      });
      setTimeout(() => setNotification(null), 5000);
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', 'escalated'] });
    }
  }, [queryClient]);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    const colors = {
      submitted: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      under_review: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
      escalated: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
      resolved: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
      rejected: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300',
    };
    return colors[statusLower] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const statusLower = status?.toLowerCase();
    const labels = {
      submitted: 'مقدمة',
      under_review: 'قيد المراجعة',
      escalated: 'متصاعدة',
      resolved: 'محلولة',
      rejected: 'مرفوضة',
    };
    return labels[statusLower] || status;
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
        <LoadingFallback message="جاري تحميل لوحة التحكم..." />
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
        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-2"
        >
          <div className="flex items-center gap-2 text-sm">
            <motion.span
              animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass-strong relative overflow-hidden rounded-2xl shadow-2xl border-2 border-primary-200/30 dark:border-primary-700/30"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative p-8">
            <div className="flex items-start justify-between">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-white mb-2 drop-shadow-lg"
                >
                  لوحة الإدارة العليا
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-primary-100 font-medium text-lg"
                >
                  المراجعة النهائية والإشراف الشامل على النظام
                </motion.p>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5 }}
              >
                <ShieldCheckIcon className="w-16 h-16 text-primary-200 drop-shadow-xl" strokeWidth={2} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <AdminNavMenu />

        <div className="card-glass-strong overflow-hidden shadow-xl rounded-2xl border-2 border-primary-100/20 dark:border-primary-900/20">
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
                onClick={() => navigate('/complaints?status=ESCALATED')}
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
            onClick={() => navigate('/complaints?status=ESCALATED')}
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

  const colorClasses = {
    primary: 'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
    success: 'from-success-500 to-success-600 hover:from-success-600 hover:to-success-700',
    warning: 'from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700',
    secondary: 'from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700',
    gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 sm:p-8 shadow-xl border-2 border-primary-100 dark:border-primary-900/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <ShieldCheckIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">إجراءات سريعة</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">الوصول السريع إلى أهم الأقسام الإدارية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={action.onClick}
                className="card-glass-strong group relative overflow-hidden flex flex-col items-start p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-gray-100/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-700"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[action.color]} flex items-center justify-center mb-4 shadow-lg transition-all group-hover:scale-110`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="relative flex-1 text-right">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">{action.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

export default HigherCommitteeDashboard;
