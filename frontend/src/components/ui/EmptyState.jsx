import React from 'react';
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
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {displayTitle}
      </h3>
      
      <p className="text-gray-500 max-w-md mb-6">
        {displayMessage}
      </p>
      
      {actionLabel && onAction && (
        <CTAButton
          variant="primary"
          size="md"
          onClick={onAction}
        >
          {actionLabel}
        </CTAButton>
      )}
    </div>
  );
}

export default EmptyState;
