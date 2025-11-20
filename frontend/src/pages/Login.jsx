import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/ui/FormField';
import CTAButton from '../components/ui/CTAButton';
import FormWrapper from '../components/ui/FormWrapper';
import { EnvelopeIcon, LockClosedIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import {
  validateEmail,
  validateRequired,
  mapBackendError,
  getErrorSummary,
  getLoginAttempts,
  incrementLoginAttempts,
  resetLoginAttempts,
  getLoginCooldown,
  setLoginCooldown
} from '../utils/validation';
import translations from '../i18n/ar.json';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    const cooldown = getLoginCooldown();
    if (cooldown) {
      setCooldownSeconds(cooldown);
      const interval = setInterval(() => {
        const remaining = getLoginCooldown();
        if (!remaining) {
          setCooldownSeconds(0);
          clearInterval(interval);
        } else {
          setCooldownSeconds(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const validateField = (name, value) => {
    let fieldError = null;

    switch (name) {
      case 'email':
        fieldError = validateEmail(value, 'ar');
        break;
      case 'password':
        fieldError = validateRequired(value, 'ar');
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));

    return !fieldError;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const validateForm = () => {
    const newErrors = {};
    
    newErrors.email = validateEmail(formData.email, 'ar');
    newErrors.password = validateRequired(formData.password, 'ar');

    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Use existing validateForm function to avoid duplicate code
    if (!validateForm()) {
      const summary = getErrorSummary(errors, 'ar');
      setError(summary || 'يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    const cooldown = getLoginCooldown();
    if (cooldown) {
      setError(`تم تجاوز عدد المحاولات المسموحة. يرجى الانتظار ${cooldown} ثانية قبل المحاولة مرة أخرى`);
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      resetLoginAttempts();
      
      const redirectTo = searchParams.get('redirect_to') || '/';
      navigate(redirectTo, { replace: true });  // Use replace to prevent back button issues
    } catch (err) {
      const errorMessage = mapBackendError(err, 'ar');
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        const attempts = incrementLoginAttempts();
        
        if (attempts >= 5) {
          setLoginCooldown(60);
          setCooldownSeconds(60);
          setError('تم تجاوز عدد المحاولات المسموحة. يرجى الانتظار 60 ثانية');
          
          const interval = setInterval(() => {
            const remaining = getLoginCooldown();
            if (!remaining) {
              setCooldownSeconds(0);
              clearInterval(interval);
            } else {
              setCooldownSeconds(remaining);
            }
          }, 1000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper
      title={translations.app.title}
      subtitle={translations.app.subtitle}
      icon={ArrowRightOnRectangleIcon}
      onSubmit={handleSubmit}
      errorSummary={error}
      onDismissError={() => setError('')}
    >
      <FormField
        label={translations.login.email}
        name="email"
        type="email"
        required
        autoFocus
        placeholder="أدخل بريدك الإلكتروني"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        rightIcon={<EnvelopeIcon className="w-5 h-5" />}
        error={errors.email}
      />

      <FormField
        label={translations.login.password}
        name="password"
        type="password"
        required
        placeholder="أدخل كلمة المرور"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        rightIcon={<LockClosedIcon className="w-5 h-5" />}
        error={errors.password}
        autoComplete="current-password"
      />

      <CTAButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading || cooldownSeconds > 0}
      >
        {loading ? translations.login.submitting : 
         cooldownSeconds > 0 ? `انتظر ${cooldownSeconds}ث` : 
         translations.login.submit}
      </CTAButton>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">أو</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-green-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700 text-center mb-3">
          💡 ليس لديك حساب؟ قم بالتسجيل كتاجر جديد
        </p>
        <Link to="/register-merchant">
          <CTAButton
            variant="secondary"
            size="md"
            fullWidth
          >
            إنشاء حساب تاجر جديد
          </CTAButton>
        </Link>
      </div>
    </FormWrapper>
  );
}

export default Login;
