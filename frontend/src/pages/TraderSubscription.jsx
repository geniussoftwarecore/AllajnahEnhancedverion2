import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResponsivePageShell, StatCard, CTAButton } from '../components/ui';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, FileText, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
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
      toast.error('حدث خطأ أثناء تحميل بيانات الاشتراك. يرجى المحاولة مرة أخرى.');
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
      <ResponsivePageShell 
        title="الاشتراك والدفع"
        subtitle="إدارة اشتراكك وتتبع المدفوعات"
      >
        <div className="p-12 text-center">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary-400 dark:border-t-primary-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 font-semibold text-lg">جاري تحميل بيانات الاشتراك...</p>
        </div>
      </ResponsivePageShell>
    );
  }

  return (
    <>
      <ResponsivePageShell 
        title="الاشتراك والدفع"
        subtitle="إدارة اشتراكك وتتبع المدفوعات"
      >
        <div className="space-y-6">
        {subscription && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <StatCard
                title="حالة الاشتراك"
                value={getStatusText(subscription.status)}
                icon={subscription.status === 'active' ? CheckCircle2 : AlertCircle}
                color={subscription.status === 'active' ? 'success' : subscription.status === 'expired' ? 'danger' : 'warning'}
                description={subscription.status === 'active' ? 'الاشتراك نشط' : 'يحتاج للتجديد'}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatCard
                title="تاريخ البداية"
                value={new Date(subscription.start_date).toLocaleDateString('ar')}
                icon={Calendar}
                color="primary"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatCard
                title="تاريخ الانتهاء"
                value={new Date(subscription.end_date).toLocaleDateString('ar')}
                icon={Calendar}
                color="secondary"
                description={`${Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))} يوم متبقي`}
              />
            </motion.div>
          </div>
        )}

        {isExpiredOrExpiring() && subscription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass-strong p-6 border-2 border-warning-400 dark:border-warning-600"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  {subscription.status === 'expired' ? 'اشتراك منتهي' : 'تنبيه تجديد الاشتراك'}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {subscription.status === 'expired' 
                    ? 'اشتراكك منتهي. يرجى تجديد الاشتراك للاستمرار في تقديم الشكاوى.' 
                    : 'اشتراكك سينتهي قريباً. يرجى تجديده في أقرب وقت ممكن.'}
                </p>
                <CTAButton
                  onClick={() => setShowPaymentModal(true)}
                  variant="warning"
                  size="md"
                  leftIcon={<CreditCard className="w-5 h-5" />}
                >
                  تجديد الاشتراك الآن
                </CTAButton>
              </div>
            </div>
          </motion.div>
        )}

        {!subscription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass-strong p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">ابدأ اشتراكك الآن للاستفادة من جميع مميزات النظام</p>
            <CTAButton
              onClick={() => setShowPaymentModal(true)}
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-5 h-5" />}
            >
              اشترك الآن
            </CTAButton>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-glass-strong p-6 border border-primary-100 dark:border-primary-900/30"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">سجل الدفعات</h3>
            </div>
            <CTAButton
              onClick={() => setShowPaymentModal(true)}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-5 h-5" />}
            >
              دفعة جديدة
            </CTAButton>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">لا توجد دفعات</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">المبلغ</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">طريقة الدفع</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-primary-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{payment.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-success-600 dark:text-success-400">
                        {Number(payment.amount).toFixed(2)} ريال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{payment.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${getPaymentStatusColor(payment.status)}`}>
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
        </motion.div>

        </div>
      </ResponsivePageShell>
      
      {showPaymentModal && (
        <PaymentModal 
          subscription={subscription} 
          onClose={() => setShowPaymentModal(false)} 
          onSuccess={loadData} 
        />
      )}
    </>
  );
}

function PaymentModal({ subscription, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    method: 'bank_transfer',
    proof: null,
    walletType: '',
    walletName: '',
    walletNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const yemeniWallets = [
    { value: 'jeeb', label: 'جيب' },
    { value: 'jawaly', label: 'جوالي' },
    { value: 'flousc', label: 'فلوسك' },
    { value: 'cash', label: 'كاش' },
    { value: 'onecash', label: 'ون كاش' },
    { value: 'yahmoney', label: 'ياه ماني' },
    { value: 'onemoney', label: 'ون ماني' },
    { value: 'mobilemoney', label: 'موبايل ماني' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('method', formData.method);
      
      if (formData.method === 'e_wallet') {
        const walletDetails = {
          walletType: formData.walletType,
          walletName: formData.walletName,
          walletNumber: formData.walletNumber
        };
        formDataToSend.append('account_details', JSON.stringify(walletDetails));
      }
      
      if (formData.proof) {
        formDataToSend.append('proof', formData.proof);
      }

      await api.post('/payments', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('تم تقديم طلب الدفع بنجاح! سيتم مراجعته من قبل الإدارة');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ أثناء تقديم الدفع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="card-glass-strong p-8 max-w-lg w-full border-2 border-primary-200 dark:border-primary-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              دفعة جديدة
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl border border-primary-200 dark:border-primary-700">
            <p className="text-sm text-primary-700 dark:text-primary-300 mb-1 font-semibold">المبلغ المطلوب</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">200.00 ريال</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">طريقة الدفع</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value, walletType: '', walletName: '', walletNumber: '' })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
            >
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="credit_card">بطاقة ائتمان</option>
              <option value="e_wallet">محفظة إلكترونية</option>
              <option value="cash">نقداً</option>
            </select>
          </div>

          {formData.method === 'e_wallet' && (
            <>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                  📱 قم باختيار المحفظة الإلكترونية وإدخال معلومات الحساب الذي ستقوم بالدفع إليه
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  نوع المحفظة الإلكترونية <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.walletType}
                  onChange={(e) => setFormData({ ...formData, walletType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
                  required
                >
                  <option value="">اختر المحفظة</option>
                  {yemeniWallets.map((wallet) => (
                    <option key={wallet.value} value={wallet.value}>
                      {wallet.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  اسم صاحب المحفظة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.walletName}
                  onChange={(e) => setFormData({ ...formData, walletName: e.target.value })}
                  placeholder="أدخل الاسم الكامل لصاحب المحفظة"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  رقم المحفظة <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.walletNumber}
                  onChange={(e) => setFormData({ ...formData, walletNumber: e.target.value })}
                  placeholder="أدخل رقم المحفظة (مثال: 777123456)"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              إثبات الدفع {formData.method === 'e_wallet' && <span className="text-red-500">*</span>}
              {formData.method !== 'e_wallet' && <span className="text-gray-500 text-xs">(اختياري)</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, proof: e.target.files[0] })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300"
              required={formData.method === 'e_wallet'}
            />
            {formData.method === 'e_wallet' && (
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                يرجى رفع صورة توضح عملية الدفع من محفظتك إلى الرقم المحدد أعلاه
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <CTAButton
              type="button"
              onClick={onClose}
              variant="secondary"
              size="md"
              fullWidth
            >
              إلغاء
            </CTAButton>
            <CTAButton
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? 'جاري الإرسال...' : 'تقديم الدفع'}
            </CTAButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default TraderSubscription;
