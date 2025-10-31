import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRightIcon, HomeIcon } from '@heroicons/react/24/outline';

const NavigationButtons = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHomePage = location.pathname === '/';

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleBack}
        className="btn-touch p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
        aria-label="رجوع"
        title="رجوع"
      >
        <ArrowRightIcon className="w-5 h-5" />
      </button>
      
      {!isHomePage && (
        <button
          onClick={handleHome}
          className="btn-touch p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
          aria-label="الصفحة الرئيسية"
          title="الصفحة الرئيسية"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;
