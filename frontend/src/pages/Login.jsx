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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="fixed top-4 left-4 z-50">
        <NavigationButtons />
      </div>
      
      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-10 rounded-3xl shadow-strong animate-scale-in relative z-10 backdrop-blur-sm border border-white/20">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 rounded-3xl flex items-center justify-center mb-4 shadow-lg animate-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            <ArrowRightOnRectangleIcon className="w-10 h-10 text-white relative z-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 mb-2">
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

          <div className="text-center pt-2">
            <Link 
              to="/register" 
              className="text-primary-600 hover:text-primary-700 font-medium transition-all duration-200 inline-flex items-center gap-2 hover:gap-3 group"
            >
              <span className="text-gray-600">ليس لديك حساب؟</span>
              <span className="font-bold group-hover:underline decoration-2 underline-offset-4">سجل الآن</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
