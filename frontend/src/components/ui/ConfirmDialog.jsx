import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  XMarkIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'تأكيد', 
  cancelText = 'إلغاء',
  type = 'danger', // danger, warning, info
  isLoading = false
}) => {
  const typeStyles = {
    danger: {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-danger-100',
      iconColor: 'text-danger-600',
      confirmBg: 'bg-danger-600 hover:bg-danger-700',
      confirmText: 'text-white'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      confirmBg: 'bg-warning-600 hover:bg-warning-700',
      confirmText: 'text-white'
    },
    info: {
      icon: CheckIcon,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      confirmBg: 'bg-primary-600 hover:bg-primary-700',
      confirmText: 'text-white'
    }
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative transform overflow-hidden rounded-2xl bg-white text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute left-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="إغلاق"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className={`mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ${style.iconBg} sm:mx-0 sm:h-14 sm:w-14`}
                  >
                    <Icon className={`h-8 w-8 ${style.iconColor}`} aria-hidden="true" />
                  </motion.div>
                  <div className="mt-3 text-center sm:mr-4 sm:mt-0 sm:text-right flex-1">
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-xl font-bold leading-6 text-gray-900 mb-2"
                    >
                      {title}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-2"
                    >
                      <p className="text-base text-gray-600 leading-relaxed">
                        {message}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3"
              >
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onConfirm}
                  className={`inline-flex w-full justify-center rounded-xl ${style.confirmBg} ${style.confirmText} px-4 py-3 text-base font-semibold shadow-sm transition-all duration-200 sm:w-auto sm:text-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري التنفيذ...</span>
                    </div>
                  ) : (
                    confirmText
                  )}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onClose}
                  className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
