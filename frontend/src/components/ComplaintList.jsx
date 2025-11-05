import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FilterBar, ChartCard, ResponsivePageShell, Alert, ConfirmDialog } from './ui';
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

  const content = (
    <div className="space-y-6">
      {toast && (
        <Alert
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

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

      {canUseBulkActions && selectedIds.length > 0 && (
        <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-primary-600" />
              <span className="font-bold text-primary-900">{selectedIds.length} شكوى محددة</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="">تعيين إلى...</option>
                {committeeUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.role === 'technical_committee' ? 'لجنة فنية' : 'لجنة عليا'})
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkAssign}
                disabled={!bulkAssignTo || bulkLoading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                تعيين
              </button>

              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="">تغيير الحالة...</option>
                <option value="submitted">مقدمة</option>
                <option value="under_review">قيد المراجعة</option>
                <option value="escalated">متصاعدة</option>
                <option value="resolved">محلولة</option>
                <option value="rejected">مرفوضة</option>
              </select>

              <button
                onClick={handleBulkStatusChange}
                disabled={!bulkStatus || bulkLoading}
                className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                تحديث الحالة
              </button>
            </div>

            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <XMarkIcon className="w-5 h-5" />
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpenIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد شكاوى</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
              ? 'لا توجد نتائج تطابق الفلاتر المحددة'
              : 'لم يتم تقديم أي شكوى بعد'}
          </p>
          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              مسح جميع الفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          {canUseBulkActions && complaints.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedIds.length === complaints.length && complaints.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="select-all" className="font-medium text-gray-700 cursor-pointer">
                تحديد الكل ({complaints.length})
              </label>
            </div>
          )}

          <div className="space-y-3">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="group p-5 bg-white hover:bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {canUseBulkActions && (
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(complaint.id)}
                        onChange={(e) => handleSelectOne(complaint.id, e)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                      />
                    </div>
                  )}
                  <div
                    onClick={() => handleComplaintClick(complaint.id)}
                    className="flex-1 cursor-pointer"
                  >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-500">#{complaint.id}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                        {getStatusLabel(complaint.status)}
                      </span>
                      {complaint.priority && (
                        <span className={`text-xs font-bold ${getPriorityColor(complaint.priority)}`}>
                          ● {getPriorityLabel(complaint.priority)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                      {complaint.problem_description || 'بدون وصف'}
                    </p>
                  </div>
                  <ChevronLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{format(new Date(complaint.created_at), 'd MMM yyyy', { locale: ar })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <TagIcon className="w-4 h-4" />
                    <span className="truncate">{complaint.category_name || 'بدون فئة'}</span>
                  </div>
                  {complaint.trader_name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserIcon className="w-4 h-4" />
                      <span className="truncate">{complaint.trader_name}</span>
                    </div>
                  )}
                  {complaint.assigned_to_name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <DocumentTextIcon className="w-4 h-4" />
                      <span className="truncate">مُعين لـ: {complaint.assigned_to_name}</span>
                    </div>
                  )}
                </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
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
                className="px-4 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                التالي
              </button>
            </div>
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
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/complaints/new')}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>شكوى جديدة</span>
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {content}
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default ComplaintList;
