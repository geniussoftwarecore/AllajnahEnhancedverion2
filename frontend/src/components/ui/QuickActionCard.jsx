import React from 'react';
import { motion } from 'framer-motion';

function QuickActionCard({ icon: Icon, title, description, onClick, color = 'primary', badge }) {
  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-br from-primary-50 via-primary-100/50 to-primary-50',
      text: 'text-primary-700',
      icon: 'text-primary-600',
      border: 'border-primary-200',
      hover: 'hover:from-primary-100 hover:via-primary-200/50 hover:to-primary-100 hover:shadow-glow-primary',
    },
    success: {
      bg: 'bg-gradient-to-br from-success-50 via-success-100/50 to-success-50',
      text: 'text-success-700',
      icon: 'text-success-600',
      border: 'border-success-200',
      hover: 'hover:from-success-100 hover:via-success-200/50 hover:to-success-100 hover:shadow-glow-success',
    },
    warning: {
      bg: 'bg-gradient-to-br from-warning-50 via-warning-100/50 to-warning-50',
      text: 'text-warning-700',
      icon: 'text-warning-600',
      border: 'border-warning-200',
      hover: 'hover:from-warning-100 hover:via-warning-200/50 hover:to-warning-100',
    },
    danger: {
      bg: 'bg-gradient-to-br from-danger-50 via-danger-100/50 to-danger-50',
      text: 'text-danger-700',
      icon: 'text-danger-600',
      border: 'border-danger-200',
      hover: 'hover:from-danger-100 hover:via-danger-200/50 hover:to-danger-100',
    },
    gray: {
      bg: 'bg-gradient-to-br from-gray-50 via-gray-100/50 to-gray-50',
      text: 'text-gray-700',
      icon: 'text-gray-600',
      border: 'border-gray-200',
      hover: 'hover:from-gray-100 hover:via-gray-200/50 hover:to-gray-100',
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full p-5 rounded-2xl border-2 text-right transition-all duration-300 ${colors.bg} ${colors.border} ${colors.hover} shadow-soft hover:shadow-medium`}
    >
      {badge && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 left-3 bg-gradient-to-r from-danger-500 to-danger-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-medium"
        >
          {badge}
        </motion.span>
      )}
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-soft ${colors.icon}`}>
          <Icon className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <div className="flex-1 text-right">
          <h4 className={`font-bold text-base ${colors.text}`}>{title}</h4>
          {description && (
            <p className="text-sm text-gray-600 mt-0.5 font-medium">{description}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default QuickActionCard;
