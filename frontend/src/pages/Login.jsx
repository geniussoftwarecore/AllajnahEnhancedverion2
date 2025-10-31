import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/ui/FormField';
import CTAButton from '../components/ui/CTAButton';
import Alert from '../components/ui/Alert';
import NavigationButtons from '../components/ui/NavigationButtons';
import { EnvelopeIcon, LockClosedIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="fixed top-4 left-4 z-50">
        <NavigationButtons />
      </div>
      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-10 rounded-2xl shadow-strong animate-scale-in">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ArrowRightOnRectangleIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            الاجنة المحسنة
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            نظام إدارة الشكاوى
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
          />

          <CTAButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </CTAButton>

          <div className="text-center">
            <Link 
              to="/register" 
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200 inline-flex items-center gap-2"
            >
              <span>ليس لديك حساب؟</span>
              <span className="font-bold">سجل الآن</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
