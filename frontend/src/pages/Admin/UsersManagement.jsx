import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Header from '../../components/Header';
import { ConfirmDialog } from '../../components/ui';
import api from '../../api/axios';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({ role: '', is_active: '', search: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, userId: null, isLoading: false });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true';
      if (filters.search) params.search = filters.search;
      
      const response = await api.get('/admin/users', { params });
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await api.post('/admin/users', userData);
      setShowCreateModal(false);
      loadUsers();
      toast.success('تم إنشاء المستخدم بنجاح');
    } catch (error) {
      const message = error.response?.data?.detail || 'فشل في إنشاء المستخدم';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message));
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await api.patch(`/admin/users/${userId}`, userData);
      setEditingUser(null);
      loadUsers();
      toast.success('تم تحديث المستخدم بنجاح');
    } catch (error) {
      const message = error.response?.data?.detail || 'فشل في تحديث المستخدم';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message));
    }
  };

  const handleDeactivateUser = async () => {
    setConfirmDialog({ ...confirmDialog, isLoading: true });
    
    try {
      await api.delete(`/admin/users/${confirmDialog.userId}`);
      loadUsers();
      toast.success('تم تعطيل المستخدم بنجاح');
      setConfirmDialog({ isOpen: false, userId: null, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.detail || 'فشل في تعطيل المستخدم';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message));
      setConfirmDialog({ isOpen: false, userId: null, isLoading: false });
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = window.prompt('أدخل كلمة المرور الجديدة (6 أحرف على الأقل):');
    if (!newPassword || newPassword.length < 6) {
      toast.warning('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      await api.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
      toast.success('تم إعادة تعيين كلمة المرور بنجاح');
    } catch (error) {
      const message = error.response?.data?.detail || 'فشل في إعادة تعيين كلمة المرور';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message));
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'trader': return 'تاجر';
      case 'technical_committee': return 'اللجنة الفنية';
      case 'higher_committee': return 'اللجنة العليا';
      default: return role;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                إدارة المستخدمين
              </h1>
              <p className="text-gray-600 dark:text-gray-400">إدارة وتحديث بيانات المستخدمين في النظام</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <span className="text-xl">+</span>
              <span>إضافة مستخدم جديد</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تصفية البحث</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">بحث</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="الاسم أو البريد الإلكتروني"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الدور</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="">الكل</option>
                  <option value="trader">تاجر</option>
                  <option value="technical_committee">اللجنة الفنية</option>
                  <option value="higher_committee">اللجنة العليا</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الحالة</label>
                <select
                  value={filters.is_active}
                  onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="">الكل</option>
                  <option value="true">نشط</option>
                  <option value="false">معطل</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadUsers}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  🔄 تحديث
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">جاري التحميل...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الاسم</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">البريد الإلكتروني</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الدور</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الهاتف</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user, index) => (
                      <tr key={user.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all transform hover:scale-[1.01]">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md">
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{user.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                            user.is_active 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          }`}>
                            {user.is_active ? '✓ نشط' : '✗ معطل'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold transition-all transform hover:scale-110"
                            >
                              ✏️ تعديل
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-semibold transition-all transform hover:scale-110"
                            >
                              🔑 إعادة كلمة المرور
                            </button>
                            {user.is_active && (
                              <button
                                onClick={() => setConfirmDialog({ isOpen: true, userId: user.id, isLoading: false })}
                                className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition-all transform hover:scale-110"
                              >
                                🚫 تعطيل
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <UserFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          title="إضافة مستخدم جديد"
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserFormModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={(data) => handleUpdateUser(editingUser.id, data)}
          title="تعديل المستخدم"
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, userId: null, isLoading: false })}
        onConfirm={handleDeactivateUser}
        title="تعطيل المستخدم"
        message="هل أنت متأكد من تعطيل هذا المستخدم؟ لن يتمكن من تسجيل الدخول بعد تعطيله."
        confirmText="تعطيل"
        cancelText="إلغاء"
        type="danger"
        isLoading={confirmDialog.isLoading}
      />
    </div>
    </>
  );
}

function UserFormModal({ user, onClose, onSubmit, title }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'trader',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    telegram: user?.telegram || '',
    address: user?.address || '',
    is_active: user?.is_active !== false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData };
      if (user) {
        delete submitData.email;
        delete submitData.password;
      }
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-scale-in">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!user}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            {!user && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">كلمة المرور *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!user}
                  minLength={6}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الاسم الأول *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الاسم الأخير *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الدور *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="trader">تاجر</option>
                <option value="technical_committee">اللجنة الفنية</option>
                <option value="higher_committee">اللجنة العليا</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">واتساب</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">تليجرام</label>
              <input
                type="text"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            {user && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">نشط</span>
                </label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? '⏳ جاري الحفظ...' : '💾 حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UsersManagement;
