import React, { useState } from 'react';
import MobileTopBar from './MobileTopBar';
import NavDrawer from './NavDrawer';

const ResponsivePageShell = ({ 
  children, 
  title, 
  showNotifications = true,
  notificationCount = 0,
  showNav = true,
  maxWidth = '7xl',
  padding = true
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  };

  const maxWidthClass = maxWidthClasses[maxWidth] || 'max-w-7xl';

  return (
    <div className="page-container bg-gray-50">
      {showNav && (
        <>
          <MobileTopBar
            onMenuClick={openDrawer}
            title={title}
            showNotifications={showNotifications}
            notificationCount={notificationCount}
          />
          <NavDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
        </>
      )}
      
      <main className={`min-h-[calc(100vh-4rem)] ${padding ? 'py-4 sm:py-6 lg:py-8' : ''}`}>
        <div className={`mx-auto w-full ${padding ? 'px-4 sm:px-6 lg:px-8' : ''} ${maxWidthClass}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default ResponsivePageShell;
