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
      role="banner"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-header sticky top-0"
      style={{ zIndex: 'var(--z-index-sticky)' }}
    >
      <div className="max-w-7xl mx-auto" style={{ padding: 'var(--spacing-4)' }}>
        <div className="flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h1 
              className="font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent"
              style={{ fontSize: 'var(--font-size-2xl)' }}
            >
              الاجنة المحسنة
            </h1>
            <p 
              className="text-gray-600 dark:text-gray-300"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              نظام إدارة الشكاوى
            </p>
          </motion.div>
          
          <div className="flex items-center" style={{ gap: 'var(--spacing-4)' }}>
            <NavigationButtons />
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-lg border border-white/40"
              style={{ 
                padding: 'var(--spacing-2)',
                transition: 'all var(--transition-base)'
              }}
              aria-label={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              aria-pressed={isDark}
            >
              {isDark ? '☀️' : '🌙'}
            </motion.button>
            
            <div 
              className="text-left bg-white/30 backdrop-blur-lg border border-white/40"
              style={{ 
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--border-radius-2xl)'
              }}
              role="status"
              aria-label="معلومات المستخدم"
            >
              <p 
                className="font-medium text-gray-900 dark:text-gray-100"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                {user?.first_name} {user?.last_name}
              </p>
              <p 
                className="text-gray-600 dark:text-gray-300"
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                {getRoleText(user?.role)}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:shadow-glow-green text-white font-medium"
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--border-radius-2xl)',
                fontSize: 'var(--font-size-sm)',
                transition: 'all var(--transition-base)'
              }}
              aria-label="تسجيل الخروج من النظام"
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
