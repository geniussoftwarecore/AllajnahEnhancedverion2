import React from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  action,
  className = ''
}) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const styles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-danger-50 border-danger-200 text-danger-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
  };

  const iconStyles = {
    success: 'text-success-600',
    error: 'text-danger-600',
    warning: 'text-warning-600',
    info: 'text-primary-600',
  };

  const Icon = icons[type];

  return (
    <div className={`rounded-xl border-2 p-4 ${styles[type]} ${className} animate-slide-in-down backdrop-blur-sm transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${iconStyles[type]} animate-bounce-once`} />
        </div>
        
        <div className="flex-1">
          {title && (
            <h3 className="font-semibold mb-1 text-base">
              {title}
            </h3>
          )}
          {message && (
            <p className="text-sm leading-relaxed">
              {message}
            </p>
          )}
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="btn-touch p-1 hover:opacity-70 transition-all duration-200 rounded-lg hover:bg-black/5 active:scale-95"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
