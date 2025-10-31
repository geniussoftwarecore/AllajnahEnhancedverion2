import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Header from '../../components/Header';
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
      <>
        <Header />
        <div className="p-6">
          <div className="text-center text-gray-500">جاري تحميل التحليلات...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Status Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">الشكاوى حسب الحالة</h2>
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

        {/* Category Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">الشكاوى حسب التصنيف</h2>
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
                    <div className="bg-white p-2 border border-gray-300 rounded shadow">
                      <p className="font-medium">{payload[0].payload.fullName}</p>
                      <p className="text-sm text-gray-600">العدد: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
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
    </>
  );
}

export default Analytics;
