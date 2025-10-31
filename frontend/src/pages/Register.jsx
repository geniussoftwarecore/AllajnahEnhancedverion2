import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/ui/FormField';
import CTAButton from '../components/ui/CTAButton';
import Alert from '../components/ui/Alert';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon,
  UserPlusIcon 
} from '@heroicons/react/24/outline';

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
    
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError('كلمة المرور لا تستوفي المتطلبات:\n' + passwordErrors.join('\n'));
      return;
    }
    
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-2xl w-full space-y-6 bg-white p-6 sm:p-10 rounded-2xl shadow-strong animate-scale-in">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <UserPlusIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            إنشاء حساب جديد
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            نظام إدارة الشكاوى - الاجنة المحسنة
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
            />
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="الاسم الأول"
                name="first_name"
                type="text"
                required
                placeholder="الاسم الأول"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                rightIcon={<UserIcon className="w-5 h-5" />}
              />

              <FormField
                label="اسم العائلة"
                name="last_name"
                type="text"
                required
                placeholder="اسم العائلة"
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

            <FormField
              label="كلمة المرور"
              name="password"
              type="password"
              required
              placeholder="أدخل كلمة المرور"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              rightIcon={<LockClosedIcon className="w-5 h-5" />}
              helperText="يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير وصغير، رقم، ورمز خاص"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="رقم الهاتف"
                name="phone"
                type="tel"
                placeholder="رقم الهاتف"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                rightIcon={<PhoneIcon className="w-5 h-5" />}
              />

              <FormField
                label="رقم الواتساب"
                name="whatsapp"
                type="tel"
                placeholder="رقم الواتساب"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                rightIcon={<PhoneIcon className="w-5 h-5" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="رقم التليجرام"
                name="telegram"
                type="text"
                placeholder="رقم التليجرام"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
              />

              <FormField
                label="العنوان"
                name="address"
                type="text"
                placeholder="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
          >
            {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
          </CTAButton>

          <div className="text-center">
            <Link 
              to="/login" 
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200 inline-flex items-center gap-2"
            >
              <span>لديك حساب؟</span>
              <span className="font-bold">سجل الدخول</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
