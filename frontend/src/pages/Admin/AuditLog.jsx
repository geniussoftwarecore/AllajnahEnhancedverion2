import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResponsivePageShell, LoadingFallback, CTAButton } from '../../components/ui';
import { RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    target_type: '',
    limit: 100,
    offset: 0
  });
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.action) params.action = filters.action;
      if (filters.target_type) params.target_type = filters.target_type;
      params.limit = filters.limit;
      params.offset = filters.offset;
      
      const response = await api.get('/admin/audit-logs', { params });
      setLogs(response.data);
      
      setTotalPages(Math.ceil(response.data.length / filters.limit) || 1);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="card-glass-strong overflow-hidden shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تصفية البحث</h3>
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
        </div>

        {logs.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد سجلات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
                <thead>
                  <tr className="bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50">
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الإجراء</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">المستخدم</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">نوع الهدف</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">معرف الهدف</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التفاصيل</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
                  {logs.map((log) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
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
            </div>

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
