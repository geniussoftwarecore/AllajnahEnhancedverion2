import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  description,
  onClick,
  loading = false,
  className = ''
}) => {
  const colorClasses = {
    primary: {
      gradient: 'from-primary-500 to-primary-600',
      bg: 'bg-gradient-to-br from-primary-50 to-primary-100',
      text: 'text-primary-700',
      iconBg: 'bg-white shadow-soft',
      iconText: 'text-primary-600',
      border: 'border-primary-200/50'
    },
    success: {
      gradient: 'from-success-500 to-success-600',
      bg: 'bg-gradient-to-br from-success-50 to-success-100',
      text: 'text-success-700',
      iconBg: 'bg-white shadow-soft',
      iconText: 'text-success-600',
      border: 'border-success-200/50'
    },
    warning: {
      gradient: 'from-warning-500 to-warning-600',
      bg: 'bg-gradient-to-br from-warning-50 to-warning-100',
      text: 'text-warning-700',
      iconBg: 'bg-white shadow-soft',
      iconText: 'text-warning-600',
      border: 'border-warning-200/50'
    },
    danger: {
      gradient: 'from-danger-500 to-danger-600',
      bg: 'bg-gradient-to-br from-danger-50 to-danger-100',
      text: 'text-danger-700',
      iconBg: 'bg-white shadow-soft',
      iconText: 'text-danger-600',
      border: 'border-danger-200/50'
    },
    secondary: {
      gradient: 'from-secondary-500 to-secondary-600',
      bg: 'bg-gradient-to-br from-secondary-50 to-secondary-100',
      text: 'text-secondary-700',
      iconBg: 'bg-white shadow-soft',
      iconText: 'text-secondary-600',
      border: 'border-secondary-200/50'
    },
    gray: {
      gradient: 'from-gray-500 to-gray-600',
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
      text: 'text-gray-700',
      iconBg: 'bg-white shadow-soft',
      iconText: 'text-gray-600',
      border: 'border-gray-200/50'
    },
  };

  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className={`card p-6 animate-pulse ${className}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const CardWrapper = onClick ? motion.div : 'div';
  const cardProps = onClick ? {
    onClick,
    whileHover: { scale: 1.02, y: -4 },
    whileTap: { scale: 0.98 },
    className: `card-hover p-6 border ${colors.border} ${className}`,
  } : {
    className: `card p-6 border ${colors.border} ${className}`,
  };

  return (
    <CardWrapper {...cardProps}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-4xl font-black text-gray-900 leading-tight">
            {value}
          </p>
          
          {(trend || description) && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
              {trend && trendValue && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  trend === 'up' 
                    ? 'bg-success-100 text-success-700' 
                    : trend === 'down' 
                    ? 'bg-danger-100 text-danger-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {trend === 'up' && '↑'}
                  {trend === 'down' && '↓'}
                  <span>{trendValue}</span>
                </span>
              )}
              {description && (
                <span className="text-xs text-gray-500 font-medium">
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.iconBg} ${colors.iconText} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-7 h-7" strokeWidth={2.5} />
          </div>
        )}
      </div>
    </CardWrapper>
  );
};

export default StatCard;
