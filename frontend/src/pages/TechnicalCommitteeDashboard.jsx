import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ComplaintList from '../components/ComplaintList';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';

function TechnicalCommitteeDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'complaint_update' || message.type === 'new_complaint' || message.type === 'new_comment') {
      setNotification(`تحديث جديد: ${message.message || 'تم تحديث شكوى'}`);
      setTimeout(() => setNotification(null), 5000);
      loadStats();
    }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">لوحة اللجنة الفنية</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-sm text-gray-600">{isConnected ? 'متصل' : 'غير متصل'}</span>
            </div>
          </div>
        </div>

        {notification && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-4 animate-pulse">
            {notification}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-sm text-gray-600 mb-2">جديدة</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.submitted || 0}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-sm text-gray-600 mb-2">قيد المراجعة</h3>
                <p className="text-3xl font-bold text-blue-600">{stats?.under_review || 0}</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-sm text-gray-600 mb-2">تم التصعيد</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats?.escalated || 0}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-sm text-gray-600 mb-2">محلولة</h3>
                <p className="text-3xl font-bold text-green-600">{stats?.resolved || 0}</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">الشكاوى</h3>
          <ComplaintList onUpdate={loadStats} role="technical_committee" />
        </div>
      </div>
    </div>
  );
}

export default TechnicalCommitteeDashboard;
