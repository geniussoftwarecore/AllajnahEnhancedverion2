import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import {
  XMarkIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

function EmailUpdateModal({ isOpen, onClose, currentEmail, onEmailUpdated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    new_email: '',
    current_password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.new_email || !formData.current_password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (formData.new_email === currentEmail) {
      toast.error('البريد الإلكتروني الجديد يجب أن يكون مختلفاً');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('users/update-email', formData);
      
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      updatedUser.email = response.data.new_email;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      onEmailUpdated(response.data.new_email);
      toast.success('تم تحديث البريد الإلكتروني بنجاح');
      
      setFormData({ new_email: '', current_password: '' });
      onClose();
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error(error.response?.data?.detail || 'فشل تحديث البريد الإلكتروني');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            >
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="إغلاق"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    تحديث البريد الإلكتروني
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    عملية آمنة تتطلب تأكيد كلمة المرور
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>ملاحظة:</strong> سيتم استخدام البريد الإلكتروني الجديد لتسجيل الدخول والإشعارات.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <EnvelopeIcon className="w-5 h-5" />
                      البريد الإلكتروني الحالي
                    </span>
                  </label>
                  <input
                    type="email"
                    value={currentEmail}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <EnvelopeIcon className="w-5 h-5" />
                      البريد الإلكتروني الجديد
                    </span>
                  </label>
                  <input
                    type="email"
                    name="new_email"
                    value={formData.new_email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    required
                    placeholder="أدخل البريد الإلكتروني الجديد"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <KeyIcon className="w-5 h-5" />
                      كلمة المرور الحالية
                    </span>
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    required
                    placeholder="أدخل كلمة المرور للتأكيد"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    إلغاء
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        جاري التحديث...
                      </span>
                    ) : (
                      'تحديث البريد'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default EmailUpdateModal;
