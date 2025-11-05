import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const menuItems = [
    {
      icon: UserCircleIcon,
      label: 'الملف الشخصي',
      onClick: () => {
        navigate('/profile');
        setIsOpen(false);
      },
      color: 'text-primary-600 dark:text-primary-400'
    },
    {
      icon: KeyIcon,
      label: 'تغيير كلمة المرور',
      onClick: () => {
        navigate('/change-password');
        setIsOpen(false);
      },
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Cog6ToothIcon,
      label: 'الإعدادات',
      onClick: () => {
        navigate('/settings');
        setIsOpen(false);
      },
      color: 'text-gray-600 dark:text-gray-400'
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
        aria-label="قائمة المستخدم"
        aria-expanded={isOpen}
      >
        {user?.profile_picture ? (
          <img
            src={user.profile_picture}
            alt={`${user.first_name} ${user.last_name}`}
            className="w-8 h-8 rounded-full object-cover border-2 border-primary-500"
          />
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 text-white font-bold text-sm shadow-md">
            {getInitials()}
          </div>
        )}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {getRoleText(user?.role)}
          </p>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-strong border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-500"
                  />
                ) : (
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 text-white font-bold text-lg shadow-md">
                    {getInitials()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                    {getRoleText(user?.role)}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ x: -4, backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)' }}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ x: -4, backgroundColor: 'rgba(220, 38, 38, 0.05)' }}
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  تسجيل الخروج
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileDropdown;
