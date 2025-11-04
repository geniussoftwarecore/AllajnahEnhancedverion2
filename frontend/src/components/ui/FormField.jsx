import React, { forwardRef, useState } from 'react';
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const FormField = forwardRef(({ 
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  leftIcon,
  rightIcon,
  rows = 4,
  options = [],
  autoComplete,
  autoFocus = false,
  showPasswordToggle = true,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const baseInputClasses = 'input-touch w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 disabled:bg-gray-100/50 disabled:cursor-not-allowed disabled:opacity-60 text-base font-medium placeholder:text-gray-400 placeholder:font-normal';
  
  const stateClasses = error 
    ? 'border-danger-300 bg-danger-50/30 focus:border-danger-500 focus:ring-danger-500/10 hover:border-danger-400' 
    : value && !isFocused
    ? 'border-primary-300 bg-primary-50/20 focus:border-primary-500 focus:ring-primary-500/10 hover:border-primary-400'
    : 'border-gray-200 bg-white/60 backdrop-blur-sm focus:border-primary-500 focus:ring-primary-500/10 focus:bg-white hover:border-gray-300';

  const iconPaddingClasses = {
    left: leftIcon ? 'pr-12' : '',
    right: rightIcon || error ? 'pl-12' : '',
  };

  const renderInput = () => {
    const autoCompleteValue = autoComplete || (
      type === 'password' 
        ? 'new-password'
        : type === 'email' 
        ? 'email'
        : 'off'
    );
    
    const commonProps = {
      id: name,
      name,
      value,
      onChange,
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      onFocus: () => setIsFocused(true),
      disabled,
      required,
      ref,
      autoComplete: autoCompleteValue,
      autoFocus,
      className: `${baseInputClasses} ${stateClasses} ${iconPaddingClasses.left} ${iconPaddingClasses.right} ${inputClassName}`,
      'aria-label': label || name,
      'aria-invalid': !!error,
      'aria-describedby': error ? `${name}-error` : helperText ? `${name}-helper` : undefined,
      ...props
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            placeholder={placeholder}
          />
        );
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="" disabled>
              {placeholder || 'اختر...'}
            </option>
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            {...commonProps}
            type={inputType}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-bold text-gray-700 transition-colors duration-200">
          {label}
          {required && <span className="text-danger-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
            isFocused ? 'text-primary-500' : error ? 'text-danger-500' : 'text-gray-400'
          }`}>
            {leftIcon}
          </div>
        )}
        
        {renderInput()}
        
        {type === 'password' && showPasswordToggle && value && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1 hover:bg-primary-50"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
        
        {rightIcon && !error && type !== 'password' && (
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
            isFocused ? 'text-primary-500' : 'text-gray-400'
          }`}>
            {rightIcon}
          </div>
        )}
        
        {error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-danger-500 pointer-events-none animate-wiggle">
            <ExclamationCircleIcon className="w-5 h-5" />
          </div>
        )}
        
        {!error && value && type !== 'password' && type !== 'textarea' && type !== 'select' && !rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-success-500 pointer-events-none animate-scale-in">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-danger-600 font-medium flex items-center gap-1.5 animate-slide-in-up" role="alert">
          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
      
      {helperText && !error && (
        <p id={`${name}-helper`} className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
