import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsivePageShell, LoadingFallback, CTAButton, AdminNavMenu } from '../../components/ui';
import { Eye, CheckCircle, XCircle, X } from 'lucide-react';
import { usePayments } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

function PaymentsReview() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('PENDING');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { data: payments = [], isLoading: loading } = usePayments(filter);

  const handleApprove = async (paymentId) => {
    const notes = window.prompt('ملاحظات الموافقة (اختياري):');
    if (notes === null) return;

    try {
      await api.patch(`/payments/${paymentId}`, {
        status: 'APPROVED',
        approval_notes: notes || undefined
      });
      toast.success('تمت الموافقة على الدفع بنجاح');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedPayment(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في الموافقة على الدفع');
    }
  };

  const handleReject = async (paymentId) => {
    const notes = window.prompt('سبب الرفض (مطلوب):');
    if (!notes) {
      toast.warning('يرجى إدخل سبب الرفض');
      return;
    }

    try {
      await api.patch(`/payments/${paymentId}`, {
        status: 'REJECTED',
        approval_notes: notes
      });
      toast.success('تم رفض الدفع');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedPayment(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في رفض الدفع');
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'approved': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'rejected': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };
  
  const getPaymentMethodText = (method) => {
    const methodMap = {
      'bank_transfer': 'تحويل بنكي',
      'credit_card': 'بطاقة ائتمان',
      'e_wallet': 'محفظة إلكترونية',
      'cash': 'نقداً',
      'stripe': 'بطاقة ائتمان (Stripe)'
    };
    return methodMap[method] || method;
  };

  if (loading) return <LoadingFallback message="جاري تحميل الدفعات..." />;

  return (
    <ResponsivePageShell 
      title="مراجعة الدفعات"
      subtitle="مراجعة والموافقة على دفعات التجار"
    >
      <div className="space-y-6">
        <AdminNavMenu />
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass-strong overflow-hidden shadow-xl p-6 border border-primary-100 dark:border-primary-900/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تصفية حسب الحالة</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filter === 'all' 
                  ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              الكل ({payments.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filter === 'PENDING' 
                  ? 'bg-yellow-600 dark:bg-yellow-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              قيد المراجعة
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filter === 'APPROVED' 
                  ? 'bg-green-600 dark:bg-green-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              موافق عليها
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filter === 'REJECTED' 
                  ? 'bg-red-600 dark:bg-red-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              مرفوضة
            </button>
          </div>
        </motion.div>

        {payments.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد دفعات</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-x-auto rounded-xl border-2 border-gray-200/80 dark:border-gray-700/80 shadow-xl"
          >
            <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
              <thead>
                <tr className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700">
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">المستخدم</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">المبلغ</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">طريقة الدفع</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">تاريخ التقديم</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
                {payments.map((payment, index) => (
                  <motion.tr 
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{payment.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {payment.user ? `${payment.user.first_name} ${payment.user.last_name}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {Number(payment.amount).toFixed(2)} ريال
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{getPaymentMethodText(payment.method)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString('ar')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>التفاصيل</span>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {selectedPayment && (
          <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayment(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="card-premium p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-heading font-bold text-gray-900 dark:text-white">
                    تفاصيل الدفع #{selectedPayment.id}
                  </h2>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">المستخدم</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedPayment.user ? `${selectedPayment.user.first_name} ${selectedPayment.user.last_name}` : '-'}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-700 dark:to-purple-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">البريد الإلكتروني</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.user?.email || '-'}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">المبلغ</p>
                      <p className="font-bold text-xl text-green-600 dark:text-green-400">{Number(selectedPayment.amount).toFixed(2)} ريال</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-700 dark:to-indigo-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">طريقة الدفع</p>
                      <p className="font-medium text-gray-900 dark:text-white">{getPaymentMethodText(selectedPayment.method)}</p>
                    </div>
                    {selectedPayment.reference_number && (
                      <div className="p-3 bg-gradient-to-br from-gray-50 to-yellow-50 dark:from-gray-700 dark:to-yellow-900 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">رقم المرجع</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.reference_number}</p>
                      </div>
                    )}
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">الحالة</p>
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${getStatusColor(selectedPayment.status)}`}>
                        {getStatusText(selectedPayment.status)}
                      </span>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-700 dark:to-purple-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ التقديم</p>
                      <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedPayment.created_at).toLocaleString('ar')}</p>
                    </div>
                  </div>

                  {selectedPayment.method === 'e_wallet' && selectedPayment.account_details && (() => {
                    try {
                      const walletInfo = JSON.parse(selectedPayment.account_details);
                      const walletNames = {
                        'jeeb': 'جيب',
                        'jawaly': 'جوالي',
                        'flousc': 'فلوسك',
                        'cash': 'كاش',
                        'onecash': 'ون كاش',
                        'yahmoney': 'ياه ماني',
                        'onemoney': 'ون ماني',
                        'mobilemoney': 'موبايل ماني'
                      };
                      return (
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                          <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-3">📱 معلومات المحفظة الإلكترونية</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">نوع المحفظة:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{walletNames[walletInfo.walletType] || walletInfo.walletType}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">اسم صاحب المحفظة:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{walletInfo.walletName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">رقم المحفظة:</span>
                              <span className="font-bold text-gray-900 dark:text-white direction-ltr">{walletInfo.walletNumber}</span>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}

                  {selectedPayment.proof_path && (
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">إثبات الدفع</p>
                      <a
                        href={`/api/${selectedPayment.proof_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                      >
                        عرض المرفق
                      </a>
                    </div>
                  )}

                  {selectedPayment.approval_notes && (
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ملاحظات</p>
                      <p className="text-gray-800 dark:text-gray-200">{selectedPayment.approval_notes}</p>
                    </div>
                  )}

                  {selectedPayment.approved_at && (
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-lg">
                      <p className="text-sm text-purple-700 dark:text-purple-300">تاريخ الموافقة/الرفض</p>
                      <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedPayment.approved_at).toLocaleString('ar')}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <CTAButton
                    type="button"
                    onClick={() => setSelectedPayment(null)}
                    variant="ghost"
                    size="md"
                    icon={X}
                  >
                    إغلاق
                  </CTAButton>
                  {selectedPayment.status === 'PENDING' && (
                    <>
                      <CTAButton
                        type="button"
                        onClick={() => handleReject(selectedPayment.id)}
                        variant="danger"
                        size="md"
                        icon={XCircle}
                      >
                        رفض
                      </CTAButton>
                      <CTAButton
                        type="button"
                        onClick={() => handleApprove(selectedPayment.id)}
                        variant="success"
                        size="md"
                        icon={CheckCircle}
                      >
                        موافقة
                      </CTAButton>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </AnimatePresence>
        )}
        </div>
      </ResponsivePageShell>
  );
}

export default PaymentsReview;
