import React, { useState, useEffect } from 'react';
import { ResponsivePageShell } from '../../components/ui';
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
    if (action.includes('CREATE')) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    if (action.includes('UPDATE')) return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
    if (action.includes('APPROVE')) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    if (action.includes('REJECT')) return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
    if (action.includes('ESCALATE')) return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
    return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
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

  return (
    <ResponsivePageShell 
      title="سجل التدقيق"
      subtitle="سجل شامل لجميع الأنشطة والعمليات في النظام"
    >
      <div className="space-y-6">

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تصفية البحث</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">معرف المستخدم</label>
                <input
                  type="number"
                  value={filters.user_id}
                  onChange={(e) => setFilters({ ...filters, user_id: e.target.value, offset: 0 })}
                  placeholder="ID"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الإجراء</label>
                <input
                  type="text"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value, offset: 0 })}
                  placeholder="بحث في الإجراءات"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">نوع الهدف</label>
                <select
                  value={filters.target_type}
                  onChange={(e) => setFilters({ ...filters, target_type: e.target.value, offset: 0 })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
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
                <button
                  onClick={loadLogs}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  🔄 تحديث
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">جاري التحميل...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد سجلات</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الإجراء</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">المستخدم</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">نوع الهدف</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">معرف الهدف</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">التفاصيل</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all transform hover:scale-[1.01]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{log.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${getActionColor(log.action)}`}>
                              {getActionText(log.action)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {log.actor_user?.email || `ID: ${log.actor_user_id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{log.target_type || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{log.target_id || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate" title={log.details}>
                            {log.details || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {new Date(log.created_at).toLocaleString('ar')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900 px-6 py-4 flex items-center justify-between border-t-2 border-gray-200 dark:border-gray-600">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      السابق
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={logs.length < filters.limit}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      التالي
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        عرض <span className="font-bold text-blue-600 dark:text-blue-400">{logs.length}</span> سجل
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-xl shadow-sm gap-2" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                        >
                          السابق
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={logs.length < filters.limit}
                          className="relative inline-flex items-center px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                        >
                          التالي
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </ResponsivePageShell>
  );
}

export default AuditLog;
