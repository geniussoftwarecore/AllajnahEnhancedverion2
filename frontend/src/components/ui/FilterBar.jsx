import React from 'react';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

function FilterBar({ 
  searchValue, 
  onSearchChange, 
  statusFilter, 
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  categories = [],
  showPriority = false,
  onClearFilters
}) {
  const statuses = [
    { value: 'all', label: 'الكل' },
    { value: 'submitted', label: 'مقدمة' },
    { value: 'under_review', label: 'قيد المراجعة' },
    { value: 'escalated', label: 'متصاعدة' },
    { value: 'resolved', label: 'محلولة' },
    { value: 'rejected', label: 'مرفوضة' },
  ];

  const priorities = [
    { value: 'all', label: 'الكل' },
    { value: 'low', label: 'منخفضة' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'عالية' },
    { value: 'urgent', label: 'عاجلة' },
  ];

  const hasActiveFilters = searchValue || statusFilter !== 'all' || (showPriority && priorityFilter !== 'all') || categoryFilter !== 'all';

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2 text-gray-700">
        <FunnelIcon className="w-5 h-5" />
        <span className="font-semibold">الفلترة والبحث</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-10 pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="مسح البحث"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        {showPriority && (
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>
        )}

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">كل الفئات</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
            ))}
          </select>
        )}
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-2 text-sm text-danger-600 hover:text-danger-700 font-medium"
        >
          <XMarkIcon className="w-4 h-4" />
          مسح الفلاتر
        </button>
      )}
    </div>
  );
}

export default FilterBar;
