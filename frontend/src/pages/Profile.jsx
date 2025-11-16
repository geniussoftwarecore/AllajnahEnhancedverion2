import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ResponsivePageShell from '../components/ui/ResponsivePageShell';
import ProfileCompletionIndicator from '../components/ui/ProfileCompletionIndicator';
import AccountStats from '../components/ui/AccountStats';
import AccountInfo from '../components/ui/AccountInfo';
import EmailUpdateModal from '../components/ui/EmailUpdateModal';
import { toast } from 'react-toastify';
import api from '../api/axios';
import {
  UserCircleIcon,
  CameraIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

function Profile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    telegram: user?.telegram || '',
    address: user?.address || ''
  });

  const getRoleText = (role) => {
    switch (role) {
      case 'TRADER':
        return 'تاجر';
      case 'TECHNICAL_COMMITTEE':
        return 'لجنة فنية';
      case 'HIGHER_COMMITTEE':
        return 'لجنة عليا';
      default:
        return role;
    }
  };

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || '';
    const last = user?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار صورة صالحة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploading(true);
    const formDataImage = new FormData();
    formDataImage.append('file', file);

    try {
      const response = await api.post('users/profile-picture', formDataImage, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = { ...user, profile_picture: response.data.profile_picture };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('تم تحديث الصورة الشخصية بنجاح');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.response?.data?.detail || 'فشل تحميل الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('users/profile', formData);
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'فشل تحديث الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsivePageShell title="الملف الشخصي">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 space-y-6">
            <ProfileCompletionIndicator user={user} />
            {user?.role === 'TRADER' && <AccountStats user={user} />}
            <AccountInfo user={user} />
          </div>
          
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-strong p-6 md:p-8"
            >
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-500 shadow-lg"
                />
              ) : (
                <div className="flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 text-white font-bold text-4xl shadow-lg border-4 border-white dark:border-gray-700">
                  {getInitials()}
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                aria-label="تغيير الصورة الشخصية"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <CameraIcon className="w-5 h-5" />
                )}
              </motion.button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-primary-600 dark:text-primary-400 font-semibold">
              {getRoleText(user?.role)}
            </p>
            {user?.email && (
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4" />
                  {user.email}
                </p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEmailModalOpen(true)}
                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  aria-label="تحديث البريد الإلكتروني"
                  title="تحديث البريد الإلكتروني"
                >
                  <PencilIcon className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </div>
          
          <EmailUpdateModal
            isOpen={emailModalOpen}
            onClose={() => setEmailModalOpen(false)}
            currentEmail={user?.email || ''}
            onEmailUpdated={(newEmail) => {
              const updatedUser = { ...user, email: newEmail };
              setUser(updatedUser);
            }}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <IdentificationIcon className="w-5 h-5" />
                    الاسم الأول
                  </span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <IdentificationIcon className="w-5 h-5" />
                    الاسم الأخير
                  </span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5" />
                    رقم الهاتف
                  </span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5" />
                    واتساب
                  </span>
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5" />
                    تليجرام
                  </span>
                </label>
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5" />
                    العنوان
                  </span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
                    جاري الحفظ...
                  </span>
                ) : (
                  'حفظ التغييرات'
                )}
              </motion.button>
            </div>
          </form>
            </motion.div>
          </div>
        </div>
      </div>
    </ResponsivePageShell>
  );
}

export default Profile;
