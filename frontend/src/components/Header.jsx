import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NavigationButtons from './ui/NavigationButtons';

function Header() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const getRoleText = (role) => {
    switch (role) {
      case 'trader':
        return 'تاجر';
      case 'technical_committee':
        return 'اللجنة الفنية';
      case 'higher_committee':
        return 'اللجنة العليا';
      default:
        return role;
    }
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-header sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              الاجنة المحسنة
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">نظام إدارة الشكاوى</p>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <NavigationButtons />
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-lg border border-white/40 transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </motion.button>
            
            <div className="text-left px-4 py-2 rounded-2xl bg-white/30 backdrop-blur-lg border border-white/40">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{getRoleText(user?.role)}</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:shadow-glow-green text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all"
            >
              تسجيل الخروج
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;
