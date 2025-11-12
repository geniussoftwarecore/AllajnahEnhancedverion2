import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsivePageShell, CTAButton, Alert } from '../components/ui';
import { CreditCard, Check, Sparkles, Calendar, Shield, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSubscription } from '../hooks/useQueries';
import api from '../api/axios';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

function SubscriptionPayment() {
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = {
    monthly: {
      name: 'شهري / Monthly',
      nameAr: 'شهري',
      nameEn: 'Monthly',
      price: 200,
      priceText: '200 ريال/شهر',
      priceTextEn: '200 SAR/month',
      interval: 'month',
      savings: null
    },
    yearly: {
      name: 'سنوي / Yearly',
      nameAr: 'سنوي',
      nameEn: 'Yearly',
      price: 1920,
      priceText: '1,920 ريال/سنة',
      priceTextEn: '1,920 SAR/year',
      interval: 'year',
      savings: 'وفر 20% / Save 20%'
    }
  };

  const benefits = [
    { ar: 'تقديم شكاوى غير محدودة', en: 'Unlimited complaint submissions', icon: Check },
    { ar: 'متابعة حالة الشكاوى', en: 'Track complaint status', icon: Shield },
    { ar: 'دعم فني على مدار الساعة', en: '24/7 technical support', icon: Clock },
    { ar: 'تقارير مفصلة', en: 'Detailed reports', icon: Sparkles }
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/stripe/create-checkout', {
        plan_type: selectedPlan
      });
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        toast.error('حدث خطأ في إنشاء جلسة الدفع / Error creating checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error(error.response?.data?.detail || 'حدث خطأ أثناء إنشاء جلسة الدفع / Error creating checkout session');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionDaysRemaining = () => {
    if (!subscription?.end_date) return 0;
    return differenceInDays(new Date(subscription.end_date), new Date());
  };

  const isSubscriptionExpiring = () => {
    const daysRemaining = getSubscriptionDaysRemaining();
    return daysRemaining > 0 && daysRemaining < 7;
  };

  const isSubscriptionExpired = () => {
    return subscription?.status === 'expired' || getSubscriptionDaysRemaining() <= 0;
  };

  if (isLoading) {
    return (
      <ResponsivePageShell title="الاشتراك / Subscription">
        <div className="p-12 text-center">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-gray-600 font-semibold text-lg">جاري التحميل... / Loading...</p>
        </div>
      </ResponsivePageShell>
    );
  }

  return (
    <ResponsivePageShell title="الاشتراك / Subscription" subtitle="اختر الخطة المناسبة لك / Choose your plan">
      <div className="space-y-6">
        {subscription?.status === 'active' && !isSubscriptionExpiring() && (
          <Alert
            type="success"
            title="الاشتراك نشط / Active Subscription"
            message={`اشتراكك نشط حتى ${format(new Date(subscription.end_date), 'd MMMM yyyy', { locale: ar })} / Your subscription is active until ${format(new Date(subscription.end_date), 'MMMM d, yyyy')}`}
          />
        )}

        {isSubscriptionExpiring() && (
          <Alert
            type="warning"
            title="تحذير انتهاء الاشتراك / Expiration Warning"
            message={`سينتهي اشتراكك خلال ${getSubscriptionDaysRemaining()} أيام. جدده الآن لتجنب انقطاع الخدمة. / Your subscription will expire in ${getSubscriptionDaysRemaining()} days. Renew now to avoid service interruption.`}
          />
        )}

        {isSubscriptionExpired() && (
          <Alert
            type="error"
            title="اشتراك منتهي / Expired Subscription"
            message="انتهى اشتراكك. يرجى التجديد للاستمرار في استخدام النظام. / Your subscription has expired. Please renew to continue using the system."
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 shadow-xl border-2 border-primary-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">خطط الاشتراك / Subscription Plans</h2>
              <p className="text-gray-600">اختر الخطة التي تناسب احتياجاتك / Choose the plan that fits your needs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.entries(plans).map(([key, plan]) => (
              <motion.button
                key={key}
                onClick={() => setSelectedPlan(key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                  selectedPlan === key
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                }`}
              >
                {plan.savings && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {plan.savings}
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === key
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPlan === key && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-4xl font-black text-primary-600 mb-1">{plan.price}</p>
                  <p className="text-sm text-gray-600">{plan.priceText}</p>
                  <p className="text-xs text-gray-500 mt-1">{plan.priceTextEn}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              المزايا / Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{benefit.ar}</p>
                    <p className="text-xs text-gray-600">{benefit.en}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {subscription?.status === 'active' && !isSubscriptionExpired() ? (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">اشتراكك الحالي / Current Subscription</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    ينتهي في {format(new Date(subscription.end_date), 'd MMMM yyyy', { locale: ar })} / 
                    Expires on {format(new Date(subscription.end_date), 'MMMM d, yyyy')}
                  </p>
                  <CTAButton
                    onClick={handleSubscribe}
                    variant="success"
                    size="md"
                    loading={loading}
                    disabled={loading}
                    leftIcon={<CreditCard className="w-5 h-5" />}
                  >
                    جدد الاشتراك / Renew Subscription
                  </CTAButton>
                </div>
              </div>
            </div>
          ) : (
            <CTAButton
              onClick={handleSubscribe}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              leftIcon={<CreditCard className="w-5 h-5" />}
            >
              {loading ? 'جاري المعالجة... / Processing...' : 'اشترك الآن / Subscribe Now'}
            </CTAButton>
          )}
        </motion.div>

        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <h3 className="font-bold text-gray-900 mb-2">💳 الدفع الآمن / Secure Payment</h3>
          <p className="text-sm text-gray-700">
            يتم معالجة جميع المدفوعات بشكل آمن عبر Stripe. لن نقوم بتخزين معلومات بطاقتك الائتمانية.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            All payments are securely processed via Stripe. We never store your credit card information.
          </p>
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default SubscriptionPayment;
