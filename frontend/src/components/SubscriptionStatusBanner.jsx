import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Alert, CTAButton } from './ui';
import { CreditCard, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

function SubscriptionStatusBanner() {
  const navigate = useNavigate();

  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      const response = await api.get('/users/subscription-status');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  if (isLoading || !subscriptionStatus) {
    return null;
  }

  const getDaysRemaining = () => {
    if (!subscriptionStatus.end_date) return 0;
    return differenceInDays(new Date(subscriptionStatus.end_date), new Date());
  };

  const daysRemaining = getDaysRemaining();
  const isExpiring = daysRemaining > 0 && daysRemaining < 7;
  const isExpired = subscriptionStatus.status === 'expired' || daysRemaining <= 0;
  const isActive = subscriptionStatus.status === 'active' && daysRemaining > 7;

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Alert
          type="error"
          title="اشتراك منتهي / Expired Subscription"
          message={
            <div>
              <p className="mb-3">
                انتهى اشتراكك. يرجى التجديد للاستمرار في تقديم الشكاوى واستخدام النظام.
              </p>
              <p className="text-sm mb-3">
                Your subscription has expired. Please renew to continue submitting complaints and using the system.
              </p>
              {subscriptionStatus.end_date && (
                <p className="text-sm opacity-90 mb-3">
                  تاريخ الانتهاء: {format(new Date(subscriptionStatus.end_date), 'd MMMM yyyy', { locale: ar })} / 
                  Expiry date: {format(new Date(subscriptionStatus.end_date), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          }
          action={
            <CTAButton
              onClick={() => navigate('/subscription-payment')}
              variant="danger"
              size="md"
              leftIcon={<CreditCard className="w-5 h-5" />}
            >
              جدد الآن / Renew Now
            </CTAButton>
          }
        />
      </motion.div>
    );
  }

  if (isExpiring) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Alert
          type="warning"
          title="تحذير انتهاء الاشتراك / Subscription Expiring Soon"
          message={
            <div>
              <p className="mb-3">
                سينتهي اشتراكك خلال {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'}. جدده الآن لتجنب انقطاع الخدمة.
              </p>
              <p className="text-sm mb-3">
                Your subscription will expire in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. Renew now to avoid service interruption.
              </p>
              {subscriptionStatus.end_date && (
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <Calendar className="w-4 h-4" />
                  <span>
                    تاريخ الانتهاء: {format(new Date(subscriptionStatus.end_date), 'd MMMM yyyy', { locale: ar })} / 
                    Expires: {format(new Date(subscriptionStatus.end_date), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          }
          action={
            <CTAButton
              onClick={() => navigate('/subscription-payment')}
              variant="warning"
              size="md"
              leftIcon={<CreditCard className="w-5 h-5" />}
            >
              جدد الآن / Renew Now
            </CTAButton>
          }
        />
      </motion.div>
    );
  }

  if (isActive && subscriptionStatus.end_date) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-900 mb-1">الاشتراك نشط / Active Subscription</h3>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Calendar className="w-4 h-4" />
                <span>
                  ينتهي في {format(new Date(subscriptionStatus.end_date), 'd MMMM yyyy', { locale: ar })} / 
                  Expires on {format(new Date(subscriptionStatus.end_date), 'MMMM d, yyyy')}
                </span>
                <span className="text-xs opacity-75">({daysRemaining} {daysRemaining === 1 ? 'يوم متبقي / day remaining' : 'أيام متبقية / days remaining'})</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

export default SubscriptionStatusBanner;
