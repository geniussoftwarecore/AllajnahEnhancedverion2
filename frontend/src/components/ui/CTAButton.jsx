import React from 'react';

const CTAButton = ({ 
  children, 
  onClick, 
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseClasses = 'btn-touch font-bold focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] flex items-center justify-center transform transition-all duration-300 relative overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-size-200 hover:bg-right-bottom text-white focus:ring-primary-500/30 shadow-medium hover:shadow-glow-green hover:scale-[1.03] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700',
    secondary: 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-gray-900 focus:ring-gray-300 shadow-soft hover:shadow-medium border-2 border-gray-200 hover:border-gray-300',
    success: 'bg-gradient-to-r from-success-600 via-success-500 to-success-600 bg-size-200 hover:bg-right-bottom text-white focus:ring-success-500/30 shadow-medium hover:shadow-glow-success hover:scale-[1.03]',
    danger: 'bg-gradient-to-r from-danger-600 via-danger-500 to-danger-600 bg-size-200 hover:bg-right-bottom text-white focus:ring-danger-500/30 shadow-medium hover:shadow-strong hover:scale-[1.03]',
    warning: 'bg-gradient-to-r from-warning-500 via-warning-400 to-warning-500 bg-size-200 hover:bg-right-bottom text-white focus:ring-warning-400/30 shadow-medium hover:shadow-strong hover:scale-[1.03]',
    outline: 'border-2 border-primary-600 text-primary-700 hover:bg-primary-50 hover:border-primary-700 focus:ring-primary-500/30 hover:shadow-medium bg-white hover:scale-[1.02]',
    ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500/30 hover:text-primary-700 hover:scale-[1.02]',
    glass: 'bg-white/50 backdrop-blur-xl border-2 border-white/70 text-gray-900 hover:bg-white/70 focus:ring-primary-500/20 shadow-glass hover:shadow-glass-strong hover:scale-[1.02]',
  };

  const sizeStyles = {
    sm: {
      padding: 'var(--spacing-2) var(--spacing-4)',
      fontSize: 'var(--font-size-sm)',
    },
    md: {
      padding: 'var(--spacing-3) var(--spacing-6)',
      fontSize: 'var(--font-size-base)',
    },
    lg: {
      padding: 'var(--spacing-4) var(--spacing-8)',
      fontSize: 'var(--font-size-lg)',
    },
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      style={{
        ...sizeStyles[size],
        borderRadius: 'var(--border-radius-xl)',
        gap: 'var(--spacing-2)',
        transition: 'all var(--transition-smooth)',
        backgroundSize: '200% auto',
      }}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin h-5 w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          role="status"
          aria-live="polite"
          aria-label="جاري التحميل"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
      <span className="font-bold">{children}</span>
      {!loading && leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
    </button>
  );
};

export default CTAButton;
