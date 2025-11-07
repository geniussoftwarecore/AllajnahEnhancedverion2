import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

function AccountStats({ user }) {
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    resolved: 0,
    rejected: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/complaints');
        const complaints = response.data;
        
        const statsData = {
          total: complaints.length,
          submitted: complaints.filter(c => c.status === 'SUBMITTED').length,
          underReview: complaints.filter(c => c.status === 'UNDER_REVIEW').length,
          resolved: complaints.filter(c => c.status === 'RESOLVED').length,
          rejected: complaints.filter(c => c.status === 'REJECTED').length,
          loading: false
        };
        
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    if (user?.role === 'trader') {
      fetchStats();
    } else {
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  if (stats.loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'إجمالي الشكاوى',
      value: stats.total,
      icon: DocumentTextIcon,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'قيد المراجعة',
      value: stats.underReview + stats.submitted,
      icon: ClockIcon,
      color: 'from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      label: 'محلولة',
      value: stats.resolved,
      icon: CheckCircleIcon,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'مرفوضة',
      value: stats.rejected,
      icon: XCircleIcon,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-md"
    >
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">
        إحصائيات الحساب
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-gray-200 dark:border-gray-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default AccountStats;
