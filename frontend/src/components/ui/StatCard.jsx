import React from 'react';

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
    primary: 'from-primary-500 to-primary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-danger-500 to-danger-600',
    secondary: 'from-secondary-500 to-secondary-600',
    gray: 'from-gray-500 to-gray-600',
  };

  const iconBgClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
    secondary: 'bg-secondary-100 text-secondary-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const containerClasses = onClick 
    ? 'cursor-pointer hover:shadow-medium active:scale-98 transition-all duration-200' 
    : '';

  if (loading) {
    return (
      <div className={`card p-6 animate-pulse ${className}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`card p-6 ${containerClasses} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {value}
          </p>
          
          {(trend || description) && (
            <div className="flex items-center gap-2 mt-2">
              {trend && trendValue && (
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-gray-600'
                }`}>
                  {trend === 'up' && '↑'}
                  {trend === 'down' && '↓'}
                  {trendValue}
                </span>
              )}
              {description && (
                <span className="text-sm text-gray-500">
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClasses[color]} transition-transform duration-200`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
