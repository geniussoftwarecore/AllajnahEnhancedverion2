import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentTextIcon, 
  BuildingOfficeIcon,
  InformationCircleIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ResponsivePageShell } from './ui';
import api from '../api/axios';

function ComplaintForm({ onSuccess }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger, getValues } = useForm({
    mode: 'onBlur'
  });
  const [governmentEntities, setGovernmentEntities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [createdComplaintId, setCreatedComplaintId] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);

  const title = watch('title');
  const categoryId = watch('category_id');
  const description = watch('description');
  const selectedEntity = watch('government_entity');

  const steps = [
    { id: 1, name: 'معلومات الشكوى', icon: DocumentTextIcon, description: 'العنوان والتفاصيل' },
    { id: 2, name: 'الجهة والتصنيف', icon: BuildingOfficeIcon, description: 'اختيار الجهة المعنية' },
    { id: 3, name: 'معلومات إضافية', icon: InformationCircleIcon, description: 'تفاصيل المشكلة' },
    { id: 4, name: 'المعلومات الشخصية', icon: UserIcon, description: 'بيانات مقدم الشكوى' },
  ];

  const stepFields = {
    1: ['title', 'description', 'complaint_summary'],
    2: ['government_entity', 'category_id'],
    3: [],
    4: ['complaining_on_behalf_of'],
  };

  const validateStep = async (step) => {
    const fieldsToValidate = stepFields[step];
    if (fieldsToValidate.length === 0) return true;
    
    const result = await trigger(fieldsToValidate);
    return result;
  };

  const getFirstStepWithErrors = () => {
    for (let i = 1; i <= 4; i++) {
      const fields = stepFields[i];
      if (fields.some(field => errors[field])) {
        return i;
      }
    }
    return currentStep;
  };

  const handleNextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(currentStep + 1);
      setError('');
    } else {
      setError('يرجى إكمال جميع الحقول المطلوبة قبل المتابعة');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    loadGovernmentEntities();
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedEntity) {
      const filtered = categories.filter(cat => cat.government_entity === selectedEntity);
      setFilteredCategories(filtered);
      setValue('category_id', '');
    } else {
      setFilteredCategories([]);
    }
  }, [selectedEntity, categories]);

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

  const loadGovernmentEntities = async () => {
    try {
      const response = await api.get('/government-entities');
      setGovernmentEntities(response.data);
    } catch (error) {
      console.error('Error loading government entities:', error);
    }
  };

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

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleFileRemove = (index) => {
    const fileToRemove = selectedFiles[index];
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setFailedFiles(prevFailed => prevFailed.filter(f => f !== fileToRemove));
    setUploadErrors(prevErrors => prevErrors.filter(err => err.name !== fileToRemove.name));
  };

  const uploadFiles = async (complaintId, filesToUpload) => {
    if (filesToUpload.length === 0) return { success: true, failedFiles: [], failedFileObjects: [] };

    setUploadingFiles(true);
    const failedFilesList = [];
    const failedFileObjects = [];
    
    try {
      for (const file of filesToUpload) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          await api.post(`/complaints/${complaintId}/attachments`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (fileErr) {
          console.error(`Error uploading file ${file.name}:`, fileErr);
          failedFilesList.push({ name: file.name, error: fileErr.response?.data?.detail || 'فشل الرفع' });
          failedFileObjects.push(file);
        }
      }
    } finally {
      setUploadingFiles(false);
    }

    return {
      success: failedFilesList.length === 0,
      failedFiles: failedFilesList,
      failedFileObjects,
      uploadedCount: filesToUpload.length - failedFilesList.length
    };
  };

  const retryFailedUploads = async () => {
    if (!createdComplaintId || failedFiles.length === 0) return;
    
    setLoading(true);
    setUploadErrors([]);
    
    const uploadResult = await uploadFiles(createdComplaintId, failedFiles);
    
    if (uploadResult.success) {
      setFailedFiles([]);
      setUploadErrors([]);
      setError('');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/complaints');
      }
    } else {
      setFailedFiles(uploadResult.failedFileObjects);
      setUploadErrors(uploadResult.failedFiles);
      setError(
        `لا تزال هناك ${uploadResult.failedFiles.length} ملف(ات) فشل رفعها من أصل ${failedFiles.length}.`
      );
    }
    
    setLoading(false);
  };

  const proceedWithoutFiles = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/complaints');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setUploadErrors([]);
    setCreatedComplaintId(null);
    setFailedFiles([]);

    try {
      const response = await api.post('/complaints', data);
      const complaintId = response.data.id;
      setCreatedComplaintId(complaintId);
      
      if (selectedFiles.length > 0) {
        const uploadResult = await uploadFiles(complaintId, selectedFiles);
        
        if (!uploadResult.success) {
          setFailedFiles(uploadResult.failedFileObjects);
          setUploadErrors(uploadResult.failedFiles);
          setError(
            `تم تقديم الشكوى بنجاح (رقم ${complaintId}) ولكن فشل رفع ${uploadResult.failedFiles.length} من ${selectedFiles.length} ملف(ات).`
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setLoading(false);
          return;
        }
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/complaints');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل تقديم الشكوى');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitError = (errors) => {
    const firstErrorStep = getFirstStepWithErrors();
    setCurrentStep(firstErrorStep);
    setError('يرجى إكمال جميع الحقول المطلوبة في جميع الخطوات');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStepIndicator = () => (
    <div className="mb-8 md:mb-12">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10 flex-1">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-2 md:mb-3 transition-all duration-500 shadow-lg
                  ${currentStep === step.id 
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white scale-110 shadow-glow-green' 
                    : currentStep > step.id
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                  }
                `}
              >
                {currentStep > step.id ? (
                  <CheckCircleIcon className="w-6 h-6 md:w-8 md:h-8" />
                ) : (
                  <step.icon className="w-5 h-5 md:w-7 md:h-7" />
                )}
              </motion.div>
              <div className="text-center hidden md:block">
                <p className={`font-bold text-sm ${currentStep === step.id ? 'text-primary-600' : currentStep > step.id ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              </div>
              <div className="text-center md:hidden">
                <p className={`font-semibold text-xs ${currentStep === step.id ? 'text-primary-600' : currentStep > step.id ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.id}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-gray-200 mx-2 md:mx-4 relative" style={{top: '-20px'}}>
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                  initial={{ width: '0%' }}
                  animate={{ width: currentStep > step.id ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <DocumentTextIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">معلومات الشكوى الأساسية</h3>
            <p className="text-sm text-gray-600 mt-1">ابدأ بكتابة عنوان ووصف واضح لشكواك</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          عنوان الشكوى <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            {...register('title', { required: 'عنوان الشكوى مطلوب' })}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-lg font-medium placeholder:text-gray-400 hover:border-gray-300"
            placeholder="مثال: تأخير في إصدار الرخصة التجارية"
          />
          {errors.title && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-2 flex items-center gap-1"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              {errors.title.message}
            </motion.p>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5">
          <SparklesIcon className="w-4 h-4 mt-0.5 text-primary-500" />
          <span>اكتب عنواناً واضحاً ومختصراً يصف مشكلتك بدقة</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          تفاصيل الشكوى <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('description', { required: 'تفاصيل الشكوى مطلوبة' })}
          rows="6"
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 font-medium placeholder:text-gray-400 hover:border-gray-300 resize-none"
          placeholder="مثال: قدمت طلباً للرخصة في تاريخ 2024/01/15 ولم يتم الرد حتى الآن رغم انقضاء 45 يوماً على الطلب..."
        />
        {errors.description && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center gap-1"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            {errors.description.message}
          </motion.p>
        )}
        <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5">
          <InformationCircleIcon className="w-4 h-4 mt-0.5 text-primary-500" />
          <span>اشرح المشكلة بالتفصيل مع ذكر التواريخ والأطراف المعنية</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          ملخص النقاط الرئيسية للشكوى <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('complaint_summary', { required: 'ملخص الشكوى مطلوب' })}
          rows="4"
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 font-medium placeholder:text-gray-400 hover:border-gray-300 resize-none"
          placeholder="مثال: 1) تقديم الطلب في 15/01/2024 2) عدم الرد لمدة 45 يوماً 3) عدم الالتزام بالمدة القانونية"
        />
        {errors.complaint_summary && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center gap-1"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            {errors.complaint_summary.message}
          </motion.p>
        )}
        <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5">
          <DocumentTextIcon className="w-4 h-4 mt-0.5 text-primary-500" />
          <span>لخص أهم النقاط في شكل نقاط مختصرة ومرقمة</span>
        </p>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BuildingOfficeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">الجهة الحكومية والتصنيف</h3>
            <p className="text-sm text-gray-600 mt-1">حدد الجهة المعنية ونوع الشكوى</p>
          </div>
        </div>
      </div>

      {duplicateWarning && duplicateWarning.has_duplicates && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 text-yellow-900 px-6 py-4 rounded-xl shadow-lg"
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-lg mb-2">{duplicateWarning.message}</p>
              <p className="text-sm mb-3">شكاوى مشابهة:</p>
              <ul className="text-sm space-y-2 bg-white/50 rounded-lg p-3">
                {duplicateWarning.similar_complaints.map((complaint) => (
                  <li key={complaint.id} className="flex justify-between items-center">
                    <span className="font-medium">#{complaint.id}: {complaint.title}</span>
                    <span className="text-xs px-2 py-1 bg-yellow-200 rounded-full font-bold">
                      {(complaint.similarity_score * 100).toFixed(0)}% تشابه
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-sm mt-3 font-medium">يمكنك المتابعة في التقديم إذا كانت شكواك مختلفة</p>
            </div>
          </div>
        </motion.div>
      )}

      {checkingDuplicates && (
        <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 px-4 py-3 rounded-xl">
          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">جاري التحقق من الشكاوى المشابهة...</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          الجهة الحكومية <span className="text-red-500">*</span>
        </label>
        <select
          {...register('government_entity', { required: 'اختيار الجهة مطلوب' })}
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-lg font-medium hover:border-gray-300 bg-white cursor-pointer"
        >
          <option value="">اختر الجهة الحكومية</option>
          {governmentEntities.map((entity, index) => (
            <option key={index} value={entity.name}>
              {entity.name}
            </option>
          ))}
        </select>
        {errors.government_entity && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center gap-1"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            {errors.government_entity.message}
          </motion.p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          تصنيف الشكوى <span className="text-red-500">*</span>
        </label>
        <select
          {...register('category_id', { required: 'تصنيف الشكوى مطلوب', valueAsNumber: true })}
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-lg font-medium hover:border-gray-300 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!selectedEntity}
        >
          <option value="">
            {selectedEntity ? 'اختر التصنيف المناسب' : 'الرجاء اختيار الجهة أولاً'}
          </option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_ar}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center gap-1"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            {errors.category_id.message}
          </motion.p>
        )}
        {!selectedEntity && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
            <InformationCircleIcon className="w-4 h-4 text-gray-400" />
            <span>يجب اختيار الجهة الحكومية أولاً لعرض التصنيفات المتاحة</span>
          </p>
        )}
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <InformationCircleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">معلومات إضافية</h3>
            <p className="text-sm text-gray-600 mt-1">معلومات تساعد في معالجة شكواك بشكل أفضل</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2.5">
            <CalendarIcon className="w-4 h-4 inline-block mr-1.5 text-gray-600" />
            متى حدثت المشكلة؟
          </label>
          <input
            type="date"
            {...register('problem_occurred_date')}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2.5">
            <CalendarIcon className="w-4 h-4 inline-block mr-1.5 text-gray-600" />
            متى علمت بالمشكلة؟
          </label>
          <input
            type="date"
            {...register('problem_discovered_date')}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-gray-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          ما نوع الطلب الذي تقدمت به؟
        </label>
        <input
          type="text"
          {...register('request_type')}
          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300"
          placeholder="مثال: طلب رخصة تجارية"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          هل قدمت الجهة عرضاً لحل الشكوى؟
        </label>
        <select
          {...register('entity_offered_solution')}
          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-gray-300 bg-white cursor-pointer"
        >
          <option value="">اختر</option>
          <option value="نعم">نعم</option>
          <option value="لا">لا</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          ما الذي سيضع الأمور في نصابها الصحيح من وجهة نظرك؟
        </label>
        <textarea
          {...register('desired_resolution')}
          rows="4"
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300 resize-none"
          placeholder="اكتب الحل المقترح من وجهة نظرك..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2.5">
            هل تقدمت بشكوى سابقة؟
          </label>
          <select
            {...register('previous_complaint_filed')}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-gray-300 bg-white cursor-pointer"
          >
            <option value="">اختر</option>
            <option value="نعم">نعم</option>
            <option value="لا">لا</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2.5">
            هل هناك إجراءات قانونية جارية؟
          </label>
          <select
            {...register('legal_proceedings')}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-gray-300 bg-white cursor-pointer"
          >
            <option value="">اختر</option>
            <option value="نعم">نعم</option>
            <option value="لا">لا</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <PaperClipIcon className="w-4 h-4 inline-block mr-1.5 text-gray-600" />
          إرفاق ملفات (اختياري)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary-500 transition-all duration-300">
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <PaperClipIcon className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-sm font-medium text-gray-700 mb-1">
              اضغط لاختيار الملفات أو اسحبها هنا
            </span>
            <span className="text-xs text-gray-500">
              PDF, DOC, DOCX, JPG, PNG, GIF (حتى 10 MB لكل ملف)
            </span>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">
              الملفات المختارة ({selectedFiles.length}):
            </p>
            {selectedFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <PaperClipIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleFileRemove(index)}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors ml-2"
                >
                  <XMarkIcon className="w-5 h-5 text-red-500" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">المعلومات الشخصية</h3>
            <p className="text-sm text-gray-600 mt-1">بيانات مقدم الشكوى</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2.5">
          هل تشكو نيابة عن <span className="text-red-500">*</span>
        </label>
        <select
          {...register('complaining_on_behalf_of', { required: 'هذا الحقل مطلوب' })}
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-gray-300 bg-white cursor-pointer text-lg font-medium"
        >
          <option value="">اختر</option>
          <option value="نفسك">نفسك</option>
          <option value="مشروع / مؤسسة">مشروع / مؤسسة</option>
          <option value="شخص آخر">شخص آخر</option>
        </select>
        {errors.complaining_on_behalf_of && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center gap-1"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            {errors.complaining_on_behalf_of.message}
          </motion.p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2.5">
            اسم الشخص/المشروع (إن وجد)
          </label>
          <input
            type="text"
            {...register('behalf_person_name')}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300"
            placeholder="أدخل الاسم"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2.5">
            علاقتك بالشخص (إن وجد)
          </label>
          <input
            type="text"
            {...register('behalf_person_relation')}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300"
            placeholder="مثال: وكيل قانوني"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <ResponsivePageShell 
      title="تقديم شكوى جديدة"
      subtitle="املأ النموذج أدناه لتقديم شكواك"
      maxWidth="5xl"
    >
      <div className="card-premium p-6 md:p-10 shadow-2xl border-2 border-primary-100">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <p className="font-bold">{error}</p>
            </div>
            
            {uploadErrors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-sm font-semibold mb-2">الملفات التي فشل رفعها:</p>
                <ul className="text-sm space-y-1 mb-4">
                  {uploadErrors.map((fileError, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span>{fileError.name} - {fileError.error}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={retryFailedUploads}
                    disabled={uploadingFiles}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                    {uploadingFiles ? 'جارِ المحاولة...' : 'إعادة المحاولة'}
                  </button>
                  <button
                    type="button"
                    onClick={proceedWithoutFiles}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    المتابعة بدون الملفات
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {renderStepIndicator()}

        <form onSubmit={handleSubmit(onSubmit, onSubmitError)} className="space-y-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={handlePreviousStep}
              className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-bold text-lg hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <ArrowRightIcon className="w-5 h-5" />
              {currentStep > 1 ? 'السابق' : 'إلغاء'}
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 hover:from-primary-700 hover:via-primary-600 hover:to-primary-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-glow-green transition-all duration-300 hover:scale-105 active:scale-95"
              >
                التالي
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري التقديم...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-6 h-6" />
                    تقديم الشكوى
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </ResponsivePageShell>
  );
}

export default ComplaintForm;
