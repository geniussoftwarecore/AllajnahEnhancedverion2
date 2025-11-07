import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ChatBubbleBottomCenterTextIcon, PaperClipIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog, ResponsivePageShell } from './ui';
import QuickReplySelector from './QuickReplySelector';

function ComplaintDetail({ complaint: propComplaint, onBack, role, embedded = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(propComplaint || null);
  const [loadingComplaint, setLoadingComplaint] = useState(!propComplaint);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [committeeUsers, setCommitteeUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(propComplaint?.assigned_to_id || '');
  const [selectedStatus, setSelectedStatus] = useState(propComplaint?.status || '');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, isLoading: false });
  const [showQuickReplySelector, setShowQuickReplySelector] = useState(false);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (!propComplaint && id) {
      loadComplaintData();
    }
  }, [id, propComplaint]);

  useEffect(() => {
    if (complaint) {
      setSelectedAssignee(complaint.assigned_to_id || '');
      setSelectedStatus(complaint.status || '');
      loadComments();
      loadFeedback();
      loadAttachments();
      if (user.role !== 'trader') {
        loadCommitteeUsers();
      }
    }
  }, [complaint]);

  const loadComplaintData = async () => {
    try {
      setLoadingComplaint(true);
      const response = await api.get(`/complaints/${id}`);
      setComplaint(response.data);
    } catch (error) {
      console.error('Error loading complaint:', error);
    } finally {
      setLoadingComplaint(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const response = await api.get(`/complaints/${complaint.id}/feedback`);
      setFeedback(response.data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await api.get(`/complaints/${complaint.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadAttachments = async () => {
    try {
      const response = await api.get(`/complaints/${complaint.id}/attachments`);
      setAttachments(response.data);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('فشل تحميل الملف');
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

  const handleAcceptTask = async () => {
    try {
      await api.post(`/complaints/${complaint.id}/accept-task`);
      alert('تم قبول المهمة بنجاح');
      onBack();
    } catch (error) {
      console.error('Error accepting task:', error);
      alert(error.response?.data?.detail || 'فشل في قبول المهمة');
    }
  };

  const handleRejectTask = async () => {
    const reason = prompt('يرجى إدخال سبب رفض المهمة:');
    if (!reason) return;

    try {
      await api.post(`/complaints/${complaint.id}/reject-task`, null, {
        params: { reason }
      });
      alert('تم رفض المهمة وإعادة توزيعها بنجاح');
      onBack();
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert(error.response?.data?.detail || 'فشل في رفض المهمة');
    }
  };

  const handleStartWorking = async () => {
    try {
      await api.post(`/complaints/${complaint.id}/start-working`);
      alert('تم البدء بالعمل على المهمة بنجاح');
      onBack();
    } catch (error) {
      console.error('Error starting work:', error);
      alert(error.response?.data?.detail || 'فشل في البدء بالعمل');
    }
  };

  const handleReopen = async () => {
    setConfirmDialog({ ...confirmDialog, isLoading: true });

    try {
      await api.post(`/complaints/${complaint.id}/reopen`);
      alert('تم إعادة فتح الشكوى بنجاح');
      setConfirmDialog({ isOpen: false, isLoading: false });
      onBack();
    } catch (error) {
      alert(error.response?.data?.detail || 'فشل في إعادة فتح الشكوى');
      setConfirmDialog({ isOpen: false, isLoading: false });
    }
  };

  const canReopen = () => {
    if (user.role !== 'trader') return false;
    if (!['resolved', 'rejected'].includes(complaint.status)) return false;
    if (!complaint.can_reopen_until) return false;
    return new Date(complaint.can_reopen_until) > new Date();
  };

  const canProvideFeedback = () => {
    if (user.role !== 'trader') return false;
    if (!['resolved', 'rejected'].includes(complaint.status)) return false;
    return !feedback;
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

  if (loadingComplaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">الشكوى غير موجودة</div>
      </div>
    );
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const content = (
    <div>
      {/* Trader Actions for Resolved/Rejected Complaints */}
      {user.role === 'trader' && ['resolved', 'rejected'].includes(complaint.status) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3 flex-wrap">
            {canProvideFeedback() && (
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                تقديم التقييم
              </button>
            )}
            {canReopen() && (
              <button
                onClick={() => setConfirmDialog({ isOpen: true, isLoading: false })}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                إعادة فتح الشكوى
              </button>
            )}
            {feedback && (
              <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-600">التقييم: <span className="font-bold text-yellow-600">{feedback.rating}/5</span></p>
                {feedback.comment && <p className="text-sm text-gray-700 mt-1">{feedback.comment}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{complaint.title}</h2>
            <p className="text-sm text-gray-600">رقم الشكوى: #{complaint.id}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm ${
            complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
            complaint.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            complaint.status === 'ESCALATED' ? 'bg-yellow-100 text-yellow-800' :
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

          {/* Task Management Actions */}
          {complaint.assigned_to_id === user.id && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-md font-semibold mb-3 text-gray-700">إدارة المهمة</h4>
              <div className="flex gap-3 flex-wrap">
                {complaint.task_status === 'assigned' && (
                  <>
                    <button
                      onClick={handleAcceptTask}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex-1"
                    >
                      قبول المهمة
                    </button>
                    <button
                      onClick={handleRejectTask}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex-1"
                    >
                      رفض المهمة
                    </button>
                  </>
                )}
                {complaint.task_status === 'accepted' && (
                  <button
                    onClick={handleStartWorking}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex-1"
                  >
                    البدء بالعمل
                  </button>
                )}
                {complaint.task_status && (
                  <div className="w-full mt-2">
                    <span className="text-sm text-gray-600">حالة المهمة: </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {complaint.task_status === 'assigned' && 'معينة'}
                      {complaint.task_status === 'accepted' && 'مقبولة'}
                      {complaint.task_status === 'in_progress' && 'قيد التنفيذ'}
                      {complaint.task_status === 'in_queue' && 'في قائمة الانتظار'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <PaperClipIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">المرفقات ({attachments.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <PaperClipIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : 'حجم غير معروف'} • 
                      {' '}{new Date(attachment.uploaded_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">تحميل</span>
                </button>
              </div>
            ))}
          </div>
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
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="أضف تعليقاً..."
            />
            {(user.role === 'technical_committee' || user.role === 'higher_committee') && (
              <button
                onClick={() => setShowQuickReplySelector(true)}
                className="absolute top-2 left-2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                title="استخدام رد سريع"
              >
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
              </button>
            )}
          </div>
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          complaintId={complaint.id}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => {
            setShowFeedbackModal(false);
            loadFeedback();
          }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, isLoading: false })}
        onConfirm={handleReopen}
        title="إعادة فتح الشكوى"
        message="هل أنت متأكد من إعادة فتح هذه الشكوى؟ سيتم إعادة حالتها إلى 'قيد المراجعة'."
        confirmText="إعادة فتح"
        cancelText="إلغاء"
        type="info"
        isLoading={confirmDialog.isLoading}
      />

      {/* Quick Reply Selector */}
      <QuickReplySelector
        isOpen={showQuickReplySelector}
        onClose={() => setShowQuickReplySelector(false)}
        onSelect={(content) => setNewComment(content)}
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <ResponsivePageShell 
      title={`شكوى #${complaint.id}`}
      subtitle={complaint.title}
      maxWidth="6xl"
    >
      {content}
    </ResponsivePageShell>
  );
}

function FeedbackModal({ complaintId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post(`/complaints/${complaintId}/feedback`, formData);
      alert('شكراً لتقييمك!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل في إرسال التقييم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">تقييم الخدمة</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              التقييم (1-5) *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating })}
                  className={`w-12 h-12 rounded-lg border-2 font-bold ${
                    formData.rating === rating
                      ? 'bg-yellow-500 text-white border-yellow-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-yellow-400'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              1 = سيء جداً، 5 = ممتاز
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تعليق (اختياري)
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={4}
              placeholder="شاركنا رأيك حول تجربتك..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComplaintDetail;
