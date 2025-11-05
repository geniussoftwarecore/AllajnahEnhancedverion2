import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ResponsivePageShell, ConfirmDialog, CTAButton, LoadingFallback } from '../../components/ui';
import { Edit2, Trash2, Plus, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-3 font-semibold transition-all duration-300
        ${active 
          ? 'text-primary-600 dark:text-primary-400' 
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }
        hover:bg-gradient-to-b hover:from-gray-50/50 hover:to-transparent
        dark:hover:from-gray-700/30 dark:hover:to-transparent
      `}
    >
      {children}
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-full shadow-glow-green"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <ResponsivePageShell 
      title="الإعدادات"
      subtitle="إدارة إعدادات النظام والتصنيفات"
    >
      <div className="space-y-6">
        <div className="card-glass-strong overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-200/50 dark:border-gray-700/50">
              <TabButton
                active={activeTab === 'categories'}
                onClick={() => setActiveTab('categories')}
              >
                التصنيفات
              </TabButton>
              <TabButton
                active={activeTab === 'sla'}
                onClick={() => setActiveTab('sla')}
              >
                إعدادات SLA
              </TabButton>
              <TabButton
                active={activeTab === 'payment-methods'}
                onClick={() => setActiveTab('payment-methods')}
              >
                طرق الدفع
              </TabButton>
              <TabButton
                active={activeTab === 'system'}
                onClick={() => setActiveTab('system')}
              >
                إعدادات النظام
              </TabButton>
            </div>
          </div>

        <div className="card-premium p-6 sm:p-8">
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'sla' && <SLATab />}
          {activeTab === 'payment-methods' && <PaymentMethodsTab />}
          {activeTab === 'system' && <SystemSettingsTab />}
        </div>
      </div>
    </ResponsivePageShell>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, isLoading: false });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('فشل في تحميل التصنيفات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/categories', data);
      setShowCreate(false);
      loadCategories();
      toast.success('تم إضافة التصنيف بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إضافة التصنيف');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await api.patch(`/categories/${id}`, data);
      setEditing(null);
      loadCategories();
      toast.success('تم تحديث التصنيف بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في تحديث التصنيف');
    }
  };

  const handleDelete = async () => {
    setConfirmDialog({ ...confirmDialog, isLoading: true });
    
    try {
      await api.delete(`/categories/${confirmDialog.id}`);
      loadCategories();
      toast.success('تم حذف التصنيف بنجاح');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف التصنيف');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    }
  };

  if (loading) return <LoadingFallback message="جاري تحميل التصنيفات..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-title font-bold text-gray-900 dark:text-white">التصنيفات</h2>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">إدارة تصنيفات الشكاوى والجهات الحكومية</p>
        </div>
        <CTAButton
          onClick={() => setShowCreate(true)}
          variant="primary"
          size="md"
          icon={Plus}
        >
          إضافة تصنيف
        </CTAButton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
          <thead>
            <tr className="bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50">
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الاسم (عربي)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الاسم (إنجليزي)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الجهة الحكومية</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
            {categories.map((cat) => (
              <motion.tr 
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{cat.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">{cat.name_ar}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{cat.name_en}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{cat.government_entity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(cat)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 font-medium"
                      aria-label="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => setConfirmDialog({ isOpen: true, id: cat.id, isLoading: false })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 font-medium"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showCreate || editing) && (
        <CategoryFormModal
          category={editing}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSubmit={(data) => editing ? handleUpdate(editing.id, data) : handleCreate(data)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, isLoading: false })}
        onConfirm={handleDelete}
        title="حذف التصنيف"
        message="هل أنت متأكد من حذف هذا التصنيف؟ قد يؤثر هذا على الشكاوى المرتبطة بهذا التصنيف."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}

function CategoryFormModal({ category, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name_ar: category?.name_ar || '',
    name_en: category?.name_en || '',
    government_entity: category?.government_entity || '',
    description_ar: category?.description_ar || '',
    description_en: category?.description_en || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
            <h2 className="text-heading font-bold text-gray-900 dark:text-white">
              {category ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
            </h2>
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
                  الاسم (عربي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="أدخل الاسم بالعربية"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الاسم (إنجليزي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter English name"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الجهة الحكومية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.government_entity}
                  onChange={(e) => setFormData({ ...formData, government_entity: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="أدخل اسم الجهة الحكومية"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الوصف (عربي)</label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="أدخل الوصف بالعربية (اختياري)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الوصف (إنجليزي)</label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter English description (optional)"
                />
              </div>
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
              >
                حفظ
              </CTAButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SLATab() {
  const [configs, setConfigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, isLoading: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configsRes, categoriesRes] = await Promise.all([
        api.get('/admin/sla-configs'),
        api.get('/categories')
      ]);
      setConfigs(configsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading SLA configs:', error);
      toast.error('فشل في تحميل إعدادات SLA');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/admin/sla-configs', data);
      setShowCreate(false);
      loadData();
      toast.success('تم إضافة إعداد SLA بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إضافة إعداد SLA');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await api.patch(`/admin/sla-configs/${id}`, data);
      setEditing(null);
      loadData();
      toast.success('تم تحديث إعداد SLA بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في تحديث إعداد SLA');
    }
  };

  const handleDelete = async () => {
    setConfirmDialog({ ...confirmDialog, isLoading: true });
    
    try {
      await api.delete(`/admin/sla-configs/${confirmDialog.id}`);
      loadData();
      toast.success('تم حذف الإعداد بنجاح');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف الإعداد');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name_ar : '-';
  };

  if (loading) return <LoadingFallback message="جاري تحميل إعدادات SLA..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-title font-bold text-gray-900 dark:text-white">إعدادات SLA</h2>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">إدارة أوقات الاستجابة والحل للشكاوى</p>
        </div>
        <CTAButton
          onClick={() => setShowCreate(true)}
          variant="primary"
          size="md"
          icon={Plus}
        >
          إضافة إعداد SLA
        </CTAButton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
          <thead>
            <tr className="bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50">
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التصنيف</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الأولوية</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">وقت الرد (ساعة)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">وقت الحل (ساعة)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">وقت التصعيد (ساعة)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
            {configs.map((config) => (
              <motion.tr 
                key={config.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{config.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {config.category_id ? getCategoryName(config.category_id) : 'الكل'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{config.priority || 'الكل'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{config.response_time_hours}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{config.resolution_time_hours}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{config.escalation_time_hours}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(config)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 font-medium"
                      aria-label="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => setConfirmDialog({ isOpen: true, id: config.id, isLoading: false })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 font-medium"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showCreate || editing) && (
        <SLAFormModal
          config={editing}
          categories={categories}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSubmit={(data) => editing ? handleUpdate(editing.id, data) : handleCreate(data)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, isLoading: false })}
        onConfirm={handleDelete}
        title="حذف إعداد SLA"
        message="هل أنت متأكد من حذف هذا الإعداد؟ سيؤدي هذا إلى إزالة قواعد وقت الاستجابة المحددة."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}

function SLAFormModal({ config, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    category_id: config?.category_id || null,
    priority: config?.priority || null,
    response_time_hours: config?.response_time_hours || 24,
    resolution_time_hours: config?.resolution_time_hours || 72,
    escalation_time_hours: config?.escalation_time_hours || 48
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.category_id) submitData.category_id = null;
    if (!submitData.priority) submitData.priority = null;
    onSubmit(submitData);
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
            <h2 className="text-heading font-bold text-gray-900 dark:text-white">
              {config ? 'تعديل إعداد SLA' : 'إضافة إعداد SLA جديد'}
            </h2>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">التصنيف</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">الكل</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الأولوية</label>
                <select
                  value={formData.priority || ''}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value || null })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">الكل</option>
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  وقت الرد (ساعة) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.response_time_hours}
                  onChange={(e) => setFormData({ ...formData, response_time_hours: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="24"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  وقت الحل (ساعة) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.resolution_time_hours}
                  onChange={(e) => setFormData({ ...formData, resolution_time_hours: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="72"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  وقت التصعيد (ساعة) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.escalation_time_hours}
                  onChange={(e) => setFormData({ ...formData, escalation_time_hours: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="48"
                />
              </div>
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
              >
                حفظ
              </CTAButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function PaymentMethodsTab() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, isLoading: false });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const response = await api.get('/admin/payment-methods');
      setMethods(response.data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('فشل في تحميل طرق الدفع');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/admin/payment-methods', data);
      setShowCreate(false);
      loadMethods();
      toast.success('تم إضافة طريقة الدفع بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إضافة طريقة الدفع');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await api.patch(`/admin/payment-methods/${id}`, data);
      setEditing(null);
      loadMethods();
      toast.success('تم تحديث طريقة الدفع بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في تحديث طريقة الدفع');
    }
  };

  const handleDelete = async () => {
    setConfirmDialog({ ...confirmDialog, isLoading: true });
    
    try {
      await api.delete(`/admin/payment-methods/${confirmDialog.id}`);
      loadMethods();
      toast.success('تم حذف طريقة الدفع بنجاح');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف طريقة الدفع');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    }
  };

  if (loading) return <LoadingFallback message="جاري تحميل طرق الدفع..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-title font-bold text-gray-900 dark:text-white">طرق الدفع</h2>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">إدارة طرق الدفع المتاحة للاشتراكات</p>
        </div>
        <CTAButton
          onClick={() => setShowCreate(true)}
          variant="primary"
          size="md"
          icon={Plus}
        >
          إضافة طريقة دفع
        </CTAButton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
          <thead>
            <tr className="bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50">
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الاسم (عربي)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الاسم (إنجليزي)</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التعليمات</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
            {methods.map((method) => (
              <motion.tr 
                key={method.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{method.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">{method.name_ar}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{method.name_en}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {method.instructions_ar 
                    ? (method.instructions_ar.length > 50 ? `${method.instructions_ar.substring(0, 50)}...` : method.instructions_ar)
                    : '-'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    method.is_active 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {method.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(method)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 font-medium"
                      aria-label="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => setConfirmDialog({ isOpen: true, id: method.id, isLoading: false })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 font-medium"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showCreate || editing) && (
        <PaymentMethodFormModal
          method={editing}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSubmit={(data) => editing ? handleUpdate(editing.id, data) : handleCreate(data)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, isLoading: false })}
        onConfirm={handleDelete}
        title="حذف طريقة الدفع"
        message="هل أنت متأكد من حذف طريقة الدفع هذه؟ لن يتمكن المستخدمون من استخدامها بعد الحذف."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}

function PaymentMethodFormModal({ method, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name_ar: method?.name_ar || '',
    name_en: method?.name_en || '',
    instructions_ar: method?.instructions_ar || '',
    instructions_en: method?.instructions_en || '',
    is_active: method?.is_active !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
            <h2 className="text-heading font-bold text-gray-900 dark:text-white">
              {method ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
            </h2>
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
                  الاسم (عربي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="أدخل اسم طريقة الدفع بالعربية"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الاسم (إنجليزي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter payment method name in English"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">التعليمات (عربي)</label>
                <textarea
                  value={formData.instructions_ar}
                  onChange={(e) => setFormData({ ...formData, instructions_ar: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="أدخل تعليمات الدفع بالعربية (اختياري)"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">التعليمات (إنجليزي)</label>
                <textarea
                  value={formData.instructions_en}
                  onChange={(e) => setFormData({ ...formData, instructions_en: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter payment instructions in English (optional)"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    تفعيل طريقة الدفع (متاحة للمستخدمين)
                  </span>
                </label>
              </div>
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
              >
                حفظ
              </CTAButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SystemSettingsTab() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, isLoading: false });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/admin/settings', data);
      setShowCreate(false);
      loadSettings();
      toast.success('تم إضافة الإعداد بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إضافة الإعداد');
    }
  };

  const handleUpdate = async (key, data) => {
    try {
      await api.patch(`/admin/settings/${key}`, data);
      setEditing(null);
      loadSettings();
      toast.success('تم تحديث الإعداد بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في تحديث الإعداد');
    }
  };

  const handleDelete = async () => {
    setConfirmDialog({ ...confirmDialog, isLoading: true });
    
    try {
      await api.delete(`/admin/settings/${confirmDialog.id}`);
      loadSettings();
      toast.success('تم حذف الإعداد بنجاح');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف الإعداد');
      setConfirmDialog({ isOpen: false, id: null, isLoading: false });
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">إعدادات النظام</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + إضافة إعداد
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المفتاح</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">القيمة</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {settings.map((setting) => (
            <tr key={setting.setting_key}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{setting.setting_key}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{setting.setting_value}</td>
              <td className="px-6 py-4 text-sm">{setting.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => setEditing(setting)}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  تعديل
                </button>
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, id: setting.setting_key, isLoading: false })}
                  className="text-red-600 hover:text-red-800"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(showCreate || editing) && (
        <SettingFormModal
          setting={editing}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSubmit={(data) => editing ? handleUpdate(editing.setting_key, data) : handleCreate(data)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, isLoading: false })}
        onConfirm={handleDelete}
        title="حذف الإعداد"
        message="هل أنت متأكد من حذف هذا الإعداد من النظام؟ قد يؤثر هذا على سلوك التطبيق."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}

function SettingFormModal({ setting, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    setting_key: setting?.setting_key || '',
    setting_value: setting?.setting_value || '',
    description: setting?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6">
          {setting ? 'تعديل الإعداد' : 'إضافة إعداد جديد'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المفتاح *</label>
            <input
              type="text"
              value={formData.setting_key}
              onChange={(e) => setFormData({ ...formData, setting_key: e.target.value })}
              required
              disabled={!!setting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">القيمة *</label>
            <input
              type="text"
              value={formData.setting_value}
              onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              إلغاء
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
