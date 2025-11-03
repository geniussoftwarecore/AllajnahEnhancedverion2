import React, { forwardRef, useState } from 'react';
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

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
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const baseInputClasses = 'input-touch w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-gray-100 disabled:cursor-not-allowed text-base hover:border-gray-400';
  
  const stateClasses = error 
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/30 hover:border-danger-400 bg-danger-50/30' 
    : value 
    ? 'border-primary-300 focus:border-primary-500 focus:ring-primary-500/30 bg-primary-50/20'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30';

  const iconPaddingClasses = {
    left: leftIcon ? 'pr-12' : '',
    right: rightIcon ? 'pl-12' : '',
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
      onBlur,
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
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-danger-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        {renderInput()}
        
        {type === 'password' && showPasswordToggle && value && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded focus:text-primary-600"
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
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {rightIcon}
          </div>
        )}
        
        {error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-danger-500 pointer-events-none">
            <ExclamationCircleIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-danger-600 flex items-center gap-1 animate-slide-in-up" role="alert">
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
