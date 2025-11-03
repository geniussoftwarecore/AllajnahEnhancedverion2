import React from 'react';
import { motion } from 'framer-motion';

const LoadingFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect rounded-3xl shadow-glass"
        style={{ 
          padding: 'var(--spacing-8)',
          textAlign: 'center'
        }}
      >
        <div className="flex flex-col items-center" style={{ gap: 'var(--spacing-4)' }}>
          <svg 
            className="animate-spin h-12 w-12 text-primary-600" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            role="status"
            aria-live="polite"
            aria-label="جاري تحميل الصفحة"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p 
            className="text-gray-700 dark:text-gray-300 font-medium"
            style={{ fontSize: 'var(--font-size-lg)' }}
          >
            جاري التحميل...
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingFallback;
