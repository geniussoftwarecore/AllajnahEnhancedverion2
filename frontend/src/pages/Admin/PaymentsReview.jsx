import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ResponsivePageShell } from '../../components/ui';
import api from '../../api/axios';

function PaymentsReview() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/payments', { params });
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('فشل في تحميل الدفعات');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    const notes = window.prompt('ملاحظات الموافقة (اختياري):');
    if (notes === null) return;

    try {
      await api.patch(`/payments/${paymentId}`, {
        status: 'approved',
        approval_notes: notes || undefined
      });
      toast.success('تمت الموافقة على الدفع بنجاح');
      loadPayments();
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
        status: 'rejected',
        approval_notes: notes
      });
      toast.success('تم رفض الدفع');
      loadPayments();
      setSelectedPayment(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في رفض الدفع');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 'approved': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  return (
    <ResponsivePageShell 
      title="مراجعة الدفعات"
      subtitle="مراجعة والموافقة على دفعات التجار"
    >
      <div className="space-y-6">

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تصفية حسب الحالة</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 ${filter === 'all' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                الكل ({payments.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 ${filter === 'pending' ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                قيد المراجعة
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 ${filter === 'approved' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                موافق عليها
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 ${filter === 'rejected' ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                مرفوضة
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">جاري التحميل...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد دفعات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">المستخدم</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">المبلغ</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">طريقة الدفع</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">تاريخ التقديم</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all transform hover:scale-[1.01]">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{payment.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {payment.user ? `${payment.user.first_name} ${payment.user.last_name}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                          {Number(payment.amount).toFixed(2)} ريال
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{payment.method}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {new Date(payment.created_at).toLocaleDateString('ar')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold transition-all transform hover:scale-110"
                          >
                            عرض التفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200 dark:border-gray-700 animate-scale-in">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                  تفاصيل الدفع #{selectedPayment.id}
                </h2>
                
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
                      <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.method}</p>
                    </div>
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

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all"
                  >
                    إغلاق
                  </button>
                  {selectedPayment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReject(selectedPayment.id)}
                        className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                      >
                        رفض
                      </button>
                      <button
                        onClick={() => handleApprove(selectedPayment.id)}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                      >
                        موافقة
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ResponsivePageShell>
  );
}

export default PaymentsReview;
