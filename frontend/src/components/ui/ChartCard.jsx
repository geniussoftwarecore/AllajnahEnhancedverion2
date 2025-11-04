import React from 'react';
import { motion } from 'framer-motion';

function ChartCard({ title, subtitle, children, actions, loading = false, className = '' }) {
  if (loading) {
    return (
      <div className={`card p-6 animate-pulse ${className}`}>
        <div className="h-7 bg-gray-200 rounded-lg w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 border border-gray-100 ${className}`}
    >
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-100">
        <div className="flex-1">
          <h3 className="text-xl font-black text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div className="min-h-[200px]">
        {children}
      </div>
    </motion.div>
  );
}

export default ChartCard;
