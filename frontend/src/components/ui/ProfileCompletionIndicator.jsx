import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

function ProfileCompletionIndicator({ user }) {
  const calculateCompletion = () => {
    const fields = [
      { name: 'first_name', label: 'الاسم الأول', value: user?.first_name },
      { name: 'last_name', label: 'الاسم الأخير', value: user?.last_name },
      { name: 'email', label: 'البريد الإلكتروني', value: user?.email },
      { name: 'phone', label: 'رقم الهاتف', value: user?.phone },
      { name: 'whatsapp', label: 'واتساب', value: user?.whatsapp },
      { name: 'telegram', label: 'تليجرام', value: user?.telegram },
      { name: 'address', label: 'العنوان', value: user?.address },
      { name: 'profile_picture', label: 'الصورة الشخصية', value: user?.profile_picture }
    ];

    const filledFields = fields.filter(field => field.value && field.value.toString().trim() !== '');
    const percentage = Math.round((filledFields.length / fields.length) * 100);
    
    return {
      percentage,
      filledCount: filledFields.length,
      totalCount: fields.length,
      missingFields: fields.filter(field => !field.value || field.value.toString().trim() === '')
    };
  };

  const completion = calculateCompletion();
  
  const getCompletionColor = (percentage) => {
    if (percentage === 100) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage === 100) return 'from-green-500 to-green-600';
    if (percentage >= 75) return 'from-blue-500 to-blue-600';
    if (percentage >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-md"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {completion.percentage === 100 ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : (
            <div className={`w-6 h-6 rounded-full border-2 border-dashed ${getCompletionColor(completion.percentage)}`}></div>
          )}
          <h3 className="font-bold text-gray-900 dark:text-white">
            اكتمال الملف الشخصي
          </h3>
        </div>
        <span className={`text-2xl font-bold ${getCompletionColor(completion.percentage)}`}>
          {completion.percentage}%
        </span>
      </div>

      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completion.percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${getProgressBarColor(completion.percentage)} rounded-full shadow-inner`}
        />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {completion.filledCount} من {completion.totalCount} حقل مكتمل
      </p>

      {completion.percentage < 100 && completion.missingFields.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            الحقول المفقودة:
          </p>
          <div className="flex flex-wrap gap-2">
            {completion.missingFields.slice(0, 4).map((field, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 rounded-md"
              >
                {field.label}
              </span>
            ))}
            {completion.missingFields.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 rounded-md">
                +{completion.missingFields.length - 4} المزيد
              </span>
            )}
          </div>
        </div>
      )}

      {completion.percentage === 100 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
            <span>🎉</span>
            ملفك الشخصي مكتمل بالكامل!
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default ProfileCompletionIndicator;
