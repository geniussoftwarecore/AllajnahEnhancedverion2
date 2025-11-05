import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResponsivePageShell from '../components/ui/ResponsivePageShell';
import { toast } from 'react-toastify';
import {
  BellIcon,
  MoonIcon,
  SunIcon,
  LanguageIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

function UserSettings() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newComplaints: true,
    statusUpdates: true,
    comments: true,
    assignments: true
  });

  const handleNotificationChange = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
    toast.success('تم حفظ الإعدادات');
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

            {user?.role === 'technical_committee' && (
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
