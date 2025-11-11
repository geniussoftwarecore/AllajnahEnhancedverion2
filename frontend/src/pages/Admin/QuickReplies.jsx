import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { ResponsivePageShell, ConfirmDialog, AdminNavMenu } from '../../components/ui';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuickReplies } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

function QuickReplies() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, isLoading: false });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });

  const { data: quickReplies = [], isLoading: loading } = useQuickReplies();
  const categories = useMemo(() => 
    [...new Set(quickReplies.map(r => r.category).filter(Boolean))],
    [quickReplies]
  );

  const handleCreate = () => {
    setEditingReply(null);
    setFormData({ title: '', content: '', category: '' });
    setShowModal(true);
  };

  const handleEdit = (reply) => {
    setEditingReply(reply);
    setFormData({
      title: reply.title,
      content: reply.content,
      category: reply.category || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      if (editingReply) {
        await api.put(`/quick-replies/${editingReply.id}`, formData);
        toast.success('تم تحديث الرد السريع بنجاح');
      } else {
        await api.post('/quick-replies', formData);
        toast.success('تم إضافة الرد السريع بنجاح');
      }
      
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['quickReplies'] });
    } catch (error) {
      console.error('Error saving quick reply:', error);
      toast.error(error.response?.data?.detail || 'فشل في حفظ الرد السريع');
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({ isOpen: true, id, isLoading: false });
  };

  const confirmDelete = async () => {
    setConfirmDialog({ ...confirmDialog, isLoading: true });
    
    try {
      await api.delete(`/quick-replies/${confirmDialog.id}`);
      toast.success('تم حذف الرد السريع بنجاح');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
      queryClient.invalidateQueries({ queryKey: ['quickReplies'] });
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      toast.error('فشل في حذف الرد السريع');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    }
  };

  const filteredReplies = selectedCategory
    ? quickReplies.filter(r => r.category === selectedCategory)
    : quickReplies;

  return (
    <ResponsivePageShell
      title="الردود السريعة"
      subtitle="إدارة الردود السريعة للجنة"
    >
      <div className="space-y-6">
        <AdminNavMenu />

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">قائمة الردود السريعة</h2>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              إضافة رد سريع
            </button>
          </div>

          {categories.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تصفية حسب الفئة:
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  الكل ({quickReplies.length})
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category} ({quickReplies.filter(r => r.category === category).length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">جاري التحميل...</div>
            </div>
          ) : filteredReplies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">لا توجد ردود سريعة</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReplies.map((reply) => (
                <div
                  key={reply.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{reply.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(reply)}
                        className="text-blue-600 hover:text-blue-800"
                        title="تعديل"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(reply.id)}
                        className="text-red-600 hover:text-red-800"
                        title="حذف"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {reply.category && (
                    <span className="inline-block mb-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {reply.category}
                    </span>
                  )}
                  
                  <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                    {reply.content}
                  </p>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    أنشأه: {reply.created_by?.first_name} {reply.created_by?.last_name}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {new Date(reply.created_at).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingReply ? 'تعديل رد سريع' : 'إضافة رد سريع جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الرد السريع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: رد قياسي للشكاوى المحلولة"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفئة (اختياري)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: شكاوى الجمارك، شكاوى الضرائب"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  محتوى الرد <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="8"
                  placeholder="اكتب محتوى الرد السريع هنا..."
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  عدد الأحرف: {formData.content.length}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editingReply ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, isLoading: false })}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا الرد السريع؟ لن يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={confirmDialog.isLoading}
      />
    </ResponsivePageShell>
  );
}

export default QuickReplies;
