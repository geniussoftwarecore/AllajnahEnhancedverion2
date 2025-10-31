import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  CreditCardIcon,
  CogIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  UserCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const NavDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const navItems = {
    trader: [
      { path: '/', label: 'الرئيسية', icon: HomeIcon },
      { path: '/subscription', label: 'الاشتراك', icon: CreditCardIcon },
    ],
    technical_committee: [
      { path: '/', label: 'الرئيسية', icon: HomeIcon },
      { path: '/', label: 'الشكاوى', icon: DocumentTextIcon },
    ],
    higher_committee: [
      { path: '/', label: 'الرئيسية', icon: HomeIcon },
      { path: '/admin/users', label: 'إدارة المستخدمين', icon: UserGroupIcon },
      { path: '/admin/payments', label: 'مراجعة المدفوعات', icon: CreditCardIcon },
      { path: '/admin/analytics', label: 'التحليلات', icon: ChartBarIcon },
      { path: '/admin/audit-log', label: 'سجل التدقيق', icon: ClipboardDocumentListIcon },
      { path: '/admin/settings', label: 'الإعدادات', icon: CogIcon },
    ],
  };

  const items = user ? navItems[user.role] || [] : [];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-strong z-50 transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="قائمة التنقل"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700">
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-10 h-10 text-white" />
              <div className="text-white">
                <p className="font-semibold text-sm">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs opacity-90">
                  {user?.role === 'trader' && 'تاجر'}
                  {user?.role === 'technical_committee' && 'لجنة فنية'}
                  {user?.role === 'higher_committee' && 'لجنة عليا'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-touch p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="إغلاق القائمة"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 active:scale-95 btn-touch"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-danger-600 hover:bg-danger-50 transition-all duration-200 active:scale-95 btn-touch font-medium"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavDrawer;
