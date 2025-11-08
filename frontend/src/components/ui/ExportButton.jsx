import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const ExportButton = ({ endpoint, filename, params = {}, label, format = 'excel' }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(endpoint, {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const ext = format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf';
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('exports.success') || 'تم التصدير بنجاح');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('exports.error') || 'فشل التصدير. يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        loading ? 'cursor-wait' : ''
      }`}
    >
      <ArrowDownTrayIcon className={`w-5 h-5 ${loading ? 'animate-bounce' : ''}`} />
      <span className="font-medium">
        {loading ? (t('exports.exporting') || 'جاري التصدير...') : (label || t('exports.export') || 'تصدير')}
      </span>
    </motion.button>
  );
};

export default ExportButton;
