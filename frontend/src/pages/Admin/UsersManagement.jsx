import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsivePageShell, ConfirmDialog, CTAButton, LoadingFallback, AdminNavMenu } from '../../components/ui';
import { Plus, Edit2, Trash2, Key, X, Save, RefreshCcw } from 'lucide-react';
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
      case 'TRADER': return 'تاجر';
      case 'TECHNICAL_COMMITTEE': return 'اللجنة الفنية';
      case 'HIGHER_COMMITTEE': return 'اللجنة العليا';
      default: return role;
    }
  };

  if (loading) return <LoadingFallback message="جاري تحميل المستخدمين..." />;

  return (
    <ResponsivePageShell 
      title="إدارة المستخدمين"
      subtitle="إدارة وتحديث بيانات المستخدمين في النظام"
    >
      <div className="space-y-6">
        <AdminNavMenu />
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <CTAButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="md"
            icon={Plus}
          >
            إضافة مستخدم جديد
          </CTAButton>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass-strong overflow-hidden shadow-xl p-6 border border-primary-100 dark:border-primary-900/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <RefreshCcw className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تصفية البحث</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">بحث</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="الاسم أو البريد الإلكتروني"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الدور</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">الكل</option>
                <option value="TRADER">تاجر</option>
                <option value="TECHNICAL_COMMITTEE">اللجنة الفنية</option>
                <option value="HIGHER_COMMITTEE">اللجنة العليا</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الحالة</label>
              <select
                value={filters.is_active}
                onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">الكل</option>
                <option value="true">نشط</option>
                <option value="false">معطل</option>
              </select>
            </div>
            <div className="flex items-end">
              <CTAButton
                onClick={loadUsers}
                variant="secondary"
                size="md"
                icon={RefreshCcw}
                className="w-full"
              >
                تحديث
              </CTAButton>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-x-auto rounded-xl border-2 border-gray-200/80 dark:border-gray-700/80 shadow-xl"
        >
          <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
            <thead>
              <tr className="bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700">
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الدور</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الهاتف</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
              {users.map((user, index) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400">
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      user.is_active 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                      {user.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 font-medium"
                        aria-label="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200 font-medium"
                        aria-label="إعادة كلمة المرور"
                      >
                        <Key className="w-4 h-4" />
                        <span>كلمة المرور</span>
                      </button>
                      {user.is_active && (
                        <button
                          onClick={() => setConfirmDialog({ isOpen: true, userId: user.id, isLoading: false })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 font-medium"
                          aria-label="تعطيل"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>تعطيل</span>
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

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
      </ResponsivePageShell>
  );
}

function UserFormModal({ user, onClose, onSubmit, title }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'TRADER',
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
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="card-premium p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading font-bold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!user}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-100 dark:disabled:bg-gray-700"
                />
              </div>
              {!user && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!user}
                    minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الاسم الأول <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الاسم الأخير <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الدور <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="TRADER">تاجر</option>
                  <option value="TECHNICAL_COMMITTEE">اللجنة الفنية</option>
                  <option value="HIGHER_COMMITTEE">اللجنة العليا</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">واتساب</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">تليجرام</label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              {user && (
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">نشط</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <CTAButton
                type="button"
                onClick={onClose}
                variant="ghost"
                size="md"
                icon={X}
              >
                إلغاء
              </CTAButton>
              <CTAButton
                type="submit"
                variant="primary"
                size="md"
                icon={Save}
                disabled={loading}
              >
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </CTAButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UsersManagement;
