import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsivePageShell, StatCard, QuickActionCard, ChartCard, FilterBar, Alert, SkeletonDashboard } from '../components/ui';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useDashboardStats, useCategories, useComplaints } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { debounce } from '../utils/debounce';
import { 
  DocumentPlusIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  CheckCircleIcon,
  UsersIcon,
  FolderOpenIcon,
  ChartBarIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function TechnicalCommitteeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: categories = [] } = useCategories();
  
  const filters = useMemo(() => ({
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    ...(categoryFilter !== 'all' && { category_id: categoryFilter }),
  }), [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const { data: complaintsData, isLoading: complaintsLoading } = useComplaints(filters);
  const complaints = complaintsData?.complaints || [];
  const loading = statsLoading;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications', { params: { skip: 0, limit: 1 } });
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleWebSocketMessage = useCallback((message) => {
    if (message.type === 'complaint_update' || message.type === 'new_complaint' || message.type === 'new_comment') {
      setNotification({
        message: message.message || 'تم تحديث شكوى',
        type: 'info'
      });
      setTimeout(() => setNotification(null), 5000);
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    }
    if (message.type === 'notification') {
      fetchUnreadCount();
    }
  }, [queryClient, fetchUnreadCount]);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

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

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
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

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة',
    };
    return labels[priority] || priority;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  const pendingCount = stats?.submitted || 0;

  if (loading) {
    return (
      <ResponsivePageShell 
        title={`مرحباً، ${user?.full_name || 'عضو اللجنة'}`}
        notificationCount={unreadCount}
      >
        <SkeletonDashboard />
      </ResponsivePageShell>
    );
  }

  return (
    <ResponsivePageShell 
      title={`مرحباً، ${user?.full_name || 'عضو اللجنة'}`}
      notificationCount={unreadCount}
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">لوحة اللجنة الفنية</h2>
              <p className="text-primary-100">مراجعة ومعالجة الشكاوى بكفاءة عالية</p>
            </div>
            <UsersIcon className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              setStatusFilter('submitted');
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer relative"
          >
            {pendingCount > 0 && <span className="absolute top-3 right-3 px-2 py-1 bg-white text-blue-600 text-xs font-bold rounded-full">{pendingCount}</span>}
            <FolderOpenIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">قائمة الانتظار</h3>
            <p className="text-sm text-blue-100">{pendingCount} شكوى جديدة</p>
          </button>
          <button
            onClick={() => {
              setStatusFilter('under_review');
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <ClockIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">قيد المراجعة</h3>
            <p className="text-sm text-blue-100">{stats?.under_review || 0} شكوى</p>
          </button>
          <button
            onClick={() => navigate('/complaints')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <ChartBarIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">التحليلات</h3>
            <p className="text-sm text-blue-100">إحصائيات الأداء</p>
          </button>
          <button
            onClick={() => {
              setPriorityFilter('urgent');
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <BellAlertIcon className="w-12 h-12 text-white mb-3" />
            <h3 className="text-lg font-bold text-white">التنبيهات</h3>
            <p className="text-sm text-blue-100">الشكاوى العاجلة</p>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">إحصائيات الشكاوى</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">نظرة عامة على حالة الشكاوى</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <StatCard key={i} loading={true} />
                ))}
              </>
            ) : (
              <>
                <StatCard
                  title="جديدة"
                  value={stats?.submitted || 0}
                  icon={DocumentPlusIcon}
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
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">إدارة الشكاوى</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">البحث والفلترة</p>
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={categories}
            showPriority={true}
            onClearFilters={clearFilters}
          />

          <div className="mt-6 space-y-3">
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                  className="p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 cursor-pointer transition-all shadow-md hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                        شكوى #{complaint.id}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {complaint.problem_description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {getPriorityLabel(complaint.priority)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{format(new Date(complaint.created_at), 'd MMM yyyy', { locale: ar })}</span>
                    <span>•</span>
                    <span>{complaint.category_name}</span>
                    {complaint.assigned_to_name && (
                      <>
                        <span>•</span>
                        <span>مُعين لـ: {complaint.assigned_to_name}</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد شكاوى تطابق الفلاتر المحددة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default TechnicalCommitteeDashboard;
