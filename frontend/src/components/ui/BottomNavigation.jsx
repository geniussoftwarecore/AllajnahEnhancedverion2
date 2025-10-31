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

    if (role === 'higher_committee') {
      return [
        ...commonItems,
        { path: '/admin/users', icon: UserGroupIcon, activeIcon: UserGroupIconSolid, label: 'المستخدمين' },
        { path: '/admin/analytics', icon: ChartBarIcon, activeIcon: ChartBarIconSolid, label: 'التحليلات' },
        { path: '/admin/settings', icon: Cog6ToothIcon, activeIcon: Cog6ToothIconSolid, label: 'الإعدادات' },
      ];
    } else if (role === 'trader') {
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
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 md:hidden z-40 glass-header pb-safe"
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-glow-green' 
                  : 'text-gray-600 hover:text-primary-500'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
