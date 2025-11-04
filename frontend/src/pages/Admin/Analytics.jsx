import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ResponsivePageShell } from '../../components/ui';
import api from '../../api/axios';

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.start_date) params.start_date = dateRange.start_date;
      if (dateRange.end_date) params.end_date = dateRange.end_date;
      
      const response = await api.get('/admin/analytics', { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('فشل في تحميل التحليلات');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadAnalytics();
  };

  if (loading) {
    return (
      <ResponsivePageShell 
        title="التحليلات المتقدمة"
        subtitle="تحليل شامل لأداء النظام والشكاوى"
      >
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">جاري تحميل التحليلات...</p>
        </div>
      </ResponsivePageShell>
    );
  }

  return (
    <ResponsivePageShell 
      title="التحليلات المتقدمة"
      subtitle="تحليل شامل لأداء النظام والشكاوى"
    >
      <div className="space-y-6">

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تصفية حسب الفترة الزمنية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">من تاريخ</label>
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleApplyFilters}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  تطبيق التصفية
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-all">
              <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">إجمالي الشكاوى</h3>
              <p className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">{analytics?.total_complaints || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 p-6 rounded-2xl shadow-xl border border-green-200 dark:border-green-700 transform hover:scale-105 transition-all">
              <h3 className="text-sm text-green-700 dark:text-green-300 mb-2 font-medium">محلولة</h3>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{analytics?.resolved || 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                معدل الحل: {analytics?.resolution_rate ? `${analytics.resolution_rate.toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 p-6 rounded-2xl shadow-xl border border-yellow-200 dark:border-yellow-700 transform hover:scale-105 transition-all">
              <h3 className="text-sm text-yellow-700 dark:text-yellow-300 mb-2 font-medium">انتهاكات SLA</h3>
              <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{analytics?.sla_breaches || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 p-6 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-700 transform hover:scale-105 transition-all">
              <h3 className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-medium">متوسط وقت الحل</h3>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {analytics?.avg_resolution_time_days ? `${analytics.avg_resolution_time_days.toFixed(1)}` : '0'}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">أيام</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">الشكاوى حسب الحالة</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'مقدمة', value: analytics?.submitted || 0, color: '#6B7280' },
                      { name: 'قيد المراجعة', value: analytics?.under_review || 0, color: '#3B82F6' },
                      { name: 'تم التصعيد', value: analytics?.escalated || 0, color: '#F59E0B' },
                      { name: 'محلولة', value: analytics?.resolved || 0, color: '#10B981' },
                      { name: 'مرفوضة', value: analytics?.rejected || 0, color: '#EF4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'مقدمة', value: analytics?.submitted || 0, color: '#6B7280' },
                      { name: 'قيد المراجعة', value: analytics?.under_review || 0, color: '#3B82F6' },
                      { name: 'تم التصعيد', value: analytics?.escalated || 0, color: '#F59E0B' },
                      { name: 'محلولة', value: analytics?.resolved || 0, color: '#10B981' },
                      { name: 'مرفوضة', value: analytics?.rejected || 0, color: '#EF4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">الشكاوى حسب التصنيف</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics?.by_category ? Object.entries(analytics.by_category).map(([name, value]) => ({
                    name: name.substring(0, 15) + (name.length > 15 ? '...' : ''),
                    fullName: name,
                    value
                  })) : []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 border-2 border-purple-300 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900 dark:text-white">{payload[0].payload.fullName}</p>
                          <p className="text-sm text-purple-600 dark:text-purple-400">العدد: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Bar dataKey="value" fill="url(#colorGradient)" radius={[0, 10, 10, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900 rounded-2xl shadow-xl p-6 border border-blue-200 dark:border-blue-700">
              <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-4">الاشتراكات</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">نشطة</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{analytics?.active_subscriptions || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900">
                  <span className="text-gray-600 dark:text-gray-400">تنتهي قريباً</span>
                  <span className="font-bold text-yellow-600 dark:text-yellow-400">{analytics?.expiring_soon || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900 rounded-2xl shadow-xl p-6 border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-4">الدفعات</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900">
                  <span className="text-gray-600 dark:text-gray-400">قيد المراجعة</span>
                  <span className="font-bold text-yellow-600 dark:text-yellow-400">{analytics?.pending_payments || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900 rounded-2xl shadow-xl p-6 border border-green-200 dark:border-green-700">
              <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-4">التقييمات</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">متوسط التقييم</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {analytics?.avg_feedback_rating ? `${analytics.avg_feedback_rating.toFixed(1)} / 5.0` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">أفضل المعينين</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics?.top_assignees && analytics.top_assignees.map((assignee) => (
                <div key={assignee.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-all transform hover:scale-105 bg-gradient-to-br from-white to-blue-50 dark:from-gray-700 dark:to-blue-900">
                  <div className="font-medium text-gray-900 dark:text-white">{assignee.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{assignee.email}</div>
                  <div className="mt-2 flex justify-between text-sm p-2 bg-white dark:bg-gray-600 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">الشكاوى المعينة</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{assignee.assigned_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ResponsivePageShell>
  );
}

export default Analytics;
