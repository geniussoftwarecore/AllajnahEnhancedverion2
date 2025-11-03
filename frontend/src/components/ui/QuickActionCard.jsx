import React from 'react';
import { motion } from 'framer-motion';

function QuickActionCard({ icon: Icon, title, description, onClick, color = 'primary', badge }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 hover:bg-primary-100 border-primary-200',
    success: 'bg-success-50 text-success-600 hover:bg-success-100 border-success-200',
    warning: 'bg-warning-50 text-warning-600 hover:bg-warning-100 border-warning-200',
    danger: 'bg-danger-50 text-danger-600 hover:bg-danger-100 border-danger-200',
    gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full p-4 rounded-xl border-2 text-right transition-all ${colorClasses[color]}`}
    >
      {badge && (
        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1 text-right">
          <h4 className="font-bold text-base">{title}</h4>
          {description && <p className="text-sm opacity-75 mt-0.5">{description}</p>}
        </div>
      </div>
    </motion.button>
  );
}

export default QuickActionCard;
