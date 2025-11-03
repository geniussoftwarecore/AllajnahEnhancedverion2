import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/ui/FormField';
import CTAButton from '../components/ui/CTAButton';
import PasswordStrengthIndicator from '../components/ui/PasswordStrengthIndicator';
import FormWrapper from '../components/ui/FormWrapper';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon,
  UserPlusIcon 
} from '@heroicons/react/24/outline';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  mapBackendError,
  getErrorSummary
} from '../utils/validation';
import translations from '../i18n/ar.json';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'trader',
    phone: '',
    whatsapp: '',
    telegram: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    
    newErrors.first_name = validateRequired(formData.first_name, 'ar');
    newErrors.last_name = validateRequired(formData.last_name, 'ar');
    newErrors.email = validateEmail(formData.email, 'ar');
    
    const passwordErrors = validatePassword(formData.password, 'ar');
    if (passwordErrors) {
      newErrors.password = passwordErrors.join('\n');
    }

    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const summary = getErrorSummary(newErrors, 'ar');
      setError(summary || 'يرجى تصحيح الأخطاء في النموذج');
      return;
    }
    
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      const errorMessage = mapBackendError(err, 'ar');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper
      title={translations.register.title}
      subtitle={translations.register.subtitle}
      icon={UserPlusIcon}
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600"
      errorSummary={error}
      onDismissError={() => setError('')}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={translations.register.firstName}
            name="first_name"
            type="text"
            required
            autoFocus
            placeholder="الاسم الأول"
            value={formData.first_name}
            onChange={handleChange}
            onBlur={handleBlur}
            rightIcon={<UserIcon className="w-5 h-5" />}
            error={errors.first_name}
          />

          <FormField
            label={translations.register.lastName}
            name="last_name"
            type="text"
            required
            placeholder="اسم العائلة"
            value={formData.last_name}
            onChange={handleChange}
            onBlur={handleBlur}
            rightIcon={<UserIcon className="w-5 h-5" />}
            error={errors.last_name}
          />
        </div>

        <FormField
          label={translations.register.email}
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
            label={translations.register.password}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={translations.register.phone}
            name="phone"
            type="tel"
            placeholder="مثال: 0501234567"
            value={formData.phone}
            onChange={handleChange}
            rightIcon={<PhoneIcon className="w-5 h-5" />}
            helperText="أدخل رقم الهاتف مع رمز الدولة"
          />

          <FormField
            label={translations.register.whatsapp}
            name="whatsapp"
            type="tel"
            placeholder="مثال: 0501234567"
            value={formData.whatsapp}
            onChange={handleChange}
            rightIcon={<PhoneIcon className="w-5 h-5" />}
            helperText="رقم الواتساب للتواصل السريع"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={translations.register.telegram}
            name="telegram"
            type="text"
            placeholder="رقم التليجرام"
            value={formData.telegram}
            onChange={handleChange}
          />

          <FormField
            label={translations.register.address}
            name="address"
            type="text"
            placeholder="العنوان"
            value={formData.address}
            onChange={handleChange}
            rightIcon={<MapPinIcon className="w-5 h-5" />}
          />
        </div>
      </div>

      <CTAButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        {loading ? translations.register.submitting : translations.register.submit}
      </CTAButton>

      <div className="text-center">
        <Link 
          to="/login" 
          className="text-primary-600 hover:text-primary-700 font-medium transition-all duration-200 inline-flex items-center gap-2 hover:gap-3 group"
        >
          <span className="text-gray-600">{translations.register.hasAccount}</span>
          <span className="font-bold group-hover:underline decoration-2 underline-offset-4">{translations.register.signIn}</span>
        </Link>
      </div>
    </FormWrapper>
  );
}

export default Register;
