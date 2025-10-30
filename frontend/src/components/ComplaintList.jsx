import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import ComplaintDetail from './ComplaintDetail';

function ComplaintList({ onUpdate, role }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadComplaints();
  }, [filter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/complaints', { params });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-gray-100 text-gray-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'escalated':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted':
        return 'مقدمة';
      case 'under_review':
        return 'قيد المراجعة';
      case 'escalated':
        return 'تم التصعيد';
      case 'resolved':
        return 'محلولة';
      case 'rejected':
        return 'مرفوضة';
      default:
        return status;
    }
  };

  if (selectedComplaint) {
    return (
      <ComplaintDetail
        complaint={selectedComplaint}
        onBack={() => {
          setSelectedComplaint(null);
          loadComplaints();
          if (onUpdate) onUpdate();
        }}
        role={role}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          الكل
        </button>
        <button
          onClick={() => setFilter('submitted')}
          className={`px-4 py-2 rounded-lg ${filter === 'submitted' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          مقدمة
        </button>
        <button
          onClick={() => setFilter('under_review')}
          className={`px-4 py-2 rounded-lg ${filter === 'under_review' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          قيد المراجعة
        </button>
        <button
          onClick={() => setFilter('escalated')}
          className={`px-4 py-2 rounded-lg ${filter === 'escalated' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          تم التصعيد
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg ${filter === 'resolved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          محلولة
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-8 text-gray-500">لا توجد شكاوى</div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedComplaint(complaint)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                  {getStatusText(complaint.status)}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{complaint.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>رقم الشكوى: #{complaint.id}</span>
                <span>{new Date(complaint.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ComplaintList;
