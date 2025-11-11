import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsivePageShell, CTAButton, LoadingFallback, ConfirmDialog } from '../components/ui';
import { toast } from 'react-toastify';
import { useMerchantRequests } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function MerchantApprovals() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { data: requests = [], isLoading: loading } = useMerchantRequests(filter);

  const handleApprove = async (request) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleReject = async (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      await api.put(`/admin/merchant-requests/${selectedRequest.id}`, {
        approved: true
      });
      toast.success('تم قبول طلب التاجر بنجاح');
      setShowApproveDialog(false);
      queryClient.invalidateQueries({ queryKey: ['merchantRequests'] });
    } catch (error) {
      console.error('Error approving merchant:', error);
      toast.error('حدث خطأ أثناء قبول الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('يرجى إدخال سبب الرفض');
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/admin/merchant-requests/${selectedRequest.id}`, {
        approved: false,
        rejection_reason: rejectionReason
      });
      toast.success('تم رفض طلب التاجر');
      setShowRejectDialog(false);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['merchantRequests'] });
    } catch (error) {
      console.error('Error rejecting merchant:', error);
      toast.error('حدث خطأ أثناء رفض الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircleIcon className="w-4 h-4" />
            موافق عليه
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircleIcon className="w-4 h-4" />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <ClockIcon className="w-4 h-4" />
            قيد الانتظار
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ResponsivePageShell
      title="طلبات التجار"
      subtitle="مراجعة وإدارة طلبات التجار الجدد"
      icon={<UserGroupIcon className="w-8 h-8" />}
      showBack
      onBack={() => window.history.back()}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <FunnelIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {['pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'pending' && 'قيد الانتظار'}
                {status === 'approved' && 'موافق عليها'}
                {status === 'rejected' && 'مرفوضة'}
              </button>
            ))}
          </div>
        </div>

        {requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md"
          >
            <UserGroupIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              لا توجد طلبات {filter === 'pending' ? 'قيد الانتظار' : filter === 'approved' ? 'موافق عليها' : 'مرفوضة'}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <UserIcon className="w-6 h-6 text-primary-500" />
                            {request.first_name} {request.last_name}
                          </h3>
                          <div className="mt-2">
                            {getStatusBadge(request.account_status)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span className="dir-ltr">{request.email}</span>
                        </div>

                        {request.phone && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <PhoneIcon className="w-4 h-4" />
                            <span className="dir-ltr">{request.phone}</span>
                          </div>
                        )}

                        {request.address && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{request.address}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {format(new Date(request.created_at), 'dd MMMM yyyy', { locale: ar })}
                          </span>
                        </div>
                      </div>

                      {request.rejection_reason && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium text-red-800 dark:text-red-400">
                            سبب الرفض: {request.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {request.account_status === 'pending' && (
                      <div className="flex flex-col gap-3 lg:w-48">
                        <CTAButton
                          variant="primary"
                          size="md"
                          fullWidth
                          onClick={() => handleApprove(request)}
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                          قبول
                        </CTAButton>
                        <CTAButton
                          variant="outline"
                          size="md"
                          fullWidth
                          onClick={() => handleReject(request)}
                        >
                          <XCircleIcon className="w-5 h-5" />
                          رفض
                        </CTAButton>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={confirmApprove}
        title="تأكيد قبول الطلب"
        message={`هل أنت متأكد من قبول طلب التاجر ${selectedRequest?.first_name} ${selectedRequest?.last_name}؟ سيتمكن من تسجيل الدخول والوصول إلى النظام.`}
        confirmText="قبول"
        cancelText="إلغاء"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setRejectionReason('');
        }}
        onConfirm={confirmReject}
        title="رفض طلب التاجر"
        confirmText="رفض"
        cancelText="إلغاء"
        loading={actionLoading}
        variant="danger"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            سيتم رفض طلب التاجر {selectedRequest?.first_name} {selectedRequest?.last_name}. يرجى إدخال سبب الرفض:
          </p>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            rows="4"
            placeholder="أدخل سبب الرفض..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </ResponsivePageShell>
  );
}

export default MerchantApprovals;
