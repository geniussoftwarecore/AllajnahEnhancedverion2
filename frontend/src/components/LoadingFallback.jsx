import React from 'react';

const LoadingFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="card-glass-strong p-10 rounded-3xl shadow-premium animate-fadeIn"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative" aria-hidden="true">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full motion-safe:animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full motion-safe:animate-pulse shadow-glow-green"></div>
            </div>
          </div>
          <p 
            className="text-gray-800 font-bold text-lg"
            aria-label="جاري تحميل الصفحة"
          >
            جاري التحميل...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
