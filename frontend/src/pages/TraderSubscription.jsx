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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{getPaymentMethodText(payment.method)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${getPaymentStatusColor(payment.status)}`}>
                          {getPaymentStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {new Date(payment.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={payment.approval_notes}>{payment.approval_notes || '-'}</td>
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
    proofPreview: null,
    walletType: '',
    walletName: '',
    walletNumber: '',
    referenceNumber: ''
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

  const SUBSCRIPTION_AMOUNT = 200.00;
  const DEFAULT_PAYMENT_METHOD_ID = 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.method === 'e_wallet') {
      if (!formData.walletType || !formData.walletName || !formData.walletNumber) {
        toast.error('يرجى إكمال جميع معلومات المحفظة الإلكترونية');
        return;
      }
      if (!formData.proof) {
        toast.error('يرجى رفع إثبات الدفع للمحفظة الإلكترونية');
        return;
      }
    }
    
    if (formData.method === 'bank_transfer' && !formData.proof && !formData.referenceNumber) {
      toast.warning('يُنصح برفع إثبات الدفع أو إدخال رقم المرجع للتحويل البنكي');
    }
    
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('payment_method_id', DEFAULT_PAYMENT_METHOD_ID.toString());
      formDataToSend.append('amount', SUBSCRIPTION_AMOUNT.toFixed(2));
      formDataToSend.append('method', formData.method);
      
      if (formData.referenceNumber) {
        formDataToSend.append('reference_number', formData.referenceNumber);
      }
      
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
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, proof: file, proofPreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="card-glass-strong p-4 sm:p-6 max-w-md w-full border-2 border-primary-200 dark:border-primary-700 max-h-[95vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              دفعة جديدة
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg border border-primary-200 dark:border-primary-700">
            <p className="text-xs text-primary-700 dark:text-primary-300 mb-0.5 font-semibold">المبلغ المطلوب</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{SUBSCRIPTION_AMOUNT.toFixed(2)} ريال</p>
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">رسوم الاشتراك السنوي</p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">طريقة الدفع</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value, walletType: '', walletName: '', walletNumber: '' })}
              className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="credit_card">بطاقة ائتمان</option>
              <option value="e_wallet">محفظة إلكترونية</option>
              <option value="cash">نقداً</option>
            </select>
          </div>

          {formData.method === 'e_wallet' && (
            <>
              <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  📱 قم باختيار المحفظة الإلكترونية وإدخال معلومات الحساب الذي ستقوم بالدفع إليه
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  نوع المحفظة الإلكترونية <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.walletType}
                  onChange={(e) => setFormData({ ...formData, walletType: e.target.value })}
                  className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
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
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  اسم صاحب المحفظة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.walletName}
                  onChange={(e) => setFormData({ ...formData, walletName: e.target.value })}
                  placeholder="أدخل الاسم الكامل لصاحب المحفظة"
                  className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  رقم المحفظة <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.walletNumber}
                  onChange={(e) => setFormData({ ...formData, walletNumber: e.target.value })}
                  placeholder="أدخل رقم المحفظة (مثال: 777123456)"
                  className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>
            </>
          )}

          {formData.method !== 'e_wallet' && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                رقم المرجع <span className="text-gray-500 text-xs">(اختياري)</span>
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="رقم العملية أو المرجع (إن وجد)"
                className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              إثبات الدفع {formData.method === 'e_wallet' && <span className="text-red-500">*</span>}
              {formData.method !== 'e_wallet' && <span className="text-gray-500 text-xs">(اختياري)</span>}
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300"
              required={formData.method === 'e_wallet'}
            />
            {formData.method === 'e_wallet' && (
              <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                يرجى رفع صورة توضح عملية الدفع من محفظتك إلى الرقم المحدد أعلاه
              </p>
            )}
            {formData.proofPreview && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">معاينة المرفق:</p>
                <img 
                  src={formData.proofPreview} 
                  alt="معاينة" 
                  className="max-h-32 rounded border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2">
            <CTAButton
              type="button"
              onClick={onClose}
              variant="secondary"
              size="sm"
              fullWidth
            >
              إلغاء
            </CTAButton>
            <CTAButton
              type="submit"
              variant="primary"
              size="sm"
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
