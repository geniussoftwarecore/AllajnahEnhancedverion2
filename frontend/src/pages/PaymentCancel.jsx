import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsivePageShell, CTAButton } from '../components/ui';
import { XCircle, RotateCcw, Home } from 'lucide-react';

function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <ResponsivePageShell title="" showNav={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="card-premium p-12 max-w-2xl w-full text-center shadow-2xl border-2 border-yellow-200"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg"
          >
            <XCircle className="w-16 h-16 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-gray-900 mb-4"
          >
            تم إلغاء عملية الدفع
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-gray-700 mb-6"
          >
            Payment Cancelled
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-600 mb-4"
          >
            لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base text-gray-500 mb-8"
          >
            The payment was not completed. You can try again.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 mb-8"
          >
            <p className="text-sm text-yellow-700 font-semibold">
              لم يتم خصم أي مبلغ من حسابك
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              No charges were made to your account
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <CTAButton
              onClick={() => navigate('/subscription-payment')}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<RotateCcw className="w-5 h-5" />}
            >
              حاول مرة أخرى / Try Again
            </CTAButton>
            <CTAButton
              onClick={() => navigate('/')}
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={<Home className="w-5 h-5" />}
            >
              العودة للرئيسية / Back to Home
            </CTAButton>
          </motion.div>
        </motion.div>
      </div>
    </ResponsivePageShell>
  );
}

export default PaymentCancel;
