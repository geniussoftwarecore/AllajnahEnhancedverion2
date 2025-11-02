export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    messages: {
      ar: 'البريد الإلكتروني غير صالح',
      en: 'Invalid email address'
    }
  },
  password: {
    minLength: 8,
    messages: {
      ar: {
        minLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
        uppercase: 'يجب أن تحتوي على حرف كبير واحد على الأقل',
        lowercase: 'يجب أن تحتوي على حرف صغير واحد على الأقل',
        digit: 'يجب أن تحتوي على رقم واحد على الأقل',
        special: 'يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*...)',
        match: 'كلمات المرور غير متطابقة'
      },
      en: {
        minLength: 'Password must be at least 8 characters long',
        uppercase: 'Password must contain at least one uppercase letter',
        lowercase: 'Password must contain at least one lowercase letter',
        digit: 'Password must contain at least one digit',
        special: 'Password must contain at least one special character (!@#$%^&*...)',
        match: 'Passwords do not match'
      }
    }
  },
  required: {
    messages: {
      ar: 'هذا الحقل مطلوب',
      en: 'This field is required'
    }
  }
};

export const validateEmail = (email, lang = 'ar') => {
  if (!email) {
    return validationRules.required.messages[lang];
  }
  if (!validationRules.email.pattern.test(email)) {
    return validationRules.email.messages[lang];
  }
  return null;
};

export const validatePassword = (password, lang = 'ar') => {
  const errors = [];
  const messages = validationRules.password.messages[lang];
  
  if (!password) {
    return [validationRules.required.messages[lang]];
  }
  
  if (password.length < validationRules.password.minLength) {
    errors.push(messages.minLength);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push(messages.uppercase);
  }
  if (!/[a-z]/.test(password)) {
    errors.push(messages.lowercase);
  }
  if (!/[0-9]/.test(password)) {
    errors.push(messages.digit);
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push(messages.special);
  }
  
  return errors.length > 0 ? errors : null;
};

export const validatePasswordMatch = (password, confirmPassword, lang = 'ar') => {
  if (!confirmPassword) {
    return validationRules.required.messages[lang];
  }
  if (password !== confirmPassword) {
    return validationRules.password.messages[lang].match;
  }
  return null;
};

export const calculatePasswordStrength = (password) => {
  if (!password) return 0;
  
  let strength = 0;
  
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;
  
  return Math.min(strength, 100);
};

export const getPasswordStrengthLabel = (strength, lang = 'ar') => {
  const labels = {
    ar: {
      0: 'ضعيفة جداً',
      25: 'ضعيفة',
      50: 'متوسطة',
      75: 'قوية',
      90: 'قوية جداً'
    },
    en: {
      0: 'Very Weak',
      25: 'Weak',
      50: 'Medium',
      75: 'Strong',
      90: 'Very Strong'
    }
  };
  
  if (strength === 0) return labels[lang][0];
  if (strength < 40) return labels[lang][25];
  if (strength < 60) return labels[lang][50];
  if (strength < 80) return labels[lang][75];
  return labels[lang][90];
};

export const getPasswordStrengthColor = (strength) => {
  if (strength === 0) return '#ef4444';
  if (strength < 40) return '#f97316';
  if (strength < 60) return '#eab308';
  if (strength < 80) return '#84cc16';
  return '#22c55e';
};

export const validateRequired = (value, lang = 'ar') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return validationRules.required.messages[lang];
  }
  return null;
};

export const mapBackendError = (error, lang = 'ar') => {
  const errorMessages = {
    ar: {
      'Email already registered': 'البريد الإلكتروني مسجل بالفعل',
      'Invalid credentials': 'بيانات الدخول غير صحيحة',
      'User not found': 'المستخدم غير موجود',
      'Setup has already been completed': 'تم إكمال الإعداد بالفعل',
      'Network Error': 'خطأ في الاتصال بالشبكة',
      'Request failed with status code 401': 'بيانات الدخول غير صحيحة',
      'Request failed with status code 422': 'البيانات المدخلة غير صحيحة',
      'Request failed with status code 500': 'خطأ في الخادم، يرجى المحاولة لاحقاً'
    },
    en: {
      'Email already registered': 'Email already registered',
      'Invalid credentials': 'Invalid credentials',
      'User not found': 'User not found',
      'Setup has already been completed': 'Setup has already been completed',
      'Network Error': 'Network connection error',
      'Request failed with status code 401': 'Invalid credentials',
      'Request failed with status code 422': 'Invalid data provided',
      'Request failed with status code 500': 'Server error, please try again later'
    }
  };
  
  const message = error?.response?.data?.detail || error?.message || 'Unknown error';
  return errorMessages[lang][message] || message;
};

export const mapServerValidationErrors = (error, lang = 'ar') => {
  const fallbackMessage = {
    ar: 'حدث خطأ في التحقق من البيانات',
    en: 'Validation error occurred'
  };

  if (!error?.response) {
    return { _form: mapBackendError(error, lang) };
  }

  const { data, status } = error.response;
  
  if (status === 422 && data?.detail) {
    const errors = {};
    
    if (Array.isArray(data.detail)) {
      data.detail.forEach(err => {
        const field = err.loc?.[1] || '_form';
        const message = err.msg || fallbackMessage[lang];
        
        if (!errors[field]) {
          errors[field] = message;
        }
      });
    } else if (typeof data.detail === 'object') {
      Object.keys(data.detail).forEach(field => {
        errors[field] = data.detail[field];
      });
    } else {
      errors._form = data.detail;
    }
    
    return errors;
  }
  
  return { _form: mapBackendError(error, lang) };
};
