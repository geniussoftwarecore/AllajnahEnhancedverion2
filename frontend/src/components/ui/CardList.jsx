import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const CardList = ({ 
  items = [],
  loading = false,
  emptyMessage = 'لا توجد عناصر',
  emptyIcon: EmptyIcon,
  onItemClick,
  renderItem,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="card p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`card p-12 ${className}`}>
        <div className="text-center">
          {EmptyIcon && (
            <div className="mx-auto w-16 h-16 mb-4 text-gray-300">
              <EmptyIcon className="w-full h-full" />
            </div>
          )}
          <p className="text-gray-500 text-lg font-medium">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div
          key={item.id || index}
          onClick={() => onItemClick && onItemClick(item)}
          className={`card p-4 ${
            onItemClick ? 'cursor-pointer hover:shadow-medium active:scale-98 transition-all duration-200' : ''
          }`}
        >
          {renderItem ? (
            renderItem(item)
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-sm text-gray-600">
                    {item.subtitle}
                  </p>
                )}
              </div>
              {onItemClick && (
                <ChevronLeftIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CardList;
