import React from 'react';
import { motion } from 'framer-motion';

export default function ModernComplaintCard({ title, status, date, priority, onClick }) {
  const statusColors = {
    open: 'from-green-400 to-green-200',
    pending: 'from-yellow-400 to-yellow-200',
    in_progress: 'from-blue-400 to-blue-200',
    resolved: 'from-purple-400 to-purple-200',
    closed: 'from-gray-300 to-gray-100',
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const statusLabels = {
    open: 'مفتوحة',
    pending: 'قيد الانتظار',
    in_progress: 'قيد المعالجة',
    resolved: 'تم الحل',
    closed: 'مغلقة',
  };

  const priorityLabels = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة',
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.03, 
        boxShadow: "0 10px 25px rgba(0, 196, 107, 0.2)" 
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-6 rounded-3xl bg-gradient-to-br ${statusColors[status] || statusColors.open} backdrop-blur-lg border border-white/40 transition-all cursor-pointer`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-gray-900 font-semibold text-lg flex-1">{title}</h3>
        {priority && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[priority]}`}>
            {priorityLabels[priority]}
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{date}</p>
      
      <div className="flex items-center justify-between">
        <motion.span 
          whileHover={{ scale: 1.05 }}
          className="inline-block bg-white/30 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm"
        >
          {statusLabels[status] || status}
        </motion.span>
        
        <motion.div
          whileHover={{ x: 5 }}
          className="text-gray-700"
        >
          ←
        </motion.div>
      </div>
    </motion.div>
  );
}
