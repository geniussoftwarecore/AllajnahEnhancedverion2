import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsivePageShell, CTAButton } from '../components/ui';
import { CheckCircle, Home } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

function PaymentSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
  }, [queryClient]);

  return (
    <ResponsivePageShell title="" showNav={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="card-premium p-12 max-w-2xl w-full text-center shadow-2xl border-2 border-green-200"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
          >
            <CheckCircle className="w-16 h-16 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-gray-900 mb-4"
          >
            تمت عملية الدفع بنجاح!
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-gray-700 mb-6"
          >
            Payment Successful!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-600 mb-4"
          >
            شكراً لك! تم تفعيل اشتراكك بنجاح.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base text-gray-500 mb-8"
          >
            Thank you! Your subscription has been activated successfully.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 mb-8"
          >
            <p className="text-sm text-green-700 font-semibold">
              ✓ تم تفعيل اشتراكك ويمكنك الآن الوصول إلى جميع مميزات النظام
            </p>
            <p className="text-xs text-green-600 mt-1">
              Your subscription is now active and you have access to all system features
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <CTAButton
              onClick={() => navigate('/')}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Home className="w-5 h-5" />}
            >
              العودة إلى لوحة التحكم / Back to Dashboard
            </CTAButton>
          </motion.div>
        </motion.div>
      </div>
    </ResponsivePageShell>
  );
}

export default PaymentSuccess;
