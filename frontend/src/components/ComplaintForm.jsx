import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

function ComplaintForm({ onSuccess }) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const title = watch('title');
  const categoryId = watch('category_id');
  const description = watch('description');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (title && categoryId && title.length > 5) {
      const timeoutId = setTimeout(() => {
        checkForDuplicates();
      }, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setDuplicateWarning(null);
    }
  }, [title, categoryId, description]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const checkForDuplicates = async () => {
    setCheckingDuplicates(true);
    try {
      const response = await api.post('/complaints/check-duplicate', {
        title,
        category_id: parseInt(categoryId),
        description: description || '',
        complaint_summary: ''
      });
      
      if (response.data.has_duplicates) {
        setDuplicateWarning(response.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      await api.post('/complaints', data);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل تقديم الشكوى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {duplicateWarning && duplicateWarning.has_duplicates && (
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
          <p className="font-bold mb-2">{duplicateWarning.message}</p>
          <p className="text-sm mb-2">شكاوى مشابهة:</p>
          <ul className="text-sm space-y-1">
            {duplicateWarning.similar_complaints.map((complaint) => (
              <li key={complaint.id} className="flex justify-between">
                <span>#{complaint.id}: {complaint.title}</span>
                <span className="text-xs">({(complaint.similarity_score * 100).toFixed(0)}% تشابه)</span>
              </li>
            ))}
          </ul>
          <p className="text-sm mt-2">يمكنك المتابعة في التقديم إذا كانت شكواك مختلفة</p>
        </div>
      )}

      {checkingDuplicates && (
        <div className="text-sm text-gray-600">جاري التحقق من الشكاوى المشابهة...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            عنوان الشكوى *
          </label>
          <input
            type="text"
            {...register('title', { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.title && <span className="text-red-500 text-sm">هذا الحقل مطلوب</span>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تصنيف الشكوى *
          </label>
          <select
            {...register('category_id', { required: true, valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر التصنيف</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_ar} - {cat.government_entity}
              </option>
            ))}
          </select>
          {errors.category_id && <span className="text-red-500 text-sm">هذا الحقل مطلوب</span>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تفاصيل الشكوى *
          </label>
          <textarea
            {...register('description', { required: true })}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="ماهي تفاصيل الشكوى؟"
          />
          {errors.description && <span className="text-red-500 text-sm">هذا الحقل مطلوب</span>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملخص النقاط الرئيسية للشكوى *
          </label>
          <textarea
            {...register('complaint_summary', { required: true })}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.complaint_summary && <span className="text-red-500 text-sm">هذا الحقل مطلوب</span>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            هل تشكو نيابة عن *
          </label>
          <select
            {...register('complaining_on_behalf_of', { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر</option>
            <option value="نفسك">نفسك</option>
            <option value="مشروع / مؤسسة">مشروع / مؤسسة</option>
            <option value="شخص آخر">شخص آخر</option>
          </select>
          {errors.complaining_on_behalf_of && <span className="text-red-500 text-sm">هذا الحقل مطلوب</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اسم الشخص/المشروع (إن وجد)
          </label>
          <input
            type="text"
            {...register('behalf_person_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            علاقتك بالشخص (إن وجد)
          </label>
          <input
            type="text"
            {...register('behalf_person_relation')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            متى حدثت المشكلة؟
          </label>
          <input
            type="date"
            {...register('problem_occurred_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            متى علمت بالمشكلة؟
          </label>
          <input
            type="date"
            {...register('problem_discovered_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ما نوع الطلب الذي تقدمت به؟
          </label>
          <input
            type="text"
            {...register('request_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            هل قدمت الجهة عرضاً لحل الشكوى؟
          </label>
          <select
            {...register('entity_offered_solution')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر</option>
            <option value="نعم">نعم</option>
            <option value="لا">لا</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ما الذي سيضع الأمور في نصابها الصحيح من وجهة نظرك؟
          </label>
          <textarea
            {...register('desired_resolution')}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            هل تقدمت بشكوى سابقة؟
          </label>
          <select
            {...register('previous_complaint_filed')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر</option>
            <option value="نعم">نعم</option>
            <option value="لا">لا</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            هل هناك إجراءات قانونية جارية؟
          </label>
          <select
            {...register('legal_proceedings')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر</option>
            <option value="نعم">نعم</option>
            <option value="لا">لا</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'جاري التقديم...' : 'تقديم الشكوى'}
        </button>
      </div>
    </form>
  );
}

export default ComplaintForm;
