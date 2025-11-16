import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResponsivePageShell from '../components/ui/ResponsivePageShell';
import { toast } from 'react-toastify';
import api from '../api/axios';
import {
  BellIcon,
  MoonIcon,
  SunIcon,
  LanguageIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  PencilIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

function UserSettings() {
  const { user, setUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newComplaints: true,
    statusUpdates: true,
    comments: true,
    assignments: true
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    telegram: user?.telegram || '',
    address: user?.address || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const handleNotificationChange = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
    toast.success('تم حفظ الإعدادات');
  };

  const handleEditProfile = () => {
    setProfileData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      whatsapp: user?.whatsapp || '',
      telegram: user?.telegram || '',
      address: user?.address || ''
    });
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      whatsapp: user?.whatsapp || '',
      telegram: user?.telegram || '',
      address: user?.address || ''
    });
  };

  const handleSaveProfile = async () => {
    if (!profileData.first_name.trim() || !profileData.last_name.trim()) {
      toast.error('الاسم الأول والأخير مطلوبان');
      return;
    }

    try {
      setProfileLoading(true);
      const response = await api.put('/users/profile', profileData);
      setUser(response.data);
      toast.success('تم تحديث الملف الشخصي بنجاح');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'فشل تحديث الملف الشخصي');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    try {
      setUploadingPicture(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser({ ...user, profile_picture: response.data.profile_picture });
      toast.success('تم تحديث صورة الملف الشخصي بنجاح');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.response?.data?.detail || 'فشل رفع صورة الملف الشخصي');
    } finally {
      setUploadingPicture(false);
    }
  };

  const NotificationToggle = ({ label, description, enabled, onChange, icon: Icon }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {label}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
          enabled
            ? 'bg-primary-600'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
        aria-label={enabled ? 'تعطيل' : 'تفعيل'}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-1' : 'translate-x-8'
          }`}
        />
      </button>
    </div>
  );

  return (
    <ResponsivePageShell title="الإعدادات">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-strong p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <Cog6ToothIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                إعدادات الحساب
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                قم بتخصيص تفضيلاتك وإعداداتك
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCircleIcon className="w-6 h-6" />
                  المعلومات الشخصية
                </h3>
                {!isEditingProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    تعديل
                  </button>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="relative">
                    {user?.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary-600"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <UserCircleIcon className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPicture}
                      className="absolute bottom-0 right-0 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors disabled:opacity-50"
                      title="تغيير الصورة"
                    >
                      {uploadingPicture ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CameraIcon className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {user?.first_name} {user?.last_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {user?.role === 'TRADER' && 'تاجر'}
                      {user?.role === 'TECHNICAL_COMMITTEE' && 'اللجنة الفنية'}
                      {user?.role === 'HIGHER_COMMITTEE' && 'اللجنة العليا'}
                    </p>
                  </div>
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          الاسم الأول <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          الاسم الأخير <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="+966xxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        واتساب
                      </label>
                      <input
                        type="tel"
                        value={profileData.whatsapp}
                        onChange={(e) => setProfileData({ ...profileData, whatsapp: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="+966xxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        تيليجرام
                      </label>
                      <input
                        type="text"
                        value={profileData.telegram}
                        onChange={(e) => setProfileData({ ...profileData, telegram: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        العنوان
                      </label>
                      <textarea
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        rows="3"
                        placeholder="أدخل عنوانك"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={handleCancelEdit}
                        disabled={profileLoading}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        إلغاء
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={profileLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {profileLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckIcon className="w-4 h-4" />
                        )}
                        حفظ التغييرات
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {user?.phone || 'لم يتم تحديد رقم الهاتف'}
                      </span>
                    </div>
                    {user?.whatsapp && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-xl">💬</span>
                        <span className="text-gray-700 dark:text-gray-300">{user.whatsapp}</span>
                      </div>
                    )}
                    {user?.telegram && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-xl">✈️</span>
                        <span className="text-gray-700 dark:text-gray-300">{user.telegram}</span>
                      </div>
                    )}
                    {user?.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <span className="text-xl mt-0.5">📍</span>
                        <span className="text-gray-700 dark:text-gray-300">{user.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🎨</span>
                المظهر
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <NotificationToggle
                  label={isDark ? 'الوضع الليلي' : 'الوضع النهاري'}
                  description={`التبديل إلى ${isDark ? 'الوضع النهاري' : 'الوضع الليلي'}`}
                  enabled={isDark}
                  onChange={toggleTheme}
                  icon={isDark ? MoonIcon : SunIcon}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BellIcon className="w-6 h-6" />
                الإشعارات
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
                <NotificationToggle
                  label="إشعارات البريد الإلكتروني"
                  description="تلقي إشعارات عبر البريد الإلكتروني"
                  enabled={notifications.emailNotifications}
                  onChange={() => handleNotificationChange('emailNotifications')}
                  icon={EnvelopeIcon}
                />
                <NotificationToggle
                  label="إشعارات الرسائل النصية (SMS)"
                  description="تلقي إشعارات عبر الرسائل النصية"
                  enabled={notifications.smsNotifications}
                  onChange={() => handleNotificationChange('smsNotifications')}
                  icon={DevicePhoneMobileIcon}
                />
              </div>
            </div>

            {user?.role === 'TECHNICAL_COMMITTEE' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BellIcon className="w-6 h-6" />
                  تنبيهات الشكاوى
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
                  <NotificationToggle
                    label="الشكاوى الجديدة"
                    description="تلقي تنبيه عند استلام شكوى جديدة"
                    enabled={notifications.newComplaints}
                    onChange={() => handleNotificationChange('newComplaints')}
                    icon={BellIcon}
                  />
                  <NotificationToggle
                    label="تحديثات الحالة"
                    description="تلقي تنبيه عند تغيير حالة الشكوى"
                    enabled={notifications.statusUpdates}
                    onChange={() => handleNotificationChange('statusUpdates')}
                    icon={BellIcon}
                  />
                  <NotificationToggle
                    label="التعليقات الجديدة"
                    description="تلقي تنبيه عند إضافة تعليق جديد"
                    enabled={notifications.comments}
                    onChange={() => handleNotificationChange('comments')}
                    icon={BellIcon}
                  />
                  <NotificationToggle
                    label="التكليفات الجديدة"
                    description="تلقي تنبيه عند تكليفك بشكوى"
                    enabled={notifications.assignments}
                    onChange={() => handleNotificationChange('assignments')}
                    icon={BellIcon}
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                <LanguageIcon className="w-5 h-5" />
                اللغة
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                اللغة الحالية: العربية
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
                (يتم دعم اللغة الإنجليزية قريباً)
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </ResponsivePageShell>
  );
}

export default UserSettings;
