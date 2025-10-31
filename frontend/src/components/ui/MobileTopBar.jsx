import React from 'react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import NavigationButtons from './NavigationButtons';

const MobileTopBar = ({ onMenuClick, title = 'نظام إدارة الشكاوى', showNotifications = true, notificationCount = 0 }) => {
  return (
    <div className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm safe-top">
      <div className="flex items-center justify-between px-4 h-16">
        <button
          onClick={onMenuClick}
          className="btn-touch p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95 md:hidden"
          aria-label="فتح القائمة"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <h1 className="text-lg font-bold text-gray-900 truncate flex-1 text-center md:text-right">
          {title}
        </h1>

        <div className="flex items-center gap-2 -ml-2">
          <NavigationButtons />
          
          {showNotifications && (
            <button
              className="btn-touch p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95 relative"
              aria-label="الإشعارات"
            >
              <BellIcon className="w-6 h-6" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-danger-500 rounded-full animate-scale-in">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileTopBar;
