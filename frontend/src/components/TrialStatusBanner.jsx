import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';

const TrialStatusBanner = () => {
  const [trialStatus, setTrialStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const response = await api.get('/trial/status');
      setTrialStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch trial status:', error);
      setLoading(false);
    }
  };

  if (loading || !trialStatus || !trialStatus.has_trial) {
    return null;
  }

  if (trialStatus.has_active_subscription) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  const daysRemaining = trialStatus.days_remaining || 0;
  const isExpired = !trialStatus.is_active;
  const isExpiringSoon = daysRemaining <= 5 && daysRemaining > 0;

  if (isExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
          </div>
          <div className="mr-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              انتهت الفترة التجريبية المجانية
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                لقد انتهت فترتك التجريبية المجانية البالغة 20 يومًا. للمتابعة في استخدام الخدمة وتقديم الشكاوى، يرجى الاشتراك في أحد باقاتنا.
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/subscription')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                اشترك الآن
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="mr-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              تنتهي فترتك التجريبية قريبًا
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                لديك {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'} متبقية في فترتك التجريبية المجانية. اشترك الآن لمواصلة الوصول غير المحدود.
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/subscription')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                عرض باقات الاشتراك
              </button>
            </div>
          </div>
          <div className="mr-auto flex-shrink-0">
            <button
              onClick={() => setDismissed(true)}
              className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
            >
              <span className="sr-only">إغلاق</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <InformationCircleIcon className="h-6 w-6 text-blue-400" />
        </div>
        <div className="mr-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            الفترة التجريبية المجانية
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              لديك {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'} متبقية في فترتك التجريبية المجانية البالغة 20 يومًا.
            </p>
          </div>
        </div>
        <div className="mr-auto flex-shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex rounded-md bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
          >
            <span className="sr-only">إغلاق</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialStatusBanner;
