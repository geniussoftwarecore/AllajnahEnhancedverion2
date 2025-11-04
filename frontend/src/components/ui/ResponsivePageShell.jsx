import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MobileTopBar from './MobileTopBar';
import NavDrawer from './NavDrawer';
import { 
  HomeIcon, 
  BellIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Bars3Icon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const ResponsivePageShell = ({ 
  children, 
  title, 
  subtitle,
  showNotifications = true,
  notificationCount = 0,
  showNav = true,
  showBackButton = true,
  maxWidth = '7xl',
  padding = true
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  };

  const maxWidthClass = maxWidthClasses[maxWidth] || 'max-w-7xl';

  return (
    <div className="page-container bg-gray-50 dark:bg-gray-900">
      {showNav && (
        <>
          <div className="sticky top-0 z-30 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                  <button
                    onClick={openDrawer}
                    className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                    aria-label="فتح القائمة"
                  >
                    <Bars3Icon className="w-6 h-6" />
                  </button>
                  
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      الأجنة المحسنة
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      نظام إدارة الشكاوى
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {showBackButton && location.pathname !== '/' && (
                    <button
                      onClick={() => navigate(-1)}
                      className="flex items-center gap-2 p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                      aria-label="رجوع"
                    >
                      <ArrowLeftIcon className="w-6 h-6" />
                      <span className="hidden lg:inline text-sm font-medium">رجوع</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/')}
                    className="hidden sm:flex p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                    aria-label="الرئيسية"
                  >
                    <HomeIcon className="w-6 h-6" />
                  </button>

                  {showNotifications && (
                    <button
                      className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                      aria-label="الإشعارات"
                    >
                      <BellIcon className="w-6 h-6" />
                      {notificationCount > 0 && (
                        <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={toggleTheme}
                    className="hidden sm:flex p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                    aria-label={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
                  >
                    {isDark ? '☀️' : '🌙'}
                  </button>

                  <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <UserCircleIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {getRoleText(user?.role)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                    aria-label="تسجيل الخروج"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <NavDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
        </>
      )}
      
      <main className={`min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 ${padding ? 'py-4 sm:py-6 lg:py-8' : ''}`}>
        <div className={`mx-auto w-full ${padding ? 'px-4 sm:px-6 lg:px-8' : ''} ${maxWidthClass}`}>
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default ResponsivePageShell;
