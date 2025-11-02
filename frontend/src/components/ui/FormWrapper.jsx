import React from 'react';
import { motion } from 'framer-motion';

const FormWrapper = ({ 
  children, 
  title, 
  subtitle, 
  icon: Icon,
  onSubmit,
  className = '',
  showBackground = true
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 animate-fade-in relative overflow-hidden ${className}`}>
      {showBackground && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIyYzU1ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        </>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6 bg-white/95 backdrop-blur-lg p-6 sm:p-10 rounded-3xl shadow-xl relative z-10 border border-primary-100"
      >
        {(title || subtitle || Icon) && (
          <div className="text-center">
            {Icon && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                <Icon className="w-10 h-10 text-white relative z-10" />
              </motion.div>
            )}
            {title && (
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2"
              >
                {title}
              </motion.h2>
            )}
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base text-gray-600"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {onSubmit ? (
            <form onSubmit={onSubmit} className="space-y-5">
              {children}
            </form>
          ) : (
            <div className="space-y-5">
              {children}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FormWrapper;
