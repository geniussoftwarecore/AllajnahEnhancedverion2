import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsivePageShell, StatCard, QuickActionCard, ChartCard, FilterBar, Alert } from '../components/ui';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
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
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'complaint_update' || message.type === 'new_complaint' || message.type === 'new_comment') {
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
    loadCategories();
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadComplaints = async () => {
    try {
      const params = {
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category_id: categoryFilter }),
      };
      const response = await api.get('/complaints', { params });
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
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

  return (
    <ResponsivePageShell 
      title={`مرحباً، ${user?.full_name || 'عضو اللجنة'}`}
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

        <div className="card bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">لوحة اللجنة الفنية</h2>
              <p className="text-primary-100">مراجعة ومعالجة الشكاوى بكفاءة عالية</p>
            </div>
            <UsersIcon className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={FolderOpenIcon}
            title="قائمة الانتظار"
            description={`${pendingCount} شكوى جديدة`}
            color="primary"
            badge={pendingCount > 0 ? pendingCount : null}
            onClick={() => {
              setStatusFilter('submitted');
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
          />
          <QuickActionCard
            icon={ClockIcon}
            title="قيد المراجعة"
            description={`${stats?.under_review || 0} شكوى`}
            color="warning"
            onClick={() => {
              setStatusFilter('under_review');
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
          />
          <QuickActionCard
            icon={ChartBarIcon}
            title="التحليلات"
            description="إحصائيات الأداء"
            color="gray"
            onClick={() => navigate('/complaints')}
          />
          <QuickActionCard
            icon={BellAlertIcon}
            title="التنبيهات"
            description="الشكاوى العاجلة"
            color="danger"
            onClick={() => {
              setPriorityFilter('urgent');
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
          />
        </div>

        <ChartCard title="إحصائيات الشكاوى" subtitle="نظرة عامة على حالة الشكاوى">
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
        </ChartCard>

        <ChartCard title="إدارة الشكاوى" subtitle="البحث والفلترة">
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
                  className="p-4 bg-white hover:bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-primary-300 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">
                        شكوى #{complaint.id}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
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
                  <div className="flex items-center gap-4 text-xs text-gray-500">
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
                <FolderOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد شكاوى تطابق الفلاتر المحددة</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </ResponsivePageShell>
  );
}

export default TechnicalCommitteeDashboard;
