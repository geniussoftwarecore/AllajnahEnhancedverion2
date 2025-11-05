import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FilterBar, ChartCard, ResponsivePageShell, Alert, ConfirmDialog, CTAButton, LoadingFallback } from './ui';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ChevronLeftIcon,
  FolderOpenIcon,
  ArrowLeftIcon,
  PlusCircleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Plus, Check, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function ComplaintList({ onUpdate, role, embedded = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Bulk action states
  const [selectedIds, setSelectedIds] = useState([]);
  const [committeeUsers, setCommitteeUsers] = useState([]);
  const [bulkAssignTo, setBulkAssignTo] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', message: '' });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const canUseBulkActions = user?.role === 'technical_committee' || user?.role === 'higher_committee';

  useEffect(() => {
    loadCategories();
    if (canUseBulkActions) {
      loadCommitteeUsers();
    }
  }, [canUseBulkActions]);

  useEffect(() => {
    loadComplaints();
    setSelectedIds([]);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, currentPage]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      navigate('/complaints/new');
    }
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCommitteeUsers = async () => {
    try {
      const response = await api.get('/users/committee');
      setCommitteeUsers(response.data);
    } catch (error) {
      console.error('Error loading committee users:', error);
    }
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const params = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category_id: categoryFilter }),
      };

      const response = await api.get('/complaints', { params });
      const data = response.data;
      
      if (data.complaints) {
        setComplaints(data.complaints);
        setTotalPages(Math.ceil((data.total || data.complaints.length) / itemsPerPage));
      } else if (Array.isArray(data)) {
        setComplaints(data);
        setTotalPages(1);
      } else {
        setComplaints([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-gray-100 text-gray-700 border-gray-200',
      under_review: 'bg-primary-100 text-primary-700 border-primary-200',
      escalated: 'bg-warning-100 text-warning-700 border-warning-200',
      resolved: 'bg-success-100 text-success-700 border-success-200',
      rejected: 'bg-danger-100 text-danger-700 border-danger-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
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
    setCurrentPage(1);
  };

  const handleComplaintClick = (complaintId) => {
    navigate(`/complaints/${complaintId}`);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(complaints.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (complaintId, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      if (prev.includes(complaintId)) {
        return prev.filter(id => id !== complaintId);
      } else {
        return [...prev, complaintId];
      }
    });
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignTo) {
      setToast({ type: 'error', message: 'الرجاء اختيار المستخدم المراد التعيين إليه' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const assignedUser = committeeUsers.find(u => u.id === parseInt(bulkAssignTo));
    setConfirmDialog({
      isOpen: true,
      type: 'assign',
      message: `هل أنت متأكد من تعيين ${selectedIds.length} شكوى إلى ${assignedUser?.first_name} ${assignedUser?.last_name}؟`
    });
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus) {
      setToast({ type: 'error', message: 'الرجاء اختيار الحالة الجديدة' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const statusLabels = {
      submitted: 'مقدمة',
      under_review: 'قيد المراجعة',
      escalated: 'متصاعدة',
      resolved: 'محلولة',
      rejected: 'مرفوضة'
    };

    setConfirmDialog({
      isOpen: true,
      type: 'status',
      message: `هل أنت متأكد من تغيير حالة ${selectedIds.length} شكوى إلى "${statusLabels[bulkStatus]}"؟`
    });
  };

  const executeBulkAction = async () => {
    setBulkLoading(true);
    try {
      let response;
      if (confirmDialog.type === 'assign') {
        response = await api.post('/complaints/bulk-assign', {
          complaint_ids: selectedIds,
          assigned_to_id: parseInt(bulkAssignTo)
        });
      } else if (confirmDialog.type === 'status') {
        response = await api.post('/complaints/bulk-status', {
          complaint_ids: selectedIds,
          status: bulkStatus
        });
      }

      const { success_count, failed_count, errors } = response.data;

      if (success_count > 0) {
        setToast({
          type: 'success',
          message: `تم تحديث ${success_count} شكوى بنجاح${failed_count > 0 ? ` (فشل ${failed_count})` : ''}`
        });
        setTimeout(() => setToast(null), 5000);
        
        await loadComplaints();
        setSelectedIds([]);
        setBulkAssignTo('');
        setBulkStatus('');
      } else {
        setToast({
          type: 'error',
          message: `فشل في تحديث الشكاوى: ${errors.join(', ')}`
        });
        setTimeout(() => setToast(null), 5000);
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      setToast({
        type: 'error',
        message: error.response?.data?.detail || 'حدث خطأ أثناء تنفيذ العملية'
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setBulkLoading(false);
      setConfirmDialog({ isOpen: false, type: '', message: '' });
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkAssignTo('');
    setBulkStatus('');
  };

  if (loading) return <LoadingFallback message="جاري تحميل الشكاوى..." />;

  const content = (
    <div className="space-y-6">
      {toast && (
        <Alert
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          priorityFilter={priorityFilter}
          onPriorityChange={(value) => {
            setPriorityFilter(value);
            setCurrentPage(1);
          }}
          categoryFilter={categoryFilter}
          onCategoryChange={(value) => {
            setCategoryFilter(value);
            setCurrentPage(1);
          }}
          categories={categories}
          showPriority={role === 'technical_committee' || role === 'higher_committee'}
          onClearFilters={clearFilters}
        />
      </motion.div>

      {canUseBulkActions && selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-50 via-primary-100/50 to-primary-50 dark:from-primary-900/20 dark:via-primary-800/20 dark:to-primary-900/20 border-2 border-primary-200 dark:border-primary-700 rounded-xl p-5 shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-primary-900 dark:text-primary-100">{selectedIds.length} شكوى محددة</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium"
              >
                <option value="">تعيين إلى...</option>
                {committeeUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.role === 'technical_committee' ? 'لجنة فنية' : 'لجنة عليا'})
                  </option>
                ))}
              </select>

              <CTAButton
                onClick={handleBulkAssign}
                disabled={!bulkAssignTo || bulkLoading}
                variant="primary"
                size="md"
                loading={bulkLoading}
              >
                تعيين
              </CTAButton>

              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium"
              >
                <option value="">تغيير الحالة...</option>
                <option value="submitted">مقدمة</option>
                <option value="under_review">قيد المراجعة</option>
                <option value="escalated">متصاعدة</option>
                <option value="resolved">محلولة</option>
                <option value="rejected">مرفوضة</option>
              </select>

              <CTAButton
                onClick={handleBulkStatusChange}
                disabled={!bulkStatus || bulkLoading}
                variant="success"
                size="md"
                loading={bulkLoading}
              >
                تحديث الحالة
              </CTAButton>
            </div>

            <CTAButton
              onClick={clearSelection}
              variant="ghost"
              size="md"
              icon={X}
            >
              إلغاء التحديد
            </CTAButton>
          </div>
        </motion.div>
      )}

      {complaints.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6 shadow-soft mx-auto">
            <FolderOpenIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">لا توجد شكاوى</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
              ? 'لا توجد نتائج تطابق الفلاتر المحددة'
              : 'لم يتم تقديم أي شكوى بعد'}
          </p>
          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <CTAButton
              onClick={clearFilters}
              variant="outline"
              size="md"
              icon={Filter}
            >
              مسح جميع الفلاتر
            </CTAButton>
          )}
        </motion.div>
      ) : (
        <>
          {canUseBulkActions && complaints.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60"
            >
              <input
                type="checkbox"
                id="select-all"
                checked={selectedIds.length === complaints.length && complaints.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="select-all" className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                تحديد الكل ({complaints.length})
              </label>
            </motion.div>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
              <thead>
                <tr className="bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50">
                  {canUseBulkActions && <th className="px-6 py-4 w-12"></th>}
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الشكوى</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التصنيف</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
                {complaints.map((complaint) => (
                  <motion.tr
                    key={complaint.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                    onClick={() => handleComplaintClick(complaint.id)}
                  >
                    {canUseBulkActions && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(complaint.id)}
                          onChange={(e) => handleSelectOne(complaint.id, e)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">#{complaint.id}</span>
                          {complaint.priority && (
                            <span className={`text-xs font-bold ${getPriorityColor(complaint.priority)}`}>
                              ● {getPriorityLabel(complaint.priority)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium line-clamp-2">
                          {complaint.problem_description || 'بدون وصف'}
                        </p>
                        {complaint.trader_name && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            التاجر: {complaint.trader_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(complaint.status)}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {complaint.category_name || 'بدون فئة'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(complaint.created_at), 'd MMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <ChevronLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-6"
            >
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-sm hover:shadow-md"
              >
                السابق
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-11 h-11 rounded-xl font-bold transition-all shadow-sm ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-sm hover:shadow-md"
              >
                التالي
              </button>
            </motion.div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: '', message: '' })}
        onConfirm={executeBulkAction}
        title="تأكيد العملية"
        message={confirmDialog.message}
        confirmText="تأكيد"
        cancelText="إلغاء"
        type="warning"
        isLoading={bulkLoading}
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <ResponsivePageShell 
      title="قائمة الشكاوى"
      subtitle={`إجمالي: ${complaints.length} شكوى`}
    >
      <div className="space-y-6">
        {user?.role === 'trader' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <CTAButton
              onClick={() => navigate('/complaints/new')}
              variant="primary"
              size="md"
              icon={Plus}
            >
              شكوى جديدة
            </CTAButton>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card-premium p-6 sm:p-8 shadow-xl"
        >
          {content}
        </motion.div>
      </div>
    </ResponsivePageShell>
  );
}

export default ComplaintList;
