import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import FormField from '../components/ui/FormField';
import CTAButton from '../components/ui/CTAButton';
import Alert from '../components/ui/Alert';
import NavigationButtons from '../components/ui/NavigationButtons';
import PasswordStrengthIndicator from '../components/ui/PasswordStrengthIndicator';
import { EnvelopeIcon, LockClosedIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/outline';

function Setup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('يجب أن تحتوي على رقم واحد على الأقل');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*...)');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError('كلمة المرور لا تستوفي المتطلبات:\n' + passwordErrors.join('\n'));
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
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل في إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="fixed top-4 left-4 z-50">
        <NavigationButtons />
      </div>
      
      <div className="max-w-md w-full space-y-6 bg-white/80 backdrop-blur-lg p-6 sm:p-10 rounded-3xl shadow-glass animate-scale-in relative z-10 border border-white/40">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-400 rounded-3xl flex items-center justify-center mb-4 shadow-glow-green animate-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            <SparklesIcon className="w-10 h-10 text-white relative z-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 mb-2">
            إعداد النظام الأولي
          </h2>
          <p className="text-sm sm:text-base text-gray-600 flex items-center justify-center gap-2">
            <UserIcon className="w-5 h-5" />
            إنشاء حساب المسؤول الأول
          </p>
        </div>

        <Alert
          type="info"
          message="مرحباً بك في نظام الاجنة المحسنة. يرجى إنشاء حساب المسؤول الأول للبدء في استخدام النظام."
        />

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="الاسم الأول"
              name="first_name"
              type="text"
              required
              placeholder="أدخل الاسم الأول"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              rightIcon={<UserIcon className="w-5 h-5" />}
            />

            <FormField
              label="الاسم الأخير"
              name="last_name"
              type="text"
              required
              placeholder="أدخل الاسم الأخير"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              rightIcon={<UserIcon className="w-5 h-5" />}
            />
          </div>

          <FormField
            label="البريد الإلكتروني"
            name="email"
            type="email"
            required
            placeholder="أدخل بريدك الإلكتروني"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            rightIcon={<EnvelopeIcon className="w-5 h-5" />}
          />

          <div className="space-y-4">
            <FormField
              label="كلمة المرور"
              name="password"
              type="password"
              required
              placeholder="أدخل كلمة المرور"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              rightIcon={<LockClosedIcon className="w-5 h-5" />}
            />
            
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          <FormField
            label="تأكيد كلمة المرور"
            name="confirmPassword"
            type="password"
            required
            placeholder="أدخل كلمة المرور مرة أخرى"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            rightIcon={<LockClosedIcon className="w-5 h-5" />}
            error={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'كلمات المرور غير متطابقة' : ''}
          />

          <CTAButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء حساب المسؤول'}
          </CTAButton>
        </form>
      </div>
    </div>
  );
}

export default Setup;
