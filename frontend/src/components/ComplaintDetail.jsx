import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function ComplaintDetail({ complaint, onBack, role }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [committeeUsers, setCommitteeUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(complaint.assigned_to_id || '');
  const [selectedStatus, setSelectedStatus] = useState(complaint.status);

  useEffect(() => {
    loadComments();
    if (user.role !== 'trader') {
      loadCommitteeUsers();
    }
  }, []);

  const loadComments = async () => {
    try {
      const response = await api.get(`/complaints/${complaint.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadCommitteeUsers = async () => {
    try {
      const response = await api.get('/users/committee');
      setCommitteeUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await api.post(`/complaints/${complaint.id}/comments`, {
        complaint_id: complaint.id,
        content: newComment,
        is_internal: isInternal
      });
      setNewComment('');
      setIsInternal(false);
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpdateComplaint = async () => {
    try {
      await api.patch(`/complaints/${complaint.id}`, {
        status: selectedStatus,
        assigned_to_id: selectedAssignee ? parseInt(selectedAssignee) : null
      });
      alert('تم تحديث الشكوى بنجاح');
      onBack();
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('فشل تحديث الشكوى');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'submitted': 'مقدمة',
      'under_review': 'قيد المراجعة',
      'escalated': 'تم التصعيد',
      'resolved': 'محلولة',
      'rejected': 'مرفوضة'
    };
    return statusMap[status] || status;
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 hover:text-blue-700"
      >
        ← العودة للقائمة
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{complaint.title}</h2>
            <p className="text-sm text-gray-600">رقم الشكوى: #{complaint.id}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm ${
            complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
            complaint.status === 'rejected' ? 'bg-red-100 text-red-800' :
            complaint.status === 'escalated' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {getStatusText(complaint.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-gray-600">تاريخ التقديم:</span>
            <span className="mr-2 font-medium">{new Date(complaint.created_at).toLocaleDateString('ar-EG')}</span>
          </div>
          <div>
            <span className="text-gray-600">آخر تحديث:</span>
            <span className="mr-2 font-medium">{new Date(complaint.updated_at).toLocaleDateString('ar-EG')}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">تفاصيل الشكوى:</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">ملخص النقاط الرئيسية:</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{complaint.complaint_summary}</p>
          </div>

          {complaint.desired_resolution && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">الحل المطلوب:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.desired_resolution}</p>
            </div>
          )}
        </div>
      </div>

      {user.role !== 'trader' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">إجراءات اللجنة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تعيين إلى:
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">غير معين</option>
                {committeeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تحديث الحالة:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="submitted">مقدمة</option>
                <option value="under_review">قيد المراجعة</option>
                <option value="escalated">تم التصعيد</option>
                <option value="resolved">محلولة</option>
                <option value="rejected">مرفوضة</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleUpdateComplaint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            حفظ التحديثات
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">التعليقات</h3>
        
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد تعليقات</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={`p-4 rounded-lg ${
                comment.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">
                    {comment.user?.first_name} {comment.user?.last_name}
                  </span>
                  <div className="text-left">
                    {comment.is_internal === 1 && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded ml-2">
                        داخلي
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="3"
            placeholder="أضف تعليقاً..."
          />
          {user.role !== 'trader' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isInternal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="ml-2"
              />
              <label htmlFor="isInternal" className="text-sm text-gray-700">
                تعليق داخلي (للجنة فقط)
              </label>
            </div>
          )}
          <button
            onClick={handleAddComment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            إضافة تعليق
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComplaintDetail;
