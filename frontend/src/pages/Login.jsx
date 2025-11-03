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

    const newErrors = {};
    
    newErrors.email = validateEmail(formData.email, 'ar');
    newErrors.password = validateRequired(formData.password, 'ar');

    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const summary = getErrorSummary(newErrors, 'ar');
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
      navigate(redirectTo);
    } catch (err) {
      const errorMessage = mapBackendError(err, 'ar');
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        const attempts = incrementLoginAttempts();
        
        if (attempts >= 5) {
          setLoginCooldown(30);
          setCooldownSeconds(30);
          setError('تم تجاوز عدد المحاولات المسموحة. يرجى الانتظار 30 ثانية');
          
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

      <div className="text-center pt-2">
        <Link 
          to="/register" 
          className="text-primary-600 hover:text-primary-700 font-medium transition-all duration-200 inline-flex items-center gap-2 hover:gap-3 group"
        >
          <span className="text-gray-600">{translations.login.noAccount}</span>
          <span className="font-bold group-hover:underline decoration-2 underline-offset-4">{translations.login.signUp}</span>
        </Link>
      </div>
    </FormWrapper>
  );
}

export default Login;
