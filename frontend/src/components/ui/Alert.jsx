import React from 'react';
import { motion } from 'framer-motion';
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
    success: {
      container: 'bg-gradient-to-r from-success-50 via-success-100/50 to-success-50 border-success-300',
      text: 'text-success-900',
      icon: 'text-success-600',
      iconBg: 'bg-success-100',
    },
    error: {
      container: 'bg-gradient-to-r from-danger-50 via-danger-100/50 to-danger-50 border-danger-300',
      text: 'text-danger-900',
      icon: 'text-danger-600',
      iconBg: 'bg-danger-100',
    },
    warning: {
      container: 'bg-gradient-to-r from-warning-50 via-warning-100/50 to-warning-50 border-warning-300',
      text: 'text-warning-900',
      icon: 'text-warning-600',
      iconBg: 'bg-warning-100',
    },
    info: {
      container: 'bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50 border-primary-300',
      text: 'text-primary-900',
      icon: 'text-primary-600',
      iconBg: 'bg-primary-100',
    },
  };

  const style = styles[type];
  const Icon = icons[type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-2xl border-2 p-5 ${style.container} ${className} backdrop-blur-sm transition-all duration-300 hover:shadow-medium shadow-soft`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${style.icon}`} strokeWidth={2.5} />
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-bold mb-1.5 text-base ${style.text}`}>
              {title}
            </h3>
          )}
          {message && (
            <p className={`text-sm leading-relaxed ${style.text} opacity-90`}>
              {message}
            </p>
          )}
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={`btn-touch p-1.5 hover:opacity-70 transition-all duration-200 rounded-lg hover:bg-black/10 active:scale-95 ${style.text}`}
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Alert;
