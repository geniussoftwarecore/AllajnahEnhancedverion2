import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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
      toast.warning('يرجى إدخال سبب الرفض');
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">مراجعة الدفعات</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            الكل ({payments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
          >
            قيد المراجعة
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            موافق عليها
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            مرفوضة
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">لا توجد دفعات</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">طريقة الدفع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التقديم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.user ? `${payment.user.first_name} ${payment.user.last_name}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    {Number(payment.amount).toFixed(2)} ريال
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.method}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.created_at).toLocaleDateString('ar')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">تفاصيل الدفع #{selectedPayment.id}</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">المستخدم</p>
                  <p className="font-medium">
                    {selectedPayment.user ? `${selectedPayment.user.first_name} ${selectedPayment.user.last_name}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                  <p className="font-medium">{selectedPayment.user?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">المبلغ</p>
                  <p className="font-medium text-lg">{Number(selectedPayment.amount).toFixed(2)} ريال</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">طريقة الدفع</p>
                  <p className="font-medium">{selectedPayment.method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusText(selectedPayment.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاريخ التقديم</p>
                  <p className="font-medium">{new Date(selectedPayment.created_at).toLocaleString('ar')}</p>
                </div>
              </div>

              {selectedPayment.proof_path && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">إثبات الدفع</p>
                  <a
                    href={`/api/${selectedPayment.proof_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    عرض المرفق
                  </a>
                </div>
              )}

              {selectedPayment.approval_notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">ملاحظات</p>
                  <p className="bg-gray-50 p-3 rounded">{selectedPayment.approval_notes}</p>
                </div>
              )}

              {selectedPayment.approved_at && (
                <div>
                  <p className="text-sm text-gray-600">تاريخ الموافقة/الرفض</p>
                  <p className="font-medium">{new Date(selectedPayment.approved_at).toLocaleString('ar')}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إغلاق
              </button>
              {selectedPayment.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedPayment.id)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    رفض
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPayment.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
  );
}

export default PaymentsReview;
