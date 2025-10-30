import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ComplaintList from '../components/ComplaintList';
import api from '../api/axios';

function TechnicalCommitteeDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">لوحة اللجنة الفنية</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">جديدة</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.submitted || 0}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">قيد المراجعة</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.under_review || 0}</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">تم التصعيد</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats?.escalated || 0}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">محلولة</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.resolved || 0}</p>
          </div>
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
