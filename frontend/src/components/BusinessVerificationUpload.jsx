import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Alert, CTAButton } from './ui';
import { Upload, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

function BusinessVerificationUpload() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  const { data: verificationStatus, isLoading } = useQuery({
    queryKey: ['businessVerification'],
    queryFn: async () => {
      const response = await api.get('/users/business-verification/status');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileData) => {
      const formData = new FormData();
      formData.append('document', fileData);
      const response = await api.post('/users/business-verification/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('تم رفع المستند بنجاح! سيتم مراجعته قريباً. / Document uploaded successfully! It will be reviewed soon.');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['businessVerification'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'فشل رفع المستند. حاول مرة أخرى. / Failed to upload document. Please try again.');
    }
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('نوع الملف غير مدعوم. استخدم PDF أو JPG أو PNG / Unsupported file type. Use PDF, JPG, or PNG');
      return;
    }

    if (selectedFile.size > maxSize) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 5MB / File too large. Maximum 5MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('يرجى اختيار ملف أولاً / Please select a file first');
      return;
    }
    uploadMutation.mutate(file);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'pending':
      default:
        return Clock;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'verified':
        return {
          ar: 'تم التحقق من حسابك بنجاح',
          en: 'Your account has been verified successfully'
        };
      case 'rejected':
        return {
          ar: 'تم رفض مستنداتك. يرجى رفع مستندات صحيحة',
          en: 'Your documents were rejected. Please upload valid documents'
        };
      case 'pending':
      default:
        return {
          ar: 'مستنداتك قيد المراجعة',
          en: 'Your documents are under review'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">التحقق من الأعمال / Business Verification</h3>
          <p className="text-sm text-gray-600">رفع مستندات التحقق / Upload verification documents</p>
        </div>
      </div>

      {verificationStatus && (
        <div className="mb-6">
          <Alert
            type={getStatusColor(verificationStatus.status)}
            message={
              <div>
                <p className="font-semibold mb-1">{getStatusMessage(verificationStatus.status).ar}</p>
                <p className="text-sm">{getStatusMessage(verificationStatus.status).en}</p>
              </div>
            }
          />
        </div>
      )}

      {(!verificationStatus || verificationStatus.status === 'rejected') && (
        <>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadMutation.isPending}
            />
            <div className="pointer-events-none">
              <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-primary-600' : 'text-gray-400'}`} />
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {file ? file.name : 'اسحب وأفلت المستند هنا أو انقر للاختيار'}
              </p>
              <p className="text-xs text-gray-500 mb-1">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop document here or click to select'}
              </p>
              <p className="text-xs text-gray-500 mb-1">الصيغ المدعومة: PDF, JPG, PNG / Supported: PDF, JPG, PNG</p>
              <p className="text-xs text-gray-500">الحجم الأقصى: 5MB / Max size: 5MB</p>
            </div>
          </div>

          {file && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <CTAButton
                onClick={handleUpload}
                variant="primary"
                size="md"
                fullWidth
                loading={uploadMutation.isPending}
                disabled={uploadMutation.isPending}
                leftIcon={<Upload className="w-5 h-5" />}
              >
                {uploadMutation.isPending ? 'جاري الرفع... / Uploading...' : 'رفع المستند / Upload Document'}
              </CTAButton>
            </motion.div>
          )}
        </>
      )}

      {verificationStatus?.status === 'verified' && (
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-green-900 mb-2">✓ تم التحقق / Verified</h4>
          <p className="text-sm text-green-700">حسابك موثق ومعتمد / Your account is verified and approved</p>
        </div>
      )}

      {verificationStatus?.status === 'pending' && (
        <div className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200 text-center">
          <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4 animate-pulse" />
          <h4 className="text-xl font-bold text-yellow-900 mb-2">⏳ قيد المراجعة / Under Review</h4>
          <p className="text-sm text-yellow-700">سيتم مراجعة مستنداتك قريباً / Your documents will be reviewed soon</p>
        </div>
      )}
    </motion.div>
  );
}

export default BusinessVerificationUpload;
