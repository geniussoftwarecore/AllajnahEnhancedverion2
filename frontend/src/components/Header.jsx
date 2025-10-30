import React from 'react';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, logout } = useAuth();

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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الاجنة المحسنة</h1>
            <p className="text-sm text-gray-600">نظام إدارة الشكاوى</p>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-600">{getRoleText(user?.role)}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
