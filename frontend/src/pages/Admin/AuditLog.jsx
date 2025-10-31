import React, { useState, useEffect } from 'react';
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
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'bg-red-100 text-red-800';
    if (action.includes('APPROVE')) return 'bg-green-100 text-green-800';
    if (action.includes('REJECT')) return 'bg-red-100 text-red-800';
    if (action.includes('ESCALATE')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
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
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">سجل التدقيق</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">معرف المستخدم</label>
            <input
              type="number"
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value, offset: 0 })}
              placeholder="ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الإجراء</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, offset: 0 })}
              placeholder="بحث في الإجراءات"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الهدف</label>
            <select
              value={filters.target_type}
              onChange={(e) => setFilters({ ...filters, target_type: e.target.value, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">لا توجد سجلات</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراء</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع الهدف</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">معرف الهدف</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التفاصيل</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                          {getActionText(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.actor_user?.email || `ID: ${log.actor_user_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.target_type || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.target_id || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={log.details}>
                        {log.details || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString('ar')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={logs.length < filters.limit}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    عرض <span className="font-medium">{logs.length}</span> سجل
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px gap-2" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      السابق
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={logs.length < filters.limit}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}

export default AuditLog;
