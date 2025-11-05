import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsivePageShell, Alert, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';
import { 
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function ApprovalManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showAll, setShowAll] = useState(false);

  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'approval_update' || message.type === 'new_approval' || message.type === 'complaint_update') {
      showNotification(message.message || 'تم تحديث طلبات الموافقة', 'info');
      loadApprovals();
    }
  });

  useEffect(() => {
    loadApprovals();
  }, [showAll]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const endpoint = showAll ? '/approvals' : '/approvals/pending';
      const response = await api.get(endpoint);
      setApprovals(response.data || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
      showNotification('حدث خطأ أثناء تحميل طلبات الموافقة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApprove = async (approvalId, complaintId) => {
    const notes = prompt('أدخل ملاحظات الموافقة (اختياري):');
    
    try {
      setActionLoading(prev => ({ ...prev, [`approve-${approvalId}`]: true }));
      await api.put(`/approvals/${approvalId}`, {
        approval_status: 'approved',
        approval_notes: notes || undefined
      });
      showNotification('تمت الموافقة على الشكوى بنجاح');
      loadApprovals();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'فشلت عملية الموافقة', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`approve-${approvalId}`]: false }));
    }
  };

  const handleReject = async (approvalId, complaintId) => {
    const notes = prompt('يرجى إدخال سبب الرفض:');
    if (!notes) {
      showNotification('يجب إدخال سبب الرفض', 'warning');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [`reject-${approvalId}`]: true }));
      await api.put(`/approvals/${approvalId}`, {
        approval_status: 'rejected',
        approval_notes: notes
      });
      showNotification('تم رفض الطلب بنجاح');
      loadApprovals();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'فشلت عملية الرفض', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject-${approvalId}`]: false }));
    }
  };

  const getApprovalStatusLabel = (status) => {
    const labels = {
      pending: 'قيد الانتظار',
      approved: 'موافق عليه',
      rejected: 'مرفوض'
    };
    return labels[status] || status;
  };

  const getApprovalStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-success-100 text-success-700',
      rejected: 'bg-danger-100 text-danger-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const pendingCount = approvals.filter(a => a.approval_status === 'pending').length;

  return (
    <ResponsivePageShell 
      title="إدارة الموافقات"
      subtitle="مراجعة والموافقة على طلبات التصعيد"
      icon={ShieldCheckIcon}
    >
      <div className="space-y-6">
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-success-500' : 'bg-gray-400'} animate-pulse`}></span>
            <span className="text-gray-600 font-medium">{isConnected ? 'متصل' : 'غير متصل'}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAll(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !showAll 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              قيد الانتظار ({pendingCount})
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showAll 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل ({approvals.length})
            </button>
          </div>
          
          <button
            onClick={loadApprovals}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="تحديث"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-700" />
          </button>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} height="h-40" />)}
          </div>
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={ShieldCheckIcon}
            title="لا توجد طلبات موافقة"
            message={showAll ? 'لا توجد طلبات موافقة حالياً' : 'لا توجد طلبات موافقة قيد الانتظار'}
          />
        ) : (
          <div className="space-y-4">
            {approvals.map((approval, index) => (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        طلب موافقة - شكوى #{approval.complaint_id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getApprovalStatusColor(approval.approval_status)}`}>
                        {getApprovalStatusLabel(approval.approval_status)}
                      </span>
                    </div>
                    
                    {approval.approval_notes && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">ملاحظات الطلب:</p>
                        <p className="text-sm text-gray-600">{approval.approval_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">تاريخ الطلب:</span>
                    <span className="mr-2 text-gray-900 font-medium">
                      {format(new Date(approval.created_at), 'dd MMM yyyy، HH:mm', { locale: ar })}
                    </span>
                  </div>
                  
                  {approval.approved_at && (
                    <div>
                      <span className="text-gray-500">تاريخ القرار:</span>
                      <span className="mr-2 text-gray-900 font-medium">
                        {format(new Date(approval.approved_at), 'dd MMM yyyy، HH:mm', { locale: ar })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {approval.approval_status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(approval.id, approval.complaint_id)}
                        disabled={actionLoading[`approve-${approval.id}`]}
                        className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        الموافقة
                      </button>
                      <button
                        onClick={() => handleReject(approval.id, approval.complaint_id)}
                        disabled={actionLoading[`reject-${approval.id}`]}
                        className="flex items-center gap-2 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        الرفض
                      </button>
                      <button
                        onClick={() => navigate(`/complaints/${approval.complaint_id}`)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        عرض الشكوى
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/complaints/${approval.complaint_id}`)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      عرض الشكوى
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ResponsivePageShell>
  );
}

export default ApprovalManagement;
