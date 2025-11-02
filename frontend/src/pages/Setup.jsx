import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
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
import translations from '../i18n/ar.json';

function Setup() {
  const navigate = useNavigate();
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
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('setup_completed');
    if (completed === 'true') {
      setSetupCompleted(true);
    }
  }, []);

  const validateField = (name, value) => {
    let fieldError = null;

    switch (name) {
      case 'email':
        fieldError = validateEmail(value, 'ar');
        break;
      case 'password':
        const passwordErrors = validatePassword(value, 'ar');
        fieldError = passwordErrors ? passwordErrors[0] : null;
        break;
      case 'confirmPassword':
        fieldError = validatePasswordMatch(formData.password, value, 'ar');
        break;
      case 'first_name':
      case 'last_name':
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
    
    newErrors.first_name = validateRequired(formData.first_name, 'ar');
    newErrors.last_name = validateRequired(formData.last_name, 'ar');
    newErrors.email = validateEmail(formData.email, 'ar');
    
    const passwordErrors = validatePassword(formData.password, 'ar');
    if (passwordErrors) {
      newErrors.password = passwordErrors.join('\n');
    }
    
    newErrors.confirmPassword = validatePasswordMatch(formData.password, formData.confirmPassword, 'ar');

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
      setError('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/setup/initialize', {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'higher_committee'
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('setup_completed', 'true');
      
      setSetupCompleted(true);
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      const errorMessage = mapBackendError(err, 'ar');
      setError(errorMessage);
      
      if (errorMessage.includes('تم إكمال الإعداد')) {
        localStorage.setItem('setup_completed', 'true');
        setSetupCompleted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (setupCompleted) {
    return (
      <FormWrapper
        title="تم الإعداد بالفعل"
        subtitle="النظام جاهز للاستخدام"
        icon={SparklesIcon}
      >
        <Alert
          type="success"
          message={translations.setup.alreadyCompleted}
        />
        <Link to="/login">
          <CTAButton
            variant="primary"
            size="lg"
            fullWidth
          >
            {translations.setup.goToLogin}
          </CTAButton>
        </Link>
      </FormWrapper>
    );
  }

  return (
    <FormWrapper
      title={translations.setup.title}
      subtitle={translations.setup.subtitle}
      icon={SparklesIcon}
      onSubmit={handleSubmit}
    >
      <Alert
        type="info"
        message={translations.setup.welcome}
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
          label={translations.setup.firstName}
          name="first_name"
          type="text"
          required
          placeholder="أدخل الاسم الأول"
          value={formData.first_name}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<UserIcon className="w-5 h-5" />}
          error={errors.first_name}
        />

        <FormField
          label={translations.setup.lastName}
          name="last_name"
          type="text"
          required
          placeholder="أدخل الاسم الأخير"
          value={formData.last_name}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<UserIcon className="w-5 h-5" />}
          error={errors.last_name}
        />
      </div>

      <FormField
        label={translations.setup.email}
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

      <div className="space-y-4">
        <FormField
          label={translations.setup.password}
          name="password"
          type="password"
          required
          placeholder="أدخل كلمة المرور"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<LockClosedIcon className="w-5 h-5" />}
          error={errors.password}
        />
        
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <FormField
        label={translations.setup.confirmPassword}
        name="confirmPassword"
        type="password"
        required
        placeholder="أدخل كلمة المرور مرة أخرى"
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
        {loading ? translations.setup.submitting : translations.setup.submit}
      </CTAButton>
    </FormWrapper>
  );
}

export default Setup;
