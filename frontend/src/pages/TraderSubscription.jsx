import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api/axios';

function TraderSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, payRes] = await Promise.all([
        api.get('/subscriptions/me'),
        api.get('/payments')
      ]);
      setSubscription(subRes.data);
      setPayments(payRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'expired': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'pending': return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 'cancelled': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'pending': return 'قيد الانتظار';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 'approved': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  const isExpiredOrExpiring = () => {
    if (!subscription) return false;
    const endDate = new Date(subscription.end_date);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return subscription.status === 'expired' || daysRemaining <= 30;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              الاشتراك والدفع
            </h1>
            <p className="text-gray-600 dark:text-gray-400">إدارة اشتراكك وتتبع المدفوعات</p>
          </div>
          <Link 
            to="/" 
            className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
          >
            العودة إلى لوحة التحكم
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            حالة الاشتراك
          </h2>
          
          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">الحالة</p>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-700 dark:to-purple-900 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">تاريخ البداية</p>
                  <p className="font-bold text-gray-900 dark:text-white">{new Date(subscription.start_date).toLocaleDateString('ar')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-700 dark:to-indigo-900 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">تاريخ الانتهاء</p>
                  <p className="font-bold text-gray-900 dark:text-white">{new Date(subscription.end_date).toLocaleDateString('ar')}</p>
                </div>
              </div>

              {isExpiredOrExpiring() && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-6">
                  <p className="text-yellow-800 dark:text-yellow-200 font-semibold mb-3">
                    {subscription.status === 'expired' 
                      ? 'اشتراكك منتهي. يرجى تجديد الاشتراك للاستمرار في تقديم الشكاوى.' 
                      : 'اشتراكك سينتهي قريباً. يرجى تجديده في أقرب وقت ممكن.'}
                  </p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    تجديد الاشتراك الآن
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">لا يوجد اشتراك نشط</p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                اشترك الآن
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              سجل الدفعات
            </h2>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              + دفعة جديدة
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد دفعات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">المبلغ</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">طريقة الدفع</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all transform hover:scale-[1.01]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{payment.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                        {Number(payment.amount).toFixed(2)} ريال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{payment.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${getPaymentStatusColor(payment.status)}`}>
                          {getPaymentStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {new Date(payment.created_at).toLocaleDateString('ar')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{payment.approval_notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showPaymentModal && (
          <PaymentModal 
            subscription={subscription} 
            onClose={() => setShowPaymentModal(false)} 
            onSuccess={loadData} 
          />
        )}
      </div>
    </div>
  );
}

function PaymentModal({ subscription, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    method: 'bank_transfer',
    proof: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('method', formData.method);
      if (formData.proof) {
        formDataToSend.append('proof', formData.proof);
      }

      await api.post('/payments', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء تقديم الدفع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full border-2 border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          دفعة جديدة
        </h2>
        
        {error && (
          <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900 dark:to-pink-900 border-2 border-red-400 dark:border-red-600 rounded-xl text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">المبلغ المطلوب</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">200.00 ريال</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">طريقة الدفع</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="credit_card">بطاقة ائتمان</option>
              <option value="cash">نقداً</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">إثبات الدفع (اختياري)</label>
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, proof: e.target.files[0] })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الإرسال...' : 'تقديم الدفع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TraderSubscription;
