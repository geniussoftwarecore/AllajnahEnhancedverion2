import React from 'react';

const Skeleton = ({ className = '', variant = 'default', count = 1, height, width }) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded';
  
  const variants = {
    default: 'h-4',
    text: 'h-4',
    title: 'h-8',
    subtitle: 'h-6',
    button: 'h-12',
    card: 'h-64',
    avatar: 'h-12 w-12 rounded-full',
    circle: 'rounded-full',
    rectangle: 'rounded-xl',
  };
  
  const variantClass = variants[variant] || variants.default;
  const heightClass = height ? `h-[${height}]` : '';
  const widthClass = width ? `w-[${width}]` : 'w-full';
  
  if (count === 1) {
    return (
      <div 
        className={`${baseClasses} ${variantClass} ${heightClass} ${widthClass} ${className}`} 
        style={{ 
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className={`${baseClasses} ${variantClass} ${heightClass} ${widthClass}`}
          style={{ 
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl p-6 space-y-4 ${className}`}>
    <Skeleton variant="title" width="60%" />
    <Skeleton variant="text" count={3} />
    <div className="flex gap-4">
      <Skeleton variant="button" width="120px" />
      <Skeleton variant="button" width="120px" />
    </div>
  </div>
);

export const SkeletonStat = ({ className = '' }) => (
  <div className={`bg-white rounded-xl p-6 space-y-3 ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="circle" className="h-10 w-10" />
    </div>
    <Skeleton variant="title" width="50%" />
    <Skeleton variant="text" width="30%" />
  </div>
);

export const SkeletonTable = ({ rows = 5, className = '' }) => (
  <div className={`bg-white rounded-xl overflow-hidden ${className}`}>
    <div className="p-4 border-b border-gray-200">
      <Skeleton variant="subtitle" width="30%" />
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="p-4 flex gap-4">
          <Skeleton className="w-12" />
          <Skeleton className="flex-1" />
          <Skeleton className="w-24" />
          <Skeleton className="w-20" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonStat />
      <SkeletonStat />
      <SkeletonStat />
      <SkeletonStat />
    </div>
    
    {/* Cards Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard />
      <SkeletonCard />
    </div>
    
    {/* Table */}
    <SkeletonTable />
  </div>
);

export default Skeleton;
