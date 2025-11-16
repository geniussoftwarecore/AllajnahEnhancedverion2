import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid';

export default function BottomNavigation({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = () => {
    const commonItems = [
      { path: '/', icon: HomeIcon, activeIcon: HomeIconSolid, label: 'الرئيسية' },
    ];

    if (role === 'HIGHER_COMMITTEE') {
      return [
        ...commonItems,
        { path: '/admin/users', icon: UserGroupIcon, activeIcon: UserGroupIconSolid, label: 'المستخدمين' },
        { path: '/admin/analytics', icon: ChartBarIcon, activeIcon: ChartBarIconSolid, label: 'التحليلات' },
        { path: '/admin/settings', icon: Cog6ToothIcon, activeIcon: Cog6ToothIconSolid, label: 'الإعدادات' },
      ];
    } else if (role === 'TRADER') {
      return [
        ...commonItems,
        { path: '/subscription', icon: DocumentTextIcon, activeIcon: DocumentTextIconSolid, label: 'الاشتراك' },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <motion.nav
      role="navigation"
      aria-label="التنقل الرئيسي"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 md:hidden glass-header pb-safe"
      style={{ zIndex: 'var(--z-index-fixed)' }}
    >
      <div 
        className="flex justify-around items-center"
        style={{ padding: 'var(--spacing-2)' }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center ${
                isActive 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-glow-green' 
                  : 'text-gray-600 hover:text-primary-500'
              }`}
              style={{ 
                padding: 'var(--spacing-2)',
                borderRadius: 'var(--border-radius-2xl)',
                transition: 'all var(--transition-base)'
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className="w-6 h-6"
                style={{ marginBottom: 'var(--spacing-1)' }}
                aria-hidden="true"
              />
              <span 
                className="font-medium"
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
