import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  HomeIcon, 
  BellIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

function Header() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

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

  return (
    <motion.header 
      role="banner"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl shadow-lg">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                الأجنة المحسنة
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                نظام إدارة الشكاوى
              </p>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="hidden sm:flex p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              aria-label="الرئيسية"
            >
              <HomeIcon className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              aria-label="الإشعارات"
            >
              <BellIcon className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="hidden sm:flex p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              aria-label={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
            </motion.button>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600"
            >
              <UserCircleIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {getRoleText(user?.role)}
                </p>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-xl shadow-md transition-all"
              aria-label="تسجيل الخروج"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;
