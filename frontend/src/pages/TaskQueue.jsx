import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsivePageShell, FilterBar, Alert, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function TaskQueue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'task_update' || message.type === 'complaint_update' || message.type === 'new_task') {
      showNotification(message.message || 'تم تحديث قائمة المهام', 'info');
      loadTasks();
    }
  });

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/task-queue/my-queue');
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showNotification('حدث خطأ أثناء تحميل قائمة المهام', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAcceptTask = async (complaintId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`accept-${complaintId}`]: true }));
      await api.post(`/complaints/${complaintId}/accept-task`);
      showNotification('تم قبول المهمة بنجاح');
      loadTasks();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'فشل قبول المهمة', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`accept-${complaintId}`]: false }));
    }
  };

  const handleRejectTask = async (complaintId) => {
    const reason = prompt('يرجى إدخال سبب رفض المهمة:');
    if (!reason) return;

    try {
      setActionLoading(prev => ({ ...prev, [`reject-${complaintId}`]: true }));
      await api.post(`/complaints/${complaintId}/reject-task`, { reason });
      showNotification('تم رفض المهمة بنجاح');
      loadTasks();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'فشل رفض المهمة', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject-${complaintId}`]: false }));
    }
  };

  const handleStartWorking = async (complaintId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`start-${complaintId}`]: true }));
      await api.post(`/complaints/${complaintId}/start-working`);
      showNotification('تم بدء العمل على المهمة');
      navigate(`/complaints/${complaintId}`);
    } catch (error) {
      showNotification(error.response?.data?.detail || 'فشل بدء العمل', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`start-${complaintId}`]: false }));
    }
  };

  const getTaskStatusLabel = (status) => {
    const labels = {
      unassigned: 'غير مخصصة',
      in_queue: 'في قائمة الانتظار',
      assigned: 'مخصصة',
      accepted: 'مقبولة',
      in_progress: 'قيد العمل',
      pending_approval: 'في انتظار الموافقة',
      completed: 'مكتملة'
    };
    return labels[status] || status;
  };

  const getTaskStatusColor = (status) => {
    const colors = {
      unassigned: 'bg-gray-100 text-gray-700',
      in_queue: 'bg-blue-100 text-blue-700',
      assigned: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-green-100 text-green-700',
      in_progress: 'bg-primary-100 text-primary-700',
      pending_approval: 'bg-orange-100 text-orange-700',
      completed: 'bg-success-100 text-success-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredTasks = statusFilter === 'all' 
    ? tasks 
    : tasks.filter(task => task.complaint?.task_status === statusFilter);

  return (
    <ResponsivePageShell 
      title="قائمة المهام"
      subtitle="إدارة مهامك المخصصة"
      icon={ClipboardDocumentListIcon}
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
            <span className="text-gray-600 font-medium">{isConnected ? 'متصل' : 'غير متصل'}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('assigned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'assigned' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              مخصصة
            </button>
            <button
              onClick={() => setStatusFilter('accepted')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'accepted' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              مقبولة
            </button>
          </div>
          
          <button
            onClick={loadTasks}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="تحديث"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} height="h-32" />)}
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={ClipboardDocumentListIcon}
            title="لا توجد مهام"
            message="لا توجد مهام مخصصة لك حالياً"
          />
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transform hover:scale-[1.01] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        شكوى #{task.complaint?.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.complaint?.task_status)}`}>
                        {getTaskStatusLabel(task.complaint?.task_status)}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium mb-2">
                      {task.complaint?.title}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {task.complaint?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    تم التخصيص: {task.assigned_at ? format(new Date(task.assigned_at), 'dd MMM yyyy، HH:mm', { locale: ar }) : 'غير محدد'}
                  </span>
                  <span className="text-gray-400">
                    نقاط الحمل: {task.workload_score.toFixed(1)}
                  </span>
                </div>

                <div className="flex gap-3">
                  {task.complaint?.task_status === 'assigned' && (
                    <>
                      <button
                        onClick={() => handleAcceptTask(task.complaint.id)}
                        disabled={actionLoading[`accept-${task.complaint.id}`]}
                        className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        قبول المهمة
                      </button>
                      <button
                        onClick={() => handleRejectTask(task.complaint.id)}
                        disabled={actionLoading[`reject-${task.complaint.id}`]}
                        className="flex items-center gap-2 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        رفض المهمة
                      </button>
                    </>
                  )}
                  
                  {task.complaint?.task_status === 'accepted' && (
                    <button
                      onClick={() => handleStartWorking(task.complaint.id)}
                      disabled={actionLoading[`start-${task.complaint.id}`]}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      <PlayIcon className="h-5 w-5" />
                      بدء العمل
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/complaints/${task.complaint?.id}`)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResponsivePageShell>
  );
}

export default TaskQueue;
