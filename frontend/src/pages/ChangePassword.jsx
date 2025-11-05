import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ResponsivePageShell from '../components/ui/ResponsivePageShell';
import { toast } from 'react-toastify';
import api from '../api/axios';
import {
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

function ChangePassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    if (!hasUpperCase || !hasLowerCase) {
      return 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة';
    }
    if (!hasNumbers) {
      return 'كلمة المرور يجب أن تحتوي على أرقام';
    }
    if (!hasSpecialChar) {
      return 'كلمة المرور يجب أن تحتوي على رموز خاصة';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      toast.error('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    const passwordError = validatePassword(formData.new_password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setLoading(true);

    try {
      await api.post('users/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      });

      toast.success('تم تغيير كلمة المرور بنجاح');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.detail || 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ name, label, value, showPassword, toggleField }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <span className="flex items-center gap-2">
          <KeyIcon className="w-5 h-5" />
          {label}
        </span>
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
          required
          dir="ltr"
        />
        <button
          type="button"
          onClick={() => togglePasswordVisibility(toggleField)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {showPassword ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <ResponsivePageShell title="تغيير كلمة المرور">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-strong p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <ShieldCheckIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                تغيير كلمة المرور
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                قم بتحديث كلمة المرور الخاصة بك للحفاظ على أمان حسابك
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              متطلبات كلمة المرور:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>8 أحرف على الأقل</li>
              <li>أحرف كبيرة وصغيرة (A-Z, a-z)</li>
              <li>أرقام (0-9)</li>
              <li>رموز خاصة (!@#$%^&*)</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <PasswordInput
              name="current_password"
              label="كلمة المرور الحالية"
              value={formData.current_password}
              showPassword={showPasswords.current}
              toggleField="current"
            />

            <PasswordInput
              name="new_password"
              label="كلمة المرور الجديدة"
              value={formData.new_password}
              showPassword={showPasswords.new}
              toggleField="new"
            />

            <PasswordInput
              name="confirm_password"
              label="تأكيد كلمة المرور الجديدة"
              value={formData.confirm_password}
              showPassword={showPasswords.confirm}
              toggleField="confirm"
            />

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/profile')}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                إلغاء
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    جاري التغيير...
                  </span>
                ) : (
                  'تغيير كلمة المرور'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </ResponsivePageShell>
  );
}

export default ChangePassword;
