import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import FormField from '../components/ui/FormField';
import CTAButton from '../components/ui/CTAButton';
import PasswordStrengthIndicator from '../components/ui/PasswordStrengthIndicator';
import FormWrapper from '../components/ui/FormWrapper';
import Alert from '../components/ui/Alert';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon,
  UserPlusIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  mapBackendError,
  getErrorSummary
} from '../utils/validation';

function MerchantRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
      const response = await api.post('/auth/register-merchant', formData);
      setSuccessMessage(response.data.message);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login', { state: { message: 'تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول والاستمتاع بفترة تجريبية مجانية لمدة 20 يومًا.' } });
      }, 3000);
    } catch (err) {
      const errorMessage = mapBackendError(err, 'ar');
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FormWrapper
        title="تم تقديم الطلب بنجاح"
        subtitle="شكراً لتسجيلك"
        icon={CheckCircleIcon}
        className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600"
      >
        <div className="text-center space-y-6 py-8">
          <CheckCircleIcon className="w-24 h-24 mx-auto text-white" />
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">
              {successMessage}
            </h3>
            <p className="text-white/90 text-lg">
              سيتم إعادة توجيهك إلى صفحة تسجيل الدخول...
            </p>
          </div>
        </div>
      </FormWrapper>
    );
  }

  return (
    <FormWrapper
      title="تسجيل تاجر جديد"
      subtitle="قدم طلب للحصول على حساب تاجر"
      icon={UserPlusIcon}
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600"
      errorSummary={error}
      onDismissError={() => setError('')}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="الاسم الأول"
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
            label="الاسم الأخير"
            name="last_name"
            type="text"
            required
            placeholder="الاسم الأخير"
            value={formData.last_name}
            onChange={handleChange}
            onBlur={handleBlur}
            rightIcon={<UserIcon className="w-5 h-5" />}
            error={errors.last_name}
          />
        </div>

        <FormField
          label="البريد الإلكتروني"
          name="email"
          type="email"
          required
          placeholder="example@domain.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<EnvelopeIcon className="w-5 h-5" />}
          error={errors.email}
        />

        <div className="space-y-2">
          <FormField
            label="كلمة المرور"
            name="password"
            type="password"
            required
            placeholder="أدخل كلمة مرور قوية"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            rightIcon={<LockClosedIcon className="w-5 h-5" />}
            error={errors.password}
          />
          {formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        <FormField
          label="رقم الهاتف (اختياري)"
          name="phone"
          type="tel"
          placeholder="+967XXXXXXXXX"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<PhoneIcon className="w-5 h-5" />}
        />

        <FormField
          label="واتساب (اختياري)"
          name="whatsapp"
          type="tel"
          placeholder="+967XXXXXXXXX"
          value={formData.whatsapp}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<PhoneIcon className="w-5 h-5" />}
        />

        <FormField
          label="تليجرام (اختياري)"
          name="telegram"
          type="text"
          placeholder="@username"
          value={formData.telegram}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        <FormField
          label="العنوان (اختياري)"
          name="address"
          type="text"
          placeholder="المدينة، الحي، الشارع"
          value={formData.address}
          onChange={handleChange}
          onBlur={handleBlur}
          rightIcon={<MapPinIcon className="w-5 h-5" />}
        />

        <div className="pt-2">
          <CTAButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'جارٍ التسجيل...' : 'تقديم الطلب'}
          </CTAButton>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-white/80">أو</span>
          </div>
        </div>

        <div className="text-center text-white/90">
          لديك حساب بالفعل؟{' '}
          <Link 
            to="/login" 
            className="font-bold text-white hover:text-white/80 transition-colors underline decoration-2 underline-offset-4"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </FormWrapper>
  );
}

export default MerchantRegister;
