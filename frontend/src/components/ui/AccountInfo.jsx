import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

function AccountInfo({ user }) {
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: ar });
    } catch (error) {
      return 'غير متوفر';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'trader':
        return 'تاجر';
      case 'technical_committee':
        return 'لجنة فنية';
      case 'higher_committee':
        return 'لجنة عليا';
      default:
        return role;
    }
  };

  const infoItems = [
    {
      icon: CalendarIcon,
      label: 'عضو منذ',
      value: user?.created_at ? formatDate(user.created_at) : 'غير متوفر',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: ClockIcon,
      label: 'آخر تحديث',
      value: user?.updated_at ? formatDate(user.updated_at) : 'غير متوفر',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: ShieldCheckIcon,
      label: 'الدور',
      value: getRoleText(user?.role),
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-md"
    >
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">
        معلومات الحساب
      </h3>
      
      <div className="space-y-3">
        {infoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className={`p-2 ${item.color} bg-opacity-10 dark:bg-opacity-20 rounded-lg`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {user?.is_active && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
              الحساب نشط
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default AccountInfo;
