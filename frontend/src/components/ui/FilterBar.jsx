import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 space-y-4 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-gray-900">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <FunnelIcon className="w-5 h-5 text-primary-600" strokeWidth={2.5} />
          </div>
          <span className="font-black text-base">الفلترة والبحث</span>
        </div>
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClearFilters}
            className="flex items-center gap-1.5 text-sm text-danger-600 hover:text-danger-700 font-bold px-3 py-1.5 rounded-lg hover:bg-danger-50 transition-all duration-200 active:scale-95"
          >
            <XMarkIcon className="w-4 h-4" strokeWidth={2.5} />
            <span>مسح الفلاتر</span>
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="بحث..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-200 bg-white/60 backdrop-blur-sm font-medium placeholder:text-gray-400 placeholder:font-normal hover:border-gray-300"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-danger-600 transition-all duration-200 p-1 rounded-lg hover:bg-danger-50 active:scale-95"
              aria-label="مسح البحث"
            >
              <XMarkIcon className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-200 bg-white/60 backdrop-blur-sm font-bold hover:border-gray-300 cursor-pointer"
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        {showPriority && (
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-200 bg-white/60 backdrop-blur-sm font-bold hover:border-gray-300 cursor-pointer"
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-200 bg-white/60 backdrop-blur-sm font-bold hover:border-gray-300 cursor-pointer"
          >
            <option value="all">كل الفئات</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
            ))}
          </select>
        )}
      </div>
    </motion.div>
  );
}

export default FilterBar;
