import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  UserGroupIcon,
  CreditCardIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CogIcon
} from '@heroicons/react/24/outline';

function AdminNavMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: 'لوحة التحكم', icon: HomeIcon },
    { path: '/admin/users', label: 'المستخدمين', icon: UserGroupIcon },
    { path: '/admin/payments', label: 'الدفعات', icon: CreditCardIcon },
    { path: '/admin/analytics', label: 'التحليلات', icon: ChartBarIcon },
    { path: '/admin/audit-log', label: 'سجل التدقيق', icon: ClipboardDocumentListIcon },
    { path: '/admin/settings', label: 'الإعدادات', icon: CogIcon }
  ];

  return (
    <div className="card-glass-strong overflow-x-auto shadow-lg mb-6">
      <div className="flex border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-white/50 to-transparent dark:from-gray-800/50 min-w-max">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                relative px-6 py-4 font-semibold transition-all duration-300 flex items-center gap-2
                ${isActive 
                  ? 'text-primary-600 dark:text-primary-400 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/20' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
                hover:bg-gradient-to-b hover:from-gray-50/50 hover:to-transparent
                dark:hover:from-gray-700/30 dark:hover:to-transparent
              `}
            >
              <Icon className="w-5 h-5" strokeWidth={2.5} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeAdminNav"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-full shadow-glow-green"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AdminNavMenu;
