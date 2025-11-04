import React from 'react';
import { motion } from 'framer-motion';
import { 
  InboxIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  CreditCardIcon,
  MagnifyingGlassIcon,
  FolderOpenIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import CTAButton from './CTAButton';

const iconMap = {
  complaints: InboxIcon,
  documents: DocumentTextIcon,
  users: UserGroupIcon,
  payments: CreditCardIcon,
  search: MagnifyingGlassIcon,
  folder: FolderOpenIcon,
  analytics: ChartBarIcon,
  default: InboxIcon
};

function EmptyState({ 
  type = 'default',
  title,
  message,
  actionLabel,
  onAction,
  icon: CustomIcon,
  className = ''
}) {
  const Icon = CustomIcon || iconMap[type] || iconMap.default;
  
  const defaultMessages = {
    complaints: {
      title: 'لا توجد شكاوى حتى الآن',
      message: 'لم يتم تقديم أي شكاوى بعد. ابدأ بإضافة شكوى جديدة.'
    },
    payments: {
      title: 'لا توجد مدفوعات',
      message: 'لم يتم تسجيل أي مدفوعات حتى الآن.'
    },
    users: {
      title: 'لا يوجد مستخدمون',
      message: 'لم يتم إضافة أي مستخدمين إلى النظام بعد.'
    },
    search: {
      title: 'لا توجد نتائج',
      message: 'لم نتمكن من العثور على أي نتائج تطابق بحثك. جرب مصطلحات بحث مختلفة.'
    },
    default: {
      title: 'لا توجد بيانات',
      message: 'لا توجد عناصر للعرض حالياً.'
    }
  };
  
  const defaults = defaultMessages[type] || defaultMessages.default;
  const displayTitle = title || defaults.title;
  const displayMessage = message || defaults.message;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-soft"
      >
        <Icon className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
      </motion.div>
      
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-black text-gray-900 mb-3"
      >
        {displayTitle}
      </motion.h3>
      
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 max-w-md mb-8 leading-relaxed font-medium"
      >
        {displayMessage}
      </motion.p>
      
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CTAButton
            variant="primary"
            size="md"
            onClick={onAction}
          >
            {actionLabel}
          </CTAButton>
        </motion.div>
      )}
    </motion.div>
  );
}

export default EmptyState;
