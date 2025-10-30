import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ComplaintForm from '../components/ComplaintForm';
import ComplaintList from '../components/ComplaintList';
import api from '../api/axios';

function TraderDashboard() {
  const [activeTab, setActiveTab] = useState('complaints');
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">إجمالي الشكاوى</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_complaints || 0}</p>
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
          <div className="bg-red-50 p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">مرفوضة</h3>
            <p className="text-3xl font-bold text-red-600">{stats?.rejected || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">شكاواي</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {showForm ? 'إلغاء' : '+ تقديم شكوى جديدة'}
            </button>
          </div>

          {showForm ? (
            <ComplaintForm 
              onSuccess={() => {
                setShowForm(false);
                loadStats();
              }}
            />
          ) : (
            <ComplaintList onUpdate={loadStats} />
          )}
        </div>
      </div>
    </div>
  );
}

export default TraderDashboard;
