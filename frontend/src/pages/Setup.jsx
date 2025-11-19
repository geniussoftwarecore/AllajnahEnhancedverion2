import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import FormField from '../components/ui/FormField';
import CTAButton from '../components/ui/CTAButton';
import Alert from '../components/ui/Alert';
import PasswordStrengthIndicator from '../components/ui/PasswordStrengthIndicator';
import FormWrapper from '../components/ui/FormWrapper';
import { EnvelopeIcon, LockClosedIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/outline';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  mapBackendError
} from '../utils/validation';

function Setup() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await api.get('setup/status');
        const needsSetup = response.data.needs_setup;
        const isCompleted = !needsSetup;
        
        setSetupCompleted(isCompleted);
        localStorage.setItem('setup_completed', isCompleted.toString());
      } catch (err) {
        console.error('Failed to check setup status:', err);
        const storedStatus = localStorage.getItem('setup_completed');
        if (storedStatus === 'true') {
          setSetupCompleted(true);
        }
      } finally {
        setCheckingStatus(false);
      }
    };

    checkSetupStatus();
  }, []);

  useEffect(() => {
    if (justCompleted) {
      const timer = setTimeout(() => {
        localStorage.setItem('setup_completed', 'true');
        window.location.href = '/login';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [justCompleted]);

  const validateField = (name, value) => {
    let fieldError = null;

    switch (name) {
      case 'email':
        fieldError = validateEmail(value, currentLang);
        break;
      case 'password':
        const passwordErrors = validatePassword(value, currentLang);
        fieldError = passwordErrors ? passwordErrors[0] : null;
        break;
      case 'confirmPassword':
        fieldError = validatePasswordMatch(formData.password, value, currentLang);
        break;
      case 'first_name':
      case 'last_name':
        fieldError = validateRequired(value, currentLang);
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
    
    newErrors.first_name = validateRequired(formData.first_name, currentLang);
    newErrors.last_name = validateRequired(formData.last_name, currentLang);
    newErrors.email = validateEmail(formData.email, currentLang);
    
    const passwordErrors = validatePassword(formData.password, currentLang);
    if (passwordErrors) {
      newErrors.password = passwordErrors.join('\n');
    }
    
    newErrors.confirmPassword = validatePasswordMatch(formData.password, formData.confirmPassword, currentLang);

    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      setError(t('errors.generic'));
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('setup/initialize', {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'HIGHER_COMMITTEE'
      });

      localStorage.setItem('setup_completed', 'true');
      setJustCompleted(true);
    } catch (err) {
      const errorMessage = mapBackendError(err, currentLang);
      setError(errorMessage);
      
      if (err?.response?.data?.detail?.includes('already been completed') || 
          errorMessage.includes(t('setup.already_configured'))) {
        localStorage.setItem('setup_completed', 'true');
        setSetupCompleted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  if (justCompleted) {
    return (
      <FormWrapper
        title={t('setup.success')}
        subtitle={t('common.loading')}
        icon={SparklesIcon}
      >
        <Alert
          type="success"
          message={t('setup.success')}
        />
        <div className="text-center text-gray-600">
          {t('common.loading')}
        </div>
      </FormWrapper>
    );
  }

  if (setupCompleted) {
    return (
      <FormWrapper
        title={t('setup.already_configured')}
        subtitle={t('common.loading')}
        icon={SparklesIcon}
      >
        <Alert
          type="success"
          message={t('setup.alreadyCompleted')}
        />
        <Link to="/login">
          <CTAButton
            variant="primary"
            size="lg"
            fullWidth
          >
            {t('setup.goToLogin')}
          </CTAButton>
        </Link>
      </FormWrapper>
    );
  }

  return (
    <FormWrapper
      title={t('setup.title')}
      subtitle={t('setup.subtitle')}
      icon={SparklesIcon}
      onSubmit={handleSubmit}
    >
      <Alert
        type="info"
        message={t('setup.welcome')}
      />

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label={t('setup.firstName')}
          name="first_name"
          type="text"
          required
          placeholder={currentLang === 'ar' ? 'أدخل الاسم الأول' : 'Enter first name'}
          value={formData.first_name}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<UserIcon className="w-5 h-5" />}
          error={errors.first_name}
        />

        <FormField
          label={t('setup.lastName')}
          name="last_name"
          type="text"
          required
          placeholder={currentLang === 'ar' ? 'أدخل الاسم الأخير' : 'Enter last name'}
          value={formData.last_name}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<UserIcon className="w-5 h-5" />}
          error={errors.last_name}
        />
      </div>

      <FormField
        label={t('setup.email')}
        name="email"
        type="email"
        required
        placeholder={currentLang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        rightIcon={<EnvelopeIcon className="w-5 h-5" />}
        error={errors.email}
      />

      <div className="space-y-4">
        <FormField
          label={t('setup.password')}
          name="password"
          type="password"
          required
          placeholder={currentLang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<LockClosedIcon className="w-5 h-5" />}
          error={errors.password}
        />
        
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <FormField
        label={t('setup.confirmPassword')}
        name="confirmPassword"
        type="password"
        required
        placeholder={currentLang === 'ar' ? 'أدخل كلمة المرور مرة أخرى' : 'Enter password again'}
        value={formData.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        rightIcon={<LockClosedIcon className="w-5 h-5" />}
        error={errors.confirmPassword}
      />

      <CTAButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        {loading ? t('setup.submitting') : t('setup.submit')}
      </CTAButton>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {currentLang === 'ar' ? 'هل تم إعداد النظام بالفعل؟' : 'Already set up?'}
          {' '}
          <Link 
            to="/login" 
            className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            {currentLang === 'ar' ? 'انتقل إلى تسجيل الدخول' : 'Go to Login'}
          </Link>
        </p>
      </div>
    </FormWrapper>
  );
}

export default Setup;
