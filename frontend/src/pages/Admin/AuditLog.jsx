import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsivePageShell, LoadingFallback, CTAButton, AdminNavMenu } from '../../components/ui';
import { RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuditLogs } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

function AuditLog() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    target_type: '',
    limit: 100,
    offset: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { data: logs = [], isLoading: loading } = useAuditLogs(filters);
  const totalPages = useMemo(() => Math.ceil(logs.length / filters.limit) || 1, [logs.length, filters.limit]);

  const loadLogs = () => {
    queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setFilters({ ...filters, offset: (newPage - 1) * filters.limit });
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
    if (action.includes('UPDATE')) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
    if (action.includes('APPROVE')) return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
    if (action.includes('REJECT')) return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
    if (action.includes('ESCALATE')) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
    return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
  };

  const getActionText = (action) => {
    const actionMap = {
      'CREATE_USER': 'إنشاء مستخدم',
      'UPDATE_USER': 'تحديث مستخدم',
      'DEACTIVATE_USER': 'تعطيل مستخدم',
      'CREATE_COMPLAINT': 'إنشاء شكوى',
      'UPDATE_COMPLAINT': 'تحديث شكوى',
      'APPROVE_PAYMENT': 'الموافقة على دفع',
      'REJECT_PAYMENT': 'رفض دفع',
      'AUTO_ASSIGN': 'تعيين تلقائي',
      'AUTO_ESCALATE': 'تصعيد تلقائي',
      'RESOLVE_COMPLAINT': 'حل شكوى',
      'REJECT_COMPLAINT': 'رفض شكوى'
    };
    return actionMap[action] || action;
  };

  if (loading) return <LoadingFallback message="جاري تحميل سجلات التدقيق..." />;

  return (
    <ResponsivePageShell 
      title="سجل التدقيق"
      subtitle="سجل شامل لجميع الأنشطة والعمليات في النظام"
    >
      <div className="space-y-6">
        <AdminNavMenu />
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass-strong overflow-hidden shadow-xl p-6 border border-primary-100 dark:border-primary-900/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تصفية البحث</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">معرف المستخدم</label>
              <input
                type="number"
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value, offset: 0 })}
                placeholder="ID"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الإجراء</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value, offset: 0 })}
                placeholder="بحث في الإجراءات"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">نوع الهدف</label>
              <select
                value={filters.target_type}
                onChange={(e) => setFilters({ ...filters, target_type: e.target.value, offset: 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">الكل</option>
                <option value="user">مستخدم</option>
                <option value="complaint">شكوى</option>
                <option value="payment">دفع</option>
                <option value="subscription">اشتراك</option>
                <option value="category">تصنيف</option>
              </select>
            </div>
            <div className="flex items-end">
              <CTAButton
                onClick={loadLogs}
                variant="secondary"
                size="md"
                icon={RefreshCcw}
                className="w-full"
              >
                تحديث
              </CTAButton>
            </div>
          </div>
        </motion.div>

        {logs.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد سجلات</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="overflow-x-auto rounded-xl border-2 border-gray-200/80 dark:border-gray-700/80 shadow-xl"
            >
              <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الإجراء</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">المستخدم</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">نوع الهدف</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">معرف الهدف</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">التفاصيل</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
                  {logs.map((log, index) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{log.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getActionColor(log.action)}`}>
                          {getActionText(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {log.actor_user?.email || `ID: ${log.actor_user_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{log.target_type || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{log.target_id || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate" title={log.details}>
                        {log.details || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString('ar')}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <div className="card-glass-strong p-4 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <CTAButton
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="ghost"
                  size="sm"
                  icon={ChevronRight}
                >
                  السابق
                </CTAButton>
                <CTAButton
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={logs.length < filters.limit}
                  variant="ghost"
                  size="sm"
                  icon={ChevronLeft}
                >
                  التالي
                </CTAButton>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    عرض <span className="font-semibold text-primary-600 dark:text-primary-400">{logs.length}</span> سجل
                  </p>
                </div>
                <div className="flex gap-2">
                  <CTAButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="ghost"
                    size="sm"
                    icon={ChevronRight}
                  >
                    السابق
                  </CTAButton>
                  <CTAButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={logs.length < filters.limit}
                    variant="ghost"
                    size="sm"
                    icon={ChevronLeft}
                  >
                    التالي
                  </CTAButton>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ResponsivePageShell>
  );
}

export default AuditLog;
