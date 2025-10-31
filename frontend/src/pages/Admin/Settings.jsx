import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

function Settings() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">الإعدادات</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'categories'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            التصنيفات
          </button>
          <button
            onClick={() => setActiveTab('sla')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'sla'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            إعدادات SLA
          </button>
          <button
            onClick={() => setActiveTab('payment-methods')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'payment-methods'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            طرق الدفع
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'system'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            إعدادات النظام
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'sla' && <SLATab />}
        {activeTab === 'payment-methods' && <PaymentMethodsTab />}
        {activeTab === 'system' && <SystemSettingsTab />}
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

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

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    
    try {
      await api.delete(`/categories/${id}`);
      loadCategories();
      toast.success('تم حذف التصنيف بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف التصنيف');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">التصنيفات</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + إضافة تصنيف
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم (عربي)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم (إنجليزي)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجهة الحكومية</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{cat.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{cat.name_ar}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{cat.name_en}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{cat.government_entity}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => setEditing(cat)}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
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
        <CategoryFormModal
          category={editing}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSubmit={(data) => editing ? handleUpdate(editing.id, data) : handleCreate(data)}
        />
      )}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6">
          {category ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (عربي) *</label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (إنجليزي) *</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">الجهة الحكومية *</label>
              <input
                type="text"
                value={formData.government_entity}
                onChange={(e) => setFormData({ ...formData, government_entity: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (عربي)</label>
              <textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (إنجليزي)</label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
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

function SLATab() {
  const [configs, setConfigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

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

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعداد؟')) return;
    
    try {
      await api.delete(`/admin/sla-configs/${id}`);
      loadData();
      toast.success('تم حذف الإعداد بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف الإعداد');
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name_ar : '-';
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">إعدادات SLA</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + إضافة إعداد SLA
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التصنيف</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأولوية</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وقت الرد (ساعة)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وقت الحل (ساعة)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وقت التصعيد (ساعة)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {configs.map((config) => (
            <tr key={config.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{config.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {config.category_id ? getCategoryName(config.category_id) : 'الكل'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{config.priority || 'الكل'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{config.response_time_hours}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{config.resolution_time_hours}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{config.escalation_time_hours}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => setEditing(config)}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6">
          {config ? 'تعديل إعداد SLA' : 'إضافة إعداد SLA جديد'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">الكل</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
              <select
                value={formData.priority || ''}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">الكل</option>
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وقت الرد (ساعة) *</label>
              <input
                type="number"
                value={formData.response_time_hours}
                onChange={(e) => setFormData({ ...formData, response_time_hours: parseInt(e.target.value) })}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وقت الحل (ساعة) *</label>
              <input
                type="number"
                value={formData.resolution_time_hours}
                onChange={(e) => setFormData({ ...formData, resolution_time_hours: parseInt(e.target.value) })}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">وقت التصعيد (ساعة) *</label>
              <input
                type="number"
                value={formData.escalation_time_hours}
                onChange={(e) => setFormData({ ...formData, escalation_time_hours: parseInt(e.target.value) })}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
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

function PaymentMethodsTab() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

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

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف طريقة الدفع؟')) return;
    
    try {
      await api.delete(`/admin/payment-methods/${id}`);
      loadMethods();
      toast.success('تم حذف طريقة الدفع بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف طريقة الدفع');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">طرق الدفع</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + إضافة طريقة دفع
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم (عربي)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم (إنجليزي)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التعليمات</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {methods.map((method) => (
            <tr key={method.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{method.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{method.name_ar}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{method.name_en}</td>
              <td className="px-6 py-4 text-sm">{method.instructions_ar?.substring(0, 50)}...</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  method.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {method.is_active ? 'نشط' : 'معطل'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => setEditing(method)}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(method.id)}
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
        <PaymentMethodFormModal
          method={editing}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSubmit={(data) => editing ? handleUpdate(editing.id, data) : handleCreate(data)}
        />
      )}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {method ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (عربي) *</label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (إنجليزي) *</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">التعليمات (عربي)</label>
              <textarea
                value={formData.instructions_ar}
                onChange={(e) => setFormData({ ...formData, instructions_ar: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">التعليمات (إنجليزي)</label>
              <textarea
                value={formData.instructions_en}
                onChange={(e) => setFormData({ ...formData, instructions_en: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">نشط</span>
              </label>
            </div>
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

function SystemSettingsTab() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

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

  const handleDelete = async (key) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعداد؟')) return;
    
    try {
      await api.delete(`/admin/settings/${key}`);
      loadSettings();
      toast.success('تم حذف الإعداد بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف الإعداد');
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
                  onClick={() => handleDelete(setting.setting_key)}
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
