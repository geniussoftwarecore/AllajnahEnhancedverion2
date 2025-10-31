import React, { useState, useEffect } from 'react';
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
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadAnalytics();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">جاري تحميل التحليلات...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">التحليلات المتقدمة</h1>

      {/* Date Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              تطبيق التصفية
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">إجمالي الشكاوى</h3>
          <p className="text-3xl font-bold text-gray-900">{analytics?.total_complaints || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">محلولة</h3>
          <p className="text-3xl font-bold text-green-600">{analytics?.resolved || 0}</p>
          <p className="text-xs text-gray-600 mt-1">
            معدل الحل: {analytics?.resolution_rate ? `${analytics.resolution_rate.toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">انتهاكات SLA</h3>
          <p className="text-3xl font-bold text-yellow-600">{analytics?.sla_breaches || 0}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">متوسط وقت الحل</h3>
          <p className="text-3xl font-bold text-blue-600">
            {analytics?.avg_resolution_time_days ? `${analytics.avg_resolution_time_days.toFixed(1)}` : '0'}
          </p>
          <p className="text-xs text-gray-600 mt-1">أيام</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">الشكاوى حسب الحالة</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">مقدمة</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full"
                    style={{ width: `${(analytics?.submitted / analytics?.total_complaints * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">{analytics?.submitted || 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">قيد المراجعة</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(analytics?.under_review / analytics?.total_complaints * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="font-bold text-blue-900 w-12 text-right">{analytics?.under_review || 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">تم التصعيد</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: `${(analytics?.escalated / analytics?.total_complaints * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="font-bold text-yellow-900 w-12 text-right">{analytics?.escalated || 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">محلولة</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(analytics?.resolved / analytics?.total_complaints * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="font-bold text-green-900 w-12 text-right">{analytics?.resolved || 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">مرفوضة</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(analytics?.rejected / analytics?.total_complaints * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="font-bold text-red-900 w-12 text-right">{analytics?.rejected || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">الشكاوى حسب التصنيف</h2>
          <div className="space-y-3">
            {analytics?.by_category && Object.entries(analytics.by_category).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-600">{category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(count / analytics?.total_complaints * 100) || 0}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-gray-900 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscriptions and Payments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">الاشتراكات</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">نشطة</span>
              <span className="font-bold">{analytics?.active_subscriptions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تنتهي قريباً</span>
              <span className="font-bold text-yellow-600">{analytics?.expiring_soon || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">الدفعات</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">قيد المراجعة</span>
              <span className="font-bold text-yellow-600">{analytics?.pending_payments || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">التقييمات</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">متوسط التقييم</span>
              <span className="font-bold text-blue-600">
                {analytics?.avg_feedback_rating ? `${analytics.avg_feedback_rating.toFixed(1)} / 5.0` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Assignees */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">أفضل المعينين</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics?.top_assignees && analytics.top_assignees.map((assignee) => (
            <div key={assignee.id} className="border border-gray-200 rounded-lg p-4">
              <div className="font-medium text-gray-900">{assignee.name}</div>
              <div className="text-sm text-gray-600">{assignee.email}</div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-600">الشكاوى المعينة</span>
                <span className="font-bold text-blue-600">{assignee.assigned_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
