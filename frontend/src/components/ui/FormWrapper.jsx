import React from 'react';
import { motion } from 'framer-motion';
import Alert from './Alert';

const FormWrapper = ({ 
  children, 
  title, 
  subtitle, 
  icon: Icon,
  onSubmit,
  className = '',
  showBackground = true,
  errorSummary = null,
  onDismissError = null
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative overflow-hidden ${className}`}>
      {showBackground && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-primary-100/40"></div>
          <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-primary-300/40 to-primary-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 motion-safe:animate-float"></div>
          <div className="absolute bottom-0 -right-4 w-96 h-96 bg-gradient-to-br from-primary-200/30 to-success-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 motion-safe:animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIyYzU1ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        </>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="max-w-md w-full space-y-8 bg-white/98 backdrop-blur-2xl p-8 sm:p-12 rounded-3xl shadow-premium relative z-10 border-2 border-white/70"
      >
        {(title || subtitle || Icon) && (
          <div className="text-center">
            {Icon && (
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto w-24 h-24 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 rounded-3xl flex items-center justify-center mb-6 shadow-glow-green relative overflow-hidden group"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full motion-safe:group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <Icon className="w-12 h-12 text-white relative z-10 drop-shadow-lg" strokeWidth={2.5} />
              </motion.div>
            )}
            {title && (
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 bg-clip-text"
              >
                {title}
              </motion.h2>
            )}
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed"
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
          className="space-y-6"
        >
          {errorSummary && (
            <Alert
              type="error"
              message={errorSummary}
              onClose={onDismissError}
            />
          )}
          
          {onSubmit ? (
            <form onSubmit={onSubmit} className="space-y-6">
              {children}
            </form>
          ) : (
            <div className="space-y-6">
              {children}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FormWrapper;
